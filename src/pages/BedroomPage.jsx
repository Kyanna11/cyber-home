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
  // 便签墙
  stickyNotes,
  // 群聊
  onOpenGroupChat,
  groupChats,
  // 他的房间
  openCharRoom,
}) {
  const unreadNotes = (stickyNotes || []).filter((n) => !n.read);
  const recentNotes = (stickyNotes || [])
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
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
        <BackButton onClick={() => navigateTo("entrance")} label="首页" />
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
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {onOpenGroupChat && (
            <button
              onClick={() => onOpenGroupChat(null)}
              title="小家客厅"
              style={{
                background: "none", border: "none",
                fontSize: 18, cursor: "pointer",
                padding: 6, borderRadius: 8, lineHeight: 1,
              }}
            >
              ☕
            </button>
          )}
          <button
            onClick={() => navigateTo("profiles")}
            style={{
              background: "none", border: "none",
              fontSize: 18, cursor: "pointer",
              padding: 6, borderRadius: 8, lineHeight: 1,
            }}
          >
            📋
          </button>
        </div>
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

        {/* 便签墙热区（左上角墙面） */}
        <div
          onClick={() => navigateTo("stickyNotes")}
          onMouseEnter={() => setHoveredItem("stickyNotes")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            position: "absolute",
            left: "4%",
            top: "8%",
            width: "26%",
            height: "40%",
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
        {hoveredItem === "stickyNotes" && (
          <div
            style={{
              position: "absolute",
              left: "6%",
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
            📝 便签墙
            {unreadNotes.length > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10,
                background: "rgba(180,100,120,.15)",
                color: "#9a5060", padding: "1px 6px", borderRadius: 8,
              }}>{unreadNotes.length} 未读</span>
            )}
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

        {/* ── 便签墙预览条 ── */}
        {recentNotes.length > 0 && (
          <div
            onClick={() => navigateTo("stickyNotes")}
            style={{
              position: "absolute",
              bottom: 12, left: 12, right: 12,
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
              borderRadius: 14,
              border: "1px solid rgba(196,166,184,.22)",
              boxShadow: "0 4px 16px rgba(74,69,96,.1)",
              padding: "10px 14px",
              zIndex: 4,
              cursor: "pointer",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 11, color: "#6a5a78", letterSpacing: 1 }}>
                📝 便签墙
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {unreadNotes.length > 0 && (
                  <span style={{
                    fontSize: 10, color: "#9a5060",
                    background: "rgba(180,100,120,.12)",
                    padding: "1px 8px", borderRadius: 8,
                    border: "1px solid rgba(180,100,120,.2)",
                  }}>{unreadNotes.length} 未读</span>
                )}
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>查看全部 →</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {recentNotes.map((note) => (
                <div key={note.id} style={{
                  display: "flex", alignItems: "baseline", gap: 8,
                }}>
                  <span style={{
                    fontSize: 9, color: "#8a7898", flexShrink: 0,
                    background: "rgba(196,166,184,.15)",
                    padding: "1px 6px", borderRadius: 6,
                    maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{note.authorName}</span>
                  <span style={{
                    fontSize: 11, color: note.read ? "#9a8aac" : "#5a4a6a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1,
                    fontWeight: note.read ? 300 : 400,
                  }}>{note.content}</span>
                  {!note.read && (
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "#c87898", flexShrink: 0,
                    }} />
                  )}
                </div>
              ))}
            </div>
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
                {openCharRoom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCharSelect(false);
                      openCharRoom(char.id);
                    }}
                    style={{
                      flexShrink: 0, marginLeft: 4,
                      padding: "4px 10px", borderRadius: 10,
                      background: "rgba(120,100,160,.1)",
                      border: "1px solid rgba(120,100,160,.2)",
                      color: "#6a5a8a", fontSize: 11,
                      cursor: "pointer", fontFamily: "var(--font-main)",
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
                onClick={() => { setShowCharSelect(false); onOpenGroupChat(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", margin: "8px 0 4px",
                  borderRadius: 14, cursor: "pointer",
                  background: "rgba(120,100,160,.07)",
                  border: "1px dashed rgba(120,100,160,.22)",
                  transition: "all .15s",
                }}
              >
                <span style={{ fontSize: 22 }}>☕</span>
                <div>
                  <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>小家客厅</div>
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
