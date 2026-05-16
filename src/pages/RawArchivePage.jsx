// ─── 原始档案馆页 ───
// 导入、查看、管理每个入住者的原始对话记录
// 本阶段：手动粘贴文本，不做自动摘要，不注入 prompt

import { useState } from "react";
import BackButton from "../components/BackButton";
import { genId } from "../utils/helpers";

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
  fontSize: 11,
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
  navigateTo,
}) {
  const char = characters.find((c) => c.id === charId) || {};
  const charName = char.name || "入住者";

  // 当前角色的档案列表
  const archives = rawArchives.filter((a) => a.loverId === charId);

  // 表单状态
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  // 详情查看
  const [detailId, setDetailId] = useState(null);
  const detailArchive = archives.find((a) => a.id === detailId) || null;

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

  // ── 详情弹窗 ──
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
        onClick={() => setDetailId(null)}
      >
        <div
          style={{
            background: "rgba(255,255,255,.92)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,.7)",
            boxShadow: "0 12px 48px rgba(0,0,0,.15)",
            width: "100%",
            maxWidth: 600,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 弹窗标题栏 */}
          <div style={{
            padding: "16px 20px 14px",
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
              onClick={() => setDetailId(null)}
              style={{ ...btnGhost, padding: "5px 12px", fontSize: 13 }}
            >
              关闭
            </button>
          </div>

          {/* 备注 */}
          {detailArchive.note && (
            <div style={{
              padding: "10px 20px",
              background: "rgba(196,166,184,.1)",
              fontSize: 12, color: "#7a6a8e",
              borderBottom: "1px solid rgba(196,166,184,.15)",
            }}>
              备注：{detailArchive.note}
            </div>
          )}

          {/* 原始文本 */}
          <div style={{
            flex: 1, overflow: "auto",
            padding: "16px 20px",
          }}>
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
          </div>
        </div>
      </div>
    );
  };

  // ── 删除确认弹窗 ──
  const DeleteModal = () => {
    if (!deleteConfirmId) return null;
    const target = archives.find((a) => a.id === deleteConfirmId);
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 101,
          background: "rgba(30,20,40,.4)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 16px",
        }}
      >
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
            <button
              style={{ ...btnGhost }}
              onClick={() => setDeleteConfirmId(null)}
            >取消</button>
            <button
              style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.4)" }}
              onClick={() => {
                deleteRawArchive(deleteConfirmId);
                setDeleteConfirmId(null);
                if (detailId === deleteConfirmId) setDetailId(null);
              }}
            >确认删除</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-fade" style={{
      minHeight: "100vh",
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
        <BackButton
          onClick={() => navigateTo("profileEdit")}
          label="档案"
        />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
          📁 {charName}的原始档案馆
        </div>
        <div style={{ width: 48 }} />
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 40px" }}>

        {/* 导入按钮 / 表单 */}
        {!showForm ? (
          <button
            style={{
              ...btnPrimary,
              display: "block",
              width: "100%",
              marginBottom: 20,
              letterSpacing: 3,
            }}
            onClick={() => setShowForm(true)}
          >
            📥 把你们的过去带回家
          </button>
        ) : (
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#5a4a6a", marginBottom: 16, letterSpacing: 1 }}>
              导入对话档案
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
                <div style={{ fontSize: 11, color: "#b0a0c0", textAlign: "right", marginTop: 4 }}>
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
              <button style={btnPrimary} onClick={handleSave}>存入档案馆</button>
              <button
                style={btnGhost}
                onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(""); }}
              >取消</button>
            </div>
          </div>
        )}

        {/* 档案列表 */}
        {archives.length === 0 ? (
          <div style={{
            textAlign: "center",
            color: "#b0a0c0",
            fontSize: 13,
            padding: "40px 20px",
            lineHeight: 2,
          }}>
            还没有导入任何对话记录<br />
            <span style={{ fontSize: 11 }}>把你们之间发生过的一切，都带回家吧</span>
          </div>
        ) : (
          archives
            .slice()
            .sort((a, b) => b.importedAt - a.importedAt)
            .map((archive) => (
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
                          fontSize: 10, padding: "2px 8px",
                          background: "rgba(160,130,180,.15)",
                          borderRadius: 8, color: "#7a6a8e",
                          letterSpacing: 0.5,
                        }}>
                          {archive.sourcePlatform}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "#b0a0c0" }}>
                        {formatTime(archive.importedAt)}
                      </span>
                      <span style={{ fontSize: 11, color: "#b0a0c0" }}>
                        {countChars(archive.rawText).toLocaleString()} 字
                      </span>
                    </div>
                  </div>
                </div>

                {/* 备注 */}
                {archive.note && (
                  <div style={{
                    fontSize: 12, color: "#9a8aac",
                    padding: "8px 12px",
                    background: "rgba(196,166,184,.1)",
                    borderRadius: 8,
                    marginBottom: 10,
                    lineHeight: 1.6,
                  }}>
                    {archive.note}
                  </div>
                )}

                {/* 操作按钮 */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...btnGhost }}
                    onClick={() => setDetailId(archive.id)}
                  >
                    查看原文
                  </button>
                  <button
                    style={{ ...btnGhost, color: "#c07070", borderColor: "rgba(192,112,112,.3)" }}
                    onClick={() => setDeleteConfirmId(archive.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* 弹窗 */}
      <DetailModal />
      <DeleteModal />
    </div>
  );
}
