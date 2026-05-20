// ─── 卧室页 ───
// 房间场景。背景可自定义。功能入口用毛玻璃文字卡片，整齐排列。

import { useState } from "react";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";
import BgCustomizer from "../components/BgCustomizer";

const BG_KEY = "cyber-home-bedroom-bg";

function loadBg() {
  try {
    const s = localStorage.getItem(BG_KEY);
    return s ? { dataUrl: null, opacity: 0.8, ...JSON.parse(s) } : { dataUrl: null, opacity: 0.8 };
  } catch {
    return { dataUrl: null, opacity: 0.8 };
  }
}

// ── 毛玻璃入口卡片 ──
function GlassCard({ label, sublabel, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: pressed
          ? "rgba(255,255,255,.78)"
          : "rgba(255,255,255,.58)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: pressed
          ? "1px solid rgba(196,166,184,.45)"
          : "1px solid rgba(255,255,255,.55)",
        borderRadius: 16,
        padding: "16px 10px 14px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all .15s",
        transform: pressed ? "scale(.97)" : "scale(1)",
        boxShadow: pressed
          ? "0 2px 12px rgba(74,69,96,.12)"
          : "0 4px 16px rgba(74,69,96,.07)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        minHeight: 72,
      }}
    >
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        color: "#4a3a5e",
        letterSpacing: 2,
        fontFamily: "var(--font-main)",
      }}>
        {label}
      </div>
      {sublabel && (
        <div style={{
          fontSize: 10,
          color: "var(--text-faint)",
          letterSpacing: 0.5,
          lineHeight: 1.4,
        }}>
          {sublabel}
        </div>
      )}
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
  const [bgConfig, setBgConfig] = useState(loadBg);

  const unreadNotes = (stickyNotes || []).filter((n) => !n.read);
  const recentNotes = (stickyNotes || [])
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div
      className="bedroom"
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

      {/* ── 顶栏 ── */}
      <div
        style={{
          padding: "calc(16px + env(safe-area-inset-top, 0px)) 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
          background: "rgba(0,0,0,.08)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <BackButton onClick={() => navigateTo("entrance")} label="首页" />
        <div style={{
          fontSize: 15, fontWeight: 400, letterSpacing: 3,
          color: "rgba(255,255,255,.9)",
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          textShadow: "0 1px 6px rgba(0,0,0,.2)",
        }}>
          我的小房间
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {onOpenGroupChat && (
            <button
              onClick={() => onOpenGroupChat(null)}
              title="小家客厅"
              style={{
                background: "none", border: "none", fontSize: 18,
                cursor: "pointer", padding: 4, lineHeight: 1,
                color: "rgba(255,255,255,.8)",
              }}
            >
              ☕
            </button>
          )}
          <button
            onClick={() => navigateTo("profiles")}
            title="入住档案"
            style={{
              background: "none", border: "none", fontSize: 18,
              cursor: "pointer", padding: 4, lineHeight: 1,
              color: "rgba(255,255,255,.8)",
            }}
          >
            📋
          </button>
          <BgCustomizer
            storageKey={BG_KEY}
            bgConfig={bgConfig}
            onUpdate={setBgConfig}
          />
        </div>
      </div>

      {/* ── 功能卡片区 ── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* 卡片网格 */}
        <div
          style={{
            padding: "0 16px",
            marginTop: -8,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <GlassCard
            label="我的手札"
            sublabel="日记、心事、灵感"
            onClick={() => navigateTo("diary")}
          />
          <GlassCard
            label="我的宝库"
            sublabel="珍藏的心动话语"
            onClick={() => navigateTo("treasure")}
          />
          <GlassCard
            label="声声档案"
            sublabel="关于我的一切"
            onClick={() => navigateTo("profileHome")}
          />
          <GlassCard
            label="便签墙"
            sublabel={unreadNotes.length > 0 ? `${unreadNotes.length} 条未读` : "留言与纸条"}
            onClick={() => navigateTo("stickyNotes")}
          />
          <GlassCard
            label="去找 ta"
            sublabel={
              characters.length > 0
                ? `${characters.length} 位入住者`
                : "还没有人入住"
            }
            onClick={() => setShowCharSelect(true)}
          />
          <GlassCard
            label="大脑连接"
            sublabel="API 设置"
            onClick={() => navigateTo("config")}
          />
        </div>

        {/* ── 便签墙预览条 ── */}
        {recentNotes.length > 0 && (
          <div
            onClick={() => navigateTo("stickyNotes")}
            style={{
              margin: "14px 14px 0",
              background: "rgba(255,255,255,.62)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 14,
              border: "1px solid rgba(196,166,184,.22)",
              boxShadow: "0 4px 16px rgba(74,69,96,.08)",
              padding: "9px 14px",
              cursor: "pointer",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 10, color: "#6a5a78", letterSpacing: 1 }}>
                📝 便签墙
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {unreadNotes.length > 0 && (
                  <span style={{
                    fontSize: 10, color: "#9a5060",
                    background: "rgba(180,100,120,.12)",
                    padding: "1px 8px", borderRadius: 8,
                    border: "1px solid rgba(180,100,120,.2)",
                  }}>
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
                <div key={note.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{
                    fontSize: 9, color: "#8a7898", flexShrink: 0,
                    background: "rgba(196,166,184,.15)",
                    padding: "1px 6px", borderRadius: 6,
                    maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {note.authorName}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: note.read ? "#9a8aac" : "#5a4a6a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1, fontWeight: note.read ? 300 : 400,
                  }}>
                    {note.content}
                  </span>
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

        {/* 底部安全区 */}
        <div style={{ height: "calc(16px + env(safe-area-inset-bottom, 0px))" }} />
      </div>

      {/* ── 角色选择弹窗（原样保留） ── */}
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
              <div style={{
                padding: "16px 0", color: "var(--text-faint)",
                fontSize: 13, lineHeight: 1.8,
              }}>
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
                    {groupChats?.length > 0 ? `${groupChats.length} 个客厅` : "邀请大家一起聊"}
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
