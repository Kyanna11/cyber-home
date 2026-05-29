// ─── 日常合并页 ───
// 手札 / 便签 / 时间线 三合一入口
// 点击条目跳到对应完整页面

import { useState } from "react";
import BackButton from "../components/BackButton";
import PillTabs from "../components/PillTabs";

const TABS = [
  { key: "diary",    label: "手札" },
  { key: "notes",    label: "便签" },
  { key: "timeline", label: "时间线" },
];

const NOTE_ICONS = {
  diary: "📔", thought: "💭", idea: "✨",
  dream: "🌙", project: "📋", letter: "💌", note: "📝",
};

const EVENT_ICONS = {
  firstMeet: "✨", milestone: "🏅", sweet: "💗",
  promise: "🤞", conflict: "🌧️", gift: "🎁", other: "📌",
};

const NOTE_PALETTES = ["#fef9c3", "#fce7f3", "#e0f2fe", "#dcfce7", "#ede9fe"];
function getPalette(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return NOTE_PALETTES[h % NOTE_PALETTES.length];
}

function formatShort(ts) {
  if (!ts) return "";
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── 共享样式 ──
const card = {
  background: "rgba(255,255,255,.72)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: 14,
  border: "1px solid rgba(196,166,184,.2)",
  padding: "12px 14px",
  marginBottom: 10,
  cursor: "pointer",
};

const empty = {
  textAlign: "center",
  padding: "52px 24px",
  color: "var(--text-faint)",
  fontSize: 13,
  lineHeight: 2.2,
};

const btnP = {
  flex: 1, padding: "10px 14px", borderRadius: 12, fontSize: 13,
  background: "rgba(120,100,160,.85)", border: "none",
  color: "white", cursor: "pointer", fontFamily: "var(--font-main)", letterSpacing: 0.5,
};

const btnS = {
  padding: "10px 14px", borderRadius: 12, fontSize: 13,
  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.28)",
  color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
};

// ════════════════════════════════════
export default function DailyPage({
  navigateTo,
  prevPage,
  noteEntries,
  characters,
  stickyNotes,
  onMarkRead,
  timelineEvents,
  openTimeline,
}) {
  const [activeTab, setActiveTab] = useState("diary");
  const [tlCharId, setTlCharId] = useState("");

  // ── 手札：最近8条（已发布） ──
  const recentNotes = [...(noteEntries || [])]
    .filter(n => !n.isDraft)
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 8);

  // ── 便签：pin 置顶，最新排前 ──
  const sortedNotes = [...(stickyNotes || [])]
    .sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || (b.createdAt - a.createdAt));

  // ── 时间线：过滤 + 日期降序 ──
  const filteredEvents = [...(timelineEvents || [])]
    .filter(e => !tlCharId || e.loverId === tlCharId)
    .sort((a, b) => (b.occurredAt || "") > (a.occurredAt || "") ? 1 : -1);

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 16px 10px",
        background: "rgba(255,255,255,.45)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(196,166,184,.18)",
        flexShrink: 0,
        position: "relative",
      }}>
        <BackButton onClick={() => navigateTo(prevPage || "bedroom")} label="返回" />
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          fontSize: 15, fontWeight: 600, color: "#5a4a6a",
          letterSpacing: 2, fontFamily: "var(--font-main)",
        }}>
          日常
        </div>
        <div style={{ width: 48, marginLeft: "auto" }} />
      </div>

      {/* ── Tab 栏 ── */}
      <PillTabs
        tabs={TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flexShrink: 0, borderBottom: "1px solid rgba(196,166,184,.1)" }}
      />

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px 48px" }}>

        {/* ═══ 手札 tab ═══ */}
        {activeTab === "diary" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button style={btnP} onClick={() => navigateTo("diary")}>✏️ 写手札</button>
              <button style={btnS} onClick={() => navigateTo("diary")}>全部手札 →</button>
            </div>

            {recentNotes.length === 0 ? (
              <div style={empty}>还没有手札~<br />今天写点什么吧</div>
            ) : recentNotes.map(note => (
              <div key={note.id} onClick={() => navigateTo("diary")} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: note.text ? 5 : 0 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{NOTE_ICONS[note.type] || "📝"}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "#4a3a5e",
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {note.title || note.text?.slice(0, 24) || "无标题"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>
                    {formatShort(note.updatedAt || note.createdAt)}
                  </span>
                </div>
                {note.text && (
                  <div style={{
                    fontSize: 12, color: "#8a7898", lineHeight: 1.7, paddingLeft: 23,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {note.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ 便签 tab ═══ */}
        {activeTab === "notes" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button style={btnP} onClick={() => navigateTo("stickyNotes")}>📝 写便签</button>
              <button style={btnS} onClick={() => navigateTo("stickyNotes")}>便签墙 →</button>
            </div>

            {sortedNotes.length === 0 ? (
              <div style={empty}>便签墙还是空的~</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {sortedNotes.slice(0, 12).map(note => (
                    <div
                      key={note.id}
                      onClick={() => !note.read && onMarkRead?.(note.id)}
                      style={{
                        background: getPalette(note.id),
                        borderRadius: 14, padding: "12px 12px 10px",
                        boxShadow: "0 2px 8px rgba(74,69,96,.07)",
                        cursor: "pointer", position: "relative",
                        border: "1px solid rgba(255,255,255,.5)",
                        minHeight: 80,
                      }}
                    >
                      {!note.read && (
                        <div style={{
                          position: "absolute", top: 9, right: 9,
                          width: 7, height: 7, borderRadius: "50%",
                          background: "#d97070",
                        }} />
                      )}
                      <div style={{
                        fontSize: 12, color: "#6a5a70", marginBottom: 4,
                        fontFamily: "var(--font-main)",
                      }}>
                        {note.authorName}{note.pinned ? " 📌" : ""}
                      </div>
                      <div style={{
                        fontSize: 12, color: "#3a2a4a", lineHeight: 1.65,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
                      }}>
                        {note.content}
                      </div>
                    </div>
                  ))}
                </div>

                {sortedNotes.length > 12 && (
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <button onClick={() => navigateTo("stickyNotes")} style={btnS}>
                      还有 {sortedNotes.length - 12} 条 · 查看全部
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ 时间线 tab ═══ */}
        {activeTab === "timeline" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
              {(characters?.length || 0) > 1 && (
                <select
                  value={tlCharId}
                  onChange={e => setTlCharId(e.target.value)}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 12,
                    background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.28)",
                    color: "#7a6a8e", fontFamily: "var(--font-main)", outline: "none",
                  }}
                >
                  <option value="">所有</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <button
                style={{ ...btnS, flexShrink: 0 }}
                onClick={() => tlCharId ? openTimeline?.(tlCharId) : navigateTo("timeline")}
              >
                完整时间线 →
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div style={empty}>还没有关系时间线记录~</div>
            ) : filteredEvents.slice(0, 20).map(event => {
              const char = characters?.find(c => c.id === event.loverId);
              return (
                <div
                  key={event.id}
                  onClick={() => openTimeline?.(event.loverId)}
                  style={card}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                      {EVENT_ICONS[event.eventType] || "📌"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 500, color: "#4a3a5e",
                          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {event.title}
                        </span>
                        {event.pinned && <span style={{ fontSize: 14 }}>📌</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {event.occurredAt && (
                          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{event.occurredAt}</span>
                        )}
                        {char && (
                          <span style={{
                            fontSize: 12, color: "#7a6a8e",
                            background: "rgba(120,100,160,.08)",
                            padding: "1px 7px", borderRadius: 6,
                          }}>
                            {char.name}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <div style={{
                          fontSize: 12, color: "#8a7898", lineHeight: 1.65, marginTop: 4,
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
