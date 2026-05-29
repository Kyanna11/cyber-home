// ─── 他的宝库页 ───
// 展示某个入住者珍藏的用户原话、手札片段等内容
// 默认不注入 prompt，不自动写入记忆宫殿

import { useState } from "react";
import BackButton from "../components/BackButton";

// 来源类型标签
const SOURCE_LABEL = {
  message:       { text: "聊天",   bg: "rgba(120,100,160,.12)", color: "#6a5a8a" },
  group_message: { text: "客厅",   bg: "rgba(100,130,180,.12)", color: "#5a6a8a" },
  note:          { text: "手札",   bg: "rgba(160,120,100,.12)", color: "#8a6a5a" },
  manual:        { text: "手动",   bg: "rgba(160,160,100,.12)", color: "#8a8a5a" },
};

function SourceBadge({ sourceType }) {
  const s = SOURCE_LABEL[sourceType] || SOURCE_LABEL.manual;
  return (
    <span style={{
      fontSize: 12, padding: "2px 7px", borderRadius: 6,
      background: s.bg, color: s.color, letterSpacing: 0.3,
    }}>
      {s.text}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

// ─── 条目详情 ───
function ItemDetail({ item, onClose, onDelete, onTogglePin, onUpdateNote }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.note || "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleSaveNote = () => {
    onUpdateNote(noteText);
    setEditingNote(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(74,69,96,.38)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
              {item.pinned ? "📌" : "💝"} 珍藏
            </span>
            <SourceBadge sourceType={item.sourceType} />
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9a8aac", padding: 4 }}
          >✕</button>
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 24px" }}>
          {/* 原文 */}
          <div style={{
            background: "rgba(255,255,255,.7)",
            border: "1px solid rgba(196,166,184,.22)",
            borderRadius: 14, padding: "14px 16px",
            fontSize: 14, color: "#3a2e4a", lineHeight: 1.85,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            marginBottom: 14,
          }}>
            {item.content}
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, marginBottom: 6 }}>
              备注
            </div>
            {editingNote ? (
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
                    border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
                    fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)",
                    outline: "none", resize: "none", lineHeight: 1.7,
                    marginBottom: 8,
                  }}
                  placeholder="为什么这句话重要…"
                  autoFocus
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleSaveNote}
                    style={{
                      padding: "7px 16px", borderRadius: 10,
                      background: "rgba(120,100,160,.85)", border: "none",
                      color: "white", fontSize: 12, cursor: "pointer",
                      fontFamily: "var(--font-main)",
                    }}
                  >保存</button>
                  <button
                    onClick={() => { setEditingNote(false); setNoteText(item.note || ""); }}
                    style={{
                      padding: "7px 16px", borderRadius: 10,
                      background: "transparent", border: "1px solid rgba(196,166,184,.35)",
                      color: "#9a8aac", fontSize: 12, cursor: "pointer",
                      fontFamily: "var(--font-main)",
                    }}
                  >取消</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingNote(true)}
                style={{
                  padding: "8px 14px", borderRadius: 12, cursor: "text",
                  background: "rgba(255,255,255,.55)",
                  border: "1px solid rgba(196,166,184,.2)",
                  fontSize: 13, color: noteText ? "#5a4a6a" : "#aaa",
                  lineHeight: 1.7, minHeight: 38,
                }}
              >
                {noteText || "点击添加备注…"}
              </div>
            )}
          </div>

          {/* 时间 */}
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 18 }}>
            珍藏于 {new Date(item.createdAt).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>

          {/* 操作按钮行 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 12,
                background: copied ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.7)",
                border: "1px solid rgba(196,166,184,.3)",
                color: copied ? "#7a6a8e" : "#6a5a7a",
                cursor: "pointer", fontFamily: "var(--font-main)",
                transition: "all .2s",
              }}
            >
              {copied ? "✓ 已复制" : "📋 复制原文"}
            </button>
            <button
              onClick={onTogglePin}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 12,
                background: item.pinned ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.7)",
                border: `1px solid ${item.pinned ? "rgba(120,100,160,.3)" : "rgba(196,166,184,.3)"}`,
                color: item.pinned ? "#7a6a8e" : "#6a5a7a",
                cursor: "pointer", fontFamily: "var(--font-main)",
              }}
            >
              {item.pinned ? "📌 已标注" : "📌 标注"}
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 12,
                background: "rgba(255,255,255,.7)",
                border: "1px solid rgba(200,120,120,.2)",
                color: "#c07070",
                cursor: "pointer", fontFamily: "var(--font-main)",
              }}
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════
// ── 主页面 ──
// ═══════════════════════════════════
export default function CharTreasurePage({
  charId,
  characters,
  charTreasures,
  onDelete,
  onTogglePin,
  onUpdate,
  navigateTo,
  onBack,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(null); // itemId that was just copied

  const char = characters.find((c) => c.id === charId);
  const charName = char?.name || "ta";
  const emoji = char?.emoji || "💜";

  // 该入住者的宝库条目，置顶 pinned，按时间倒序
  const items = (charTreasures || [])
    .filter((t) => t.charId === charId)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });

  const handleDelete = (id) => {
    onDelete(id);
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleTogglePin = (id) => {
    onTogglePin(id);
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => prev ? { ...prev, pinned: !prev.pinned } : null);
    }
  };

  const handleUpdateNote = (id, note) => {
    onUpdate(id, { note });
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => prev ? { ...prev, note } : null);
    }
  };

  const handleCopyInList = (id, content) => {
    copyText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>
      {/* 顶栏 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "calc(16px + env(safe-area-inset-top, 0px)) 16px 14px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton onClick={onBack} label="记忆宫殿" />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#5a4a6a", letterSpacing: 1 }}>
            {emoji} {charName} 的宝库
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>
            {items.length > 0 ? `${items.length} 件珍藏` : "还没有珍藏"}
          </div>
        </div>
        <div style={{ width: 52 }} />
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 12px 24px" }}>
        {items.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "60px 24px", gap: 16, textAlign: "center",
          }}>
            <div style={{ fontSize: 44 }}>💝</div>
            <div style={{ fontSize: 15, color: "#5a4a6a", fontWeight: 500, letterSpacing: 1 }}>
              宝库还是空的
            </div>
            <div style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.9, maxWidth: 280 }}>
              在聊天或客厅里找到你说过的话，<br />
              让 {charName} 珍藏起来。
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: "rgba(255,255,255,.72)",
                  border: `1px solid ${item.pinned ? "rgba(120,100,160,.28)" : "rgba(196,166,184,.22)"}`,
                  borderRadius: 16, padding: "13px 15px",
                  cursor: "pointer",
                  transition: "all .15s",
                  position: "relative",
                }}
              >
                {/* 标注标记 */}
                {item.pinned && (
                  <div style={{
                    position: "absolute", top: 11, right: 13,
                    fontSize: 12, color: "rgba(120,100,160,.55)",
                  }}>
                    📌
                  </div>
                )}

                {/* 内容预览 */}
                <div style={{
                  fontSize: 13, color: "#3a2e4a", lineHeight: 1.75,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  marginBottom: 8,
                  paddingRight: item.pinned ? 20 : 0,
                }}>
                  {item.content}
                </div>

                {/* 备注 */}
                {item.note && (
                  <div style={{
                    fontSize: 12, color: "#8a7898", lineHeight: 1.6,
                    marginBottom: 8, fontStyle: "italic",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {item.note}
                  </div>
                )}

                {/* 底部元信息行 */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <SourceBadge sourceType={item.sourceType} />
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{formatDate(item.createdAt)}</span>
                  <div style={{ flex: 1 }} />
                  {/* 快捷复制 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyInList(item.id, item.content); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 13, padding: "2px 4px", color: "var(--text-faint)",
                      borderRadius: 6, transition: "color .2s",
                    }}
                    title="复制"
                  >
                    {copied === item.id ? "✓" : "📋"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={() => handleDelete(selectedItem.id)}
          onTogglePin={() => handleTogglePin(selectedItem.id)}
          onUpdateNote={(note) => handleUpdateNote(selectedItem.id, note)}
        />
      )}
    </div>
  );
}
