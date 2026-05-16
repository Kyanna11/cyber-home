// ─── 入口页 ───
// 就是最开始那个"推门进入"的欢迎页面

export default function EntrancePage({
  doorAnimating,
  enterBedroom,
  navigateTo,
  setShowMyProfile,
  userProfile,
}) {
  return (
    <div className={`entrance ${doorAnimating ? "door-animating" : ""}`}>
      {/* 漂浮小光点 */}
      <div className="float-dots">
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
        <div className="float-dot" />
      </div>

      {/* 门牌卡片 */}
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
              marginBottom: 10,
              margin: 0,
            }}
          >
            晚声的{"\n"}赛博小家
          </h1>
          <div
            style={{
              width: 40,
              height: 1.5,
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
            }}
          >
            欢迎回家{"\n"}这里是你最安全的地方
          </p>
        </div>
      </div>

      {/* 底部按钮区 */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          width: "100%",
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
          {userProfile.globalFacts.name
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
    </div>
  );
}
