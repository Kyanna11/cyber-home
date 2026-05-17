// ─── 聊天页 ───
// 顶栏、话题侧边栏、记忆控制台（更多菜单）、消息列表、输入栏

import { useState } from "react";
import { NOTE_TYPES, TREASURE_TYPES } from "../constants";
import { EVENT_TYPES } from "./TimelinePage";

// ════════════════════════════════════════════
// ── 记下这一刻 · 聊天→时间线面板 ──
// ════════════════════════════════════════════
function ChatToTimelinePanel({ messages, activeChar, activeCharId, onSave, onNavigateTimeline, onClose }) {
  const charName = activeChar?.name || "ta";

  // 取最近 8 条有内容的 user/bot 消息
  const recentMsgs = messages
    .filter((m) => (m.role === "user" || m.role === "bot") && (m.content || "").trim())
    .slice(-8);

  // 默认标题：最后一条用户消息前 20 字，或 fallback
  const lastUserMsg = [...recentMsgs].reverse().find((m) => m.role === "user");
  const defaultTitle = lastUserMsg
    ? (lastUserMsg.content.slice(0, 20) + (lastUserMsg.content.length > 20 ? "…" : ""))
    : `和 ${charName} 的一刻`;

  // 默认描述：简短预览
  const previewLines = recentMsgs.slice(-3).map((m) => {
    const who = m.role === "user" ? "我" : charName;
    const text = (m.content || "").slice(0, 40);
    return `${who}：${text}${m.content.length > 40 ? "…" : ""}`;
  }).join("\n");
  const defaultDesc = `来自聊天记录的一段重要时刻\n\n${previewLines}`;

  // occurredAt：最后一条消息的时间戳，或今天
  const lastMsg = recentMsgs[recentMsgs.length - 1];
  const occurredAtDefault = (() => {
    const ts = lastMsg?.timestamp || lastMsg?.createdAt;
    if (ts) return new Date(ts).toISOString().split("T")[0];
    return new Date().toISOString().split("T")[0];
  })();

  const [form, setForm] = useState({
    title:       defaultTitle,
    description: defaultDesc,
    eventType:   "sweet",
    occurredAt:  occurredAtDefault,
    emotion:     "",
    importance:  3,
    pinned:      false,
    note:        "",
  });
  const [done, setDone] = useState(false);

  const canConfirm = activeCharId && form.title.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    // sourceIds：用消息 id 或 fallback
    const sourceIds = recentMsgs.map((m, i) =>
      m.id || `chat-${activeCharId}-idx${i}-${m.timestamp || m.createdAt || Date.now()}`
    );
    onSave({
      ...form,
      title:    form.title.trim(),
      loverId:  activeCharId,
      source:   "chat",
      sourceIds,
    });
    setDone(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(74,69,96,.38)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.2)",
      }}>

        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>🌙 记下这一刻</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {done ? (
          /* ── 成功态 ── */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px 48px", gap: 18, textAlign: "center" }}>
            <div style={{ fontSize: 36 }}>🌿</div>
            <div style={{ fontSize: 15, color: "#5a4a6a", fontWeight: 500, lineHeight: 1.7 }}>
              已经把这一刻放进回忆里了。
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.8, maxWidth: 260 }}>
              它会静静等在你们的时间线上。
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8, width: "100%", maxWidth: 320 }}>
              <button
                onClick={() => { onNavigateTimeline?.(); onClose(); }}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12,
                  background: "rgba(120,100,160,.85)", border: "none",
                  color: "white", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-main)", letterSpacing: 0.5,
                }}
              >去关系时间线看看</button>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12,
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                  color: "#7a6a8e", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >留在聊天</button>
            </div>
          </div>
        ) : (
          /* ── 表单 ── */
          <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 32px" }}>

            {/* 说明 */}
            <div style={{
              fontSize: 12, color: "#7a6a8e", lineHeight: 1.75,
              marginBottom: 14,
              padding: "9px 12px", borderRadius: 10,
              background: "rgba(122,173,204,.07)", border: "1px solid rgba(122,173,204,.18)",
            }}>
              把这一小段聊天放进关系时间线，作为一个以后可以回看的瞬间。
            </div>

            {/* 消息预览 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>
                最近 {recentMsgs.length} 条消息
              </div>
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,.55)", border: "1px solid rgba(196,166,184,.2)",
                maxHeight: 140, overflow: "auto",
              }}>
                {recentMsgs.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "flex-start",
                    padding: "5px 0",
                    borderBottom: i < recentMsgs.length - 1 ? "1px solid rgba(196,166,184,.08)" : "none",
                  }}>
                    <span style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 7, flexShrink: 0, marginTop: 2,
                      background: m.role === "user" ? "rgba(120,100,160,.1)" : "rgba(196,166,184,.12)",
                      color: m.role === "user" ? "#5a4a8a" : "#7a6a8e",
                    }}>{m.role === "user" ? "我" : charName}</span>
                    <span style={{ fontSize: 11, color: "var(--text-mid)", lineHeight: 1.6 }}>
                      {(m.content || "").length > 56 ? m.content.slice(0, 56) + "…" : m.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 时间线标题 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>这一刻的名字</div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "8px 10px", borderRadius: 10, fontSize: 13, color: "#5a4a6a",
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                  fontFamily: "var(--font-main)", outline: "none",
                }}
              />
            </div>

            {/* 描述 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>描述（可编辑）</div>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{
                  width: "100%", boxSizing: "border-box",
                  minHeight: 72, padding: "8px 10px", borderRadius: 10, fontSize: 12,
                  color: "#5a4a6a", background: "rgba(255,255,255,.7)",
                  border: "1px solid rgba(196,166,184,.3)",
                  fontFamily: "var(--font-main)", outline: "none",
                  resize: "none", lineHeight: 1.75,
                }}
              />
            </div>

            {/* 事件类型 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>事件类型</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EVENT_TYPES.map((et) => (
                  <button key={et.key} onClick={() => setForm((f) => ({ ...f, eventType: et.key }))}
                    style={{
                      padding: "5px 11px", borderRadius: 20, fontSize: 11,
                      cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                      background: form.eventType === et.key ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.65)",
                      border: `1px solid ${form.eventType === et.key ? "rgba(120,100,160,.45)" : "rgba(196,166,184,.22)"}`,
                      color: form.eventType === et.key ? "#5a4a8a" : "#7a6a8e",
                    }}
                  >{et.emoji} {et.label}</button>
                ))}
              </div>
            </div>

            {/* 发生时间 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>发生时间</div>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                style={{
                  padding: "7px 10px", borderRadius: 10, fontSize: 13, color: "#5a4a6a",
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                  fontFamily: "var(--font-main)", outline: "none",
                }}
              />
            </div>

            {/* 情绪标签 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>情绪标签（可选）</div>
              <input
                type="text"
                placeholder="比如：温柔、感动、想念…"
                value={form.emotion}
                onChange={(e) => setForm((f) => ({ ...f, emotion: e.target.value }))}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "7px 10px", borderRadius: 10, fontSize: 13, color: "#5a4a6a",
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                  fontFamily: "var(--font-main)", outline: "none",
                }}
              />
            </div>

            {/* 重要程度 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>
                重要程度
                <span style={{ marginLeft: 8, fontWeight: 500, color: "#5a4a6a" }}>{form.importance}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => setForm((f) => ({ ...f, importance: v }))}
                    style={{
                      width: 36, height: 36, borderRadius: 10, fontSize: 16,
                      cursor: "pointer", border: "none", transition: "all .15s",
                      background: form.importance >= v ? "rgba(120,100,160,.18)" : "rgba(255,255,255,.6)",
                      color: form.importance >= v ? "#7a5aaa" : "#c0b0d0",
                    }}
                  >★</button>
                ))}
              </div>
            </div>

            {/* 置顶 */}
            <div
              onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 14 }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                border: `1.5px solid ${form.pinned ? "rgba(120,100,160,.6)" : "rgba(196,166,184,.4)"}`,
                background: form.pinned ? "rgba(120,100,160,.14)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#7a5aaa", flexShrink: 0, transition: "all .15s",
              }}>
                {form.pinned ? "📌" : ""}
              </div>
              <span style={{ fontSize: 12, color: form.pinned ? "#5a4a8a" : "#9a8aac" }}>置顶这条记忆</span>
            </div>

            {/* 备注 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>备注（可选）</div>
              <textarea
                placeholder="关于这一刻想多说的…"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                style={{
                  width: "100%", boxSizing: "border-box",
                  minHeight: 56, padding: "8px 10px", borderRadius: 10, fontSize: 12,
                  color: "#7a6a8e", background: "rgba(255,255,255,.6)",
                  border: "1px solid rgba(196,166,184,.25)",
                  fontFamily: "var(--font-main)", outline: "none",
                  resize: "none", lineHeight: 1.7,
                }}
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              style={{
                width: "100%", padding: "12px", borderRadius: 14,
                background: canConfirm ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
                border: "none", color: canConfirm ? "white" : "#9a8aac",
                fontSize: 14, cursor: canConfirm ? "pointer" : "default",
                fontFamily: "var(--font-main)", letterSpacing: 1, transition: "all .2s",
              }}
            >🌙 放进回忆里</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage({
  // 角色
  activeChar,
  activeCharId,
  // 导航
  navigateTo,
  openMemoryPalace,
  setEditingChar,
  setEditSection,
  // 状态判断
  isConfigReady,
  getActiveModel,
  // 话题
  showThreadSidebar,
  setShowThreadSidebar,
  activeThreadId,
  getCharThreads,
  createThread,
  switchThread,
  deleteThread,
  // 记忆控制台
  showMemoryControl,
  setShowMemoryControl,
  memInjection,
  handleSaveMemInjection,
  getCurrentPromptTokens,
  // 唤醒预览
  openWakePreview,
  // 消息编辑
  editingMsgIdx,
  setEditingMsgIdx,
  editingMsgText,
  setEditingMsgText,
  handleEditAndResend,
  // 对话管理
  handleExportChat,
  showClearConfirm,
  setShowClearConfirm,
  handleClearChat,
  // 手札分享
  noteEntries,
  shareNoteToChat,
  sendNoteFromChat,
  // 回复模式
  replyMode,
  setReplyMode,
  // 消息区
  messages,
  isSending,
  isTyping,
  messagesEndRef,
  handleRegenerate,
  // 输入栏
  inputText,
  setInputText,
  handleSend,
  // 宝库
  onSaveTreasure,
  // 声声档案草稿
  onGenerateProfileDraftFromChat,
  profileDraftGenerating,
  // 关系时间线
  onAddChatToTimeline,
  onOpenTimeline,
  // 关系沉淀
  onGenerateSettlementFromChat,
  settlementGenerating,
}) {
  // ── 局部 UI 状态 ──
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attachView, setAttachView] = useState(null); // null | "grid" | "notes" | "intent"
  const [selectedNote, setSelectedNote] = useState(null);
  // 宝库收藏
  const [treasureTarget, setTreasureTarget] = useState(null); // 要收藏的 msg
  const [treasureForm, setTreasureForm] = useState(null);     // 收藏表单
  const [treasureSaved, setTreasureSaved] = useState(false);  // 短暂成功提示

  // 聊天页专用意图标签（用"你"，更自然）
  const CHAT_INTENTS = [
    { value: "read",     label: "只是给你看看",   hint: "" },
    { value: "comfort",  label: "想被安慰",       hint: "陪伴 & 共情" },
    { value: "reply",    label: "想听你说说",     hint: "分享你的感受" },
    { value: "organize", label: "希望你帮我整理", hint: "温柔梳理思路" },
    { value: "remember", label: "希望你以后记得", hint: "放心里就好" },
  ];
  const CHAT_INTENTS_MAP = Object.fromEntries(CHAT_INTENTS.map((i) => [i.value, i.label]));

  // 根据 type value 取类型信息
  const getNoteType = (type) =>
    NOTE_TYPES.find((t) => t.value === type) || { label: "手札", emoji: "📓" };

  // 打开宝库收藏弹窗
  const openTreasure = (msg) => {
    setTreasureTarget(msg);
    setTreasureForm({
      title:     msg.content.replace(/\s+/g, "").slice(0, 20),
      type:      msg.replyMode === "long" ? "essay" : "quote",
      tagsRaw:   "",
      note:      "",
      important: false,
    });
  };

  // 日期简短显示
  const fmtNoteDate = (entry) => {
    if (entry.createdAt > 0) {
      const d = new Date(entry.createdAt);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return entry.date || "";
  };

  return (
    <div className="chat-scene">
      {/* ── 顶栏 ── */}
      <div className="chat-top-bar">

        {/* 对话列表入口（原汉堡菜单，改为更明确的图标+文字） */}
        <button
          className="thread-menu-btn"
          onClick={() => setShowThreadSidebar(true)}
          title="话题列表"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>💬</span>
          <span style={{ fontSize: 8, letterSpacing: 0.5, color: "var(--text-faint)" }}>对话</span>
        </button>

        {/* 回房间 */}
        <button className="back-btn" onClick={() => navigateTo("bedroom")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          回房间
        </button>

        {/* 中间信息区 */}
        <div className="chat-title-area">
          <div className="chat-companion-name">{activeChar?.name || "赛博伴侣"}</div>
          <div className={`chat-status ${isConfigReady() ? "online" : "offline"}`}>
            {isConfigReady() ? "在线" : "未连接"}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 300, color: "var(--text-faint)",
            letterSpacing: 0.5, opacity: 0.7,
            maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            margin: "1px auto 0",
          }}>
            {isConfigReady() ? `${getActiveModel(activeChar?.modelOverride)}` : ""}
          </div>
        </div>

        {/* ① 入住档案 */}
        <button
          className="gear-btn"
          onClick={() => {
            if (activeChar) {
              setEditingChar(JSON.parse(JSON.stringify(activeChar)));
              setEditSection("basic");
              navigateTo("profileEdit");
            }
          }}
          title="入住档案"
          style={{ marginRight: 2 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 12h6" /><path d="M9 16h6" />
          </svg>
        </button>

        {/* ② 记忆宫殿 */}
        <button
          className="gear-btn"
          onClick={() => activeChar && openMemoryPalace(activeChar.id, "chat")}
          title="记忆宫殿"
          style={{ marginRight: 2 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M3 21h18" /><path d="M5 21V10l7-5 7 5v11" /><path d="M9 21v-6h6v6" />
          </svg>
        </button>

        {/* ③ 更多 ⋯ */}
        <div style={{ position: "relative" }}>
          <button
            className="gear-btn"
            onClick={() => setShowMoreMenu((v) => !v)}
            title="更多"
            style={{ fontSize: 18, letterSpacing: 1, paddingBottom: 2 }}
          >
            ···
          </button>

          {showMoreMenu && (
            <>
              {/* 点外面关闭 */}
              <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setShowMoreMenu(false)} />
              {/* 下拉菜单 */}
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "rgba(255,255,255,.96)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                borderRadius: 14, border: "1px solid rgba(196,166,184,.25)",
                boxShadow: "0 8px 28px rgba(74,69,96,.14)",
                minWidth: 164, zIndex: 10, overflow: "hidden",
              }}>
                {[
                  { label: "唤醒预览",  emoji: "🌙", action: () => { activeChar && openWakePreview?.(activeChar.id); setShowMoreMenu(false); } },
                  { label: "记忆注入",  emoji: "🧠", action: () => { setShowMemoryControl(true); setShowMoreMenu(false); } },
                  null, // divider
                  { label: "API 设置",  emoji: "⚙️", action: () => { navigateTo("config"); setShowMoreMenu(false); } },
                  { label: "导出聊天",  emoji: "📥", action: () => { handleExportChat(); setShowMoreMenu(false); } },
                  { label: "清空聊天",  emoji: "🗑", action: () => { setShowClearConfirm(true); setShowMoreMenu(false); }, danger: true },
                ].map((item, i) =>
                  item === null ? (
                    <div key={i} style={{ height: 1, background: "rgba(196,166,184,.18)", margin: "2px 0" }} />
                  ) : (
                    <button
                      key={i}
                      onClick={item.action}
                      style={{
                        width: "100%", padding: "11px 16px",
                        display: "flex", alignItems: "center", gap: 10,
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "var(--font-main)", fontSize: 13,
                        color: item.danger ? "#9a5050" : "#5a4a6a",
                        textAlign: "left",
                      }}
                    >
                      <span>{item.emoji}</span>{item.label}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 话题侧边栏 ── */}
      {showThreadSidebar && (
        <div
          className="thread-sidebar-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowThreadSidebar(false);
          }}
        >
          <div className="thread-sidebar">
            <div className="thread-sidebar-header">
              <div className="thread-sidebar-title">💬 话题列表</div>
              <button
                className="config-close"
                onClick={() => setShowThreadSidebar(false)}
              >
                ✕
              </button>
            </div>
            <button
              className="thread-new-btn"
              onClick={() => {
                createThread(activeCharId);
                setShowThreadSidebar(false);
              }}
            >
              + 开启新话题
            </button>
            <div className="thread-list">
              {getCharThreads(activeCharId).map((thread) => {
                const lastMsg = thread.messages[thread.messages.length - 1];
                const preview = lastMsg
                  ? (lastMsg.role === "user" ? "你：" : "") + lastMsg.content
                  : "空对话";
                return (
                  <div
                    key={thread.id}
                    className={`thread-item ${activeThreadId === thread.id ? "active" : ""}`}
                    onClick={() => switchThread(thread.id)}
                  >
                    <div className="thread-item-info">
                      <div className="thread-item-name">
                        {activeThreadId === thread.id ? "💬 " : "🗨️ "}
                        {thread.name}
                      </div>
                      <div className="thread-item-preview">
                        {preview.length > 25
                          ? preview.slice(0, 25) + "…"
                          : preview}
                      </div>
                    </div>
                    {getCharThreads(activeCharId).length > 1 && (
                      <button
                        className="thread-item-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`删除话题「${thread.name}」？`)) {
                            deleteThread(activeCharId, thread.id);
                          }
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 记忆控制台 ── */}
      {showMemoryControl && (
        <div
          className="config-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMemoryControl(false);
          }}
        >
          <div className="config-panel">
            <div className="config-header">
              <div className="config-title">
                <span>🧠</span>记忆控制台
              </div>
              <button
                className="config-close"
                onClick={() => setShowMemoryControl(false)}
              >
                ✕
              </button>
            </div>

            {/* 分层注入开关 */}
            <div className="config-section-title">
              <span>🎚️</span>注入层级控制
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginBottom: 14,
                lineHeight: 1.7,
              }}
            >
              控制 system prompt 中包含哪些层级的信息。关闭不需要的层可以节省
              token。
            </div>
            {[
              {
                key: "L0_soul",
                label: "L0 灵魂层",
                desc: "角色名称与基本关系",
                emoji: "👤",
                disabled: true,
              },
              {
                key: "L1_personality",
                label: "L1 性格层",
                desc: "档案、大五人格、性格认知、三观",
                emoji: "🪞",
              },
              {
                key: "L2_memory",
                label: "L2 记忆层",
                desc: "事实 / 情绪 / 觉察记忆",
                emoji: "💭",
              },
              {
                key: "L3_summary",
                label: "L3 沉淀层",
                desc: "定期总结与反思",
                emoji: "📖",
              },
            ].map((layer) => (
              <div
                key={layer.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: memInjection.layers[layer.key]
                    ? "rgba(232,196,196,.08)"
                    : "rgba(155,149,181,.03)",
                  border: `1px solid ${memInjection.layers[layer.key] ? "rgba(232,196,196,.2)" : "rgba(155,149,181,.08)"}`,
                  marginBottom: 8,
                  transition: "all .25s",
                }}
              >
                <span style={{ fontSize: 18 }}>{layer.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      letterSpacing: 1,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      marginTop: 2,
                    }}
                  >
                    {layer.desc}
                  </div>
                </div>
                <div
                  onClick={() => {
                    if (layer.disabled) return;
                    const newLayers = {
                      ...memInjection.layers,
                      [layer.key]: !memInjection.layers[layer.key],
                    };
                    handleSaveMemInjection({
                      ...memInjection,
                      layers: newLayers,
                    });
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    cursor: layer.disabled ? "default" : "pointer",
                    background: memInjection.layers[layer.key]
                      ? "linear-gradient(135deg,var(--blush),var(--accent-wisteria))"
                      : "rgba(155,149,181,.15)",
                    position: "relative",
                    transition: "background .3s",
                    flexShrink: 0,
                    opacity: layer.disabled ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: "white",
                      position: "absolute",
                      top: 2,
                      left: memInjection.layers[layer.key] ? 22 : 2,
                      transition: "left .25s",
                      boxShadow: "0 1px 4px rgba(0,0,0,.15)",
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="config-divider" />

            {/* 记忆注入条数 */}
            <div className="config-section-title">
              <span>📊</span>记忆注入数量
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginBottom: 14,
                lineHeight: 1.7,
              }}
            >
              每种类型最多注入几条记忆到 prompt 中（按热度排序取 top N）
            </div>
            {[
              { key: "fact", label: "📋 事实记忆", max: 15, color: "#9b95b5" },
              { key: "emotion", label: "💗 情绪记忆", max: 10, color: "#e8c4c4" },
              { key: "insight", label: "✨ 觉察记忆", max: 10, color: "#99a8c7" },
            ].map((item) => (
              <div key={item.key} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--accent-dusk)",
                      minWidth: 24,
                      textAlign: "right",
                    }}
                  >
                    {memInjection.limits[item.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={item.max}
                  step="1"
                  value={memInjection.limits[item.key]}
                  onChange={(e) => {
                    const newLimits = {
                      ...memInjection.limits,
                      [item.key]: Number(e.target.value),
                    };
                    handleSaveMemInjection({
                      ...memInjection,
                      limits: newLimits,
                    });
                  }}
                  className="ocean-slider"
                  style={{
                    width: "100%",
                    background: `linear-gradient(to right, ${item.color}55 0%, ${item.color}88 ${(memInjection.limits[item.key] / item.max) * 100}%, rgba(155,149,181,.1) ${(memInjection.limits[item.key] / item.max) * 100}%)`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--text-faint)",
                    marginTop: 4,
                  }}
                >
                  <span>不注入</span>
                  <span>{item.max} 条</span>
                </div>
              </div>
            ))}

            <div className="config-divider" />

            {/* Token 预估 */}
            <div className="config-section-title">
              <span>📏</span>Token 预估
            </div>
            {(() => {
              const tokens = getCurrentPromptTokens();
              const percent = Math.min((tokens / 4000) * 100, 100);
              const level =
                tokens > 3000
                  ? "#c48585"
                  : tokens > 2000
                    ? "#d4a574"
                    : "#7dab8a";
              return (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-mid)" }}>
                      当前 System Prompt
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: level,
                      }}
                    >
                      ~{tokens}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(155,149,181,.1)",
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${level}88, ${level})`,
                        transition: "width .4s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      lineHeight: 1.6,
                    }}
                  >
                    {tokens < 1500 && "💚 很轻量，留给对话的空间很充裕"}
                    {tokens >= 1500 &&
                      tokens < 3000 &&
                      "💛 适中，大部分模型都能处理"}
                    {tokens >= 3000 &&
                      "🧡 偏重了，可以考虑关闭一些层级或减少注入条数"}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── 编辑消息弹窗 ── */}
      {editingMsgIdx !== null && (
        <div
          className="config-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingMsgIdx(null);
              setEditingMsgText("");
            }
          }}
        >
          <div className="config-panel" style={{ maxWidth: 360 }}>
            <div className="config-header">
              <div className="config-title">
                <span>✏️</span>编辑消息
              </div>
              <button
                className="config-close"
                onClick={() => {
                  setEditingMsgIdx(null);
                  setEditingMsgText("");
                }}
              >
                ✕
              </button>
            </div>
            <textarea
              className="field-textarea"
              value={editingMsgText}
              onChange={(e) => setEditingMsgText(e.target.value)}
              style={{ minHeight: 100 }}
              autoFocus
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              修改后会删掉这条之后的所有消息，然后重新发送给 AI
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setEditingMsgIdx(null);
                  setEditingMsgText("");
                }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!editingMsgText.trim() || isSending}
                onClick={() => handleEditAndResend(editingMsgIdx, editingMsgText)}
              >
                重新发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 清空确认弹窗 ── */}
      {showClearConfirm && (
        <div className="config-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowClearConfirm(false); }}>
          <div className="config-panel" style={{ maxWidth: 320 }}>
            <div style={{ padding: "4px 0 16px", fontSize: 14, color: "#5a4a6a", textAlign: "center", lineHeight: 1.7 }}>
              确定要清空所有对话记录吗？
            </div>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setShowClearConfirm(false)}>再想想</button>
              <button className="confirm-do" onClick={handleClearChat}>确认清空</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 消息区 ── */}
      <div className="messages-area">
        <div className="time-divider">—— 今天 ——</div>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg-wrap ${msg.role === "bot" ? "is-bot" : "is-user"}`}
          >
            {msg.thought && (
              <div className="thought-bubble">
                <span className="thought-label">💭 心声</span>
                {msg.thought}
              </div>
            )}

            {/* 手札分享卡片 */}
            {(msg.isDiaryShare || msg.isNoteShare) ? (
              <div className="diary-share-card">
                <div className="diary-share-header">
                  <span className="diary-share-icon">
                    {NOTE_TYPES.find((t) => t.value === msg.noteType)?.emoji || "📓"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span className="diary-share-label">
                      {msg.noteTitle ? `「${msg.noteTitle}」` : "分享了一篇手札"}
                    </span>
                    {msg.noteType && (
                      <span style={{
                        fontSize: 10, color: "var(--text-faint)",
                        marginLeft: 6, verticalAlign: "middle",
                        background: "rgba(196,166,184,.15)",
                        padding: "1px 6px", borderRadius: 8,
                      }}>
                        {NOTE_TYPES.find((t) => t.value === msg.noteType)?.label || msg.noteType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="diary-share-date" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{msg.diaryDate || ""}</span>
                  {msg.shareIntent && msg.shareIntent !== "read" && (
                    <span style={{
                      fontSize: 10, color: "var(--accent-dusk)",
                      background: "rgba(196,166,184,.12)",
                      padding: "1px 7px", borderRadius: 8,
                    }}>
                      {CHAT_INTENTS_MAP[msg.shareIntent] || msg.shareIntent}
                    </span>
                  )}
                </div>
                <div className="diary-share-divider" />
                <div className="diary-share-text">
                  {msg.content.length > 200 ? msg.content.slice(0, 200) + "…" : msg.content}
                </div>
              </div>
            ) : (
              <div
                className={`bubble ${msg.role === "bot" ? "bot" : "user"}`}
                style={msg.replyMode === "long" ? {
                  whiteSpace: "pre-wrap",
                  maxWidth: "88%",
                  lineHeight: 1.75,
                } : undefined}
              >
                {msg.replyMode === "long" && msg.role === "bot" && (
                  <span style={{
                    display: "inline-block",
                    fontSize: 9,
                    color: "var(--text-faint)",
                    background: "rgba(196,166,184,.18)",
                    padding: "1px 6px",
                    borderRadius: 8,
                    marginBottom: 6,
                    letterSpacing: 0.5,
                    verticalAlign: "top",
                  }}>长文</span>
                )}
                {msg.replyMode === "long" && msg.role === "bot"
                  ? <div style={{ marginTop: msg.content.trim() ? 2 : 0 }}>{msg.content}</div>
                  : msg.content}
              </div>
            )}

            {msg.time && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <div className="msg-time" style={{ margin: 0 }}>
                  {msg.time}
                </div>

                {/* 用户消息：编辑按钮 */}
                {msg.role === "user" && !msg.isDiaryShare && !msg.isNoteShare && (
                  <button
                    onClick={() => {
                      setEditingMsgIdx(i);
                      setEditingMsgText(msg.content);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--text-faint)",
                      padding: "2px 4px",
                      borderRadius: 4,
                      transition: "color .2s",
                      fontFamily: "var(--font-main)",
                    }}
                    title="编辑并重发"
                  >
                    ✏️
                  </button>
                )}

                {/* bot 消息：珍藏这段 */}
                {msg.role === "bot" && onSaveTreasure && (
                  <button
                    onClick={() => openTreasure(msg)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--text-faint)",
                      padding: "2px 4px",
                      borderRadius: 4,
                      transition: "color .2s",
                      fontFamily: "var(--font-main)",
                    }}
                    title="珍藏这段"
                  >💎</button>
                )}

                {/* 最后一条 bot 消息：重新生成 */}
                {msg.role === "bot" &&
                  i === messages.length - 1 &&
                  !isSending && (
                    <button
                      onClick={handleRegenerate}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        color: "var(--text-faint)",
                        padding: "2px 4px",
                        borderRadius: 4,
                        transition: "color .2s",
                        fontFamily: "var(--font-main)",
                      }}
                      title="重新生成"
                    >
                      🔄
                    </button>
                  )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="typing-wrap">
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ⬇️ 回到最新消息 */}
      <button
        onClick={() =>
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
        style={{
          position: "absolute",
          right: 16,
          bottom: 90,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,.8)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(232,196,196,.2)",
          boxShadow: "0 2px 12px rgba(74,69,96,.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          transition: "all .25s",
          fontSize: 16,
          color: "var(--accent-dusk)",
        }}
        title="回到最新"
      >
        ↓
      </button>

      {/* ── 加号面板（WeChat 风格）── */}
      {attachView === "grid" && (
        <div style={{
          background: "rgba(248,244,252,.97)",
          borderTop: "1px solid rgba(196,166,184,.18)",
          padding: "20px 24px 24px",
          flexShrink: 0,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px 0" }}>
            {[
              { emoji: "📓", label: "分享手札",    active: true,  action: () => setAttachView("notes") },
              { emoji: "🖼",  label: "添加图片",    active: false },
              { emoji: "📎",  label: "添加文件",    active: false },
              { emoji: "💗",  label: "帮我记住",    active: true,  action: () => setAttachView("memorize") },
              { emoji: "🌙",  label: "记下这一刻",  sub: "留作回忆",    active: true,  action: () => setAttachView("timeline") },
              { emoji: "✨",  label: "整理一下我们", sub: "更新关系理解", active: true,  action: () => setAttachView("settle") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.active ? item.action : undefined}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: "none", border: "none",
                  cursor: item.active ? "pointer" : "default",
                  fontFamily: "var(--font-main)",
                  opacity: item.active ? 1 : 0.32,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "rgba(255,255,255,.9)",
                  border: "1px solid rgba(196,166,184,.2)",
                  boxShadow: item.active ? "0 2px 8px rgba(74,69,96,.08)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                }}>
                  {item.emoji}
                </div>
                <div style={{
                  fontSize: 11, color: item.active ? "#5a4a6a" : "#9a8aac",
                  letterSpacing: 0.5, lineHeight: 1.2, textAlign: "center",
                }}>
                  {item.label}
                  {item.sub && <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 1, opacity: 0.85 }}>{item.sub}</div>}
                  {!item.active && <div style={{ fontSize: 9, opacity: 0.7 }}>稍后开放</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 手札选择 ── */}
      {attachView === "notes" && (
        <div className="config-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAttachView("grid"); }}>
          <div className="config-panel" style={{ maxHeight: "76vh", display: "flex", flexDirection: "column" }}>
            <div className="config-header">
              <div className="config-title"><span>📓</span>选一篇手札</div>
              <button className="config-close" onClick={() => setAttachView(null)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {(noteEntries || []).filter((e) => !e.isDraft).length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-faint)", fontSize: 13, lineHeight: 2.2 }}>
                  还没有手札<br />
                  <span style={{ fontSize: 11, opacity: .7 }}>可以先去书桌写一篇</span>
                </div>
              ) : (
                (noteEntries || [])
                  .filter((e) => !e.isDraft)
                  .map((note) => {
                    const nt = getNoteType(note.type);
                    const alreadyShared = (note.sharedWith || []).includes(activeCharId);
                    return (
                      <div
                        key={note.id}
                        onClick={() => { setSelectedNote(note); setAttachView("intent"); }}
                        style={{
                          padding: "12px 16px", cursor: "pointer",
                          borderBottom: "1px solid rgba(196,166,184,.1)",
                          transition: "background .15s",
                          opacity: alreadyShared ? 0.65 : 1,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(196,166,184,.08)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = ""}
                      >
                        {/* 标题行 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 14 }}>{nt.emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#5a4a6a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {note.title || note.text.slice(0, 20) || "无标题"}
                          </span>
                          {alreadyShared && (
                            <span style={{ fontSize: 10, color: "var(--text-faint)", background: "rgba(155,149,181,.12)", padding: "1px 6px", borderRadius: 8, flexShrink: 0 }}>
                              已分享
                            </span>
                          )}
                        </div>
                        {/* 类型 + 日期行 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--text-faint)", background: "rgba(196,166,184,.12)", padding: "1px 7px", borderRadius: 8 }}>
                            {nt.label}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{fmtNoteDate(note)}</span>
                        </div>
                        {/* 正文预览 */}
                        <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {note.text || "（无内容）"}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 分享意图选择 ── */}
      {attachView === "intent" && selectedNote && (
        <div className="config-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAttachView("notes"); }}>
          <div className="config-panel">
            <div className="config-header">
              <div className="config-title"><span>💌</span>
                怎么分享给{activeChar?.name ? ` ${activeChar.name}` : " ta"}？
              </div>
              <button className="config-close" onClick={() => { setAttachView(null); setSelectedNote(null); }}>✕</button>
            </div>

            {/* 被分享的手札预览 */}
            <div style={{
              background: "rgba(248,244,252,.8)",
              border: "1px solid rgba(196,166,184,.2)",
              borderRadius: 12, padding: "10px 12px", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{getNoteType(selectedNote.type).emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#5a4a6a" }}>
                  {selectedNote.title || selectedNote.text.slice(0, 20) || "无标题"}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-faint)", background: "rgba(196,166,184,.15)", padding: "1px 6px", borderRadius: 8 }}>
                  {getNoteType(selectedNote.type).label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {selectedNote.text || "（无内容）"}
              </div>
            </div>

            {/* 意图选择 */}
            {CHAT_INTENTS.map((intent) => (
              <button
                key={intent.value}
                onClick={() => {
                  sendNoteFromChat(selectedNote, intent.value);
                  setAttachView(null);
                  setSelectedNote(null);
                }}
                style={{
                  width: "100%", padding: "11px 14px", marginBottom: 8,
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.2)",
                  borderRadius: 12, cursor: "pointer",
                  fontFamily: "var(--font-main)", fontSize: 13, color: "#5a4a6a",
                  textAlign: "left", transition: "all .15s",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(232,196,196,.12)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,.7)"}
              >
                <span>{intent.label}</span>
                {intent.hint && (
                  <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 8 }}>{intent.hint}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 帮我记住确认面板 ── */}
      {attachView === "memorize" && (
        <div
          className="config-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setAttachView("grid"); }}
        >
          <div className="config-panel" style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="config-header">
              <div className="config-title"><span>💗</span>帮我记住</div>
              <button className="config-close" onClick={() => setAttachView(null)}>✕</button>
            </div>

            {/* 说明 + 消息预览 */}
            <div style={{ flex: 1, overflow: "auto", padding: "4px 16px 8px" }}>
              <div style={{
                fontSize: 12, color: "#7a6a8e", lineHeight: 1.75,
                margin: "8px 0 14px",
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(196,166,184,.08)", border: "1px solid rgba(196,166,184,.15)",
              }}>
                这会整理最近聊天中<strong>关于你的信息</strong>，生成声声档案草稿。
                草稿不会自动写入正式档案，生成后请自行核对、选择性采纳。
              </div>

              {/* 消息列表 */}
              {(() => {
                const recentMsgs = messages
                  .filter((m) => m.role === "user" || m.role === "bot")
                  .slice(-10);
                return (
                  <>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 0.5, marginBottom: 8 }}>
                      将从以下 {recentMsgs.length} 条消息中提炼
                    </div>
                    <div>
                      {recentMsgs.map((msg, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 8, alignItems: "flex-start",
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(196,166,184,.08)",
                        }}>
                          <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            flexShrink: 0, marginTop: 2,
                            background: msg.role === "user" ? "rgba(120,100,160,.1)" : "rgba(196,166,184,.12)",
                            color: msg.role === "user" ? "#5a4a8a" : "#7a6a8e",
                          }}>
                            {msg.role === "user" ? "你" : (activeChar?.name || "ta")}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.65 }}>
                            {msg.content.length > 64
                              ? msg.content.slice(0, 64) + "…"
                              : msg.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 按钮区 */}
            <div style={{
              padding: "12px 16px 16px", flexShrink: 0,
              display: "flex", gap: 10,
              borderTop: "1px solid rgba(196,166,184,.12)",
            }}>
              <button
                onClick={() => setAttachView("grid")}
                style={{
                  flex: 1, padding: "10px", borderRadius: 12,
                  background: "transparent", border: "1px solid rgba(196,166,184,.3)",
                  fontSize: 13, color: "#9a8aac", cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >取消</button>
              <button
                onClick={() => {
                  const recentMsgs = messages
                    .filter((m) => m.role === "user" || m.role === "bot")
                    .slice(-10);
                  onGenerateProfileDraftFromChat?.(recentMsgs).finally(() => setAttachView(null));
                }}
                disabled={profileDraftGenerating}
                style={{
                  flex: 2, padding: "10px", borderRadius: 12,
                  background: profileDraftGenerating ? "rgba(196,166,184,.3)" : "rgba(120,100,160,.85)",
                  border: "none",
                  color: profileDraftGenerating ? "#9a8aac" : "white",
                  fontSize: 13,
                  cursor: profileDraftGenerating ? "default" : "pointer",
                  fontFamily: "var(--font-main)", letterSpacing: 0.5, transition: "all .2s",
                }}
              >
                {profileDraftGenerating ? "生成中…" : "生成草稿"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 记下这一刻面板 ── */}
      {attachView === "timeline" && (
        <ChatToTimelinePanel
          messages={messages}
          activeChar={activeChar}
          activeCharId={activeCharId}
          onSave={(fields) => {
            onAddChatToTimeline?.(fields);
          }}
          onNavigateTimeline={() => {
            setAttachView(null);
            onOpenTimeline?.(activeCharId);
          }}
          onClose={() => setAttachView(null)}
        />
      )}

      {/* ── 整理一下我们 · 关系沉淀确认面板 ── */}
      {attachView === "settle" && (() => {
        const recentMsgs = messages
          .filter((m) => m.role === "user" || m.role === "bot")
          .slice(-20);
        const charName = activeChar?.name || "ta";
        return (
          <div
            className="config-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setAttachView("grid"); }}
          >
            <div className="config-panel" style={{ maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
              <div className="config-header">
                <div className="config-title"><span>✨</span>整理一下我们</div>
                <button className="config-close" onClick={() => setAttachView(null)}>✕</button>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "4px 16px 8px" }}>
                {/* 说明 */}
                <div style={{
                  fontSize: 12, color: "#7a6a8e", lineHeight: 1.75,
                  margin: "8px 0 14px",
                  padding: "10px 12px", borderRadius: 10,
                  background: "rgba(196,166,184,.08)", border: "1px solid rgba(196,166,184,.15)",
                }}>
                  从最近聊天里整理你们的关系变化，生成待确认的<strong>关系沉淀草稿</strong>。
                  不会自动写入档案或 prompt，需要你逐节确认后才生效。
                  可能影响唤醒摘要、不可遗忘事项等内容。
                </div>

                {/* 消息预览 */}
                {recentMsgs.length === 0 ? (
                  <div style={{ padding: "16px 0", color: "var(--text-faint)", fontSize: 13, textAlign: "center" }}>
                    还没有聊天记录
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 0.5, marginBottom: 8 }}>
                      最近 {recentMsgs.length} 条与 {charName} 的聊天
                    </div>
                    <div>
                      {recentMsgs.map((msg, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 8, alignItems: "flex-start",
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(196,166,184,.08)",
                        }}>
                          <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            flexShrink: 0, marginTop: 2,
                            background: msg.role === "user" ? "rgba(120,100,160,.1)" : "rgba(196,166,184,.12)",
                            color: msg.role === "user" ? "#5a4a8a" : "#7a6a8e",
                          }}>
                            {msg.role === "user" ? "你" : charName}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.65 }}>
                            {(msg.content || "").length > 64
                              ? msg.content.slice(0, 64) + "…"
                              : msg.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 按钮区 */}
              <div style={{
                padding: "12px 16px 16px", flexShrink: 0,
                display: "flex", gap: 10,
                borderTop: "1px solid rgba(196,166,184,.12)",
              }}>
                <button
                  onClick={() => setAttachView("grid")}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 12,
                    background: "transparent", border: "1px solid rgba(196,166,184,.3)",
                    fontSize: 13, color: "#9a8aac", cursor: "pointer",
                    fontFamily: "var(--font-main)",
                  }}
                >取消</button>
                <button
                  onClick={() => {
                    onGenerateSettlementFromChat?.(recentMsgs)
                      .then(() => setAttachView(null))
                      .catch(() => setAttachView(null));
                  }}
                  disabled={settlementGenerating || recentMsgs.length < 4}
                  style={{
                    flex: 2, padding: "10px", borderRadius: 12,
                    background: (settlementGenerating || recentMsgs.length < 4)
                      ? "rgba(196,166,184,.3)"
                      : "rgba(120,100,160,.85)",
                    border: "none",
                    color: (settlementGenerating || recentMsgs.length < 4) ? "#9a8aac" : "white",
                    fontSize: 13,
                    cursor: (settlementGenerating || recentMsgs.length < 4) ? "default" : "pointer",
                    fontFamily: "var(--font-main)", letterSpacing: 0.5, transition: "all .2s",
                  }}
                >
                  {settlementGenerating ? "生成中…" : recentMsgs.length < 4 ? "聊天太少" : "生成草稿"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 回复模式切换 ── */}
      <div style={{
        display: "flex", justifyContent: "center",
        padding: "5px 16px 2px",
        background: "rgba(248,244,252,.95)",
        borderTop: attachView === "grid" ? "none" : "1px solid rgba(196,166,184,.1)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "inline-flex",
          background: "rgba(196,166,184,.15)",
          borderRadius: 20,
          padding: 2,
        }}>
          {[
            { value: "chat", label: "一句一句说" },
            { value: "long", label: "写成一篇" },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setReplyMode(m.value)}
              style={{
                padding: "3px 13px",
                borderRadius: 18,
                border: "none",
                background: replyMode === m.value ? "rgba(255,255,255,.92)" : "transparent",
                color: replyMode === m.value ? "#5a4a6a" : "#9a8aac",
                fontSize: 11,
                fontWeight: replyMode === m.value ? 500 : 400,
                cursor: "pointer",
                fontFamily: "var(--font-main)",
                letterSpacing: 0.5,
                transition: "all .2s",
                boxShadow: replyMode === m.value ? "0 1px 4px rgba(74,69,96,.1)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 输入栏 ── */}
      <div className="input-bar">

        <button
          onClick={() => setAttachView((v) => v ? null : "grid")}
          title="更多工具"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: attachView ? "var(--accent-dusk)" : "var(--text-faint)",
            padding: "6px 6px 6px 2px",
            lineHeight: 1, transition: "color .2s, transform .2s",
            transform: attachView === "grid" ? "rotate(45deg)" : "none",
            flexShrink: 0,
          }}
        >+</button>

        <textarea
          className="input-field"
          placeholder={`想对${activeChar?.name || "ta"}说点什么…`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.ctrlKey || e.metaKey) &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height =
              Math.min(e.target.scrollHeight, 120) + "px";
          }}
          style={{
            resize: "none",
            overflow: "hidden",
            lineHeight: "1.5",
            minHeight: "42px",
            maxHeight: "120px",
          }}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* ── 珍藏到宝库弹窗 ── */}
      {treasureTarget && treasureForm && (
        <div
          className="config-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) { setTreasureTarget(null); setTreasureForm(null); } }}
        >
          <div className="config-panel" style={{ maxWidth: 380 }}>
            <div className="config-header">
              <div className="config-title"><span>💎</span>珍藏这段</div>
              <button className="config-close" onClick={() => { setTreasureTarget(null); setTreasureForm(null); }}>✕</button>
            </div>

            {/* 内容预览 */}
            <div style={{
              padding: "10px 12px", borderRadius: 10, marginBottom: 14,
              background: "rgba(248,244,252,.9)", border: "1px solid rgba(196,166,184,.2)",
              fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7,
              maxHeight: 90, overflow: "hidden",
              display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
              whiteSpace: "pre-wrap",
            }}>
              {treasureTarget.content}
            </div>

            {/* 标题 */}
            <div className="config-field" style={{ marginBottom: 12 }}>
              <label className="config-label">标题</label>
              <input
                className="config-input"
                type="text"
                placeholder="留空则取正文前 20 字"
                value={treasureForm.title}
                onChange={(e) => setTreasureForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* 类型 */}
            <div className="config-field" style={{ marginBottom: 12 }}>
              <label className="config-label">类型</label>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {TREASURE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTreasureForm((f) => ({ ...f, type: t.value }))}
                    style={{
                      padding: "3px 10px", borderRadius: 16, fontSize: 11,
                      cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .12s",
                      background: treasureForm.type === t.value ? "rgba(120,100,160,.85)" : "rgba(255,255,255,.7)",
                      color: treasureForm.type === t.value ? "white" : "#7a6a8e",
                      border: `1px solid ${treasureForm.type === t.value ? "transparent" : "rgba(196,166,184,.3)"}`,
                    }}
                  >{t.emoji} {t.label}</button>
                ))}
              </div>
            </div>

            {/* 标签 */}
            <div className="config-field" style={{ marginBottom: 12 }}>
              <label className="config-label">标签（可选）</label>
              <input
                className="config-input"
                type="text"
                placeholder="空格分隔"
                value={treasureForm.tagsRaw}
                onChange={(e) => setTreasureForm((f) => ({ ...f, tagsRaw: e.target.value }))}
              />
            </div>

            {/* 备注 */}
            <div className="config-field" style={{ marginBottom: 12 }}>
              <label className="config-label">备注（可选）</label>
              <input
                className="config-input"
                type="text"
                placeholder="记下当时的感受…"
                value={treasureForm.note}
                onChange={(e) => setTreasureForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>

            {/* 重要标记 */}
            <div
              onClick={() => setTreasureForm((f) => ({ ...f, important: !f.important }))}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 18 }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${treasureForm.important ? "#c08030" : "rgba(196,166,184,.4)"}`,
                background: treasureForm.important ? "rgba(200,140,60,.15)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#c08030", transition: "all .15s",
              }}>
                {treasureForm.important ? "★" : ""}
              </div>
              <span style={{ fontSize: 12, color: treasureForm.important ? "#8a6020" : "#9a8aac" }}>
                标记为重要宝物
              </span>
            </div>

            {/* 确认 */}
            {treasureSaved ? (
              <div style={{ textAlign: "center", padding: "10px 0", fontSize: 13, color: "#4a8a4a" }}>✓ 已存进宝库</div>
            ) : (
              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={() => {
                  const now = Date.now();
                  const title = treasureForm.title.trim() || treasureTarget.content.replace(/\s+/g, "").slice(0, 20);
                  onSaveTreasure({
                    id: `treasure-${now}-${Math.random().toString(36).slice(2, 6)}`,
                    title,
                    content:   treasureTarget.content,   // 完整原文，不截断
                    type:      treasureForm.type,
                    tags:      treasureForm.tagsRaw.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
                    note:      treasureForm.note.trim(),
                    important: treasureForm.important,
                    sourceCharId:    activeCharId || null,
                    sourceCharName:  activeChar?.name || "",
                    sourceThreadId:  activeThreadId || null,
                    sourceMessageId: null,
                    createdAt: now,
                    updatedAt: now,
                    canUseForMemory: false,
                  });
                  setTreasureSaved(true);
                  setTimeout(() => {
                    setTreasureTarget(null);
                    setTreasureForm(null);
                    setTreasureSaved(false);
                  }, 900);
                }}
              >
                存进宝库
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
