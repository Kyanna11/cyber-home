// ─── 他的房间 ───
// 每个入住者的个人空间聚合页，提供进入各功能模块的快捷入口。
// 只做入口聚合，不复制业务逻辑。

import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

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
        <div style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.5 }}>
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
          fontSize: 10, color: "#9a8aac", marginBottom: 3, letterSpacing: 0.5,
        }}>{label}</div>
        <div style={{
          fontSize: 13, color: "#4a3a5e", lineHeight: 1.6,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {preview}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
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

// ═══════════════════════════════════
// ── 主页面 ──
// ═══════════════════════════════════
export default function CharRoomPage({
  char,
  charId,
  chatThreads,
  stickyNotes,
  timelineEvents,
  charTreasures,
  onEnterChat,
  onOpenProfile,
  onOpenMemoryPalace,
  onOpenTimeline,
  onOpenWakePreview,
  onOpenCharTreasure,
  navigateTo,
  onBack,
}) {
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

  // ── 最近动态数据整理 ──

  // 最近一条非系统聊天消息
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

  // 最近一条时间线事件
  const recentTimeline = (timelineEvents || [])
    .filter((e) => e.loverId === charId)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  // 最近一条和此入住者有关的便签
  const recentNote = (stickyNotes || [])
    .filter((n) => n.authorId === charId || n.targetCharId === charId)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  // 最近一条他的宝库
  const recentCharTreasure = (charTreasures || [])
    .filter((t) => t.charId === charId)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  const hasRecentActivity = lastChatMsg || recentTimeline || recentNote || recentCharTreasure;

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
        <div style={{ flex: 1 }} />
        {/* 去聊天快捷按钮 */}
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

      {/* ── 滚动内容区 ── */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 32 }}>

        {/* ── Hero 区 ── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "28px 24px 20px", textAlign: "center",
          position: "relative",
        }}>
          {/* 背景光晕 */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,150,220,.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* 头像 */}
          <div style={{
            marginBottom: 14, position: "relative",
            filter: "drop-shadow(0 4px 16px rgba(120,80,160,.18))",
          }}>
            <Avatar char={char} size={80} radius={26} fontSize={40} />
          </div>

          {/* 名字 */}
          <div style={{
            fontSize: 22, fontWeight: 600, color: "#3a2e4a",
            letterSpacing: 2, marginBottom: 6,
          }}>
            {charName}
          </div>

          {/* 关系标签 */}
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

          {/* 来源平台 */}
          {char.migration?.sourcePlatform && (
            <div style={{
              fontSize: 11, color: "var(--text-faint)", marginBottom: 10,
            }}>
              来自 {char.migration.sourcePlatform}
            </div>
          )}

          {/* 房间说明 */}
          <div style={{
            fontSize: 12, color: "#8a7898", lineHeight: 1.9,
            maxWidth: 300, marginTop: 4,
            fontStyle: "italic",
          }}>
            这里收着{charName}和你一起带回来的记忆。
          </div>
        </div>

        {/* ── 快捷入口卡片 ── */}
        <div style={{ padding: "0 14px 20px" }}>
          <div style={{
            fontSize: 11, color: "#9a8aac", letterSpacing: 1,
            marginBottom: 10, paddingLeft: 4,
          }}>
            快捷入口
          </div>

          {/* 主要入口：2 列网格 */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
            marginBottom: 10,
          }}>
            <ActionCard
              emoji="💬"
              label="去聊天"
              sublabel="继续上次的话"
              onClick={() => onEnterChat?.(charId)}
            />
            <ActionCard
              emoji="🌙"
              label="亲密邀请"
              sublabel="在聊天的 + 里发起"
              onClick={() => onEnterChat?.(charId)}
            />
            <ActionCard
              emoji="📋"
              label="入住档案"
              sublabel="人格、记忆、设定"
              onClick={() => onOpenProfile?.(char)}
            />
            <ActionCard
              emoji="🏛️"
              label="记忆宫殿"
              sublabel="记忆、沉淀、草稿"
              onClick={() => onOpenMemoryPalace?.(charId)}
            />
            <ActionCard
              emoji="📅"
              label="关系时间线"
              sublabel="重要时刻"
              onClick={() => onOpenTimeline?.(charId)}
            />
            <ActionCard
              emoji="🌅"
              label="唤醒预览"
              sublabel="下次对话注入内容"
              onClick={() => onOpenWakePreview?.(charId)}
            />
          </div>

          {/* 次要入口 */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          }}>
            <ActionCard
              emoji="💝"
              label="他的宝库"
              sublabel={
                (() => {
                  const cnt = (charTreasures || []).filter((t) => t.charId === charId).length;
                  return cnt > 0 ? `${cnt} 件珍藏` : "他最爱的珍藏";
                })()
              }
              onClick={() => onOpenCharTreasure?.(charId)}
            />
            <ActionCard
              emoji="🖼"
              label="照片回忆"
              sublabel="稍后开放"
              coming
            />
          </div>
        </div>

        {/* ── 最近动态 ── */}
        {hasRecentActivity && (
          <div style={{ padding: "0 14px" }}>
            <div style={{
              fontSize: 11, color: "#9a8aac", letterSpacing: 1,
              marginBottom: 10, paddingLeft: 4,
            }}>
              最近动态
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              <RecentCard
                icon="💬"
                label="最近聊天"
                preview={lastChatMsg
                  ? `${lastChatMsg.role === "bot" ? charName : "你"}：${lastChatMsg.content}`
                  : null}
                sub={lastChatMsg ? formatDateShort(lastChatMsg.createdAt) : null}
                onClick={() => onEnterChat?.(charId)}
              />

              <RecentCard
                icon="📅"
                label="关系时间线"
                preview={recentTimeline?.title || null}
                sub={recentTimeline
                  ? `${recentTimeline.occurredAt || ""} · ${recentTimeline.description?.slice(0, 30) || ""}`.trim().replace(/^·\s*/, "")
                  : null}
                onClick={() => onOpenTimeline?.(charId)}
              />

              <RecentCard
                icon="📝"
                label="便签"
                preview={recentNote?.content || null}
                sub={recentNote ? `${recentNote.authorName} · ${formatDateShort(recentNote.createdAt)}` : null}
                onClick={null}
              />

              <RecentCard
                icon="💝"
                label="他的宝库"
                preview={recentCharTreasure?.content
                  ? `「${recentCharTreasure.content.slice(0, 60)}」`
                  : null}
                sub={recentCharTreasure ? formatDateShort(recentCharTreasure.createdAt) : null}
                onClick={() => onOpenCharTreasure?.(charId)}
              />
            </div>
          </div>
        )}

        {/* 底部留白 */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
