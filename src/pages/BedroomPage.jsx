// ─── 卧室页 ───
// 背景：房间插画（public/bedroom-bg.jpg）
// 热点：便签墙 / 书桌(手札) / 柜子(档案) / 床(宝库) / 门(出门)
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
          fontSize: 11,
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
            fontSize: 9,
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

      {/* ── 场景区（热点层） ── */}
      {/*
        基于房间插画坐标：
        - 便签墙（贴纸板）: 画面上方偏右，top≈13%, left≈45%
        - 书桌/手札（桌上日记）: 画面中央, top≈50%, left≈37%
        - 柜子/档案（绿色书柜）: 画面右侧, top≈28%, left≈72%
        - 床/宝库（左侧床铺）: 画面左侧中部, top≈52%, left≈5%
        - 门/出门（右侧门）: 画面右边缘, top≈28%, left≈85%
      */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>

        {/* 便签墙 → 便签墙页 */}
        <HotspotCard
          label="便签墙"
          sublabel={unreadNotes.length > 0 ? `${unreadNotes.length} 条未读` : undefined}
          onClick={() => navigateTo("stickyNotes")}
          zone={{ position: "absolute", top: "10%", left: "42%", width: "28%", height: "16%" }}
          position={{ top: "10%", left: "42%" }}
          cardAnchor="center"
        />

        {/* 书桌 → 我的手札 */}
        <HotspotCard
          label="我的手札"
          onClick={() => navigateTo("diary")}
          zone={{ position: "absolute", top: "44%", left: "30%", width: "36%", height: "18%" }}
          position={{ top: "44%", left: "30%" }}
          cardAnchor="center"
        />

        {/* 绿色书柜 → 我的档案 */}
        <HotspotCard
          label="我的档案"
          onClick={() => navigateTo("profileHome")}
          zone={{ position: "absolute", top: "12%", left: "68%", width: "20%", height: "30%" }}
          position={{ top: "12%", left: "68%" }}
          cardAnchor="center"
        />

        {/* 床 → 我的宝库 */}
        <HotspotCard
          label="我的宝库"
          onClick={() => navigateTo("treasure")}
          zone={{ position: "absolute", top: "38%", left: "0%", width: "30%", height: "26%" }}
          position={{ top: "38%", left: "0%" }}
          cardAnchor="left"
        />

        {/* 右侧门 → 出门（打开角色选择） */}
        <HotspotCard
          label="出门"
          sublabel={characters.length > 0 ? `${characters.length} 位在家` : ""}
          onClick={() => setShowCharSelect(true)}
          zone={{ position: "absolute", top: "0%", left: "86%", width: "14%", height: "52%" }}
          position={{ top: "0%", left: "86%" }}
          cardAnchor="right"
        />

        {/* 小家客厅入口卡 */}
        {onOpenGroupChat && (
          <div
            onClick={() => onOpenGroupChat(null)}
            style={{
              position: "absolute",
              bottom: recentNotes.length > 0 ? "calc(8px + env(safe-area-inset-bottom,0px) + 86px)" : "calc(8px + env(safe-area-inset-bottom,0px))",
              left: 12, right: 12,
              background: "rgba(255,255,255,.68)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 14,
              border: "1px solid rgba(196,166,184,.22)",
              boxShadow: "0 4px 16px rgba(74,69,96,.08)",
              padding: "9px 14px",
              cursor: "pointer", zIndex: 4,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>☕</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#5a4a6a", letterSpacing: 0.5 }}>小家客厅</div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 1 }}>
                {groupChats?.length > 0 ? `${groupChats.length} 个客厅 · 点击进入` : "把他们叫到一起聊聊"}
              </div>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>→</span>
          </div>
        )}

        {/* ── 便签墙预览条 ── */}
        {recentNotes.length > 0 && (
          <div
            onClick={() => navigateTo("stickyNotes")}
            style={{
              position: "absolute",
              bottom: "calc(8px + env(safe-area-inset-bottom,0px))",
              left: 12, right: 12,
              background: "rgba(255,255,255,.68)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 14,
              border: "1px solid rgba(196,166,184,.22)",
              boxShadow: "0 4px 16px rgba(74,69,96,.08)",
              padding: "9px 14px",
              cursor: "pointer", zIndex: 4,
            }}
          >
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom: 6,
            }}>
              <span style={{ fontSize:10, color:"#6a5a78", letterSpacing:1 }}>📝 便签墙</span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {unreadNotes.length > 0 && (
                  <span style={{
                    fontSize:10, color:"#9a5060",
                    background:"rgba(180,100,120,.12)",
                    padding:"1px 8px", borderRadius:8,
                    border:"1px solid rgba(180,100,120,.2)",
                  }}>{unreadNotes.length} 未读</span>
                )}
                <span style={{ fontSize:10, color:"var(--text-faint)" }}>查看全部 →</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {recentNotes.map(note => (
                <div key={note.id} style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                  <span style={{
                    fontSize:9, color:"#8a7898", flexShrink:0,
                    background:"rgba(196,166,184,.15)",
                    padding:"1px 6px", borderRadius:6,
                    maxWidth:52, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{note.authorName}</span>
                  <span style={{
                    fontSize:11, color: note.read ? "#9a8aac" : "#5a4a6a",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    flex:1, fontWeight: note.read ? 300 : 400,
                  }}>{note.content}</span>
                  {!note.read && (
                    <div style={{ width:5, height:5, borderRadius:"50%", background:"#c87898", flexShrink:0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 角色选择弹窗（出门后） ── */}
      {showCharSelect && (
        <div
          className="char-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCharSelect(false); }}
        >
          <div className="char-panel">
            <div className="char-panel-title">🚪 去哪儿？</div>
            {/* 客厅入口 */}
            {onOpenGroupChat && (
              <div
                onClick={() => { setShowCharSelect(false); onOpenGroupChat(null); }}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"11px 14px", marginBottom:8,
                  borderRadius:14, cursor:"pointer",
                  background:"rgba(120,100,160,.07)",
                  border:"1px dashed rgba(120,100,160,.22)",
                  transition:"all .15s",
                }}
              >
                <span style={{ fontSize:22 }}>☕</span>
                <div>
                  <div style={{ fontSize:13, color:"#5a4a6a", fontWeight:500 }}>小家客厅</div>
                  <div style={{ fontSize:11, color:"var(--text-faint)" }}>
                    {groupChats?.length > 0 ? `${groupChats.length} 个客厅` : "邀请大家一起聊"}
                  </div>
                </div>
              </div>
            )}
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
                onClick={() => enterChat(char.id)}
              >
                <Avatar char={char} size={42} radius={14} fontSize={20} />
                <div className="char-info">
                  <div className="char-name">{char.name || "未命名"}</div>
                  <div className="char-relation">{char.relation || ""}</div>
                </div>
                {openCharRoom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCharSelect(false);
                      openCharRoom(char.id);
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
                  >他的房间</button>
                )}
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
