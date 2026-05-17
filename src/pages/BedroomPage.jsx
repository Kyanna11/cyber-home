// ─── 卧室页 ───
// 有日记本和门两个热区，点门可以选择去找谁

import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

export default function BedroomPage({
  navigateTo,
  hoveredItem,
  setHoveredItem,
  showCharSelect,
  setShowCharSelect,
  characters,
  enterChat,
}) {
  return (
    <div className="bedroom">
      {/* 顶栏 */}
      <div
        style={{
          padding: "calc(16px + env(safe-area-inset-top, 0px)) 20px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
          background: "rgba(0,0,0,.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        <BackButton onClick={() => setPage("entrance")} label="首页" />
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: 3,
            color: "rgba(255,255,255,.9)",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            textShadow: "0 1px 6px rgba(0,0,0,.2)",
          }}
        >
          我的小房间
        </div>
        <button
          onClick={() => navigateTo("profiles")}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            padding: 6,
            borderRadius: 8,
            lineHeight: 1,
          }}
        >
          📋
        </button>
      </div>

      {/* 房间场景 - 背景图 + 热区 */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* 日记本热区 */}
        <div
          onClick={() => navigateTo("diary")}
          onMouseEnter={() => setHoveredItem("diary")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            position: "absolute",
            right: "8%",
            top: "55%",
            width: "30%",
            height: "15%",
            cursor: "pointer",
            zIndex: 3,
            borderRadius: 8,
          }}
        />

        {/* 宝库热区（书桌左侧） */}
        <div
          onClick={() => navigateTo("treasure")}
          onMouseEnter={() => setHoveredItem("treasure")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            position: "absolute",
            left: "6%",
            top: "55%",
            width: "26%",
            height: "15%",
            cursor: "pointer",
            zIndex: 3,
            borderRadius: 8,
          }}
        />

        {/* 门热区 */}
        <div
          onClick={() => setShowCharSelect(true)}
          onMouseEnter={() => setHoveredItem("door")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            position: "absolute",
            right: "5%",
            top: "8%",
            width: "22%",
            height: "42%",
            cursor: "pointer",
            zIndex: 3,
            borderRadius: 8,
          }}
        />

        {/* 悬停提示 */}
        {hoveredItem === "diary" && (
          <div
            style={{
              position: "absolute",
              right: "15%",
              top: "50%",
              background: "rgba(255,255,255,.85)",
              backdropFilter: "blur(8px)",
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-deep)",
              letterSpacing: 1.5,
              boxShadow: "0 4px 16px rgba(74,69,96,.12)",
              border: "1px solid rgba(232,196,196,.2)",
              zIndex: 5,
              pointerEvents: "none",
              animation: "tooltipIn .25s ease-out",
            }}
          >
            📓 我的手札
          </div>
        )}
        {hoveredItem === "treasure" && (
          <div
            style={{
              position: "absolute",
              left: "8%",
              top: "50%",
              background: "rgba(255,255,255,.85)",
              backdropFilter: "blur(8px)",
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-deep)",
              letterSpacing: 1.5,
              boxShadow: "0 4px 16px rgba(74,69,96,.12)",
              border: "1px solid rgba(232,196,196,.2)",
              zIndex: 5,
              pointerEvents: "none",
              animation: "tooltipIn .25s ease-out",
            }}
          >
            💎 我的宝库
          </div>
        )}
        {hoveredItem === "door" && (
          <div
            style={{
              position: "absolute",
              right: "10%",
              top: "5%",
              background: "rgba(255,255,255,.85)",
              backdropFilter: "blur(8px)",
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-deep)",
              letterSpacing: 1.5,
              boxShadow: "0 4px 16px rgba(74,69,96,.12)",
              border: "1px solid rgba(232,196,196,.2)",
              zIndex: 5,
              pointerEvents: "none",
              animation: "tooltipIn .25s ease-out",
            }}
          >
            🚪 去找 ta
          </div>
        )}
      </div>

      {/* 角色选择弹窗 */}
      {showCharSelect && (
        <div
          className="char-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCharSelect(false);
          }}
        >
          <div className="char-panel">
            <div className="char-panel-title">🚪 去谁的房间？</div>
            {characters.length === 0 && (
              <div
                style={{
                  padding: "16px 0",
                  color: "var(--text-faint)",
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                家里还没有人呢
                <br />
                回首页的「成员档案」先添加一位吧
              </div>
            )}
            {characters.map((char) => (
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
              </div>
            ))}
            <button
              className="char-close"
              onClick={() => setShowCharSelect(false)}
            >
              还是回房间吧
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
