// ─── 记忆宫殿页 ───
// 管理角色的三类记忆（事实/情绪/觉察）和总结，含 AI 反思、人格成长功能

import BackButton from "../components/BackButton";
import { MEMORY_TYPES, OCEAN_DIMS } from "../constants";
import { calculateHeat, getHeatLevel } from "../utils/memory";

export default function MemoryPalacePage({
  memCharId,
  memEntryFrom,
  characters,
  navigateTo,
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
  autoReflect,
  oceanSuggestion,
  setOceanSuggestion,
  personalitySuggestion,
  setPersonalitySuggestion,
  applyOceanGrowth,
  applyPersonalityGrowth,
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
        <div className="memory-header-spacer" />
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
      {memTab !== "summary" && (
        <div className="mem-toolbar">
          <div className="mem-toolbar-group">
            <span className="mem-toolbar-label">排序</span>
            <button className={`mem-toolbar-btn ${memSort === "heat" ? "active" : ""}`} onClick={() => setMemSort("heat")}>热度</button>
            <button className={`mem-toolbar-btn ${memSort === "time" ? "active" : ""}`} onClick={() => setMemSort("time")}>时间</button>
          </div>
          <div className="mem-toolbar-group">
            <span className="mem-toolbar-label">筛选</span>
            <button className={`mem-toolbar-btn ${memFilter === "all" ? "active" : ""}`} onClick={() => setMemFilter("all")}>全部</button>
            <button className={`mem-toolbar-btn ${memFilter === "important" ? "active" : ""}`} onClick={() => setMemFilter("important")}>重要</button>
            <button className={`mem-toolbar-btn ${memFilter === "pinned" ? "active" : ""}`} onClick={() => setMemFilter("pinned")}>📌 锚点</button>
            <button className={`mem-toolbar-btn ${memFilter === "blocked" ? "active" : ""}`} onClick={() => setMemFilter("blocked")}>🔕 暂停</button>
            <button className={`mem-toolbar-btn ${memFilter === "active" ? "active" : ""}`} onClick={() => setMemFilter("active")}>活跃</button>
          </div>
        </div>
      )}

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

        {/* ── 总结 tab ── */}
        {memTab === "summary" && (
          <>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 16, lineHeight: 1.7, letterSpacing: ".3px" }}>
              定期总结记忆，提炼出 ta 的认知变化和三观成长。这些总结可以反哺到成员档案的三观体系中。
            </div>

            {/* 周期设置 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12 }}>
              <span>⏰ 总结周期：</span>
              <select
                value={getReflectSetting(memCharId).periodDays}
                onChange={(e) =>
                  setReflectSettings((prev) => ({
                    ...prev,
                    [memCharId]: { ...getReflectSetting(memCharId), periodDays: Number(e.target.value) },
                  }))
                }
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, background: "#fff" }}
              >
                <option value={3}>3天</option>
                <option value={7}>1周</option>
                <option value={14}>2周</option>
                <option value={30}>1个月</option>
              </select>
              {getReflectSetting(memCharId).lastReflectTime && (
                <span style={{ color: "#aaa", fontSize: 12 }}>
                  上次：{new Date(getReflectSetting(memCharId).lastReflectTime).toLocaleDateString("zh-CN")}
                </span>
              )}
            </div>

            {/* AI 反思按钮 */}
            <button className="btn-ghost" onClick={() => autoReflect(memCharId)} disabled={reflecting} style={{ width: "100%", marginBottom: 8 }}>
              {reflecting ? "🧠 反思中..." : "🧠 让ta自己总结"}
            </button>

            {/* 人格成长建议卡片 */}
            {oceanSuggestion && oceanSuggestion.charId === memCharId && (
              <div style={{
                margin: "16px 0", padding: 20, borderRadius: 16,
                background: "linear-gradient(135deg, rgba(168,206,178,.12) 0%, rgba(155,149,181,.08) 100%)",
                border: "1px solid rgba(168,206,178,.25)", animation: "pageFade .5s ease-out",
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 2, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🌱</span> 人格成长建议
                </div>
                <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 16, lineHeight: 1.7 }}>
                  基于最近的记忆反思，ta 觉得自己有了这些变化：
                </div>
                {oceanSuggestion.suggestions.map((s) => {
                  const dim = OCEAN_DIMS.find((d) => d.key === s.key);
                  const isUp = s.diff > 0;
                  return (
                    <div key={s.key} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,.5)", border: "1px solid rgba(205,193,217,.12)", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{dim?.label || s.key}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--text-faint)" }}>{s.oldVal}</span>
                          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>→</span>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-dusk)" }}>{s.newVal}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: isUp ? "#7dab8a" : "#c48585", background: isUp ? "rgba(125,171,138,.1)" : "rgba(196,133,133,.1)", padding: "2px 8px", borderRadius: 8 }}>
                            {isUp ? "+" : ""}{s.diff}
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(155,149,181,.1)", position: "relative", overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ position: "absolute", height: "100%", borderRadius: 3, width: `${s.oldVal}%`, background: "rgba(155,149,181,.2)", transition: "width .4s" }} />
                        <div style={{ position: "absolute", height: "100%", borderRadius: 3, width: `${s.newVal}%`, background: isUp ? "linear-gradient(90deg, rgba(125,171,138,.4), rgba(125,171,138,.7))" : "linear-gradient(90deg, rgba(196,133,133,.4), rgba(196,133,133,.7))", transition: "width .6s" }} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.6, fontStyle: "italic" }}>"{s.reason}"</div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setOceanSuggestion(null)}>暂时不要</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => applyOceanGrowth(memCharId, oceanSuggestion.suggestions)}>🌱 接受成长</button>
                </div>
              </div>
            )}

            {/* 性格设定成长建议 */}
            {personalitySuggestion && personalitySuggestion.charId === memCharId && (
              <div style={{
                margin: "16px 0", padding: 20, borderRadius: 16,
                background: "linear-gradient(135deg, rgba(232,196,196,.12) 0%, rgba(155,149,181,.08) 100%)",
                border: "1px solid rgba(232,196,196,.25)", animation: "pageFade .5s ease-out",
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 2, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🪞</span> 性格设定成长
                </div>
                <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 16, lineHeight: 1.7 }}>
                  基于最近的记忆反思，ta 觉得自己的性格有了这些变化——这些会直接写入档案哦：
                </div>
                {personalitySuggestion.suggestions.map((s, idx) => (
                  <div key={idx} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.5)", border: "1px solid rgba(205,193,217,.12)", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 6, color: "var(--accent-dusk)" }}>{s.fieldLabel}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-mid)", lineHeight: 1.7, fontStyle: "italic" }}>"{s.newValue}"</div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setPersonalitySuggestion(null)}>暂时不要</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => applyPersonalityGrowth(memCharId, personalitySuggestion.suggestions)}>🪞 接受变化</button>
                </div>
              </div>
            )}

            {/* 手动写总结 */}
            {!showAddSummary ? (
              <button className="btn-ghost" style={{ width: "100%", marginBottom: 16 }} onClick={() => setShowAddSummary(true)}>
                + 写一篇新总结
              </button>
            ) : (
              <div className="section-card" style={{ marginBottom: 16 }}>
                <textarea
                  className="field-textarea"
                  placeholder="回顾最近的记忆，写下 ta 的感受、领悟和变化……比如一篇周记。"
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                  style={{ minHeight: 120 }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button className="btn-ghost" onClick={() => { setShowAddSummary(false); setSummaryInput(""); }}>取消</button>
                  <button className="btn-primary" style={{ flex: 1 }} disabled={!summaryInput.trim()} onClick={() => addSummary(memCharId, summaryInput)}>
                    保存总结
                  </button>
                </div>
              </div>
            )}

            {/* 世界观展示 */}
            {worldViews[memCharId] && (
              <div style={{ marginBottom: 16, padding: 12, background: "rgba(245,166,35,0.08)", borderRadius: 10, border: "1px solid rgba(245,166,35,0.2)" }}>
                <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 8, color: "#f5a623" }}>📜 当前世界观（已注入对话）</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{worldViews[memCharId]}</div>
              </div>
            )}

            {/* 空状态 */}
            {(getCharMemories(memCharId).summaries || []).length === 0 && !showAddSummary && (
              <div className="empty-hint">
                还没有总结记录
                <br />
                定期回顾记忆，让 ta 的三观慢慢成形
              </div>
            )}

            {/* 总结列表 */}
            {(getCharMemories(memCharId).summaries || []).map((s) => (
              <div key={s.id} className="summary-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    {s.isAutoReflect ? "🧠 AI反思" : "✍️ 手动记录"} · {s.time}
                  </span>
                </div>
                <div className="summary-entry-text">{s.text}</div>
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  {s.feedbackApplied ? (
                    <span style={{ fontSize: 12, color: "#4CAF50" }}>✅ 已反哺档案</span>
                  ) : (
                    <button className="btn-ghost" onClick={() => applyFeedbackToProfile(memCharId, s)} disabled={reflecting} style={{ fontSize: 12, padding: "4px 12px" }}>
                      {reflecting ? "处理中..." : "📥 反哺档案"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
