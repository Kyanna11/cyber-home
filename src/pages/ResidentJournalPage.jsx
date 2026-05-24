// ─── 他的日记 · 入住者日记系统 ───
// 统一管理所有入住者的日记条目。来源：客厅记录、单聊、亲密邀请。
// 日记不会自动写入记忆，但可生成记忆沉淀草稿供用户审批。

import { useState } from "react";
import { genId } from "../utils/helpers";
import { buildSystemPrompt, buildUserContext } from "../utils/prompt";

// ─── 来源标签 ───
const SOURCE_LABELS = {
  lounge_record:  { emoji: "☕", label: "客厅" },
  chat:           { emoji: "💬", label: "聊天" },
  intimate_scene: { emoji: "🌙", label: "亲密邀请" },
  manual:         { emoji: "✏️", label: "手写" },
};

// ─── 记忆草稿分区定义 ───
const DRAFT_SECTIONS = [
  { key: "charMemorySuggestions",             emoji: "🧠", label: "关于ta应该记住的",  hint: "可进入记忆宫殿" },
  { key: "userProfileSuggestions",            emoji: "👤", label: "关于声声的信息",    hint: "可生成声声档案草稿" },
  { key: "relationshipSettlementSuggestions", emoji: "💫", label: "关系新默契 / 变化", hint: "可进入关系沉淀草稿" },
  { key: "timelineSuggestions",               emoji: "🕰", label: "值得记到时间线",    hint: "可生成时间线事件" },
  { key: "treasureSuggestions",               emoji: "💎", label: "值得珍藏的原话",    hint: "可保存到宝库" },
  { key: "notForLongTermMemory",              emoji: "🍃", label: "只属于这篇日记",    hint: "不建议写入长期记忆" },
];

// ─── 解析 AI JSON 输出（多重兜底）───
function parseDraftOutput(raw) {
  const s = (raw || "").trim();
  // 1. 直接解析
  try { return JSON.parse(s); } catch {}
  // 2. 提取 { ... } 块（处理 markdown 代码块包裹）
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  // 3. 逐字段提取数组（兜底：模型返回了部分 JSON）
  const FIELDS = [
    "charMemorySuggestions", "userProfileSuggestions",
    "relationshipSettlementSuggestions", "timelineSuggestions",
    "treasureSuggestions", "notForLongTermMemory",
  ];
  const result = {};
  let found = false;
  for (const field of FIELDS) {
    const re = new RegExp(`"${field}"\\s*:\\s*(\\[[\\s\\S]*?\\])`, "m");
    const fm = s.match(re);
    if (fm) {
      try { result[field] = JSON.parse(fm[1]); found = true; continue; } catch {}
    }
    result[field] = [];
  }
  return found ? result : null;
}

// ─── 生成记忆沉淀草稿（LLM call）───
async function generateJournalMemoryDraft(journal, char, config, ctxConfig) {
  const model = (config.model === "__custom__" ? config.customModel : config.model) || "";

  const systemPrompt = `你是一个记忆整理助手，帮助用户从入住者日记中提炼值得保存的内容建议。
仅输出纯 JSON，不要输出任何其他文字，不要加 markdown 代码块（不要写 \`\`\`json）。`;

  const taskPrompt = `入住者「${char?.name || "ta"}」写的一篇日记如下：

标题：${journal.title}
来源：${SOURCE_LABELS[journal.sourceType]?.label || journal.sourceType}

正文：
${journal.content}

---

请判断这篇日记中哪些内容值得提炼为待确认的记忆建议，按以下说明填写 JSON：
- charMemorySuggestions：ta 自己应该记住的（事实/感受/觉察），每条 20 字以内
- userProfileSuggestions：关于声声（用户）的新信息，每条 20 字以内
- relationshipSettlementSuggestions：关系变化或新默契，每条 20 字以内
- timelineSuggestions：值得记到时间线的时刻，每条 30 字以内
- treasureSuggestions：值得珍藏的原话或片段（可较长）
- notForLongTermMemory：只属于这次/不该写进长期记忆的内容，每条 20 字以内

注意：不要把整篇日记写入长期记忆；不要把临时玩笑误写成永久事实；没有内容的字段留空数组。

请直接输出 JSON，不要有任何前言后语：
{
  "charMemorySuggestions": [],
  "userProfileSuggestions": [],
  "relationshipSettlementSuggestions": [],
  "timelineSuggestions": [],
  "treasureSuggestions": [],
  "notForLongTermMemory": []
}`;

  const resp = await fetch(
    config.apiUrl.replace(/\/+$/, "") + "/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: taskPrompt },
        ],
        temperature: 0.5,
        max_tokens: ctxConfig?.maxTokens ? Math.min(ctxConfig.maxTokens, 1500) : 1500,
      }),
    }
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const rawText = data.choices?.[0]?.message?.content?.trim() || "";
  const parsed = parseDraftOutput(rawText);
  return {
    _rawText:  rawText,          // 保留原始输出，供面板展示调试用
    _parsed:   parsed !== null,  // 是否成功解析为 JSON
    charMemorySuggestions:             parsed?.charMemorySuggestions             || [],
    userProfileSuggestions:            parsed?.userProfileSuggestions            || [],
    relationshipSettlementSuggestions: parsed?.relationshipSettlementSuggestions || [],
    timelineSuggestions:               parsed?.timelineSuggestions               || [],
    treasureSuggestions:               parsed?.treasureSuggestions               || [],
    notForLongTermMemory:              parsed?.notForLongTermMemory              || [],
  };
}

// ─── 记忆草稿面板 ───
function JournalMemoryDraftPanel({ draft, journal, char, onClose }) {
  const [ignored, setIgnored] = useState(new Set());
  const [copiedSection, setCopiedSection] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const toggle = (key, idx) => {
    const k = `${key}-${idx}`;
    setIgnored((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const copySection = (key, items) => {
    const text = items
      .filter((_, i) => !ignored.has(`${key}-${i}`))
      .join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  // 是否所有区块都没有内容
  const allEmpty = DRAFT_SECTIONS.every(
    ({ key }) => !(draft[key] || []).filter((s) => typeof s === "string" && s.trim()).length
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 360,
      background: "rgba(74,69,96,.52)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, height: "88vh",
        background: "linear-gradient(160deg,#f4f0fa 0%,#ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
        overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
              💡 看看有什么值得记住
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              {char?.name || "ta"} · {journal.title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {/* 提示 */}
        <div style={{
          padding: "8px 16px",
          fontSize: 11, color: "#8a7898", lineHeight: 1.7,
          background: "rgba(196,166,184,.06)",
          borderBottom: "1px solid rgba(196,166,184,.1)",
          flexShrink: 0,
        }}>
          以下内容仅供参考，不会自动写入任何档案。点击条目可标记忽略，按区块复制后自行处理。
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 32px" }}>
          {DRAFT_SECTIONS.map(({ key, emoji, label, hint }) => {
            const items = (draft[key] || []).filter((s) => typeof s === "string" && s.trim());
            if (!items.length) return null;
            const activeItems = items.filter((_, i) => !ignored.has(`${key}-${i}`));
            return (
              <div key={key} style={{ marginBottom: 18 }}>
                {/* 区块标题 */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#5a4a6a" }}>{label}</span>
                    <span style={{
                      fontSize: 10, color: "var(--text-faint)",
                      background: "rgba(196,166,184,.14)",
                      padding: "1px 7px", borderRadius: 8,
                    }}>{hint}</span>
                  </div>
                  {activeItems.length > 0 && (
                    <button
                      onClick={() => copySection(key, items)}
                      style={{
                        padding: "3px 10px", borderRadius: 8, fontSize: 10,
                        background: copiedSection === key ? "rgba(120,100,160,.2)" : "rgba(120,100,160,.08)",
                        border: "1px solid rgba(120,100,160,.18)",
                        color: "#7a5aaa", cursor: "pointer", fontFamily: "var(--font-main)",
                      }}
                    >
                      {copiedSection === key ? "✓ 已复制" : "复制"}
                    </button>
                  )}
                </div>
                {/* 条目列表 */}
                {items.map((item, i) => {
                  const isIgnored = ignored.has(`${key}-${i}`);
                  return (
                    <div
                      key={i}
                      onClick={() => toggle(key, i)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        padding: "8px 10px", marginBottom: 5, borderRadius: 10,
                        background: isIgnored ? "rgba(196,166,184,.06)" : "rgba(255,255,255,.75)",
                        border: `1px solid ${isIgnored ? "rgba(196,166,184,.1)" : "rgba(196,166,184,.2)"}`,
                        cursor: "pointer",
                        transition: "all .15s",
                        opacity: isIgnored ? 0.45 : 1,
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        border: `1.5px solid ${isIgnored ? "rgba(196,166,184,.3)" : "rgba(120,100,160,.3)"}`,
                        background: isIgnored ? "transparent" : "rgba(120,100,160,.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, color: "#7a5aaa",
                      }}>
                        {isIgnored ? "" : "✓"}
                      </div>
                      <span style={{
                        fontSize: 12, color: isIgnored ? "var(--text-faint)" : "#4a3a5a",
                        lineHeight: 1.75, flex: 1,
                        textDecoration: isIgnored ? "line-through" : "none",
                      }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 全部为空时显示提示 */}
          {allEmpty && (
            <div style={{ padding: "32px 0 16px", textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>🍃</div>
              <div style={{
                fontSize: 13, color: "#6a5a7a", lineHeight: 1.9,
                marginBottom: draft._rawText && !draft._parsed ? 16 : 0,
              }}>
                {draft._parsed === false
                  ? "模型的输出格式无法解析，没有提炼到内容。"
                  : "这篇日记暂时没有提炼到记忆建议。"}
              </div>
              {draft._rawText && !draft._parsed && (
                <>
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    style={{
                      padding: "6px 16px", borderRadius: 10, fontSize: 11,
                      background: "rgba(120,100,160,.08)",
                      border: "1px solid rgba(120,100,160,.18)",
                      color: "#7a5aaa", cursor: "pointer",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {showRaw ? "收起原始输出" : "查看原始输出"}
                  </button>
                  {showRaw && (
                    <pre style={{
                      marginTop: 12, padding: "12px 14px", borderRadius: 10, textAlign: "left",
                      background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.2)",
                      fontSize: 11, color: "#5a4a6a", lineHeight: 1.7,
                      whiteSpace: "pre-wrap", wordBreak: "break-all", overflow: "auto",
                      maxHeight: 240,
                    }}>
                      {draft._rawText}
                    </pre>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div style={{ padding: "12px 16px 20px", flexShrink: 0, borderTop: "1px solid rgba(196,166,184,.15)" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "11px", borderRadius: 12,
              background: "rgba(120,100,160,.82)", border: "none",
              color: "white", fontSize: 13, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 0.5,
            }}
          >
            收好了
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 日记详情面板 ───
function JournalDetailPanel({
  journal,
  char,
  config,
  ctxConfig,
  onUpdateJournal,
  onDelete,
  onSaveTreasure,
  onShareToChat,
  onClose,
}) {
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [viewingDraft, setViewingDraft] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const src = SOURCE_LABELS[journal.sourceType] || { emoji: "📓", label: "日记" };
  const dateStr = new Date(journal.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const handleGenerateDraft = async () => {
    setDraftError("");
    setGeneratingDraft(true);
    try {
      const draft = await generateJournalMemoryDraft(journal, char, config, ctxConfig);
      const updated = { ...journal, memoryDraft: draft, updatedAt: Date.now() };
      onUpdateJournal?.(updated);
      setViewingDraft(draft);
    } catch (err) {
      setDraftError(`生成失败：${err.message}`);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSaveToTreasure = () => {
    onSaveTreasure?.({
      id: `treasure-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      charId: journal.charId,
      charName: journal.charName,
      title: journal.title,
      content: journal.content,
      type: "essay",
      source: "residentJournal",
      sourceId: journal.id,
      tagsRaw: "",
      note: "",
      important: false,
      savedAt: Date.now(),
    });
  };

  const handleToggleImportant = () => {
    onUpdateJournal?.({ ...journal, important: !journal.important, updatedAt: Date.now() });
  };

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 340,
        background: "rgba(74,69,96,.42)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          width: "100%", maxWidth: 480, height: "90vh",
          background: "linear-gradient(160deg,#f4f0fa 0%,#ece5f5 100%)",
          borderRadius: "20px 20px 0 0",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
          overflow: "hidden",
        }}>
          {/* 顶栏 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px 12px",
            borderBottom: "1px solid rgba(196,166,184,.2)",
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, color: "#5a4a6a", fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {char?.emoji || "📓"} {journal.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <span style={{
                  fontSize: 10, padding: "1px 7px", borderRadius: 8,
                  background: "rgba(196,166,184,.18)", color: "#7a6a8e",
                }}>
                  {src.emoji} {src.label}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{dateStr}</span>
                {journal.important && <span style={{ fontSize: 12 }}>⭐</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                onClick={handleToggleImportant}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, padding: 4, opacity: journal.important ? 1 : 0.35,
                }}
                title={journal.important ? "取消重要" : "标为重要"}
              >
                ⭐
              </button>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
            </div>
          </div>

          {/* 正文 */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 8px" }}>
            <div style={{
              fontSize: 13.5, color: "#3a2e4a", lineHeight: 2.0,
              fontFamily: "var(--font-main)",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {journal.content || "（内容为空）"}
            </div>
          </div>

          {/* 错误提示 */}
          {draftError && (
            <div style={{
              padding: "8px 16px", fontSize: 11, color: "#9a5050",
              background: "rgba(200,140,140,.08)", borderTop: "1px solid rgba(200,140,140,.12)",
              flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ flex: 1 }}>{draftError}</span>
              <button onClick={() => setDraftError("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#9a5050" }}>✕</button>
            </div>
          )}

          {/* 操作区 */}
          <div style={{
            padding: "12px 16px 20px", flexShrink: 0,
            borderTop: "1px solid rgba(196,166,184,.15)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {/* 主操作行 */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={journal.memoryDraft ? () => setViewingDraft(journal.memoryDraft) : handleGenerateDraft}
                disabled={generatingDraft}
                style={{
                  flex: 2, padding: "10px 8px", borderRadius: 12, fontSize: 12,
                  background: generatingDraft
                    ? "rgba(196,166,184,.2)"
                    : journal.memoryDraft
                      ? "rgba(120,100,160,.12)"
                      : "rgba(120,100,160,.85)",
                  border: journal.memoryDraft ? "1px solid rgba(120,100,160,.25)" : "none",
                  color: generatingDraft ? "#9a8aac" : journal.memoryDraft ? "#6a5a7a" : "white",
                  cursor: generatingDraft ? "default" : "pointer",
                  fontFamily: "var(--font-main)", transition: "all .15s",
                }}
              >
                {generatingDraft ? "生成中…" : journal.memoryDraft ? "💡 查看记忆草稿" : "💡 看看有什么值得记住"}
              </button>
              <button
                onClick={() => onShareToChat?.(journal, journal.charId)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 12, fontSize: 12,
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                  color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
                }}
              >
                💬 给他读
              </button>
            </div>
            {/* 次操作行 */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSaveToTreasure}
                style={{
                  flex: 1, padding: "9px 8px", borderRadius: 10, fontSize: 11,
                  background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.25)",
                  color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
                }}
              >
                💎 保存到宝库
              </button>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    padding: "9px 14px", borderRadius: 10, fontSize: 11,
                    background: "none", border: "1px solid rgba(196,166,184,.25)",
                    color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)",
                  }}
                >
                  删除
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onDelete?.(journal.id)} style={{ padding: "9px 12px", borderRadius: 10, fontSize: 11, background: "rgba(180,80,80,.85)", border: "none", color: "white", cursor: "pointer", fontFamily: "var(--font-main)" }}>确认删除</button>
                  <button onClick={() => setDeleteConfirm(false)} style={{ padding: "9px 10px", borderRadius: 10, fontSize: 11, background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)", color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)" }}>取消</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 记忆草稿覆盖层 */}
      {viewingDraft && (
        <JournalMemoryDraftPanel
          draft={viewingDraft}
          journal={journal}
          char={char}
          onClose={() => setViewingDraft(null)}
        />
      )}
    </>
  );
}

// ─── 日记条目卡片 ───
function JournalCard({ journal, char, onClick }) {
  const src = SOURCE_LABELS[journal.sourceType] || { emoji: "📓", label: "日记" };
  const dateStr = new Date(journal.createdAt).toLocaleDateString("zh-CN", {
    month: "numeric", day: "numeric",
  });

  return (
    <div
      onClick={onClick}
      style={{
        marginBottom: 10, borderRadius: 14, overflow: "hidden",
        background: "rgba(255,255,255,.72)", border: "1px solid rgba(196,166,184,.22)",
        cursor: "pointer", transition: "all .15s",
      }}
    >
      <div style={{ padding: "12px 14px" }}>
        {/* 头部：角色信息 + 日期 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 9,
            background: "rgba(196,166,184,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, flexShrink: 0,
          }}>
            {char?.avatarImg
              ? <img src={char.avatarImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} />
              : (char?.emoji || "📓")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, color: "#4a3a5a", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {journal.title}
              {journal.important && <span style={{ marginLeft: 4, fontSize: 11 }}>⭐</span>}
            </div>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-faint)", flexShrink: 0 }}>{dateStr}</span>
        </div>
        {/* 内容摘要 */}
        <div style={{
          fontSize: 11.5, color: "#6a5a7a", lineHeight: 1.7,
          overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {(journal.content || "").slice(0, 120)}
        </div>
        {/* 来源 + 草稿状态 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <span style={{
            fontSize: 10, color: "#8a7898",
            background: "rgba(196,166,184,.15)", padding: "1px 7px", borderRadius: 8,
          }}>
            {src.emoji} {src.label}
          </span>
          {journal.memoryDraft && (
            <span style={{
              fontSize: 10, color: "#7a9878",
              background: "rgba(140,180,140,.12)", padding: "1px 7px", borderRadius: 8,
              border: "1px solid rgba(140,180,140,.2)",
            }}>
              💡 有草稿
            </span>
          )}
          {journal.sourceTitle && (
            <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
              {journal.sourceTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 主页面 ───
export default function ResidentJournalPage({
  navigateTo,
  characters,
  residentJournals,
  onUpdateJournal,
  onDeleteJournal,
  onSaveTreasure,
  onShareJournalToChat,
  config,
  ctxConfig,
  initialCharId,
}) {
  const [selectedCharId, setSelectedCharId] = useState(initialCharId || null);
  const [viewingJournal, setViewingJournal] = useState(null);
  const [sortBy, setSortBy] = useState("date"); // "date" | "char"

  // 有日记的角色列表（去重，按最近有日记的顺序）
  const charsWithJournals = characters.filter((c) =>
    residentJournals.some((j) => j.charId === c.id)
  );

  // 过滤 + 排序
  const filtered = (selectedCharId
    ? residentJournals.filter((j) => j.charId === selectedCharId)
    : residentJournals
  ).slice().sort((a, b) => b.createdAt - a.createdAt);

  const viewingChar = viewingJournal
    ? characters.find((c) => c.id === viewingJournal.charId) || null
    : null;

  const handleDelete = (id) => {
    onDeleteJournal?.(id);
    setViewingJournal(null);
  };

  const handleUpdateJournal = (updated) => {
    onUpdateJournal?.(updated);
    // 如果正在查看这篇，同步更新本地 state
    if (viewingJournal?.id === updated.id) {
      setViewingJournal(updated);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg,#f4f0fa 0%,#ece5f5 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--font-main)",
    }}>
      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "calc(14px + env(safe-area-inset-top,0px)) 18px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        flexShrink: 0,
        background: "rgba(244,240,250,.95)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <button
          onClick={() => navigateTo("bedroom")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 13, color: "#7a6a8e", fontFamily: "var(--font-main)",
            letterSpacing: 0.5,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          回房间
        </button>
        <div style={{
          flex: 1, textAlign: "center",
          fontSize: 16, color: "#4a3a5a", fontWeight: 500, letterSpacing: 2,
        }}>
          他的日记
        </div>
        <div style={{ width: 56 }} />
      </div>

      {/* ── 角色筛选条 ── */}
      {charsWithJournals.length > 1 && (
        <div style={{
          display: "flex", gap: 8, padding: "10px 16px",
          borderBottom: "1px solid rgba(196,166,184,.12)",
          overflow: "auto", flexShrink: 0,
        }}>
          <button
            onClick={() => setSelectedCharId(null)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 11,
              background: !selectedCharId ? "rgba(120,100,160,.14)" : "rgba(255,255,255,.7)",
              border: `1px solid ${!selectedCharId ? "rgba(120,100,160,.35)" : "rgba(196,166,184,.25)"}`,
              color: !selectedCharId ? "#5a4a8a" : "#7a6a8e",
              cursor: "pointer", fontFamily: "var(--font-main)",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            全部
          </button>
          {charsWithJournals.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCharId(c.id)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 11,
                background: selectedCharId === c.id ? "rgba(120,100,160,.14)" : "rgba(255,255,255,.7)",
                border: `1px solid ${selectedCharId === c.id ? "rgba(120,100,160,.35)" : "rgba(196,166,184,.25)"}`,
                color: selectedCharId === c.id ? "#5a4a8a" : "#7a6a8e",
                cursor: "pointer", fontFamily: "var(--font-main)",
                whiteSpace: "nowrap", flexShrink: 0,
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <span>{c.emoji || "💜"}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── 列表主体 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 32px" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 16px",
            fontSize: 13, color: "var(--text-faint)", lineHeight: 2.2,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📓</div>
            {residentJournals.length === 0 ? (
              <>
                还没有入住者日记。<br />
                <span style={{ fontSize: 11 }}>
                  在单聊页「让他记下今天」，<br />
                  或在客厅记录里生成日记。
                </span>
              </>
            ) : (
              <>
                {characters.find((c) => c.id === selectedCharId)?.name || "ta"} 还没有日记。
              </>
            )}
          </div>
        ) : (
          <>
            {/* 如果显示全部，按角色分组 */}
            {!selectedCharId ? (
              charsWithJournals.map((char) => {
                const charJournals = filtered.filter((j) => j.charId === char.id);
                if (!charJournals.length) return null;
                return (
                  <div key={char.id} style={{ marginBottom: 24 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginBottom: 10,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 8,
                        background: "rgba(196,166,184,.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12,
                      }}>
                        {char.avatarImg
                          ? <img src={char.avatarImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                          : (char.emoji || "💜")}
                      </div>
                      <span style={{ fontSize: 12, color: "#6a5a7a", fontWeight: 500 }}>
                        {char.name} <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>· {charJournals.length} 篇</span>
                      </span>
                    </div>
                    {charJournals.map((j) => (
                      <JournalCard
                        key={j.id}
                        journal={j}
                        char={char}
                        onClick={() => setViewingJournal(j)}
                      />
                    ))}
                  </div>
                );
              })
            ) : (
              filtered.map((j) => (
                <JournalCard
                  key={j.id}
                  journal={j}
                  char={characters.find((c) => c.id === j.charId)}
                  onClick={() => setViewingJournal(j)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* ── 日记详情面板 ── */}
      {viewingJournal && (
        <JournalDetailPanel
          journal={viewingJournal}
          char={viewingChar}
          config={config}
          ctxConfig={ctxConfig}
          onUpdateJournal={handleUpdateJournal}
          onDelete={handleDelete}
          onSaveTreasure={onSaveTreasure}
          onShareToChat={onShareJournalToChat}
          onClose={() => setViewingJournal(null)}
        />
      )}
    </div>
  );
}
