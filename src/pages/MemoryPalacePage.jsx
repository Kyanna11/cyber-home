// ─── 记忆宫殿页 V2 ───
// 垂直分层布局：钉子 → 词典 → 记忆 → 总结

import { useState, useRef } from "react";
import BackButton from "../components/BackButton";
import { MEMORY_TYPES, V1_TO_V2_TYPE_MAP } from "../constants";
import { calculateHeat, getHeatLevel } from "../utils/memory";

// ── 区域标题组件 ──
function AreaTitle({ emoji, title, count, right }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 500, letterSpacing: 2, color: "var(--text-deep)",
      display: "flex", alignItems: "center", gap: 8, margin: "20px 0 12px",
    }}>
      <span>{emoji}</span>
      <span>{title}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 400, letterSpacing: 0 }}>{count}</span>
      )}
      <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(196,166,184,.3), transparent)" }} />
      {right}
    </div>
  );
}

// ── 阶段沉淀草稿卡片 ──
const SETTLEMENT_SECTIONS = [
  { key: "relationship", dataKey: "relationshipChange", label: "关系变化记录", emoji: "📖", hint: "追加到入住档案 · 关系基础", target: "入住档案 · 关系基础", navTarget: "charEdit" },
  { key: "wakeSummary", dataKey: "wakeSummaryUpdate", label: "唤醒摘要建议", emoji: "🌙", hint: "替换入住档案 · 唤醒摘要", target: "入住档案 · 唤醒摘要", navTarget: "charEdit" },
  { key: "rules", dataKey: "newRules", label: "不可遗忘追加", emoji: "🔒", hint: "追加到入住档案 · 不可遗忘事项", target: "入住档案 · 不可遗忘", navTarget: "charEdit" },
  { key: "memories", dataKey: "suggestedMemories", label: "记忆锚点建议", emoji: "📌", hint: "写入记忆宫殿 · 固定锚点", target: "记忆宫殿 · 固定锚点", navTarget: "memFact" },
];

function SettlementDraftCard({ draft, onApplySection, onDismiss, onDelete, onNavigate }) {
  const applied = draft.appliedSections || [];
  const date = new Date(draft.createdAt).toLocaleDateString("zh-CN");
  const toDisplayText = (raw) => {
    if (!raw) return "";
    if (Array.isArray(raw)) return raw.map(item => typeof item === "object" && item !== null ? (item.type ? `【${item.type}】` : "") + (item.text || item.content || item.title || JSON.stringify(item)) : String(item)).join("\n");
    return String(raw);
  };
  const totalSections = SETTLEMENT_SECTIONS.filter(({ dataKey }) => { const c = draft[dataKey]; return c && (Array.isArray(c) ? c.length > 0 : String(c).trim()); }).length;

  return (
    <div style={{ borderRadius: 14, marginBottom: 12, border: "1px solid rgba(106,122,174,.25)", background: "rgba(106,122,174,.06)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px 8px", borderBottom: "1px solid rgba(106,122,174,.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🌿</span>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-mid)", fontWeight: 500 }}>阶段沉淀草稿</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>{date}</div>
          </div>
        </div>
        {applied.length > 0 && <span style={{ fontSize: 11, color: "#6a9a6a", background: "rgba(100,160,100,.1)", padding: "2px 7px", borderRadius: 8 }}>已采纳 {applied.length}/{totalSections}</span>}
      </div>
      <div style={{ padding: "8px 12px 6px" }}>
        {SETTLEMENT_SECTIONS.map(({ key, dataKey, label, emoji, target, navTarget }) => {
          const raw = draft[dataKey];
          if (!raw || (Array.isArray(raw) ? raw.length === 0 : !String(raw).trim())) return null;
          const isApplied = applied.includes(key);
          return (
            <div key={key} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 10, background: isApplied ? "rgba(100,160,100,.06)" : "rgba(255,255,255,.55)", border: `1px solid ${isApplied ? "rgba(100,160,100,.2)" : "rgba(196,166,184,.2)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)" }}>{emoji} {label}</span>
                {isApplied
                  ? <button onClick={() => onNavigate?.(navTarget)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(100,160,100,.1)", border: "1px solid rgba(100,160,100,.25)", color: "#4a8a4a", cursor: "pointer", fontFamily: "var(--font-main)" }}>✓ 去查看</button>
                  : <button onClick={() => onApplySection(key)} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 6, background: "rgba(106,122,174,.15)", border: "1px solid rgba(106,122,174,.3)", color: "#6a7aae", cursor: "pointer", fontFamily: "var(--font-main)" }}>采纳</button>
                }
              </div>
              <div style={{ fontSize: 12, color: isApplied ? "#999" : "var(--text-main)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 100, overflowY: "auto", opacity: isApplied ? 0.6 : 1 }}>{toDisplayText(raw)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, padding: "6px 12px 10px", borderTop: "1px solid rgba(106,122,174,.1)" }}>
        <button onClick={onDismiss} style={{ flex: 1, fontSize: 11, padding: "5px 0", borderRadius: 8, background: "transparent", border: "1px solid rgba(196,166,184,.3)", color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)" }}>暂不</button>
        <button onClick={onDelete} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(200,120,120,.2)", color: "#c07070", cursor: "pointer", fontFamily: "var(--font-main)" }}>删除</button>
      </div>
    </div>
  );
}

export default function MemoryPalacePage({
  memCharId, memEntryFrom, characters, navigateTo, openTimeline,
  setEditingChar, setEditSection,
  memTab, setMemTab, memSort, setMemSort, memFilter, setMemFilter,
  memInput, setMemInput, summaryInput, setSummaryInput, showAddSummary, setShowAddSummary,
  getCharMemories, addMemory, deleteMemory, toggleMemoryImportant, pinMemory, toggleInjectable,
  getReflectSetting, shouldReflect, reflecting, generateSettlement,
  settlementDrafts, settlementNotice, setSettlementNotice,
  applySettlementSection, dismissSettlementDraft, deleteSettlementDraft,
  addSummary, worldViews, applyFeedbackToProfile, reflectSettings, setReflectSettings,
  openCharTreasure, charTreasures,
  updateAnchorWeight, deleteAnchor, addLexiconItem, updateLexiconItem, deleteLexiconItem, addAnchorItem,
}) {
  const char = characters.find((c) => c.id === memCharId) || {};
  const charName = char.name || "记忆";
  const [viewMode, setViewMode] = useState("list");

  // 钉子状态
  const [editingWeight, setEditingWeight] = useState(null);
  const [deletingAnchor, setDeletingAnchor] = useState(null);

  // 词典状态
  const [expandedLex, setExpandedLex] = useState(null);
  const [editingLex, setEditingLex] = useState(null);
  const [deletingLex, setDeletingLex] = useState(null);
  const [showAddLex, setShowAddLex] = useState(false);
  const [newLexTerm, setNewLexTerm] = useState("");
  const [newLexMeaning, setNewLexMeaning] = useState("");
  const [newLexSpeaker, setNewLexSpeaker] = useState("");

  // 记忆状态
  const [memTypeFilter, setMemTypeFilter] = useState("all");
  const [memSortMode, setMemSortMode] = useState("heat");
  const [expandedMemId, setExpandedMemId] = useState(null);

  // 总结折叠
  const [summaryOpen, setSummaryOpen] = useState(false);

  // 滚动锚点
  const anchorRef = useRef(null);
  const lexRef = useRef(null);
  const memRef = useRef(null);
  const summaryRef = useRef(null);

  // 数据
  const anchors = (char.anchors || []).sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const lexicon = char.lexicon || [];
  const _mem = getCharMemories(memCharId);

  // 合并所有记忆类型（fact/emotion/insight + V1 兼容映射）
  const allMemories = [
    ...(_mem.fact || []).map(m => ({ ...m, _type: "fact", _v2: "her_world" })),
    ...(_mem.emotion || []).map(m => ({ ...m, _type: "emotion", _v2: "moments" })),
    ...(_mem.insight || []).map(m => ({ ...m, _type: "insight", _v2: "understanding" })),
  ];
  const filteredMemories = allMemories
    .filter(m => {
      if (memTypeFilter === "all") return true;
      return m._v2 === memTypeFilter;
    })
    .sort((a, b) => {
      if (memSortMode === "heat") {
        if ((a.pinned ?? false) !== (b.pinned ?? false)) return (b.pinned ?? false) ? 1 : -1;
        return calculateHeat(b) - calculateHeat(a);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const pendingDrafts = (settlementDrafts || []).filter(d => d.loverId === memCharId && d.status === "pending");
  const _totalMem = allMemories.length;

  // 概览数据
  const overviewStats = [
    { emoji: "📌", val: anchors.length, label: "颗钉子" },
    { emoji: "📖", val: lexicon.length, label: "个词条" },
    { emoji: "🧠", val: _totalMem, label: "条记忆" },
  ];

  const btnSmall = { fontSize: 11, padding: "3px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.3)", background: "transparent", color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)" };
  const btnDanger = { ...btnSmall, border: "1px solid rgba(200,120,120,.3)", background: "rgba(200,120,120,.08)", color: "#c07070" };

  return (
    <div className="memory-page page-fade">
      {/* 顶栏 */}
      <div className="memory-header">
        <BackButton
          onClick={() => {
            if (memEntryFrom === "chat") navigateTo("chat");
            else if (memEntryFrom === "charRoom") navigateTo("charRoom");
            else {
              const c = characters.find(c => c.id === memCharId);
              if (c) { setEditingChar(JSON.parse(JSON.stringify(c))); setEditSection("basic"); }
              navigateTo("profileEdit");
            }
          }}
          label={memEntryFrom === "chat" ? "回对话" : memEntryFrom === "charRoom" ? "他的房间" : "档案"}
        />
        <div className="memory-header-title">🏛️ {charName}的记忆宫殿</div>
        {openTimeline ? (
          <button onClick={() => openTimeline(memCharId)} style={{ padding: "6px 13px", background: "rgba(106,122,174,.12)", border: "1px solid rgba(106,122,174,.3)", borderRadius: 12, color: "#6a7aae", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)", letterSpacing: 0.5, whiteSpace: "nowrap" }}>📅 年表</button>
        ) : <div className="memory-header-spacer" />}
      </div>

      {/* 快捷入口 + 视图切换 */}
      <div style={{ padding: "6px 16px 4px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {openCharTreasure && (
          <button onClick={() => openCharTreasure(memCharId)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 10, fontSize: 12, background: "rgba(196,166,184,.12)", border: "1px solid rgba(196,166,184,.3)", color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)" }}>
            💝 他的宝库
          </button>
        )}
        <div style={{ flex: 1 }} />
        {[["list", "📋 列表"], ["overview", "🧩 概览"]].map(([v, lbl]) => (
          <button key={v} onClick={() => setViewMode(v)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            fontFamily: "var(--font-main)", transition: "all .2s",
            background: viewMode === v ? "rgba(255,255,255,.8)" : "transparent",
            border: viewMode === v ? "1px solid rgba(196,166,184,.35)" : "1px solid transparent",
            color: viewMode === v ? "#5a4a6a" : "var(--text-faint)",
          }}>{lbl}</button>
        ))}
      </div>

      {/* ═══ 列表模式：垂直分层滚动 ═══ */}
      {viewMode === "list" && (
        <div className="mem-scroll" style={{ padding: "0 14px 32px" }}>

          {/* ────── 区域 1：钉子 ────── */}
          <div ref={anchorRef}>
            <AreaTitle emoji="📌" title="钉子" count={anchors.length > 0 ? `${anchors.length} 颗` : undefined}
              right={<button onClick={() => {/* TODO: 手动添加钉子 */}} style={{ ...btnSmall, fontSize: 11 }}>+ 添加</button>}
            />
            {anchors.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8 }}>还没有钉子</div>
            ) : (
              anchors.map(anchor => (
                <div key={anchor.id} style={{
                  display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px",
                  borderRadius: 12, background: "rgba(255,255,255,.55)",
                  borderLeft: "3px solid var(--blush, #c4a8b8)",
                  border: "1px solid rgba(196,166,184,.18)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#4a3a5a", marginBottom: 3 }}>{anchor.title}</div>
                    {anchor.rawPreview && (
                      <div style={{ fontSize: 12, color: "#8a7a9a", fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 }}>
                        {anchor.rawPreview}
                      </div>
                    )}
                    {anchor.description && anchor.description !== anchor.title && (
                      <div style={{ fontSize: 12, color: "#9a8aac", lineHeight: 1.5 }}>{anchor.description}</div>
                    )}
                    {/* 操作行 */}
                    <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                      {editingWeight === anchor.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                          <input type="range" min="1" max="10" value={anchor.weight || 8} onChange={e => updateAnchorWeight(memCharId, anchor.id, Number(e.target.value))} style={{ flex: 1 }} />
                          <span style={{ fontSize: 11, color: "#7a6a8e", minWidth: 16 }}>{anchor.weight || 8}</span>
                          <button onClick={() => setEditingWeight(null)} style={btnSmall}>✓</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingWeight(anchor.id)} style={btnSmall}>权重 {anchor.weight || 0}</button>
                      )}
                      {deletingAnchor === anchor.id ? (
                        <>
                          <button onClick={() => { deleteAnchor(memCharId, anchor.id); setDeletingAnchor(null); }} style={btnDanger}>确认</button>
                          <button onClick={() => setDeletingAnchor(null)} style={btnSmall}>取消</button>
                        </>
                      ) : (
                        <button onClick={() => setDeletingAnchor(anchor.id)} style={{ ...btnSmall, color: "#bbb" }}>删除</button>
                      )}
                    </div>
                  </div>
                  {/* 权重圆点 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", flexShrink: 0 }}>
                    {Array.from({ length: Math.min(anchor.weight || 0, 10) }).map((_, i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: i < 3 ? "#c4a8b8" : "rgba(196,166,184,.35)" }} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ────── 区域 2：词典 ────── */}
          <div ref={lexRef}>
            <AreaTitle emoji="📖" title="词典" count={lexicon.length > 0 ? `${lexicon.length} 条` : undefined}
              right={<button onClick={() => setShowAddLex(!showAddLex)} style={btnSmall}>+ 添加</button>}
            />
            {lexicon.length === 0 && !showAddLex ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8 }}>还没有专属词条</div>
            ) : (
              <>
                {/* 胶囊标签横向滚动 */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
                  {lexicon.map(lex => (
                    <button key={lex.id}
                      onClick={() => setExpandedLex(expandedLex === lex.id ? null : lex.id)}
                      style={{
                        flexShrink: 0, padding: "5px 12px", borderRadius: 20,
                        fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)",
                        background: expandedLex === lex.id ? "rgba(106,138,174,.18)" : "rgba(255,255,255,.6)",
                        border: `1px solid ${expandedLex === lex.id ? "rgba(106,138,174,.4)" : "rgba(196,166,184,.25)"}`,
                        color: expandedLex === lex.id ? "#4a5a7a" : "#6a7a8a",
                        fontWeight: expandedLex === lex.id ? 500 : 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      "{lex.term}"
                    </button>
                  ))}
                </div>
                {/* 展开的词条详情 */}
                {expandedLex && (() => {
                  const lex = lexicon.find(l => l.id === expandedLex);
                  if (!lex) return null;
                  return (
                    <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(106,138,174,.06)", border: "1px solid rgba(106,138,174,.18)", marginBottom: 8 }}>
                      {editingLex === lex.id ? (
                        <div>
                          <input value={lex.meaning} onChange={e => updateLexiconItem(memCharId, lex.id, { meaning: e.target.value })}
                            style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.35)", background: "rgba(255,255,255,.65)", fontSize: 13, color: "#4a3a5a", fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box" }}
                          />
                          <button onClick={() => setEditingLex(null)} style={{ ...btnSmall, marginTop: 6 }}>完成</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 13, color: "#4a3a5a", lineHeight: 1.6 }}>
                            <strong>"{lex.term}"</strong> = {lex.meaning}
                          </div>
                          {lex.speaker && lex.speaker !== "unknown" && (
                            <div style={{ fontSize: 11, color: "#b0a0c0", marginTop: 2 }}>—— {lex.speaker}</div>
                          )}
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            <button onClick={() => setEditingLex(lex.id)} style={btnSmall}>编辑</button>
                            {deletingLex === lex.id ? (
                              <>
                                <button onClick={() => { deleteLexiconItem(memCharId, lex.id); setDeletingLex(null); setExpandedLex(null); }} style={btnDanger}>确认</button>
                                <button onClick={() => setDeletingLex(null)} style={btnSmall}>取消</button>
                              </>
                            ) : (
                              <button onClick={() => setDeletingLex(lex.id)} style={{ ...btnSmall, color: "#bbb" }}>删除</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
            {/* 添加词条表单 */}
            {showAddLex && (
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(106,138,174,.06)", border: "1px solid rgba(106,138,174,.25)", marginBottom: 8 }}>
                <input placeholder="词条" value={newLexTerm} onChange={e => setNewLexTerm(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.35)", background: "rgba(255,255,255,.65)", fontSize: 13, color: "#4a3a5a", fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
                <input placeholder="含义" value={newLexMeaning} onChange={e => setNewLexMeaning(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.35)", background: "rgba(255,255,255,.65)", fontSize: 13, color: "#4a3a5a", fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
                <input placeholder="谁说的（可选）" value={newLexSpeaker} onChange={e => setNewLexSpeaker(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.35)", background: "rgba(255,255,255,.65)", fontSize: 13, color: "#4a3a5a", fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { if (newLexTerm.trim() && newLexMeaning.trim()) { addLexiconItem(memCharId, { term: newLexTerm.trim(), meaning: newLexMeaning.trim(), speaker: newLexSpeaker.trim() || "unknown" }); setNewLexTerm(""); setNewLexMeaning(""); setNewLexSpeaker(""); setShowAddLex(false); } }}
                    style={{ fontSize: 12, padding: "6px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #c4a8d4, #9670b0)", color: "white", cursor: "pointer", fontFamily: "var(--font-main)" }}>收录</button>
                  <button onClick={() => { setShowAddLex(false); setNewLexTerm(""); setNewLexMeaning(""); setNewLexSpeaker(""); }} style={btnSmall}>取消</button>
                </div>
              </div>
            )}
          </div>

          {/* ────── 区域 3：记忆（主体） ────── */}
          <div ref={memRef}>
            <AreaTitle emoji="🧠" title="记忆" count={`${filteredMemories.length} 条`} />

            {/* 筛选 + 排序行 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select value={memTypeFilter} onChange={e => setMemTypeFilter(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.3)", fontSize: 12, background: "rgba(255,255,255,.7)", color: "var(--text-mid)", cursor: "pointer", fontFamily: "var(--font-main)" }}>
                <option value="all">全部记忆</option>
                <option value="her_world">她的世界</option>
                <option value="between_us">我们之间</option>
                <option value="understanding">我懂她的</option>
                <option value="moments">我想记住的</option>
              </select>
              <div style={{ display: "flex", gap: 4 }}>
                {[["heat", "热度"], ["time", "时间"]].map(([k, lbl]) => (
                  <button key={k} onClick={() => setMemSortMode(k)} style={{
                    ...btnSmall, fontSize: 11,
                    background: memSortMode === k ? "rgba(140,110,180,.12)" : "transparent",
                    color: memSortMode === k ? "#5a3a8e" : "#999",
                    borderColor: memSortMode === k ? "rgba(140,110,180,.35)" : "rgba(196,166,184,.25)",
                  }}>{lbl}</button>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              {/* 手动添加 */}
              <div style={{ display: "flex", gap: 4 }}>
                <input className="mem-add-input" placeholder="记录一条…" value={memInput} onChange={e => setMemInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing && memInput.trim()) addMemory(memCharId, "fact", memInput); }}
                  style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.3)", background: "rgba(255,255,255,.6)", width: 120, outline: "none", fontFamily: "var(--font-main)", color: "#4a3a5a" }}
                />
                <button disabled={!memInput.trim()} onClick={() => addMemory(memCharId, "fact", memInput)}
                  style={{ ...btnSmall, opacity: memInput.trim() ? 1 : 0.4 }}>+</button>
              </div>
            </div>

            {/* 记忆列表 */}
            {filteredMemories.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)", padding: "12px 0" }}>
                {memTypeFilter === "all" ? "还没有记忆" : "该分类暂无记忆"}
              </div>
            ) : (
              filteredMemories.map(mem => {
                const heat = calculateHeat(mem);
                const heatInfo = getHeatLevel(heat);
                const isPinned = mem.pinned ?? false;
                const isBlocked = (mem.injectable ?? true) === false;
                const isExpanded = expandedMemId === mem.id;
                const srcLabel = { migration: "迁入", auto: "AI", diary: "日记", manual: "" }[mem.source] || "";
                // 热度点颜色
                const dotColor = isBlocked ? "#ccc" : heatInfo.level === "hot" ? "#e07070" : heatInfo.level === "warm" ? "#e0a050" : heatInfo.level === "fading" ? "#ccc" : "#ddd";

                return (
                  <div key={mem.id} style={{
                    marginBottom: 6, padding: "8px 12px", borderRadius: 10,
                    background: isPinned ? "rgba(100,110,200,.05)" : isBlocked ? "rgba(180,180,180,.05)" : "rgba(255,255,255,.45)",
                    border: `1px solid ${isPinned ? "rgba(100,110,200,.15)" : "rgba(196,166,184,.15)"}`,
                    opacity: isBlocked ? 0.5 : heatInfo.level === "cold" ? 0.6 : 1,
                    cursor: "pointer", transition: "all .15s",
                  }} onClick={() => setExpandedMemId(isExpanded ? null : mem.id)}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      {/* 热度点 */}
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0, marginTop: 5 }} />
                      {/* 内容 */}
                      <div style={{ flex: 1, fontSize: 13, color: "#4a3a5a", lineHeight: 1.6, textDecoration: isBlocked ? "line-through" : "none" }}>
                        {isPinned && <span style={{ marginRight: 2 }}>📌</span>}
                        {mem.important && !isPinned && <span style={{ marginRight: 2 }}>⭐</span>}
                        {srcLabel && <span style={{ fontSize: 11, color: "var(--accent-iris)", marginRight: 3 }}>[{srcLabel}]</span>}
                        {mem.text}
                      </div>
                      {/* 操作图标 */}
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); pinMemory(memCharId, mem._type, mem.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: isPinned ? "#6070c8" : "#ccc", padding: 2 }}>
                          {isPinned ? "📌" : "📍"}
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleMemoryImportant(memCharId, mem._type, mem.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: mem.important ? "#f5a623" : "#ccc", padding: 2 }}>
                          {mem.important ? "★" : "☆"}
                        </button>
                      </div>
                    </div>
                    {/* 展开详情 */}
                    {isExpanded && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(196,166,184,.15)" }}>
                        <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-faint)", marginBottom: 6, flexWrap: "wrap" }}>
                          <span>{mem.time}</span>
                          {mem.mentions > 0 && <span>🔥 ×{mem.mentions}</span>}
                          <span>{heatInfo.emoji} {heatInfo.label}</span>
                          <span style={{ color: "#9a8aac" }}>
                            {V1_TO_V2_TYPE_MAP[mem._type] === "her_world" && "她的世界"}
                            {V1_TO_V2_TYPE_MAP[mem._type] === "moments" && "我想记住的"}
                            {V1_TO_V2_TYPE_MAP[mem._type] === "understanding" && "我懂她的"}
                          </span>
                        </div>
                        {/* 关联原话（如果有） */}
                        {(mem.rawIds || []).length > 0 && (() => {
                          const rawQuotes = char.rawQuotes || [];
                          const linked = rawQuotes.filter(q => (mem.rawIds || []).includes(q.id));
                          if (linked.length === 0) return null;
                          return (
                            <div style={{ fontSize: 12, color: "#8a7a9a", fontStyle: "italic", padding: "6px 8px", background: "rgba(196,166,184,.06)", borderRadius: 8, marginBottom: 6, lineHeight: 1.6 }}>
                              💬 关联原话：
                              {linked.map(q => (
                                <div key={q.id} style={{ marginTop: 2 }}>
                                  {(q.snippets || []).map((s, i) => (
                                    <div key={i}>「{s.text}」—— {s.speaker}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); toggleInjectable(memCharId, mem._type, mem.id); }} style={{ ...btnSmall, fontSize: 11, color: isBlocked ? "#bbb" : "#8a9ac8" }}>
                            {isBlocked ? "🔕 已暂停" : "✨ 可唤醒"}
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteMemory(memCharId, mem._type, mem.id); }} style={{ ...btnSmall, fontSize: 11, color: "#c07070" }}>
                            删除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ────── 区域 4：总结（默认折叠） ────── */}
          <div ref={summaryRef}>
            <div onClick={() => setSummaryOpen(!summaryOpen)} style={{
              fontSize: 13, fontWeight: 500, letterSpacing: 2, color: "var(--text-deep)",
              display: "flex", alignItems: "center", gap: 8, margin: "20px 0 12px", cursor: "pointer",
            }}>
              <span>📊</span>
              <span>阶段沉淀</span>
              <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 400, letterSpacing: 0 }}>
                {pendingDrafts.length > 0 ? `${pendingDrafts.length} 待确认` : `${(_mem.summaries || []).length} 段记录`}
              </span>
              <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(196,166,184,.3), transparent)" }} />
              <span style={{ fontSize: 12, color: "var(--text-faint)", transform: summaryOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
            </div>

            {summaryOpen && (
              <div>
                {/* 生成按钮 */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }}
                    onClick={() => { setSettlementNotice?.(""); generateSettlement?.(memCharId); }}
                    disabled={reflecting}>
                    {reflecting ? "🌿 沉淀中…" : "🌿 生成阶段沉淀"}
                  </button>
                  <select value={getReflectSetting(memCharId).periodDays}
                    onChange={e => setReflectSettings(prev => ({ ...prev, [memCharId]: { ...getReflectSetting(memCharId), periodDays: Number(e.target.value) } }))}
                    style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(196,166,184,.3)", fontSize: 11, background: "rgba(255,255,255,.7)", color: "var(--text-mid)", cursor: "pointer" }}>
                    <option value={3}>3天</option><option value={7}>1周</option><option value={14}>2周</option><option value={30}>1月</option>
                  </select>
                </div>

                {settlementNotice && (
                  <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 10, marginBottom: 10, background: "rgba(220,180,80,.08)", border: "1px solid rgba(220,180,80,.2)", color: "#a08040", display: "flex", gap: 6 }}>
                    <span>💡</span><span>{settlementNotice}</span>
                  </div>
                )}

                {/* 待确认草稿 */}
                {pendingDrafts.map(draft => {
                  const ch = characters.find(c => c.id === memCharId);
                  return (
                    <SettlementDraftCard key={draft.id} draft={draft}
                      onApplySection={section => applySettlementSection?.(draft.id, section, memCharId)}
                      onDismiss={() => dismissSettlementDraft?.(draft.id)}
                      onDelete={() => deleteSettlementDraft?.(draft.id)}
                      onNavigate={navTarget => { if (navTarget === "charEdit" && ch) setEditingChar?.(ch); }}
                    />
                  );
                })}

                {/* 手动记录 */}
                {!showAddSummary ? (
                  <button className="btn-ghost" style={{ width: "100%", marginBottom: 8, fontSize: 12 }} onClick={() => setShowAddSummary(true)}>+ 手动记录</button>
                ) : (
                  <div style={{ marginBottom: 8 }}>
                    <textarea className="field-textarea" placeholder="写下关系变化…" value={summaryInput} onChange={e => setSummaryInput(e.target.value)} style={{ minHeight: 80 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setShowAddSummary(false); setSummaryInput(""); }}>取消</button>
                      <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} disabled={!summaryInput.trim()} onClick={() => addSummary(memCharId, summaryInput)}>保存</button>
                    </div>
                  </div>
                )}

                {/* 历史总结 */}
                {(_mem.summaries || []).map(s => (
                  <div key={s.id} style={{ padding: "8px 12px", borderRadius: 10, marginBottom: 6, background: "rgba(255,255,255,.4)", border: "1px solid rgba(196,166,184,.15)" }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>{s.isAutoReflect ? "🧠 AI反思" : "✍️ 手动"} · {s.time}</div>
                    <div style={{ fontSize: 12, color: "var(--text-main)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{s.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 概览模式 ═══ */}
      {viewMode === "overview" && (
        <div className="mem-scroll" style={{ padding: "0 14px 32px" }}>
          {/* 顶部统计 */}
          <div style={{ display: "flex", marginBottom: 16, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.55)", border: "1px solid rgba(196,166,184,.18)" }}>
            {overviewStats.map((s, i, arr) => (
              <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid rgba(196,166,184,.2)" : "none" }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: "#4a3a5e", lineHeight: 1 }}>{s.emoji} {s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 四张卡片 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { emoji: "📌", label: "钉子", val: anchors.length, sub: "颗", ref: anchorRef },
              { emoji: "📖", label: "词典", val: lexicon.length, sub: "条", ref: lexRef },
              { emoji: "🧠", label: "记忆", val: _totalMem, sub: "条", ref: memRef, extra: `${(_mem.fact || []).length} 事实 · ${(_mem.emotion || []).length} 情绪 · ${(_mem.insight || []).length} 觉察` },
              { emoji: "📊", label: "总结", val: (_mem.summaries || []).length, sub: "段", ref: summaryRef, badge: pendingDrafts.length > 0 ? `🌿 ${pendingDrafts.length} 待确认` : null },
            ].map(card => (
              <div key={card.label} onClick={() => { setViewMode("list"); setTimeout(() => card.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                style={{ background: "rgba(255,255,255,.72)", backdropFilter: "blur(10px)", borderRadius: 16, border: "1px solid rgba(196,166,184,.2)", padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{card.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#5a4a6a" }}>{card.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#3a2e4a", lineHeight: 1 }}>{card.val}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{card.sub}</div>
                {card.extra && <div style={{ fontSize: 11, color: "#9a8aac", marginTop: 6, lineHeight: 1.5 }}>{card.extra}</div>}
                {card.badge && <div style={{ fontSize: 11, color: "#6a7aae", marginTop: 4 }}>{card.badge}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
