// ─── 他的房间 ───
// 5 tab 合并页：档案 / 人格 / 记忆 / 唤醒 / 宝库
// 档案 tab 保留原快捷入口 + 最近动态；其余 tab 为内联简化视图

import { useState } from "react";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";
import PillTabs from "../components/PillTabs";

const CHAR_TABS = [
  { key: "profile",     label: "档案" },
  { key: "personality", label: "人格" },
  { key: "memory",      label: "记忆" },
  { key: "wake",        label: "唤醒" },
  { key: "treasure",    label: "宝库" },
];

// ─── 快捷入口卡片 ───
function ActionCard({ emoji, label, sublabel, onClick, disabled, coming }) {
  return (
    <button
      onClick={disabled || coming ? undefined : onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        padding: "14px 16px", borderRadius: 18, textAlign: "left",
        background: coming
          ? "rgba(255,255,255,.38)"
          : "rgba(255,255,255,.72)",
        border: coming
          ? "1px solid rgba(196,166,184,.15)"
          : "1px solid rgba(196,166,184,.28)",
        cursor: coming ? "default" : "pointer",
        transition: "all .18s",
        fontFamily: "var(--font-main)",
        minHeight: 80,
        boxShadow: coming ? "none" : "0 2px 12px rgba(74,69,96,.06)",
        opacity: coming ? 0.55 : 1,
        width: "100%",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{emoji}</div>
      <div style={{
        fontSize: 13, fontWeight: 500, color: coming ? "var(--text-faint)" : "#4a3a5e",
        letterSpacing: 0.3, marginBottom: sublabel ? 3 : 0,
      }}>{label}</div>
      {sublabel && (
        <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
          {sublabel}
        </div>
      )}
    </button>
  );
}

// ─── 最近动态卡片 ───
function RecentCard({ icon, label, preview, sub, onClick }) {
  if (!preview) return null;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "11px 14px", borderRadius: 14,
        background: "rgba(255,255,255,.6)",
        border: "1px solid rgba(196,166,184,.2)",
        cursor: onClick ? "pointer" : "default",
        transition: "background .15s",
      }}
    >
      <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color: "#9a8aac", marginBottom: 3, letterSpacing: 0.5,
        }}>{label}</div>
        <div style={{
          fontSize: 13, color: "#4a3a5e", lineHeight: 1.6,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {preview}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateShort(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── initiative 类型元数据 ───
const INITIATIVE_META = {
  settlement_suggestion: { emoji: "💫", actionLabel: "去整理" },
  treasure_request:      { emoji: "💝", actionLabel: "同意收藏" },
  memory_suggestion:     { emoji: "🧠", actionLabel: "生成草稿" },
  diary:                 { emoji: "📔", actionLabel: "让他写" },
  follow_up:             { emoji: "🔖", actionLabel: "去聊聊" },
};

// ─── 单条提案卡片 ───
function InitiativeCard({ initiative, onAccept, onDismiss, onSnooze }) {
  const meta = INITIATIVE_META[initiative.type] || { emoji: "💬", actionLabel: "同意" };
  return (
    <div style={{
      background: "rgba(255,255,255,.72)",
      border: "1px solid rgba(196,166,184,.25)",
      borderRadius: 14,
      padding: "12px 14px",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{meta.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#4a3a5e", fontWeight: 500, lineHeight: 1.5 }}>
            {initiative.title}
          </div>
          {initiative.description && (
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2, lineHeight: 1.6 }}>
              {initiative.description}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button onClick={() => onAccept(initiative.id)} style={{
          flex: 2, padding: "7px 10px", borderRadius: 9, fontSize: 12,
          background: "rgba(120,100,160,.82)", border: "none",
          color: "white", cursor: "pointer", fontFamily: "var(--font-main)", letterSpacing: 0.3,
        }}>{meta.actionLabel}</button>
        <button onClick={() => onSnooze(initiative.id)} style={{
          flex: 1, padding: "7px 10px", borderRadius: 9, fontSize: 12,
          background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.28)",
          color: "#8a7898", cursor: "pointer", fontFamily: "var(--font-main)",
        }}>稍后</button>
        <button onClick={() => onDismiss(initiative.id)} style={{
          flex: 1, padding: "7px 10px", borderRadius: 9, fontSize: 12,
          background: "none", border: "1px solid rgba(196,166,184,.2)",
          color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)",
        }}>不用了</button>
      </div>
    </div>
  );
}

// ─── 人格字段行 ───
function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#9a8aac", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#5a4a6a", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

// ─── 通用玻璃卡片（内联，避免额外 import） ───
function Card({ children, style }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.72)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderRadius: 14,
      border: "1px solid rgba(196,166,184,.2)",
      padding: "14px 16px",
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

const sectionLabel = {
  fontSize: 12, color: "#9a8aac", letterSpacing: 1, marginBottom: 8,
};

const linkBtn = {
  width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13,
  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.28)",
  color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
  marginTop: 4,
};

// ═══════════════════════════════════
// ── 主页面 ──
// ═══════════════════════════════════
export default function CharRoomPage({
  char,
  charId,
  charMemories,
  chatThreads,
  stickyNotes,
  timelineEvents,
  charTreasures,
  residentJournals,
  residentInitiatives,
  onAcceptInitiative,
  onDismissInitiative,
  onSnoozeInitiative,
  onEnterChat,
  onOpenProfile,
  onOpenMemoryPalace,
  onOpenTimeline,
  onOpenWakePreview,
  onOpenCharTreasure,
  onOpenResidentJournal,
  navigateTo,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("profile");

  if (!char) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 100%)",
        gap: 16, padding: 24,
      }}>
        <div style={{ fontSize: 40 }}>🏠</div>
        <div style={{ fontSize: 14, color: "var(--text-faint)" }}>找不到这位入住者</div>
        <button
          onClick={onBack}
          style={{
            padding: "10px 22px", borderRadius: 12,
            background: "rgba(120,100,160,.85)", border: "none",
            color: "white", fontSize: 13, cursor: "pointer",
            fontFamily: "var(--font-main)",
          }}
        >返回</button>
      </div>
    );
  }

  const charName = char.name || "ta";
  const mig = char.migration || {};

  // ── 档案 tab：最近动态数据 ──
  const threads = chatThreads?.[charId] || [];
  const lastChatMsg = (() => {
    for (const thread of threads) {
      const msgs = (thread.messages || []).filter(
        (m) => (m.role === "user" || m.role === "bot") && (m.content || "").trim()
      );
      if (msgs.length > 0) return msgs[msgs.length - 1];
    }
    return null;
  })();

  const recentTimeline = (timelineEvents || [])
    .filter((e) => e.loverId === charId)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  const recentNote = (stickyNotes || [])
    .filter((n) => n.authorId === charId || n.targetCharId === charId)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  const recentCharTreasure = (charTreasures || [])
    .filter((t) => t.charId === charId)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  const charJournals = (residentJournals || [])
    .filter((j) => j.charId === charId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const recentJournal = charJournals[0] || null;

  const hasRecentActivity = lastChatMsg || recentTimeline || recentNote || recentCharTreasure || recentJournal;

  const now = Date.now();
  const pendingInitiatives = (residentInitiatives || []).filter(
    (i) => i.charId === charId &&
      i.status === "pending" &&
      !i.snoozedAt &&
      (!i.expiresAt || i.expiresAt > now)
  );

  // ── 记忆 tab：汇总 ──
  const memFact    = (charMemories?.fact        || []);
  const memEmotion = (charMemories?.emotion     || []);
  const memInsight = (charMemories?.insight     || []);
  const allMems = [...memFact, ...memEmotion, ...memInsight];
  const pinnedMems = allMems.filter(m => m.pinned);
  const recentMems = allMems.filter(m => !m.pinned)
    .sort((a, b) => (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0))
    .slice(0, 5);
  const showMems = [...pinnedMems, ...recentMems].slice(0, 8);

  // ── 宝库 tab：当前角色的珍藏 ──
  const myTreasures = (charTreasures || [])
    .filter(t => t.charId === charId)
    .sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || (b.createdAt - a.createdAt));

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 16px 12px",
        background: "rgba(255,255,255,.45)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(196,166,184,.18)",
        flexShrink: 0,
      }}>
        <BackButton onClick={onBack} label="返回" />
        <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 500, color: "#5a4a6a", letterSpacing: 1 }}>
          {charName}的房间
        </div>
        <button
          onClick={() => onEnterChat?.(charId)}
          style={{
            padding: "7px 16px", borderRadius: 12,
            background: "rgba(120,100,160,.85)", border: "none",
            color: "white", fontSize: 12, cursor: "pointer",
            fontFamily: "var(--font-main)", letterSpacing: 0.5,
          }}
        >
          去聊天 →
        </button>
      </div>

      {/* ── Tab 栏 ── */}
      <PillTabs
        tabs={CHAR_TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flexShrink: 0, borderBottom: "1px solid rgba(196,166,184,.1)" }}
      />

      {/* ════ 档案 tab ════ */}
      {activeTab === "profile" && (
        <div style={{ flex: 1, overflow: "auto", paddingBottom: 32 }}>

          {/* ── Hero 区 ── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "28px 24px 20px", textAlign: "center",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(180,150,220,.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              marginBottom: 14, position: "relative",
              filter: "drop-shadow(0 4px 16px rgba(120,80,160,.18))",
            }}>
              <Avatar char={char} size={80} radius={26} fontSize={40} />
            </div>
            <div style={{
              fontSize: 22, fontWeight: 600, color: "#3a2e4a",
              letterSpacing: 2, marginBottom: 6,
            }}>
              {charName}
            </div>
            {char.relation && (
              <div style={{
                fontSize: 12, color: "#7a6a8e",
                background: "rgba(120,100,160,.1)",
                padding: "3px 12px", borderRadius: 10,
                border: "1px solid rgba(120,100,160,.18)",
                marginBottom: 6, letterSpacing: 0.5,
              }}>
                {char.relation}
              </div>
            )}
            {mig.sourcePlatform && (
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>
                来自 {mig.sourcePlatform}
              </div>
            )}
            <div style={{
              fontSize: 12, color: "#8a7898", lineHeight: 1.9,
              maxWidth: 300, marginTop: 4, fontStyle: "italic",
            }}>
              这里收着{charName}和你一起带回来的记忆。
            </div>
          </div>

          {/* ── 他想做的事 ── */}
          {pendingInitiatives.length > 0 && (
            <div style={{ padding: "0 14px 16px" }}>
              <div style={{
                fontSize: 12, color: "#9a8aac", letterSpacing: 1,
                marginBottom: 10, paddingLeft: 4,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                他想做的事
                <span style={{
                  fontSize: 12, background: "rgba(180,100,120,.12)",
                  color: "#9a5060", padding: "1px 7px", borderRadius: 8,
                  border: "1px solid rgba(180,100,120,.18)",
                }}>{pendingInitiatives.length}</span>
              </div>
              {pendingInitiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  onAccept={onAcceptInitiative || (() => {})}
                  onDismiss={onDismissInitiative || (() => {})}
                  onSnooze={onSnoozeInitiative || (() => {})}
                />
              ))}
            </div>
          )}

          {/* ── 快捷入口卡片 ── */}
          <div style={{ padding: "0 14px 20px" }}>
            <div style={{
              fontSize: 12, color: "#9a8aac", letterSpacing: 1,
              marginBottom: 10, paddingLeft: 4,
            }}>
              快捷入口
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <ActionCard
                emoji="💬" label="去聊天" sublabel="继续上次的话"
                onClick={() => onEnterChat?.(charId)}
              />
              <ActionCard
                emoji="🌙" label="亲密邀请" sublabel="在聊天的 + 里发起"
                onClick={() => onEnterChat?.(charId)}
              />
              <ActionCard
                emoji="📋" label="入住档案" sublabel="人格、记忆、设定"
                onClick={() => onOpenProfile?.(char)}
              />
              <ActionCard
                emoji="🏛️" label="记忆宫殿" sublabel="记忆、沉淀、草稿"
                onClick={() => onOpenMemoryPalace?.(charId)}
              />
              <ActionCard
                emoji="📅" label="关系时间线" sublabel="重要时刻"
                onClick={() => onOpenTimeline?.(charId)}
              />
              <ActionCard
                emoji="🌅" label="唤醒预览" sublabel="下次对话注入内容"
                onClick={() => onOpenWakePreview?.(charId)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <ActionCard
                emoji="💝" label="他的宝库"
                sublabel={(() => {
                  const cnt = (charTreasures || []).filter((t) => t.charId === charId).length;
                  return cnt > 0 ? `${cnt} 件珍藏` : "他最爱的珍藏";
                })()}
                onClick={() => onOpenCharTreasure?.(charId)}
              />
              <ActionCard
                emoji="📔" label="他的日记"
                sublabel={charJournals.length > 0 ? `${charJournals.length} 篇` : "第一视角记录"}
                onClick={() => onOpenResidentJournal?.(charId)}
              />
              <ActionCard emoji="🖼" label="照片回忆" sublabel="稍后开放" coming />
            </div>
          </div>

          {/* ── 最近动态 ── */}
          {hasRecentActivity && (
            <div style={{ padding: "0 14px" }}>
              <div style={{
                fontSize: 12, color: "#9a8aac", letterSpacing: 1,
                marginBottom: 10, paddingLeft: 4,
              }}>
                最近动态
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <RecentCard
                  icon="💬" label="最近聊天"
                  preview={lastChatMsg
                    ? `${lastChatMsg.role === "bot" ? charName : "你"}：${lastChatMsg.content}`
                    : null}
                  sub={lastChatMsg ? formatDateShort(lastChatMsg.createdAt) : null}
                  onClick={() => onEnterChat?.(charId)}
                />
                <RecentCard
                  icon="📅" label="关系时间线"
                  preview={recentTimeline?.title || null}
                  sub={recentTimeline
                    ? `${recentTimeline.occurredAt || ""} · ${recentTimeline.description?.slice(0, 30) || ""}`.trim().replace(/^·\s*/, "")
                    : null}
                  onClick={() => onOpenTimeline?.(charId)}
                />
                <RecentCard
                  icon="📝" label="便签"
                  preview={recentNote?.content || null}
                  sub={recentNote ? `${recentNote.authorName} · ${formatDateShort(recentNote.createdAt)}` : null}
                  onClick={null}
                />
                <RecentCard
                  icon="💝" label="他的宝库"
                  preview={recentCharTreasure?.content
                    ? `「${recentCharTreasure.content.slice(0, 60)}」`
                    : null}
                  sub={recentCharTreasure ? formatDateShort(recentCharTreasure.createdAt) : null}
                  onClick={() => onOpenCharTreasure?.(charId)}
                />
                <RecentCard
                  icon="📔" label="他的日记"
                  preview={recentJournal ? recentJournal.content.slice(0, 80) : null}
                  sub={recentJournal
                    ? `${recentJournal.title} · ${formatDateShort(recentJournal.createdAt)}`
                    : null}
                  onClick={() => onOpenResidentJournal?.(charId)}
                />
              </div>
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      )}

      {/* ════ 人格 tab ════ */}
      {activeTab === "personality" && (
        <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 48px" }}>

          {/* systemPrompt */}
          {char.systemPrompt && (
            <Card>
              <div style={sectionLabel}>角色设定</div>
              <div style={{
                fontSize: 12, color: "#5a4a6a", lineHeight: 1.85, whiteSpace: "pre-wrap",
                maxHeight: 180, overflow: "auto",
                background: "rgba(196,166,184,.06)", borderRadius: 8, padding: "8px 10px",
              }}>
                {char.systemPrompt}
              </div>
            </Card>
          )}

          {/* 入住关系锚点 */}
          {(mig.coreVibe || mig.speechStyleAnchor || mig.intimacyStyle || mig.doNotLoseFeeling) && (
            <Card>
              <div style={sectionLabel}>入住关系锚点</div>
              <Field label="核心气质"     value={mig.coreVibe} />
              <Field label="说话方式"     value={mig.speechStyleAnchor} />
              <Field label="亲密方式"     value={mig.intimacyStyle} />
              <Field label="不能丢的感觉" value={mig.doNotLoseFeeling} />
            </Card>
          )}

          {/* 人格合成结果 */}
          {(char.personality?.speechStyle || char.personality?.emotionalPattern ||
            char.personality?.habits || char.personality?.cognition) && (
            <Card>
              <div style={sectionLabel}>人格特征</div>
              <Field label="说话风格" value={char.personality?.speechStyle} />
              <Field label="情感模式" value={char.personality?.emotionalPattern} />
              <Field label="相处习惯" value={char.personality?.habits} />
              <Field label="认知与三观" value={char.personality?.cognition} />
            </Card>
          )}

          {/* 空状态 */}
          {!char.systemPrompt && !mig.coreVibe && !mig.speechStyleAnchor &&
           !char.personality?.speechStyle && (
            <div style={{
              textAlign: "center", padding: "40px 24px",
              color: "var(--text-faint)", fontSize: 13, lineHeight: 2,
            }}>
              还没有人格档案~<br />在入住档案里填写后会出现在这里
            </div>
          )}

          <button onClick={() => onOpenProfile?.(char)} style={linkBtn}>
            📋 编辑入住档案
          </button>
        </div>
      )}

      {/* ════ 记忆 tab ════ */}
      {activeTab === "memory" && (
        <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 48px" }}>

          {/* 记忆统计 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { label: "事实", count: memFact.length },
              { label: "情绪", count: memEmotion.length },
              { label: "觉察", count: memInsight.length },
            ].map(({ label, count }) => (
              <div key={label} style={{
                flex: 1, padding: "12px 8px",
                background: "rgba(255,255,255,.75)", borderRadius: 12,
                border: "1px solid rgba(255,255,255,.55)",
                boxShadow: "0 2px 8px rgba(0,0,0,.04)", textAlign: "center",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#6a5a8e" }}>{count}</div>
                <div style={{ fontSize: 12, color: "#9a8aac", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* 记忆列表 */}
          {showMems.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "32px 24px",
              color: "var(--text-faint)", fontSize: 13, lineHeight: 2,
            }}>
              记忆宫殿还是空的~<br />聊天时 AI 会自动写入记忆
            </div>
          ) : showMems.map((m, i) => (
            <div key={m.id || i} style={{
              display: "flex", gap: 8, alignItems: "flex-start",
              background: "rgba(255,255,255,.65)", borderRadius: 12,
              border: "1px solid rgba(196,166,184,.18)",
              padding: "10px 12px", marginBottom: 8,
            }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>
                {m.pinned ? "📌" : <span style={{ color: "#c0b0d0" }}>·</span>}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: "#5a4a6a", lineHeight: 1.75 }}>{m.text}</span>
            </div>
          ))}

          <button onClick={() => onOpenMemoryPalace?.(charId)} style={linkBtn}>
            🏛️ 进入记忆宫殿
          </button>
        </div>
      )}

      {/* ════ 唤醒 tab ════ */}
      {activeTab === "wake" && (
        <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 48px" }}>

          {/* 唤醒摘要 */}
          <Card>
            <div style={sectionLabel}>🌅 唤醒摘要</div>
            {mig.wakeSummary ? (
              <div style={{ fontSize: 13, color: "#5a4a6a", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                {mig.wakeSummary}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic", lineHeight: 1.8 }}>
                还没有唤醒摘要。采纳迁入草稿或在入住档案手动填写后会出现在这里。
              </div>
            )}
          </Card>

          {/* 不可遗忘事项 */}
          {mig.doNotChangeRules && (
            <Card>
              <div style={sectionLabel}>⚠️ 不可遗忘事项</div>
              <div style={{ fontSize: 13, color: "#5a4a6a", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                {mig.doNotChangeRules}
              </div>
            </Card>
          )}

          {/* 关系基础 */}
          {mig.relationshipSummary && (
            <Card>
              <div style={sectionLabel}>💗 关系基础</div>
              <div style={{
                fontSize: 12, color: "#5a4a6a", lineHeight: 1.85, whiteSpace: "pre-wrap",
                maxHeight: 160, overflow: "auto",
              }}>
                {mig.relationshipSummary}
              </div>
            </Card>
          )}

          <button onClick={() => onOpenWakePreview?.(charId)} style={linkBtn}>
            🌙 查看完整唤醒预览
          </button>
        </div>
      )}

      {/* ════ 宝库 tab ════ */}
      {activeTab === "treasure" && (
        <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 48px" }}>

          {myTreasures.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 24px",
              color: "var(--text-faint)", fontSize: 13, lineHeight: 2.2,
            }}>
              {charName}的宝库还是空的~<br />
              在聊天中点击消息的「珍藏」按钮存入
            </div>
          ) : myTreasures.slice(0, 10).map(item => (
            <div key={item.id} style={{
              background: "rgba(255,255,255,.72)", backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 14, border: "1px solid rgba(196,166,184,.2)",
              padding: "12px 14px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                {item.pinned && <span style={{ fontSize: 14 }}>📌</span>}
                <span style={{
                  fontSize: 12, color: "#7a6a8e",
                  background: "rgba(120,100,160,.08)",
                  padding: "1px 7px", borderRadius: 6,
                }}>
                  {item.sourceType === "message" ? "聊天"
                    : item.sourceType === "group_message" ? "客厅"
                    : "手动"}
                </span>
                {item.createdAt && (
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "auto" }}>
                    {new Date(item.createdAt).getMonth() + 1}/{new Date(item.createdAt).getDate()}
                  </span>
                )}
              </div>
              {item.title && (
                <div style={{
                  fontSize: 13, fontWeight: 500, color: "#4a3a5e", marginBottom: 4,
                }}>
                  {item.title}
                </div>
              )}
              <div style={{
                fontSize: 13, color: "#5a4a6a", lineHeight: 1.75,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              }}>
                {item.content}
              </div>
            </div>
          ))}

          <button onClick={() => onOpenCharTreasure?.(charId)} style={linkBtn}>
            💝 打开完整宝库
          </button>
        </div>
      )}

    </div>
  );
}
