// ─── 迁入提炼草稿页 ───
// 基于入住者的 MemoryChunk，通过 LLM 生成结构化迁入草稿
// 草稿只读展示，不自动写入 migration 字段，不修改 system prompt

import { useState } from "react";
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

// ── 样式常量 ──
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

// ── 草稿详情弹窗 ──
function DraftDetailModal({ draft, onClose, onStatusChange, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (!draft) return null;

  const st = STATUS_CONFIG[draft.status] || STATUS_CONFIG.draft;

  const Section = ({ title, items, isSummary }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: "#6a5a7e",
        letterSpacing: 1.5, marginBottom: 10,
        paddingBottom: 6,
        borderBottom: "1px solid rgba(196,166,184,.2)",
      }}>
        {title}
      </div>
      {isSummary ? (
        <div style={{ fontSize: 13, color: "#4a3a5a", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
          {draft.wakeSummary || <span style={{ color: "#b0a0c0" }}>（暂无）</span>}
        </div>
      ) : (
        items && items.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: "#4a3a5a", lineHeight: 1.9, marginBottom: 2 }}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 12, color: "#b0a0c0" }}>片段不足，暂无法确认</div>
        )
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
          width: "100%", maxWidth: 640,
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗顶栏 */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#4a3a5a", marginBottom: 4 }}>
              {draft.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 10, padding: "2px 8px",
                background: st.bg, borderRadius: 8, color: st.color, letterSpacing: 0.5,
              }}>
                {st.label}
              </span>
              <span style={{ fontSize: 11, color: "#b0a0c0" }}>{formatTime(draft.createdAt)}</span>
              <span style={{ fontSize: 11, color: "#b0a0c0" }}>
                基于 {draft.sourceChunkIds?.length || 0} 段片段
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnGhost, padding: "5px 12px" }}>关闭</button>
        </div>

        {/* 滚动内容 */}
        <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
          {showRaw ? (
            <div>
              <button style={{ ...btnGhost, marginBottom: 14 }} onClick={() => setShowRaw(false)}>
                ← 返回草稿
              </button>
              <pre style={{
                margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontSize: 12, lineHeight: 1.8, color: "#5a4a6a",
                fontFamily: "var(--font-main)",
              }}>
                {draft.rawOutput || "（无原始输出）"}
              </pre>
            </div>
          ) : (
            <>
              <Section title="关于用户的重要事实" items={draft.userFacts} />
              <Section title="关于 AI 爱人的人格锚点" items={draft.loverAnchors} />
              <Section title="关于他们的关系记忆" items={draft.relationshipMemories} />
              <Section title="不可遗忘事项" items={draft.doNotForget} />
              <Section title="唤醒摘要" isSummary />
            </>
          )}
        </div>

        {/* 底部操作栏 */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(196,166,184,.18)",
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        }}>
          {/* 状态操作 */}
          {draft.status !== "approved" && (
            <button
              style={{ ...btnGhost, color: "#3a7a4a", borderColor: "rgba(130,180,140,.45)" }}
              onClick={() => onStatusChange(draft.id, "approved")}
            >
              ✓ 采纳
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
          {draft.status !== "draft" && (
            <button
              style={btnGhost}
              onClick={() => onStatusChange(draft.id, "draft")}
            >
              ↩ 改回草稿
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* 查看原始输出 */}
          <button
            style={{ ...btnGhost, fontSize: 11 }}
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? "← 草稿" : "查看原始输出"}
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
              <span style={{ fontSize: 11, color: "#9a8aac" }}>确定删除？</span>
              <button
                style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.4)" }}
                onClick={() => { onDelete(draft.id); onClose(); }}
              >
                确认
              </button>
              <button style={btnGhost} onClick={() => setConfirmDelete(false)}>取消</button>
            </>
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
  navigateTo,
}) {
  const char = characters.find((c) => c.id === charId) || {};
  const charName = char.name || "入住者";

  const charChunkCount = (memoryChunks || []).filter((c) => c.loverId === charId).length;
  const charDrafts = (migrationDrafts || [])
    .filter((d) => d.loverId === charId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const [viewDraftId, setViewDraftId] = useState(null);
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
        <div style={{ width: 48 }} />
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 40px" }}>

        {/* 状态说明卡 */}
        <div style={{
          ...cardStyle,
          background: "rgba(255,255,255,.55)",
          marginBottom: 16,
          padding: "14px 18px",
        }}>
          <div style={{ fontSize: 12, color: "#7a6a8e", lineHeight: 1.9 }}>
            基于 <strong style={{ color: "#5a4a6a" }}>{charChunkCount} 个记忆片段</strong>（最多取 10 段）生成迁入提炼草稿。
            <br />
            草稿只读展示，不会自动覆盖档案或修改 system prompt。
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          disabled={draftGenerating || charChunkCount === 0}
          onClick={() => handleGenerateDraft(charId)}
          style={{
            display: "block",
            width: "100%",
            padding: "14px 20px",
            marginBottom: 16,
            background: charChunkCount === 0
              ? "rgba(196,166,184,.15)"
              : "rgba(140,110,180,.2)",
            border: `1px solid ${charChunkCount === 0 ? "rgba(196,166,184,.3)" : "rgba(140,110,180,.4)"}`,
            borderRadius: 16,
            color: charChunkCount === 0 ? "#b0a0c0" : "#5a3a7e",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 2.5,
            cursor: charChunkCount === 0 ? "default" : "pointer",
            fontFamily: "var(--font-main)",
            transition: "all .25s",
            opacity: draftGenerating ? 0.6 : 1,
          }}
        >
          {draftGenerating
            ? "⏳ 正在从过去里整理他……"
            : charChunkCount === 0
            ? "请先在原始档案馆生成记忆片段"
            : "✨ 从记忆片段生成迁入草稿"}
        </button>

        {/* 生成中动画卡 */}
        {draftGenerating && (
          <div style={{
            ...cardStyle,
            background: "rgba(140,110,180,.08)",
            border: "1px dashed rgba(140,110,180,.35)",
            textAlign: "center",
            padding: "24px 20px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>🌙</div>
            <div style={{ fontSize: 13, color: "#7a5a9e", letterSpacing: 1, lineHeight: 1.8 }}>
              正在从你们的记忆里整理他……<br />
              <span style={{ fontSize: 11, color: "#b0a0c0" }}>这可能需要几十秒，请耐心等待</span>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {draftError && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(192,112,112,.1)",
            border: "1px solid rgba(192,112,112,.25)",
            borderRadius: 12,
            color: "#a05050",
            fontSize: 12,
            marginBottom: 14,
            lineHeight: 1.7,
          }}>
            {draftError}
          </div>
        )}

        {/* 草稿列表 */}
        {charDrafts.length === 0 && !draftGenerating ? (
          <div style={{
            textAlign: "center", color: "#b0a0c0",
            fontSize: 13, padding: "32px 20px", lineHeight: 2,
          }}>
            还没有迁入草稿<br />
            <span style={{ fontSize: 11 }}>生成后会保存在这里</span>
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
                        background: st.bg, borderRadius: 8, color: st.color, letterSpacing: 0.5,
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

                {/* 内容摘要 */}
                <div style={{
                  fontSize: 12, color: "#7a6a8e",
                  background: "rgba(196,166,184,.08)",
                  borderRadius: 8, padding: "8px 12px",
                  marginBottom: 12, lineHeight: 1.7,
                }}>
                  {draft.wakeSummary
                    ? draft.wakeSummary.slice(0, 80) + (draft.wakeSummary.length > 80 ? "…" : "")
                    : "（无唤醒摘要）"}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={btnGhost}
                    onClick={() => setViewDraftId(draft.id)}
                  >
                    查看详情
                  </button>
                  {draft.status !== "approved" && (
                    <button
                      style={{ ...btnGhost, fontSize: 11, color: "#3a7a4a", borderColor: "rgba(130,180,140,.4)" }}
                      onClick={() => updateDraftStatus(draft.id, "approved")}
                    >
                      ✓ 采纳
                    </button>
                  )}
                  {draft.status !== "rejected" && (
                    <button
                      style={{ ...btnGhost, fontSize: 11, color: "#a05050", borderColor: "rgba(192,112,112,.3)" }}
                      onClick={() => updateDraftStatus(draft.id, "rejected")}
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

      {/* 详情弹窗 */}
      <DraftDetailModal
        draft={viewDraft}
        onClose={() => setViewDraftId(null)}
        onStatusChange={updateDraftStatus}
        onDelete={(id) => { deleteMigrationDraft(id); setViewDraftId(null); }}
      />
    </div>
  );
}
