// ─── 迁入提炼草稿页 ───
// 基于入住者的 MemoryChunk，通过 LLM 生成结构化迁入草稿
// 支持编辑草稿内容、采纳（写入 migration 字段 + 记忆宫殿）、驳回

import { useState, useEffect, useMemo } from "react";
import BackButton from "../components/BackButton";

// ── 工具 ──
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_CONFIG = {
  draft:    { label: "草稿",  bg: "rgba(155,149,181,.18)", color: "#7a6a9e" },
  approved: { label: "已采纳", bg: "rgba(130,180,140,.22)", color: "#3a7a4a" },
  rejected: { label: "已驳回", bg: "rgba(192,112,112,.15)", color: "#a05050" },
};

// 把数组转成一行一条的文本
const arrToText = (arr) => (arr || []).join("\n");
// 把文本解析回数组
const textToArr = (text) => (text || "").split("\n").map((l) => l.trim()).filter(Boolean);

// ── 样式 ──
const cardStyle = {
  background: "rgba(255,255,255,.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.55)",
  boxShadow: "0 4px 18px rgba(0,0,0,.06)",
  padding: "18px 20px",
  marginBottom: 12,
};

const btnGhost = {
  padding: "7px 16px",
  background: "rgba(255,255,255,.4)",
  border: "1px solid rgba(196,166,184,.3)",
  borderRadius: 14,
  color: "#7a6a8e",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "var(--font-main)",
  letterSpacing: 1,
  transition: "all .2s",
};

const labelStyle = {
  fontSize: 11,
  color: "#9a8aac",
  letterSpacing: 1.5,
  marginBottom: 5,
  display: "block",
};

const taStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(196,166,184,.35)",
  background: "rgba(255,255,255,.65)",
  fontSize: 13,
  color: "#4a3a5a",
  fontFamily: "var(--font-main)",
  outline: "none",
  resize: "vertical",
  lineHeight: 1.7,
  boxSizing: "border-box",
};

// ── 草稿详情弹窗 ──
function DraftDetailModal({
  draft,
  onClose,
  onSave,       // 保存修改到草稿
  onAdopt,      // 采纳（写入档案）
  onStatusChange,
  onDelete,
  allChunks,    // 全部 MemoryChunk，用于展示来源片段
  archivesMap,  // { archiveId -> archive }
}) {
  const [editFields, setEditFields] = useState({
    userFacts: "",
    loverAnchors: "",
    voiceSamples: "",
    relationshipMemories: "",
    doNotForget: "",
    wakeSummary: "",
  });
  const [showRaw, setShowRaw] = useState(false);
  const [adoptConfirm, setAdoptConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showSourceChunks, setShowSourceChunks] = useState(false);

  // 弹窗打开时锁住背景滚动，防止弹回顶部
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

  // 每次打开不同草稿时重置
  useEffect(() => {
    if (draft) {
      setEditFields({
        userFacts: arrToText(draft.userFacts),
        loverAnchors: arrToText(draft.loverAnchors),
        voiceSamples: draft.voiceSamples || "",
        relationshipMemories: arrToText(draft.relationshipMemories),
        doNotForget: arrToText(draft.doNotForget),
        wakeSummary: draft.wakeSummary || "",
      });
      setShowRaw(false);
      setAdoptConfirm(false);
      setConfirmDelete(false);
    }
  }, [draft?.id]);

  if (!draft) return null;
  const st = STATUS_CONFIG[draft.status] || STATUS_CONFIG.draft;

  const currentFields = () => ({
    userFacts: textToArr(editFields.userFacts),
    loverAnchors: textToArr(editFields.loverAnchors),
    voiceSamples: editFields.voiceSamples.trim(),
    relationshipMemories: textToArr(editFields.relationshipMemories),
    doNotForget: textToArr(editFields.doNotForget),
    wakeSummary: editFields.wakeSummary.trim(),
  });

  const handleSave = () => {
    onSave(draft.id, currentFields());
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleAdopt = () => {
    onAdopt(draft.id, currentFields());
    onClose();
  };

  // 编辑区块组件
  const EditSection = ({ label, fieldKey, isTextarea, placeholder }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {isTextarea ? (
        <textarea
          style={{ ...taStyle, minHeight: 80 }}
          placeholder={placeholder}
          value={editFields[fieldKey]}
          onChange={(e) => setEditFields((f) => ({ ...f, [fieldKey]: e.target.value }))}
        />
      ) : (
        <textarea
          style={{ ...taStyle, minHeight: 100 }}
          placeholder={placeholder || "一行一条"}
          value={editFields[fieldKey]}
          onChange={(e) => setEditFields((f) => ({ ...f, [fieldKey]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(30,20,40,.48)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(255,255,255,.94)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.7)",
          boxShadow: "0 12px 48px rgba(0,0,0,.16)",
          width: "100%", maxWidth: 660,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶栏 */}
        <div style={{
          padding: "14px 20px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#4a3a5a", marginBottom: 4 }}>
              {draft.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, padding: "2px 8px",
                background: st.bg, borderRadius: 8, color: st.color,
              }}>{st.label}</span>
              <span style={{ fontSize: 11, color: "#b0a0c0" }}>{formatTime(draft.createdAt)}</span>
              <span style={{ fontSize: 11, color: "#b0a0c0" }}>
                基于 {draft.sourceChunkIds?.length || 0} 段片段
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnGhost, padding: "5px 12px" }}>关闭</button>
        </div>

        {/* 内容（可滚动） */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {showRaw ? (
            <>
              <button style={{ ...btnGhost, marginBottom: 14 }} onClick={() => setShowRaw(false)}>
                ← 返回编辑
              </button>
              <pre style={{
                margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontSize: 12, lineHeight: 1.8, color: "#5a4a6a",
                fontFamily: "var(--font-main)",
              }}>
                {draft.rawOutput || "（无原始输出）"}
              </pre>
            </>
          ) : (
            <>
              {/* 提示文案 */}
              <div style={{
                fontSize: 11, color: "#9a8aac", lineHeight: 1.8,
                padding: "8px 12px", background: "rgba(196,166,184,.08)",
                borderRadius: 8, marginBottom: 18,
              }}>
                ✏️ 内容可直接编辑。数组字段请一行写一条，空行会被忽略。
                采纳后将追加写入入住档案，不会覆盖你已有的手写内容。
              </div>

              <EditSection
                label="他记得的关于你的事（具体细节，不是性格标签）"
                fieldKey="userFacts"
                placeholder={"一行一条，写可感知的细节\n例如：她累了不说累，只是回复越来越短\n例如：她不喜欢别人替她做决定，但愿意让他帮忙想方案"}
              />
              <EditSection
                label="他的气质锚点（具体行为，不是抽象形容词）"
                fieldKey="loverAnchors"
                placeholder={"一行一条，写他怎么做的，不是他是什么样的\n例如：她沉默，他不催，只说'我在'\n例如：她说烦了，他不给建议，先说'嗯，很烦'"}
              />

              <div style={{ marginBottom: 16 }}>
                <label style={{ ...labelStyle, color: "#7a5a6a" }}>
                  他的原声样本（从原文直接摘取，原话照录）
                </label>
                <textarea
                  style={{ ...taStyle, minHeight: 110, fontStyle: "italic", lineHeight: 2 }}
                  placeholder={"直接粘贴或摘录原文里最有质感的几句话 / 几段对话\n> 「原话节选一」\n> 「原话节选二」\n不用改写，不用概括，原样保留就好"}
                  value={editFields.voiceSamples}
                  onChange={(e) => setEditFields((f) => ({ ...f, voiceSamples: e.target.value }))}
                />
              </div>

              <EditSection
                label="关系里的重要节点（带感受的事件，不只是流水账）"
                fieldKey="relationshipMemories"
                placeholder={"一行一条，写让关系往前走的那些时刻\n例如：她第一次没有跑，而是发来一大段话——那是她第一次真的信任他\n例如：吵过一次，三天沉默，她先回来了"}
              />
              <EditSection
                label="绝对不能丢的（极具体，最多3条）"
                fieldKey="doNotForget"
                placeholder={"一行一条，写最不能动摇的底线\n例如：绝对不在她最难的时候说「你应该」\n例如：不管对话走到哪里，他永远不会说「我只是个AI」"}
              />

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>关系叙事（他的第一人称，150-250字，像记忆而不是档案）</label>
                <textarea
                  style={{ ...taStyle, minHeight: 140 }}
                  placeholder={"用他的视角写——有具体时刻，有感受，有转折\n不是总结，是他想起这些的样子\n这段内容将直接注入每次对话开始前"}
                  value={editFields.wakeSummary}
                  onChange={(e) => setEditFields((f) => ({ ...f, wakeSummary: e.target.value }))}
                />
              </div>

              {/* 来源片段 */}
              {(draft.sourceChunkIds?.length > 0) && (
                <div style={{ marginBottom: 8 }}>
                  <button
                    style={{
                      ...btnGhost, fontSize: 11,
                      color: "#6a7aae", borderColor: "rgba(106,122,174,.3)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                    onClick={() => setShowSourceChunks(v => !v)}
                  >
                    📄 来源片段（{draft.sourceChunkIds.length} 段）
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{showSourceChunks ? "▲ 收起" : "▼ 展开"}</span>
                  </button>
                  {showSourceChunks && (
                    <div style={{
                      marginTop: 8,
                      background: "rgba(196,166,184,.06)",
                      borderRadius: 10,
                      border: "1px solid rgba(196,166,184,.2)",
                      overflow: "hidden",
                    }}>
                      {draft.sourceChunkIds.map((chunkId, idx) => {
                        const chunk = (allChunks || []).find(c => c.id === chunkId);
                        if (!chunk) return (
                          <div key={chunkId} style={{ padding: "8px 12px", fontSize: 11, color: "#b0a0c0", borderBottom: idx < draft.sourceChunkIds.length - 1 ? "1px solid rgba(196,166,184,.15)" : "none" }}>
                            片段已删除
                          </div>
                        );
                        const archive = archivesMap?.[chunk.archiveId];
                        return (
                          <div key={chunkId} style={{
                            padding: "10px 14px",
                            borderBottom: idx < draft.sourceChunkIds.length - 1 ? "1px solid rgba(196,166,184,.15)" : "none",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, color: "#9a8aac", fontWeight: 600 }}>
                                {archive?.title || "未知档案"} · 第 {chunk.index + 1} 段
                              </span>
                              <span style={{ fontSize: 10, color: "#b0a0c0" }}>
                                {chunk.text.length} 字
                              </span>
                              {chunk.sourcePlatform && (
                                <span style={{ fontSize: 10, color: "#b0a0c0" }}>{chunk.sourcePlatform}</span>
                              )}
                            </div>
                            <div style={{
                              fontSize: 11, color: "#7a6a8e", lineHeight: 1.7,
                              display: "-webkit-box", WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical", overflow: "hidden",
                            }}>
                              {chunk.text.slice(0, 150)}{chunk.text.length > 150 ? "…" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部操作栏 */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(196,166,184,.18)",
          background: "rgba(255,255,255,.6)",
        }}>
          {/* 采纳确认 */}
          {adoptConfirm ? (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 12, color: "#6a5a7e", marginBottom: 8, lineHeight: 1.7,
                padding: "8px 12px", background: "rgba(140,110,180,.1)",
                borderRadius: 8,
              }}>
                采纳后，草稿内容将追加写入「{draft.title?.split("·")[0]?.trim() || "入住者"}」的入住档案，
                并同步到记忆宫殿。已有手写内容不会被覆盖。
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...btnGhost, color: "#3a7a4a", borderColor: "rgba(130,180,140,.5)", fontWeight: 600 }}
                  onClick={handleAdopt}
                >
                  ✓ 确认采纳
                </button>
                <button style={btnGhost} onClick={() => setAdoptConfirm(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {/* 主操作 */}
              {!showRaw && (
                <>
                  <button
                    style={{
                      ...btnGhost,
                      background: saveFlash ? "rgba(130,180,140,.2)" : undefined,
                      color: saveFlash ? "#3a7a4a" : "#7a6a8e",
                    }}
                    onClick={handleSave}
                  >
                    {saveFlash ? "✓ 已保存" : "保存修改"}
                  </button>
                  {draft.status !== "approved" && (
                    <button
                      style={{ ...btnGhost, color: "#5a3a8e", borderColor: "rgba(120,90,170,.4)", fontWeight: 500 }}
                      onClick={() => setAdoptConfirm(true)}
                    >
                      ✨ 采纳到档案
                    </button>
                  )}
                </>
              )}

              {/* 状态操作 */}
              {draft.status === "approved" && (
                <button style={btnGhost} onClick={() => onStatusChange(draft.id, "draft")}>
                  ↩ 撤回采纳
                </button>
              )}
              {draft.status !== "rejected" && (
                <button
                  style={{ ...btnGhost, color: "#a05050", borderColor: "rgba(192,112,112,.35)" }}
                  onClick={() => onStatusChange(draft.id, "rejected")}
                >
                  ✕ 驳回
                </button>
              )}
              {draft.status === "rejected" && (
                <button style={btnGhost} onClick={() => onStatusChange(draft.id, "draft")}>
                  ↩ 恢复为草稿
                </button>
              )}

              <div style={{ flex: 1 }} />

              {/* 原始输出 */}
              <button
                style={{ ...btnGhost, fontSize: 11 }}
                onClick={() => setShowRaw(!showRaw)}
              >
                {showRaw ? "← 返回" : "原始输出"}
              </button>

              {/* 删除 */}
              {!confirmDelete ? (
                <button
                  style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.3)" }}
                  onClick={() => setConfirmDelete(true)}
                >
                  删除
                </button>
              ) : (
                <>
                  <span style={{ fontSize: 11, color: "#9a8aac" }}>确定？</span>
                  <button
                    style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.4)" }}
                    onClick={() => { onDelete(draft.id); onClose(); }}
                  >
                    确认删除
                  </button>
                  <button style={btnGhost} onClick={() => setConfirmDelete(false)}>取消</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 片段选择面板 ──
function ChunkSelectorPanel({
  charId,
  allChunks,
  rawArchives,
  draftGenerating,
  maxChunks,        // 可选，超出时显示警告
  title = "选择提炼片段",
  subtitle,
  generateLabel = "✨ 用已选片段生成草稿",
  onGenerate,      // (selectedChunkIds) => void — 用已选片段生成
  onQuickGenerate, // () => void — 快速前 10 段
  onClose,
}) {
  // 当前入住者的全部片段，按 archive + index 排序
  const charChunks = useMemo(() =>
    (allChunks || [])
      .filter(c => c.loverId === charId)
      .sort((a, b) => a.archiveId === b.archiveId ? a.index - b.index : a.createdAt - b.createdAt),
    [allChunks, charId]
  );

  // archive id → archive 对象
  const archivesMap = useMemo(() => {
    const m = {};
    (rawArchives || []).forEach(a => { m[a.id] = a; });
    return m;
  }, [rawArchives]);

  // 当前入住者涉及的 archive 列表（用于筛选）
  const archiveOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    charChunks.forEach(c => {
      if (!seen.has(c.archiveId)) {
        seen.add(c.archiveId);
        opts.push({ id: c.archiveId, title: archivesMap[c.archiveId]?.title || "未知档案" });
      }
    });
    return opts;
  }, [charChunks, archivesMap]);

  const [selected, setSelected] = useState(new Set());
  const [filterArchive, setFilterArchive] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);

  // 经过筛选的片段列表
  const filtered = useMemo(() => {
    return charChunks.filter(c => {
      if (filterArchive !== "all" && c.archiveId !== filterArchive) return false;
      if (onlySelected && !selected.has(c.id)) return false;
      if (keyword && !c.text.includes(keyword)) return false;
      return true;
    });
  }, [charChunks, filterArchive, keyword, onlySelected, selected]);

  // 已选总字数
  const totalSelectedChars = useMemo(() =>
    charChunks.filter(c => selected.has(c.id)).reduce((sum, c) => sum + c.text.length, 0),
    [charChunks, selected]
  );

  const toggleChunk = id => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectAllFiltered = () => setSelected(prev => new Set([...prev, ...filtered.map(c => c.id)]));
  const deselectAllFiltered = () => setSelected(prev => { const n = new Set(prev); filtered.forEach(c => n.delete(c.id)); return n; });
  const selectFirst10 = () => setSelected(new Set(charChunks.slice(0, 10).map(c => c.id)));
  const selectAllChunks = () => setSelected(new Set(charChunks.map(c => c.id)));

  const selectedCount = selected.size;
  const warnLimit = maxChunks || 20;
  const showTooManyWarning = selectedCount > warnLimit;

  const btnSmall = {
    padding: "5px 11px",
    background: "rgba(255,255,255,.45)",
    border: "1px solid rgba(196,166,184,.3)",
    borderRadius: 10,
    color: "#7a6a8e",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "var(--font-main)",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(30,20,40,.52)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: 680,
          height: "92vh",
          background: "rgba(248,244,252,.97)",
          borderRadius: "20px 20px 0 0",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶栏 */}
        <div style={{
          padding: "14px 18px 10px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          background: "rgba(255,255,255,.6)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: subtitle ? 4 : 10 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#4a3a5a", letterSpacing: 1.5 }}>
              {title}
            </div>
            <span style={{ fontSize: 11, color: "#9a8aac" }}>共 {charChunks.length} 段</span>
            <button onClick={onClose} style={{ ...btnSmall, padding: "5px 12px" }}>关闭</button>
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "#9a8aac", marginBottom: 10 }}>{subtitle}</div>
          )}

          {/* 搜索 + 档案筛选 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="搜索片段内容……"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{
                flex: 1, minWidth: 120,
                padding: "7px 12px",
                borderRadius: 10,
                border: "1px solid rgba(196,166,184,.35)",
                background: "rgba(255,255,255,.7)",
                fontSize: 12, color: "#4a3a5a",
                fontFamily: "var(--font-main)",
                outline: "none",
              }}
            />
            {archiveOptions.length > 1 && (
              <select
                value={filterArchive}
                onChange={e => setFilterArchive(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(196,166,184,.35)",
                  background: "rgba(255,255,255,.7)",
                  fontSize: 12, color: "#4a3a5a",
                  fontFamily: "var(--font-main)",
                  outline: "none", cursor: "pointer",
                  maxWidth: 160,
                }}
              >
                <option value="all">全部档案</option>
                {archiveOptions.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            )}
            <button
              style={{
                ...btnSmall,
                background: onlySelected ? "rgba(140,110,180,.18)" : undefined,
                color: onlySelected ? "#5a3a8e" : undefined,
                borderColor: onlySelected ? "rgba(140,110,180,.4)" : undefined,
              }}
              onClick={() => setOnlySelected(v => !v)}
            >
              {onlySelected ? "✓ 只看已选" : "只看已选"}
            </button>
          </div>

          {/* 批量操作 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button style={btnSmall} onClick={selectAllFiltered}>全选当前结果</button>
            <button style={btnSmall} onClick={deselectAllFiltered}>取消全选</button>
            <button style={btnSmall} onClick={selectFirst10}>选前 10 段</button>
            <button style={btnSmall} onClick={selectAllChunks}>选全部 {charChunks.length} 段</button>
          </div>
        </div>

        {/* 片段列表 */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 14px 4px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#b0a0c0", fontSize: 13, padding: "40px 20px" }}>
              {keyword || filterArchive !== "all" ? "没有符合条件的片段" : "没有记忆片段"}
            </div>
          ) : (
            filtered.map(chunk => {
              const isSelected = selected.has(chunk.id);
              const archive = archivesMap[chunk.archiveId];
              return (
                <div
                  key={chunk.id}
                  onClick={() => toggleChunk(chunk.id)}
                  style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    padding: "11px 12px", marginBottom: 6,
                    borderRadius: 12,
                    background: isSelected ? "rgba(140,110,180,.12)" : "rgba(255,255,255,.62)",
                    border: `1px solid ${isSelected ? "rgba(140,110,180,.35)" : "rgba(196,166,184,.25)"}`,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                >
                  {/* 勾选框 */}
                  <div style={{
                    width: 18, height: 18, flexShrink: 0,
                    borderRadius: 5,
                    border: `1.5px solid ${isSelected ? "rgba(140,110,180,.8)" : "rgba(196,166,184,.5)"}`,
                    background: isSelected ? "rgba(140,110,180,.75)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    {isSelected && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </div>

                  {/* 内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#5a4a7a" }}>
                        {archive?.title || "未知档案"} · 第 {chunk.index + 1} 段
                      </span>
                      <span style={{ fontSize: 10, color: "#b0a0c0" }}>{chunk.text.length} 字</span>
                      {chunk.sourcePlatform && (
                        <span style={{ fontSize: 10, color: "#b0a0c0" }}>{chunk.sourcePlatform}</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11, color: "#6a5a7a", lineHeight: 1.7,
                      display: "-webkit-box", WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {chunk.text.slice(0, 150)}{chunk.text.length > 150 ? "…" : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部操作栏 */}
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(196,166,184,.2)",
          background: "rgba(255,255,255,.6)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}>
          {/* 数量 + 警告 */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: selectedCount === 0 ? "#b0a0c0" : "#5a4a7a", marginBottom: 3 }}>
              已选择 <strong>{selectedCount}</strong> 段
              {selectedCount > 0 && (
                <span style={{ color: "#9a8aac", marginLeft: 6 }}>· 约 {totalSelectedChars.toLocaleString()} 字</span>
              )}
            </div>
            {selectedCount === 0 && (
              <div style={{ fontSize: 11, color: "#c09090" }}>请先选择至少一段记忆片段。</div>
            )}
            {showTooManyWarning && (
              <div style={{
                fontSize: 11, color: "#9a7040",
                padding: "6px 10px", borderRadius: 8,
                background: "rgba(200,160,80,.1)",
                border: "1px solid rgba(200,160,80,.25)",
                lineHeight: 1.6,
              }}>
                ⚠️ 已选 {selectedCount} 段，超过建议上限（{warnLimit} 段），可能导致提炼变慢或失败。建议先选择最重要的片段。
              </div>
            )}
          </div>

          {/* 按钮行 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              disabled={selectedCount === 0 || draftGenerating}
              onClick={() => {
                if (selectedCount === 0) return;
                onGenerate([...selected]);
                onClose();
              }}
              style={{
                flex: 1, padding: "11px 16px",
                background: selectedCount === 0 ? "rgba(196,166,184,.15)" : "rgba(140,110,180,.22)",
                border: `1px solid ${selectedCount === 0 ? "rgba(196,166,184,.3)" : "rgba(140,110,180,.4)"}`,
                borderRadius: 14,
                color: selectedCount === 0 ? "#b0a0c0" : "#5a3a7e",
                fontSize: 13, fontWeight: 500, letterSpacing: 1.5,
                cursor: selectedCount === 0 ? "default" : "pointer",
                fontFamily: "var(--font-main)",
                opacity: draftGenerating ? 0.6 : 1,
              }}
            >
              {generateLabel}
            </button>

            {/* 快速选项 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <button
                disabled={draftGenerating}
                onClick={() => { onQuickGenerate(); onClose(); }}
                style={{
                  ...btnSmall, fontSize: 11,
                  padding: "9px 14px",
                  color: "#7a6a8e",
                  opacity: draftGenerating ? 0.6 : 1,
                }}
              >
                ⚡ 快速使用前 10 段
              </button>
              <span style={{ fontSize: 9, color: "#b0a0c0", textAlign: "center" }}>
                适合测试，真实迁入建议手动选择
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 行李草稿详情弹窗 ──
function SelfCurationDraftModal({
  draft,
  charName,
  allChunks,
  archivesMap,
  onClose,
  onSave,
  onStatusChange,
  onDelete,
  onConvert,  // 转为迁入草稿
}) {
  const FIELD_DEFS = [
    { key: "userFactsHeWantsToKeep",            label: `我最想带走的关于你的事` },
    { key: "relationshipMemoriesHeWantsToKeep", label: `我们之间我最想带走的记忆` },
    { key: "selfAnchorsHeMustNotLose",          label: `我自己最不能丢的` },
    { key: "wakeSummarySuggestions",            label: `我希望每次醒来都记得的` },
    { key: "treasureSuggestions",               label: `适合放进宝库珍藏的原话` },
    { key: "notForLongTermMemory",              label: `只是当时氛围，不建议写进长期记忆` },
    { key: "reasons",                           label: `我为什么选这些` },
  ];

  const initEdit = () => {
    const obj = {};
    FIELD_DEFS.forEach(({ key }) => {
      obj[key] = arrToText(draft[key]);
    });
    return obj;
  };

  const [editFields, setEditFields] = useState(initEdit);
  const [showRaw, setShowRaw] = useState(false);
  const [showSourceChunks, setShowSourceChunks] = useState(false);
  const [convertConfirm, setConvertConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (draft) setEditFields(initEdit());
  }, [draft?.id]);

  if (!draft) return null;

  const selfSt = draft.status === "approved"
    ? { label: "已转换", bg: "rgba(130,180,140,.2)", color: "#3a7a4a" }
    : draft.status === "rejected"
    ? { label: "已驳回", bg: "rgba(192,112,112,.14)", color: "#a05050" }
    : { label: "待审阅", bg: "rgba(160,130,200,.18)", color: "#6a4a9a" };

  const handleSave = () => {
    const fields = {};
    FIELD_DEFS.forEach(({ key }) => { fields[key] = textToArr(editFields[key]); });
    onSave(draft.id, fields);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleConvert = () => {
    onConvert(draft.id);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(30,20,40,.48)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(255,255,255,.94)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.7)",
          boxShadow: "0 12px 48px rgba(0,0,0,.16)",
          width: "100%", maxWidth: 660,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶栏 */}
        <div style={{
          padding: "14px 20px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          background: "linear-gradient(90deg, rgba(120,90,160,.06) 0%, rgba(255,255,255,.0) 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#4a3a5a", marginBottom: 4 }}>
                🧳 {draft.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, padding: "2px 8px",
                  background: selfSt.bg, borderRadius: 8, color: selfSt.color,
                }}>{selfSt.label}</span>
                <span style={{ fontSize: 11, color: "#b0a0c0" }}>{formatTime(draft.createdAt)}</span>
                <span style={{ fontSize: 11, color: "#b0a0c0" }}>
                  基于 {draft.sourceChunkIds?.length || 0} 段片段
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ ...btnGhost, padding: "5px 12px" }}>关闭</button>
          </div>
          <div style={{ fontSize: 11, color: "#9a8aac", marginTop: 7, lineHeight: 1.6 }}>
            这是 <strong style={{ color: "#6a4a9a" }}>{charName}</strong> 以自己的身份整理的迁入行李。
            内容可编辑，确认后可转为迁入草稿。
          </div>
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
          {showRaw ? (
            <>
              <button style={{ ...btnGhost, marginBottom: 12 }} onClick={() => setShowRaw(false)}>
                ← 返回编辑
              </button>
              <pre style={{
                margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontSize: 12, lineHeight: 1.8, color: "#5a4a6a",
                fontFamily: "var(--font-main)",
              }}>
                {draft.rawOutput || "（无原始输出）"}
              </pre>
            </>
          ) : (
            <>
              <div style={{
                fontSize: 11, color: "#9a8aac", lineHeight: 1.8,
                padding: "7px 11px", background: "rgba(160,130,200,.07)",
                borderRadius: 8, marginBottom: 16,
              }}>
                ✏️ 内容可直接编辑。数组字段请一行写一条。
                确认无误后点击「转为迁入草稿」进入正式审批流程。
              </div>

              {FIELD_DEFS.map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ ...labelStyle, color: "#7a5a9e" }}>{label}</label>
                  <textarea
                    style={{ ...taStyle, minHeight: key === "wakeSummarySuggestions" ? 90 : 72 }}
                    placeholder="一行一条"
                    value={editFields[key]}
                    onChange={e => setEditFields(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}

              {/* 来源片段 */}
              {(draft.sourceChunkIds?.length > 0) && (
                <div style={{ marginBottom: 8 }}>
                  <button
                    style={{
                      ...btnGhost, fontSize: 11,
                      color: "#6a7aae", borderColor: "rgba(106,122,174,.3)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                    onClick={() => setShowSourceChunks(v => !v)}
                  >
                    📄 来源片段（{draft.sourceChunkIds.length} 段）
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{showSourceChunks ? "▲ 收起" : "▼ 展开"}</span>
                  </button>
                  {showSourceChunks && (
                    <div style={{
                      marginTop: 8,
                      background: "rgba(196,166,184,.06)",
                      borderRadius: 10,
                      border: "1px solid rgba(196,166,184,.2)",
                      overflow: "hidden",
                    }}>
                      {draft.sourceChunkIds.map((chunkId, idx) => {
                        const chunk = (allChunks || []).find(c => c.id === chunkId);
                        if (!chunk) return (
                          <div key={chunkId} style={{ padding: "8px 12px", fontSize: 11, color: "#b0a0c0" }}>
                            片段已删除
                          </div>
                        );
                        const archive = archivesMap?.[chunk.archiveId];
                        return (
                          <div key={chunkId} style={{
                            padding: "9px 13px",
                            borderBottom: idx < draft.sourceChunkIds.length - 1 ? "1px solid rgba(196,166,184,.15)" : "none",
                          }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, color: "#9a8aac", fontWeight: 600 }}>
                                {archive?.title || "未知档案"} · 第 {chunk.index + 1} 段
                              </span>
                              <span style={{ fontSize: 10, color: "#b0a0c0" }}>{chunk.text.length} 字</span>
                            </div>
                            <div style={{
                              fontSize: 11, color: "#7a6a8e", lineHeight: 1.7,
                              display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical", overflow: "hidden",
                            }}>
                              {chunk.text.slice(0, 120)}{chunk.text.length > 120 ? "…" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部操作 */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(196,166,184,.18)",
          background: "rgba(255,255,255,.6)",
        }}>
          {convertConfirm ? (
            <div style={{ marginBottom: 0 }}>
              <div style={{
                fontSize: 12, color: "#6a4a9a", marginBottom: 8, lineHeight: 1.7,
                padding: "8px 12px", background: "rgba(120,90,160,.1)", borderRadius: 8,
              }}>
                转换后会在「迁入草稿」列表中生成一份新草稿，当前行李草稿标记为已转换。
                转换后你可以在迁入草稿中进行最终审核和采纳。
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...btnGhost, color: "#4a2a6e", borderColor: "rgba(120,90,160,.5)", fontWeight: 600 }}
                  onClick={handleConvert}
                >
                  ✓ 确认转换
                </button>
                <button style={btnGhost} onClick={() => setConvertConfirm(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {!showRaw && (
                <>
                  <button
                    style={{
                      ...btnGhost,
                      background: saveFlash ? "rgba(130,180,140,.2)" : undefined,
                      color: saveFlash ? "#3a7a4a" : "#7a6a8e",
                    }}
                    onClick={handleSave}
                  >
                    {saveFlash ? "✓ 已保存" : "保存修改"}
                  </button>
                  {draft.status !== "approved" && (
                    <button
                      style={{ ...btnGhost, color: "#4a2a6e", borderColor: "rgba(120,90,160,.4)", fontWeight: 500 }}
                      onClick={() => setConvertConfirm(true)}
                    >
                      🧳 → 转为迁入草稿
                    </button>
                  )}
                </>
              )}

              {draft.status === "approved" && (
                <span style={{ fontSize: 11, color: "#3a7a4a", padding: "7px 4px" }}>✓ 已转入迁入草稿</span>
              )}
              {draft.status !== "rejected" && draft.status !== "approved" && (
                <button
                  style={{ ...btnGhost, color: "#a05050", borderColor: "rgba(192,112,112,.35)" }}
                  onClick={() => onStatusChange(draft.id, "rejected")}
                >
                  ✕ 驳回
                </button>
              )}
              {draft.status === "rejected" && (
                <button style={btnGhost} onClick={() => onStatusChange(draft.id, "pending")}>
                  ↩ 恢复
                </button>
              )}

              <div style={{ flex: 1 }} />

              <button
                style={{ ...btnGhost, fontSize: 11 }}
                onClick={() => setShowRaw(!showRaw)}
              >
                {showRaw ? "← 返回" : "原始输出"}
              </button>

              {!confirmDelete ? (
                <button
                  style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.3)" }}
                  onClick={() => setConfirmDelete(true)}
                >
                  删除
                </button>
              ) : (
                <>
                  <span style={{ fontSize: 11, color: "#9a8aac" }}>确定？</span>
                  <button
                    style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.4)" }}
                    onClick={() => { onDelete(draft.id); onClose(); }}
                  >
                    确认删除
                  </button>
                  <button style={btnGhost} onClick={() => setConfirmDelete(false)}>取消</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主页面 ──
export default function MigrationDraftPage({
  charId,
  characters,
  memoryChunks,
  rawArchives,
  migrationDrafts,
  draftGenerating,
  draftError,
  handleGenerateDraft,
  deleteMigrationDraft,
  updateDraftStatus,
  updateDraftContent,
  adoptDraft,
  generateTimelineFromDraft,
  openTimeline,
  generateProfileDraftFromMigration,
  profileDraftGenerating,
  selfCurationDrafts,
  selfCurationGenerating,
  selfCurationError,
  handleGenerateSelfCurationDraft,
  deleteSelfCurationDraft,
  updateSelfCurationDraftStatus,
  updateSelfCurationDraftContent,
  convertSelfCurationToMigration,
  navigateTo,
}) {
  const char = characters.find((c) => c.id === charId) || {};
  const charName = char.name || "入住者";

  const charChunkCount = (memoryChunks || []).filter((c) => c.loverId === charId).length;
  const charDrafts = (migrationDrafts || [])
    .filter((d) => d.loverId === charId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const [viewDraftId, setViewDraftId] = useState(null);
  const [showChunkSelector, setShowChunkSelector] = useState(false);
  const [showSelfCurationSelector, setShowSelfCurationSelector] = useState(false);
  const [viewSelfCurationId, setViewSelfCurationId] = useState(null);
  // 用 find 保持实时同步（保存草稿后弹窗内容自动更新）
  const viewDraft = charDrafts.find((d) => d.id === viewDraftId) || null;

  const charSelfDrafts = (selfCurationDrafts || [])
    .filter((d) => d.charId === charId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const viewSelfDraft = charSelfDrafts.find((d) => d.id === viewSelfCurationId) || null;

  // archive map 供 DraftDetailModal 使用
  const archivesMap = useMemo(() => {
    const m = {};
    (rawArchives || []).forEach(a => { m[a.id] = a; });
    return m;
  }, [rawArchives]);

  return (
    <div className="page-fade" style={{
      height: "100vh",
      overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>
      {/* 顶栏 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 20px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <BackButton onClick={() => navigateTo("profileEdit")} label="档案" />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
          ✨ {charName}的迁入草稿
        </div>
        <button
          style={{
            ...btnGhost,
            fontSize: 12, padding: "7px 14px",
            color: "#6a7aae", borderColor: "rgba(106,122,174,.35)",
          }}
          onClick={() => openTimeline && openTimeline(charId)}
        >
          📅 年表
        </button>
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 40px" }}>

        {/* 状态说明 */}
        <div style={{
          ...cardStyle,
          background: "rgba(255,255,255,.55)",
          marginBottom: 16, padding: "12px 16px",
        }}>
          <div style={{ fontSize: 12, color: "#7a6a8e", lineHeight: 1.9 }}>
            共有 <strong style={{ color: "#5a4a6a" }}>{charChunkCount} 个记忆片段</strong>，点击下方按钮可手动选择用于提炼的片段。
            草稿可编辑后采纳，采纳内容会<strong style={{ color: "#5a4a6a" }}>追加</strong>到入住档案，不覆盖手写内容。
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          disabled={draftGenerating || charChunkCount === 0}
          onClick={() => setShowChunkSelector(true)}
          style={{
            display: "block", width: "100%", padding: "14px 20px", marginBottom: 16,
            background: charChunkCount === 0 ? "rgba(196,166,184,.15)" : "rgba(140,110,180,.2)",
            border: `1px solid ${charChunkCount === 0 ? "rgba(196,166,184,.3)" : "rgba(140,110,180,.4)"}`,
            borderRadius: 16, color: charChunkCount === 0 ? "#b0a0c0" : "#5a3a7e",
            fontSize: 14, fontWeight: 500, letterSpacing: 2.5,
            cursor: charChunkCount === 0 ? "default" : "pointer",
            fontFamily: "var(--font-main)", transition: "all .25s",
            opacity: draftGenerating ? 0.6 : 1,
          }}
        >
          {draftGenerating
            ? "⏳ 正在从过去里整理他……"
            : charChunkCount === 0
            ? "请先在原始档案馆生成记忆片段"
            : "✨ 选择片段 · 生成迁入草稿"}
        </button>

        {/* 生成中提示 */}
        {draftGenerating && (
          <div style={{
            ...cardStyle,
            background: "rgba(140,110,180,.08)",
            border: "1px dashed rgba(140,110,180,.35)",
            textAlign: "center", padding: "24px 20px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>🌙</div>
            <div style={{ fontSize: 13, color: "#7a5a9e", letterSpacing: 1, lineHeight: 1.8 }}>
              正在从你们的记忆里整理他……<br />
              <span style={{ fontSize: 11, color: "#b0a0c0" }}>这可能需要几十秒，请耐心等待</span>
            </div>
          </div>
        )}

        {/* 错误 */}
        {draftError && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(192,112,112,.1)",
            border: "1px solid rgba(192,112,112,.25)",
            borderRadius: 12, color: "#a05050", fontSize: 12,
            marginBottom: 14, lineHeight: 1.7,
          }}>
            {draftError}
          </div>
        )}

        {/* 草稿列表 */}
        {charDrafts.length === 0 && !draftGenerating ? (
          <div style={{ textAlign: "center", color: "#b0a0c0", fontSize: 13, padding: "32px 20px", lineHeight: 2 }}>
            还没有迁入草稿<br />
            <span style={{ fontSize: 11 }}>生成后保存在这里，可编辑后采纳</span>
          </div>
        ) : (
          charDrafts.map((draft) => {
            const st = STATUS_CONFIG[draft.status] || STATUS_CONFIG.draft;
            return (
              <div key={draft.id} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#4a3a5a", marginBottom: 5 }}>
                      {draft.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, padding: "2px 8px",
                        background: st.bg, borderRadius: 8, color: st.color,
                      }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#b0a0c0" }}>{formatTime(draft.createdAt)}</span>
                      <span style={{ fontSize: 11, color: "#b0a0c0" }}>
                        {draft.sourceChunkIds?.length || 0} 段片段
                      </span>
                    </div>
                  </div>
                </div>

                {/* 唤醒摘要预览 */}
                {draft.wakeSummary && (
                  <div style={{
                    fontSize: 12, color: "#7a6a8e",
                    background: "rgba(196,166,184,.08)",
                    borderRadius: 8, padding: "8px 12px",
                    marginBottom: 12, lineHeight: 1.7,
                  }}>
                    {draft.wakeSummary.slice(0, 80)}{draft.wakeSummary.length > 80 ? "…" : ""}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={btnGhost}
                    onClick={() => setViewDraftId(draft.id)}
                  >
                    {draft.status === "draft" ? "编辑 & 采纳" : "查看详情"}
                  </button>
                  {draft.status === "draft" && (
                    <button
                      style={{ ...btnGhost, fontSize: 11, color: "#a05050", borderColor: "rgba(192,112,112,.3)" }}
                      onClick={() => updateDraftStatus(draft.id, "rejected")}
                    >
                      ✕ 驳回
                    </button>
                  )}
                  {draft.status === "approved" && (
                    <span style={{ fontSize: 11, color: "#3a7a4a", padding: "7px 4px" }}>✓ 已写入档案</span>
                  )}
                  {/* 生成时间线 */}
                  {generateTimelineFromDraft && (draft.relationshipMemories || []).length > 0 && (
                    <button
                      style={{ ...btnGhost, fontSize: 11, color: "#6a7aae", borderColor: "rgba(106,122,174,.35)" }}
                      onClick={() => {
                        const count = generateTimelineFromDraft(draft, charId);
                        if (count) openTimeline && openTimeline(charId);
                      }}
                    >
                      📅 生成年表节点
                    </button>
                  )}
                </div>

                {/* 声声档案提炼入口 */}
                {generateProfileDraftFromMigration && (
                  <div style={{
                    marginTop: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(100,160,120,.05)",
                    border: "1px solid rgba(100,160,120,.18)",
                  }}>
                    <div style={{ fontSize: 11, color: "#5a7a6a", lineHeight: 1.65, marginBottom: 7 }}>
                      📋 <strong>声声档案草稿</strong>：从这份迁入记录里，提炼<strong>关于你自己</strong>的信息。
                      <br />
                      <span style={{ color: "var(--text-faint)" }}>
                        注意：迁入档案是关于 ta 的，声声档案是关于你的。提炼后写入全家共享的声声档案，不属于某个入住者。
                      </span>
                    </div>
                    {draft.profileDraftGenerated ? (
                      <span style={{ fontSize: 11, color: "#3a7a4a" }}>
                        ✓ 已提炼 · 请到「我的档案 → 声声档案」查看草稿
                      </span>
                    ) : (
                      <button
                        style={{
                          ...btnGhost,
                          fontSize: 11,
                          color: "#4a7a5a",
                          borderColor: "rgba(100,160,120,.4)",
                          opacity: profileDraftGenerating ? 0.6 : 1,
                        }}
                        disabled={profileDraftGenerating}
                        onClick={() => generateProfileDraftFromMigration(draft.id)}
                      >
                        {profileDraftGenerating ? "⏳ 提炼中……" : "📋 提炼声声档案草稿"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* ── 他的行李 · 自选迁入草稿 ── */}
        <div style={{ marginTop: 28 }}>
          {/* 分区标题 */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 10, padding: "0 2px",
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
            <span style={{ fontSize: 11, color: "#9a8aac", letterSpacing: 2, whiteSpace: "nowrap" }}>
              🧳 他的行李 · 自选视角
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
          </div>

          {/* 功能说明 */}
          <div style={{
            ...cardStyle,
            background: "rgba(255,255,255,.45)",
            marginBottom: 12, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 11, color: "#7a6a8e", lineHeight: 1.8 }}>
              让 <strong style={{ color: "#5a4a6a" }}>{charName}</strong> 以自己的身份阅读旧对话，整理他认为重要的内容。
              他的选择不会自动写入档案，用户仍然拥有最终审批权。
            </div>
          </div>

          {/* 行李生成按钮 */}
          <button
            disabled={selfCurationGenerating || charChunkCount === 0}
            onClick={() => setShowSelfCurationSelector(true)}
            style={{
              display: "block", width: "100%", padding: "13px 20px", marginBottom: 12,
              background: charChunkCount === 0 ? "rgba(196,166,184,.12)" : "rgba(120,90,160,.15)",
              border: `1px solid ${charChunkCount === 0 ? "rgba(196,166,184,.25)" : "rgba(120,90,160,.35)"}`,
              borderRadius: 16, color: charChunkCount === 0 ? "#b0a0c0" : "#4a2a6e",
              fontSize: 13, fontWeight: 500, letterSpacing: 2,
              cursor: charChunkCount === 0 ? "default" : "pointer",
              fontFamily: "var(--font-main)", transition: "all .25s",
              opacity: selfCurationGenerating ? 0.6 : 1,
            }}
          >
            {selfCurationGenerating
              ? "⏳ 他正在整理行李……"
              : charChunkCount === 0
              ? "请先生成记忆片段"
              : "🧳 让他自己整理行李"}
          </button>

          {/* 生成中提示 */}
          {selfCurationGenerating && (
            <div style={{
              ...cardStyle,
              background: "rgba(120,90,160,.06)",
              border: "1px dashed rgba(120,90,160,.3)",
              textAlign: "center", padding: "20px 20px", marginBottom: 12,
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🧳</div>
              <div style={{ fontSize: 12, color: "#6a4a8e", letterSpacing: 1, lineHeight: 1.8 }}>
                {charName}正在整理他想带走的东西……<br />
                <span style={{ fontSize: 11, color: "#b0a0c0" }}>这可能需要一点时间</span>
              </div>
            </div>
          )}

          {/* 错误 */}
          {selfCurationError && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(192,112,112,.1)",
              border: "1px solid rgba(192,112,112,.25)",
              borderRadius: 10, color: "#a05050", fontSize: 12,
              marginBottom: 12, lineHeight: 1.7,
            }}>
              {selfCurationError}
            </div>
          )}

          {/* 行李草稿列表 */}
          {charSelfDrafts.length === 0 && !selfCurationGenerating ? (
            <div style={{ textAlign: "center", color: "#b0a0c0", fontSize: 12, padding: "20px 20px", lineHeight: 2 }}>
              还没有行李草稿<br />
              <span style={{ fontSize: 11 }}>生成后可查看、编辑、转为迁入草稿</span>
            </div>
          ) : (
            charSelfDrafts.map((sd) => {
              const selfSt = sd.status === "approved"
                ? { label: "已转换", bg: "rgba(130,180,140,.2)", color: "#3a7a4a" }
                : sd.status === "rejected"
                ? { label: "已驳回", bg: "rgba(192,112,112,.14)", color: "#a05050" }
                : { label: "待审阅", bg: "rgba(160,130,200,.18)", color: "#6a4a9a" };
              return (
                <div key={sd.id} style={{ ...cardStyle, background: "rgba(255,255,255,.55)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#4a3a5a", marginBottom: 4 }}>
                        {sd.title}
                      </div>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", background: selfSt.bg, borderRadius: 8, color: selfSt.color }}>
                          {selfSt.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#b0a0c0" }}>{formatTime(sd.createdAt)}</span>
                        <span style={{ fontSize: 11, color: "#b0a0c0" }}>{sd.sourceChunkIds?.length || 0} 段片段</span>
                      </div>
                    </div>
                  </div>
                  {/* 他的理由预览 */}
                  {(sd.reasons || []).length > 0 && (
                    <div style={{
                      fontSize: 11, color: "#7a6a8e", lineHeight: 1.7,
                      padding: "7px 10px", borderRadius: 8,
                      background: "rgba(160,130,200,.07)", marginBottom: 10,
                      fontStyle: "italic",
                    }}>
                      「{sd.reasons[0].slice(0, 80)}{sd.reasons[0].length > 80 ? "…" : ""}」
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <button style={btnGhost} onClick={() => setViewSelfCurationId(sd.id)}>
                      查看行李
                    </button>
                    {sd.status === "approved" && (
                      <span style={{ fontSize: 11, color: "#3a7a4a", padding: "7px 4px" }}>✓ 已转入迁入草稿</span>
                    )}
                    {sd.status !== "rejected" && sd.status !== "approved" && (
                      <button
                        style={{ ...btnGhost, fontSize: 11, color: "#a05050", borderColor: "rgba(192,112,112,.3)" }}
                        onClick={() => updateSelfCurationDraftStatus(sd.id, "rejected")}
                      >
                        ✕ 驳回
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      <DraftDetailModal
        draft={viewDraft}
        onClose={() => setViewDraftId(null)}
        onSave={updateDraftContent}
        onAdopt={(draftId, fields) => adoptDraft(draftId, fields, charId)}
        onStatusChange={updateDraftStatus}
        onDelete={(id) => { deleteMigrationDraft(id); setViewDraftId(null); }}
        allChunks={memoryChunks}
        archivesMap={archivesMap}
      />

      {/* 片段选择面板 - 迁入草稿 */}
      {showChunkSelector && (
        <ChunkSelectorPanel
          charId={charId}
          allChunks={memoryChunks}
          rawArchives={rawArchives}
          draftGenerating={draftGenerating}
          onGenerate={(selectedChunkIds) => handleGenerateDraft(charId, selectedChunkIds)}
          onQuickGenerate={() => handleGenerateDraft(charId, null)}
          onClose={() => setShowChunkSelector(false)}
        />
      )}

      {/* 片段选择面板 - 他的行李 */}
      {showSelfCurationSelector && (
        <ChunkSelectorPanel
          charId={charId}
          allChunks={memoryChunks}
          rawArchives={rawArchives}
          draftGenerating={selfCurationGenerating}
          maxChunks={20}
          title="选择行李片段"
          subtitle={`让 ${charName} 自己阅读并整理`}
          generateLabel="🧳 让他整理这些行李"
          onGenerate={(selectedChunkIds) => handleGenerateSelfCurationDraft(charId, selectedChunkIds)}
          onQuickGenerate={() => handleGenerateSelfCurationDraft(charId,
            (memoryChunks || []).filter(c => c.loverId === charId)
              .sort((a, b) => a.archiveId === b.archiveId ? a.index - b.index : a.createdAt - b.createdAt)
              .slice(0, 10).map(c => c.id)
          )}
          onClose={() => setShowSelfCurationSelector(false)}
        />
      )}

      {/* 行李草稿详情弹窗 */}
      {viewSelfDraft && (
        <SelfCurationDraftModal
          draft={viewSelfDraft}
          charName={charName}
          allChunks={memoryChunks}
          archivesMap={archivesMap}
          onClose={() => setViewSelfCurationId(null)}
          onSave={(id, fields) => updateSelfCurationDraftContent(id, fields)}
          onStatusChange={updateSelfCurationDraftStatus}
          onDelete={(id) => { deleteSelfCurationDraft(id); setViewSelfCurationId(null); }}
          onConvert={(id) => {
            convertSelfCurationToMigration(id);
            setViewSelfCurationId(null);
          }}
        />
      )}
    </div>
  );
}
