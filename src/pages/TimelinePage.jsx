// ─── 关系时间线页 ───
// 展示某个入住者与用户之间的重要节点历史

import { useState } from "react";
import BackButton from "../components/BackButton";

// ── 事件类型定义 ──
export const EVENT_TYPES = [
  { key: "firstMeet",  label: "初遇",    emoji: "✨", color: "#b08ad0" },
  { key: "milestone",  label: "里程碑",  emoji: "🏅", color: "#7aadcc" },
  { key: "sweet",      label: "甜蜜瞬间", emoji: "💗", color: "#cc7aaa" },
  { key: "promise",    label: "约定承诺", emoji: "🤞", color: "#7acc9a" },
  { key: "conflict",   label: "争吵修好", emoji: "🌧️", color: "#c09060" },
  { key: "gift",       label: "礼物惊喜", emoji: "🎁", color: "#cc9a7a" },
  { key: "other",      label: "其他",    emoji: "📌", color: "#9aaa9a" },
];

function getEventType(key) {
  return EVENT_TYPES.find((t) => t.key === key) || EVENT_TYPES[EVENT_TYPES.length - 1];
}

// ── 工具 ──
function formatDate(ts) {
  if (!ts) return "未知时间";
  // ts 可能是 timestamp 数字，或 "YYYY-MM-DD" 字符串
  if (typeof ts === "number") {
    const d = new Date(ts);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  if (typeof ts === "string") {
    // 尝试解析 YYYY-MM-DD
    const parts = ts.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (parts) return `${parts[1]}年${parseInt(parts[2])}月${parseInt(parts[3])}日`;
    return ts;
  }
  return String(ts);
}

function formatCreatedAt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 记录`;
}

// 星级重要度
function ImportanceStars({ value }) {
  return (
    <span style={{ letterSpacing: 1, fontSize: 12 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= value ? "#c49a6c" : "rgba(196,154,108,.25)" }}>★</span>
      ))}
    </span>
  );
}

// ── 样式常量 ──
const cardBase = {
  background: "rgba(255,255,255,.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.6)",
  boxShadow: "0 4px 18px rgba(0,0,0,.06)",
  padding: "16px 18px",
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

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(196,166,184,.35)",
  background: "rgba(255,255,255,.7)",
  fontSize: 13,
  color: "#4a3a5a",
  fontFamily: "var(--font-main)",
  outline: "none",
  boxSizing: "border-box",
};

const taStyle = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.7,
  minHeight: 72,
};

const labelStyle = {
  fontSize: 12,
  color: "#9a8aac",
  letterSpacing: 1.5,
  marginBottom: 5,
  display: "block",
};

// ── 新增/编辑事件弹窗 ──
function EventFormModal({ initial, charName, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    description: initial?.description || "",
    eventType: initial?.eventType || "sweet",
    occurredAt: initial?.occurredAt
      ? (typeof initial.occurredAt === "number"
          ? new Date(initial.occurredAt).toISOString().split("T")[0]
          : initial.occurredAt)
      : today,
    emotion: initial?.emotion || "",
    importance: initial?.importance ?? 3,
    note: initial?.note || "",
    pinned: initial?.pinned ?? false,
  }));

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    // occurredAt 存为 "YYYY-MM-DD" 字符串（便于显示），createdAt 存 timestamp
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      emotion: form.emotion.trim(),
      note: form.note.trim(),
      occurredAt: form.occurredAt || today,
    });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(30,20,40,.5)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(255,252,255,.97)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.7)",
          boxShadow: "0 12px 48px rgba(0,0,0,.18)",
          width: "100%", maxWidth: 500,
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
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#4a3a5a" }}>
            {initial ? "编辑事件" : `记录与${charName}的故事`}
          </div>
          <button onClick={onClose} style={{ ...btnGhost, padding: "5px 12px" }}>关闭</button>
        </div>

        {/* 表单内容 */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

          {/* 标题 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>事件标题 *</label>
            <input
              style={inputStyle}
              placeholder="如：第一次说晚安 / 吵架又和好了"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* 类型 & 日期 行 */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>事件类型</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.eventType}
                onChange={(e) => set("eventType", e.target.value)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>发生日期</label>
              <input
                type="date"
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.occurredAt}
                onChange={(e) => set("occurredAt", e.target.value)}
              />
            </div>
          </div>

          {/* 描述 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>详细描述</label>
            <textarea
              style={taStyle}
              placeholder="发生了什么，有什么意义……"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* 情绪感受 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>情绪感受</label>
            <input
              style={inputStyle}
              placeholder="如：很温暖，感觉被接住了"
              value={form.emotion}
              onChange={(e) => set("emotion", e.target.value)}
            />
          </div>

          {/* 重要度 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>重要程度</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => set("importance", i)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 22, padding: "2px 3px",
                    color: i <= form.importance ? "#c49a6c" : "rgba(196,154,108,.25)",
                    transition: "color .15s",
                  }}
                >
                  ★
                </button>
              ))}
              <span style={{ fontSize: 12, color: "#b0a0c0", marginLeft: 6 }}>
                {["", "普通", "较重要", "重要", "很重要", "核心记忆"][form.importance]}
              </span>
            </div>
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>私人备注（可选）</label>
            <textarea
              style={{ ...taStyle, minHeight: 56 }}
              placeholder="只给自己看的想法……"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>

          {/* 固定 */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => set("pinned", e.target.checked)}
              style={{ accentColor: "#9b6abd" }}
            />
            <span style={{ fontSize: 12, color: "#7a6a8e" }}>📌 置顶此事件</span>
          </label>
        </div>

        {/* 底部 */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(196,166,184,.18)",
          background: "rgba(255,255,255,.5)",
          display: "flex", gap: 8, justifyContent: "flex-end",
        }}>
          <button style={btnGhost} onClick={onClose}>取消</button>
          <button
            style={{
              ...btnGhost,
              background: form.title.trim() ? "rgba(140,110,180,.18)" : "rgba(196,166,184,.12)",
              color: form.title.trim() ? "#5a3a7e" : "#b0a0c0",
              borderColor: form.title.trim() ? "rgba(140,110,180,.4)" : "rgba(196,166,184,.3)",
              fontWeight: 500,
            }}
            disabled={!form.title.trim()}
            onClick={handleSubmit}
          >
            {initial ? "保存修改" : "✓ 记录下来"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 单个事件卡片 ──
function EventCard({ event, onEdit, onDelete, onTogglePin }) {
  const et = getEventType(event.eventType);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      ...cardBase,
      borderLeft: `3px solid ${et.color}`,
      opacity: 1,
      background: event.pinned ? "rgba(240,234,255,.75)" : "rgba(255,255,255,.72)",
    }}>
      {/* 头部行 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        {/* 类型 emoji */}
        <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{et.emoji}</span>

        <div style={{ flex: 1 }}>
          {/* 标题 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#4a3a5a", lineHeight: 1.4 }}>
              {event.pinned && <span style={{ fontSize: 12, marginRight: 4 }}>📌</span>}
              {event.title}
            </span>
            <span style={{
              fontSize: 12, padding: "1px 8px", borderRadius: 8,
              background: `${et.color}20`, color: et.color, border: `1px solid ${et.color}40`,
            }}>
              {et.label}
            </span>
          </div>

          {/* 日期行 */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#9a8aac" }}>📅 {formatDate(event.occurredAt)}</span>
            <ImportanceStars value={event.importance || 1} />
            {event.source === "draft" && (
              <span style={{
                fontSize: 12, padding: "1px 6px", borderRadius: 6,
                background: "rgba(140,110,180,.12)", color: "#8a6aac",
              }}>迁入生成</span>
            )}
            <span style={{ fontSize: 12, color: "#c0b0d0" }}>{formatCreatedAt(event.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 描述 */}
      {event.description && (
        <div style={{
          fontSize: 13, color: "#5a4a6a", lineHeight: 1.75,
          marginBottom: 6, padding: "6px 10px",
          background: "rgba(196,166,184,.06)", borderRadius: 8,
        }}>
          {showDetail ? event.description : (
            event.description.length > 60
              ? event.description.slice(0, 60) + "…"
              : event.description
          )}
          {event.description.length > 60 && (
            <button
              onClick={() => setShowDetail(!showDetail)}
              style={{ background: "none", border: "none", color: "#9a6aac", fontSize: 12, cursor: "pointer", padding: "0 4px" }}
            >
              {showDetail ? " 收起" : " 展开"}
            </button>
          )}
        </div>
      )}

      {/* 情绪 */}
      {event.emotion && (
        <div style={{ fontSize: 12, color: "#8a7a9a", marginBottom: 6 }}>
          💭 {event.emotion}
        </div>
      )}

      {/* 备注（展开后才显示） */}
      {showDetail && event.note && (
        <div style={{
          fontSize: 12, color: "#b0a0c0", marginBottom: 8,
          fontStyle: "italic", paddingLeft: 4,
        }}>
          · {event.note}
        </div>
      )}

      {/* 操作 */}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button
          style={{ ...btnGhost, fontSize: 12, padding: "5px 12px" }}
          onClick={() => onEdit(event)}
        >
          编辑
        </button>
        <button
          style={{ ...btnGhost, fontSize: 12, padding: "5px 12px" }}
          onClick={() => onTogglePin(event.id)}
        >
          {event.pinned ? "取消置顶" : "📌 置顶"}
        </button>
        {!confirmDelete ? (
          <button
            style={{ ...btnGhost, fontSize: 12, padding: "5px 12px", color: "#c07070", borderColor: "rgba(192,112,112,.3)" }}
            onClick={() => setConfirmDelete(true)}
          >
            删除
          </button>
        ) : (
          <>
            <span style={{ fontSize: 12, color: "#9a8aac", alignSelf: "center" }}>确定删除？</span>
            <button
              style={{ ...btnGhost, fontSize: 12, padding: "5px 12px", color: "#c07070", borderColor: "rgba(192,112,112,.4)" }}
              onClick={() => onDelete(event.id)}
            >
              确认
            </button>
            <button
              style={{ ...btnGhost, fontSize: 12, padding: "5px 12px" }}
              onClick={() => setConfirmDelete(false)}
            >
              取消
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 主页面 ──
export default function TimelinePage({
  timelineCharId,
  characters,
  timelineEvents,
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  toggleTimelinePin,
  navigateTo,
  prevPage,
}) {
  const char = characters.find((c) => c.id === timelineCharId) || {};
  const charName = char.name || "入住者";

  // 只显示当前角色的事件
  const events = (timelineEvents || [])
    .filter((e) => e.loverId === timelineCharId);

  // 筛选 & 排序
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = 最新在前, asc = 最旧在前
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const filtered = events
    .filter((e) => filterType === "all" || e.eventType === filterType)
    .sort((a, b) => {
      // 置顶优先
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      // 然后按日期
      const ta = typeof a.occurredAt === "number" ? a.occurredAt : new Date(a.occurredAt || 0).getTime();
      const tb = typeof b.occurredAt === "number" ? b.occurredAt : new Date(b.occurredAt || 0).getTime();
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });

  const handleAdd = (formData) => {
    addTimelineEvent({
      ...formData,
      loverId: timelineCharId,
    });
    setShowForm(false);
  };

  const handleEdit = (formData) => {
    updateTimelineEvent(editingEvent.id, formData);
    setEditingEvent(null);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
  };

  // 按年/月分组（用于视觉分隔）
  const groupedByYear = (() => {
    const groups = {};
    filtered.forEach((e) => {
      const d = typeof e.occurredAt === "number"
        ? new Date(e.occurredAt)
        : new Date(e.occurredAt || e.createdAt);
      const year = isNaN(d.getTime()) ? "未知年份" : `${d.getFullYear()}年`;
      if (!groups[year]) groups[year] = [];
      groups[year].push(e);
    });
    return groups;
  })();

  const yearKeys = Object.keys(groupedByYear).sort((a, b) =>
    sortOrder === "desc"
      ? b.localeCompare(a)
      : a.localeCompare(b)
  );

  return (
    <div
      className="page-fade"
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 顶栏 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 20px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton
          onClick={() => navigateTo(prevPage || "profileEdit")}
          label="返回"
        />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
            📅 {charName}的故事年表
          </div>
          <div style={{ fontSize: 12, color: "#b0a0c0", marginTop: 2 }}>
            {events.length} 个节点
          </div>
        </div>
        <button
          style={{
            ...btnGhost,
            background: "rgba(140,110,180,.18)",
            color: "#5a3a7e",
            borderColor: "rgba(140,110,180,.4)",
            fontWeight: 500,
            padding: "8px 16px",
          }}
          onClick={() => setShowForm(true)}
        >
          + 记录
        </button>
      </div>

      {/* 筛选栏 */}
      <div style={{
        padding: "10px 16px",
        background: "rgba(255,255,255,.25)",
        borderBottom: "1px solid rgba(196,166,184,.15)",
        display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center",
        flexShrink: 0,
      }}>
        {/* 类型筛选 */}
        <button
          onClick={() => setFilterType("all")}
          style={{
            ...btnGhost, fontSize: 12, padding: "4px 12px",
            background: filterType === "all" ? "rgba(140,110,180,.2)" : undefined,
            color: filterType === "all" ? "#5a3a7e" : undefined,
            borderColor: filterType === "all" ? "rgba(140,110,180,.4)" : undefined,
          }}
        >
          全部
        </button>
        {EVENT_TYPES.map((et) => (
          <button
            key={et.key}
            onClick={() => setFilterType(filterType === et.key ? "all" : et.key)}
            style={{
              ...btnGhost, fontSize: 12, padding: "4px 10px",
              background: filterType === et.key ? `${et.color}20` : undefined,
              color: filterType === et.key ? et.color : undefined,
              borderColor: filterType === et.key ? `${et.color}50` : undefined,
            }}
          >
            {et.emoji} {et.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* 排序切换 */}
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          style={{ ...btnGhost, fontSize: 12, padding: "4px 10px" }}
        >
          {sortOrder === "desc" ? "↓ 最新" : "↑ 最早"}
        </button>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 48px" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", color: "#b0a0c0", fontSize: 13,
            padding: "48px 20px", lineHeight: 2,
          }}>
            {events.length === 0 ? (
              <>
                还没有记录任何故事节点<br />
                <span style={{ fontSize: 12 }}>
                  点击右上角「+ 记录」，或从迁入草稿生成
                </span>
              </>
            ) : (
              <>当前筛选下没有事件</>
            )}
          </div>
        ) : (
          // 按年份分组展示
          yearKeys.map((year) => (
            <div key={year}>
              {/* 年份分隔 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                margin: "18px 0 12px",
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "rgba(140,110,180,.6)", flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 12, color: "#9a8aac", fontWeight: 600,
                  letterSpacing: 2,
                }}>
                  {year}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.3)" }} />
                <span style={{ fontSize: 12, color: "#c0b0d0" }}>
                  {groupedByYear[year].length} 个
                </span>
              </div>

              {/* 竖线 + 卡片 */}
              <div style={{ paddingLeft: 14, borderLeft: "2px solid rgba(196,166,184,.3)", marginLeft: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {groupedByYear[year].map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={openEdit}
                      onDelete={deleteTimelineEvent}
                      onTogglePin={toggleTimelinePin}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新增弹窗 */}
      {showForm && (
        <EventFormModal
          charName={charName}
          onSave={handleAdd}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* 编辑弹窗 */}
      {editingEvent && (
        <EventFormModal
          initial={editingEvent}
          charName={charName}
          onSave={handleEdit}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
