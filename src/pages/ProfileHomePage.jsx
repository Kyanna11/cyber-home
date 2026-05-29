// ─── 声声档案页 ───
// 全家共享的用户核心档案：手动添加 + AI 提炼草稿 + 审批写入

import { useState } from "react";
import BackButton from "../components/BackButton";
import { HOME_SECTIONS } from "../constants";

// ── 分区颜色映射 ──
const SECTION_COLORS = {
  identityFacts:            { bg: "rgba(106,122,174,.08)", border: "rgba(106,122,174,.2)",  accent: "#6a7aae" },
  pastStories:              { bg: "rgba(160,120,180,.07)", border: "rgba(160,120,180,.18)", accent: "#9a70b0" },
  interactionGuide:         { bg: "rgba(100,160,140,.07)", border: "rgba(100,160,140,.2)",  accent: "#508a76" },
  preferencesAndBoundaries: { bg: "rgba(180,130,80,.07)",  border: "rgba(180,130,80,.2)",   accent: "#9a7040" },
  currentState:             { bg: "rgba(100,180,100,.07)", border: "rgba(100,180,100,.2)",  accent: "#4a8a4a" },
  homeRules:                { bg: "rgba(200,100,120,.07)", border: "rgba(200,100,120,.18)", accent: "#a05060" },
};

// ── 草稿卡片组件 ──
function ProfileDraftCard({ draft, onApplySection, onUnapplySection, onUpdateSection, onDismiss, onDelete }) {
  const [expanded, setExpanded] = useState(new Set());
  const [editingSection, setEditingSection] = useState(null); // { key, text }
  const applied = draft.appliedSections || [];
  const date = new Date(draft.createdAt).toLocaleDateString("zh-CN");

  const nonEmpty = HOME_SECTIONS.filter((s) => (draft[s.key] || []).length > 0);
  const totalApplied = nonEmpty.filter((s) => applied.includes(s.key)).length;

  const toggle = (key) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const handleApplyAll = () => {
    nonEmpty.forEach((s) => {
      if (!applied.includes(s.key)) onApplySection(s.key);
    });
  };

  const srcLabel = {
    paste:     "粘贴文字",
    migration: `迁入记录（${draft.sourceCharName || ""}）`,
    diary:     "日记",
    chat:      `聊天（${draft.sourceCharName || ""}）`,
  }[draft.sourceType] || "未知来源";

  return (
    <div style={{
      borderRadius: 14, marginBottom: 14,
      border: "1px solid rgba(106,122,174,.22)",
      background: "rgba(106,122,174,.05)",
      overflow: "hidden",
    }}>
      {/* 头部 */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px 10px",
        borderBottom: "1px solid rgba(106,122,174,.12)",
      }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>
            📋 声声档案草稿
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
            {date} · {srcLabel}
          </div>
        </div>
        {totalApplied > 0 && (
          <span style={{
            fontSize: 12, color: "#4a8a4a",
            background: "rgba(100,160,100,.1)",
            padding: "2px 9px", borderRadius: 8,
          }}>
            已采纳 {totalApplied}/{nonEmpty.length} 节
          </span>
        )}
      </div>

      {/* 各节 */}
      <div style={{ padding: "8px 14px 4px" }}>
        {HOME_SECTIONS.map(({ key, label, emoji, hint, isCurrentState }) => {
          const items = draft[key] || [];
          if (items.length === 0) return null;
          const isApplied = applied.includes(key);
          const isOpen = expanded.has(key);
          const col = SECTION_COLORS[key] || {};

          return (
            <div key={key} style={{
              marginBottom: 8, borderRadius: 10,
              background: isApplied ? "rgba(100,160,100,.05)" : (col.bg || "rgba(255,255,255,.5)"),
              border: `1px solid ${isApplied ? "rgba(100,160,100,.18)" : (col.border || "rgba(196,166,184,.2)")}`,
              overflow: "hidden",
              transition: "all .2s",
            }}>
              {/* 节标题行 */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", cursor: "pointer",
                }}
                onClick={() => toggle(key)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{emoji}</span>
                  <span style={{ fontSize: 12, color: isApplied ? "#4a8a4a" : "var(--text-mid)", fontWeight: 500 }}>
                    {label}
                  </span>
                  {isCurrentState && (
                    <span style={{ fontSize: 12, color: "#4a8a4a", background: "rgba(100,180,100,.12)", padding: "1px 6px", borderRadius: 6 }}>
                      近期
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>({items.length}条)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isApplied ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onUnapplySection?.(key); }}
                      title="撤回本节采纳并从已确认内容中删除"
                      style={{
                        fontSize: 12, padding: "3px 11px", borderRadius: 8, cursor: "pointer",
                        background: "rgba(100,160,100,.08)",
                        border: "1px solid rgba(100,160,100,.28)",
                        color: "#4a8a4a",
                        fontFamily: "var(--font-main)",
                      }}
                    >✓ 已采纳 · 取消</button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onApplySection(key); }}
                      style={{
                        fontSize: 12, padding: "3px 11px", borderRadius: 8, cursor: "pointer",
                        background: col.bg || "rgba(106,122,174,.1)",
                        border: `1px solid ${col.border || "rgba(106,122,174,.25)"}`,
                        color: col.accent || "#6a7aae",
                        fontFamily: "var(--font-main)",
                      }}
                    >
                      采纳本节
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* 展开内容 */}
              {isOpen && (
                <div style={{
                  padding: "4px 12px 10px",
                  borderTop: `1px solid ${col.border || "rgba(196,166,184,.15)"}`,
                }}>
                  {isCurrentState && (
                    <div style={{ fontSize: 12, color: "#4a8a4a", marginBottom: 6, lineHeight: 1.5 }}>
                      ⚠️ 近期状态采纳后会标注「近期」，不会被当作永久事实
                    </div>
                  )}
                  {editingSection?.key === key ? (
                    // 编辑模式
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        value={editingSection.text}
                        onChange={e => setEditingSection(s => ({ ...s, text: e.target.value }))}
                        placeholder="一行一条，空行会被忽略"
                        autoFocus
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          border: "1px solid rgba(196,166,184,.4)",
                          background: "rgba(255,255,255,.8)",
                          fontSize: 12, lineHeight: 1.75, resize: "none",
                          fontFamily: "var(--font-main)", outline: "none",
                          boxSizing: "border-box", minHeight: 80,
                        }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSection(null); }}
                          style={{
                            fontSize: 12, padding: "4px 12px", borderRadius: 8, cursor: "pointer",
                            background: "transparent", border: "1px solid rgba(196,166,184,.3)",
                            color: "var(--text-faint)", fontFamily: "var(--font-main)",
                          }}
                        >取消</button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newItems = editingSection.text.split("\n").map(l => l.trim()).filter(Boolean);
                            onUpdateSection?.(key, newItems);
                            setEditingSection(null);
                          }}
                          style={{
                            flex: 1, fontSize: 12, padding: "4px 0", borderRadius: 8, cursor: "pointer",
                            background: col.bg || "rgba(106,122,174,.12)",
                            border: `1px solid ${col.border || "rgba(106,122,174,.25)"}`,
                            color: col.accent || "#6a7aae", fontFamily: "var(--font-main)",
                          }}
                        >保存修改</button>
                      </div>
                    </div>
                  ) : (
                    // 查看模式
                    <>
                      {items.map((text, i) => (
                        <div key={i} style={{
                          fontSize: 12, color: isApplied ? "#888" : "var(--text-main)",
                          lineHeight: 1.75, padding: "3px 0",
                          opacity: isApplied ? 0.6 : 1,
                          borderBottom: i < items.length - 1 ? "1px solid rgba(196,166,184,.1)" : "none",
                        }}>
                          · {text}
                        </div>
                      ))}
                      {!isApplied && onUpdateSection && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection({ key, text: items.join("\n") });
                          }}
                          style={{
                            marginTop: 8, fontSize: 12, padding: "4px 12px", borderRadius: 8, cursor: "pointer",
                            background: "transparent", border: `1px dashed ${col.border || "rgba(196,166,184,.3)"}`,
                            color: col.accent || "var(--text-faint)", fontFamily: "var(--font-main)",
                          }}
                        >✏️ 编辑内容</button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div style={{
        display: "flex", gap: 8, padding: "8px 14px 12px",
        borderTop: "1px solid rgba(106,122,174,.1)",
      }}>
        {totalApplied < nonEmpty.length && (
          <button
            onClick={handleApplyAll}
            style={{
              flex: 1, fontSize: 12, padding: "6px 0", borderRadius: 8, cursor: "pointer",
              background: "rgba(106,122,174,.12)",
              border: "1px solid rgba(106,122,174,.28)",
              color: "#6a7aae", fontFamily: "var(--font-main)",
            }}
          >
            全部采纳
          </button>
        )}
        <button
          onClick={onDismiss}
          style={{
            flex: 1, fontSize: 12, padding: "6px 0", borderRadius: 8, cursor: "pointer",
            background: "transparent",
            border: "1px solid rgba(196,166,184,.3)",
            color: "var(--text-faint)", fontFamily: "var(--font-main)",
          }}
        >
          忽略
        </button>
        <button
          onClick={onDelete}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
            background: "transparent",
            border: "1px solid rgba(200,120,120,.2)",
            color: "#c07070", fontFamily: "var(--font-main)",
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

// ── 单分区展示组件 ──
function HomeSectionPanel({ section, entries, onDelete, onAdd }) {
  const [open, setOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const col = SECTION_COLORS[section.key] || {};

  const handleAdd = () => {
    if (!addText.trim()) return;
    onAdd(section.key, addText.trim());
    setAddText("");
    setShowAdd(false);
  };

  return (
    <div style={{
      borderRadius: 12, marginBottom: 10,
      border: `1px solid ${open ? (col.border || "rgba(196,166,184,.25)") : "rgba(196,166,184,.18)"}`,
      background: open ? (col.bg || "rgba(255,255,255,.6)") : "rgba(255,255,255,.4)",
      overflow: "hidden", transition: "all .2s",
    }}>
      {/* 标题行 */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span>{section.emoji}</span>
          <span style={{ fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>{section.label}</span>
          {section.isCurrentState && (
            <span style={{ fontSize: 12, color: "#4a8a4a", background: "rgba(100,180,100,.12)", padding: "1px 6px", borderRadius: 6 }}>
              近期
            </span>
          )}
          {entries.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>({entries.length})</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {entries.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>未填写</span>
          )}
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* 展开内容 */}
      {open && (
        <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${col.border || "rgba(196,166,184,.15)"}` }}>
          <div style={{ fontSize: 12, color: "var(--text-faint)", margin: "8px 0 10px", lineHeight: 1.6 }}>
            {section.hint}
            {section.isCurrentState && "·近期状态注入时会加「近期」标注，请定期更新"}
          </div>

          {entries.length === 0 && !showAdd && (
            <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", padding: "8px 0 4px" }}>
              还没有内容 · 点下方按钮手动添加
            </div>
          )}

          {entries.map((entry) => (
            <div key={entry.id} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "6px 0",
              borderBottom: "1px solid rgba(196,166,184,.1)",
            }}>
              <div style={{ flex: 1, fontSize: 12, color: "var(--text-main)", lineHeight: 1.7 }}>
                {entry.text}
                {entry.source === "draft" && entry.sourceCharName && (
                  <span style={{ marginLeft: 6, fontSize: 12, color: "var(--text-faint)" }}>
                    (来自{entry.sourceCharName}迁入)
                  </span>
                )}
              </div>
              <button
                onClick={() => onDelete(section.key, entry.id)}
                style={{
                  fontSize: 12, color: "#c09090", background: "none",
                  border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {/* 快捷添加 */}
          {showAdd ? (
            <div style={{ marginTop: 10 }}>
              <textarea
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                placeholder={`直接写一条关于「${section.label}」的内容…`}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid rgba(196,166,184,.35)",
                  background: "rgba(255,255,255,.7)",
                  fontSize: 12, lineHeight: 1.7, resize: "none",
                  fontFamily: "var(--font-main)", outline: "none",
                  boxSizing: "border-box", minHeight: 64,
                }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  onClick={() => { setShowAdd(false); setAddText(""); }}
                  style={{
                    fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    background: "transparent", border: "1px solid rgba(196,166,184,.3)",
                    color: "var(--text-faint)", fontFamily: "var(--font-main)",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!addText.trim()}
                  style={{
                    flex: 1, fontSize: 12, padding: "5px 0", borderRadius: 8, cursor: "pointer",
                    background: addText.trim() ? (col.bg || "rgba(106,122,174,.15)") : "rgba(200,200,200,.2)",
                    border: `1px solid ${col.border || "rgba(196,166,184,.3)"}`,
                    color: addText.trim() ? (col.accent || "#6a7aae") : "var(--text-faint)",
                    fontFamily: "var(--font-main)",
                  }}
                >
                  写入档案
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                marginTop: 10, width: "100%", fontSize: 12, padding: "6px 0",
                borderRadius: 8, cursor: "pointer",
                background: "transparent",
                border: `1px dashed ${col.border || "rgba(196,166,184,.3)"}`,
                color: col.accent || "var(--text-faint)",
                fontFamily: "var(--font-main)",
              }}
            >
              + 手动添加一条
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 主页面 ──
export default function ProfileHomePage({
  navigateTo,
  prevPage,
  homeMemory,
  profileDrafts,
  profileDraftGenerating,
  profileDraftNotice,
  setProfileDraftNotice,
  generateProfileDraft,
  addHomeMemoryEntry,
  deleteHomeMemoryEntry,
  applyProfileDraftSection,
  unapplyProfileDraftSection,
  updateProfileDraftSection,
  dismissProfileDraft,
  deleteProfileDraft,
}) {
  const [showForm, setShowForm]       = useState(null); // null | "manual" | "paste"
  const [manualSection, setManualSection] = useState("identityFacts");
  const [manualText, setManualText]   = useState("");
  const [pasteText, setPasteText]     = useState("");
  const [pasteSrc, setPasteSrc]       = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const hm = homeMemory || {};
  const pendingDrafts  = (profileDrafts || []).filter((d) => d.status === "pending");
  const historyDrafts  = (profileDrafts || []).filter((d) => d.status !== "pending");
  const totalEntries   = HOME_SECTIONS.reduce((acc, s) => acc + (hm[s.key] || []).length, 0);

  const handleManualAdd = () => {
    if (!manualText.trim()) return;
    addHomeMemoryEntry(manualSection, manualText.trim());
    setManualText("");
    setShowForm(null);
  };

  const handlePasteGenerate = () => {
    if (!pasteText.trim()) return;
    generateProfileDraft({
      sourceText: pasteText.trim(),
      sourceType: "paste",
      sourceCharName: pasteSrc.trim(),
    });
    setPasteText("");
    setPasteSrc("");
    setShowForm(null);
  };

  return (
    <div
      className="page-fade"
      style={{
        height: "100vh", overflow: "hidden",
        background: "linear-gradient(160deg,#f0ecf8 0%,#ece5f5 40%,#e5ddf0 100%)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 20px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton
          onClick={() => navigateTo(prevPage === "entrance" ? "entrance" : prevPage || "entrance")}
          label="返回"
        />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
            🏠 声声档案
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>
            全家共享的地基 · {totalEntries > 0 ? `已有 ${totalEntries} 条` : "还没有内容"}
          </div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* ── 主体滚动区 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 48px" }}>

        {/* ── 功能说明 ── */}
        <div style={{
          fontSize: 12, color: "var(--text-faint)", lineHeight: 1.8,
          padding: "10px 14px", borderRadius: 10, marginBottom: 14,
          background: "rgba(106,122,174,.05)",
          border: "1px solid rgba(106,122,174,.14)",
        }}>
          关于你自己的档案，小家里所有入住者都会参考。
          <br />
          <strong style={{ color: "var(--text-mid)" }}>手动添加</strong>直接写入 ·
          <strong style={{ color: "var(--text-mid)" }}> AI 提炼</strong>需要你审批后才正式写入
        </div>

        {/* ── 操作按钮 ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => setShowForm(showForm === "manual" ? null : "manual")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
              background: showForm === "manual" ? "rgba(106,122,174,.18)" : "rgba(255,255,255,.6)",
              border: `1px solid ${showForm === "manual" ? "rgba(106,122,174,.35)" : "rgba(196,166,184,.3)"}`,
              color: showForm === "manual" ? "#6a7aae" : "var(--text-mid)",
              fontSize: 12, fontFamily: "var(--font-main)", letterSpacing: 0.5,
              transition: "all .2s",
            }}
          >
            ✏️ 手动添加
          </button>
          <button
            onClick={() => setShowForm(showForm === "paste" ? null : "paste")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
              background: showForm === "paste" ? "rgba(100,160,140,.15)" : "rgba(255,255,255,.6)",
              border: `1px solid ${showForm === "paste" ? "rgba(100,160,140,.3)" : "rgba(196,166,184,.3)"}`,
              color: showForm === "paste" ? "#508a76" : "var(--text-mid)",
              fontSize: 12, fontFamily: "var(--font-main)", letterSpacing: 0.5,
              transition: "all .2s",
            }}
          >
            📄 从文字提炼草稿
          </button>
        </div>

        {/* ── 手动添加表单 ── */}
        {showForm === "manual" && (
          <div style={{
            borderRadius: 14, padding: "14px 16px", marginBottom: 14,
            background: "rgba(255,255,255,.72)", border: "1px solid rgba(196,166,184,.3)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 10, fontWeight: 500 }}>
              ✏️ 手动写入声声档案
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "var(--text-faint)", display: "block", marginBottom: 5 }}>
                写入分区
              </label>
              <select
                value={manualSection}
                onChange={(e) => setManualSection(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid rgba(196,166,184,.35)",
                  background: "rgba(255,255,255,.8)", fontSize: 12,
                  color: "var(--text-mid)", fontFamily: "var(--font-main)", outline: "none",
                }}
              >
                {HOME_SECTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.emoji} {s.label}{s.isCurrentState ? " ⚠️" : ""}
                  </option>
                ))}
              </select>
              {HOME_SECTIONS.find((s) => s.key === manualSection)?.isCurrentState && (
                <div style={{ fontSize: 12, color: "#4a8a4a", marginTop: 4 }}>
                  ⚠️ 近期状态注入时会加「近期」标注，不会被当作永久事实
                </div>
              )}
            </div>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={`写一条关于「${HOME_SECTIONS.find((s) => s.key === manualSection)?.label || ""}」的内容…`}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8,
                border: "1px solid rgba(196,166,184,.35)",
                background: "rgba(255,255,255,.7)",
                fontSize: 12, lineHeight: 1.7, resize: "none",
                fontFamily: "var(--font-main)", outline: "none",
                boxSizing: "border-box", minHeight: 72,
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => { setShowForm(null); setManualText(""); }}
                style={{
                  fontSize: 12, padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                  background: "transparent", border: "1px solid rgba(196,166,184,.3)",
                  color: "var(--text-faint)", fontFamily: "var(--font-main)",
                }}
              >
                取消
              </button>
              <button
                onClick={handleManualAdd}
                disabled={!manualText.trim()}
                style={{
                  flex: 1, fontSize: 12, padding: "7px 0", borderRadius: 8,
                  cursor: manualText.trim() ? "pointer" : "default",
                  background: manualText.trim() ? "rgba(106,122,174,.18)" : "rgba(200,200,200,.2)",
                  border: "1px solid rgba(106,122,174,.3)",
                  color: manualText.trim() ? "#6a7aae" : "var(--text-faint)",
                  fontFamily: "var(--font-main)",
                }}
              >
                直接写入档案
              </button>
            </div>
          </div>
        )}

        {/* ── 粘贴提炼表单 ── */}
        {showForm === "paste" && (
          <div style={{
            borderRadius: 14, padding: "14px 16px", marginBottom: 14,
            background: "rgba(255,255,255,.72)", border: "1px solid rgba(196,166,184,.3)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 4, fontWeight: 500 }}>
              📄 从文字中提炼声声档案草稿
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10, lineHeight: 1.6 }}>
              粘贴一段故事、日记或聊天记录，AI 会提炼出关于你的信息，生成草稿等你审批
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="粘贴你想整理的文字…支持任意格式，聊天记录、日记、随手写的感受都可以"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid rgba(196,166,184,.35)",
                background: "rgba(255,255,255,.7)",
                fontSize: 12, lineHeight: 1.75, resize: "none",
                fontFamily: "var(--font-main)", outline: "none",
                boxSizing: "border-box", minHeight: 120,
              }}
            />
            <input
              value={pasteSrc}
              onChange={(e) => setPasteSrc(e.target.value)}
              placeholder="来源说明（可选，如：和某某的对话）"
              style={{
                width: "100%", marginTop: 8, padding: "7px 10px", borderRadius: 8,
                border: "1px solid rgba(196,166,184,.3)",
                background: "rgba(255,255,255,.7)",
                fontSize: 12, color: "var(--text-mid)",
                fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => { setShowForm(null); setPasteText(""); setPasteSrc(""); }}
                style={{
                  fontSize: 12, padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                  background: "transparent", border: "1px solid rgba(196,166,184,.3)",
                  color: "var(--text-faint)", fontFamily: "var(--font-main)",
                }}
              >
                取消
              </button>
              <button
                onClick={handlePasteGenerate}
                disabled={!pasteText.trim() || profileDraftGenerating}
                style={{
                  flex: 1, fontSize: 12, padding: "7px 0", borderRadius: 8,
                  cursor: pasteText.trim() && !profileDraftGenerating ? "pointer" : "default",
                  background: pasteText.trim() ? "rgba(100,160,140,.18)" : "rgba(200,200,200,.2)",
                  border: "1px solid rgba(100,160,140,.3)",
                  color: pasteText.trim() ? "#508a76" : "var(--text-faint)",
                  fontFamily: "var(--font-main)",
                  opacity: profileDraftGenerating ? 0.6 : 1,
                }}
              >
                {profileDraftGenerating ? "⏳ 提炼中……" : "提炼草稿"}
              </button>
            </div>
          </div>
        )}

        {/* ── 内联提示 ── */}
        {profileDraftNotice && (
          <div style={{
            fontSize: 12, lineHeight: 1.7, padding: "9px 14px",
            borderRadius: 10, marginBottom: 14,
            background: profileDraftNotice.startsWith("✓")
              ? "rgba(100,160,100,.08)" : "rgba(220,180,80,.08)",
            border: `1px solid ${profileDraftNotice.startsWith("✓")
              ? "rgba(100,160,100,.2)" : "rgba(220,180,80,.2)"}`,
            color: profileDraftNotice.startsWith("✓") ? "#4a8a4a" : "#a08040",
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ flexShrink: 0 }}>
              {profileDraftNotice.startsWith("✓") ? "✓" : "💡"}
            </span>
            <span style={{ flex: 1 }}>{profileDraftNotice}</span>
            <button
              onClick={() => setProfileDraftNotice("")}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: 13 }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── 待审批草稿 ── */}
        {pendingDrafts.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>
              待审批草稿 ({pendingDrafts.length})
            </div>
            {pendingDrafts.map((draft) => (
              <ProfileDraftCard
                key={draft.id}
                draft={draft}
                onApplySection={(section) => applyProfileDraftSection(draft.id, section)}
                onUnapplySection={(section) => unapplyProfileDraftSection?.(draft.id, section)}
                onUpdateSection={(section, newItems) => updateProfileDraftSection?.(draft.id, section, newItems)}
                onDismiss={() => dismissProfileDraft(draft.id)}
                onDelete={() => deleteProfileDraft(draft.id)}
              />
            ))}
          </>
        )}

        {/* ── 已确认内容（各分区） ── */}
        <div style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: 1, margin: "16px 0 8px" }}>
          已确认内容
        </div>
        {HOME_SECTIONS.map((section) => (
          <HomeSectionPanel
            key={section.key}
            section={section}
            entries={hm[section.key] || []}
            onDelete={deleteHomeMemoryEntry}
            onAdd={addHomeMemoryEntry}
          />
        ))}

        {totalEntries === 0 && pendingDrafts.length === 0 && (
          <div style={{
            textAlign: "center", color: "var(--text-faint)",
            fontSize: 12, lineHeight: 2.2, padding: "20px 0",
          }}>
            还没有任何档案内容<br />
            <span style={{ fontSize: 12 }}>
              点「手动添加」直接写入，或「从文字提炼草稿」让 AI 帮你整理
            </span>
          </div>
        )}

        {/* ── 历史草稿（折叠） ── */}
        {historyDrafts.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                width: "100%", padding: "8px 0", borderRadius: 10,
                background: "transparent", border: "1px solid rgba(196,166,184,.2)",
                color: "var(--text-faint)", fontSize: 12, cursor: "pointer",
                fontFamily: "var(--font-main)", letterSpacing: 0.5,
              }}
            >
              {showHistory ? "▲ 收起" : `▼ 历史草稿（${historyDrafts.length}）`}
            </button>
            {showHistory && historyDrafts.map((draft) => (
              <div key={draft.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, marginTop: 8,
                background: "rgba(255,255,255,.4)",
                border: "1px solid rgba(196,166,184,.15)",
              }}>
                <span style={{ fontSize: 16 }}>
                  {draft.status === "approved" ? "✅" : "🚫"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text-mid)" }}>
                    {new Date(draft.createdAt).toLocaleDateString("zh-CN")} ·{" "}
                    {{ paste: "粘贴文字", migration: "迁入记录", diary: "日记", chat: "聊天" }[draft.sourceType] || "未知"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>
                    {draft.status === "approved"
                      ? `全部采纳`
                      : draft.appliedSections?.length > 0
                        ? `已采纳 ${draft.appliedSections.length} 节 · 已忽略`
                        : "已忽略"}
                  </div>
                </div>
                <button
                  onClick={() => deleteProfileDraft(draft.id)}
                  style={{
                    fontSize: 12, color: "#c07070", background: "none",
                    border: "none", cursor: "pointer", padding: "2px 6px",
                  }}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
