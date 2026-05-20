// ─── 入口页 ───
// 欢迎回家。保留原版气质 + 支持自定义背景图。

import { useState } from "react";
import BgCustomizer from "../components/BgCustomizer";

const BG_KEY = "cyber-home-entrance-bg";

function loadBg() {
  try {
    const s = localStorage.getItem(BG_KEY);
    return s ? { dataUrl: null, opacity: 0.8, ...JSON.parse(s) } : { dataUrl: null, opacity: 0.8 };
  } catch {
    return { dataUrl: null, opacity: 0.8 };
  }
}

export default function EntrancePage({
  doorAnimating,
  enterBedroom,
  navigateTo,
  setShowMyProfile,
  userProfile,
  stickyNotes,
}) {
  const [bgConfig, setBgConfig] = useState(loadBg);

  const recentNotes = (stickyNotes || [])
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 2);
  const unreadCount = (stickyNotes || []).filter((n) => !n.read).length;

  return (
    <div
      className={`entrance ${doorAnimating ? "door-animating" : ""}`}
      style={{ position: "relative" }}
    >
      {/* ── 自定义背景图层 ── */}
      {bgConfig.dataUrl && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${bgConfig.dataUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgConfig.opacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 漂浮光点 */}
      <div className="float-dots">
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
      </div>

      {/* ── 顶栏：标题留白 + 右侧自定义按钮 ── */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
          paddingBottom: 8,
          paddingLeft: 16, paddingRight: 16,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          zIndex: 3,
        }}
      >
        <BgCustomizer
          storageKey={BG_KEY}
          bgConfig={bgConfig}
          onUpdate={setBgConfig}
        />
      </div>

      {/* ── 门牌卡片 ── */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 20,
            padding: "28px 36px 22px",
            border: "1px solid rgba(255,255,255,.5)",
            boxShadow: "0 8px 32px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04)",
            textAlign: "center",
            maxWidth: "80vw",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 6,
              color: "#5a4a6a",
              margin: 0,
              lineHeight: 1.5,
              whiteSpace: "pre-line",
            }}
          >
            赛博小家
          </h1>
          <div
            style={{
              width: 40, height: 1.5,
              background: "linear-gradient(90deg, transparent, #c4a6b8, transparent)",
              margin: "12px auto",
              borderRadius: 2,
            }}
          />
          <p
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "#8a7a8e",
              letterSpacing: 2,
              margin: 0,
              lineHeight: 1.6,
              whiteSpace: "pre-line",
            }}
          >
            欢迎回家{"\n"}这里是你最安全的地方
          </p>
        </div>
      </div>

      {/* ── 底部按钮区 ── */}
      <div
        style={{
          position: "absolute",
          bottom: recentNotes.length > 0 ? "calc(8% + 90px)" : "8%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          width: "100%",
          transition: "bottom .2s",
        }}
      >
        <button
          onClick={enterBedroom}
          style={{
            padding: "14px 52px",
            background: "rgba(255,255,255,.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,.6)",
            borderRadius: 28,
            color: "#5a4a6a",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: 5,
            cursor: "pointer",
            fontFamily: "var(--font-main)",
            boxShadow: "0 4px 20px rgba(0,0,0,.06)",
            transition: "all .3s",
          }}
        >
          推门进入
        </button>
        <button
          onClick={() => navigateTo("profiles")}
          style={{
            padding: "10px 36px",
            background: "rgba(255,255,255,.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.4)",
            borderRadius: 22,
            color: "#7a6a7e",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: 3,
            cursor: "pointer",
            fontFamily: "var(--font-main)",
            transition: "all .3s",
          }}
        >
          🏠 入住档案
        </button>
        <button
          onClick={() => setShowMyProfile(true)}
          style={{
            padding: "10px 36px",
            background: "rgba(255,255,255,.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.4)",
            borderRadius: 22,
            color: "#7a6a7e",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: 3,
            cursor: "pointer",
            fontFamily: "var(--font-main)",
            transition: "all .3s",
          }}
        >
          👤{" "}
          {userProfile?.globalFacts?.name
            ? `${userProfile.globalFacts.name}的档案`
            : "我的档案"}
        </button>
        <button
          onClick={() => navigateTo("config")}
          style={{
            padding: "8px 28px",
            background: "rgba(255,255,255,.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.3)",
            borderRadius: 18,
            color: "#9a8aac",
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: 2,
            cursor: "pointer",
            fontFamily: "var(--font-main)",
            transition: "all .3s",
          }}
        >
          🧠 大脑连接
        </button>
      </div>

      {/* ── 便签墙预览（有内容时出现在底部） ── */}
      {recentNotes.length > 0 && (
        <div
          onClick={() => navigateTo("stickyNotes")}
          style={{
            position: "absolute",
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            left: 16, right: 16,
            background: "rgba(255,255,255,.62)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 14,
            border: "1px solid rgba(196,166,184,.22)",
            boxShadow: "0 4px 16px rgba(74,69,96,.08)",
            padding: "10px 14px",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 5,
          }}>
            <span style={{ fontSize: 10, color: "#6a5a78", letterSpacing: 1 }}>
              📝 便签墙
            </span>
            <span style={{ fontSize: 10, color: unreadCount > 0 ? "#9a5060" : "var(--text-faint)" }}>
              {unreadCount > 0 ? `${unreadCount} 未读 →` : "查看全部 →"}
            </span>
          </div>
          {recentNotes.map((n) => (
            <div
              key={n.id}
              style={{
                fontSize: 11,
                color: n.read ? "#9a8aac" : "#5a4a6a",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                lineHeight: 1.9,
              }}
            >
              <span style={{ fontSize: 9, color: "#9a8aac", marginRight: 5 }}>
                {n.authorName}
              </span>
              {n.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
