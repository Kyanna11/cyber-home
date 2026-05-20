// ─── 群聊 / 小家客厅页 ───
// 用户选择多个入住者一起聊天，入住者按顺序依次回复，每人每轮一次。
// 群聊记录单独保存，不自动写入任何单人长期记忆。

import { useState, useRef, useEffect, useCallback } from "react";
import { genId, buildSourceRef } from "../utils/helpers";
import { buildSystemPrompt, buildUserContext, parseResponse } from "../utils/prompt";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

// ─── 群聊 System Prompt 追加 ───
const GROUP_SYSTEM_ADDITION = `

【小家客厅 · 群聊说明】
你现在在用户的小家客厅里，和其他入住者同处一室，一起陪伴用户。

请遵守以下规则：
- 只代表你自己发言，不要替其他入住者说话，也不要预测他们会怎么回应
- 回复自然简短，不需要回应用户的每一句话
- 群聊中不需要写心声，直接说出口的话就好
- 这是轻松的多人陪伴场景，保持自己的性格即可
- 不要开头就说"我觉得XX会说……"或"XX肯定……"`;

// ─── 工具 ───
function timeStr() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function dateLabelShort() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ─── 创建群聊表单 ───
function CreateGroupForm({ characters, onConfirm, onCancel }) {
  const [name, setName] = useState("小家客厅");
  const [selected, setSelected] = useState([]);

  const toggleMember = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canCreate = name.trim().length > 0 && selected.length >= 2;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(74,69,96,.38)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget && onCancel) onCancel(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 18px 14px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, color: "#5a4a6a", fontWeight: 500, letterSpacing: 1 }}>
            ☕ 开启小家客厅
          </span>
          {onCancel && (
            <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 32px" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 1, display: "block", marginBottom: 6 }}>
              客厅名称
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给这个客厅起个名字…"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
                border: "1px solid rgba(196,166,184,.4)", background: "rgba(255,255,255,.7)",
                fontSize: 14, color: "#5a4a6a", fontFamily: "var(--font-main)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 1, display: "block", marginBottom: 8 }}>
              邀请哪些入住者（至少 2 位）
            </label>
            {characters.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)", padding: "10px 0" }}>
                家里还没有入住者，先去添加吧~
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {characters.map((char) => {
                  const checked = selected.includes(char.id);
                  return (
                    <div
                      key={char.id}
                      onClick={() => toggleMember(char.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 14, cursor: "pointer",
                        background: checked ? "rgba(120,100,160,.12)" : "rgba(255,255,255,.55)",
                        border: `1px solid ${checked ? "rgba(120,100,160,.3)" : "rgba(196,166,184,.22)"}`,
                        transition: "all .15s",
                      }}
                    >
                      <Avatar char={char} size={36} radius={12} fontSize={18} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>{char.name || "未命名"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{char.relation || ""}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        border: `1.5px solid ${checked ? "rgba(120,100,160,.6)" : "rgba(196,166,184,.4)"}`,
                        background: checked ? "rgba(120,100,160,.85)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "white",
                      }}>
                        {checked ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected.length < 2 && selected.length > 0 && (
            <div style={{ fontSize: 11, color: "#9a7878", marginBottom: 10 }}>至少再选一位~</div>
          )}

          <button
            disabled={!canCreate}
            onClick={() => onConfirm({ name: name.trim(), memberIds: selected })}
            style={{
              width: "100%", padding: "13px", borderRadius: 14,
              background: canCreate ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none", color: canCreate ? "white" : "#9a8aac",
              fontSize: 14, cursor: canCreate ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 1, transition: "all .2s",
            }}
          >
            ☕ 开启客厅
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 珍藏确认弹窗 ───
function TreasureSaveSheet({ msg, char, groupName, onConfirm, onCancel }) {
  const [title, setTitle] = useState(
    `客厅里的${char?.name || "ta"} · ${dateLabelShort()}`
  );
  const preview = (msg.content || "").slice(0, 80) + ((msg.content || "").length > 80 ? "…" : "");

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(74,69,96,.38)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
        overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500, letterSpacing: 0.5 }}>
            💎 珍藏这句话
          </span>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9a8aac", padding: 4 }}
          >✕</button>
        </div>

        <div style={{ padding: "14px 18px 32px" }}>
          {/* 内容预览 */}
          <div style={{
            background: "rgba(255,255,255,.6)",
            border: "1px solid rgba(196,166,184,.22)",
            borderRadius: 12, padding: "10px 14px", marginBottom: 14,
            fontSize: 13, color: "#5a4a6a", lineHeight: 1.75,
          }}>
            {preview}
          </div>

          {/* 标题输入 */}
          <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
            给这句话起个名字
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
              border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
              fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)", outline: "none",
              marginBottom: 16,
            }}
          />

          <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
            将保存到「我的宝库」，不会影响任何入住者的长期记忆
          </div>

          <button
            onClick={() => onConfirm({ title: title.trim() || `客厅里的${char?.name || "ta"}` })}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: "rgba(120,100,160,.85)", border: "none",
              color: "white", fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 1,
            }}
          >
            珍藏起来
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 记下这一刻弹窗 ───
function TimelineEventSheet({ msg, char, group, characters, onConfirm, onCancel }) {
  const defaultTitle = char
    ? `小家客厅 · 和${char.name || "ta"}`
    : `小家客厅 · 我说的`;
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState((msg.content || "").slice(0, 60));
  const [occurredAt, setOccurredAt] = useState(todayStr());
  // 归属：charId 或 null（全家）
  const [loverId, setLoverId] = useState(char?.id || null);

  const memberChars = (group?.memberIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(74,69,96,.38)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500, letterSpacing: 0.5 }}>
            🕰 记下这一刻
          </span>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9a8aac", padding: 4 }}
          >✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 标题 */}
          <div>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              时刻标题
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
                border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
                fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)", outline: "none",
              }}
            />
          </div>

          {/* 短描述 */}
          <div>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              想记住什么
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
                border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
                fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)", outline: "none",
                resize: "none", lineHeight: 1.7,
              }}
            />
          </div>

          {/* 日期 */}
          <div>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              发生日期
            </label>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              style={{
                width: "100%", padding: "9px 14px", borderRadius: 12, boxSizing: "border-box",
                border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
                fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)", outline: "none",
              }}
            />
          </div>

          {/* 归属 */}
          <div>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
              记在谁的时间线
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {/* 全家事件 */}
              <div
                onClick={() => setLoverId(null)}
                style={{
                  padding: "7px 14px", borderRadius: 10, cursor: "pointer",
                  background: loverId === null ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.6)",
                  border: `1px solid ${loverId === null ? "rgba(120,100,160,.35)" : "rgba(196,166,184,.3)"}`,
                  fontSize: 12, color: loverId === null ? "#5a4a6a" : "#7a6a8e",
                  transition: "all .15s",
                }}
              >
                🏠 全家事件
              </div>
              {/* 各成员 */}
              {memberChars.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setLoverId(c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 10, cursor: "pointer",
                    background: loverId === c.id ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.6)",
                    border: `1px solid ${loverId === c.id ? "rgba(120,100,160,.35)" : "rgba(196,166,184,.3)"}`,
                    fontSize: 12, color: loverId === c.id ? "#5a4a6a" : "#7a6a8e",
                    transition: "all .15s",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{c.emoji || "💜"}</span>
                  {c.name || "ta"}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.7, marginTop: -4 }}>
            保存到关系时间线，不会影响任何入住者的长期记忆
          </div>

          <button
            onClick={() => onConfirm({
              title: title.trim() || defaultTitle,
              description: description.trim(),
              occurredAt,
              loverId,
            })}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: "rgba(120,100,160,.85)", border: "none",
              color: "white", fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 1,
            }}
          >
            记下这一刻
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 更多菜单 ───
function MoreMenuSheet({ onSettle, settling, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(74,69,96,.3)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.2)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "6px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(196,166,184,.4)", margin: "10px 0 6px" }} />
        </div>

        <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* 整理这次客厅 */}
          <button
            onClick={onSettle}
            disabled={settling}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "14px 16px", borderRadius: 14,
              background: settling ? "rgba(196,166,184,.18)" : "rgba(255,255,255,.72)",
              border: "1px solid rgba(196,166,184,.25)",
              cursor: settling ? "default" : "pointer",
              textAlign: "left", fontFamily: "var(--font-main)",
            }}
          >
            <span style={{ fontSize: 20 }}>✨</span>
            <div>
              <div style={{ fontSize: 13, color: settling ? "#9a8aac" : "#5a4a6a", fontWeight: 500 }}>
                {settling ? "正在整理…" : "整理这次客厅"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
                生成草稿，不自动写入长期记忆
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "12px", borderRadius: 14, marginTop: 4,
              background: "transparent", border: "none",
              color: "#9a8aac", fontSize: 13, cursor: "pointer",
              fontFamily: "var(--font-main)",
            }}
          >
            关上这扇门
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 消息气泡（入住者） ───
function CharBubble({ msg, char, isActive, onToggleActive, onTreasure, onTimeline }) {
  const emoji = char?.avatarImg ? null : (char?.emoji || "💜");
  return (
    <div
      style={{ marginBottom: 14, padding: "0 12px", cursor: "pointer", userSelect: isActive ? "none" : "text" }}
      onClick={onToggleActive}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* 头像 */}
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: "rgba(196,166,184,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, border: "1px solid rgba(196,166,184,.25)",
          overflow: "hidden",
        }}>
          {char?.avatarImg
            ? <img src={char.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : emoji}
        </div>
        <div style={{ maxWidth: "72%", minWidth: 0 }}>
          {/* 名字 + 时间 */}
          <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4, display: "flex", gap: 6, alignItems: "baseline" }}>
            <span style={{ fontWeight: 500, color: "#7a6a8e" }}>{msg.authorName}</span>
            <span>{msg.time}</span>
          </div>
          {/* 气泡 */}
          <div style={{
            background: isActive ? "rgba(240,232,252,.92)" : "rgba(255,255,255,.78)",
            border: `1px solid ${isActive ? "rgba(120,100,160,.28)" : "rgba(196,166,184,.22)"}`,
            borderRadius: "4px 14px 14px 14px",
            padding: "10px 14px",
            fontSize: 14, color: "#3a2e4a",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            transition: "all .15s",
          }}>
            {msg.content}
          </div>
        </div>
      </div>

      {/* 操作行 */}
      {isActive && (
        <div
          style={{
            display: "flex", gap: 6, marginTop: 6, paddingLeft: 44,
            animation: "fadeIn .18s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onTreasure}
            style={{
              padding: "5px 12px", borderRadius: 10, fontSize: 11,
              background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.22)",
              color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)",
              letterSpacing: 0.3, transition: "all .15s",
            }}
          >
            💎 珍藏这句话
          </button>
          <button
            onClick={onTimeline}
            style={{
              padding: "5px 12px", borderRadius: 10, fontSize: 11,
              background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.22)",
              color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)",
              letterSpacing: 0.3, transition: "all .15s",
            }}
          >
            🕰 记下这一刻
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 消息气泡（用户） ───
function UserBubble({ msg, isActive, onToggleActive, onTimeline, onCharTreasure }) {
  return (
    <div
      style={{ marginBottom: 14, padding: "0 12px", cursor: "pointer", userSelect: isActive ? "none" : "text" }}
      onClick={onToggleActive}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "72%", minWidth: 0 }}>
          <div style={{
            background: isActive ? "rgba(100,80,148,.88)" : "rgba(120,100,160,.82)",
            borderRadius: "14px 4px 14px 14px",
            padding: "10px 14px",
            fontSize: 14, color: "rgba(255,255,255,.95)",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            transition: "all .15s",
          }}>
            {msg.content}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-faint)", textAlign: "right", marginTop: 3 }}>
            {msg.time}
          </div>
        </div>
      </div>

      {/* 操作行 */}
      {isActive && (
        <div
          style={{
            display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 4,
            animation: "fadeIn .18s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onCharTreasure && (
            <button
              onClick={onCharTreasure}
              style={{
                padding: "5px 12px", borderRadius: 10, fontSize: 11,
                background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.22)",
                color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)",
                letterSpacing: 0.3, transition: "all .15s",
              }}
            >
              💝 让 ta 珍藏
            </button>
          )}
          <button
            onClick={onTimeline}
            style={{
              padding: "5px 12px", borderRadius: 10, fontSize: 11,
              background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.22)",
              color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)",
              letterSpacing: 0.3, transition: "all .15s",
            }}
          >
            🕰 记下这一刻
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 系统消息 ───
function SystemMsg({ text }) {
  return (
    <div style={{
      textAlign: "center", padding: "8px 24px", fontSize: 11,
      color: "var(--text-faint)", letterSpacing: 0.6, lineHeight: 1.7,
    }}>{text}</div>
  );
}

// ─── 轮次分隔线 ───
function RoundDivider({ index }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 16px 12px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.2)" }} />
      <span style={{ fontSize: 9, color: "rgba(196,166,184,.6)", letterSpacing: 1 }}>第 {index} 轮</span>
      <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.2)" }} />
    </div>
  );
}

// ─── 正在输入指示 ───
function TypingFor({ char }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 16px 12px" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 10, flexShrink: 0,
        background: "rgba(196,166,184,.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14,
      }}>
        {char?.avatarImg
          ? <img src={char.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} alt="" />
          : (char?.emoji || "💜")}
      </div>
      <div className="typing-indicator" style={{ background: "rgba(255,255,255,.75)", border: "1px solid rgba(196,166,184,.22)", gap: 3, padding: "6px 10px" }}>
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{char?.name || "ta"} 正在回复…</span>
    </div>
  );
}

// ─── 让ta珍藏弹窗（群聊）需选择珍藏给哪位入住者 ───
function GroupCharTreasureSheet({ msg, group, characters, onConfirm, onCancel }) {
  const memberChars = (group?.memberIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);
  const [selectedCharId, setSelectedCharId] = useState(memberChars[0]?.id || null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const preview = (msg.content || "").slice(0, 100) + ((msg.content || "").length > 100 ? "…" : "");

  const handleConfirm = () => {
    if (!selectedCharId) return;
    onConfirm({ charId: selectedCharId, note: note.trim() });
    setSaved(true);
  };

  const selectedChar = memberChars.find((c) => c.id === selectedCharId);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(74,69,96,.38)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.18)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
            💝 要把这句话交给他收好吗？
          </span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 内容预览 */}
          <div style={{
            background: "rgba(255,255,255,.65)",
            border: "1px solid rgba(196,166,184,.22)",
            borderRadius: 12, padding: "10px 14px",
            fontSize: 13, color: "#5a4a6a", lineHeight: 1.75,
          }}>
            {preview}
          </div>

          {/* 选择珍藏给谁 */}
          <div>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
              交给谁珍藏
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {memberChars.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCharId(c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 10, cursor: "pointer",
                    background: selectedCharId === c.id ? "rgba(120,100,160,.15)" : "rgba(255,255,255,.65)",
                    border: `1px solid ${selectedCharId === c.id ? "rgba(120,100,160,.35)" : "rgba(196,166,184,.3)"}`,
                    fontSize: 13, color: selectedCharId === c.id ? "#5a4a6a" : "#7a6a8e",
                    transition: "all .15s",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{c.emoji || "💜"}</span>
                  {c.name || "ta"}
                </div>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label style={{ fontSize: 11, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              备注（可不填）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="比如：这是我第一次…"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
                border: "1px solid rgba(196,166,184,.38)", background: "rgba(255,255,255,.7)",
                fontSize: 13, color: "#5a4a6a", fontFamily: "var(--font-main)",
                outline: "none", resize: "none", lineHeight: 1.7,
              }}
            />
          </div>

          {saved ? (
            <div style={{ textAlign: "center", padding: "10px 0", fontSize: 13, color: "#7a6a8e" }}>
              💝 已放进 {selectedChar?.name || "ta"} 的宝库
            </div>
          ) : (
            <button
              disabled={!selectedCharId}
              onClick={handleConfirm}
              style={{
                padding: "12px", borderRadius: 14,
                background: selectedCharId ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
                border: "none",
                color: selectedCharId ? "white" : "#9a8aac",
                fontSize: 14, cursor: selectedCharId ? "pointer" : "default",
                fontFamily: "var(--font-main)", letterSpacing: 1,
              }}
            >
              💝 放进 {selectedChar?.name || "ta"} 的宝库
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// ── 主页面 ──
// ═════════════════════════════════════════════
export default function GroupChatPage({
  navigateTo,
  characters,
  allMemories,
  userProfile,
  homeMemory,
  config,
  ctxConfig,
  groupChats,
  groupThreads,
  activeGroupId,
  setGroupChats,
  setGroupThreads,
  onCreateGroup,
  onSelectGroup,
  // 收尾闭环：宝库 / 时间线 / 整理
  onSaveTreasure,
  onAddTimelineEvent,
  onGenerateGroupSettlement,
  // 他的宝库
  onAddCharTreasure,
}) {
  const [showCreate, setShowCreate]       = useState(false);
  const [showGroupList, setShowGroupList] = useState(false);
  const [inputText, setInputText]         = useState("");
  const [isProcessing, setIsProcessing]   = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [sendError, setSendError]         = useState("");

  // ── 消息操作状态 ──
  const [activeMsgId, setActiveMsgId]     = useState(null);  // 当前展开操作栏的消息
  const [treasureTarget, setTreasureTarget] = useState(null); // { msg, char }
  const [timelineTarget, setTimelineTarget] = useState(null); // { msg, char }
  const [charTreasureTarget, setCharTreasureTarget] = useState(null); // { msg } - 让ta珍藏
  const [showMoreMenu, setShowMoreMenu]   = useState(false);
  const [groupSettleLoading, setGroupSettleLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(""); // 操作完成提示

  const roundAbortRef   = useRef(false);
  const liveMessagesRef = useRef([]);
  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);

  const group  = groupChats.find((g) => g.id === activeGroupId) || null;
  const thread = groupThreads.find((t) => t.groupId === activeGroupId) || null;
  const messages = thread?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSpeaker]);

  // 操作反馈自动消失
  useEffect(() => {
    if (!actionFeedback) return;
    const t = setTimeout(() => setActionFeedback(""), 2200);
    return () => clearTimeout(t);
  }, [actionFeedback]);

  const getModel = useCallback((charOverride) => {
    if (charOverride?.trim()) return charOverride.trim();
    const raw = config.model === "__custom__" ? config.customModel : config.model;
    return raw?.trim() || "";
  }, [config]);

  const appendMessage = useCallback((msg) => {
    liveMessagesRef.current = [...liveMessagesRef.current, msg];
    const snapshot = [...liveMessagesRef.current];
    setGroupThreads((prev) =>
      prev.map((t) =>
        t.groupId === activeGroupId
          ? { ...t, messages: snapshot, updatedAt: Date.now() }
          : t
      )
    );
  }, [activeGroupId, setGroupThreads]);

  const buildGroupContext = (historyMessages, userMsg, alreadyReplied) => {
    const history = historyMessages
      .filter((m) => m.roundIndex !== userMsg.roundIndex)
      .slice(-20);

    const apiMsgs = history.map((m) => ({
      role:    m.role === "user" ? "user" : "assistant",
      content: m.role === "char"
        ? `（${m.authorName}）${m.content}`
        : m.content,
    }));

    let currentContent = userMsg.content;
    if (alreadyReplied.length > 0) {
      currentContent +=
        "\n\n" +
        alreadyReplied
          .map((m) => `【${m.authorName} 刚才说了】\n${m.content}`)
          .join("\n\n") +
        "\n\n请你现在回复。";
    }
    apiMsgs.push({ role: "user", content: currentContent });
    return apiMsgs;
  };

  const callCharLLM = async (char, historyMessages, userMsg, alreadyReplied) => {
    const model = getModel(char.modelOverride);
    if (!model || !config.apiUrl?.trim() || !config.apiKey?.trim()) {
      throw new Error("API 未配置");
    }

    const charMemories = allMemories[char.id] || {};
    const systemBase   = buildSystemPrompt(char, charMemories);
    const userCtx      = buildUserContext(userProfile, char.id, homeMemory);
    const system       = systemBase + (userCtx ? `\n\n${userCtx}` : "") + GROUP_SYSTEM_ADDITION;
    const apiMessages  = buildGroupContext(historyMessages, userMsg, alreadyReplied);

    const resp = await fetch(
      config.apiUrl.replace(/\/+$/, "") + "/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            ...apiMessages,
          ],
          temperature: 0.82,
          max_tokens:  ctxConfig?.maxTokens ? Math.min(ctxConfig.maxTokens, 800) : 800,
        }),
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const raw  = data.choices?.[0]?.message?.content || "";
    const { parts } = parseResponse(raw, "long");
    return parts[0] || "…";
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing || !group || !thread) return;
    if (!config.apiUrl?.trim() || !config.apiKey?.trim()) {
      setSendError("请先在聊天页配置 API 地址和密钥");
      return;
    }

    const content = inputText.trim();
    setInputText("");
    setSendError("");
    setActiveMsgId(null);

    const maxRound = messages.reduce((acc, m) => Math.max(acc, m.roundIndex || 0), 0);
    const roundIndex = maxRound + 1;

    const userMsg = {
      id:          genId(),
      role:        "user",
      charId:      null,
      authorName:  userProfile?.globalFacts?.name?.trim() || "你",
      content,
      createdAt:   Date.now(),
      time:        timeStr(),
      roundIndex,
      sourceRefs:  [],
    };

    liveMessagesRef.current = [...messages, userMsg];

    setGroupThreads((prev) =>
      prev.map((t) =>
        t.groupId === activeGroupId
          ? { ...t, messages: liveMessagesRef.current, updatedAt: Date.now() }
          : t
      )
    );

    setIsProcessing(true);
    roundAbortRef.current = false;

    const repliedThisRound = [];

    for (const charId of group.memberIds) {
      if (roundAbortRef.current) break;

      const char = characters.find((c) => c.id === charId);
      if (!char) continue;

      setCurrentSpeaker(charId);

      try {
        const historyForContext = liveMessagesRef.current.filter(
          (m) => !(m.id === userMsg.id)
        );
        const reply = await callCharLLM(char, historyForContext, userMsg, repliedThisRound);

        if (roundAbortRef.current) break;

        const charMsg = {
          id:         genId(),
          role:       "char",
          charId,
          authorName: char.name || "入住者",
          content:    reply,
          createdAt:  Date.now(),
          time:       timeStr(),
          roundIndex,
          sourceRefs: [
            buildSourceRef({
              sourceType:  "group_chat",
              sourceId:    charId,
              sourceTitle: char.name || "入住者",
              excerpt:     reply.slice(0, 80),
            }),
          ],
        };
        appendMessage(charMsg);
        repliedThisRound.push(charMsg);
      } catch (err) {
        if (!roundAbortRef.current) {
          setSendError(`${char.name || "入住者"} 回复失败：${err.message}`);
        }
      }
    }

    setCurrentSpeaker(null);
    setIsProcessing(false);
  };

  const handleStop = () => {
    roundAbortRef.current = true;
    setCurrentSpeaker(null);
    setIsProcessing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── 创建新群聊 ──
  const handleCreate = ({ name, memberIds }) => {
    const now  = Date.now();
    const gId  = genId();
    const tId  = genId();
    const newGroup = {
      id: gId, name, memberIds,
      createdAt: now, updatedAt: now,
      activeThreadId: tId,
    };
    const newThread = {
      id: tId, groupId: gId,
      name: `${name}·默认话题`,
      messages: [],
      createdAt: now, updatedAt: now,
    };
    setGroupChats((prev) => [...prev, newGroup]);
    setGroupThreads((prev) => [...prev, newThread]);
    onSelectGroup?.(gId);
    setShowCreate(false);
  };

  // ── 消息操作：切换激活 ──
  const toggleMsgActive = (msgId) => {
    setActiveMsgId((prev) => (prev === msgId ? null : msgId));
  };

  // ── 珍藏到宝库 ──
  const handleTreasureConfirm = ({ title }) => {
    if (!treasureTarget || !onSaveTreasure) return;
    const { msg, char } = treasureTarget;
    const now = Date.now();
    onSaveTreasure({
      id:           genId(),
      title:        title,
      content:      msg.content,
      type:         "group_chat",
      charId:       char?.id || null,
      charName:     char?.name || "",
      important:    false,
      tags:         ["客厅"],
      note:         "",
      createdAt:    now,
      updatedAt:    now,
      sourceGroupId:   group?.id,
      sourceGroupName: group?.name || "小家客厅",
      sourceRefs: [
        buildSourceRef({
          sourceType:  "group_chat",
          sourceId:    msg.id,
          sourceTitle: `${group?.name || "小家客厅"} · ${char?.name || "ta"}`,
          excerpt:     (msg.content || "").slice(0, 80),
        }),
      ],
    });
    setTreasureTarget(null);
    setActiveMsgId(null);
    setActionFeedback("💎 已珍藏到宝库");
  };

  // ── 记下时间线 ──
  const handleTimelineConfirm = ({ title, description, occurredAt, loverId }) => {
    if (!timelineTarget || !onAddTimelineEvent) return;
    const { msg } = timelineTarget;
    onAddTimelineEvent({
      loverId,
      title,
      description,
      eventType:   "memory",
      occurredAt,
      source:      "group_chat",
      sourceIds:   [msg.id],
      sourceRefs:  [
        buildSourceRef({
          sourceType:  "group_chat",
          sourceId:    msg.id,
          sourceTitle: `${group?.name || "小家客厅"}`,
          excerpt:     (msg.content || "").slice(0, 80),
        }),
      ],
      importance: 3,
    });
    setTimelineTarget(null);
    setActiveMsgId(null);
    setActionFeedback("🕰 已记到时间线");
  };

  // ── 让ta珍藏 ──
  const handleGroupCharTreasureConfirm = ({ charId, note }) => {
    if (!charTreasureTarget || !onAddCharTreasure) return;
    const { msg } = charTreasureTarget;
    onAddCharTreasure({
      charId,
      sourceType: "group_message",
      sourceId:   msg.id || null,
      content:    msg.content,
      note,
      authorType: "user",
      pinned:     false,
      sourceRefs: [
        buildSourceRef({
          sourceType:  "group_chat",
          sourceId:    msg.id || "",
          sourceTitle: group?.name || "小家客厅",
          excerpt:     (msg.content || "").slice(0, 80),
        }),
      ],
    });
    setTimeout(() => {
      setCharTreasureTarget(null);
      setActiveMsgId(null);
      setActionFeedback("💝 已放进他的宝库");
    }, 900);
  };

  // ── 整理这次客厅 ──
  const handleGroupSettle = async () => {
    if (!onGenerateGroupSettlement || !group || !thread) return;
    setShowMoreMenu(false);
    setGroupSettleLoading(true);
    try {
      await onGenerateGroupSettlement(group, thread);
    } finally {
      setGroupSettleLoading(false);
    }
  };

  // ── 渲染消息列表 ──
  const renderMessages = () => {
    let lastRound = -1;
    const items = [];
    messages.forEach((msg, i) => {
      if (msg.role === "user" && msg.roundIndex !== lastRound) {
        if (lastRound >= 0) {
          items.push(<RoundDivider key={`rd-${i}`} index={msg.roundIndex} />);
        }
        lastRound = msg.roundIndex;
      }
      if (msg.role === "user") {
        items.push(
          <UserBubble
            key={msg.id}
            msg={msg}
            isActive={activeMsgId === msg.id}
            onToggleActive={() => toggleMsgActive(msg.id)}
            onTimeline={() => { setTimelineTarget({ msg, char: null }); }}
            onCharTreasure={onAddCharTreasure ? () => { setCharTreasureTarget({ msg }); } : undefined}
          />
        );
      } else if (msg.role === "char") {
        const char = characters.find((c) => c.id === msg.charId);
        items.push(
          <CharBubble
            key={msg.id}
            msg={msg}
            char={char}
            isActive={activeMsgId === msg.id}
            onToggleActive={() => toggleMsgActive(msg.id)}
            onTreasure={() => { setTreasureTarget({ msg, char }); }}
            onTimeline={() => { setTimelineTarget({ msg, char }); }}
          />
        );
      } else {
        items.push(<SystemMsg key={msg.id} text={msg.content} />);
      }
    });
    return items;
  };

  // ══════════════════
  // ── 无群聊态 ──
  // ══════════════════
  if (!group || !thread) {
    return (
      <div className="lounge" style={{ position: "relative" }}>
        {/* 遮罩：压暖色调、引出薰衣草紫 */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(222,212,244,.56)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "18px 16px 14px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          background: "rgba(238,230,255,.80)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          flexShrink: 0,
        }}>
          <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />
          <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
            ☕ 小家客厅
          </div>
          <div style={{ width: 48 }} />
        </div>

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 24px 64px", gap: 18, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>☕</div>
          <div style={{ fontSize: 16, color: "#5a4a6a", fontWeight: 500, letterSpacing: 1 }}>
            还没有客厅
          </div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.9, maxWidth: 280 }}>
            在这里可以邀请多个入住者一起聊天。<br />
            聊天记录单独保存，不会影响各自的单人聊天。
          </div>
          {characters.length < 2 ? (
            <div style={{ fontSize: 12, color: "#9a7878", padding: "10px 18px", borderRadius: 12, background: "rgba(200,140,140,.08)", border: "1px solid rgba(200,140,140,.15)", lineHeight: 1.8 }}>
              家里还不到 2 位入住者，先去成员档案添加吧~
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "13px 28px", borderRadius: 16,
                background: "rgba(120,100,160,.85)", border: "none",
                color: "white", fontSize: 14, cursor: "pointer",
                fontFamily: "var(--font-main)", letterSpacing: 1,
              }}
            >
              ☕ 开启小家客厅
            </button>
          )}

          {groupChats.length > 0 && (
            <div style={{ marginTop: 8, width: "100%", maxWidth: 320 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8, letterSpacing: 0.5 }}>或者选择已有客厅</div>
              {groupChats.map((g) => (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup?.(g.id)}
                  style={{
                    padding: "10px 14px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
                    background: "rgba(255,255,255,.65)", border: "1px solid rgba(196,166,184,.22)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>☕</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, color: "#5a4a6a" }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{g.memberIds.length} 位入住者</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreate && (
          <CreateGroupForm
            characters={characters}
            onConfirm={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        )}
        </div>{/* end content wrapper */}
      </div>
    );
  }

  // ══════════════════════════════
  // ── 有群聊的主界面 ──
  // ══════════════════════════════
  const members = group.memberIds.map((id) => characters.find((c) => c.id === id)).filter(Boolean);
  const currentSpeakerChar = characters.find((c) => c.id === currentSpeaker) || null;

  return (
    <div
      className="lounge"
      style={{ position: "relative" }}
      onClick={() => setActiveMsgId(null)}  /* 点背景关闭操作栏 */
    >
      {/* 遮罩：压暖色调、引出薰衣草紫 */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(222,212,244,.56)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── 顶栏 ── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          background: "rgba(238,230,255,.82)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#5a4a6a", letterSpacing: 1 }}>
            ☕ {group.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            {members.map((char) => (
              <div key={char.id} style={{
                width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                background: "rgba(196,166,184,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, overflow: "hidden",
                border: "1px solid rgba(196,166,184,.3)",
              }}>
                {char.avatarImg
                  ? <img src={char.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : (char.emoji || "💜")}
              </div>
            ))}
            <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 2 }}>
              {members.map((c) => c.name || "ta").join("、")}
            </span>
          </div>
        </div>

        {/* 整理按钮 */}
        <button
          onClick={() => setShowMoreMenu(true)}
          disabled={groupSettleLoading}
          title="更多"
          style={{
            background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.18)",
            borderRadius: 10, padding: "5px 10px", fontSize: 13,
            color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)", flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {groupSettleLoading ? "✨" : "⋯"}
        </button>

        {/* 换个客厅 */}
        <button
          onClick={() => setShowGroupList(true)}
          style={{
            background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.18)",
            borderRadius: 10, padding: "5px 10px", fontSize: 11,
            color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)", flexShrink: 0,
          }}
        >
          换客厅
        </button>
      </div>

      {/* ── 操作反馈 toast ── */}
      {actionFeedback && (
        <div style={{
          position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "rgba(60,50,80,.88)", color: "rgba(255,255,255,.92)",
          padding: "8px 18px", borderRadius: 20,
          fontSize: 12, letterSpacing: 0.5, zIndex: 100,
          pointerEvents: "none",
          animation: "fadeIn .2s ease-out",
        }}>
          {actionFeedback}
        </div>
      )}

      {/* ── 消息列表 ── */}
      <div
        style={{ flex: 1, overflow: "auto", paddingTop: 14, paddingBottom: 8 }}
        onClick={(e) => {
          // 点消息区域空白也关闭操作栏
          if (e.target === e.currentTarget) setActiveMsgId(null);
        }}
      >
        {messages.length === 0 && (
          <div style={{
            textAlign: "center", padding: "40px 24px",
            fontSize: 13, color: "var(--text-faint)", lineHeight: 1.9,
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>☕</div>
            大家都在，说点什么吧~
          </div>
        )}

        {renderMessages()}

        {currentSpeakerChar && <TypingFor char={currentSpeakerChar} />}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {sendError && (
        <div style={{
          padding: "6px 16px", fontSize: 11, color: "#9a5050",
          background: "rgba(200,140,140,.08)", borderTop: "1px solid rgba(200,140,140,.12)",
          flexShrink: 0, textAlign: "center",
        }}>
          {sendError}
          <button
            onClick={() => setSendError("")}
            style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#9a5050", padding: 0 }}
          >✕</button>
        </div>
      )}

      {/* ── 输入栏 ── */}
      <div
        style={{
          flexShrink: 0,
          background: "rgba(240,233,255,.97)",
          borderTop: "1px solid rgba(196,166,184,.2)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
          display: "flex", alignItems: "flex-end", gap: 8,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="跟大家说点什么…"
          disabled={isProcessing}
          rows={1}
          style={{
            flex: 1, resize: "none", overflowY: "auto", maxHeight: 100,
            padding: "10px 14px", borderRadius: 14,
            border: "1px solid rgba(196,166,184,.35)",
            background: "rgba(255,255,255,.85)",
            fontSize: 14, color: "#3a2e4a", lineHeight: 1.6,
            fontFamily: "var(--font-main)", outline: "none",
            opacity: isProcessing ? 0.6 : 1,
          }}
        />

        {isProcessing ? (
          <button
            onClick={handleStop}
            style={{
              padding: "10px 14px", borderRadius: 14, flexShrink: 0,
              background: "rgba(180,100,100,.15)", border: "1px solid rgba(180,100,100,.3)",
              color: "#9a5050", fontSize: 12, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            停止本轮
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              padding: "10px 16px", borderRadius: 14, flexShrink: 0,
              background: inputText.trim() ? "rgba(120,100,160,.85)" : "rgba(196,166,184,.3)",
              border: "none",
              color: inputText.trim() ? "white" : "#9a8aac",
              fontSize: 13, cursor: inputText.trim() ? "pointer" : "default",
              fontFamily: "var(--font-main)", letterSpacing: 0.5,
              transition: "all .15s",
            }}
          >
            发送
          </button>
        )}
      </div>

      {/* ── 切换/新建群聊面板 ── */}
      {showGroupList && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(74,69,96,.35)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGroupList(false); }}
        >
          <div style={{
            width: "100%", maxWidth: 480, maxHeight: "70vh",
            background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
            borderRadius: "20px 20px 0 0",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 -8px 40px rgba(74,69,96,.18)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px 12px",
              borderBottom: "1px solid rgba(196,166,184,.2)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>选择客厅</span>
              <button onClick={() => setShowGroupList(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 24px" }}>
              {groupChats.map((g) => (
                <div
                  key={g.id}
                  onClick={() => { onSelectGroup?.(g.id); setShowGroupList(false); }}
                  style={{
                    padding: "11px 14px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
                    background: g.id === activeGroupId ? "rgba(120,100,160,.12)" : "rgba(255,255,255,.65)",
                    border: `1px solid ${g.id === activeGroupId ? "rgba(120,100,160,.28)" : "rgba(196,166,184,.22)"}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>☕</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#5a4a6a" }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{g.memberIds.length} 位成员</div>
                  </div>
                  {g.id === activeGroupId && <span style={{ fontSize: 10, color: "#7a6a8e" }}>当前</span>}
                </div>
              ))}
              <button
                onClick={() => { setShowGroupList(false); setShowCreate(true); }}
                style={{
                  width: "100%", padding: "11px", borderRadius: 12, marginTop: 4,
                  background: "transparent", border: "1px dashed rgba(196,166,184,.45)",
                  color: "#9a8aac", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >
                ＋ 新建客厅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建表单 */}
      {showCreate && (
        <CreateGroupForm
          characters={characters}
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* 更多菜单 */}
      {showMoreMenu && (
        <MoreMenuSheet
          onSettle={handleGroupSettle}
          settling={groupSettleLoading}
          onClose={() => setShowMoreMenu(false)}
        />
      )}

      {/* 珍藏弹窗 */}
      {treasureTarget && (
        <TreasureSaveSheet
          msg={treasureTarget.msg}
          char={treasureTarget.char}
          groupName={group?.name}
          onConfirm={handleTreasureConfirm}
          onCancel={() => setTreasureTarget(null)}
        />
      )}

      {/* 时间线弹窗 */}
      {timelineTarget && (
        <TimelineEventSheet
          msg={timelineTarget.msg}
          char={timelineTarget.char}
          group={group}
          characters={characters}
          onConfirm={handleTimelineConfirm}
          onCancel={() => setTimelineTarget(null)}
        />
      )}

      {/* 让ta珍藏弹窗 */}
      {charTreasureTarget && (
        <GroupCharTreasureSheet
          msg={charTreasureTarget.msg}
          group={group}
          characters={characters}
          onConfirm={handleGroupCharTreasureConfirm}
          onCancel={() => setCharTreasureTarget(null)}
        />
      )}
      </div>{/* end content wrapper */}
    </div>
  );
}
