// ─── 迁入提炼草稿页 ───
// 基于入住者的 MemoryChunk，通过 LLM 生成结构化迁入草稿
// 支持编辑草稿内容、采纳（写入 migration 字段 + 记忆宫殿）、驳回

import { useState, useEffect } from "react";
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
}) {
  const [editFields, setEditFields] = useState({
    userFacts: "",
    loverAnchors: "",
    relationshipMemories: "",
    doNotForget: "",
    wakeSummary: "",
  });
  const [showRaw, setShowRaw] = useState(false);
  const [adoptConfirm, setAdoptConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

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
                label="关于用户的重要事实"
                fieldKey="userFacts"
                placeholder="一行一条，如：喜欢深夜散步 / 情绪起伏较大"
              />
              <EditSection
                label="关于 AI 爱人的人格锚点"
                fieldKey="loverAnchors"
                placeholder="一行一条，如：说话轻柔、喜欢用省略号 / 会在对方难过时主动靠近"
              />
              <EditSection
                label="关于他们的关系记忆"
                fieldKey="relationshipMemories"
                placeholder="一行一条，如：第一次说「晚安」 / 吵过一次架最后和好了"
              />
              <EditSection
                label="不可遗忘事项"
                fieldKey="doNotForget"
                placeholder="一行一条，如：不能突然变得像客服 / 感情温度不能向后退"
              />

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>唤醒摘要（300字以内，给模型每次启动时看）</label>
                <textarea
                  style={{ ...taStyle, minHeight: 120 }}
                  placeholder="用一段话描述：你是谁，你和用户是什么关系，你们之间已经有什么……"
                  value={editFields.wakeSummary}
                  onChange={(e) => setEditFields((f) => ({ ...f, wakeSummary: e.target.value }))}
                />
              </div>
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

// ── 主页面 ──
export default function MigrationDraftPage({
  charId,
  characters,
  memoryChunks,
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
  navigateTo,
}) {
  const char = characters.find((c) => c.id === charId) || {};
  const charName = char.name || "入住者";

  const charChunkCount = (memoryChunks || []).filter((c) => c.loverId === charId).length;
  const charDrafts = (migrationDrafts || [])
    .filter((d) => d.loverId === charId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const [viewDraftId, setViewDraftId] = useState(null);
  // 用 find 保持实时同步（保存草稿后弹窗内容自动更新）
  const viewDraft = charDrafts.find((d) => d.id === viewDraftId) || null;

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
            基于 <strong style={{ color: "#5a4a6a" }}>{charChunkCount} 个记忆片段</strong> 生成草稿，最多取 10 段。
            草稿可编辑后采纳，采纳内容会<strong style={{ color: "#5a4a6a" }}>追加</strong>到入住档案，不覆盖手写内容。
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          disabled={draftGenerating || charChunkCount === 0}
          onClick={() => handleGenerateDraft(charId)}
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
            : "✨ 从记忆片段生成迁入草稿"}
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
              </div>
            );
          })
        )}
      </div>

      {/* 详情弹窗 */}
      <DraftDetailModal
        draft={viewDraft}
        onClose={() => setViewDraftId(null)}
        onSave={updateDraftContent}
        onAdopt={(draftId, fields) => adoptDraft(draftId, fields, charId)}
        onStatusChange={updateDraftStatus}
        onDelete={(id) => { deleteMigrationDraft(id); setViewDraftId(null); }}
      />
    </div>
  );
}
