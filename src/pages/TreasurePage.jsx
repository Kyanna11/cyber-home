// ─── 我的宝库页 ───
// 收藏心动的话、故事、小作文和想珍藏的原文

import { useState, useMemo } from "react";
import BackButton from "../components/BackButton";
import { TREASURE_TYPES } from "../constants";

// ── 工具 ──
function typeInfo(type) {
  return TREASURE_TYPES.find((t) => t.value === type) || { label: "其他", emoji: "🎁" };
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function genTreasureId() {
  return `treasure-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── 手动添加 / 编辑弹窗 ──
function TreasureEditor({ initial, onSave, onClose }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    title:     initial?.title     || "",
    content:   initial?.content   || "",
    type:      initial?.type      || "quote",
    tagsRaw:   (initial?.tags || []).join(" "),
    note:      initial?.note      || "",
    important: initial?.important || false,
  });

  const canSave = form.content.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...(initial || {}),
      id:        initial?.id || genTreasureId(),
      title:     form.title.trim() || form.content.slice(0, 20),
      content:   form.content,
      type:      form.type,
      tags:      form.tagsRaw.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
      note:      form.note.trim(),
      important: form.important,
      sourceCharId:   initial?.sourceCharId   || null,
      sourceCharName: initial?.sourceCharName || "",
      sourceThreadId: initial?.sourceThreadId || null,
      sourceMessageId: initial?.sourceMessageId || null,
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
      canUseForMemory: initial?.canUseForMemory || false,
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(74,69,96,.35)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
            {isNew ? "✍️ 手动收藏" : "✏️ 编辑宝物"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 24px" }}>
          {/* 类型选择 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {TREASURE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                style={{
                  padding: "4px 11px", borderRadius: 20, fontSize: 11,
                  cursor: "pointer", fontFamily: "var(--font-main)", transition: "all .15s",
                  background: form.type === t.value ? "rgba(120,100,160,.85)" : "rgba(255,255,255,.7)",
                  color: form.type === t.value ? "white" : "#7a6a8e",
                  border: `1px solid ${form.type === t.value ? "transparent" : "rgba(196,166,184,.3)"}`,
                }}
              >{t.emoji} {t.label}</button>
            ))}
          </div>

          {/* 标题 */}
          <input
            type="text"
            placeholder="给这段内容起个名字…（留空则取正文前 20 字）"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px", borderRadius: 10, fontSize: 13, color: "#5a4a6a",
              background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
              fontFamily: "var(--font-main)", outline: "none", marginBottom: 10,
            }}
          />

          {/* 正文 */}
          <textarea
            placeholder="粘贴想珍藏的内容…"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            autoFocus={isNew}
            style={{
              width: "100%", boxSizing: "border-box",
              minHeight: 110, padding: "8px 10px", borderRadius: 10, fontSize: 13,
              color: "#5a4a6a", background: "rgba(255,255,255,.7)",
              border: "1px solid rgba(196,166,184,.3)",
              fontFamily: "var(--font-main)", outline: "none",
              resize: "none", lineHeight: 1.8, marginBottom: 10,
            }}
          />

          {/* 标签 */}
          <input
            type="text"
            placeholder="标签（空格分隔，可选）"
            value={form.tagsRaw}
            onChange={(e) => setForm((f) => ({ ...f, tagsRaw: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px", borderRadius: 10, fontSize: 12, color: "#7a6a8e",
              background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.25)",
              fontFamily: "var(--font-main)", outline: "none", marginBottom: 10,
            }}
          />

          {/* 备注 */}
          <textarea
            placeholder="备注（自己的感受或来源说明，可选）"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box",
              minHeight: 56, padding: "8px 10px", borderRadius: 10, fontSize: 12,
              color: "#7a6a8e", background: "rgba(255,255,255,.6)",
              border: "1px solid rgba(196,166,184,.25)",
              fontFamily: "var(--font-main)", outline: "none",
              resize: "none", lineHeight: 1.7, marginBottom: 12,
            }}
          />

          {/* 重要标记 */}
          <div
            onClick={() => setForm((f) => ({ ...f, important: !f.important }))}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 20 }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `1.5px solid ${form.important ? "#c08030" : "rgba(196,166,184,.4)"}`,
              background: form.important ? "rgba(200,140,60,.15)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#c08030", flexShrink: 0, transition: "all .15s",
            }}>
              {form.important ? "★" : ""}
            </div>
            <span style={{ fontSize: 12, color: form.important ? "#8a6020" : "#9a8aac" }}>
              标记为重要宝物
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: canSave ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none", color: canSave ? "white" : "#9a8aac",
              fontSize: 14, cursor: canSave ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 1, transition: "all .2s",
            }}
          >💎 {isNew ? "存进宝库" : "保存修改"}</button>
        </div>
      </div>
    </div>
  );
}

// ── 操作按钮样式辅助 ──
function ActionBtn({ emoji, label, sub, onClick, disabled, color }) {
  const base = {
    flex: 1, minWidth: 0, padding: "10px 8px", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-main)", textAlign: "center", transition: "all .15s",
    border: `1px solid ${disabled ? "rgba(196,166,184,.15)" : color ? `${color}30` : "rgba(196,166,184,.25)"}`,
    background: disabled ? "rgba(255,255,255,.3)" : color ? `${color}0a` : "rgba(255,255,255,.7)",
    opacity: disabled ? 0.45 : 1,
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={base}>
      <div style={{ fontSize: 18, marginBottom: 3 }}>{emoji}</div>
      <div style={{ fontSize: 11, color: disabled ? "var(--text-faint)" : (color || "#5a4a6a"), fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>}
    </button>
  );
}

// ── 宝物详情面板 ──
function TreasureDetail({ treasure, onSave, onDelete, onClose, onCreateNoteFromTreasure }) {
  const [editing, setEditing]             = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback]   = useState(false);
  const ti = typeInfo(treasure.type);

  if (editing) {
    return (
      <TreasureEditor
        initial={treasure}
        onSave={(t) => { onSave(t); setEditing(false); }}
        onClose={() => setEditing(false)}
      />
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(treasure.content).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    }).catch(() => {
      // fallback: select & execCommand
      const el = document.createElement("textarea");
      el.value = treasure.content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    });
  };

  const handleToggleImportant = () => {
    onSave({ ...treasure, important: !treasure.important, updatedAt: Date.now() });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
      background: "rgba(74,69,96,.3)",
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
      }}>

        {/* ── 顶栏 ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{ti.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5a4a6a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {treasure.title || treasure.content.slice(0, 28)}
            </div>
            {/* 元信息行 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: "var(--text-faint)", background: "rgba(196,166,184,.15)", padding: "1px 6px", borderRadius: 7 }}>{ti.label}</span>
              {treasure.sourceCharName && (
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>来自 {treasure.sourceCharName}</span>
              )}
              {treasure.createdAt > 0 && (
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{fmtDate(treasure.createdAt)}</span>
              )}
              {treasure.important && (
                <span style={{ fontSize: 10, color: "#c08030" }}>★ 重要</span>
              )}
            </div>
          </div>
          {/* 右侧操作 */}
          <button
            onClick={handleToggleImportant}
            title={treasure.important ? "取消重要标记" : "标记为重要"}
            style={{
              background: treasure.important ? "rgba(200,140,60,.15)" : "transparent",
              border: `1px solid ${treasure.important ? "rgba(200,140,60,.35)" : "rgba(196,166,184,.3)"}`,
              borderRadius: 8, padding: "4px 8px", cursor: "pointer",
              fontSize: 14, color: treasure.important ? "#c08030" : "#c0b090",
              transition: "all .2s", flexShrink: 0,
            }}
          >★</button>
          <button
            onClick={() => setEditing(true)}
            style={{ background: "rgba(196,166,184,.15)", border: "1px solid rgba(196,166,184,.3)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)", flexShrink: 0 }}
          >编辑</button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: "4px 2px", flexShrink: 0 }}>✕</button>
        </div>

        {/* ── 正文区 ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 0" }}>

          {/* 原文 */}
          <div style={{
            fontSize: 14, color: "#4a3a5a", lineHeight: 1.95,
            whiteSpace: "pre-wrap", letterSpacing: 0.3,
          }}>
            {treasure.content}
          </div>

          {/* 备注 */}
          {treasure.note && (
            <div style={{
              marginTop: 14, padding: "10px 12px", borderRadius: 10,
              background: "rgba(196,166,184,.1)", border: "1px solid rgba(196,166,184,.18)",
              fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7,
            }}>
              <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block", marginBottom: 3 }}>备注</span>
              {treasure.note}
            </div>
          )}

          {/* 标签 */}
          {(treasure.tags || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {treasure.tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "rgba(196,166,184,.12)", color: "#9a8aac" }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* ── 操作区 ── */}
          <div style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: "1px solid rgba(196,166,184,.15)",
          }}>
            <div style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: 1.5, marginBottom: 12 }}>操作</div>

            {/* 第一行：已实现操作 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <ActionBtn
                emoji={copyFeedback ? "✓" : "📋"}
                label={copyFeedback ? "已复制" : "复制全文"}
                onClick={handleCopy}
                color="#6a7aae"
              />
              <ActionBtn
                emoji="📓"
                label="写进手札"
                onClick={() => {
                  onCreateNoteFromTreasure?.(treasure);
                  onClose();
                }}
                color="#9a70b0"
              />
            </div>

            {/* 第二行：稍后开放 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <ActionBtn emoji="🕰" label="记下这一刻" sub="稍后开放" disabled />
              <ActionBtn emoji="💡" label="帮我记住"   sub="稍后开放" disabled />
              <ActionBtn emoji="✍️" label="继续写下去" sub="稍后开放" disabled />
            </div>

            {/* 复制成功提示 */}
            {copyFeedback && (
              <div style={{
                textAlign: "center", fontSize: 12, color: "#4a7a6a",
                padding: "6px 0", marginBottom: 4,
                animation: "fadeIn .2s ease-out",
              }}>
                已经复制到剪贴板啦。
              </div>
            )}
          </div>

          {/* ── 删除区 ── */}
          <div style={{ marginTop: 14, marginBottom: 24 }}>
            {showDeleteConfirm ? (
              <div style={{ padding: "12px", borderRadius: 12, background: "rgba(200,100,100,.06)", border: "1px solid rgba(200,100,100,.15)" }}>
                <div style={{ fontSize: 12, color: "#9a5050", textAlign: "center", marginBottom: 10 }}>确认删除这条宝物？</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "transparent", border: "1px solid rgba(196,166,184,.3)", fontSize: 12, color: "#9a8aac", cursor: "pointer", fontFamily: "var(--font-main)" }}>再想想</button>
                  <button onClick={() => onDelete(treasure.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(200,100,100,.12)", border: "1px solid rgba(200,100,100,.2)", fontSize: 12, color: "#9a5050", cursor: "pointer", fontFamily: "var(--font-main)" }}>删除</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ width: "100%", padding: "8px", borderRadius: 10, background: "transparent", border: "1px solid rgba(196,166,184,.15)", fontSize: 11, color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)" }}>🗑 删除这条宝物</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// ── 主页面 ──
// ════════════════════════════════════════════
export default function TreasurePage({
  navigateTo,
  treasures,
  onSaveTreasure,
  onDeleteTreasure,
  characters,
  onCreateNoteFromTreasure,
}) {
  const [filterType, setFilterType]   = useState("all");
  const [searchText, setSearchText]   = useState("");
  const [detailItem, setDetailItem]   = useState(null);
  const [showEditor, setShowEditor]   = useState(false);

  const filtered = useMemo(() => {
    let list = [...(treasures || [])].sort((a, b) => b.createdAt - a.createdAt);
    if (filterType !== "all") list = list.filter((t) => t.type === filterType);
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter((t) =>
        t.content.toLowerCase().includes(kw) ||
        (t.title || "").toLowerCase().includes(kw) ||
        (t.note  || "").toLowerCase().includes(kw) ||
        (t.tags  || []).some((tag) => tag.toLowerCase().includes(kw)) ||
        (t.sourceCharName || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [treasures, filterType, searchText]);

  // 重要的放最前
  const sorted = [...filtered.filter((t) => t.important), ...filtered.filter((t) => !t.important)];

  const handleSave = (t) => {
    onSaveTreasure(t);
    setShowEditor(false);
    setDetailItem(null);
  };

  const handleDelete = (id) => {
    onDeleteTreasure(id);
    setDetailItem(null);
  };

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 16px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.4)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
          💎 我的宝库
        </div>
        <button
          onClick={() => setShowEditor(true)}
          style={{
            background: "rgba(120,100,160,.15)", border: "1px solid rgba(120,100,160,.2)",
            borderRadius: 10, padding: "5px 14px", fontSize: 12,
            color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
          }}
        >+ 手动收藏</button>
      </div>

      {/* ── 类型筛选 ── */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", padding: "10px 14px 8px",
        borderBottom: "1px solid rgba(196,166,184,.12)",
        scrollbarWidth: "none", flexShrink: 0,
      }}>
        {[{ value: "all", label: "全部", emoji: "💎" }, ...TREASURE_TYPES].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 11,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "var(--font-main)", transition: "all .15s", flexShrink: 0,
              background: filterType === t.value ? "rgba(120,100,160,.15)" : "transparent",
              border: `1px solid ${filterType === t.value ? "rgba(120,100,160,.3)" : "rgba(196,166,184,.2)"}`,
              color: filterType === t.value ? "#5a4a8a" : "#9a8aac",
            }}
          >{t.emoji} {t.label}</button>
        ))}
      </div>

      {/* ── 搜索 ── */}
      <div style={{ padding: "8px 14px 4px", flexShrink: 0 }}>
        <input
          type="text"
          placeholder="🔍 搜索宝物…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "7px 12px", borderRadius: 20, fontSize: 12,
            background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.2)",
            color: "#5a4a6a", fontFamily: "var(--font-main)", outline: "none",
          }}
        />
      </div>

      {/* ── 列表 ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 32px" }}>
        {sorted.length === 0 ? (
          <div style={{ paddingTop: 48, textAlign: "center", color: "var(--text-faint)", lineHeight: 2.5 }}>
            <div style={{ fontSize: 32 }}>💎</div>
            {searchText || filterType !== "all"
              ? "没有找到匹配的宝物"
              : <><div>宝库还是空的</div><div style={{ fontSize: 12, opacity: 0.7 }}>去聊天里「珍藏这段」吧</div></>}
          </div>
        ) : (
          sorted.map((item) => {
            const ti = typeInfo(item.type);
            const charName = item.sourceCharName || (characters || []).find((c) => c.id === item.sourceCharId)?.name || "";
            return (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                style={{
                  marginBottom: 10, padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                  background: item.important ? "rgba(200,160,80,.06)" : "rgba(255,255,255,.6)",
                  border: `1px solid ${item.important ? "rgba(200,160,80,.22)" : "rgba(196,166,184,.18)"}`,
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = item.important ? "rgba(200,160,80,.1)" : "rgba(255,255,255,.85)"}
                onMouseLeave={(e) => e.currentTarget.style.background = item.important ? "rgba(200,160,80,.06)" : "rgba(255,255,255,.6)"}
              >
                {/* 头部 */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{ti.emoji}</span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)", background: "rgba(196,166,184,.12)", padding: "1px 7px", borderRadius: 8 }}>{ti.label}</span>
                  {charName && <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{charName}</span>}
                  {item.important && <span style={{ fontSize: 11, color: "#c08030", marginLeft: "auto" }}>★</span>}
                  {!item.important && <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-faint)" }}>{fmtDate(item.createdAt)}</span>}
                  {item.important && <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{fmtDate(item.createdAt)}</span>}
                </div>

                {/* 标题（如果和正文不同）*/}
                {item.title && item.title !== item.content.slice(0, item.title.length) && (
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#5a4a6a", marginBottom: 4, letterSpacing: 0.3 }}>
                    {item.title}
                  </div>
                )}

                {/* 正文预览 */}
                <div style={{
                  fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  whiteSpace: "pre-wrap",
                }}>
                  {item.content}
                </div>

                {/* 标签 */}
                {(item.tags || []).length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 7 }}>
                    {item.tags.map((tag, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 7, background: "rgba(196,166,184,.12)", color: "#9a8aac" }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── 详情面板 ── */}
      {detailItem && (
        <TreasureDetail
          treasure={detailItem}
          onSave={(t) => { handleSave(t); setDetailItem(t); }}
          onDelete={handleDelete}
          onClose={() => setDetailItem(null)}
          onCreateNoteFromTreasure={onCreateNoteFromTreasure}
        />
      )}

      {/* ── 手动添加弹窗 ── */}
      {showEditor && (
        <TreasureEditor
          initial={null}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
