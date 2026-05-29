// ─── 便签墙 ───
// 小家的轻量留言空间：睡前一句话、临时想说的、给 ta 留的纸条

import { useState } from "react";

// ── 便签纸色系（按 id hash 轮换）──
const NOTE_PALETTES = [
  { bg: "#fffef0", border: "rgba(210,190,90,.28)",  dot: "#c8b44a" },
  { bg: "#fff5f8", border: "rgba(210,150,170,.28)", dot: "#c87898" },
  { bg: "#f6f0ff", border: "rgba(165,145,210,.28)", dot: "#9878c8" },
  { bg: "#f0fff8", border: "rgba(120,185,155,.28)", dot: "#68b890" },
  { bg: "#fff8f0", border: "rgba(210,165,110,.28)", dot: "#c8904a" },
];

function getPalette(id) {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return NOTE_PALETTES[hash % NOTE_PALETTES.length];
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} 小时前`;
  const diffD = Math.floor(diffH / 24);
  if (diffD <= 7) return `${diffD} 天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── 新建便签表单（底部弹出）──
function NewNoteSheet({ characters, userProfile, onSave, onClose }) {
  const [content, setContent]   = useState("");
  const [targetType, setTargetType] = useState("all"); // "all" | "char"
  const [targetCharId, setTargetCharId] = useState(characters[0]?.id || null);
  const [pinned, setPinned]     = useState(false);

  const userName = userProfile?.globalFacts?.name?.trim() || "我";

  const targetName = targetType === "all"
    ? "全家"
    : (characters.find((c) => c.id === targetCharId)?.name || "ta");

  const canSave = content.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      authorType: "user",
      authorId:   null,
      authorName: userName,
      targetType,
      targetCharId: targetType === "char" ? targetCharId : null,
      targetName,
      content: content.trim(),
      pinned,
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
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>📝 写一张便签</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 32px" }}>

          {/* 写给 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 8 }}>写给</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setTargetType("all")}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12,
                  cursor: "pointer", fontFamily: "var(--font-main)",
                  background: targetType === "all" ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.8)",
                  border: `1px solid ${targetType === "all" ? "rgba(120,100,160,.4)" : "rgba(196,166,184,.25)"}`,
                  color: targetType === "all" ? "#5a4a8a" : "#7a6a8e",
                }}
              >🏠 全家</button>
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setTargetType("char"); setTargetCharId(c.id); }}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12,
                    cursor: "pointer", fontFamily: "var(--font-main)",
                    background: targetType === "char" && targetCharId === c.id ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.8)",
                    border: `1px solid ${targetType === "char" && targetCharId === c.id ? "rgba(120,100,160,.4)" : "rgba(196,166,184,.25)"}`,
                    color: targetType === "char" && targetCharId === c.id ? "#5a4a8a" : "#7a6a8e",
                  }}
                >
                  {c.emoji || "💜"} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 8 }}>内容</div>
            <textarea
              autoFocus
              placeholder="想说什么都可以，哪怕只是一个字……"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                minHeight: 100, padding: "10px 12px",
                borderRadius: 14, fontSize: 13, color: "#5a4a6a",
                background: "rgba(255,255,255,.8)",
                border: "1px solid rgba(196,166,184,.28)",
                fontFamily: "var(--font-main)", outline: "none",
                resize: "none", lineHeight: 1.8,
              }}
            />
            <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "right", marginTop: 4 }}>
              {content.length} 字
            </div>
          </div>

          {/* 置顶 */}
          <div
            onClick={() => setPinned(!pinned)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 20 }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `1.5px solid ${pinned ? "rgba(120,100,160,.6)" : "rgba(196,166,184,.4)"}`,
              background: pinned ? "rgba(120,100,160,.14)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#7a5aaa", flexShrink: 0,
            }}>
              {pinned ? "📌" : ""}
            </div>
            <span style={{ fontSize: 12, color: pinned ? "#5a4a8a" : "#9a8aac" }}>置顶这张便签</span>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: canSave ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none", color: canSave ? "white" : "#9a8aac",
              fontSize: 14, cursor: canSave ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 1,
            }}
          >贴上便签</button>
        </div>
      </div>
    </div>
  );
}

// ── 单张便签卡片 ──
function NoteCard({ note, onMarkRead, onTogglePin, onDelete }) {
  const palette = getPalette(note.id);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div style={{
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      borderRadius: 16,
      padding: "14px 14px 12px",
      position: "relative",
      boxShadow: note.pinned
        ? "0 3px 14px rgba(120,100,160,.12)"
        : "0 2px 8px rgba(74,69,96,.06)",
      transition: "box-shadow .2s",
    }}>
      {/* 置顶角标 */}
      {note.pinned && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 13, opacity: 0.7,
        }}>📌</div>
      )}

      {/* 未读指示点 */}
      {!note.read && (
        <div style={{
          position: "absolute", top: 12, left: 12,
          width: 6, height: 6, borderRadius: "50%",
          background: palette.dot,
        }} />
      )}

      {/* 来自 / 写给 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 8,
        paddingLeft: !note.read ? 12 : 0,
      }}>
        <span style={{
          fontSize: 12, color: "#7a6a8e",
          background: "rgba(196,166,184,.18)",
          padding: "2px 8px", borderRadius: 10,
          maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{note.authorName}</span>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>→</span>
        <span style={{
          fontSize: 12, color: "#7a6a8e",
          background: "rgba(196,166,184,.12)",
          padding: "2px 8px", borderRadius: 10,
          maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{note.targetName}</span>
      </div>

      {/* 内容 */}
      <div style={{
        fontSize: 13, color: "#4a3a5a", lineHeight: 1.8,
        letterSpacing: 0.3, wordBreak: "break-all",
        marginBottom: 10,
        whiteSpace: "pre-wrap",
      }}>
        {note.content}
      </div>

      {/* 底部：时间 + 操作 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 0.3 }}>
          {fmtTime(note.createdAt)}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {!note.read && (
            <button
              onClick={() => onMarkRead(note.id)}
              title="标为已读"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, padding: "2px 5px", borderRadius: 8,
                color: "var(--text-faint)",
                transition: "color .15s",
              }}
            >✓</button>
          )}
          <button
            onClick={() => onTogglePin(note.id)}
            title={note.pinned ? "取消置顶" : "置顶"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, padding: "2px 5px", borderRadius: 8,
              color: note.pinned ? palette.dot : "var(--text-faint)",
              transition: "color .15s",
            }}
          >📌</button>
          {confirmDel ? (
            <>
              <button
                onClick={() => onDelete(note.id)}
                style={{
                  background: "rgba(180,80,80,.12)", border: "none", cursor: "pointer",
                  fontSize: 12, padding: "2px 8px", borderRadius: 8,
                  color: "#a05050", fontFamily: "var(--font-main)",
                }}
              >删除</button>
              <button
                onClick={() => setConfirmDel(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, padding: "2px 8px", borderRadius: 8,
                  color: "var(--text-faint)", fontFamily: "var(--font-main)",
                }}
              >取消</button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              title="删除"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, padding: "2px 5px", borderRadius: 8,
                color: "var(--text-faint)",
              }}
            >×</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主页面 ──
export default function StickyNotesPage({
  navigateTo,
  stickyNotes,
  characters,
  userProfile,
  onAddNote,
  onMarkRead,
  onTogglePin,
  onDeleteNote,
}) {
  const [tab, setTab]           = useState("all"); // "all" | "unread" | "pinned"
  const [showNewNote, setShowNewNote] = useState(false);

  const unreadCount = stickyNotes.filter((n) => !n.read).length;

  // 筛选 + 排序：置顶优先，然后按时间倒序
  const displayNotes = stickyNotes
    .filter((n) => {
      if (tab === "unread") return !n.read;
      if (tab === "pinned") return n.pinned;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #fdf9f4 0%, #f7f3ff 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--font-main)",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        padding: "calc(16px + env(safe-area-inset-top, 0px)) 18px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,.7)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(196,166,184,.15)",
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigateTo("bedroom")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#7a6a8e", padding: "4px 0",
            fontFamily: "var(--font-main)",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          小家
        </button>

        <div style={{
          fontSize: 15, fontWeight: 400, letterSpacing: 3,
          color: "#4a3a5a", position: "absolute", left: "50%", transform: "translateX(-50%)",
        }}>
          便签墙
        </div>

        <button
          onClick={() => setShowNewNote(true)}
          style={{
            background: "rgba(120,100,160,.1)",
            border: "1px solid rgba(120,100,160,.2)",
            borderRadius: 10, cursor: "pointer",
            padding: "6px 12px", fontSize: 12,
            color: "#5a4a8a", fontFamily: "var(--font-main)",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <span style={{ fontSize: 14 }}>+</span> 写便签
        </button>
      </div>

      {/* ── Tab 栏 ── */}
      <div style={{
        display: "flex", gap: 0,
        padding: "10px 18px 0",
        flexShrink: 0,
      }}>
        {[
          { key: "all",    label: `全部 ${stickyNotes.length > 0 ? stickyNotes.length : ""}` },
          { key: "unread", label: `未读${unreadCount > 0 ? ` ${unreadCount}` : ""}` },
          { key: "pinned", label: "置顶" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 14px", fontSize: 13,
              fontFamily: "var(--font-main)", letterSpacing: 0.5,
              color: tab === t.key ? "#5a4a8a" : "#9a8aac",
              borderBottom: `2px solid ${tab === t.key ? "rgba(120,100,160,.6)" : "transparent"}`,
              transition: "all .15s",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── 便签列表 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 40px" }}>

        {displayNotes.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", paddingTop: 60, gap: 14, textAlign: "center",
          }}>
            <div style={{ fontSize: 40, opacity: 0.5 }}>📝</div>
            <div style={{ fontSize: 14, color: "var(--text-faint)", lineHeight: 1.8 }}>
              {tab === "unread" ? "没有未读便签" :
               tab === "pinned" ? "还没有置顶便签" :
               "便签墙是空的\n写一张吧？"}
            </div>
            {tab === "all" && (
              <button
                onClick={() => setShowNewNote(true)}
                style={{
                  marginTop: 8, padding: "10px 24px", borderRadius: 14,
                  background: "rgba(120,100,160,.12)",
                  border: "1px solid rgba(120,100,160,.22)",
                  color: "#5a4a8a", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-main)", letterSpacing: 0.5,
                }}
              >写第一张便签</button>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}>
            {displayNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onMarkRead={onMarkRead}
                onTogglePin={onTogglePin}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        )}

        {/* 底部说明 */}
        {displayNotes.length > 0 && tab === "all" && (
          <div style={{
            textAlign: "center", fontSize: 12,
            color: "var(--text-faint)", marginTop: 24,
            letterSpacing: 0.5, lineHeight: 1.8,
          }}>
            给彼此留一张小纸条。
          </div>
        )}
      </div>

      {/* ── 新建便签表单 ── */}
      {showNewNote && (
        <NewNoteSheet
          characters={characters}
          userProfile={userProfile}
          onSave={onAddNote}
          onClose={() => setShowNewNote(false)}
        />
      )}
    </div>
  );
}
