// ─── 聊天页 ───
// 顶栏、话题侧边栏、记忆控制台（更多菜单）、消息列表、输入栏

import { useState } from "react";
import { SHARE_INTENTS } from "../constants";

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
}) {
  // ── 局部 UI 状态 ──
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attachView, setAttachView] = useState(null); // null | "grid" | "notes" | "intent"
  const [selectedNote, setSelectedNote] = useState(null);

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
            {msg.isDiaryShare ? (
              <div className="diary-share-card">
                <div className="diary-share-header">
                  <span className="diary-share-icon">📓</span>
                  <span className="diary-share-label">
                    晚声分享了一篇手札{msg.noteTitle ? `「${msg.noteTitle}」` : ""}
                  </span>
                </div>
                <div className="diary-share-date">{msg.diaryDate || ""}</div>
                <div className="diary-share-divider" />
                <div className="diary-share-text">{msg.content}</div>
                <div className="diary-share-footer">✨ 分享给了你</div>
              </div>
            ) : (
              <div
                className={`bubble ${msg.role === "bot" ? "bot" : "user"}`}
              >
                {msg.content}
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
                {msg.role === "user" && !msg.isDiaryShare && (
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
              { emoji: "💗",  label: "帮我记住",    active: false },
              { emoji: "🌙",  label: "记下这一刻",  active: false },
              { emoji: "✨",  label: "整理一下我们", active: false },
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
          <div className="config-panel" style={{ maxHeight: "72vh", display: "flex", flexDirection: "column" }}>
            <div className="config-header">
              <div className="config-title"><span>📓</span>选一篇手札</div>
              <button className="config-close" onClick={() => setAttachView(null)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {(noteEntries || []).filter((e) => !e.isDraft).length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-faint)", fontSize: 13, lineHeight: 2 }}>
                  还没有手札<br/>先去写一篇吧
                </div>
              ) : (
                (noteEntries || []).filter((e) => !e.isDraft).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => { setSelectedNote(note); setAttachView("intent"); }}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      borderBottom: "1px solid rgba(196,166,184,.1)",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(196,166,184,.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#5a4a6a", marginBottom: 3 }}>
                      {note.title || note.text.slice(0, 24) || "无标题"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>
                      {note.text.slice(0, 60)}{note.text.length > 60 ? "…" : ""}
                    </div>
                  </div>
                ))
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
              <div className="config-title"><span>💌</span>怎么分享给 ta？</div>
              <button className="config-close" onClick={() => { setAttachView(null); setSelectedNote(null); }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, padding: "0 2px" }}>
              「{selectedNote.title || selectedNote.text.slice(0, 20) || "手札"}」
            </div>
            {SHARE_INTENTS.map((intent) => (
              <button
                key={intent.value}
                onClick={() => {
                  shareNoteToChat(activeChar?.id, selectedNote, intent.value);
                  setAttachView(null);
                  setSelectedNote(null);
                }}
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 8,
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.2)",
                  borderRadius: 12, cursor: "pointer",
                  fontFamily: "var(--font-main)", fontSize: 13, color: "#5a4a6a",
                  textAlign: "left", transition: "all .15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(232,196,196,.12)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,.7)"}
              >
                {intent.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
