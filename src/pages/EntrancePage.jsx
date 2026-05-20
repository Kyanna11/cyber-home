// ─── 入口页（花园/小路/房子场景版）───
// 首页是小家的外部空间，不是功能列表。
// 场景：黄昏/夜晚，花园小路尽头是家。主入口 = 点击房子/门区域。

import { useState } from "react";

// 几颗静态星星
const STARS = [
  { top: "6%",  left: "12%",  size: 2,   opacity: 0.6 },
  { top: "11%", left: "34%",  size: 1.5, opacity: 0.4 },
  { top: "5%",  left: "58%",  size: 2.5, opacity: 0.7 },
  { top: "14%", left: "76%",  size: 1.5, opacity: 0.45 },
  { top: "8%",  left: "88%",  size: 2,   opacity: 0.55 },
  { top: "18%", left: "22%",  size: 1.5, opacity: 0.35 },
  { top: "3%",  left: "45%",  size: 1,   opacity: 0.5 },
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

  const recentNotes = (stickyNotes || [])
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 2);
  const unreadCount = (stickyNotes || []).filter((n) => !n.read).length;

  return (
    <div
      className={doorAnimating ? "door-animating" : ""}
      style={{
        height: "100dvh",
        position: "relative",
        overflow: "hidden",
        // 黄昏→夜晚渐变：顶部深夜紫 → 中部暮色玫瑰 → 底部暖橙地平线
        background:
          "linear-gradient(180deg, #0d0b1c 0%, #1a1235 18%, #362054 38%, #6b3a6a 58%, #a05a72 74%, #c8806a 86%, #e8b888 100%)",
      }}
    >
      {/* ── 漂浮微粒（复用） ── */}
      <div className="float-dots">
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
      </div>

      {/* ── 星星 ── */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#f0e8ff",
            opacity: s.opacity,
            boxShadow: `0 0 ${s.size * 3}px rgba(240,232,255,.6)`,
          }}
        />
      ))}

      {/* ── 月亮 ── */}
      <div
        style={{
          position: "absolute",
          top: "7%",
          right: "15%",
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "radial-gradient(circle at 38% 38%, #f8edcc, #e8c888)",
          boxShadow:
            "0 0 16px rgba(248,220,140,.5), 0 0 40px rgba(248,220,140,.18)",
          opacity: 0.9,
        }}
      />

      {/* ── 地面 ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background:
            "linear-gradient(180deg, #1a1030 0%, #0e0a1e 100%)",
        }}
      />

      {/* ── 草地轮廓（地面与天空之间） ── */}
      <div
        style={{
          position: "absolute",
          bottom: "28%",
          left: 0,
          right: 0,
          height: 28,
          background:
            "radial-gradient(ellipse 120% 100% at 50% 100%, #1e2a18 0%, transparent 70%)",
          opacity: 0.7,
        }}
      />

      {/* ── 小路（梯形透视） ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          height: "62%",
          clipPath: "polygon(42% 0%, 58% 0%, 76% 100%, 24% 100%)",
          background:
            "linear-gradient(180deg, rgba(238,218,178,.06) 0%, rgba(238,218,178,.22) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── 房子 + 主点击区域 ── */}
      <div
        onClick={enterBedroom}
        onMouseEnter={() => setDoorHover(true)}
        onMouseLeave={() => setDoorHover(false)}
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "transform .3s",
          ...(doorHover ? { transform: "translateX(-50%) scale(1.03)" } : {}),
        }}
      >
        {/* 房子光晕 */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 260,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(180,120,220,.18) 0%, transparent 65%)",
            pointerEvents: "none",
            transition: "opacity .3s",
            opacity: doorHover ? 1 : 0.5,
          }}
        />

        {/* 屋顶 */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "88px solid transparent",
            borderRight: "88px solid transparent",
            borderBottom: "62px solid #1b1230",
            filter: "drop-shadow(0 -3px 10px rgba(150,90,200,.25))",
          }}
        />

        {/* 烟囱 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: "calc(50% - 72px)",
            width: 18,
            height: 28,
            background: "#16102a",
            marginTop: -14,
          }}
        />

        {/* 房体 */}
        <div
          style={{
            width: 158,
            height: 98,
            background: "linear-gradient(180deg, #1e1438 0%, #1a1030 100%)",
            position: "relative",
            borderRadius: "0 0 3px 3px",
          }}
        >
          {/* 左窗 */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 20,
              width: 30,
              height: 28,
              background: "rgba(255,215,120,.5)",
              borderRadius: 3,
              boxShadow:
                "0 0 14px rgba(255,200,80,.55), 0 0 32px rgba(255,200,80,.2)",
              border: "1px solid rgba(255,220,140,.3)",
            }}
          >
            {/* 窗格十字 */}
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(180,140,60,.4)" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(180,140,60,.4)" }} />
          </div>

          {/* 右窗 */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              width: 30,
              height: 28,
              background: "rgba(255,215,120,.5)",
              borderRadius: 3,
              boxShadow:
                "0 0 14px rgba(255,200,80,.55), 0 0 32px rgba(255,200,80,.2)",
              border: "1px solid rgba(255,220,140,.3)",
            }}
          >
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(180,140,60,.4)" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(180,140,60,.4)" }} />
          </div>

          {/* 门 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 32,
              height: 54,
              background:
                "linear-gradient(180deg, #4a2860 0%, #321a48 100%)",
              borderRadius: "50% 50% 0 0 / 28% 28% 0 0",
              boxShadow: doorHover
                ? "0 0 24px rgba(190,140,255,.8), 0 0 50px rgba(190,140,255,.35)"
                : "0 0 14px rgba(180,120,240,.5), 0 0 28px rgba(180,120,240,.2)",
              border: "1px solid rgba(210,170,255,.35)",
              transition: "box-shadow .3s",
            }}
          >
            {/* 门内光 */}
            <div
              style={{
                position: "absolute",
                inset: 3,
                borderRadius: "50% 50% 0 0 / 28% 28% 0 0",
                background: "rgba(210,170,255,.15)",
              }}
            />
            {/* 门把手 */}
            <div
              style={{
                position: "absolute",
                right: 6,
                top: "55%",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "rgba(255,220,140,.7)",
                boxShadow: "0 0 4px rgba(255,200,80,.8)",
              }}
            />
          </div>
        </div>

        {/* "推门进入"标签 */}
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            letterSpacing: 5,
            color: doorHover
              ? "rgba(240,220,255,.95)"
              : "rgba(220,200,240,.65)",
            textShadow: doorHover
              ? "0 0 16px rgba(200,150,255,.8)"
              : "0 0 8px rgba(180,130,220,.4)",
            fontFamily: "var(--font-main)",
            fontWeight: 300,
            transition: "color .3s, text-shadow .3s",
          }}
        >
          推门进入
        </div>
      </div>

      {/* ── 顶栏：标题 + 次要入口 ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: "calc(14px + env(safe-area-inset-top, 0px))",
          paddingBottom: 12,
          paddingLeft: 18,
          paddingRight: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: "rgba(220,200,245,.38)",
            fontFamily: "var(--font-main)",
            fontWeight: 300,
            marginTop: 2,
          }}
        >
          赛博小家
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => navigateTo("profiles")}
            title="入住档案"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 10,
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: 13,
              color: "rgba(220,200,245,.55)",
              fontFamily: "var(--font-main)",
              letterSpacing: 1,
              fontSize: 11,
              transition: "all .2s",
            }}
          >
            🏠 档案
          </button>
          <button
            onClick={() => setShowMyProfile(true)}
            title="我的档案"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 10,
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: 11,
              color: "rgba(220,200,245,.55)",
              fontFamily: "var(--font-main)",
              letterSpacing: 1,
              transition: "all .2s",
            }}
          >
            👤 {userProfile?.globalFacts?.name
              ? `${userProfile.globalFacts.name}`
              : "我的档案"}
          </button>
          <button
            onClick={() => navigateTo("config")}
            title="大脑连接"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 10,
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: 11,
              color: "rgba(220,200,245,.55)",
              fontFamily: "var(--font-main)",
              letterSpacing: 1,
              transition: "all .2s",
            }}
          >
            🧠
          </button>
        </div>
      </div>

      {/* ── 底部便签预览 ── */}
      {recentNotes.length > 0 && (
        <div
          onClick={() => navigateTo("stickyNotes")}
          style={{
            position: "absolute",
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            left: 16,
            right: 16,
            background: "rgba(15,10,28,.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: 14,
            border: "1px solid rgba(200,170,240,.14)",
            padding: "10px 14px",
            cursor: "pointer",
            zIndex: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "rgba(200,180,230,.45)",
                letterSpacing: 1.5,
              }}
            >
              📝 便签墙
            </span>
            <span
              style={{
                fontSize: 10,
                color: unreadCount > 0
                  ? "rgba(210,160,200,.6)"
                  : "rgba(180,160,210,.35)",
              }}
            >
              {unreadCount > 0 ? `${unreadCount} 未读 →` : "查看全部 →"}
            </span>
          </div>
          {recentNotes.map((n) => (
            <div
              key={n.id}
              style={{
                fontSize: 11,
                color: n.read
                  ? "rgba(190,175,215,.35)"
                  : "rgba(215,200,235,.65)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.9,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(180,160,210,.4)",
                  marginRight: 5,
                }}
              >
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
