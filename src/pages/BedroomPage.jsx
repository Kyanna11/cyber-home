// ─── 卧室页（房间场景版）───
// 温馨房间场景，物件即入口，半显式热点。
// 保留所有现有功能：选角色弹窗、群聊、便签预览。

import { useState } from "react";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

// ── 房间物件热点 ──
function RoomObject({ emoji, label, sublabel, onClick, glowColor = "rgba(180,140,220,.7)", style }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setPressed(true)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        transition: "transform .18s",
        transform: pressed ? "scale(1.08)" : "scale(1)",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
    >
      {/* 物件主体 */}
      <div
        style={{
          fontSize: 36,
          lineHeight: 1,
          filter: pressed
            ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 2px 6px rgba(0,0,0,.15))`
            : "drop-shadow(0 2px 8px rgba(80,60,100,.18))",
          transition: "filter .18s",
        }}
      >
        {emoji}
      </div>
      {/* 标签牌 */}
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.5,
          color: pressed ? "#5a3a7a" : "#7a6a90",
          background: pressed
            ? "rgba(255,255,255,.92)"
            : "rgba(255,255,255,.72)",
          padding: "3px 9px",
          borderRadius: 8,
          border: pressed
            ? "1px solid rgba(160,120,220,.35)"
            : "1px solid rgba(200,180,220,.25)",
          fontFamily: "var(--font-main)",
          whiteSpace: "nowrap",
          boxShadow: pressed
            ? "0 2px 8px rgba(140,100,200,.18)"
            : "0 1px 4px rgba(100,80,140,.08)",
          transition: "all .18s",
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: 9,
            color: "rgba(140,120,165,.55)",
            letterSpacing: 0.5,
            marginTop: -2,
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default function BedroomPage({
  navigateTo,
  hoveredItem,       // 保留但不用（内部管理）
  setHoveredItem,    // 保留但不用
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
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        // 房间背景：天花板 → 墙面 → 地板
        background:
          "linear-gradient(180deg, #e8e0f0 0%, #ede5f2 12%, #ede8f4 52%, #e2d8ec 58%, #d8ceea 100%)",
      }}
    >
      {/* ── 顶栏 ── */}
      <div
        style={{
          padding: "calc(14px + env(safe-area-inset-top, 0px)) 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 5,
          background: "rgba(240,235,248,.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(200,180,220,.2)",
          flexShrink: 0,
        }}
      >
        <BackButton onClick={() => navigateTo("entrance")} label="首页" />
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: 3,
            color: "#7a6a90",
            fontFamily: "var(--font-main)",
          }}
        >
          我的房间
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {onOpenGroupChat && (
            <button
              onClick={() => onOpenGroupChat(null)}
              title="小家客厅"
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                lineHeight: 1,
                opacity: 0.65,
              }}
            >
              ☕
            </button>
          )}
          <button
            onClick={() => navigateTo("profiles")}
            title="入住档案"
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              lineHeight: 1,
              opacity: 0.65,
            }}
          >
            📋
          </button>
        </div>
      </div>

      {/* ── 房间场景主体 ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* 墙面装饰：踢脚线 */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 3,
            background:
              "linear-gradient(90deg, rgba(210,195,230,.4), rgba(220,205,235,.7), rgba(210,195,230,.4))",
          }}
        />

        {/* 墙面区域：左侧窗户（装饰） */}
        <div
          style={{
            position: "absolute",
            top: "6%",
            left: "5%",
            width: "22%",
            maxWidth: 90,
            aspectRatio: "3/4",
          }}
        >
          {/* 窗框 */}
          <div
            style={{
              width: "100%",
              height: "100%",
              border: "2px solid rgba(180,160,210,.45)",
              borderRadius: 4,
              background: "linear-gradient(135deg, rgba(200,220,255,.35), rgba(180,210,240,.25))",
              boxShadow:
                "inset 0 0 16px rgba(200,220,255,.2), 0 4px 12px rgba(140,120,180,.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 窗格 */}
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(180,160,210,.4)" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(180,160,210,.4)" }} />
            {/* 晨光 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at 40% 30%, rgba(255,240,200,.25), transparent 60%)",
                animation: "windowGlow 4s ease-in-out infinite alternate",
              }}
            />
          </div>
          {/* 窗台 */}
          <div
            style={{
              height: 6,
              background: "rgba(210,195,230,.6)",
              borderRadius: "0 0 3px 3px",
              marginTop: -1,
              boxShadow: "0 2px 4px rgba(140,120,170,.1)",
            }}
          />
        </div>

        {/* ── 墙面物件区（上半部分） ── */}
        <div
          style={{
            position: "absolute",
            top: "6%",
            right: "4%",
            left: "32%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-around",
            paddingTop: "2%",
          }}
        >
          {/* 档案柜 → 我的档案 */}
          <RoomObject
            emoji="🗂️"
            label="我的档案"
            glowColor="rgba(140,120,220,.8)"
            onClick={() => navigateTo("profileHome")}
          />

          {/* 便签板 → 便签墙 */}
          <div style={{ position: "relative" }}>
            <RoomObject
              emoji="📌"
              label="便签墙"
              sublabel={unreadNotes.length > 0 ? `${unreadNotes.length} 未读` : undefined}
              glowColor="rgba(220,160,140,.8)"
              onClick={() => navigateTo("stickyNotes")}
            />
          </div>

          {/* 门 → 去找入住者 */}
          <RoomObject
            emoji="🚪"
            label="去找 ta"
            sublabel={characters.length > 0 ? `${characters.length} 位入住者` : "还没有人"}
            glowColor="rgba(180,200,140,.8)"
            onClick={() => setShowCharSelect(true)}
          />
        </div>

        {/* ── 地板物件区（下半部分） ── */}
        <div
          style={{
            position: "absolute",
            bottom: recentNotes.length > 0 ? "calc(15% + 68px)" : "15%",
            left: "4%",
            right: "4%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            transition: "bottom .2s",
          }}
        >
          {/* 宝箱 → 我的宝库 */}
          <RoomObject
            emoji="💎"
            label="我的宝库"
            glowColor="rgba(220,180,100,.9)"
            onClick={() => navigateTo("treasure")}
          />

          {/* 日记本桌 → 我的手札 */}
          <RoomObject
            emoji="📓"
            label="我的手札"
            glowColor="rgba(180,140,220,.8)"
            onClick={() => navigateTo("diary")}
            style={{ transform: "scale(1.12)" }}  // 略大，居中感
          />

          {/* 脑子/发光装置 → 大脑连接 */}
          <RoomObject
            emoji="🧠"
            label="大脑连接"
            glowColor="rgba(120,200,220,.9)"
            onClick={() => navigateTo("config")}
          />
        </div>

        {/* ── 便签墙预览条 ── */}
        {recentNotes.length > 0 && (
          <div
            onClick={() => navigateTo("stickyNotes")}
            style={{
              position: "absolute",
              bottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
              left: 12,
              right: 12,
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 14,
              border: "1px solid rgba(196,166,184,.22)",
              boxShadow: "0 4px 16px rgba(74,69,96,.08)",
              padding: "9px 14px",
              zIndex: 4,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 10, color: "#6a5a78", letterSpacing: 1 }}>
                📝 便签墙
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {unreadNotes.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#9a5060",
                      background: "rgba(180,100,120,.12)",
                      padding: "1px 8px",
                      borderRadius: 8,
                      border: "1px solid rgba(180,100,120,.2)",
                    }}
                  >
                    {unreadNotes.length} 未读
                  </span>
                )}
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                  查看全部 →
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: "#8a7898",
                      flexShrink: 0,
                      background: "rgba(196,166,184,.15)",
                      padding: "1px 6px",
                      borderRadius: 6,
                      maxWidth: 52,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {note.authorName}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: note.read ? "#9a8aac" : "#5a4a6a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontWeight: note.read ? 300 : 400,
                    }}
                  >
                    {note.content}
                  </span>
                  {!note.read && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#c87898",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 角色选择弹窗（保持原有） ── */}
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
                {openCharRoom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCharSelect(false);
                      openCharRoom(char.id);
                    }}
                    style={{
                      flexShrink: 0,
                      marginLeft: 4,
                      padding: "4px 10px",
                      borderRadius: 10,
                      background: "rgba(120,100,160,.1)",
                      border: "1px solid rgba(120,100,160,.2)",
                      color: "#6a5a8a",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "var(--font-main)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    他的房间
                  </button>
                )}
              </div>
            ))}
            {/* 客厅入口 */}
            {onOpenGroupChat && (
              <div
                onClick={() => {
                  setShowCharSelect(false);
                  onOpenGroupChat(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  margin: "8px 0 4px",
                  borderRadius: 14,
                  cursor: "pointer",
                  background: "rgba(120,100,160,.07)",
                  border: "1px dashed rgba(120,100,160,.22)",
                  transition: "all .15s",
                }}
              >
                <span style={{ fontSize: 22 }}>☕</span>
                <div>
                  <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>
                    小家客厅
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                    {groupChats?.length > 0
                      ? `${groupChats.length} 个客厅`
                      : "邀请大家一起聊"}
                  </div>
                </div>
              </div>
            )}
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
