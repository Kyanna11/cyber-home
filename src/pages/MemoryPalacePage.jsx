// ─── 记忆宫殿页 ───
// 管理角色的三类记忆（事实/情绪/觉察）和总结，含 AI 反思、人格成长功能

import BackButton from "../components/BackButton";
import { MEMORY_TYPES } from "../constants";
import { calculateHeat, getHeatLevel } from "../utils/memory";

// ── 阶段沉淀草稿卡片 ──
const SETTLEMENT_SECTIONS = [
  { key: "relationshipChange", label: "关系变化记录", emoji: "📖", hint: "追加到「关系基础」" },
  { key: "wakeSummaryUpdate",  label: "唤醒摘要建议", emoji: "🌙", hint: "替换「唤醒摘要」" },
  { key: "newRules",           label: "不可遗忘追加", emoji: "🔒", hint: "追加到「不可改变的规则」" },
  { key: "suggestedMemories",  label: "记忆锚点建议", emoji: "📌", hint: "写入固定锚点记忆" },
];

function SettlementDraftCard({ draft, onApplySection, onDismiss, onDelete }) {
  const applied = draft.appliedSections || [];
  const date = new Date(draft.createdAt).toLocaleDateString("zh-CN");

  return (
    <div style={{
      borderRadius: 14, marginBottom: 16,
      border: "1px solid rgba(106,122,174,.25)",
      background: "rgba(106,122,174,.06)",
      overflow: "hidden",
    }}>
      {/* 头部 */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px 10px",
        borderBottom: "1px solid rgba(106,122,174,.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>阶段沉淀草稿</div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 1 }}>{date} · 等待确认</div>
          </div>
        </div>
        {applied.length > 0 && (
          <span style={{ fontSize: 10, color: "#6a9a6a", background: "rgba(100,160,100,.1)", padding: "2px 8px", borderRadius: 8 }}>
            已采纳 {applied.length} / {SETTLEMENT_SECTIONS.filter(s => {
              const c = draft[s.key];
              return c && (Array.isArray(c) ? c.length > 0 : String(c).trim());
            }).length} 节
          </span>
        )}
      </div>

      {/* 各节内容 */}
      <div style={{ padding: "10px 14px 6px" }}>
        {SETTLEMENT_SECTIONS.map(({ key, label, emoji, hint }) => {
          const raw = draft[key];  // 直接从 draft 顶层读取，没有 content 包裹层
          if (!raw || (Array.isArray(raw) ? raw.length === 0 : !String(raw).trim())) return null;
          const displayText = Array.isArray(raw) ? raw.join("\n") : String(raw);
          const isApplied = applied.includes(key);

          return (
            <div key={key} style={{
              marginBottom: 10, padding: "10px 12px",
              borderRadius: 10,
              background: isApplied ? "rgba(100,160,100,.06)" : "rgba(255,255,255,.55)",
              border: `1px solid ${isApplied ? "rgba(100,160,100,.2)" : "rgba(196,166,184,.2)"}`,
              transition: "all .2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span>{emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)" }}>{label}</span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>({hint})</span>
                </div>
                {isApplied ? (
                  <span style={{ fontSize: 11, color: "#6a9a6a", display: "flex", alignItems: "center", gap: 3 }}>
                    ✓ 已采纳
                  </span>
                ) : (
                  <button
                    onClick={() => onApplySection(key)}
                    style={{
                      fontSize: 11, padding: "3px 12px", borderRadius: 8, cursor: "pointer",
                      background: "rgba(106,122,174,.15)", border: "1px solid rgba(106,122,174,.3)",
                      color: "#6a7aae", fontFamily: "var(--font-main)",
                    }}
                  >
                    采纳
                  </button>
                )}
              </div>
              <div style={{
                fontSize: 12, color: isApplied ? "#888" : "var(--text-main)",
                lineHeight: 1.75, whiteSpace: "pre-wrap",
                maxHeight: 160, overflowY: "auto",
                textDecoration: isApplied ? "none" : "none",
                opacity: isApplied ? 0.6 : 1,
              }}>
                {displayText}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div style={{
        display: "flex", gap: 8, padding: "8px 14px 12px",
        borderTop: "1px solid rgba(106,122,174,.1)",
      }}>
        <button
          onClick={onDismiss}
          style={{
            flex: 1, fontSize: 12, padding: "6px 0", borderRadius: 8, cursor: "pointer",
            background: "transparent", border: "1px solid rgba(196,166,184,.3)",
            color: "var(--text-faint)", fontFamily: "var(--font-main)",
          }}
        >
          忽略草稿
        </button>
        <button
          onClick={onDelete}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
            background: "transparent", border: "1px solid rgba(200,120,120,.2)",
            color: "#c07070", fontFamily: "var(--font-main)",
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default function MemoryPalacePage({
  memCharId,
  memEntryFrom,
  characters,
  navigateTo,
  openTimeline,
  setEditingChar,
  setEditSection,
  memTab,
  setMemTab,
  memSort,
  setMemSort,
  memFilter,
  setMemFilter,
  memInput,
  setMemInput,
  summaryInput,
  setSummaryInput,
  showAddSummary,
  setShowAddSummary,
  getCharMemories,
  addMemory,
  deleteMemory,
  toggleMemoryImportant,
  pinMemory,
  toggleInjectable,
  getReflectSetting,
  shouldReflect,
  reflecting,
  generateSettlement,
  settlementDrafts,
  settlementNotice,
  setSettlementNotice,
  applySettlementSection,
  dismissSettlementDraft,
  deleteSettlementDraft,
  addSummary,
  worldViews,
  applyFeedbackToProfile,
  reflectSettings,
  setReflectSettings,
}) {
  const charName = (characters.find((c) => c.id === memCharId) || {}).name || "记忆";

  return (
    <div className="memory-page page-fade">
      {/* 顶栏 */}
      <div className="memory-header">
        <BackButton
          onClick={() => {
            if (memEntryFrom === "chat") {
              navigateTo("chat");
            } else {
              const char = characters.find((c) => c.id === memCharId);
              if (char) {
                setEditingChar(JSON.parse(JSON.stringify(char)));
                setEditSection("basic");
              }
              navigateTo("profileEdit");
            }
          }}
          label={memEntryFrom === "chat" ? "回对话" : "档案"}
        />
        <div className="memory-header-title">🏛️ {charName}的记忆宫殿</div>
        {openTimeline ? (
          <button
            onClick={() => openTimeline(memCharId)}
            style={{
              padding: "6px 13px",
              background: "rgba(106,122,174,.12)",
              border: "1px solid rgba(106,122,174,.3)",
              borderRadius: 12,
              color: "#6a7aae",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "var(--font-main)",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            📅 年表
          </button>
        ) : (
          <div className="memory-header-spacer" />
        )}
      </div>

      {/* Tab 栏 */}
      <div className="mem-tabs">
        {MEMORY_TYPES.map((mt) => (
          <button
            key={mt.key}
            className={`mem-tab ${memTab === mt.key ? "active" : ""}`}
            onClick={() => setMemTab(mt.key)}
            style={memTab === mt.key ? { borderBottomColor: mt.color } : {}}
          >
            {mt.emoji} {mt.label}
          </button>
        ))}
        <button
          className={`mem-tab ${memTab === "summary" ? "active" : ""}`}
          onClick={() => setMemTab("summary")}
          style={{ ...(memTab === "summary" ? { borderBottomColor: "#8882a5" } : {}), position: "relative" }}
        >
          📖 总结
          {shouldReflect(memCharId) && (
            <span style={{
              position: "absolute", top: 8, right: 8,
              width: 7, height: 7, borderRadius: "50%",
              background: "#e88", boxShadow: "0 0 4px rgba(232,120,120,.4)",
            }} />
          )}
        </button>
      </div>

      {/* 排序/筛选工具栏（非总结页显示） */}
      {memTab !== "summary" && (() => {
        const entries = getCharMemories(memCharId)[memTab] || [];
        const cnt = {
          all:       entries.length,
          important: entries.filter((m) => m.important).length,
          pinned:    entries.filter((m) => m.pinned ?? false).length,
          blocked:   entries.filter((m) => (m.injectable ?? true) === false).length,
          active:    entries.filter((m) => (m.mentions || 0) > 0).length,
        };
        const badge = (n) => n > 0
          ? <span style={{ marginLeft: 3, fontSize: 10, opacity: 0.7 }}>{n}</span>
          : null;
        return (
          <div className="mem-toolbar">
            <div className="mem-toolbar-group">
              <span className="mem-toolbar-label">排序</span>
              <button className={`mem-toolbar-btn ${memSort === "heat" ? "active" : ""}`} onClick={() => setMemSort("heat")}>热度</button>
              <button className={`mem-toolbar-btn ${memSort === "time" ? "active" : ""}`} onClick={() => setMemSort("time")}>时间</button>
            </div>
            <div className="mem-toolbar-group">
              <span className="mem-toolbar-label">筛选</span>
              <button className={`mem-toolbar-btn ${memFilter === "all" ? "active" : ""}`} onClick={() => setMemFilter("all")}>全部{badge(cnt.all)}</button>
              <button className={`mem-toolbar-btn ${memFilter === "important" ? "active" : ""}`} onClick={() => setMemFilter("important")}>重要{badge(cnt.important)}</button>
              <button className={`mem-toolbar-btn ${memFilter === "pinned" ? "active" : ""}`} onClick={() => setMemFilter("pinned")}>📌 锚点{badge(cnt.pinned)}</button>
              <button className={`mem-toolbar-btn ${memFilter === "blocked" ? "active" : ""}`} onClick={() => setMemFilter("blocked")}>🔕 暂停{badge(cnt.blocked)}</button>
              <button className={`mem-toolbar-btn ${memFilter === "active" ? "active" : ""}`} onClick={() => setMemFilter("active")}>活跃{badge(cnt.active)}</button>
            </div>
          </div>
        );
      })()}

      <div className="mem-scroll">
        {/* ── 记忆列表（事实/情绪/觉察）── */}
        {memTab !== "summary" && (
          <>
            <div className="mem-add-row">
              <input
                className="mem-add-input"
                placeholder={MEMORY_TYPES.find((m) => m.key === memTab)?.desc || "写点什么…"}
                value={memInput}
                onChange={(e) => setMemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    addMemory(memCharId, memTab, memInput);
                  }
                }}
              />
              <button
                className="mem-add-btn"
                disabled={!memInput.trim()}
                onClick={() => addMemory(memCharId, memTab, memInput)}
              >
                记录
              </button>
            </div>

            {/* 注入策略说明 */}
            <div style={{
              fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7,
              padding: "7px 12px", marginBottom: 8,
              background: "rgba(100,100,160,.05)", borderRadius: 8,
              letterSpacing: ".2px",
            }}>
              📌 固定锚点优先进入 system prompt · 🔕 暂停唤醒的记忆保留在这里但不会被注入
            </div>

            {(getCharMemories(memCharId)[memTab] || []).length === 0 && (
              <div className="empty-hint">
                还没有{MEMORY_TYPES.find((m) => m.key === memTab)?.label}类记忆
                <br />
                在上方输入框添加第一条
              </div>
            )}

            {(getCharMemories(memCharId)[memTab] || [])
              .filter((mem) => {
                if (memFilter === "all")       return true;
                if (memFilter === "important") return mem.important;
                if (memFilter === "pinned")    return mem.pinned ?? false;
                if (memFilter === "blocked")   return (mem.injectable ?? true) === false;
                if (memFilter === "active")    return (mem.mentions || 0) > 0;
                return true;
              })
              .sort((a, b) => {
                if (memSort === "heat") {
                  // pinned 永远排最前
                  if ((a.pinned ?? false) !== (b.pinned ?? false)) return (b.pinned ?? false) ? 1 : -1;
                  return (b.mentions || 0) - (a.mentions || 0);
                }
                return 0;
              })
              .map((mem) => {
                const heat = calculateHeat(mem);
                const heatInfo = getHeatLevel(heat);
                const isFading = heatInfo.level === "fading" || heatInfo.level === "cold";
                const isPinned    = mem.pinned    ?? false;
                const isBlocked   = (mem.injectable ?? true) === false;
                const srcLabel    = { migration: "迁入", auto: "AI", diary: "日记", manual: "" }[mem.source] || "";

                // 卡片背景：pinned > important > fading
                let cardBg = undefined;
                let cardBorder = undefined;
                if (isBlocked) {
                  cardBg = "rgba(180,180,180,.08)";
                  cardBorder = "rgba(180,180,180,.15)";
                } else if (isPinned) {
                  cardBg = "rgba(100,110,200,.07)";
                  cardBorder = "rgba(100,110,200,.18)";
                } else if (mem.important) {
                  cardBg = "rgba(255,248,225,.6)";
                  cardBorder = "rgba(245,166,35,.15)";
                } else if (isFading) {
                  cardBg = "rgba(248,245,250,.3)";
                  cardBorder = "rgba(205,193,217,.08)";
                }

                return (
                  <div
                    key={mem.id}
                    className="mem-entry"
                    style={{
                      background: cardBg,
                      opacity: isBlocked ? 0.5 : heatInfo.level === "cold" ? 0.55 : heatInfo.level === "fading" ? 0.75 : 1,
                      borderColor: cardBorder,
                      transition: "all .3s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div className="mem-entry-text" style={{ flex: 1, textDecoration: isBlocked ? "line-through" : "none" }}>
                        {isPinned && <span style={{ marginRight: 3 }}>📌</span>}
                        {mem.important && !isPinned && "⭐ "}
                        {srcLabel && (
                          <span style={{ fontSize: 10, color: "var(--accent-iris)", marginRight: 4, fontWeight: 400 }}>
                            {srcLabel === "AI" ? "🤖AI" : `【${srcLabel}】`}
                          </span>
                        )}
                        {mem.text}
                      </div>
                      <div style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 8, flexShrink: 0,
                        background: isBlocked ? "rgba(150,150,150,.1)" :
                          heatInfo.level === "hot"    ? "rgba(232,120,120,.1)" :
                          heatInfo.level === "warm"   ? "rgba(220,180,80,.1)"  :
                          heatInfo.level === "fading" ? "rgba(200,180,120,.08)" :
                                                        "rgba(155,149,181,.06)",
                        color: isBlocked ? "#999" :
                          heatInfo.level === "hot"  ? "#c47070" :
                          heatInfo.level === "warm" ? "#b09050" : "var(--text-faint)",
                        whiteSpace: "nowrap",
                      }}>
                        {isBlocked ? "🔕 暂停" : `${heatInfo.emoji} ${heatInfo.label}`}
                      </div>
                    </div>
                    <div className="mem-entry-meta">
                      <span className="mem-entry-time">
                        {mem.time}
                        {mem.mentions > 0 && <span style={{ marginLeft: 6 }}>🔥×{mem.mentions}</span>}
                      </span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {/* 固定锚点 */}
                        <button
                          className="mem-entry-del"
                          style={{ color: isPinned ? "#6070c8" : "#bbb", fontSize: 12 }}
                          onClick={() => pinMemory && pinMemory(memCharId, memTab, mem.id)}
                          title={isPinned ? "取消固定" : "固定为锚点（优先注入）"}
                        >
                          {isPinned ? "📌" : "📍"}
                        </button>
                        {/* 注入开关 */}
                        <button
                          className="mem-entry-del"
                          style={{ color: isBlocked ? "#bbb" : "#8a9ac8", fontSize: 11 }}
                          onClick={() => toggleInjectable && toggleInjectable(memCharId, memTab, mem.id)}
                          title={isBlocked ? "允许唤醒（加入 prompt）" : "暂停唤醒（不注入 prompt）"}
                        >
                          {isBlocked ? "🔕" : "✨"}
                        </button>
                        {/* 重要标记 */}
                        <button
                          className="mem-entry-del"
                          style={{ color: mem.important ? "#f5a623" : "#999" }}
                          onClick={() => toggleMemoryImportant(memCharId, memTab, mem.id)}
                          title={mem.important ? "取消重要标记" : "标记为重要记忆"}
                        >
                          {mem.important ? "★" : "☆"}
                        </button>
                        <button className="mem-entry-del" onClick={() => deleteMemory(memCharId, memTab, mem.id)}>
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </>
        )}

        {/* ── 关系沉淀 tab ── */}
        {memTab === "summary" && (
          <>
            {/* 功能说明 */}
            <div style={{
              fontSize: 12, lineHeight: 1.8, letterSpacing: ".3px",
              padding: "10px 14px", borderRadius: 10, marginBottom: 14,
              background: "rgba(106,122,174,.06)",
              border: "1px solid rgba(106,122,174,.15)",
              color: "var(--text-faint)",
            }}>
              <div style={{ marginBottom: 4, color: "var(--text-mid)", fontWeight: 500, fontSize: 12 }}>🌿 关于阶段沉淀</div>
              阶段沉淀用于整理<strong>最近新增</strong>的关系变化，不是迁入旧记录。
              导入旧对话请使用<span style={{ color: "var(--accent-iris)" }}>原始档案馆</span>和<span style={{ color: "var(--accent-iris)" }}>迁入草稿</span>。
              AI 生成草稿后，你逐节确认，不会自动覆盖任何手写内容。
            </div>

            {/* 生成按钮 + 周期设置 */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: settlementNotice ? 8 : 14, flexWrap: "wrap" }}>
              <button
                className="btn-ghost"
                style={{ flex: 1, minWidth: 160 }}
                onClick={() => {
                  setSettlementNotice && setSettlementNotice("");
                  generateSettlement && generateSettlement(memCharId);
                }}
                disabled={reflecting}
              >
                {reflecting ? "🌿 沉淀中……" : "🌿 生成阶段沉淀"}
              </button>
              <select
                value={getReflectSetting(memCharId).periodDays}
                onChange={(e) =>
                  setReflectSettings((prev) => ({
                    ...prev,
                    [memCharId]: { ...getReflectSetting(memCharId), periodDays: Number(e.target.value) },
                  }))
                }
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(196,166,184,.3)", fontSize: 12, background: "rgba(255,255,255,.7)", color: "var(--text-mid)", cursor: "pointer" }}
              >
                <option value={3}>3天一次</option>
                <option value={7}>1周一次</option>
                <option value={14}>2周一次</option>
                <option value={30}>1月一次</option>
              </select>
              {getReflectSetting(memCharId).lastReflectTime && (
                <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                  上次：{new Date(getReflectSetting(memCharId).lastReflectTime).toLocaleDateString("zh-CN")}
                </span>
              )}
            </div>

            {/* ── 内联提示（素材不足 / 空结果 / 错误） ── */}
            {settlementNotice && (
              <div style={{
                fontSize: 12, lineHeight: 1.7, padding: "10px 14px",
                borderRadius: 10, marginBottom: 14,
                background: "rgba(220,180,80,.08)",
                border: "1px solid rgba(220,180,80,.2)",
                color: "#a08040",
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                <span>{settlementNotice}</span>
              </div>
            )}

            {/* ── 待确认沉淀草稿 ── */}
            {(settlementDrafts || [])
              .filter((d) => d.loverId === memCharId && d.status === "pending")
              .map((draft) => (
                <SettlementDraftCard
                  key={draft.id}
                  draft={draft}
                  onApplySection={(section) => applySettlementSection && applySettlementSection(draft.id, section, memCharId)}
                  onDismiss={() => dismissSettlementDraft && dismissSettlementDraft(draft.id)}
                  onDelete={() => deleteSettlementDraft && deleteSettlementDraft(draft.id)}
                />
              ))
            }

            {/* ── 已处理沉淀记录 ── */}
            {(settlementDrafts || [])
              .filter((d) => d.loverId === memCharId && d.status !== "pending")
              .length > 0 && (
              <div style={{ margin: "16px 0 8px", fontSize: 11, color: "var(--text-faint)", letterSpacing: 1 }}>
                已处理的沉淀记录
              </div>
            )}
            {(settlementDrafts || [])
              .filter((d) => d.loverId === memCharId && d.status !== "pending")
              .map((draft) => (
                <div key={draft.id} style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 8,
                  background: "rgba(255,255,255,.4)",
                  border: "1px solid rgba(196,166,184,.15)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 18 }}>{draft.status === "applied" ? "✅" : "🚫"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.5 }}>{draft.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>
                      {draft.status === "applied" ? "已全部采纳" : "已忽略"}
                      {draft.appliedSections?.length > 0 && draft.status !== "applied" &&
                        ` · 已采纳 ${draft.appliedSections.length} 节`}
                    </div>
                  </div>
                  <button
                    style={{ fontSize: 11, color: "#c07070", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
                    onClick={() => deleteSettlementDraft && deleteSettlementDraft(draft.id)}
                  >
                    删除
                  </button>
                </div>
              ))
            }

            {/* ── 手动写总结 ── */}
            <div style={{ margin: "20px 0 10px", fontSize: 11, color: "var(--text-faint)", letterSpacing: 1 }}>
              手动记录
            </div>
            {!showAddSummary ? (
              <button className="btn-ghost" style={{ width: "100%", marginBottom: 12 }} onClick={() => setShowAddSummary(true)}>
                + 手动写一段关系记录
              </button>
            ) : (
              <div className="section-card" style={{ marginBottom: 12 }}>
                <textarea
                  className="field-textarea"
                  placeholder="回顾最近的记忆，写下发生了什么、关系有什么变化……"
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                  style={{ minHeight: 120 }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button className="btn-ghost" onClick={() => { setShowAddSummary(false); setSummaryInput(""); }}>取消</button>
                  <button className="btn-primary" style={{ flex: 1 }} disabled={!summaryInput.trim()} onClick={() => addSummary(memCharId, summaryInput)}>
                    保存
                  </button>
                </div>
              </div>
            )}

            {/* 旧版总结列表（作为历史记录保留） */}
            {(getCharMemories(memCharId).summaries || []).length > 0 && (
              <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-faint)", letterSpacing: 1 }}>历史记录</div>
            )}
            {(getCharMemories(memCharId).summaries || []).length === 0 && !showAddSummary &&
              (settlementDrafts || []).filter((d) => d.loverId === memCharId).length === 0 && (
              <div className="empty-hint">
                还没有任何记录<br />
                点「生成阶段沉淀」让 AI 帮你整理关系变化
              </div>
            )}
            {(getCharMemories(memCharId).summaries || []).map((s) => (
              <div key={s.id} className="summary-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    {s.isAutoReflect ? "🧠 旧版AI反思" : "✍️ 手动记录"} · {s.time}
                  </span>
                </div>
                <div className="summary-entry-text">{s.text}</div>
                {!s.feedbackApplied && (
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <button className="btn-ghost" onClick={() => applyFeedbackToProfile(memCharId, s)} disabled={reflecting} style={{ fontSize: 11, padding: "3px 10px", color: "var(--text-faint)" }}>
                      {reflecting ? "处理中..." : "📜 写入世界观"}
                    </button>
                  </div>
                )}
                {s.feedbackApplied && (
                  <div style={{ marginTop: 8, textAlign: "right", fontSize: 11, color: "var(--text-faint)" }}>✓ 已写入世界观</div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
