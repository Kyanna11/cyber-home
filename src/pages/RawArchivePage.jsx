// ─── 原始档案馆页 ───
// 导入、查看、管理每个入住者的原始对话记录
// 支持手动粘贴 + 本地 txt/md 文件导入
// 支持把原始档案切分为 MemoryChunk 记忆片段
// 不做自动摘要，不注入 prompt

import { useState, useRef } from "react";
import BackButton from "../components/BackButton";
import { genId } from "../utils/helpers";

// ── 文件格式推断 ──
function guessFormat(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "txt") return "text";
  return "unknown";
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// ── 工具函数 ──
function countChars(text) {
  return (text || "").replace(/\s/g, "").length;
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

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

const labelStyle = {
  fontSize: 12,
  color: "#9a8aac",
  letterSpacing: 1.5,
  marginBottom: 6,
  display: "block",
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(196,166,184,.35)",
  background: "rgba(255,255,255,.6)",
  fontSize: 14,
  color: "#4a3a5a",
  fontFamily: "var(--font-main)",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 160,
  resize: "vertical",
  lineHeight: 1.7,
};

const btnPrimary = {
  padding: "11px 28px",
  background: "rgba(160,130,180,.18)",
  border: "1px solid rgba(160,130,180,.35)",
  borderRadius: 20,
  color: "#5a4a6a",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: 2,
  cursor: "pointer",
  fontFamily: "var(--font-main)",
  transition: "all .25s",
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

// ── 空白表单初始值 ──
const emptyForm = {
  sourcePlatform: "",
  title: "",
  rawText: "",
  format: "text",
  note: "",
};

export default function RawArchivePage({
  charId,
  characters,
  rawArchives,
  addRawArchive,
  deleteRawArchive,
  memoryChunks,
  generateChunks,
  deleteChunk,
  openMigrationDraft,
  navigateTo,
}) {
  const char = characters.find((c) => c.id === charId) || {};
  const charName = char.name || "入住者";

  // 当前角色的档案列表
  const archives = rawArchives.filter((a) => a.loverId === charId);

  // ── 表单状态 ──
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ── 文件导入 ──
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_FILE_SIZE) {
      setFormError(`文件太大啦（${(file.size / 1024 / 1024).toFixed(1)} MB），暂时只支持 2MB 以内的文件`);
      return;
    }

    setFileLoading(true);
    setFormError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result || "";
      const fmt = guessFormat(file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setForm((prev) => ({
        ...prev,
        rawText: text,
        format: fmt,
        title: prev.title.trim() ? prev.title : baseName,
      }));
      setFileLoading(false);
    };
    reader.onerror = () => {
      setFormError("文件读取失败，请检查文件是否损坏，或改用复制粘贴方式导入");
      setFileLoading(false);
    };
    reader.readAsText(file, "utf-8");
  };

  // ── 详情弹窗 ──
  const [detailId, setDetailId] = useState(null);
  const [detailTab, setDetailTab] = useState("raw"); // "raw" | "chunks"
  const [chunkDetailText, setChunkDetailText] = useState(null); // 查看某片段全文
  const detailArchive = archives.find((a) => a.id === detailId) || null;
  const detailChunks = (memoryChunks || [])
    .filter((c) => c.archiveId === detailId)
    .sort((a, b) => a.index - b.index);

  // ── 删除确认 ──
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ── 生成片段确认 ──
  const [regenConfirmId, setRegenConfirmId] = useState(null);

  // 获取某档案已有的片段数
  const getChunkCount = (archiveId) =>
    (memoryChunks || []).filter((c) => c.archiveId === archiveId).length;

  // 该角色的片段总数（用于迁入草稿按钮）
  const totalChunkCount = (memoryChunks || []).filter((c) => c.loverId === charId).length;

  // ── 表单提交 ──
  const handleSave = () => {
    if (!form.title.trim()) { setFormError("请填写档案标题"); return; }
    if (!form.rawText.trim()) { setFormError("请粘贴原始对话内容"); return; }
    setFormError("");

    const archive = {
      id: genId(),
      loverId: charId,
      sourcePlatform: form.sourcePlatform.trim(),
      title: form.title.trim(),
      rawText: form.rawText,
      format: form.format || "text",
      importedAt: Date.now(),
      note: form.note.trim(),
    };
    addRawArchive(archive);
    setForm(emptyForm);
    setShowForm(false);
  };

  // ── 触发生成：先检查是否已有片段 ──
  const handleGenerateClick = (archive) => {
    const existing = getChunkCount(archive.id);
    if (existing > 0) {
      setRegenConfirmId(archive.id);
    } else {
      generateChunks(archive);
    }
  };

  // ────────────────────────────────────────────────
  // 弹窗：档案详情（原文 + 记忆片段 tab）
  // ────────────────────────────────────────────────
  const DetailModal = () => {
    if (!detailArchive) return null;

    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(30,20,40,.45)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 16px",
        }}
        onClick={() => { setDetailId(null); setChunkDetailText(null); }}
      >
        <div
          style={{
            background: "rgba(255,255,255,.92)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,.7)",
            boxShadow: "0 12px 48px rgba(0,0,0,.15)",
            width: "100%",
            maxWidth: 620,
            maxHeight: "84vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 弹窗标题栏 */}
          <div style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid rgba(196,166,184,.2)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#4a3a5a" }}>
                {detailArchive.title}
              </div>
              <div style={{ fontSize: 12, color: "#9a8aac", marginTop: 3 }}>
                {detailArchive.sourcePlatform && `来自 ${detailArchive.sourcePlatform} · `}
                {formatTime(detailArchive.importedAt)} · {countChars(detailArchive.rawText).toLocaleString()} 字
              </div>
            </div>
            <button
              onClick={() => { setDetailId(null); setChunkDetailText(null); }}
              style={{ ...btnGhost, padding: "5px 12px", fontSize: 13 }}
            >
              关闭
            </button>
          </div>

          {/* Tab 栏 */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(196,166,184,.2)",
            background: "rgba(255,255,255,.5)",
          }}>
            {[
              { key: "raw", label: "原始文本" },
              { key: "chunks", label: `记忆片段${detailChunks.length > 0 ? ` (${detailChunks.length})` : ""}` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setDetailTab(tab.key); setChunkDetailText(null); }}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: detailTab === tab.key ? "2px solid #9a7ab5" : "2px solid transparent",
                  color: detailTab === tab.key ? "#5a4a6a" : "#9a8aac",
                  fontSize: 13,
                  fontWeight: detailTab === tab.key ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                  letterSpacing: 1,
                  transition: "all .2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 备注 */}
          {detailArchive.note && (
            <div style={{
              padding: "8px 20px",
              background: "rgba(196,166,184,.08)",
              fontSize: 12, color: "#7a6a8e",
              borderBottom: "1px solid rgba(196,166,184,.12)",
            }}>
              备注：{detailArchive.note}
            </div>
          )}

          {/* Tab 内容 */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

            {/* ── 原始文本 ── */}
            {detailTab === "raw" && (
              <pre style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 13,
                lineHeight: 1.8,
                color: "#4a3a5a",
                fontFamily: "var(--font-main)",
              }}>
                {detailArchive.rawText}
              </pre>
            )}

            {/* ── 记忆片段 ── */}
            {detailTab === "chunks" && (
              <>
                {detailChunks.length === 0 ? (
                  <div style={{
                    textAlign: "center", color: "#b0a0c0",
                    fontSize: 13, padding: "32px 0", lineHeight: 2,
                  }}>
                    还没有生成记忆片段<br />
                    <span style={{ fontSize: 12 }}>关闭弹窗后点「整理成记忆片段」按钮</span>
                  </div>
                ) : (
                  /* 单片段全文查看 */
                  chunkDetailText !== null ? (
                    <div>
                      <button
                        style={{ ...btnGhost, marginBottom: 14 }}
                        onClick={() => setChunkDetailText(null)}
                      >
                        ← 返回片段列表
                      </button>
                      <pre style={{
                        margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                        fontSize: 13, lineHeight: 1.8, color: "#4a3a5a",
                        fontFamily: "var(--font-main)",
                      }}>
                        {chunkDetailText}
                      </pre>
                    </div>
                  ) : (
                    /* 片段列表 */
                    detailChunks.map((chunk) => (
                      <div key={chunk.id} style={{
                        background: "rgba(255,255,255,.6)",
                        borderRadius: 12,
                        border: "1px solid rgba(196,166,184,.25)",
                        padding: "12px 14px",
                        marginBottom: 10,
                      }}>
                        {/* 片段元信息 */}
                        <div style={{
                          display: "flex", alignItems: "center",
                          gap: 8, marginBottom: 8,
                        }}>
                          <span style={{
                            fontSize: 12, padding: "2px 8px",
                            background: "rgba(155,149,181,.18)",
                            borderRadius: 8, color: "#7a6a8e", letterSpacing: 0.5,
                          }}>
                            第 {chunk.index + 1} 段
                          </span>
                          <span style={{ fontSize: 12, color: "#b0a0c0" }}>
                            {countChars(chunk.text).toLocaleString()} 字
                          </span>
                        </div>

                        {/* 前 100 字预览 */}
                        <div style={{
                          fontSize: 12, color: "#5a4a6a",
                          lineHeight: 1.7, marginBottom: 10,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {chunk.text}
                        </div>

                        {/* 操作 */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{ ...btnGhost, fontSize: 12, padding: "5px 12px" }}
                            onClick={() => setChunkDetailText(chunk.text)}
                          >
                            查看全文
                          </button>
                          <button
                            style={{ ...btnGhost, fontSize: 12, padding: "5px 12px", color: "#c07070", borderColor: "rgba(192,112,112,.3)" }}
                            onClick={() => deleteChunk(chunk.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── 删除档案确认弹窗 ──
  const DeleteModal = () => {
    if (!deleteConfirmId) return null;
    const target = archives.find((a) => a.id === deleteConfirmId);
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 101,
        background: "rgba(30,20,40,.4)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}>
        <div style={{
          ...cardStyle,
          maxWidth: 320, width: "100%",
          textAlign: "center", padding: "28px 24px",
        }}>
          <div style={{ fontSize: 15, color: "#4a3a5a", marginBottom: 8 }}>
            确定删除这份档案？
          </div>
          <div style={{ fontSize: 13, color: "#9a8aac", marginBottom: 22 }}>
            「{target?.title || ""}」将被永久移除
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={btnGhost} onClick={() => setDeleteConfirmId(null)}>取消</button>
            <button
              style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.4)" }}
              onClick={() => {
                deleteRawArchive(deleteConfirmId);
                setDeleteConfirmId(null);
                if (detailId === deleteConfirmId) setDetailId(null);
              }}
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── 覆盖生成确认弹窗 ──
  const RegenModal = () => {
    if (!regenConfirmId) return null;
    const target = archives.find((a) => a.id === regenConfirmId);
    const existingCount = getChunkCount(regenConfirmId);
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 101,
        background: "rgba(30,20,40,.4)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}>
        <div style={{
          ...cardStyle,
          maxWidth: 340, width: "100%",
          textAlign: "center", padding: "28px 24px",
        }}>
          <div style={{ fontSize: 15, color: "#4a3a5a", marginBottom: 8 }}>
            重新生成记忆片段？
          </div>
          <div style={{ fontSize: 13, color: "#9a8aac", marginBottom: 22, lineHeight: 1.8 }}>
            「{target?.title || ""}」<br />
            已有 {existingCount} 个片段，重新生成会覆盖旧片段
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={btnGhost} onClick={() => setRegenConfirmId(null)}>取消</button>
            <button
              style={{ ...btnGhost, color: "#7a5a9e", borderColor: "rgba(122,90,158,.4)" }}
              onClick={() => {
                generateChunks(target);
                setRegenConfirmId(null);
              }}
            >
              重新生成
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // 主体渲染
  // ────────────────────────────────────────────────
  return (
    <div className="page-fade" style={{
      height: "100vh",
      overflow: "hidden",
      background: "linear-gradient(160deg, #f5eef8 0%, #ede6f3 40%, #e8e0f0 100%)",
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
          📁 {charName}的原始档案馆
        </div>
        <div style={{ width: 48 }} />
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 40px" }}>

        {/* 操作按钮区 */}
        {!showForm && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <button
              style={{ ...btnPrimary, display: "block", width: "100%", letterSpacing: 3 }}
              onClick={() => setShowForm(true)}
            >
              📥 把你们的过去带回家
            </button>
            <button
              style={{
                display: "block", width: "100%", padding: "11px 20px",
                background: totalChunkCount > 0
                  ? "rgba(120,90,170,.15)"
                  : "rgba(196,166,184,.1)",
                border: `1px solid ${totalChunkCount > 0 ? "rgba(120,90,170,.35)" : "rgba(196,166,184,.25)"}`,
                borderRadius: 20, letterSpacing: 2,
                color: totalChunkCount > 0 ? "#5a3a8e" : "#c0b0d0",
                fontSize: 13, fontWeight: 500,
                cursor: totalChunkCount > 0 ? "pointer" : "default",
                fontFamily: "var(--font-main)", transition: "all .25s",
              }}
              onClick={() => totalChunkCount > 0 && openMigrationDraft && openMigrationDraft(charId)}
            >
              ✨ 从记忆片段生成迁入草稿
              {totalChunkCount > 0 && (
                <span style={{ fontSize: 12, color: "#9a7abe", marginLeft: 6 }}>
                  ({totalChunkCount} 段可用)
                </span>
              )}
            </button>
          </div>
        )}

        {/* 导入表单 */}
        {showForm && (
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#5a4a6a", marginBottom: 16, letterSpacing: 1 }}>
              导入对话档案
            </div>

            {/* 文件导入区 */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>从本地文件导入（可选）</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <button
                type="button"
                disabled={fileLoading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,.5)",
                  border: "1px dashed rgba(160,130,180,.45)",
                  borderRadius: 10,
                  color: fileLoading ? "#b0a0c0" : "#7a6a8e",
                  fontSize: 13, letterSpacing: 1,
                  cursor: fileLoading ? "default" : "pointer",
                  fontFamily: "var(--font-main)",
                  textAlign: "left", transition: "all .2s",
                }}
              >
                <span style={{ fontSize: 18 }}>{fileLoading ? "⏳" : "📄"}</span>
                <span>{fileLoading ? "正在读取文件……" : "选择 txt / md 文件，自动填入内容"}</span>
              </button>
              <div style={{ fontSize: 12, color: "#c0b0d0", marginTop: 5, letterSpacing: 0.5 }}>
                支持 .txt · .md · .markdown，最大 2 MB
              </div>
            </div>

            {/* 分隔线 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "#c0b0d0", fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
              或手动粘贴对话内容
              <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
            </div>

            {/* 来源平台 */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>来源平台</label>
              <input
                style={inputStyle}
                placeholder="如：Claude.ai / Character.AI / 星野 / 其他"
                value={form.sourcePlatform}
                onChange={(e) => setForm((f) => ({ ...f, sourcePlatform: e.target.value }))}
              />
            </div>

            {/* 档案标题 */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>档案标题 *</label>
              <input
                style={inputStyle}
                placeholder="给这段对话取个名字"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* 原始文本 */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>原始对话文本 *</label>
              <textarea
                style={textareaStyle}
                placeholder={"把对话记录粘贴在这里\n不需要整理格式，原样保存就好"}
                value={form.rawText}
                onChange={(e) => setForm((f) => ({ ...f, rawText: e.target.value }))}
              />
              {form.rawText && (
                <div style={{ fontSize: 12, color: "#b0a0c0", textAlign: "right", marginTop: 4 }}>
                  {countChars(form.rawText).toLocaleString()} 字
                </div>
              )}
            </div>

            {/* 备注 */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>备注（可选）</label>
              <input
                style={inputStyle}
                placeholder="这段对话的背景，或者你想记住的事"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>

            {formError && (
              <div style={{ color: "#c07070", fontSize: 12, marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ ...btnPrimary, opacity: fileLoading ? 0.5 : 1 }}
                disabled={fileLoading}
                onClick={handleSave}
              >
                存入档案馆
              </button>
              <button
                style={btnGhost}
                onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(""); setFileLoading(false); }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 档案列表 */}
        {archives.length === 0 ? (
          <div style={{ textAlign: "center", color: "#b0a0c0", fontSize: 13, padding: "40px 20px", lineHeight: 2 }}>
            还没有导入任何对话记录<br />
            <span style={{ fontSize: 12 }}>把你们之间发生过的一切，都带回家吧</span>
          </div>
        ) : (
          archives
            .slice()
            .sort((a, b) => b.importedAt - a.importedAt)
            .map((archive) => {
              const chunkCount = getChunkCount(archive.id);
              return (
                <div key={archive.id} style={cardStyle}>
                  {/* 卡片头部 */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#4a3a5a", marginBottom: 3 }}>
                        {archive.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {archive.sourcePlatform && (
                          <span style={{
                            fontSize: 12, padding: "2px 8px",
                            background: "rgba(160,130,180,.15)",
                            borderRadius: 8, color: "#7a6a8e", letterSpacing: 0.5,
                          }}>
                            {archive.sourcePlatform}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "#b0a0c0" }}>
                          {formatTime(archive.importedAt)}
                        </span>
                        <span style={{ fontSize: 12, color: "#b0a0c0" }}>
                          {countChars(archive.rawText).toLocaleString()} 字
                        </span>
                        {chunkCount > 0 && (
                          <span style={{
                            fontSize: 12, padding: "2px 8px",
                            background: "rgba(155,149,181,.2)",
                            borderRadius: 8, color: "#6a5a8e", letterSpacing: 0.5,
                          }}>
                            ✦ {chunkCount} 个片段
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 备注 */}
                  {archive.note && (
                    <div style={{
                      fontSize: 12, color: "#9a8aac",
                      padding: "8px 12px",
                      background: "rgba(196,166,184,.1)",
                      borderRadius: 8, marginBottom: 10, lineHeight: 1.6,
                    }}>
                      {archive.note}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      style={btnGhost}
                      onClick={() => { setDetailTab("raw"); setDetailId(archive.id); }}
                    >
                      查看原文
                    </button>
                    <button
                      style={btnGhost}
                      onClick={() => { setDetailTab("chunks"); setDetailId(archive.id); }}
                    >
                      {chunkCount > 0 ? `查看片段 (${chunkCount})` : "查看片段"}
                    </button>
                    <button
                      style={{ ...btnGhost, color: "#7a5a9e", borderColor: "rgba(122,90,158,.35)" }}
                      onClick={() => handleGenerateClick(archive)}
                    >
                      {chunkCount > 0 ? "重新生成片段" : "整理成记忆片段"}
                    </button>
                    <button
                      style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.3)" }}
                      onClick={() => setDeleteConfirmId(archive.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* 弹窗 */}
      <DetailModal />
      <DeleteModal />
      <RegenModal />
    </div>
  );
}
