// ─── 入口页 ───
// 背景：花园/门口插画（public/entrance-bg.jpg）
// 主入口：门区域点击 → 推门进入，带闪光动效
// 底部一排：其他次要入口

import { useState } from "react";

// 闪光粒子配置
const SPARKS = [
  { dx: -28, dy: -32, rotate: 15,  size: 6, delay: 0    },
  { dx:  32, dy: -24, rotate: -20, size: 5, delay: 0.08 },
  { dx: -38, dy:   8, rotate: 40,  size: 4, delay: 0.04 },
  { dx:  40, dy:  12, rotate: -35, size: 5, delay: 0.12 },
  { dx:   8, dy: -42, rotate: 5,   size: 4, delay: 0.1  },
  { dx: -12, dy:  36, rotate: -10, size: 6, delay: 0.06 },
];

export default function EntrancePage({
  doorAnimating,
  enterBedroom,
  navigateTo,
  setShowMyProfile,
  userProfile,
  stickyNotes,
}) {
  const [doorHover, setDoorHover] = useState(false);
  const [showSparks, setShowSparks] = useState(false);

  // 点击门时触发闪光
  const handleDoorClick = () => {
    setShowSparks(true);
    setTimeout(() => setShowSparks(false), 800);
    enterBedroom();
  };

  const recentNotes = (stickyNotes || [])
    .slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
  const unreadCount = (stickyNotes || []).filter((n) => !n.read).length;

  return (
    <div
      className={`entrance ${doorAnimating ? "door-animating" : ""}`}
      style={{ position: "relative" }}
    >
      {/* 漂浮光点 */}
      <div className="float-dots">
        {[1,2,3,4,5].map(i => <div key={i} className="float-dot" />)}
      </div>


      {/* ── 门区域：点击主入口 ── */}
      {/* 基于花园图：门位于水平居中、垂直 24%-63% */}
      <div
        onClick={handleDoorClick}
        onMouseEnter={() => setDoorHover(true)}
        onMouseLeave={() => setDoorHover(false)}
        style={{
          position: "absolute",
          top: "24%", left: "22%",
          width: "56%", height: "40%",
          cursor: "pointer",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "4%",
        }}
      >
        {/* 门光晕 */}
        <div style={{
          position: "absolute", inset: "10% 8%",
          borderRadius: "8px",
          background: doorHover
            ? "rgba(200,180,240,.18)"
            : "rgba(200,180,240,.06)",
          boxShadow: doorHover
            ? "0 0 30px rgba(180,150,220,.35), inset 0 0 20px rgba(200,180,240,.1)"
            : "0 0 16px rgba(180,150,220,.12)",
          transition: "all .4s",
          pointerEvents: "none",
          animation: "doorPulse 3.5s ease-in-out infinite",
        }} />

        {/* 赛博小家 卡片 */}
        <div style={{
          background: "rgba(255,255,255,.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,.65)",
          borderRadius: 14,
          padding: "10px 22px 8px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(74,69,96,.1)",
          pointerEvents: "none",
          marginTop: "16%",
        }}>
          <div style={{
            fontSize: 16, fontWeight: 600, letterSpacing: 5,
            color: "#5a4a6a", fontFamily: "var(--font-main)", lineHeight: 1.4,
          }}>
            赛博小家
          </div>
          <div style={{
            width: 28, height: 1,
            background: "linear-gradient(90deg,transparent,#c4a6b8,transparent)",
            margin: "6px auto 4px",
          }} />
          <div style={{
            fontSize: 10, color: "#9a8aac", letterSpacing: 2,
            fontFamily: "var(--font-main)",
          }}>
            欢迎回家
          </div>
        </div>

        {/* 推门进入 */}
        <div style={{
          marginTop: "auto",
          marginBottom: "18%",
          fontSize: 12,
          letterSpacing: 5,
          fontFamily: "var(--font-main)",
          fontWeight: 400,
          color: doorHover ? "rgba(80,60,110,.9)" : "rgba(100,80,130,.65)",
          textShadow: doorHover
            ? "0 0 12px rgba(180,150,220,.6)"
            : "none",
          background: "rgba(255,255,255,.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "6px 18px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.6)",
          transition: "all .3s",
          pointerEvents: "none",
        }}>
          推门进入
        </div>

        {/* 闪光粒子 */}
        {showSparks && (
          <>
            {/* 光环 */}
            <div className="door-anim-ring" style={{ left: "50%", top: "55%" }} />
            {/* 星点 */}
            {SPARKS.map((s, i) => (
              <div
                key={i}
                className="door-anim-spark"
                style={{
                  left: `calc(50% + ${s.dx}px)`,
                  top: `calc(55% + ${s.dy}px)`,
                  width: s.size, height: s.size,
                  borderRadius: "50%",
                  background: i % 2 === 0
                    ? "rgba(200,170,240,.9)"
                    : "rgba(240,200,180,.9)",
                  animationDelay: `${s.delay}s`,
                  boxShadow: `0 0 ${s.size * 2}px rgba(200,160,240,.8)`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* ── 底部其他入口（一排小胶囊） ── */}
      <div style={{
        position: "absolute",
        bottom: recentNotes.length > 0
          ? "calc(10px + env(safe-area-inset-bottom,0px) + 76px)"
          : "calc(16px + env(safe-area-inset-bottom,0px))",
        left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 8,
        zIndex: 4,
        transition: "bottom .2s",
      }}>
        {[
          { label: "入住档案", icon: "🏠", onClick: () => navigateTo("profiles") },
          {
            label: userProfile?.globalFacts?.name || "我的档案",
            icon: "👤",
            onClick: () => setShowMyProfile(true),
          },
          { label: "大脑连接", icon: "🧠", onClick: () => navigateTo("config") },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            style={{
              padding: "7px 13px",
              background: "rgba(255,255,255,.58)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,.55)",
              borderRadius: 20,
              color: "#6a5a7a",
              fontSize: 11,
              letterSpacing: 1,
              cursor: "pointer",
              fontFamily: "var(--font-main)",
              boxShadow: "0 2px 10px rgba(74,69,96,.08)",
              display: "flex", alignItems: "center", gap: 4,
              transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 13 }}>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── 便签墙预览 ── */}
      {recentNotes.length > 0 && (
        <div
          onClick={() => navigateTo("stickyNotes")}
          style={{
            position: "absolute",
            bottom: "calc(10px + env(safe-area-inset-bottom,0px))",
            left: 14, right: 14,
            background: "rgba(255,255,255,.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 14,
            border: "1px solid rgba(196,166,184,.22)",
            boxShadow: "0 4px 16px rgba(74,69,96,.08)",
            padding: "9px 14px",
            cursor: "pointer", zIndex: 4,
          }}
        >
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:10, color:"#6a5a78", letterSpacing:1 }}>📝 便签墙</span>
            <span style={{ fontSize:10, color: unreadCount > 0 ? "#9a5060" : "var(--text-faint)" }}>
              {unreadCount > 0 ? `${unreadCount} 未读 →` : "查看全部 →"}
            </span>
          </div>
          {recentNotes.map(n => (
            <div key={n.id} style={{
              fontSize:11, color: n.read ? "#9a8aac" : "#5a4a6a",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              lineHeight:1.8,
            }}>
              <span style={{ fontSize:9, color:"#9a8aac", marginRight:5 }}>{n.authorName}</span>
              {n.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
