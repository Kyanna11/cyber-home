// ─── 手札页 ───
// 我的手札：日记、心事、灵感、梦、项目、给他的信、笔记

import { useState } from "react";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

// ── 手札类型 ──
const NOTE_TYPES = [
  { value: "diary",   label: "日记",     emoji: "📔" },
  { value: "thought", label: "心事",     emoji: "💭" },
  { value: "idea",    label: "灵感",     emoji: "✨" },
  { value: "dream",   label: "梦",       emoji: "🌙" },
  { value: "project", label: "项目",     emoji: "📋" },
  { value: "letter",  label: "给他的信", emoji: "💌" },
  { value: "note",    label: "笔记",     emoji: "📝" },
];

// ── 分享意图 ──
const SHARE_INTENTS = [
  { value: "read",     label: "只是给他看看" },
  { value: "comfort",  label: "想被安慰" },
  { value: "organize", label: "想让他帮我整理" },
  { value: "remember", label: "希望他以后记得" },
  { value: "reply",    label: "想让他回复我" },
];

// ── 工具函数 ──
function typeInfo(type) {
  return NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0];
}

function formatNoteDate(entry) {
  if (entry.createdAt > 0) {
    const d = new Date(entry.createdAt);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${entry.date || ""}${entry.time ? " " + entry.time : ""}`.trim();
}

function generateNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ════════════════════════════════════════════
// ── 编辑器覆层 ──
// ════════════════════════════════════════════
function NoteEditor({ initial, onSave, onDraft, onCancel, onDelete }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    title:   initial?.title  || "",
    text:    initial?.text   || "",
    type:    initial?.type   || "diary",
    mood:    initial?.mood   || "",
    // 展示为逗号/空格分隔字符串，保存时再拆分
    tagsRaw: (initial?.tags || []).join(" "),
  });

  const ti = typeInfo(form.type);
  const hasContent = form.text.trim().length > 0;

  const buildEntry = (isDraft) => ({
    ...(initial || {}),
    id:              initial?.id || generateNoteId(),
    title:           form.title.trim(),
    text:            form.text,
    type:            form.type,
    mood:            form.mood.trim(),
    tags:            form.tagsRaw.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
    isDraft,
    createdAt:       initial?.createdAt || Date.now(),
    updatedAt:       Date.now(),
    visibility:      initial?.visibility      || "private",
    sharedWith:      initial?.sharedWith      || [],
    shareIntent:     initial?.shareIntent     || "",
    hasProfileDraft: initial?.hasProfileDraft || false,
    hasMemoryDraft:  initial?.hasMemoryDraft  || false,
    hasTimelineEvent:initial?.hasTimelineEvent|| false,
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "18px 16px 10px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 8px", fontSize: 13, color: "#9a8aac",
            fontFamily: "var(--font-main)",
          }}
        >取消</button>

        <div style={{ flex: 1, textAlign: "center", fontSize: 14, color: "#5a4a6a", letterSpacing: 1.5 }}>
          {ti.emoji} {isNew ? `新建${ti.label}` : `编辑${ti.label}`}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => hasContent && onDraft(buildEntry(true))}
            disabled={!hasContent}
            style={{
              padding: "5px 12px", borderRadius: 10, fontSize: 12,
              cursor: hasContent ? "pointer" : "default",
              background: "rgba(196,166,184,.15)", border: "1px solid rgba(196,166,184,.3)",
              color: hasContent ? "#7a6a8e" : "#b0a0c0", fontFamily: "var(--font-main)",
            }}
          >草稿</button>
          <button
            onClick={() => hasContent && onSave(buildEntry(false))}
            disabled={!hasContent}
            style={{
              padding: "5px 14px", borderRadius: 10, fontSize: 12,
              cursor: hasContent ? "pointer" : "default",
              background: hasContent ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none", color: "white", fontFamily: "var(--font-main)",
              transition: "all .2s",
            }}
          >收起来</button>
        </div>
      </div>

      {/* ── 类型选择 ── */}
      <div style={{
        padding: "10px 16px 6px", display: "flex", gap: 6, flexWrap: "wrap",
        borderBottom: "1px solid rgba(196,166,184,.1)", flexShrink: 0,
      }}>
        {NOTE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setForm((f) => ({ ...f, type: t.value }))}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12,
              cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
              background: form.type === t.value ? "rgba(120,100,160,.85)" : "rgba(255,255,255,.7)",
              color: form.type === t.value ? "white" : "#7a6a8e",
              border: `1px solid ${form.type === t.value ? "transparent" : "rgba(196,166,184,.3)"}`,
            }}
          >{t.emoji} {t.label}</button>
        ))}
      </div>

      {/* ── 编辑区域 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 20px 32px" }}>

        {/* 标题 */}
        <input
          type="text"
          placeholder="给这篇手札起个名字（可选）"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 0", fontSize: 16, fontWeight: 500,
            color: "#5a4a6a", background: "none", border: "none",
            borderBottom: "1px solid rgba(196,166,184,.2)",
            fontFamily: "var(--font-main)", outline: "none", letterSpacing: 0.5,
          }}
        />

        {/* 正文 */}
        <textarea
          placeholder="写下来…"
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          autoFocus={isNew}
          style={{
            width: "100%", boxSizing: "border-box",
            minHeight: 220, padding: "14px 0", fontSize: 14,
            color: "#5a4a6a", background: "none", border: "none",
            borderBottom: "1px solid rgba(196,166,184,.12)",
            fontFamily: "var(--font-main)", outline: "none",
            resize: "none", lineHeight: 1.95, letterSpacing: 0.3,
          }}
        />

        {/* 心情 + 标签 */}
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <input
            type="text"
            placeholder="心情（可选）"
            value={form.mood}
            onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, color: "#7a6a8e",
              background: "none", border: "none",
              borderBottom: "1px solid rgba(196,166,184,.15)",
              fontFamily: "var(--font-main)", outline: "none",
            }}
          />
          <input
            type="text"
            placeholder="标签（空格分隔）"
            value={form.tagsRaw}
            onChange={(e) => setForm((f) => ({ ...f, tagsRaw: e.target.value }))}
            style={{
              flex: 2, padding: "8px 0", fontSize: 13, color: "#7a6a8e",
              background: "none", border: "none",
              borderBottom: "1px solid rgba(196,166,184,.15)",
              fontFamily: "var(--font-main)", outline: "none",
            }}
          />
        </div>

        {/* 删除按钮（编辑已有条目时） */}
        {!isNew && onDelete && (
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <button
              onClick={() => onDelete(initial.id)}
              style={{
                padding: "7px 20px", borderRadius: 10, fontSize: 12,
                background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.18)",
                color: "#9a5050", cursor: "pointer", fontFamily: "var(--font-main)",
              }}
            >🗑 删除这篇手札</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// ── 分享弹窗（两步：选角色 → 选意图）──
// ════════════════════════════════════════════
function ShareModal({ entry, characters, onShare, onClose }) {
  const [step, setStep] = useState("char");
  const [targetChar, setTargetChar] = useState(null);
  const [intent, setIntent] = useState("read");

  const ti = typeInfo(entry.type);
  const preview = entry.text.length > 70 ? entry.text.slice(0, 70) + "…" : entry.text;

  return (
    <div
      className="del-confirm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="char-panel" style={{ maxWidth: 380 }}>

        {/* 内容预览 */}
        <div style={{
          padding: "10px 14px", borderRadius: 12, marginBottom: 14,
          background: "rgba(155,149,181,.04)", border: "1px solid rgba(155,149,181,.08)",
          fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7,
        }}>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 4 }}>
            {ti.emoji} {ti.label} · {formatNoteDate(entry)}
          </div>
          {entry.title && (
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{entry.title}</div>
          )}
          {preview}
        </div>

        {step === "char" ? (
          <>
            <div className="char-panel-title">分享给谁？</div>
            {characters.length === 0 ? (
              <div style={{ padding: "16px 0", color: "var(--text-faint)", fontSize: 13, lineHeight: 1.8, textAlign: "center" }}>
                还没有成员<br/>先去添加一位吧
              </div>
            ) : (
              characters.map((char) => (
                <div
                  key={char.id}
                  className="char-card"
                  onClick={() => { setTargetChar(char); setStep("intent"); }}
                >
                  <Avatar char={char} size={42} radius={14} fontSize={20} />
                  <div className="char-info">
                    <div className="char-name">{char.name || "未命名"}</div>
                    <div className="char-relation">{char.relation || ""}</div>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-faint)" }}>→</span>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className="char-panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setStep("char")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9a8aac", padding: 0 }}
              >←</button>
              分享给 {targetChar?.name}，你的意图是？
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {SHARE_INTENTS.map((si) => (
                <button
                  key={si.value}
                  onClick={() => setIntent(si.value)}
                  style={{
                    padding: "10px 16px", borderRadius: 12, fontSize: 13,
                    cursor: "pointer", fontFamily: "var(--font-main)", textAlign: "left",
                    background: intent === si.value ? "rgba(120,100,160,.12)" : "rgba(255,255,255,.6)",
                    border: `1px solid ${intent === si.value ? "rgba(120,100,160,.4)" : "rgba(196,166,184,.2)"}`,
                    color: intent === si.value ? "#5a4a8a" : "#7a6a8e",
                    transition: "all .15s",
                  }}
                >
                  {intent === si.value ? "✓ " : ""}{si.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => onShare(targetChar.id, entry, intent)}
              style={{
                width: "100%", padding: "12px", borderRadius: 14,
                background: "rgba(120,100,160,.85)", border: "none",
                color: "white", fontSize: 14, cursor: "pointer",
                fontFamily: "var(--font-main)", letterSpacing: 1, marginBottom: 2,
              }}
            >📤 分享给 {targetChar?.name}</button>
          </>
        )}

        <button className="char-close" onClick={onClose}>取消</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// ── 主页面 ──
// ════════════════════════════════════════════
export default function DiaryPage({
  navigateTo,
  noteEntries,
  onSaveNote,
  onDeleteNote,
  characters,
  shareNoteToChat,
}) {
  const [editorEntry, setEditorEntry] = useState(null); // null=列表, {}=新建, entry=编辑已有
  const [shareTarget, setShareTarget] = useState(null); // 待分享的手札
  const [filterType, setFilterType] = useState("all");

  const openNew  = () => setEditorEntry({});
  const openEdit = (entry) => setEditorEntry(entry);
  const closeEditor = () => setEditorEntry(null);

  const handleSave = (entry) => { onSaveNote(entry); closeEditor(); };
  const handleDraft = (entry) => { onSaveNote({ ...entry, isDraft: true }); closeEditor(); };
  const handleDelete = (id) => { onDeleteNote(id); closeEditor(); };

  const filtered = filterType === "all"
    ? noteEntries
    : noteEntries.filter((e) => (e.type || "diary") === filterType);

  return (
    <>
      <div className="diary-page page-fade" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ── 顶栏 ── */}
        <div className="diary-header">
          <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />
          <div className="diary-header-title">📓 我的手札</div>
          <button
            onClick={openNew}
            style={{
              background: "rgba(120,100,160,.15)", border: "1px solid rgba(120,100,160,.2)",
              borderRadius: 10, padding: "5px 14px", fontSize: 13,
              color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
            }}
          >+ 新建</button>
        </div>

        {/* ── 类型筛选 ── */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px 8px",
          borderBottom: "1px solid rgba(196,166,184,.15)",
          scrollbarWidth: "none", flexShrink: 0,
        }}>
          {[{ value: "all", label: "全部", emoji: "📚" }, ...NOTE_TYPES].map((t) => (
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

        {/* ── 列表 ── */}
        <div className="diary-content" style={{ flex: 1, overflowY: "auto" }}>
          <div className="diary-entries">
            {filtered.length === 0 ? (
              <div className="diary-empty" style={{ paddingTop: 40 }}>
                {filterType === "all"
                  ? <><span style={{ fontSize: 28 }}>📓</span><br/>还没有写过手札<br/><span style={{ fontSize: 12, color: "var(--text-faint)" }}>点右上角「+ 新建」开始吧</span></>
                  : `这个类型还没有内容`}
              </div>
            ) : (
              filtered.map((entry) => {
                const ti = typeInfo(entry.type);
                const sharedWithNames = (entry.sharedWith || [])
                  .map((id) => characters.find((c) => c.id === id)?.name || id);

                return (
                  <div
                    key={entry.id}
                    className="diary-entry"
                    onClick={() => openEdit(entry)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* 头部行：类型 + 草稿标 + 日期 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 10,
                        background: "rgba(120,100,160,.1)", color: "#7a6a8e",
                      }}>{ti.emoji} {ti.label}</span>
                      {entry.isDraft && (
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 10,
                          background: "rgba(192,160,80,.12)", color: "#907020",
                        }}>草稿</span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: "auto" }}>
                        {formatNoteDate(entry)}
                      </span>
                    </div>

                    {/* 标题 */}
                    {entry.title && (
                      <div style={{
                        fontSize: 14, fontWeight: 500, color: "#5a4a6a",
                        marginBottom: 4, letterSpacing: 0.5,
                      }}>{entry.title}</div>
                    )}

                    {/* 内容预览 */}
                    <div className="diary-entry-text" style={{ marginBottom: 8 }}>
                      {(entry.text || "").length > 120
                        ? entry.text.slice(0, 120) + "…"
                        : entry.text}
                    </div>

                    {/* 底部行：心情 + 标签 + 分享 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {entry.mood && (
                        <span style={{ fontSize: 11, color: "#9a8aac" }}>{entry.mood}</span>
                      )}
                      {(entry.tags || []).slice(0, 3).map((tag, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: "1px 7px", borderRadius: 8,
                          background: "rgba(196,166,184,.12)", color: "#9a8aac",
                        }}>#{tag}</span>
                      ))}
                      <div style={{ flex: 1 }} />
                      {sharedWithNames.length > 0 ? (
                        <span style={{ fontSize: 11, color: "#9a8aac" }}>
                          📤 已分享给 {sharedWithNames.join("、")}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShareTarget(entry); }}
                          style={{
                            background: "none", border: "1px solid rgba(155,149,181,.18)",
                            borderRadius: 8, padding: "3px 10px", fontSize: 11,
                            color: "var(--text-mid)", cursor: "pointer",
                            fontFamily: "var(--font-main)",
                          }}
                        >📤 分享给ta</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 编辑器覆层 ── */}
      {editorEntry !== null && (
        <NoteEditor
          initial={editorEntry?.id ? editorEntry : null}
          onSave={handleSave}
          onDraft={handleDraft}
          onCancel={closeEditor}
          onDelete={editorEntry?.id ? handleDelete : null}
        />
      )}

      {/* ── 分享弹窗 ── */}
      {shareTarget && (
        <ShareModal
          entry={shareTarget}
          characters={characters}
          onShare={(charId, entry, intent) => {
            shareNoteToChat(charId, entry, intent);
            setShareTarget(null);
          }}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
