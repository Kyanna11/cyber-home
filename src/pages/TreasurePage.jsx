// ─── 我的宝库页 ───
// 收藏心动的话、故事、小作文和想珍藏的原文

import { useState, useMemo } from "react";
import BackButton from "../components/BackButton";
import { TREASURE_TYPES } from "../constants";
import { EVENT_TYPES } from "./TimelinePage";

// ── 工具 ──
function typeInfo(type) {
  return TREASURE_TYPES.find((t) => t.value === type) || { label: "其他", emoji: "🎁" };
}

// 宝物类型 → 时间线事件类型的推断
function treasureTypeToEventType(treasureType) {
  if (["quote", "comfort", "letter"].includes(treasureType)) return "sweet";
  if (["story", "essay"].includes(treasureType)) return "milestone";
  return "other";
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function genTreasureId() {
  return `treasure-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── 手动添加 / 编辑弹窗 ──
function TreasureEditor({ initial, onSave, onClose }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    title:     initial?.title     || "",
    content:   initial?.content   || "",
    type:      initial?.type      || "quote",
    tagsRaw:   (initial?.tags || []).join(" "),
    note:      initial?.note      || "",
    important: initial?.important || false,
  });

  const canSave = form.content.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...(initial || {}),
      id:        initial?.id || genTreasureId(),
      title:     form.title.trim() || form.content.slice(0, 20),
      content:   form.content,
      type:      form.type,
      tags:      form.tagsRaw.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
      note:      form.note.trim(),
      important: form.important,
      sourceCharId:   initial?.sourceCharId   || null,
      sourceCharName: initial?.sourceCharName || "",
      sourceThreadId: initial?.sourceThreadId || null,
      sourceMessageId: initial?.sourceMessageId || null,
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
      canUseForMemory: initial?.canUseForMemory || false,
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(74,69,96,.35)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
            {isNew ? "✍️ 手动收藏" : "✏️ 编辑宝物"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 24px" }}>
          {/* 类型选择 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {TREASURE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                style={{
                  padding: "4px 11px", borderRadius: 20, fontSize: 12,
                  cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                  background: form.type === t.value ? "rgba(120,100,160,.85)" : "rgba(255,255,255,.7)",
                  color: form.type === t.value ? "white" : "#7a6a8e",
                  border: `1px solid ${form.type === t.value ? "transparent" : "rgba(196,166,184,.3)"}`,
                }}
              >{t.emoji} {t.label}</button>
            ))}
          </div>

          {/* 标题 */}
          <input
            type="text"
            placeholder="给这段内容起个名字…（留空则取正文前 20 字）"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px", borderRadius: 10, fontSize: 13, color: "#5a4a6a",
              background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
              fontFamily: "var(--font-main)", outline: "none", marginBottom: 10,
            }}
          />

          {/* 正文 */}
          <textarea
            placeholder="粘贴想珍藏的内容…"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            autoFocus={isNew}
            style={{
              width: "100%", boxSizing: "border-box",
              minHeight: 110, padding: "8px 10px", borderRadius: 10, fontSize: 13,
              color: "#5a4a6a", background: "rgba(255,255,255,.7)",
              border: "1px solid rgba(196,166,184,.3)",
              fontFamily: "var(--font-main)", outline: "none",
              resize: "none", lineHeight: 1.8, marginBottom: 10,
            }}
          />

          {/* 标签 */}
          <input
            type="text"
            placeholder="标签（空格分隔，可选）"
            value={form.tagsRaw}
            onChange={(e) => setForm((f) => ({ ...f, tagsRaw: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px", borderRadius: 10, fontSize: 12, color: "#7a6a8e",
              background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.25)",
              fontFamily: "var(--font-main)", outline: "none", marginBottom: 10,
            }}
          />

          {/* 备注 */}
          <textarea
            placeholder="备注（自己的感受或来源说明，可选）"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box",
              minHeight: 56, padding: "8px 10px", borderRadius: 10, fontSize: 12,
              color: "#7a6a8e", background: "rgba(255,255,255,.6)",
              border: "1px solid rgba(196,166,184,.25)",
              fontFamily: "var(--font-main)", outline: "none",
              resize: "none", lineHeight: 1.7, marginBottom: 12,
            }}
          />

          {/* 重要标记 */}
          <div
            onClick={() => setForm((f) => ({ ...f, important: !f.important }))}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 20 }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `1.5px solid ${form.important ? "#c08030" : "rgba(196,166,184,.4)"}`,
              background: form.important ? "rgba(200,140,60,.15)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#c08030", flexShrink: 0, transition: "all .15s",
            }}>
              {form.important ? "★" : ""}
            </div>
            <span style={{ fontSize: 12, color: form.important ? "#8a6020" : "#9a8aac" }}>
              标记为重要宝物
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: canSave ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none", color: canSave ? "white" : "#9a8aac",
              fontSize: 14, cursor: canSave ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 1, transition: "all .2s",
            }}
          >💎 {isNew ? "存进宝库" : "保存修改"}</button>
        </div>
      </div>
    </div>
  );
}

// ── 操作按钮样式辅助 ──
function ActionBtn({ emoji, label, sub, onClick, disabled, color }) {
  const base = {
    flex: 1, minWidth: 0, padding: "10px 8px", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-main)", textAlign: "center", transition: "all .15s",
    border: `1px solid ${disabled ? "rgba(196,166,184,.15)" : color ? `${color}30` : "rgba(196,166,184,.25)"}`,
    background: disabled ? "rgba(255,255,255,.3)" : color ? `${color}0a` : "rgba(255,255,255,.7)",
    opacity: disabled ? 0.45 : 1,
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={base}>
      <div style={{ fontSize: 18, marginBottom: 3 }}>{emoji}</div>
      <div style={{ fontSize: 12, color: disabled ? "var(--text-faint)" : (color || "#5a4a6a"), fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>}
    </button>
  );
}

// ── 继续写下去确认面板 ──
const CONTINUE_MODES = [
  { value: "continue", label: "继续写下去" },
  { value: "expand",   label: "扩写成更完整的一篇" },
  { value: "custom",   label: "自定义要求" },
];

function TreasureContinuePanel({ treasure, characters, activeCharId, onConfirm, onClose }) {
  const defaultCharId = activeCharId || characters[0]?.id || "";
  const [targetCharId, setTargetCharId] = useState(defaultCharId);
  const [mode, setMode]       = useState("continue");
  const [customText, setCustomText] = useState("");
  const ti = typeInfo(treasure.type);
  const canConfirm = targetCharId && (mode !== "custom" || customText.trim().length > 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(74,69,96,.35)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "90vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>✍️ 继续写下去</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 28px" }}>
          {/* 宝物预览 */}
          <div style={{
            padding: "10px 12px", borderRadius: 10, marginBottom: 16,
            background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.2)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 4 }}>
              {ti.emoji} {treasure.title || treasure.content.slice(0, 24)}
              {treasure.sourceCharName ? ` · 来自 ${treasure.sourceCharName}` : ""}
            </div>
            <div style={{
              fontSize: 12, color: "#5a4a6a", lineHeight: 1.7,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
              whiteSpace: "pre-wrap",
            }}>{treasure.content}</div>
          </div>

          {/* 续写方式 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 8 }}>续写方式</div>
            {CONTINUE_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                style={{
                  display: "block", width: "100%",
                  padding: "9px 14px", borderRadius: 10, fontSize: 13, textAlign: "left",
                  cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                  marginBottom: 6,
                  background: mode === m.value ? "rgba(120,100,160,.12)" : "rgba(255,255,255,.6)",
                  border: `1px solid ${mode === m.value ? "rgba(120,100,160,.4)" : "rgba(196,166,184,.2)"}`,
                  color: mode === m.value ? "#5a4a8a" : "#7a6a8e",
                }}
              >{mode === m.value ? "✓ " : ""}{m.label}</button>
            ))}
          </div>

          {/* 自定义输入 */}
          {mode === "custom" && (
            <textarea
              autoFocus
              placeholder="说说你想要什么…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                minHeight: 72, padding: "8px 10px", borderRadius: 10, fontSize: 13,
                color: "#5a4a6a", background: "rgba(255,255,255,.7)",
                border: "1px solid rgba(196,166,184,.3)",
                fontFamily: "var(--font-main)", outline: "none",
                resize: "none", lineHeight: 1.8, marginBottom: 14,
              }}
            />
          )}

          {/* 选择入住者（多于 1 人时显示） */}
          {characters.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 8 }}>发给谁写</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setTargetCharId(char.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12,
                      cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                      background: targetCharId === char.id ? "rgba(120,100,160,.85)" : "rgba(255,255,255,.7)",
                      color: targetCharId === char.id ? "white" : "#7a6a8e",
                      border: `1px solid ${targetCharId === char.id ? "transparent" : "rgba(196,166,184,.3)"}`,
                    }}
                  >{char.name || "未命名"}</button>
                ))}
              </div>
            </div>
          )}

          {characters.length === 0 && (
            <div style={{ padding: "12px 0", fontSize: 12, color: "var(--text-faint)", textAlign: "center", marginBottom: 14 }}>
              家里还没有入住者，先去「成员档案」添加一位吧
            </div>
          )}

          <button
            onClick={() => canConfirm && onConfirm(targetCharId, mode, customText)}
            disabled={!canConfirm}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: canConfirm ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none", color: canConfirm ? "white" : "#9a8aac",
              fontSize: 14, cursor: canConfirm ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 1, transition: "all .2s",
            }}
          >✍️ 发给ta写</button>
        </div>
      </div>
    </div>
  );
}

// ── 记下这一刻 · 添加到时间线面板 ──
function TreasureToTimelinePanel({ treasure, characters, activeCharId, onSave, onNavigateTimeline, onClose }) {
  const defaultCharId = activeCharId || characters[0]?.id || "";
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    loverId:     defaultCharId,
    title:       treasure.title || treasure.content.slice(0, 30),
    description: treasure.content.slice(0, 300),
    eventType:   treasureTypeToEventType(treasure.type),
    occurredAt:  today,
    emotion:     "",
    importance:  treasure.important ? 4 : 3,
    pinned:      false,
    note:        "",
  });
  const [done, setDone] = useState(false);

  const canConfirm = form.loverId && form.title.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onSave({
      ...form,
      title:    form.title.trim(),
      source:   "treasure",
      sourceIds: treasure.id ? [treasure.id] : [],
      sourceRefs: treasure.id ? [{
        sourceType:  "treasure",
        sourceId:    treasure.id,
        sourceTitle: treasure.title || "",
        excerpt:     (treasure.content || "").slice(0, 80),
      }] : [],
    });
    setDone(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(74,69,96,.35)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
      }}>

        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>🕰 记下这一刻</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {done ? (
          /* ── 成功状态 ── */
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
                onClick={() => { onNavigateTimeline?.(form.loverId); onClose(); }}
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
              >留在宝库</button>
            </div>
          </div>
        ) : (
          /* ── 填写表单 ── */
          <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 32px" }}>

            {/* 宝物预览 */}
            <div style={{
              padding: "9px 12px", borderRadius: 10, marginBottom: 16,
              background: "rgba(255,255,255,.55)", border: "1px solid rgba(196,166,184,.2)",
            }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 3 }}>
                {typeInfo(treasure.type).emoji} {treasure.title || treasure.content.slice(0, 28)}
              </div>
              <div style={{
                fontSize: 12, color: "#5a4a6a", lineHeight: 1.7,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                whiteSpace: "pre-wrap",
              }}>{treasure.content}</div>
            </div>

            {/* 入住者选择（多于1人显示） */}
            {characters.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>记入谁的时间线</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {characters.map((char) => (
                    <button key={char.id} onClick={() => setForm((f) => ({ ...f, loverId: char.id }))}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12,
                        cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                        background: form.loverId === char.id ? "rgba(120,100,160,.85)" : "rgba(255,255,255,.7)",
                        color: form.loverId === char.id ? "white" : "#7a6a8e",
                        border: `1px solid ${form.loverId === char.id ? "transparent" : "rgba(196,166,184,.3)"}`,
                      }}
                    >{char.name || "未命名"}</button>
                  ))}
                </div>
              </div>
            )}
            {characters.length === 0 && (
              <div style={{ padding: "10px 0 14px", fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
                家里还没有入住者，先去「成员档案」添加一位吧
              </div>
            )}

            {/* 标题 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>这一刻的名字</div>
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

            {/* 事件类型 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 7 }}>事件类型</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EVENT_TYPES.map((et) => (
                  <button key={et.key} onClick={() => setForm((f) => ({ ...f, eventType: et.key }))}
                    style={{
                      padding: "5px 11px", borderRadius: 20, fontSize: 12,
                      cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                      background: form.eventType === et.key ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.65)",
                      border: `1px solid ${form.eventType === et.key ? "rgba(120,100,160,.45)" : "rgba(196,166,184,.22)"}`,
                      color: form.eventType === et.key ? "#5a4a8a" : "#7a6a8e",
                    }}
                  >{et.emoji} {et.label}</button>
                ))}
              </div>
            </div>

            {/* 发生日期 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>发生时间</div>
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
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>情绪标签（可选）</div>
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
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>
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
                fontSize: 12, color: "#7a5aaa", flexShrink: 0, transition: "all .15s",
              }}>
                {form.pinned ? "📌" : ""}
              </div>
              <span style={{ fontSize: 12, color: form.pinned ? "#5a4a8a" : "#9a8aac" }}>置顶这条记忆</span>
            </div>

            {/* 备注 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 6 }}>备注（可选）</div>
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
            >🕰 放进回忆里</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 宝物详情面板 ──
function TreasureDetail({ treasure, onSave, onDelete, onClose, onCreateNoteFromTreasure, characters, activeCharId, onContinueFromTreasure, onAddTreasureToTimeline, onOpenTimeline }) {
  const [editing, setEditing]             = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback]   = useState(false);
  const [showContinuePanel, setShowContinuePanel] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);
  const ti = typeInfo(treasure.type);

  if (editing) {
    return (
      <TreasureEditor
        initial={treasure}
        onSave={(t) => { onSave(t); setEditing(false); }}
        onClose={() => setEditing(false)}
      />
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(treasure.content).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    }).catch(() => {
      // fallback: select & execCommand
      const el = document.createElement("textarea");
      el.value = treasure.content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    });
  };

  const handleToggleImportant = () => {
    onSave({ ...treasure, important: !treasure.important, updatedAt: Date.now() });
  };

  return (
    <>
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
      background: "rgba(74,69,96,.3)",
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
      }}>

        {/* ── 顶栏 ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{ti.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5a4a6a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {treasure.title || treasure.content.slice(0, 28)}
            </div>
            {/* 元信息行 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-faint)", background: "rgba(196,166,184,.15)", padding: "1px 6px", borderRadius: 7 }}>{ti.label}</span>
              {treasure.sourceCharName && (
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>来自 {treasure.sourceCharName}</span>
              )}
              {treasure.createdAt > 0 && (
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{fmtDate(treasure.createdAt)}</span>
              )}
              {treasure.important && (
                <span style={{ fontSize: 12, color: "#c08030" }}>★ 重要</span>
              )}
              {treasure._dupHint && (
                <span title="同一来源已有其他宝库条目，可能重复" style={{
                  fontSize: 12, padding: "1px 6px", borderRadius: 6,
                  background: "rgba(180,140,60,.12)", color: "#a07828",
                  border: "1px solid rgba(180,140,60,.22)",
                }}>同源</span>
              )}
            </div>
          </div>
          {/* 右侧操作 */}
          <button
            onClick={handleToggleImportant}
            title={treasure.important ? "取消重要标记" : "标记为重要"}
            style={{
              background: treasure.important ? "rgba(200,140,60,.15)" : "transparent",
              border: `1px solid ${treasure.important ? "rgba(200,140,60,.35)" : "rgba(196,166,184,.3)"}`,
              borderRadius: 8, padding: "4px 8px", cursor: "pointer",
              fontSize: 14, color: treasure.important ? "#c08030" : "#c0b090",
              transition: "all .2s", flexShrink: 0,
            }}
          >★</button>
          <button
            onClick={() => setEditing(true)}
            style={{ background: "rgba(196,166,184,.15)", border: "1px solid rgba(196,166,184,.3)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)", flexShrink: 0 }}
          >编辑</button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: "4px 2px", flexShrink: 0 }}>✕</button>
        </div>

        {/* ── 正文区 ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 0" }}>

          {/* 原文 */}
          <div style={{
            fontSize: 14, color: "#4a3a5a", lineHeight: 1.95,
            whiteSpace: "pre-wrap", letterSpacing: 0.3,
          }}>
            {treasure.content}
          </div>

          {/* 备注 */}
          {treasure.note && (
            <div style={{
              marginTop: 14, padding: "10px 12px", borderRadius: 10,
              background: "rgba(196,166,184,.1)", border: "1px solid rgba(196,166,184,.18)",
              fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7,
            }}>
              <span style={{ fontSize: 12, color: "var(--text-faint)", display: "block", marginBottom: 3 }}>备注</span>
              {treasure.note}
            </div>
          )}

          {/* 标签 */}
          {(treasure.tags || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {treasure.tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, background: "rgba(196,166,184,.12)", color: "#9a8aac" }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* ── 操作区 ── */}
          <div style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: "1px solid rgba(196,166,184,.15)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1.5, marginBottom: 12 }}>操作</div>

            {/* 第一行：已实现操作 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <ActionBtn
                emoji={copyFeedback ? "✓" : "📋"}
                label={copyFeedback ? "已复制" : "复制全文"}
                onClick={handleCopy}
                color="#6a7aae"
              />
              <ActionBtn
                emoji="📓"
                label="写进手札"
                onClick={() => {
                  onCreateNoteFromTreasure?.(treasure);
                  onClose();
                }}
                color="#9a70b0"
              />
            </div>

            {/* 第二行 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <ActionBtn
                emoji="🕰"
                label="记下这一刻"
                onClick={() => setShowTimelinePanel(true)}
                color="#7aadcc"
              />
              <ActionBtn emoji="💡" label="帮我记住"   sub="稍后开放" disabled />
              <ActionBtn
                emoji="✍️"
                label="继续写下去"
                onClick={() => setShowContinuePanel(true)}
                color="#7a6a8e"
              />
            </div>

            {/* 复制成功提示 */}
            {copyFeedback && (
              <div style={{
                textAlign: "center", fontSize: 12, color: "#4a7a6a",
                padding: "6px 0", marginBottom: 4,
                animation: "fadeIn .2s ease-out",
              }}>
                已经复制到剪贴板啦。
              </div>
            )}
          </div>

          {/* ── 删除区 ── */}
          <div style={{ marginTop: 14, marginBottom: 24 }}>
            {showDeleteConfirm ? (
              <div style={{ padding: "12px", borderRadius: 12, background: "rgba(200,100,100,.06)", border: "1px solid rgba(200,100,100,.15)" }}>
                <div style={{ fontSize: 12, color: "#9a5050", textAlign: "center", marginBottom: 10 }}>确认删除这条宝物？</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "transparent", border: "1px solid rgba(196,166,184,.3)", fontSize: 12, color: "#9a8aac", cursor: "pointer", fontFamily: "var(--font-main)" }}>再想想</button>
                  <button onClick={() => onDelete(treasure.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(200,100,100,.12)", border: "1px solid rgba(200,100,100,.2)", fontSize: 12, color: "#9a5050", cursor: "pointer", fontFamily: "var(--font-main)" }}>删除</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ width: "100%", padding: "8px", borderRadius: 10, background: "transparent", border: "1px solid rgba(196,166,184,.15)", fontSize: 12, color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)" }}>🗑 删除这条宝物</button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* 继续写下去确认面板 */}
    {showContinuePanel && (
      <TreasureContinuePanel
        treasure={treasure}
        characters={characters || []}
        activeCharId={activeCharId}
        onConfirm={(charId, mode, customText) => {
          onContinueFromTreasure?.(treasure, charId, mode, customText);
          setShowContinuePanel(false);
          onClose();
        }}
        onClose={() => setShowContinuePanel(false)}
      />
    )}

    {/* 记下这一刻面板 */}
    {showTimelinePanel && (
      <TreasureToTimelinePanel
        treasure={treasure}
        characters={characters || []}
        activeCharId={activeCharId}
        onSave={(fields) => {
          onAddTreasureToTimeline?.({
            ...fields,
            source: "treasure",
            sourceIds: [treasure.id],
          });
        }}
        onNavigateTimeline={(loverId) => {
          setShowTimelinePanel(false);
          onClose();
          onOpenTimeline?.(loverId);
        }}
        onClose={() => setShowTimelinePanel(false)}
      />
    )}
    </>
  );
}

// ════════════════════════════════════════════
// ── 主页面 ──
// ════════════════════════════════════════════
export default function TreasurePage({
  navigateTo,
  treasures,
  onSaveTreasure,
  onDeleteTreasure,
  characters,
  onCreateNoteFromTreasure,
  activeCharId,
  onContinueFromTreasure,
  onAddTreasureToTimeline,
  onOpenTimeline,
}) {
  const [filterType, setFilterType]   = useState("all");
  const [searchText, setSearchText]   = useState("");
  const [detailItem, setDetailItem]   = useState(null);
  const [showEditor, setShowEditor]   = useState(false);

  const filtered = useMemo(() => {
    let list = [...(treasures || [])].sort((a, b) => b.createdAt - a.createdAt);
    if (filterType !== "all") list = list.filter((t) => t.type === filterType);
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter((t) =>
        t.content.toLowerCase().includes(kw) ||
        (t.title || "").toLowerCase().includes(kw) ||
        (t.note  || "").toLowerCase().includes(kw) ||
        (t.tags  || []).some((tag) => tag.toLowerCase().includes(kw)) ||
        (t.sourceCharName || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [treasures, filterType, searchText]);

  // 重要的放最前
  const sorted = [...filtered.filter((t) => t.important), ...filtered.filter((t) => !t.important)];

  const handleSave = (t) => {
    onSaveTreasure(t);
    setShowEditor(false);
    setDetailItem(null);
  };

  const handleDelete = (id) => {
    onDeleteTreasure(id);
    setDetailItem(null);
  };

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 16px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.4)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
          💎 我的宝库
        </div>
        <button
          onClick={() => setShowEditor(true)}
          style={{
            background: "rgba(120,100,160,.15)", border: "1px solid rgba(120,100,160,.2)",
            borderRadius: 10, padding: "5px 14px", fontSize: 12,
            color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
          }}
        >+ 手动收藏</button>
      </div>

      {/* ── 类型筛选 ── */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", padding: "10px 14px 8px",
        borderBottom: "1px solid rgba(196,166,184,.12)",
        scrollbarWidth: "none", flexShrink: 0,
      }}>
        {[{ value: "all", label: "全部", emoji: "💎" }, ...TREASURE_TYPES].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "var(--font-main)", transition: "all .15s", flexShrink: 0,
              background: filterType === t.value ? "rgba(120,100,160,.15)" : "transparent",
              border: `1px solid ${filterType === t.value ? "rgba(120,100,160,.3)" : "rgba(196,166,184,.2)"}`,
              color: filterType === t.value ? "#5a4a8a" : "#9a8aac",
            }}
          >{t.emoji} {t.label}</button>
        ))}
      </div>

      {/* ── 搜索 ── */}
      <div style={{ padding: "8px 14px 4px", flexShrink: 0 }}>
        <input
          type="text"
          placeholder="🔍 搜索宝物…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "7px 12px", borderRadius: 20, fontSize: 12,
            background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.2)",
            color: "#5a4a6a", fontFamily: "var(--font-main)", outline: "none",
          }}
        />
      </div>

      {/* ── 列表 ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 32px" }}>
        {sorted.length === 0 ? (
          <div style={{ paddingTop: 48, textAlign: "center", color: "var(--text-faint)", lineHeight: 2.5 }}>
            <div style={{ fontSize: 32 }}>💎</div>
            {searchText || filterType !== "all"
              ? "没有找到匹配的宝物"
              : <><div>宝库还是空的</div><div style={{ fontSize: 12, opacity: 0.7 }}>去聊天里「珍藏这段」吧</div></>}
          </div>
        ) : (
          sorted.map((item) => {
            const ti = typeInfo(item.type);
            const charName = item.sourceCharName || (characters || []).find((c) => c.id === item.sourceCharId)?.name || "";
            return (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                style={{
                  marginBottom: 10, padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                  background: item.important ? "rgba(200,160,80,.06)" : "rgba(255,255,255,.6)",
                  border: `1px solid ${item.important ? "rgba(200,160,80,.22)" : "rgba(196,166,184,.18)"}`,
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = item.important ? "rgba(200,160,80,.1)" : "rgba(255,255,255,.85)"}
                onMouseLeave={(e) => e.currentTarget.style.background = item.important ? "rgba(200,160,80,.06)" : "rgba(255,255,255,.6)"}
              >
                {/* 头部 */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{ti.emoji}</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", background: "rgba(196,166,184,.12)", padding: "1px 7px", borderRadius: 8 }}>{ti.label}</span>
                  {charName && <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{charName}</span>}
                  {item._dupHint && (
                    <span title="同一来源已有其他宝库条目" style={{
                      fontSize: 12, padding: "1px 6px", borderRadius: 6,
                      background: "rgba(180,140,60,.12)", color: "#a07828",
                      border: "1px solid rgba(180,140,60,.22)", letterSpacing: 0.3,
                    }}>同源重复</span>
                  )}
                  {item.important && <span style={{ fontSize: 12, color: "#c08030", marginLeft: "auto" }}>★</span>}
                  {!item.important && <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-faint)" }}>{fmtDate(item.createdAt)}</span>}
                  {item.important && <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{fmtDate(item.createdAt)}</span>}
                </div>

                {/* 标题（如果和正文不同）*/}
                {item.title && item.title !== item.content.slice(0, item.title.length) && (
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#5a4a6a", marginBottom: 4, letterSpacing: 0.3 }}>
                    {item.title}
                  </div>
                )}

                {/* 正文预览 */}
                <div style={{
                  fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  whiteSpace: "pre-wrap",
                }}>
                  {item.content}
                </div>

                {/* 标签 */}
                {(item.tags || []).length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 7 }}>
                    {item.tags.map((tag, i) => (
                      <span key={i} style={{ fontSize: 12, padding: "1px 6px", borderRadius: 7, background: "rgba(196,166,184,.12)", color: "#9a8aac" }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── 详情面板 ── */}
      {detailItem && (
        <TreasureDetail
          treasure={detailItem}
          onSave={(t) => { handleSave(t); setDetailItem(t); }}
          onDelete={handleDelete}
          onClose={() => setDetailItem(null)}
          onCreateNoteFromTreasure={onCreateNoteFromTreasure}
          characters={characters}
          activeCharId={activeCharId}
          onContinueFromTreasure={onContinueFromTreasure}
          onAddTreasureToTimeline={onAddTreasureToTimeline}
          onOpenTimeline={onOpenTimeline}
        />
      )}

      {/* ── 手动添加弹窗 ── */}
      {showEditor && (
        <TreasureEditor
          initial={null}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
