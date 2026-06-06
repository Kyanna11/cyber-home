// ─── 卧室页 ───
// 背景：房间插画（public/bedroom-bg.jpg）
// 热点（3个）：书桌(日常) / 书柜(ta的房间) / 门(聊天区)
// 小透明卡片 + 悬停发光，点击跳转

import { useState } from "react";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

// ── 热点标签卡片 ──
// position: { top, left } 为百分比字符串，相对于场景区域
// cardAnchor: "left"|"right"|"center" 控制卡片对齐
function HotspotCard({ label, sublabel, position, cardAnchor = "center", onClick, zone }) {
  const [hovered, setHovered] = useState(false);

  // zone 是透明可点击区域的大小/偏移，默认以 position 为中心
  const zoneStyle = zone || {
    top: `calc(${position.top} - 6%)`,
    left: `calc(${position.left} - 8%)`,
    width: "16%",
    height: "12%",
  };

  const anchorStyle = cardAnchor === "left"
    ? { left: 0, transform: "none" }
    : cardAnchor === "right"
      ? { right: 0, transform: "none", left: "auto" }
      : { left: "50%", transform: "translateX(-50%)" };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={() => setHovered(true)}
      onPointerUp={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      style={{
        position: "absolute",
        ...zoneStyle,
        cursor: "pointer",
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems:
          cardAnchor === "left" ? "flex-start"
          : cardAnchor === "right" ? "flex-end"
          : "center",
        justifyContent: "flex-end",
      }}
    >
      {/* 悬停光晕（覆盖整个热点区域） */}
      {hovered && (
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: 10,
          background: "rgba(200,180,240,.1)",
          boxShadow: "0 0 18px rgba(180,150,220,.25)",
          pointerEvents: "none",
        }} />
      )}

      {/* 标签卡片 */}
      <div
        className="room-label"
        style={{
          position: "relative",
          ...anchorStyle,
          background: hovered
            ? "rgba(255,255,255,.82)"
            : "rgba(255,255,255,.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: hovered
            ? "1px solid rgba(200,180,220,.5)"
            : "1px solid rgba(255,255,255,.6)",
          borderRadius: 10,
          padding: sublabel ? "5px 11px 4px" : "5px 11px",
          boxShadow: hovered
            ? "0 4px 16px rgba(140,110,180,.2)"
            : "0 2px 10px rgba(74,69,96,.1)",
          transition: "all .2s",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          marginBottom: 2,
        }}
      >
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          color: hovered ? "#4a3a5e" : "#6a5a7a",
          letterSpacing: 2,
          fontFamily: "var(--font-main)",
          transition: "color .2s",
        }}>
          {label}
        </div>
        {sublabel && (
          <div style={{
            fontSize: 12,
            color: "var(--text-faint)",
            letterSpacing: 0.5,
            marginTop: 1,
          }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BedroomPage({
  navigateTo,
  hoveredItem,
  setHoveredItem,
  showCharSelect,
  setShowCharSelect,
  characters,
  enterChat,
  stickyNotes,
  onOpenGroupChat,
  groupChats,
  openCharRoom,
}) {
  const unreadNotes = (stickyNotes || []).filter((n) => !n.read);
  const recentNotes = (stickyNotes || [])
    .slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div className="bedroom" style={{ position: "relative" }}>

      {/* ── 顶栏 ── */}
      <div style={{
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 14px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 5,
        background: "rgba(0,0,0,.06)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        flexShrink: 0,
      }}>
        <BackButton onClick={() => navigateTo("entrance")} label="首页" />
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          fontSize: 14, fontWeight: 400, letterSpacing: 3,
          color: "rgba(80,60,90,.8)", fontFamily: "var(--font-main)",
          textShadow: "0 1px 4px rgba(255,255,255,.6)",
        }}>
          我的小房间
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => navigateTo("profiles")}
            title="入住档案"
            style={{
              background: "rgba(255,255,255,.45)", border: "1px solid rgba(255,255,255,.5)",
              borderRadius: 8, fontSize: 16, cursor: "pointer",
              padding: "3px 6px", lineHeight: 1,
            }}
          >📋</button>
        </div>
      </div>

      {/* ── 场景区（5 个热点，对应房间里的具体位置） ── */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>

        {/* 书桌 → 我的手札 */}
        <HotspotCard
          label="我的手札"
          sublabel="📔 书桌上的日记本"
          onClick={() => navigateTo("notes")}
          zone={{ position: "absolute", top: "50%", left: "30%", width: "26%", height: "16%" }}
          position={{ top: "50%", left: "30%" }}
          cardAnchor="center"
        />

        {/* 墙上 → 便签墙 */}
        <HotspotCard
          label="便签墙"
          sublabel={unreadNotes.length > 0 ? `📝 ${unreadNotes.length} 条未读` : "📝 墙上的留言"}
          onClick={() => navigateTo("stickyNotes")}
          zone={{ position: "absolute", top: "13%", left: "40%", width: "22%", height: "16%" }}
          position={{ top: "13%", left: "40%" }}
          cardAnchor="center"
        />

        {/* 床上 → 我的宝库 */}
        <HotspotCard
          label="我的宝库"
          sublabel="💎 珍藏的心动片段"
          onClick={() => navigateTo("treasures")}
          zone={{ position: "absolute", top: "52%", left: "2%", width: "24%", height: "18%" }}
          position={{ top: "52%", left: "2%" }}
          cardAnchor="left"
        />

        {/* 窗/柜 → 他们的房间 */}
        <HotspotCard
          label="他们的房间"
          sublabel={characters.length > 0 ? `🏠 ${characters.length} 位入住` : "🏠"}
          onClick={() => setShowCharSelect(true)}
          zone={{ position: "absolute", top: "20%", left: "68%", width: "22%", height: "24%" }}
          position={{ top: "20%", left: "68%" }}
          cardAnchor="center"
        />

        {/* 门 → 客厅 */}
        {onOpenGroupChat && (
          <HotspotCard
            label="客厅"
            sublabel={groupChats?.length > 0 ? `☕ ${groupChats.length} 个客厅` : "☕ 去客厅坐坐"}
            onClick={() => onOpenGroupChat(null)}
            zone={{ position: "absolute", top: "22%", left: "86%", width: "14%", height: "34%" }}
            position={{ top: "22%", left: "86%" }}
            cardAnchor="right"
          />
        )}

      </div>

      {/* ── 角色选择弹窗（出门后） ── */}
      {showCharSelect && (
        <div
          className="char-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCharSelect(false); }}
        >
          <div className="char-panel">
            <div className="char-panel-title">🏠 去谁的房间？</div>
            {characters.length === 0 && (
              <div style={{ padding:"12px 0", color:"var(--text-faint)", fontSize:13, lineHeight:1.8 }}>
                家里还没有人呢
                <br />回首页的「成员档案」先添加一位吧
              </div>
            )}
            {characters.map(char => (
              <div
                key={char.id}
                className="char-card"
                onClick={() => { setShowCharSelect(false); openCharRoom?.(char.id); }}
              >
                <Avatar char={char} size={42} radius={14} fontSize={20} />
                <div className="char-info">
                  <div className="char-name">{char.name || "未命名"}</div>
                  <div className="char-relation">{char.relation || ""}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCharSelect(false);
                    enterChat(char.id);
                  }}
                  style={{
                    flexShrink:0, marginLeft:4,
                    padding:"4px 10px", borderRadius:10,
                    background:"rgba(120,100,160,.1)",
                    border:"1px solid rgba(120,100,160,.2)",
                    color:"#6a5a8a", fontSize:11,
                    cursor:"pointer", fontFamily:"var(--font-main)",
                    whiteSpace:"nowrap",
                  }}
                >去聊天</button>
              </div>
            ))}
            <button className="char-close" onClick={() => setShowCharSelect(false)}>
              还是回房间吧
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
