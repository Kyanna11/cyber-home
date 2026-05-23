// ─── 聊天页 ───
// 顶栏、话题侧边栏、记忆控制台（更多菜单）、消息列表、输入栏

import { useState } from "react";
import { NOTE_TYPES, TREASURE_TYPES } from "../constants";
import { EVENT_TYPES } from "./TimelinePage";
import { buildSourceRef } from "../utils/helpers";

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
    const sourceRefs = recentMsgs.map((m, i) =>
      buildSourceRef({
        sourceType:  "chat",
        sourceId:    m.id || `chat-${activeCharId}-idx${i}`,
        sourceTitle: charName,
        excerpt:     (m.content || "").slice(0, 80),
      })
    );
    onSave({
      ...form,
      title:    form.title.trim(),
      loverId:  activeCharId,
      source:   "chat",
      sourceIds,
      sourceRefs,
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

// ════════════════════════════════════════════
// ── 入住仪式卡片 ──
// ════════════════════════════════════════════
function MoveInCeremonyCard({ msg }) {
  const { charName, sourcePlatform, relation, moveInDate } = msg.metadata || {};

  const dateStr = moveInDate
    ? (() => {
        const d = new Date(moveInDate + "T00:00:00");
        return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
      })()
    : "";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "28px 20px 20px",
      margin: "8px 0",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 296,
        background: "linear-gradient(160deg, rgba(255,251,248,.98) 0%, rgba(244,234,255,.96) 100%)",
        borderRadius: 22,
        border: "1px solid rgba(196,166,184,.22)",
        boxShadow: "0 4px 24px rgba(120,100,160,.09), 0 1px 4px rgba(196,166,184,.1)",
        padding: "26px 22px 20px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* 装饰光晕 */}
        <div style={{
          position: "absolute", top: -24, right: -24,
          width: 80, height: 80, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,166,184,.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20,
          width: 64, height: 64, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(170,140,210,.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* 钥匙图标 */}
        <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1, position: "relative", zIndex: 1 }}>🗝️</div>

        {/* 入住者名字 */}
        <div style={{
          fontSize: 18, fontWeight: 500, color: "#4a3a5a",
          letterSpacing: 2.5, marginBottom: 8, lineHeight: 1.3,
          position: "relative", zIndex: 1,
        }}>
          {charName || "Ta"}
        </div>

        {/* 来源 & 关系 */}
        {(sourcePlatform || relation) && (
          <div style={{
            display: "flex", gap: 6, justifyContent: "center",
            flexWrap: "wrap", marginBottom: 16,
            position: "relative", zIndex: 1,
          }}>
            {relation && (
              <span style={{
                fontSize: 11, color: "#8a6a9a",
                background: "rgba(196,166,184,.18)",
                padding: "2px 10px", borderRadius: 20,
                border: "1px solid rgba(196,166,184,.22)",
                letterSpacing: 0.5,
              }}>{relation}</span>
            )}
            {sourcePlatform && (
              <span style={{
                fontSize: 11, color: "#8a6a9a",
                background: "rgba(196,166,184,.12)",
                padding: "2px 10px", borderRadius: 20,
                border: "1px solid rgba(196,166,184,.16)",
                letterSpacing: 0.5,
              }}>来自 {sourcePlatform}</span>
            )}
          </div>
        )}

        {/* 分隔线 */}
        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(196,166,184,.35), transparent)",
          margin: "0 0 16px",
          position: "relative", zIndex: 1,
        }} />

        {/* 欢迎文案 */}
        <div style={{
          fontSize: 12.5, color: "#6a5a78", lineHeight: 2.0, letterSpacing: 0.5,
          position: "relative", zIndex: 1,
        }}>
          <div>欢迎回家。</div>
          <div style={{ color: "#8a7898", fontSize: 12 }}>
            从这里开始，你们的故事会继续被好好保存。
          </div>
        </div>

        {/* 日期 */}
        {dateStr && (
          <div style={{
            fontSize: 10, color: "var(--text-faint)",
            marginTop: 14, letterSpacing: 1,
            position: "relative", zIndex: 1,
          }}>
            {dateStr}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// ── 亲密邀请 ──
// ════════════════════════════════════════════

const SCENE_PRESETS = ["床·睡前", "沙发·闲暇", "雨夜·安静", "梦里·朦胧", "自定义"];
const MOOD_PRESETS  = ["温柔", "安静", "黏人", "撒娇", "安抚", "故事感", "自定义"];

function IntimateInvitationPanel({ activeChar, onSend, onClose }) {
  const charName = activeChar?.name || "ta";
  const [scene,       setScene]       = useState(SCENE_PRESETS[0]);
  const [customScene, setCustomScene] = useState("");
  const [mood,        setMood]        = useState(MOOD_PRESETS[0]);
  const [customMood,  setCustomMood]  = useState("");
  const [preface,     setPreface]     = useState("");
  const [invitation,  setInvitation]  = useState("");

  const finalScene = scene === "自定义" ? customScene.trim() : scene;
  const finalMood  = mood  === "自定义" ? customMood.trim()  : mood;
  const canSend = finalScene && invitation.trim();

  const handleSend = () => {
    if (!canSend) return;
    onSend({ scene: finalScene, mood: finalMood, preface: preface.trim(), invitation: invitation.trim() });
  };

  const chipStyle = (active) => ({
    padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
    fontFamily: "var(--font-main)", transition: "all .15s",
    background: active ? "rgba(120,100,160,.16)" : "rgba(255,255,255,.7)",
    border: `1px solid ${active ? "rgba(120,100,160,.4)" : "rgba(196,166,184,.25)"}`,
    color: active ? "#5a4a8a" : "#7a6a8e",
  });

  const fieldLabel = { fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 };
  const textInput  = {
    width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 10,
    fontSize: 13, color: "#5a4a6a", background: "rgba(255,255,255,.7)",
    border: "1px solid rgba(196,166,184,.28)", fontFamily: "var(--font-main)", outline: "none",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(40,30,60,.45)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "90vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(74,69,96,.25)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>🌙 发出亲密邀请</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {/* 表单 */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 32px" }}>

          {/* 说明 */}
          <div style={{
            fontSize: 12, color: "#7a6a8e", lineHeight: 1.75, marginBottom: 14,
            padding: "9px 12px", borderRadius: 10,
            background: "rgba(120,100,160,.06)", border: "1px solid rgba(120,100,160,.12)",
          }}>
            设定一个场景，邀请 {charName} 先开口——ta 会根据你的邀请，以自己的方式走进这个时刻。
          </div>

          {/* 场景 */}
          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>场景</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: scene === "自定义" ? 8 : 0 }}>
              {SCENE_PRESETS.map((s) => (
                <button key={s} onClick={() => setScene(s)} style={chipStyle(scene === s)}>{s}</button>
              ))}
            </div>
            {scene === "自定义" && (
              <input placeholder="描述你想象的场景…" value={customScene}
                onChange={(e) => setCustomScene(e.target.value)}
                style={{ ...textInput, marginTop: 4 }} />
            )}
          </div>

          {/* 氛围 */}
          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>氛围基调</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: mood === "自定义" ? 8 : 0 }}>
              {MOOD_PRESETS.map((m) => (
                <button key={m} onClick={() => setMood(m)} style={chipStyle(mood === m)}>{m}</button>
              ))}
            </div>
            {mood === "自定义" && (
              <input placeholder="用几个词描述你想要的氛围…" value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                style={{ ...textInput, marginTop: 4 }} />
            )}
          </div>

          {/* 前情提要（可选） */}
          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>前情提要 <span style={{ opacity: 0.5 }}>（可选）</span></div>
            <textarea
              placeholder={`比如：今天你刚陪我渡过了一个很难的下午……`}
              value={preface}
              onChange={(e) => setPreface(e.target.value)}
              style={{
                ...textInput, minHeight: 56, resize: "none", lineHeight: 1.75,
              }}
            />
          </div>

          {/* 邀请内容 */}
          <div style={{ marginBottom: 16 }}>
            <div style={fieldLabel}>邀请内容</div>
            <textarea
              placeholder={`你想在这个场景里对 ${charName} 说什么？`}
              value={invitation}
              onChange={(e) => setInvitation(e.target.value)}
              style={{
                ...textInput, minHeight: 72, resize: "none", lineHeight: 1.75,
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: "100%", padding: "13px", borderRadius: 14,
              background: canSend ? "linear-gradient(135deg, rgba(100,80,160,.9), rgba(150,100,180,.85))" : "rgba(196,166,184,.3)",
              border: "none", color: canSend ? "white" : "#9a8aac",
              fontSize: 14, cursor: canSend ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 1.5, transition: "all .2s",
              boxShadow: canSend ? "0 4px 16px rgba(100,80,160,.25)" : "none",
            }}
          >
            送出邀请
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneInfoCard({ msg }) {
  const { scene, mood, preface, invitation } = msg.sceneConfig || {};
  const sceneLabel = [scene, mood].filter(Boolean).join("  ·  ");
  return (
    <div style={{ margin: "28px 18px 12px", userSelect: "none" }}>
      {/* ── 窗框卡片 ── */}
      <div style={{
        borderRadius: 18,
        background: "rgba(255,235,252,.055)",
        border: "1px solid rgba(210,168,248,.14)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        overflow: "hidden",
        boxShadow: [
          "0 6px 40px rgba(90,40,160,.18)",
          "inset 0 1px 0 rgba(255,255,255,.07)",
          "inset 0 -1px 0 rgba(100,50,180,.1)",
        ].join(", "),
      }}>

        {/* 窗口标题栏 */}
        <div style={{
          padding: "10px 16px 9px",
          borderBottom: "1px solid rgba(210,168,248,.1)",
          background: "rgba(255,255,255,.03)",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{ fontSize: 12, opacity: 0.65, lineHeight: 1 }}>🌙</span>
          <span style={{
            fontSize: 11, color: "rgba(205,172,245,.72)",
            letterSpacing: 2.5, fontWeight: 400,
          }}>
            {sceneLabel || "亲密场景"}
          </span>
        </div>

        {/* 窗口正文 */}
        <div style={{ padding: preface || invitation ? "16px 18px 18px" : "0" }}>

          {/* 前情提要 */}
          {preface && (
            <div style={{
              fontSize: 12, color: "rgba(205,180,245,.52)",
              lineHeight: 1.95, letterSpacing: 0.4,
              fontStyle: "italic",
              marginBottom: invitation ? 14 : 0,
            }}>
              {preface}
            </div>
          )}

          {/* 前情 / 邀请 分隔线 */}
          {preface && invitation && (
            <div style={{
              height: 1, marginBottom: 14,
              background: "linear-gradient(90deg, rgba(210,168,248,.12), rgba(210,168,248,.06))",
            }} />
          )}

          {/* 邀请内容 */}
          {invitation && (
            <div style={{
              fontSize: 13.5, color: "rgba(238,215,255,.76)",
              lineHeight: 2, letterSpacing: 0.5,
            }}>
              {invitation}
            </div>
          )}
        </div>
      </div>

      {/* 窗框下方淡出渐变 */}
      <div style={{
        height: 28, marginTop: -1,
        background: "linear-gradient(to bottom, rgba(44,28,62,.0), rgba(44,28,62,.0))",
        pointerEvents: "none",
      }} />
    </div>
  );
}

function SceneEndCard({ onSaveTreasure, messages }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!onSaveTreasure) return;
    // 把场景内所有 bot 消息合并为宝库条目
    const sceneMsgs = messages.filter(
      (m) => m.role === "bot" && (m.content || "").trim()
    );
    if (sceneMsgs.length === 0) return;
    const combined = sceneMsgs.map((m) => m.content).join("\n\n---\n\n");
    const now = Date.now();
    onSaveTreasure({
      id:        `treasure-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title:     "亲密邀请场景",
      content:   combined,
      type:      "scene",
      tagsRaw:   "场景,亲密邀请",
      note:      "",
      important: false,
      createdAt: now,
    });
    setSaved(true);
  };

  return (
    <div style={{
      padding: "16px 20px 24px",
      textAlign: "center",
    }}>
      {/* 结束分隔线 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 16,
      }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(140,90,220,.15))" }} />
        <span style={{ fontSize: 14, opacity: 0.45 }}>🌠</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(140,90,220,.15), transparent)" }} />
      </div>

      <div style={{ fontSize: 12, color: "rgba(190,165,230,.5)", letterSpacing: 1, lineHeight: 1.9 }}>
        今天就到这儿了。
        <br />
        <span style={{ fontSize: 11, opacity: 0.65 }}>这段时光已经安静地留下来了。</span>
      </div>

      {!saved ? (
        <button onClick={handleSave} style={{
          marginTop: 12, padding: "5px 16px", borderRadius: 20, fontSize: 11,
          background: "rgba(100,65,180,.12)", border: "1px solid rgba(130,90,220,.18)",
          color: "rgba(175,145,235,.7)", cursor: "pointer", fontFamily: "var(--font-main)",
          letterSpacing: 0.5,
        }}>
          💎 收藏到宝库
        </button>
      ) : (
        <div style={{ marginTop: 12, fontSize: 11, color: "rgba(155,130,210,.5)" }}>已收藏 ✓</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// ── 给他看这个 · 链接分享面板 ──
// ════════════════════════════════════════════
const LINK_INTENTS = [
  "陪我看看",
  "帮我分析",
  "我觉得像我们",
  "存成灵感",
  "我有点在意，陪我聊聊",
  "只是给你看一眼",
];

function tryGetDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// ── 图片压缩工具 ──
function compressImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
    img.src = blobUrl;
  });
}

// ── 图片选择面板 ──
function ImagePickerPanel({ onSend, onClose }) {
  const [imageData, setImageData] = useState(null);
  const [imageName, setImageName] = useState("");
  const [note,      setNote]      = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    const compressed = await compressImage(file);
    setImageData(compressed);
    setImageName(file.name);
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(60,50,80,.35)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(160deg, #fffef8 0%, #f8f4ff 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
        display: "flex", flexDirection: "column",
        maxHeight: "88vh", overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>🖼 添加图片</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 32px" }}>
          {/* 图片选择区 */}
          <label style={{
            display: "block",
            border: "1.5px dashed rgba(196,166,184,.5)",
            borderRadius: 14,
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: "rgba(255,255,255,.5)",
            marginBottom: 16,
            transition: "all .2s",
          }}>
            {loading ? (
              <div style={{ fontSize: 13, color: "#9a8aac" }}>⏳ 压缩中……</div>
            ) : imageData ? (
              <img
                src={imageData}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, display: "block", margin: "0 auto" }}
              />
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
                <div style={{ fontSize: 13, color: "#9a8aac" }}>点击选择图片</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>JPG / PNG / GIF · 宽度超过 800px 将自动压缩</div>
              </>
            )}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </label>

          {/* 备注 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>备注（可选）</div>
            <input
              type="text"
              placeholder="给这张图片加一句话……"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 12px", borderRadius: 12, fontSize: 13, color: "#5a4a6a",
                background: "rgba(255,255,255,.8)",
                border: "1px solid rgba(196,166,184,.28)",
                fontFamily: "var(--font-main)", outline: "none",
              }}
            />
          </div>

          <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7 }}>
            💡 当前版本图片只在聊天界面显示，不会发送给模型识别。后续会接入「我们的照片回忆」。
          </div>
        </div>

        {/* 发送 */}
        <div style={{ padding: "12px 18px 28px", flexShrink: 0, borderTop: "1px solid rgba(196,166,184,.12)" }}>
          <button
            disabled={!imageData || loading}
            onClick={() => { onSend({ imageData, imageName, note }); onClose(); }}
            style={{
              width: "100%", padding: "12px",
              background: !imageData ? "rgba(196,166,184,.15)" : "rgba(140,110,180,.22)",
              border: `1px solid ${!imageData ? "rgba(196,166,184,.3)" : "rgba(140,110,180,.4)"}`,
              borderRadius: 14,
              color: !imageData ? "#b0a0c0" : "#5a3a7e",
              fontSize: 14, fontWeight: 500, letterSpacing: 2,
              cursor: !imageData ? "default" : "pointer",
              fontFamily: "var(--font-main)",
            }}
          >
            发给他看
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 音乐分享面板 ──
function MusicSharePanel({ activeChar, onSend, onClose }) {
  const charName = activeChar?.name || "ta";
  const [title,  setTitle]  = useState("");
  const [artist, setArtist] = useState("");
  const [url,    setUrl]    = useState("");
  const [note,   setNote]   = useState("");
  const [error,  setError]  = useState("");

  const handleSend = () => {
    if (!title.trim()) { setError("先告诉我歌名吧～"); return; }
    setError("");
    const lines = [
      "[用户分享了一首歌给你]",
      `歌名：${title.trim()}`,
      artist.trim() ? `歌手：${artist.trim()}` : null,
      url.trim()    ? `链接：${url.trim()}`    : null,
      note.trim()   ? `想说的话：${note.trim()}` : null,
    ].filter(Boolean);
    onSend({ title: title.trim(), artist: artist.trim(), url: url.trim(), note: note.trim(), content: lines.join("\n") });
    onClose();
  };

  const fieldStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px", borderRadius: 12, fontSize: 13, color: "#5a4a6a",
    background: "rgba(255,255,255,.8)",
    border: "1px solid rgba(196,166,184,.28)",
    fontFamily: "var(--font-main)", outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(60,50,80,.35)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(160deg, #fffef8 0%, #f8f4ff 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
        display: "flex", flexDirection: "column",
        maxHeight: "88vh", overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>🎵 分享音乐给{charName}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 32px" }}>
          {/* 歌名 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>歌名 *</div>
            <input
              autoFocus
              type="text"
              placeholder="叫什么歌……"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              style={{ ...fieldStyle, border: `1px solid ${error ? "rgba(180,80,80,.5)" : "rgba(196,166,184,.28)"}` }}
            />
            {error && <div style={{ fontSize: 11, color: "#9a5050", marginTop: 5 }}>{error}</div>}
          </div>

          {/* 歌手 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>歌手（可选）</div>
            <input type="text" placeholder="谁唱的……" value={artist} onChange={(e) => setArtist(e.target.value)} style={fieldStyle} />
          </div>

          {/* 链接 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>链接（可选）</div>
            <input type="url" placeholder="网易云 / Spotify / YouTube…" value={url} onChange={(e) => setUrl(e.target.value)} style={fieldStyle} />
          </div>

          {/* 想说的话 */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>想说的话（可选）</div>
            <textarea
              placeholder="为什么想分享这首歌……"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ ...fieldStyle, resize: "none", lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* 发送 */}
        <div style={{ padding: "12px 18px 28px", flexShrink: 0, borderTop: "1px solid rgba(196,166,184,.12)" }}>
          <button
            onClick={handleSend}
            style={{
              width: "100%", padding: "12px",
              background: "rgba(140,110,180,.22)",
              border: "1px solid rgba(140,110,180,.4)",
              borderRadius: 14, color: "#5a3a7e",
              fontSize: 14, fontWeight: 500, letterSpacing: 2,
              cursor: "pointer", fontFamily: "var(--font-main)",
            }}
          >
            🎵 分享给{charName}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkSharePanel({ activeChar, onSend, onClose }) {
  const charName = activeChar?.name || "ta";
  const [url,    setUrl]    = useState("");
  const [title,  setTitle]  = useState("");
  const [note,   setNote]   = useState("");
  const [intent, setIntent] = useState("陪我看看");
  const [urlError, setUrlError] = useState("");

  const handleSend = () => {
    const trimUrl = url.trim();
    if (!trimUrl) { setUrlError("先贴一个链接给他看吧。"); return; }
    setUrlError("");

    const domain       = tryGetDomain(trimUrl);
    const displayTitle = title.trim() || domain || trimUrl;

    // content：LLM 能读到所有字段，即使结构化字段丢失也能理解
    const lines = [
      `链接：${trimUrl}`,
      title.trim() ? `标题：${title.trim()}` : `来源：${domain || trimUrl}`,
      note.trim()  ? `备注：${note.trim()}`  : null,
      `分享意图：${intent}`,
    ].filter(Boolean);

    onSend({
      url:     trimUrl,
      title:   displayTitle,
      note:    note.trim(),
      intent,
      content: lines.join("\n"),
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(60,50,80,.35)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(160deg, #fffef8 0%, #f8f4ff 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
        display: "flex", flexDirection: "column",
        maxHeight: "88vh", overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
            🔗 给{charName}看这个
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 32px" }}>

          {/* URL */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>链接 URL</div>
            <input
              autoFocus
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 12px", borderRadius: 12, fontSize: 13, color: "#5a4a6a",
                background: "rgba(255,255,255,.8)",
                border: `1px solid ${urlError ? "rgba(180,80,80,.5)" : "rgba(196,166,184,.28)"}`,
                fontFamily: "var(--font-main)", outline: "none",
              }}
            />
            {urlError && (
              <div style={{ fontSize: 11, color: "#9a5050", marginTop: 5, letterSpacing: 0.3 }}>
                {urlError}
              </div>
            )}
          </div>

          {/* 标题 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>
              标题 <span style={{ opacity: 0.5 }}>（可选，没填就用域名）</span>
            </div>
            <input
              type="text"
              placeholder="这篇文章叫…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 12px", borderRadius: 12, fontSize: 13, color: "#5a4a6a",
                background: "rgba(255,255,255,.8)",
                border: "1px solid rgba(196,166,184,.28)",
                fontFamily: "var(--font-main)", outline: "none",
              }}
            />
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>
              我想说的 <span style={{ opacity: 0.5 }}>（可选）</span>
            </div>
            <textarea
              placeholder="比如：这段让我想到了你，或者：我不太理解第三段…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                minHeight: 68, padding: "9px 12px",
                borderRadius: 12, fontSize: 13, color: "#5a4a6a",
                background: "rgba(255,255,255,.8)",
                border: "1px solid rgba(196,166,184,.28)",
                fontFamily: "var(--font-main)", outline: "none",
                resize: "none", lineHeight: 1.75,
              }}
            />
          </div>

          {/* 分享意图 */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 9 }}>我想让你怎么看</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {LINK_INTENTS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIntent(i)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 11,
                    cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                    background: intent === i ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.8)",
                    border: `1px solid ${intent === i ? "rgba(120,100,160,.45)" : "rgba(196,166,184,.25)"}`,
                    color: intent === i ? "#5a4a8a" : "#7a6a8e",
                  }}
                >{i}</button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSend}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: "rgba(120,100,160,.85)",
              border: "none", color: "white",
              fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 1,
            }}
          >发给{charName}看看</button>
        </div>
      </div>
    </div>
  );
}

// ── 聊天区：链接卡片 ──
function LinkShareCard({ msg }) {
  const domain = tryGetDomain(msg.linkUrl || "");
  const displayTitle = msg.linkTitle || domain || msg.linkUrl || "链接";

  return (
    <div style={{
      background: "rgba(255,255,255,.75)",
      border: "1px solid rgba(196,166,184,.22)",
      borderRadius: 14,
      overflow: "hidden",
      maxWidth: "84%",
      boxShadow: "0 2px 10px rgba(74,69,96,.07)",
    }}>
      {/* 顶部标题行 */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "12px 14px 10px",
        borderBottom: "1px solid rgba(196,166,184,.12)",
      }}>
        <span style={{
          fontSize: 18, lineHeight: 1.2, flexShrink: 0, marginTop: 1,
        }}>🔗</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "#4a3a5a",
            lineHeight: 1.4, wordBreak: "break-all",
          }}>{displayTitle}</div>
          <div style={{
            fontSize: 10, color: "var(--text-faint)", marginTop: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {(msg.linkUrl || "").length > 48
              ? (msg.linkUrl || "").slice(0, 48) + "…"
              : (msg.linkUrl || "")}
          </div>
        </div>
      </div>

      {/* 备注 */}
      {msg.linkNote && (
        <div style={{
          padding: "8px 14px",
          fontSize: 12, color: "#6a5a7a", lineHeight: 1.7,
          borderBottom: "1px solid rgba(196,166,184,.1)",
          wordBreak: "break-all",
        }}>
          {msg.linkNote}
        </div>
      )}

      {/* 底部：意图 */}
      <div style={{
        padding: "7px 14px",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
      }}>
        <span style={{
          fontSize: 10, color: "#8a6a9a",
          background: "rgba(196,166,184,.14)",
          padding: "2px 9px", borderRadius: 10,
          border: "1px solid rgba(196,166,184,.2)",
          letterSpacing: 0.3,
        }}>{msg.linkIntent || "分享链接"}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// ── 聊天背景设置 ──
// ════════════════════════════════════════════

const CHAT_BG_PRESETS = [
  {
    key: "night",
    label: "夜色紫",
    grad: "linear-gradient(160deg,#2c1f45 0%,#1e1535 50%,#160e2a 100%)",
    preview: "linear-gradient(135deg,#2c1f45,#160e2a)",
  },
  {
    key: "warm",
    label: "暖灯",
    grad: "linear-gradient(160deg,#3a2210 0%,#2e1a0a 50%,#261208 100%)",
    preview: "linear-gradient(135deg,#3a2210,#261208)",
  },
  {
    key: "rain",
    label: "雨天窗边",
    grad: "linear-gradient(160deg,#1a2b38 0%,#14202e 50%,#0d1825 100%)",
    preview: "linear-gradient(135deg,#1a2b38,#0d1825)",
  },
  {
    key: "dark",
    label: "纯色深色",
    grad: "#161218",
    preview: "#161218",
    isSolid: true,
  },
  {
    key: "rosy",
    label: "淡雾玫瑰",
    grad: "linear-gradient(160deg,#3d2535 0%,#2e1c28 50%,#261422 100%)",
    preview: "linear-gradient(135deg,#3d2535,#261422)",
  },
];

const DIM_LEVELS = [
  { key: "none",   label: "无",  val: 0 },
  { key: "low",    label: "低",  val: 0.18 },
  { key: "medium", label: "中",  val: 0.38 },
  { key: "high",   label: "高",  val: 0.60 },
];

// 计算最终背景 CSS（注入 chat-scene 外层 div style）
function computeChatBgStyle(uiSettings) {
  const s = uiSettings || {};
  const type = s.chatBgType || "default";
  if (type === "default") return null;

  const dimVal = DIM_LEVELS.find((d) => d.key === s.chatBgDim)?.val ?? 0;
  const dimLayer = `rgba(0,0,0,${dimVal})`;

  if (type === "preset") {
    const p = CHAT_BG_PRESETS.find((x) => x.key === s.chatBgPreset);
    if (!p) return null;
    if (p.isSolid) {
      return dimVal > 0
        ? { background: `linear-gradient(${dimLayer},${dimLayer}), linear-gradient(${p.grad},${p.grad})` }
        : { background: p.grad };
    }
    return dimVal > 0
      ? { background: `linear-gradient(${dimLayer},${dimLayer}), ${p.grad}` }
      : { background: p.grad };
  }

  if (type === "url" && s.chatBgUrl?.trim()) {
    return {
      backgroundImage: dimVal > 0
        ? `linear-gradient(${dimLayer},${dimLayer}), url(${s.chatBgUrl.trim()})`
        : `url(${s.chatBgUrl.trim()})`,
      backgroundSize:     "cover",
      backgroundPosition: "center",
      backgroundRepeat:   "no-repeat",
      backgroundColor:    "#1a1520",  // fallback if image fails
    };
  }

  return null;
}

function ChatBgPanel({ activeChar, onSave, onClose }) {
  const ui = activeChar?.uiSettings || {};
  const charName = activeChar?.name || "ta";
  const [type,   setType]   = useState(ui.chatBgType   || "default");
  const [preset, setPreset] = useState(ui.chatBgPreset || "");
  const [url,    setUrl]    = useState(ui.chatBgUrl    || "");
  const [dim,    setDim]    = useState(ui.chatBgDim    || "none");

  const handleSave = () => {
    onSave({ chatBgType: type, chatBgPreset: preset, chatBgUrl: url.trim(), chatBgDim: dim });
    onClose();
  };

  const fieldStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px", borderRadius: 12, fontSize: 13, color: "#5a4a6a",
    background: "rgba(255,255,255,.8)", border: "1px solid rgba(196,166,184,.28)",
    fontFamily: "var(--font-main)", outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(60,50,80,.35)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(160deg,#faf7fd 0%,#f4f0fa 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
        maxHeight: "88vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)", flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
            🖼 {charName}的聊天背景
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 8px" }}>

          {/* ── 背景类型 ── */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 10 }}>背景类型</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "default", label: "默认" },
                { value: "preset",  label: "预设背景" },
                { value: "url",     label: "图片 URL" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12,
                    background: type === opt.value ? "rgba(140,110,180,.85)" : "rgba(255,255,255,.75)",
                    border: `1px solid ${type === opt.value ? "rgba(140,110,180,.8)" : "rgba(196,166,184,.3)"}`,
                    color: type === opt.value ? "#fff" : "#7a6a8a",
                    cursor: "pointer", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    transition: "all .15s",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* ── 预设背景网格 ── */}
          {type === "preset" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 10 }}>选择预设</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                {CHAT_BG_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPreset(p.key)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: p.preview,
                      border: preset === p.key
                        ? "2px solid rgba(140,110,180,.85)"
                        : "2px solid rgba(196,166,184,.2)",
                      boxShadow: preset === p.key
                        ? "0 2px 10px rgba(140,110,180,.3)"
                        : "0 1px 4px rgba(74,69,96,.08)",
                      transition: "all .15s",
                    }} />
                    <span style={{
                      fontSize: 10, color: preset === p.key ? "#6a3a9a" : "var(--text-faint)",
                      lineHeight: 1.3, textAlign: "center",
                    }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 自定义 URL ── */}
          {type === "url" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 8 }}>图片 URL</div>
              <input
                type="url"
                placeholder="https://…（图片直链）"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={fieldStyle}
              />
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6, lineHeight: 1.6 }}>
                暂不支持本地上传。建议使用图床或直链图片地址。
                加载失败时会自动回退到默认背景。
              </div>
            </div>
          )}

          {/* ── 遮罩透明度 ── */}
          {type !== "default" && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 10 }}>背景遮罩</div>
              <div style={{ display: "flex", gap: 8 }}>
                {DIM_LEVELS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDim(d.key)}
                    style={{
                      padding: "6px 16px", borderRadius: 20, fontSize: 12,
                      background: dim === d.key ? "rgba(140,110,180,.82)" : "rgba(255,255,255,.75)",
                      border: `1px solid ${dim === d.key ? "rgba(140,110,180,.75)" : "rgba(196,166,184,.3)"}`,
                      color: dim === d.key ? "#fff" : "#7a6a8a",
                      cursor: "pointer", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      transition: "all .15s",
                    }}
                  >{d.label}</button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6, lineHeight: 1.6 }}>
                遮罩可以降低背景亮度，保证聊天文字可读。
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: "12px 18px calc(20px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid rgba(196,166,184,.12)", flexShrink: 0,
          display: "flex", gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: 12, fontSize: 13,
              background: "transparent", border: "1px solid rgba(196,166,184,.3)",
              color: "#9a8aac", cursor: "pointer", fontFamily: "var(--font-main)",
            }}
          >取消</button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: "11px", borderRadius: 12, fontSize: 13,
              background: "rgba(140,110,180,.85)", border: "none",
              color: "white", cursor: "pointer", fontFamily: "var(--font-main)",
              letterSpacing: 0.5,
            }}
          >保存</button>
        </div>
      </div>
    </div>
  );
}

// ── 聊天区：音乐卡片 ──
function MusicShareCard({ msg }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.78)",
      border: "1px solid rgba(196,166,184,.22)",
      borderRadius: 14,
      overflow: "hidden",
      maxWidth: "84%",
      boxShadow: "0 2px 10px rgba(74,69,96,.07)",
    }}>
      {/* 标题行 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px 10px",
        borderBottom: "1px solid rgba(196,166,184,.1)",
        background: "linear-gradient(135deg, rgba(180,140,220,.08), rgba(160,120,200,.06))",
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🎵</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#4a3a5a", lineHeight: 1.3 }}>
            {msg.musicTitle || "分享了一首歌"}
          </div>
          {msg.musicArtist && (
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              {msg.musicArtist}
            </div>
          )}
        </div>
      </div>
      {/* 备注 */}
      {msg.musicNote && (
        <div style={{
          padding: "8px 14px",
          fontSize: 12, color: "#6a5a7a", lineHeight: 1.7,
          borderBottom: msg.musicUrl ? "1px solid rgba(196,166,184,.1)" : "none",
          wordBreak: "break-all",
        }}>
          {msg.musicNote}
        </div>
      )}
      {/* 链接 */}
      {msg.musicUrl && (
        <div style={{ padding: "7px 14px" }}>
          <a
            href={msg.musicUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: "#8a6a9a", wordBreak: "break-all", textDecoration: "none" }}
          >
            🔗 {msg.musicUrl.length > 40 ? msg.musicUrl.slice(0, 40) + "…" : msg.musicUrl}
          </a>
        </div>
      )}
    </div>
  );
}

// ── 聊天区：图片卡片 ──
function ImageCard({ msg }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.78)",
      border: "1px solid rgba(196,166,184,.22)",
      borderRadius: 14,
      overflow: "hidden",
      maxWidth: "72%",
      boxShadow: "0 2px 10px rgba(74,69,96,.07)",
    }}>
      {/* 图片 */}
      {msg.imageData && (
        <img
          src={msg.imageData}
          alt={msg.imageName || "图片"}
          style={{
            display: "block", width: "100%", maxHeight: 260,
            objectFit: "cover",
          }}
        />
      )}
      {/* 备注 */}
      {msg.imageNote && (
        <div style={{
          padding: "8px 12px",
          fontSize: 12, color: "#6a5a7a", lineHeight: 1.7,
          wordBreak: "break-all",
        }}>
          {msg.imageNote}
        </div>
      )}
      {/* 提示 */}
      <div style={{ padding: "5px 12px 8px" }}>
        <span style={{
          fontSize: 10, color: "var(--text-faint)",
          background: "rgba(196,166,184,.1)",
          padding: "1px 7px", borderRadius: 8,
        }}>仅在聊天中可见</span>
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
  prevPage,
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
  offlineGenerating,
  showSettleReminder,
  settleReminderText,
  onGoSettle,
  onDismissSettleReminder,
  // 伏笔追踪
  charPendingThreads,
  onAddPendingThread,
  onResolvePendingThread,
  onDeletePendingThread,
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
  // 链接分享
  sendLinkFromChat,
  // 音乐 / 图片分享
  sendMusicFromChat,
  sendImageFromChat,
  // 亲密邀请
  createIntimateScene,
  closeSceneThread,
  activeThread,
  // UI 设置
  updateCharUiSettings,
  // 他的宝库
  onAddCharTreasure,
  // 他的房间
  onOpenCharRoom,
  // 场景补充指示
  sceneNote,
  setSceneNote,
}) {
  // 返回目标：从他的房间进入时，返回他的房间；否则返回卧室
  const chatBackTarget = prevPage === "charRoom" ? "charRoom" : "bedroom";
  const chatBackLabel  = "回房间";

  // ── 局部 UI 状态 ──
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attachView, setAttachView] = useState(null); // null | "grid" | "notes" | "intent" | "link" | "scene" | "music" | "image"
  const [attachPage, setAttachPage] = useState(1); // 加号面板页码 1 or 2
  const [comingSoonMsg, setComingSoonMsg] = useState(""); // coming-soon 提示文字
  const [selectedNote, setSelectedNote] = useState(null);
  // 宝库收藏
  const [treasureTarget, setTreasureTarget] = useState(null); // 要收藏的 msg
  const [treasureForm, setTreasureForm] = useState(null);     // 收藏表单
  const [treasureSaved, setTreasureSaved] = useState(false);  // 短暂成功提示
  // 他的宝库：让他珍藏
  const [charTreasureTarget, setCharTreasureTarget] = useState(null); // msg
  const [charTreasureSaved, setCharTreasureSaved] = useState(false);
  // 场景结束面板
  // null | "choose" | "treasure_done" | "timeline_done"
  const [sceneEndStep, setSceneEndStep] = useState(null);
  // 聊天背景设置面板
  const [showChatBgPanel, setShowChatBgPanel] = useState(false);
  // 伏笔追踪面板
  const [showThreadsPanel, setShowThreadsPanel] = useState(false);
  // 旧版本查看：记录当前展开旧版的消息索引
  const [showVersionFor, setShowVersionFor] = useState(null);
  // 心声折叠（场景模式下默认折叠）
  const [expandedThoughts, setExpandedThoughts] = useState(new Set());
  // 注入面板
  const [showInjectPanel, setShowInjectPanel] = useState(false);

  // ── 场景模式检测 ──（必须在 chatBgStyle 之前）
  const isSceneMode = activeThread?.threadType === "scene" && !activeThread?.sceneClosed;

  // 计算背景样式（scene 模式下不用，scene 有自己的 S.pageBg）
  const chatBgStyle = (!isSceneMode && activeChar?.uiSettings)
    ? computeChatBgStyle(activeChar.uiSettings)
    : null;

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

  // ── 场景模式颜色常量（灰紫色调，不过深）──
  const S = isSceneMode ? {
    // 背景：中深灰紫，不是纯黑
    pageBg:        "linear-gradient(180deg,#342448 0%,#2b1c3e 45%,#221530 100%)",
    // 顶栏
    barBg:         "rgba(44,28,62,.9)",
    barBorder:     "rgba(190,150,240,.1)",
    msgAreaBg:     "transparent",
    // bot 气泡：毛玻璃淡粉
    botBubbleBg:   "rgba(255,230,248,.07)",
    botBubbleBd:   "rgba(255,185,230,.17)",
    botBubbleTxt:  "rgba(245,225,255,.9)",
    // user 气泡：柔和紫
    userBubbleBg:  "linear-gradient(135deg,rgba(140,85,210,.52),rgba(105,62,172,.48))",
    userBubbleTxt: "rgba(242,222,255,.93)",
    // 时间戳
    timeTxt:       "rgba(195,158,238,.32)",
    // 输入栏
    inputBarBg:    "rgba(38,24,54,.93)",
    inputBarBd:    "rgba(185,140,235,.12)",
    inputFieldBg:  "rgba(255,255,255,.08)",
    inputFieldBd:  "rgba(205,158,240,.2)",
    inputTxt:      "rgba(238,218,255,.9)",
    inputPH:       "rgba(178,140,218,.42)",
    sendBtnBg:     "linear-gradient(135deg,rgba(140,82,210,.72),rgba(108,62,182,.68))",
    // 滚动按钮
    scrollBtnBg:   "rgba(55,38,78,.82)",
    scrollBtnBd:   "rgba(190,148,240,.18)",
    // 打字指示
    typingDot:     "rgba(210,165,245,.55)",
    typingBg:      "rgba(255,230,248,.06)",
    typingBd:      "rgba(255,185,230,.15)",
    // 回复模式切换条（统一到同一背景，不再突兀白色）
    replyBarBg:    "rgba(35,22,50,.95)",
    replyBarBd:    "rgba(180,140,230,.09)",
    replyPillBg:   "rgba(255,255,255,.06)",
    replyActiveBg: "rgba(255,255,255,.13)",
    replyTxt:      "rgba(195,160,235,.55)",
    replyActiveTxt:"rgba(238,218,255,.9)",
  } : null;

  return (
    <div
      className="chat-scene"
      style={S ? { background: S.pageBg } : (chatBgStyle || undefined)}
    >
      {/* ── 顶栏（场景模式：精简两行） ── */}
      {isSceneMode ? (
        <div style={{
          display: "flex", flexDirection: "column", flexShrink: 0,
          padding: "calc(16px + env(safe-area-inset-top, 0px)) 16px 10px",
          background: S.barBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${S.barBorder}`, position: "relative", zIndex: 2,
          gap: 6,
        }}>
          {/* 行 1：返回 · 角色名 · 今天就到这儿 */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => navigateTo(chatBackTarget)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 3,
                fontSize: 13, color: "rgba(170,140,220,.7)",
                fontFamily: "var(--font-main)", letterSpacing: 1,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {chatBackLabel}
            </button>
            <div style={{
              flex: 1, textAlign: "center",
              fontSize: 17, fontWeight: 500, letterSpacing: 3,
              color: "rgba(230,210,255,.92)",
            }}>
              {activeChar?.name || "ta"}
            </div>
            <button
              onClick={() => setSceneEndStep("choose")}
              style={{
                padding: "5px 12px", borderRadius: 14, fontSize: 11,
                background: "rgba(90,55,170,.18)", border: "1px solid rgba(130,90,220,.22)",
                color: "rgba(180,150,240,.85)", cursor: "pointer",
                fontFamily: "var(--font-main)", letterSpacing: 0.5, flexShrink: 0,
              }}
            >今天就到这儿</button>
          </div>
          {/* 行 2：场景胶囊 + 场景/氛围 + 注入按钮 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, color: "rgba(155,120,210,.75)",
              background: "rgba(70,45,150,.14)", padding: "2px 10px",
              borderRadius: 10, border: "1px solid rgba(110,75,200,.18)", letterSpacing: 1,
            }}>🌙 亲密场景</span>
            {(activeThread?.sceneConfig?.scene || activeThread?.sceneConfig?.mood) && (
              <span style={{ fontSize: 10, color: "rgba(135,105,190,.5)", letterSpacing: 0.5 }}>
                {[activeThread.sceneConfig.scene, activeThread.sceneConfig.mood].filter(Boolean).join(" · ")}
              </span>
            )}
            <button
              onClick={() => setShowInjectPanel(true)}
              style={{
                background: sceneNote?.trim() ? "rgba(120,80,220,.22)" : "rgba(255,255,255,.07)",
                border: `1px solid ${sceneNote?.trim() ? "rgba(160,110,255,.4)" : "rgba(130,90,220,.2)"}`,
                borderRadius: 10, padding: "2px 9px", fontSize: 10,
                color: sceneNote?.trim() ? "rgba(200,170,255,.9)" : "rgba(140,105,200,.65)",
                cursor: "pointer", fontFamily: "var(--font-main)", letterSpacing: 0.5,
              }}
            >注入 {sceneNote?.trim() ? "·" : ""}</button>
          </div>
        </div>
      ) : (
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
        <button className="back-btn" onClick={() => navigateTo(chatBackTarget)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          回房间
        </button>

        {/* 中间信息区 */}
        <div
          className="chat-title-area"
          onClick={onOpenCharRoom ? () => onOpenCharRoom(activeCharId) : undefined}
          style={onOpenCharRoom ? { cursor: "pointer" } : undefined}
        >
          <div className="chat-companion-name">{activeChar?.name || "赛博伴侣"}</div>
          {isSceneMode ? (
            <div style={{
              fontSize: 10, color: "rgba(180,140,220,.9)",
              background: "rgba(100,60,160,.12)", padding: "1px 8px", borderRadius: 10,
              border: "1px solid rgba(150,100,200,.2)", letterSpacing: 0.5,
              display: "inline-block", margin: "2px auto 0",
            }}>🌙 亲密场景</div>
          ) : (
            <div className={`chat-status ${isConfigReady() ? "online" : "offline"}`}>
              {isConfigReady() ? "在线" : "未连接"}
            </div>
          )}
          <div style={{
            fontSize: 10, fontWeight: 300, color: "var(--text-faint)",
            letterSpacing: 0.5, opacity: 0.7,
            maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            margin: "1px auto 0",
          }}>
            {isConfigReady() ? `${getActiveModel(activeChar?.modelOverride)}` : ""}
          </div>
        </div>

        {/* 场景模式：今天就到这儿 */}
        {isSceneMode && (
          <button
            onClick={() => setSceneEndStep("choose")}
            style={{
              padding: "5px 10px", borderRadius: 10, fontSize: 11,
              background: "rgba(100,60,160,.1)", border: "1px solid rgba(150,100,200,.25)",
              color: "rgba(150,110,200,.9)", cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 0.5,
              marginRight: 4, flexShrink: 0,
            }}
          >
            今天就到这儿
          </button>
        )}

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
                  { label: "唤醒预览",    emoji: "🌙", action: () => { activeChar && openWakePreview?.(activeChar.id); setShowMoreMenu(false); } },
                  { label: "记忆注入",    emoji: "🧠", action: () => { setShowMemoryControl(true); setShowMoreMenu(false); } },
                  { label: "聊天背景",    emoji: "🖼", action: () => { setShowChatBgPanel(true); setShowMoreMenu(false); } },
                  null, // divider
                  { label: "API 设置",    emoji: "⚙️", action: () => { navigateTo("config"); setShowMoreMenu(false); } },
                  { label: "导出聊天",    emoji: "📥", action: () => { handleExportChat(); setShowMoreMenu(false); } },
                  { label: "清空聊天",    emoji: "🗑", action: () => { setShowClearConfirm(true); setShowMoreMenu(false); }, danger: true },
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
      )} {/* end isSceneMode ? scene top bar : regular top bar */}

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
                const realMsgs = thread.messages.filter(m => (m.role === "user" || m.role === "bot") && !m.isSceneOpening && (m.content || "").trim());
                const lastMsg = realMsgs[realMsgs.length - 1];
                const preview = lastMsg
                  ? (lastMsg.role === "user" ? "你：" : "") + lastMsg.content
                  : thread.threadType === "scene" ? "🌙 亲密场景" : "空对话";
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

      {/* ── 伏笔追踪：胶囊 + 展开列表 ── */}
      {(() => {
        const openThreads = (charPendingThreads || []).filter((t) => t.status === "open");
        const allThreads  = charPendingThreads || [];
        if (allThreads.length === 0) return null;
        return (
          <div style={{ position: "relative", zIndex: 4 }}>
            {/* 胶囊触发行 */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "4px 0 2px",
              }}
            >
              <button
                onClick={() => setShowThreadsPanel((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 12px", borderRadius: 20,
                  background: openThreads.length > 0
                    ? "rgba(196,166,184,.18)" : "rgba(160,160,160,.1)",
                  border: openThreads.length > 0
                    ? "1px solid rgba(196,166,184,.35)" : "1px solid rgba(160,160,160,.2)",
                  color: openThreads.length > 0 ? "var(--text-soft)" : "var(--text-faint)",
                  fontSize: 11, cursor: "pointer",
                  fontFamily: "var(--font-main)", letterSpacing: 0.5,
                  transition: "all .2s",
                  ...(S ? { background: "rgba(160,120,220,.12)", border: "1px solid rgba(160,120,220,.2)", color: "rgba(200,170,240,.8)" } : {}),
                }}
              >
                🧵
                <span>
                  {openThreads.length > 0
                    ? `${openThreads.length} 条还没聊完`
                    : "伏笔都了结了"}
                </span>
                <span style={{ opacity: 0.6, fontSize: 9 }}>{showThreadsPanel ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* 展开面板 */}
            {showThreadsPanel && (
              <div style={{
                margin: "0 12px 6px",
                borderRadius: 14,
                background: S ? "rgba(30,20,50,.6)" : "rgba(250,245,255,.92)",
                border: S ? "1px solid rgba(160,120,220,.2)" : "1px solid rgba(196,166,184,.2)",
                backdropFilter: "blur(8px)",
                overflow: "hidden",
              }}>
                {allThreads.length === 0 && (
                  <div style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
                    还没有伏笔～在消息上点 🧵 标记
                  </div>
                )}
                {allThreads.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(196,166,184,.1)",
                      opacity: t.status === "resolved" ? 0.45 : 1,
                    }}
                  >
                    <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}>
                      {t.status === "resolved" ? "✅" : "🧵"}
                    </span>
                    <span style={{
                      flex: 1, fontSize: 12, lineHeight: 1.65,
                      color: S ? "rgba(220,200,255,.85)" : "var(--text-soft)",
                      textDecoration: t.status === "resolved" ? "line-through" : "none",
                    }}>
                      {t.content}
                    </span>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 1 }}>
                      {t.status === "open" && (
                        <button
                          onClick={() => onResolvePendingThread(activeCharId, t.id)}
                          title="标记已了结"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 11, color: "var(--text-faint)", padding: "1px 4px",
                          }}
                        >了结</button>
                      )}
                      <button
                        onClick={() => onDeletePendingThread(activeCharId, t.id)}
                        title="删除"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 12, color: "var(--text-faint)", padding: "1px 3px",
                          opacity: 0.6,
                        }}
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 消息区 ── */}
      <div
        className="messages-area"
        style={S ? {
          background: S.msgAreaBg,
          gap: 14,
          paddingTop: 24,
          paddingBottom: 20,
        } : undefined}
      >
        <div className="time-divider" style={S ? { color: S.timeTxt } : undefined}>—— 今天 ——</div>

        {/* ── 自动沉淀提醒横幅 ── */}
        {showSettleReminder && !isSceneMode && (
          <div style={{
            margin: "0 12px 8px",
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(196,166,184,.13)",
            border: "1px solid rgba(196,166,184,.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            color: "var(--text-soft)",
            backdropFilter: "blur(6px)",
          }}>
            <span style={{ fontSize: 15 }}>🌿</span>
            <span style={{ flex: 1, lineHeight: 1.6 }}>{settleReminderText}，要不要整理一下？</span>
            <button
              onClick={onGoSettle}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(196,166,184,.25)",
                border: "1px solid rgba(196,166,184,.4)",
                color: "var(--text-soft)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "var(--font-main)",
                letterSpacing: .5,
                whiteSpace: "nowrap",
              }}
            >整理一下</button>
            <button
              onClick={onDismissSettleReminder}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-faint)",
                cursor: "pointer",
                fontSize: 14,
                padding: "0 2px",
                lineHeight: 1,
              }}
            >×</button>
          </div>
        )}

        {messages.map((msg, i) => {
          // ── 系统消息：入住仪式卡片 ──
          if (msg.role === "system" && msg.type === "move_in_ceremony") {
            return <MoveInCeremonyCard key={i} msg={msg} />;
          }
          // ── 系统消息：亲密场景开场卡片 ──
          if (msg.role === "system" && msg.type === "scene_info") {
            return <SceneInfoCard key={i} msg={msg} />;
          }
          // ── 系统消息：亲密场景结束卡片 ──
          if (msg.role === "system" && msg.type === "scene_end") {
            return <SceneEndCard key={i} onSaveTreasure={onSaveTreasure} messages={messages} />;
          }
          // ── 隐藏：场景开场触发消息 ──
          if (msg.isSceneOpening) {
            return null;
          }

          return (
          <div key={i}>
            {/* 离线思念分隔提示 */}
            {msg.isOfflineMessage && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 16px 2px",
                opacity: 0.55,
              }}>
                <div style={{ flex: 1, height: 1, background: "rgba(160,130,180,.25)" }} />
                <span style={{ fontSize: 10, color: "#9a8aac", letterSpacing: 1, whiteSpace: "nowrap" }}>
                  💭 你不在的时候，他发来了
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(160,130,180,.25)" }} />
              </div>
            )}
          <div
            className={`msg-wrap ${msg.role === "bot" ? "is-bot" : "is-user"}`}
            style={S ? {
              paddingRight: msg.role === "bot" ? 48 : undefined,
              paddingLeft:  msg.role === "user" ? 48 : undefined,
            } : undefined}
          >
            {msg.thought && (() => {
              const thoughtExpanded = !isSceneMode || expandedThoughts.has(i);
              return (
                <div
                  className="thought-bubble"
                  onClick={isSceneMode ? () => setExpandedThoughts(prev => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  }) : undefined}
                  style={isSceneMode ? { cursor: "pointer", userSelect: "none" } : undefined}
                >
                  <span className="thought-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    💭 心声
                    {isSceneMode && (
                      <span style={{
                        fontSize: 9, color: "rgba(160,130,200,.6)",
                        transition: "transform .2s",
                        display: "inline-block",
                        transform: thoughtExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      }}>▾</span>
                    )}
                  </span>
                  {thoughtExpanded && msg.thought}
                </div>
              );
            })()}

            {/* 链接 / 音乐 / 图片 分享卡片 */}
            {msg.isLinkShare ? (
              <LinkShareCard msg={msg} />
            ) : msg.isMusicShare ? (
              <MusicShareCard msg={msg} />
            ) : msg.isImageShare ? (
              <ImageCard msg={msg} />
            ) : /* 手札分享卡片 */ (msg.isDiaryShare || msg.isNoteShare) ? (
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
                style={{
                  ...(msg.replyMode === "long" ? { whiteSpace: "pre-wrap", maxWidth: "88%", lineHeight: 1.75 } : {}),
                  ...(S && msg.role === "bot" ? {
                    background: S.botBubbleBg,
                    border: `1px solid ${S.botBubbleBd}`,
                    color: S.botBubbleTxt,
                    backdropFilter: "none",
                    fontSize: 14,
                    lineHeight: 1.9,
                    letterSpacing: 0.5,
                  } : {}),
                  ...(S && msg.role === "user" ? {
                    background: S.userBubbleBg,
                    color: S.userBubbleTxt,
                    boxShadow: "0 2px 12px rgba(60,30,120,.3)",
                  } : {}),
                }}
              >
                {msg.replyMode === "long" && msg.role === "bot" && !isSceneMode && (
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
                <div className="msg-time" style={{ margin: 0, ...(S ? { color: S.timeTxt } : {}) }}>
                  {msg.time}
                </div>

                {/* 消息操作小胶囊按钮 */}
                {msg.role === "user" && !msg.isDiaryShare && !msg.isNoteShare && (
                  <button
                    onClick={() => { setEditingMsgIdx(i); setEditingMsgText(msg.content); }}
                    style={{
                      background: "none", border: "1px solid rgba(155,149,181,.22)", cursor: "pointer",
                      fontSize: 10, color: "var(--text-faint)", padding: "1px 7px", borderRadius: 8,
                      transition: "all .2s", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                    title="编辑并重发"
                  >改写</button>
                )}

                {msg.role === "user" && !msg.isDiaryShare && !msg.isNoteShare && onAddCharTreasure && (
                  <button
                    onClick={() => setCharTreasureTarget(msg)}
                    style={{
                      background: "none", border: "1px solid rgba(155,149,181,.22)", cursor: "pointer",
                      fontSize: 10, color: "var(--text-faint)", padding: "1px 7px", borderRadius: 8,
                      transition: "all .2s", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                    title="让他珍藏"
                  >他藏</button>
                )}

                {msg.role === "bot" && onSaveTreasure && (
                  <button
                    onClick={() => openTreasure(msg)}
                    style={{
                      background: "none", border: "1px solid rgba(155,149,181,.22)", cursor: "pointer",
                      fontSize: 10, color: "var(--text-faint)", padding: "1px 7px", borderRadius: 8,
                      transition: "all .2s", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                    title="珍藏这段"
                  >珍藏</button>
                )}

                {(msg.role === "user" || msg.role === "bot") &&
                  !msg.isDiaryShare && !msg.isNoteShare && !msg.isOfflineMessage &&
                  (msg.content || "").trim() && onAddPendingThread && (
                  <button
                    onClick={() => {
                      const content = (msg.content || "").slice(0, 120).trim();
                      onAddPendingThread(activeCharId, content, msg.role);
                      setShowThreadsPanel(true);
                    }}
                    style={{
                      background: "none", border: "1px solid rgba(155,149,181,.22)", cursor: "pointer",
                      fontSize: 10, color: "var(--text-faint)", padding: "1px 7px", borderRadius: 8,
                      transition: "all .2s", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                    title="标记为伏笔"
                  >伏笔</button>
                )}

                {/* 最后一条 bot 消息：重新生成 + 版本切换 */}
                {msg.role === "bot" && i === messages.length - 1 && !isSending && (
                  <button
                    onClick={handleRegenerate}
                    style={{
                      background: "none", border: "1px solid rgba(155,149,181,.22)", cursor: "pointer",
                      fontSize: 10, color: "var(--text-faint)", padding: "1px 7px", borderRadius: 8,
                      transition: "all .2s", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                    title="换一版"
                  >换一版</button>
                )}

                {/* 旧版本查看入口（不限最后一条，任何有旧版的 bot 消息都显示） */}
                {msg.role === "bot" && (msg.prevVersions || []).length > 0 && (
                  <button
                    onClick={() => setShowVersionFor(v => v === i ? null : i)}
                    style={{
                      background: showVersionFor === i ? "rgba(155,149,181,.12)" : "none",
                      border: "1px solid rgba(155,149,181,.22)", cursor: "pointer",
                      fontSize: 10, color: "var(--text-faint)", padding: "1px 7px", borderRadius: 8,
                      transition: "all .2s", fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                    title="查看旧版本"
                  >旧版 {msg.prevVersions.length}</button>
                )}
              </div>
            )}

            {/* 旧版本展示面板 */}
            {msg.role === "bot" && showVersionFor === i && (msg.prevVersions || []).length > 0 && (
              <div style={{
                marginTop: 6, marginLeft: msg.role === "bot" ? 0 : "auto",
                maxWidth: "88%",
                borderRadius: 12,
                border: "1px solid rgba(155,149,181,.22)",
                background: "rgba(248,245,252,.85)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "7px 12px 5px",
                  fontSize: 10, color: "var(--text-faint)", letterSpacing: 1,
                  borderBottom: "1px solid rgba(155,149,181,.15)",
                }}>旧版本（共 {msg.prevVersions.length} 个）</div>
                {[...msg.prevVersions].reverse().map((v, vi) => (
                  <div key={v.id || vi} style={{
                    padding: "10px 14px",
                    borderBottom: vi < msg.prevVersions.length - 1 ? "1px solid rgba(155,149,181,.1)" : "none",
                  }}>
                    <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5 }}>
                      版本 {msg.prevVersions.length - vi} · {v.time || ""}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                      {v.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
          );
        })}

        {isTyping && (
          <div className="typing-wrap">
            <div
              className="typing-indicator"
              style={S ? { background: S.typingBg, border: `1px solid ${S.typingBd}` } : undefined}
            >
              <div className="typing-dot" style={S ? { background: S.typingDot } : undefined} />
              <div className="typing-dot" style={S ? { background: S.typingDot } : undefined} />
              <div className="typing-dot" style={S ? { background: S.typingDot } : undefined} />
            </div>
          </div>
        )}
        {offlineGenerating && (
          <div className="typing-wrap">
            <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 14px", letterSpacing: 1 }}>
              💭 他好像想说什么……
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
          background: S ? S.scrollBtnBg : "rgba(255,255,255,.8)",
          backdropFilter: "blur(8px)",
          border: S ? `1px solid ${S.scrollBtnBd}` : "1px solid rgba(232,196,196,.2)",
          boxShadow: S ? "0 2px 12px rgba(0,0,0,.3)" : "0 2px 12px rgba(74,69,96,.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          transition: "all .25s",
          fontSize: 16,
          color: S ? "rgba(180,150,240,.7)" : "var(--accent-dusk)",
        }}
        title="回到最新"
      >
        ↓
      </button>

      {/* ── 加号面板（两页，Page 1 = 关系工具, Page 2 = 素材/共享）── */}
      {attachView === "grid" && (() => {
        const PAGE1 = [
          { emoji: "📓", label: "分享手札",    active: true,  action: () => setAttachView("notes") },
          { emoji: "🌙", label: "亲密邀请",    sub: "共处一刻",  active: true,  action: () => setAttachView("scene") },
          { emoji: "🔗",  label: "给他看这个",  sub: "分享链接",  active: true,  action: () => setAttachView("link") },
          { emoji: "💗",  label: "帮我记住",    active: true,  action: () => setAttachView("memorize") },
          { emoji: "🕰",  label: "记下这一刻",  sub: "留作回忆",    active: true,  action: () => setAttachView("timeline") },
          { emoji: "✨",  label: "整理一下我们", sub: "更新关系理解", active: true,  action: () => setAttachView("settle") },
        ];
        const PAGE2 = [
          { emoji: "🖼",  label: "发张图给他",  sub: "图片",     active: true,  action: () => setAttachView("image") },
          { emoji: "📎",  label: "发个文件",    sub: "文件",     active: false, comingSoon: true },
          { emoji: "😂",  label: "表情包",      sub: "梗图",     active: false, comingSoon: true },
          { emoji: "🎵",  label: "分享音乐",    sub: "一起听",   active: true,  action: () => setAttachView("music") },
          { emoji: "🌐",  label: "小网页",      sub: "共同收藏", active: false, comingSoon: true },
          { emoji: "📤",  label: "共享",        sub: "导出 / 分享", active: false, comingSoon: true },
        ];
        const items = attachPage === 1 ? PAGE1 : PAGE2;
        const handleComingSoon = (label) => {
          setComingSoonMsg(`「${label}」功能还在建设中，敬请期待～`);
          setTimeout(() => setComingSoonMsg(""), 2500);
        };
        return (
          <div style={{
            background: "rgba(248,244,252,.97)",
            borderTop: "1px solid rgba(196,166,184,.18)",
            padding: "20px 24px 16px",
            flexShrink: 0,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px 0" }}>
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.active) { item.action(); }
                    else if (item.comingSoon) { handleComingSoon(item.label); }
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    background: "none", border: "none",
                    cursor: (item.active || item.comingSoon) ? "pointer" : "default",
                    fontFamily: "var(--font-main)",
                    opacity: item.active ? 1 : 0.4,
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
                    {item.comingSoon && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>稍后开放</div>}
                  </div>
                </button>
              ))}
            </div>

            {/* coming-soon toast */}
            {comingSoonMsg && (
              <div style={{
                marginTop: 12, padding: "7px 12px", borderRadius: 10,
                background: "rgba(196,166,184,.16)", border: "1px solid rgba(196,166,184,.22)",
                fontSize: 11, color: "#7a6a8e", textAlign: "center", letterSpacing: 0.3,
              }}>
                {comingSoonMsg}
              </div>
            )}

            {/* 分页指示器 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginTop: 14,
            }}>
              {[1, 2].map((p) => (
                <button
                  key={p}
                  onClick={() => setAttachPage(p)}
                  style={{
                    width: attachPage === p ? 18 : 7,
                    height: 7,
                    borderRadius: 4,
                    border: "none",
                    background: attachPage === p ? "rgba(120,100,160,.55)" : "rgba(196,166,184,.38)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all .2s",
                  }}
                />
              ))}
            </div>
          </div>
        );
      })()}

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

      {/* ── 给他看这个 · 链接分享面板 ── */}
      {attachView === "link" && (
        <LinkSharePanel
          activeChar={activeChar}
          onSend={(fields) => {
            sendLinkFromChat?.(fields);
            setAttachView(null);
          }}
          onClose={() => setAttachView(null)}
        />
      )}

      {/* ── 音乐分享面板 ── */}
      {attachView === "music" && (
        <MusicSharePanel
          activeChar={activeChar}
          onSend={(fields) => {
            sendMusicFromChat?.(fields);
            setAttachView(null);
          }}
          onClose={() => setAttachView(null)}
        />
      )}

      {/* ── 图片发送面板 ── */}
      {attachView === "image" && (
        <ImagePickerPanel
          onSend={(fields) => {
            sendImageFromChat?.(fields);
            setAttachView(null);
          }}
          onClose={() => setAttachView(null)}
        />
      )}

      {/* ── 亲密邀请面板 ── */}
      {attachView === "scene" && (
        <IntimateInvitationPanel
          activeChar={activeChar}
          onSend={(sceneConfig) => {
            setAttachView(null);
            createIntimateScene?.(sceneConfig);
          }}
          onClose={() => setAttachView(null)}
        />
      )}

      {/* ── 亲密场景结束确认 ── */}
      {/* ── 场景结束面板（多步骤）── */}
      {sceneEndStep && (() => {
        const charName  = activeChar?.name || "ta";
        const cfg       = activeThread?.sceneConfig || {};
        const today     = new Date().toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }).replace(/\//g, "/");
        const dateLabel = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "/");

        // ── 关闭 scene（先执行，防止重复触发）──
        const doClose = () => {
          closeSceneThread?.(activeThreadId);
        };

        // ── 构建宝库 markdown 内容 ──
        const buildTreasureContent = () => {
          const title = `和${charName}的${cfg.scene || "亲密邀请"} · ${dateLabel}`;
          const convoLines = messages
            .filter((m) => !m.isSceneOpening && (m.role === "user" || m.role === "bot") && (m.content || "").trim())
            .map((m) => {
              const who = m.role === "user" ? "声声" : charName;
              return `${who}：${m.content}`;
            });
          const parts = [
            `# ${title}`,
            "",
            cfg.scene      ? `【场景】\n${cfg.scene}` : null,
            cfg.mood       ? `【氛围】\n${cfg.mood}` : null,
            cfg.preface    ? `【前情提要】\n${cfg.preface}` : null,
            cfg.invitation ? `【邀请内容】\n${cfg.invitation}` : null,
            convoLines.length ? `【完整对话】\n${convoLines.join("\n")}` : null,
          ].filter(Boolean);
          return { title, markdown: parts.join("\n\n") };
        };

        // ── 构建时间线默认字段 ──
        const buildTimelineFields = () => {
          const title = `和${charName}的${cfg.scene || "亲密邀请"}`;
          return {
            loverId:     activeCharId,
            title,
            description: `来自一次亲密邀请。${cfg.scene ? `\n\n场景：${cfg.scene}` : ""}${cfg.mood ? `\n氛围：${cfg.mood}` : ""}`,
            eventType:   "heart_moment",
            occurredAt:  new Date().toISOString().split("T")[0],
            source:      "scene",
            sourceIds:   activeThreadId ? [activeThreadId] : [],
            sourceRefs: [
              buildSourceRef({
                sourceType:  "scene",
                sourceId:    activeThreadId || "",
                sourceTitle: title,
                excerpt:     (cfg.invitation || cfg.scene || "").slice(0, 80),
              }),
            ],
            importance:  3,
            pinned:      false,
          };
        };

        // ── 共用外层 overlay ──
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(6,3,15,.65)",
              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setSceneEndStep(null); }}
          >
            <div style={{
              width: "100%", maxWidth: 480,
              background: "linear-gradient(160deg, rgba(20,12,38,.98) 0%, rgba(14,9,28,.97) 100%)",
              borderRadius: "22px 22px 0 0",
              padding: "28px 24px calc(28px + env(safe-area-inset-bottom, 0px))",
              boxShadow: "0 -12px 48px rgba(0,0,0,.55)",
              border: "1px solid rgba(120,80,200,.15)",
              borderBottom: "none",
            }}>

              {/* ── 步骤：choose ── */}
              {sceneEndStep === "choose" && (
                <>
                  <div style={{ textAlign: "center", marginBottom: 22 }}>
                    <div style={{ fontSize: 22, marginBottom: 10, opacity: 0.55 }}>🌠</div>
                    <div style={{ fontSize: 15, color: "rgba(230,210,255,.88)", fontWeight: 400, letterSpacing: 1, marginBottom: 8 }}>
                      今晚先到这里吗？
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(165,140,215,.5)", lineHeight: 1.9 }}>
                      要把这次邀请怎么收好？
                    </div>
                  </div>

                  {/* 收藏到宝库 */}
                  <button
                    onClick={() => {
                      const now = Date.now();
                      const { title, markdown } = buildTreasureContent();
                      onSaveTreasure?.({
                        id:               `treasure-${now}-${Math.random().toString(36).slice(2, 6)}`,
                        title,
                        content:          markdown,
                        type:             "scene",
                        tagsRaw:          "亲密邀请,场景",
                        note:             "",
                        important:        false,
                        canUseForMemory:  false,
                        sourceCharId:     activeCharId,
                        sourceCharName:   charName,
                        sourceThreadId:   activeThreadId,
                        sourceMessageId:  null,
                        sourceRefs: [
                          buildSourceRef({
                            sourceType:  "scene",
                            sourceId:    activeThreadId || "",
                            sourceTitle: title,
                            excerpt:     (cfg.invitation || cfg.scene || "").slice(0, 80),
                          }),
                        ],
                        createdAt: now,
                      });
                      doClose();
                      setSceneEndStep("treasure_done");
                    }}
                    style={{
                      width: "100%", padding: "13px", marginBottom: 10, borderRadius: 14,
                      background: "rgba(110,70,200,.18)", border: "1px solid rgba(140,100,230,.28)",
                      color: "rgba(210,185,255,.9)", fontSize: 14, cursor: "pointer",
                      fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                  >
                    <span>💎</span>
                    <span>收藏整段到宝库</span>
                  </button>

                  {/* 记下这一刻 */}
                  <button
                    onClick={() => {
                      onAddChatToTimeline?.(buildTimelineFields());
                      doClose();
                      setSceneEndStep("timeline_done");
                    }}
                    style={{
                      width: "100%", padding: "13px", marginBottom: 10, borderRadius: 14,
                      background: "rgba(80,55,150,.16)", border: "1px solid rgba(120,90,200,.22)",
                      color: "rgba(190,165,240,.85)", fontSize: 14, cursor: "pointer",
                      fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                  >
                    <span>🕰</span>
                    <span>记下这一刻</span>
                  </button>

                  {/* 只结束 */}
                  <button
                    onClick={() => {
                      doClose();
                      setSceneEndStep(null);
                    }}
                    style={{
                      width: "100%", padding: "11px", marginBottom: 10, borderRadius: 14,
                      background: "rgba(255,255,255,.03)", border: "1px solid rgba(150,120,220,.15)",
                      color: "rgba(165,140,210,.6)", fontSize: 13, cursor: "pointer",
                      fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                  >只结束，不收藏</button>

                  {/* 取消 */}
                  <button
                    onClick={() => setSceneEndStep(null)}
                    style={{
                      width: "100%", padding: "9px", borderRadius: 12,
                      background: "none", border: "none",
                      color: "rgba(130,100,190,.45)", fontSize: 12, cursor: "pointer",
                      fontFamily: "var(--font-main)", letterSpacing: 0.5,
                    }}
                  >取消，再陪我一会儿</button>
                </>
              )}

              {/* ── 步骤：treasure_done ── */}
              {sceneEndStep === "treasure_done" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 12, opacity: 0.7 }}>💎</div>
                  <div style={{ fontSize: 14, color: "rgba(220,200,255,.85)", letterSpacing: 1, marginBottom: 8 }}>
                    已经把这次邀请收藏进宝库了。
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(155,130,210,.5)", lineHeight: 1.9, marginBottom: 24 }}>
                    随时可以在宝库里找到它。
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => { setSceneEndStep(null); navigateTo("treasure"); }}
                      style={{
                        flex: 1, padding: "11px", borderRadius: 12, fontSize: 12,
                        background: "rgba(110,70,200,.2)", border: "1px solid rgba(140,100,230,.28)",
                        color: "rgba(210,185,255,.85)", cursor: "pointer",
                        fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      }}
                    >去宝库看看</button>
                    <button
                      onClick={() => setSceneEndStep(null)}
                      style={{
                        flex: 1, padding: "11px", borderRadius: 12, fontSize: 12,
                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(150,120,220,.15)",
                        color: "rgba(165,140,210,.6)", cursor: "pointer",
                        fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      }}
                    >留在这里</button>
                  </div>
                </div>
              )}

              {/* ── 步骤：timeline_done ── */}
              {sceneEndStep === "timeline_done" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 12, opacity: 0.7 }}>🕰</div>
                  <div style={{ fontSize: 14, color: "rgba(220,200,255,.85)", letterSpacing: 1, marginBottom: 8 }}>
                    已经把这一刻放进回忆里了。
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(155,130,210,.5)", lineHeight: 1.9, marginBottom: 24 }}>
                    在关系时间线里可以找到它。
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => { setSceneEndStep(null); navigateTo("timeline"); }}
                      style={{
                        flex: 1, padding: "11px", borderRadius: 12, fontSize: 12,
                        background: "rgba(80,55,150,.22)", border: "1px solid rgba(120,90,200,.25)",
                        color: "rgba(190,165,240,.85)", cursor: "pointer",
                        fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      }}
                    >去时间线看看</button>
                    <button
                      onClick={() => setSceneEndStep(null)}
                      style={{
                        flex: 1, padding: "11px", borderRadius: 12, fontSize: 12,
                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(150,120,220,.15)",
                        color: "rgba(165,140,210,.6)", cursor: "pointer",
                        fontFamily: "var(--font-main)", letterSpacing: 0.5,
                      }}
                    >留在这里</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* ── 聊天背景设置面板 ── */}
      {showChatBgPanel && (
        <ChatBgPanel
          activeChar={activeChar}
          onSave={(settings) => updateCharUiSettings?.(activeCharId, settings)}
          onClose={() => setShowChatBgPanel(false)}
        />
      )}

      {/* ── 注入面板（场景模式）── */}
      {showInjectPanel && isSceneMode && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 180, background: "rgba(6,3,15,.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={() => setShowInjectPanel(false)}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 181,
            background: "linear-gradient(180deg,#1a1030 0%,#130d25 100%)",
            borderTop: "1px solid rgba(130,90,220,.2)",
            borderRadius: "18px 18px 0 0",
            padding: "20px 20px calc(20px + env(safe-area-inset-bottom,0px))",
            maxHeight: "72vh", overflowY: "auto",
          }}>
            {/* 标题行 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(210,185,255,.85)", letterSpacing: 1 }}>注入 Prompt 内容</span>
              <button onClick={() => setShowInjectPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(155,120,210,.5)", padding: "0 2px" }}>✕</button>
            </div>

            {/* 场景配置预览 */}
            {(() => {
              const cfg = activeThread?.sceneConfig || {};
              const fields = [
                { label: "场景", value: cfg.scene },
                { label: "氛围", value: cfg.mood },
                { label: "前情提要", value: cfg.preface },
                { label: "邀请内容", value: cfg.invitation },
              ].filter(f => f.value?.trim());
              return fields.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "rgba(140,110,200,.5)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>已注入的场景设定</div>
                  {fields.map(f => (
                    <div key={f.label} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "rgba(155,120,210,.6)", marginBottom: 2 }}>{f.label}</div>
                      <div style={{
                        fontSize: 12, color: "rgba(195,170,240,.7)", lineHeight: 1.65,
                        background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "6px 10px",
                        border: "1px solid rgba(110,75,200,.12)",
                      }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* 分割线 */}
            <div style={{ height: 1, background: "rgba(130,90,220,.12)", marginBottom: 14 }} />

            {/* 补充指示 textarea */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "rgba(140,110,200,.5)", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>补充指示</div>
              <div style={{ fontSize: 11, color: "rgba(140,110,190,.45)", marginBottom: 8, lineHeight: 1.6 }}>
                告诉他这次你希望怎样，你的状态，想要的感觉……会直接注入到 Prompt 里，对他可见。
              </div>
              <textarea
                value={sceneNote || ""}
                onChange={e => setSceneNote?.(e.target.value)}
                placeholder="比如：今天状态很敏感，说话轻一点。希望你主动一点，不要等我问。"
                style={{
                  width: "100%", boxSizing: "border-box",
                  minHeight: 90, resize: "none",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(130,90,220,.2)",
                  borderRadius: 10, padding: "10px 12px",
                  fontSize: 13, color: "rgba(210,185,255,.85)",
                  fontFamily: "var(--font-main)", lineHeight: 1.7,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {sceneNote?.trim() && (
                <button
                  onClick={() => setSceneNote?.("")}
                  style={{
                    padding: "7px 14px", borderRadius: 10, fontSize: 11,
                    background: "none", border: "1px solid rgba(150,100,200,.18)",
                    color: "rgba(155,120,210,.5)", cursor: "pointer",
                    fontFamily: "var(--font-main)", letterSpacing: 0.5,
                  }}
                >清空</button>
              )}
              <button
                onClick={() => setShowInjectPanel(false)}
                style={{
                  padding: "7px 20px", borderRadius: 10, fontSize: 12,
                  background: "rgba(100,60,200,.22)", border: "1px solid rgba(150,100,240,.3)",
                  color: "rgba(200,175,255,.9)", cursor: "pointer",
                  fontFamily: "var(--font-main)", letterSpacing: 0.5,
                }}
              >好了</button>
            </div>
          </div>
        </>
      )}

      {/* ── 回复模式切换 ── */}
      <div style={{
        display: "flex", justifyContent: "center",
        padding: "5px 16px 2px",
        background: S ? S.replyBarBg : "rgba(248,244,252,.95)",
        borderTop: S
          ? `1px solid ${S.replyBarBd}`
          : (attachView === "grid" ? "none" : "1px solid rgba(196,166,184,.1)"),
        flexShrink: 0,
        backdropFilter: S ? "blur(16px)" : undefined,
        WebkitBackdropFilter: S ? "blur(16px)" : undefined,
      }}>
        <div style={{
          display: "inline-flex",
          background: S ? "rgba(255,255,255,.06)" : "rgba(196,166,184,.15)",
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
                background: replyMode === m.value
                  ? (S ? S.replyActiveBg : "rgba(255,255,255,.92)")
                  : "transparent",
                color: replyMode === m.value
                  ? (S ? S.replyActiveTxt : "#5a4a6a")
                  : (S ? S.replyTxt : "#9a8aac"),
                fontSize: 11,
                fontWeight: replyMode === m.value ? 500 : 400,
                cursor: "pointer",
                fontFamily: "var(--font-main)",
                letterSpacing: 0.5,
                transition: "all .2s",
                boxShadow: (replyMode === m.value && !S) ? "0 1px 4px rgba(74,69,96,.1)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 输入栏 ── */}
      <div
        className="input-bar"
        style={S ? {
          background: S.inputBarBg,
          backdropFilter: "blur(20px)",
          borderTop: `1px solid ${S.inputBarBd}`,
        } : undefined}
      >

        <button
          onClick={() => setAttachView((v) => v ? null : "grid")}
          title="更多工具"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22,
            color: S
              ? (attachView ? "rgba(160,120,240,.8)" : "rgba(140,100,220,.45)")
              : (attachView ? "var(--accent-dusk)" : "var(--text-faint)"),
            padding: "6px 6px 6px 2px",
            lineHeight: 1, transition: "color .2s, transform .2s",
            transform: attachView === "grid" ? "rotate(45deg)" : "none",
            flexShrink: 0,
          }}
        >+</button>

        <textarea
          className="input-field"
          placeholder={S ? `轻声说…` : `想对${activeChar?.name || "ta"}说点什么…`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            resize: "none", overflow: "hidden",
            lineHeight: "1.5", minHeight: "42px", maxHeight: "120px",
            ...(S ? {
              background: S.inputFieldBg,
              border: `1px solid ${S.inputFieldBd}`,
              color: S.inputTxt,
            } : {}),
          }}
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
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
          style={S ? { background: S.sendBtnBg, boxShadow: "0 2px 12px rgba(60,30,120,.3)" } : undefined}
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
                    sourceMessageId: treasureTarget.id || null,
                    sourceRefs: [
                      buildSourceRef({
                        sourceType:  "chat",
                        sourceId:    treasureTarget.id || "",
                        sourceTitle: activeChar?.name || "",
                        excerpt:     (treasureTarget.content || "").slice(0, 80),
                      }),
                    ],
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

      {/* ── 让他珍藏弹窗 ── */}
      {charTreasureTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(74,69,96,.38)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setCharTreasureTarget(null); }}
        >
          <div style={{
            width: "100%", maxWidth: 480,
            background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
            overflow: "hidden",
          }}>
            {/* 顶栏 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px 12px",
              borderBottom: "1px solid rgba(196,166,184,.18)",
            }}>
              <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
                💝 要把这句话交给他收好吗？
              </span>
              <button
                onClick={() => setCharTreasureTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9a8aac", padding: 4 }}
              >✕</button>
            </div>

            <div style={{ padding: "14px 18px 32px" }}>
              {/* 内容预览 */}
              <div style={{
                background: "rgba(255,255,255,.65)",
                border: "1px solid rgba(196,166,184,.22)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 14,
                fontSize: 13, color: "#5a4a6a", lineHeight: 1.75,
                maxHeight: 100, overflow: "hidden",
              }}>
                {(charTreasureTarget.content || "").slice(0, 120)}
                {(charTreasureTarget.content || "").length > 120 ? "…" : ""}
              </div>

              {/* 备注输入 */}
              <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
                我希望 ta 记得为什么这句话重要（可不填）
              </label>
              <CharTreasureNoteInput
                onConfirm={(note) => {
                  if (!onAddCharTreasure || !activeCharId) return;
                  onAddCharTreasure({
                    charId:     activeCharId,
                    sourceType: "message",
                    sourceId:   charTreasureTarget.id || null,
                    content:    charTreasureTarget.content,
                    note:       note,
                    authorType: "user",
                    pinned:     false,
                    sourceRefs: [
                      buildSourceRef({
                        sourceType:  "chat",
                        sourceId:    charTreasureTarget.id || "",
                        sourceTitle: activeChar?.name || "",
                        excerpt:     (charTreasureTarget.content || "").slice(0, 80),
                      }),
                    ],
                  });
                  setCharTreasureSaved(true);
                  setTimeout(() => {
                    setCharTreasureTarget(null);
                    setCharTreasureSaved(false);
                  }, 900);
                }}
                saved={charTreasureSaved}
                charName={activeChar?.name || "ta"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 让他珍藏：备注输入 + 确认（内部组件，避免 hook 顺序问题）──
function CharTreasureNoteInput({ onConfirm, saved, charName }) {
  const [note, setNote] = useState("");
  return (
    <>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="比如：这是我第一次告诉他…"
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
          border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
          fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)",
          outline: "none", resize: "none", lineHeight: 1.7, marginBottom: 14,
        }}
      />
      {saved ? (
        <div style={{ textAlign: "center", padding: "10px 0", fontSize: 13, color: "#7a6a8e" }}>
          💝 已放进 {charName} 的宝库
        </div>
      ) : (
        <button
          onClick={() => onConfirm(note.trim())}
          style={{
            width: "100%", padding: "12px", borderRadius: 14,
            background: "rgba(120,100,160,.85)", border: "none",
            color: "white", fontSize: 14, cursor: "pointer",
            fontFamily: "var(--font-main)", letterSpacing: 1,
          }}
        >
          💝 放进他的宝库
        </button>
      )}
    </>
  );
}
