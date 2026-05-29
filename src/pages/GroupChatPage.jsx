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
  const [topic, setTopic] = useState("");

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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 1, display: "block", marginBottom: 6 }}>
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

          <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7, padding: "8px 10px", background: "rgba(196,166,184,.08)", borderRadius: 8 }}>
            客厅记录会保存为群聊会话，不会自动写入长期记忆。
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 1, display: "block", marginBottom: 8 }}>
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
                        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{char.relation || ""}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        border: `1.5px solid ${checked ? "rgba(120,100,160,.6)" : "rgba(196,166,184,.4)"}`,
                        background: checked ? "rgba(120,100,160,.85)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "white",
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
            <div style={{ fontSize: 12, color: "#9a7878", marginBottom: 10 }}>至少再选一位~</div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 1, display: "block", marginBottom: 6 }}>
              这次想聊什么 <span style={{ opacity: 0.5 }}>（可选）</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="比如：随便聊聊，或者我想吐槽今天发生的事…"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
                border: "1px solid rgba(196,166,184,.4)", background: "rgba(255,255,255,.7)",
                fontSize: 14, color: "#5a4a6a", fontFamily: "var(--font-main)",
                outline: "none", resize: "none", lineHeight: 1.75, minHeight: 60,
              }}
            />
          </div>

          <button
            disabled={!canCreate}
            onClick={() => onConfirm({ name: name.trim(), memberIds: selected, topic: topic.trim() })}
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
          <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
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

          <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
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

          <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.7, marginTop: -4 }}>
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
function MoreMenuSheet({ onClose, onSettle, onViewRecords }) {
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
          <button
            onClick={onSettle}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "14px 16px", borderRadius: 14,
              background: "rgba(255,255,255,.72)",
              border: "1px solid rgba(196,166,184,.25)",
              cursor: "pointer",
              textAlign: "left", fontFamily: "var(--font-main)",
            }}
          >
            <span style={{ fontSize: 20 }}>📚</span>
            <div>
              <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>整理这次客厅</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>保存完整对话到记录册</div>
            </div>
          </button>

          <button
            onClick={onViewRecords}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "14px 16px", borderRadius: 14,
              background: "rgba(255,255,255,.72)",
              border: "1px solid rgba(196,166,184,.25)",
              cursor: "pointer",
              textAlign: "left", fontFamily: "var(--font-main)",
            }}
          >
            <span style={{ fontSize: 20 }}>🗂</span>
            <div>
              <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>客厅记录册</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>查看已保存的客厅对话</div>
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

// ─── 客厅列表面板 ───
function LoungeListPanel({ groupChats, groupThreads, characters, activeGroupId, onSelect, onCreate, onDelete, onClose }) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const sorted = [...groupChats].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(74,69,96,.38)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 18px 14px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, color: "#5a4a6a", fontWeight: 500, letterSpacing: 1 }}>☕ 客厅列表</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {/* 列表 */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 12px" }}>
          {sorted.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>☕</div>
              <div style={{ fontSize: 14, color: "#7a6a8e", marginBottom: 6 }}>还没有客厅</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.8, maxWidth: 240, margin: "0 auto" }}>
                可以把几个入住者叫到一起，陪你聊一件事。
              </div>
            </div>
          ) : (
            sorted.map((g) => {
              const thread = groupThreads.find((t) => t.groupId === g.id);
              const msgs = thread?.messages || [];
              const lastMsg = [...msgs].reverse().find((m) => m.role === "user" || m.role === "char");
              const memberChars = (g.memberIds || []).map((id) => characters.find((c) => c.id === id)).filter(Boolean);
              const isActive = g.id === activeGroupId;

              if (deleteConfirmId === g.id) {
                return (
                  <div key={g.id} style={{
                    marginBottom: 8, padding: "14px 16px", borderRadius: 14,
                    background: "rgba(180,100,100,.06)", border: "1px solid rgba(180,100,100,.2)",
                  }}>
                    <div style={{ fontSize: 12, color: "#7a5a5a", lineHeight: 1.75, marginBottom: 12 }}>
                      要删除「{g.name}」吗？客厅里的聊天记录也会一起删除，这个操作不能撤销。
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => { onDelete(g.id); setDeleteConfirmId(null); }}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 10,
                          background: "rgba(180,80,80,.85)", border: "none",
                          color: "white", fontSize: 12, cursor: "pointer",
                          fontFamily: "var(--font-main)",
                        }}
                      >确认删除</button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 10,
                          background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                          color: "#7a6a8e", fontSize: 12, cursor: "pointer",
                          fontFamily: "var(--font-main)",
                        }}
                      >取消</button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={g.id}
                  style={{
                    marginBottom: 8, padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                    background: isActive ? "rgba(120,100,160,.1)" : "rgba(255,255,255,.65)",
                    border: `1px solid ${isActive ? "rgba(120,100,160,.3)" : "rgba(196,166,184,.22)"}`,
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => { onSelect(g.id); onClose(); }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>☕</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>{g.name}</span>
                        {isActive && <span style={{ fontSize: 12, color: "#7a6a8e", background: "rgba(120,100,160,.12)", padding: "1px 6px", borderRadius: 6 }}>进行中</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: lastMsg ? 4 : 0 }}>
                        {memberChars.map((c) => c.emoji || "💜").join(" ")} {memberChars.map((c) => c.name || "ta").join("、")}
                      </div>
                      {lastMsg && (
                        <div style={{ fontSize: 12, color: "#8a7898", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lastMsg.role === "user" ? "你：" : `${lastMsg.authorName}：`}{lastMsg.content?.slice(0, 30)}{(lastMsg.content?.length || 0) > 30 ? "…" : ""}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                        {new Date(g.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {/* 删除按钮 */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(g.id); }}
                      style={{
                        padding: "3px 10px", borderRadius: 8, fontSize: 12,
                        background: "none", border: "1px solid rgba(196,166,184,.3)",
                        color: "var(--text-faint)", cursor: "pointer",
                        fontFamily: "var(--font-main)",
                      }}
                    >删除</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部新建按钮 */}
        <div style={{ padding: "12px 16px calc(16px + env(safe-area-inset-bottom,0px))", borderTop: "1px solid rgba(196,166,184,.15)", flexShrink: 0 }}>
          <button
            onClick={onCreate}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: "rgba(120,100,160,.85)", border: "none",
              color: "white", fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 1,
            }}
          >+ 新建客厅</button>
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
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 4, display: "flex", gap: 6, alignItems: "baseline" }}>
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
              padding: "5px 12px", borderRadius: 10, fontSize: 12,
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
              padding: "5px 12px", borderRadius: 10, fontSize: 12,
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
          <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "right", marginTop: 3 }}>
            {msg.time}
          </div>
          {msg.designatedCharName && (
            <div style={{ textAlign: "right", marginTop: 4 }}>
              <span style={{
                display: "inline-block", fontSize: 12, color: "#8a7898",
                background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.18)",
                borderRadius: 8, padding: "2px 8px", letterSpacing: 0.3,
              }}>
                @ {msg.designatedCharName} 先说
              </span>
            </div>
          )}
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
                padding: "5px 12px", borderRadius: 10, fontSize: 12,
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
              padding: "5px 12px", borderRadius: 10, fontSize: 12,
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
      textAlign: "center", padding: "8px 24px", fontSize: 12,
      color: "var(--text-faint)", letterSpacing: 0.6, lineHeight: 1.7,
    }}>{text}</div>
  );
}

// ─── 轮次分隔线 ───
function RoundDivider({ index }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 16px 12px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.2)" }} />
      <span style={{ fontSize: 12, color: "rgba(196,166,184,.6)", letterSpacing: 1 }}>第 {index} 轮</span>
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
      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{char?.name || "ta"} 正在回复…</span>
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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
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
            <label style={{ fontSize: 12, color: "#7a6a8e", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
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

// ─── 生成客厅原文 markdown ───
function buildRawContent(group, messages, characters) {
  const memberChars = (group.memberIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);
  const memberNames = memberChars.map((c) => c.name || "ta").join("、");
  const date = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

  let md = `# ${group.name} · ${date}\n\n`;
  md += `【成员】\n${memberNames}\n\n`;
  md += `【完整对话】\n\n`;

  for (const msg of messages) {
    if (msg.role === "user") {
      md += `**${msg.authorName || "你"}**：${msg.content}\n\n`;
    } else if (msg.role === "char") {
      md += `**${msg.authorName}**：${msg.content}\n\n`;
    }
  }
  return md.trim();
}

// ─── 整理确认面板 ───
function SettleConfirmPanel({ group, messages, onConfirm, onCancel }) {
  const msgCount = (messages || []).filter((m) => m.role === "user" || m.role === "char").length;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 310,
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
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 18px 14px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
        }}>
          <span style={{ fontSize: 15, color: "#5a4a6a", fontWeight: 500, letterSpacing: 1 }}>📚 整理这次客厅</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: "20px 18px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 预览信息 */}
          <div style={{
            background: "rgba(255,255,255,.65)", border: "1px solid rgba(196,166,184,.22)",
            borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>☕ {group?.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)" }}>共 {msgCount} 条消息</div>
          </div>

          {/* 说明 */}
          <div style={{
            fontSize: 12, color: "#7a6a8e", lineHeight: 1.85,
            padding: "10px 14px", borderRadius: 12,
            background: "rgba(120,100,160,.05)", border: "1px solid rgba(120,100,160,.12)",
          }}>
            这会把本次客厅的完整对话保存进小家客厅记录册。<br />
            不会自动写入长期记忆，也不会影响任何入住者的人格档案。
          </div>

          {msgCount === 0 ? (
            <div style={{ fontSize: 12, color: "#9a7878", textAlign: "center", padding: "8px 0" }}>
              这次客厅还没有消息，没有可以整理的内容~
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: "12px", borderRadius: 14,
                  background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)",
                  color: "#7a6a8e", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >取消</button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 2, padding: "12px", borderRadius: 14,
                  background: "rgba(120,100,160,.85)", border: "none",
                  color: "white", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-main)", letterSpacing: 0.5,
                }}
              >📚 保存到记录册</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 客厅记录册列表 ───
function LoungeRecordListPanel({ loungeRecords, groupChats, onView, onDelete, onClose }) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const sorted = [...loungeRecords].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 310,
        background: "rgba(74,69,96,.38)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 18px 14px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, color: "#5a4a6a", fontWeight: 500, letterSpacing: 1 }}>🗂 客厅记录册</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {/* 列表 */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 24px" }}>
          {sorted.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗂</div>
              <div style={{ fontSize: 14, color: "#7a6a8e", marginBottom: 6 }}>还没有记录</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.85, maxWidth: 240, margin: "0 auto" }}>
                点击客厅更多菜单里的「整理这次客厅」，把当前对话保存进来。
              </div>
            </div>
          ) : (
            sorted.map((rec) => {
              if (deleteConfirmId === rec.id) {
                return (
                  <div key={rec.id} style={{
                    marginBottom: 8, padding: "14px 16px", borderRadius: 14,
                    background: "rgba(180,100,100,.06)", border: "1px solid rgba(180,100,100,.2)",
                  }}>
                    <div style={{ fontSize: 12, color: "#7a5a5a", lineHeight: 1.75, marginBottom: 12 }}>
                      要删除这条记录吗？原文内容将一起删除，无法撤销。
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { onDelete(rec.id); setDeleteConfirmId(null); }} style={{ flex: 1, padding: "9px", borderRadius: 10, background: "rgba(180,80,80,.85)", border: "none", color: "white", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)" }}>确认删除</button>
                      <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: "9px", borderRadius: 10, background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)", color: "#7a6a8e", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)" }}>取消</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={rec.id} style={{
                  marginBottom: 8, borderRadius: 14, overflow: "hidden",
                  background: "rgba(255,255,255,.65)", border: "1px solid rgba(196,166,184,.22)",
                }}>
                  <div
                    style={{ padding: "12px 14px", cursor: "pointer" }}
                    onClick={() => onView(rec)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: "#5a4a6a", fontWeight: 500 }}>
                        📚 {rec.groupName}
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>
                        {new Date(rec.savedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8a7898", marginBottom: 4 }}>
                      {(rec.memberNames || []).join("、")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      {rec.messageCount} 条消息
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 14px 10px", gap: 6 }}>
                    <button
                      onClick={() => onView(rec)}
                      style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.2)", color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)" }}
                    >查看原文</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(rec.id); }}
                      style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(196,166,184,.3)", color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)" }}
                    >删除</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 生成入住者日记（LLM call）───
async function generateOneDiary(char, record, config, ctxConfig, allMemories, userProfile, homeMemory) {
  const model = char.modelOverride?.trim()
    || (config.model === "__custom__" ? config.customModel : config.model)
    || "";
  const charMemories = allMemories?.[char.id] || {};
  const systemBase   = buildSystemPrompt(char, charMemories);
  const userCtx      = buildUserContext(userProfile, char.id, homeMemory);

  // 日记模式覆盖：禁用聊天专用格式指令
  const DIARY_FORMAT_OVERRIDE = `

【当前任务：写日记，不是聊天】
你现在要写一篇私人日记，请完全忽略以下聊天格式规则：
- 不要使用 [心声]...[/心声] 标签，直接把内心感受写进日记正文
- 不要使用 ||| 分隔符，日记是一篇连续的文字
- 不要用对话格式，用第一人称叙述文体写
- 写法自然流畅，像真正写给自己看的私人记录`;

  const system = systemBase + (userCtx ? `\n\n${userCtx}` : "") + DIARY_FORMAT_OVERRIDE;

  const instruction = `以下是这次小家客厅的完整对话记录：

${record.rawContent}

---

请以你（${char.name || "你"}）的视角，写一篇关于这次客厅聚会的短日记。

写作要求：
- 只写你自己的感受、印象和你想记下来的事
- 不要替其他入住者总结或代他们发言
- 不要把未经确认的内容写成永久事实，也不要说"我已经永久记住了"
- 可以写你想珍藏什么、你对声声今天状态的感受、你想以后怎么回应她
- 字数控制在 200-500 字，保持自然的日记语气，像真正写给自己看的私人记录`;

  const resp = await fetch(
    config.apiUrl.replace(/\/+$/, "") + "/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: instruction },
        ],
        temperature: 0.88,
        max_tokens: ctxConfig?.maxTokens ? Math.min(ctxConfig.maxTokens, 1200) : 1200,
      }),
    }
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  return {
    id:         genId(),
    recordId:   record.id,
    charId:     char.id,
    charName:   char.name || "ta",
    title:      `${char.name || "ta"} · 客厅日记`,
    content,
    createdAt:  Date.now(),
    sourceType: "lounge_record",
    sourceId:   record.id,
    status:     "draft",
    canSaveToTreasure: true,
  };
}

// ─── 解析 AI 输出的 JSON（多重兜底）───
function parseDraftOutput(raw) {
  const s = (raw || "").trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  // 逐字段提取数组
  const FIELDS = [
    "charMemorySuggestions", "userProfileSuggestions",
    "relationshipSettlementSuggestions", "timelineSuggestions",
    "treasureSuggestions", "notForLongTermMemory",
  ];
  const result = {};
  let found = false;
  for (const field of FIELDS) {
    const re = new RegExp(`"${field}"\\s*:\\s*(\\[[\\s\\S]*?\\])`, "m");
    const fm = s.match(re);
    if (fm) {
      try { result[field] = JSON.parse(fm[1]); found = true; continue; } catch {}
    }
    result[field] = [];
  }
  return found ? result : null;
}

// ─── 生成记忆沉淀草稿（LLM call）───
async function generateDiaryMemoryDraft(diary, record, config, ctxConfig) {
  const model = (config.model === "__custom__" ? config.customModel : config.model) || "";

  const systemPrompt = `你是一个记忆整理助手，帮助用户从入住者日记中提炼值得保存的内容建议。
你的输出必须是纯 JSON，不要加任何代码块标记（不要写 \`\`\`json）。`;

  const userPrompt = `以下是一次小家客厅记录，以及 ${diary.charName} 为这次客厅写下的日记。

【客厅记录原文】
${record.rawContent}

【${diary.charName} 的客厅日记】
${diary.content}

---

请判断这篇日记中哪些内容值得被提炼成待确认记忆草稿。

注意：
- 不要把日记全文写入长期记忆
- 不要把临时玩笑或当晚氛围误写成永久事实
- 不要替声声自动下定义
- 每条建议简短明确，不超过 80 字
- 只属于这次客厅氛围、玩笑、临时说法的内容，放到 notForLongTermMemory
- 如果某个分区没有建议，留空数组即可

请输出纯 JSON（不要 markdown 代码块），格式如下：
{
  "charMemorySuggestions": [],
  "userProfileSuggestions": [],
  "relationshipSettlementSuggestions": [],
  "timelineSuggestions": [],
  "treasureSuggestions": [],
  "notForLongTermMemory": []
}`;

  const resp = await fetch(
    config.apiUrl.replace(/\/+$/, "") + "/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: ctxConfig?.maxTokens ? Math.min(ctxConfig.maxTokens, 1500) : 1500,
      }),
    }
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() || "";
  const parsed = parseDraftOutput(raw);
  return {
    id:                                genId(),
    diaryId:                           diary.id,
    recordId:                          record.id,
    charId:                            diary.charId,
    charName:                          diary.charName,
    status:                            "pending",
    createdAt:                         Date.now(),
    updatedAt:                         Date.now(),
    charMemorySuggestions:             parsed?.charMemorySuggestions             || [],
    userProfileSuggestions:            parsed?.userProfileSuggestions            || [],
    relationshipSettlementSuggestions: parsed?.relationshipSettlementSuggestions || [],
    timelineSuggestions:               parsed?.timelineSuggestions               || [],
    treasureSuggestions:               parsed?.treasureSuggestions               || [],
    notForLongTermMemory:              parsed?.notForLongTermMemory               || [],
    rawOutput: raw,
  };
}

// ─── 草稿分区定义 ───
const DRAFT_SECTIONS = [
  { key: "charMemorySuggestions",              emoji: "🧠", label: "关于ta应该记住的",  hint: "可进入记忆宫殿" },
  { key: "userProfileSuggestions",             emoji: "👤", label: "关于声声的信息",    hint: "可生成声声档案草稿" },
  { key: "relationshipSettlementSuggestions",  emoji: "💫", label: "关系新默契 / 变化", hint: "可进入关系沉淀草稿" },
  { key: "timelineSuggestions",                emoji: "🕰", label: "值得记到时间线",    hint: "可生成时间线事件" },
  { key: "treasureSuggestions",                emoji: "💎", label: "值得珍藏的原话",    hint: "可保存到宝库" },
  { key: "notForLongTermMemory",               emoji: "🍃", label: "只属于这次客厅",   hint: "不建议写入长期记忆" },
];

// ─── 记忆沉淀草稿面板 ───
function DiaryMemoryDraftPanel({ draft, diary, char, onClose }) {
  const [ignored, setIgnored]           = useState(() => new Set());
  const [copiedSection, setCopiedSection] = useState("");

  const toggleIgnore = (key) => {
    setIgnored((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const copySection = (sectionKey, items) => {
    const lines = items
      .filter((_, i) => !ignored.has(`${sectionKey}-${i}`))
      .map((t) => `• ${t}`)
      .join("\n");
    if (!lines) return;
    navigator.clipboard.writeText(lines).then(() => {
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(""), 2000);
    }).catch(() => {});
  };

  const populated = DRAFT_SECTIONS.filter((s) => (draft[s.key] || []).length > 0);
  const totalCount = populated.reduce((a, s) => a + (draft[s.key] || []).length, 0);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 330,
        background: "rgba(74,69,96,.44)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, height: "88vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                background: "rgba(196,166,184,.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, overflow: "hidden",
              }}>
                {char?.avatarImg
                  ? <img src={char.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : (char?.emoji || "💜")}
              </div>
              <span style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>
                {diary.charName} · 记忆沉淀草稿
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
              共 {totalCount} 条建议 · 草稿状态，不会自动写入任何记忆
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {/* 说明 */}
        <div style={{
          padding: "8px 16px 10px",
          background: "rgba(120,100,160,.04)",
          borderBottom: "1px solid rgba(196,166,184,.1)",
          fontSize: 12, color: "#7a6a8e", lineHeight: 1.8, flexShrink: 0,
        }}>
          以下建议来自 AI 分析，<strong>不会自动写入任何长期记忆</strong>。点"忽略"划掉不需要的条目；点"复制"把建议带到对应功能手动操作。
        </div>

        {/* 各分区 */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 16px" }}>
          {populated.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "var(--text-faint)", lineHeight: 1.9 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>
              这篇日记没有找到值得提炼的内容建议。<br />
              可能这次聊天比较轻松随意，没有需要长期保留的信息。
            </div>
          ) : (
            populated.map((section) => {
              const items = draft[section.key] || [];
              const activeCount = items.filter((_, i) => !ignored.has(`${section.key}-${i}`)).length;
              return (
                <div key={section.key} style={{ marginBottom: 18 }}>
                  {/* 分区标题 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{section.emoji}</span>
                    <span style={{ fontSize: 12, color: "#5a4a6a", fontWeight: 500, flex: 1 }}>{section.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-faint)", marginRight: 4 }}>{section.hint}</span>
                    <button
                      onClick={() => copySection(section.key, items)}
                      disabled={activeCount === 0}
                      style={{
                        padding: "3px 10px", borderRadius: 7, fontSize: 12, flexShrink: 0,
                        background: copiedSection === section.key ? "rgba(120,100,160,.2)" : "rgba(120,100,160,.08)",
                        border: "1px solid rgba(120,100,160,.18)",
                        color: activeCount === 0 ? "var(--text-faint)" : "#6a5a7a",
                        cursor: activeCount === 0 ? "default" : "pointer",
                        fontFamily: "var(--font-main)",
                      }}
                    >
                      {copiedSection === section.key ? "✓ 已复制" : "复制"}
                    </button>
                  </div>
                  {/* 条目列表 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((item, idx) => {
                      const itemKey = `${section.key}-${idx}`;
                      const isIgnored = ignored.has(itemKey);
                      return (
                        <div key={idx} style={{
                          display: "flex", alignItems: "flex-start", gap: 8,
                          padding: "9px 12px", borderRadius: 10,
                          background: isIgnored ? "rgba(196,166,184,.06)" : "rgba(255,255,255,.72)",
                          border: `1px solid ${isIgnored ? "rgba(196,166,184,.15)" : "rgba(196,166,184,.25)"}`,
                          transition: "all .15s",
                        }}>
                          <span style={{
                            flex: 1, fontSize: 12, color: isIgnored ? "var(--text-faint)" : "#3a2e4a",
                            lineHeight: 1.75,
                            textDecoration: isIgnored ? "line-through" : "none",
                          }}>{item}</span>
                          <button
                            onClick={() => toggleIgnore(itemKey)}
                            style={{
                              flexShrink: 0, padding: "3px 9px", borderRadius: 7, fontSize: 12,
                              background: isIgnored ? "rgba(196,166,184,.12)" : "rgba(180,120,120,.08)",
                              border: `1px solid ${isIgnored ? "rgba(196,166,184,.2)" : "rgba(180,120,120,.2)"}`,
                              color: isIgnored ? "var(--text-faint)" : "#9a6a6a",
                              cursor: "pointer", fontFamily: "var(--font-main)",
                            }}
                          >{isIgnored ? "恢复" : "忽略"}</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* 原始输出（折叠查看，调试用）*/}
          {draft.rawOutput && (
            <details style={{ marginTop: 4 }}>
              <summary style={{ fontSize: 12, color: "var(--text-faint)", cursor: "pointer", userSelect: "none" }}>查看 AI 原始输出</summary>
              <pre style={{
                fontSize: 12, color: "#7a6a8e", lineHeight: 1.6, marginTop: 6,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                padding: "10px", borderRadius: 8,
                background: "rgba(255,255,255,.5)", border: "1px solid rgba(196,166,184,.18)",
              }}>{draft.rawOutput}</pre>
            </details>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: "12px 16px calc(16px + env(safe-area-inset-bottom,0px))",
          borderTop: "1px solid rgba(196,166,184,.15)", flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "12px", borderRadius: 14,
              background: "rgba(120,100,160,.85)", border: "none",
              color: "white", fontSize: 13, cursor: "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 0.5,
            }}
          >收好了</button>
        </div>
      </div>
    </div>
  );
}

// ─── 日记卡 ───
function DiaryCard({ diary, char, onSaveToTreasure, onSaveToCharTreasure, onDelete, onGenerateDraft, onViewDraft, isGeneratingDraft }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState("");

  const handleSave = () => {
    onSaveToTreasure?.();
    setSavedFeedback("💎 已保存到我的宝库");
    setTimeout(() => setSavedFeedback(""), 2200);
  };

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      background: "rgba(255,255,255,.72)",
      border: "1px solid rgba(196,166,184,.22)",
      marginBottom: 12,
    }}>
      {/* 日记头 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px 8px",
        borderBottom: "1px solid rgba(196,166,184,.12)",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 10, flexShrink: 0,
          background: "rgba(196,166,184,.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, overflow: "hidden",
          border: "1px solid rgba(196,166,184,.25)",
        }}>
          {char?.avatarImg
            ? <img src={char.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : (char?.emoji || "💜")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#5a4a6a", fontWeight: 500 }}>{diary.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
            {new Date(diary.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <span style={{
          fontSize: 12, color: "#8a7898", padding: "2px 7px",
          background: "rgba(120,100,160,.08)", border: "1px solid rgba(120,100,160,.15)",
          borderRadius: 6,
        }}>草稿</span>
      </div>

      {/* 日记内容 */}
      <div style={{ padding: "12px 14px", fontSize: 13, color: "#3a2e4a", lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {diary.content}
      </div>

      {/* 提炼记忆草稿入口 */}
      {!deleteConfirm && (
        <div style={{ padding: "0 14px 8px" }}>
          <button
            onClick={diary.memoryDraft ? onViewDraft : onGenerateDraft}
            disabled={isGeneratingDraft}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 12,
              background: diary.memoryDraft
                ? "rgba(120,100,160,.1)"
                : isGeneratingDraft
                  ? "rgba(196,166,184,.1)"
                  : "rgba(255,244,180,.55)",
              border: `1px solid ${diary.memoryDraft
                ? "rgba(120,100,160,.22)"
                : isGeneratingDraft
                  ? "rgba(196,166,184,.2)"
                  : "rgba(200,180,80,.3)"}`,
              color: isGeneratingDraft ? "var(--text-faint)" : "#5a4a5a",
              cursor: isGeneratingDraft ? "default" : "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 0.3, textAlign: "left",
              transition: "all .15s",
            }}
          >
            {isGeneratingDraft
              ? "💡 正在提炼记忆建议…"
              : diary.memoryDraft
                ? "💡 查看记忆草稿"
                : "💡 看看有什么值得记住"}
          </button>
        </div>
      )}

      {/* 操作行 */}
      {deleteConfirm ? (
        <div style={{ padding: "8px 14px 12px", display: "flex", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#7a5a5a", flex: 1, alignSelf: "center" }}>确认删除这篇日记？</div>
          <button onClick={() => { onDelete(); setDeleteConfirm(false); }} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, background: "rgba(180,80,80,.85)", border: "none", color: "white", cursor: "pointer", fontFamily: "var(--font-main)" }}>删除</button>
          <button onClick={() => setDeleteConfirm(false)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,.7)", border: "1px solid rgba(196,166,184,.3)", color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)" }}>取消</button>
        </div>
      ) : (
        <div style={{ padding: "4px 14px 12px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {savedFeedback ? (
            <span style={{ fontSize: 12, color: "#7a6a8e" }}>{savedFeedback}</span>
          ) : (
            <button onClick={handleSave} style={{ padding: "5px 12px", borderRadius: 9, fontSize: 12, background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.2)", color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)" }}>
              💎 保存到我的宝库
            </button>
          )}
          <button
            disabled
            title="他的宝库还在准备中"
            style={{ padding: "5px 12px", borderRadius: 9, fontSize: 12, background: "rgba(196,166,184,.08)", border: "1px solid rgba(196,166,184,.2)", color: "var(--text-faint)", cursor: "not-allowed", fontFamily: "var(--font-main)" }}
          >
            💝 他的宝库（稍后开放）
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setDeleteConfirm(true)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(196,166,184,.25)", color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-main)" }}>删除</button>
        </div>
      )}
    </div>
  );
}

// ─── 客厅记录详情（增强版：含日记生成）───
function LoungeRecordDetailPanel({
  record,
  characters,
  config,
  ctxConfig,
  allMemories,
  userProfile,
  homeMemory,
  onSaveTreasure,
  onAddCharTreasure,
  onUpdateRecord,
  onClose,
}) {
  const [copied, setCopied]               = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [currentGenChar, setCurrentGenChar] = useState(null);
  const [genError, setGenError]           = useState("");
  const [diaryFeedback, setDiaryFeedback] = useState("");
  const [showRaw, setShowRaw]             = useState(false);
  // ── 记忆草稿 ──
  const [generatingDraftForId, setGeneratingDraftForId] = useState(null);
  const [viewingDraft, setViewingDraft]   = useState(null); // { diary, draft }

  const memberChars = (record.memberIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);
  const diaries = record.diaries || [];

  // 自动隐藏 toast
  useEffect(() => {
    if (!diaryFeedback) return;
    const t = setTimeout(() => setDiaryFeedback(""), 2200);
    return () => clearTimeout(t);
  }, [diaryFeedback]);

  const handleCopy = () => {
    navigator.clipboard.writeText(record.rawContent || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  // 为全部入住者生成日记
  const handleGenerateAll = async () => {
    if (!config?.apiUrl?.trim() || !config?.apiKey?.trim()) {
      setGenError("请先配置 API 地址和密钥"); return;
    }
    setGenerating(true);
    setGenError("");
    const newDiaries = [];

    for (const char of memberChars) {
      setCurrentGenChar(char);
      try {
        const d = await generateOneDiary(char, record, config, ctxConfig, allMemories, userProfile, homeMemory);
        newDiaries.push(d);
      } catch (err) {
        setGenError(`${char.name || "ta"} 生成失败：${err.message}`);
      }
    }

    setCurrentGenChar(null);
    setGenerating(false);
    if (newDiaries.length > 0) {
      onUpdateRecord?.({ ...record, diaries: [...diaries, ...newDiaries] });
      // 同步保存到中央日记本（ResidentJournal）
      if (onSaveJournal) {
        const savedAt = record.savedAt || Date.now();
        const dateStr = new Date(savedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
        newDiaries.forEach((diary) => {
          onSaveJournal({
            ...diary,
            sourceTitle: `客厅 · ${record.groupName} · ${dateStr}`,
            updatedAt:   diary.createdAt,
            status:      "saved",
            visibility:  "private_to_char",
            canUseForMemory: false,
            memoryDraftIds: [],
            treasureIds:    [],
            tags:           [],
            mood:           "",
            important:      false,
            memoryDraft:    null,
          });
        });
      }
    }
  };

  // 删除单篇日记
  const handleDeleteDiary = (diaryId) => {
    onUpdateRecord?.({ ...record, diaries: diaries.filter((d) => d.id !== diaryId) });
  };

  // 把日记保存到我的宝库
  const handleSaveDiaryToTreasure = (diary) => {
    onSaveTreasure?.({
      id:         genId(),
      title:      diary.title,
      content:    diary.content,
      type:       "diary",
      charId:     diary.charId,
      charName:   diary.charName,
      important:  false,
      tags:       ["客厅日记"],
      note:       "",
      createdAt:  Date.now(),
      updatedAt:  Date.now(),
      sourceRefs: [buildSourceRef({
        sourceType:  "resident_diary",
        sourceId:    diary.id,
        sourceTitle: diary.title,
        excerpt:     (diary.content || "").slice(0, 80),
      })],
    });
    setDiaryFeedback("💎 已保存到我的宝库");
  };

  // 为单篇日记生成记忆沉淀草稿
  const handleGenerateDraftForDiary = async (diary) => {
    if (!config?.apiUrl?.trim() || !config?.apiKey?.trim()) {
      setGenError("请先配置 API 地址和密钥"); return;
    }
    setGeneratingDraftForId(diary.id);
    setGenError("");
    try {
      const draft = await generateDiaryMemoryDraft(diary, record, config, ctxConfig);
      const updatedDiaries = (record.diaries || []).map((d) =>
        d.id === diary.id ? { ...d, memoryDraft: draft } : d
      );
      const updatedRecord = { ...record, diaries: updatedDiaries };
      onUpdateRecord?.(updatedRecord);
      const updatedDiary = updatedDiaries.find((d) => d.id === diary.id);
      setViewingDraft({ diary: updatedDiary, draft });
    } catch (err) {
      setGenError(`记忆草稿生成失败：${err.message}`);
    } finally {
      setGeneratingDraftForId(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 320,
        background: "rgba(74,69,96,.42)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, height: "90vh",
        background: "linear-gradient(160deg, #f4f0fa 0%, #ece5f5 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 -8px 40px rgba(74,69,96,.22)",
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(196,166,184,.2)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, color: "#5a4a6a", fontWeight: 500 }}>📚 {record.groupName}</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
              {(record.memberNames || []).join("、")} · {record.messageCount} 条 · {new Date(record.savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}整理
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9a8aac", padding: 4 }}>✕</button>
        </div>

        {/* 操作栏 */}
        <div style={{
          display: "flex", gap: 8, padding: "10px 16px",
          borderBottom: "1px solid rgba(196,166,184,.12)",
          flexShrink: 0, alignItems: "center",
        }}>
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12,
              background: copied ? "rgba(120,100,160,.2)" : "rgba(120,100,160,.1)",
              border: "1px solid rgba(120,100,160,.22)",
              color: "#6a5a7a", cursor: "pointer", fontFamily: "var(--font-main)",
            }}
          >
            {copied ? "✓ 已复制" : "复制全文"}
          </button>
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12,
              background: generating ? "rgba(196,166,184,.15)" : "rgba(120,100,160,.88)",
              border: "none",
              color: generating ? "#9a8aac" : "white",
              cursor: generating ? "default" : "pointer",
              fontFamily: "var(--font-main)", letterSpacing: 0.3,
              transition: "all .15s",
            }}
          >
            {generating ? `${currentGenChar?.name || "…"} 正在写…` : "📓 生成入住者日记"}
          </button>
          {diaryFeedback && (
            <span style={{ fontSize: 12, color: "#7a6a8e", marginLeft: 2 }}>{diaryFeedback}</span>
          )}
        </div>

        {/* 错误提示 */}
        {genError && (
          <div style={{
            padding: "6px 16px", fontSize: 12, color: "#9a5050",
            background: "rgba(200,140,140,.08)", borderBottom: "1px solid rgba(200,140,140,.12)",
            flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ flex: 1 }}>{genError}</span>
            <button onClick={() => setGenError("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9a5050", padding: 0 }}>✕</button>
          </div>
        )}

        {/* 主体：日记 + 原文 */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 32px" }}>

          {/* ── 他们的日记 ── */}
          {diaries.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 12, color: "#8a7898", letterSpacing: 1,
                marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
                他们的日记
                <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
              </div>
              {diaries.map((diary) => {
                const char = characters.find((c) => c.id === diary.charId);
                return (
                  <DiaryCard
                    key={diary.id}
                    diary={diary}
                    char={char}
                    onSaveToTreasure={() => handleSaveDiaryToTreasure(diary)}
                    onSaveToCharTreasure={null}
                    onDelete={() => handleDeleteDiary(diary.id)}
                    onGenerateDraft={() => handleGenerateDraftForDiary(diary)}
                    onViewDraft={() => setViewingDraft({ diary, draft: diary.memoryDraft })}
                    isGeneratingDraft={generatingDraftForId === diary.id}
                  />
                );
              })}
            </div>
          )}

          {/* 生成进度占位 */}
          {generating && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", marginBottom: 14,
              background: "rgba(255,255,255,.6)", borderRadius: 14,
              border: "1px solid rgba(196,166,184,.2)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                background: "rgba(196,166,184,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                {currentGenChar?.avatarImg
                  ? <img src={currentGenChar.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} alt="" />
                  : (currentGenChar?.emoji || "💜")}
              </div>
              <div className="typing-indicator" style={{ background: "rgba(255,255,255,.75)", border: "1px solid rgba(196,166,184,.22)", gap: 3, padding: "6px 10px" }}>
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {currentGenChar?.name || "ta"} 正在写日记…
              </span>
            </div>
          )}

          {/* ── 完整对话原文（可折叠）── */}
          <div>
            <button
              onClick={() => setShowRaw((v) => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 0", marginBottom: showRaw ? 10 : 0,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
              <span style={{ fontSize: 12, color: "#8a7898", letterSpacing: 1, whiteSpace: "nowrap" }}>
                {showRaw ? "▲ 收起原文" : "▼ 查看完整对话"}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(196,166,184,.25)" }} />
            </button>
            {showRaw && (
              <pre style={{
                fontSize: 12, color: "#3a2e4a", lineHeight: 1.9,
                fontFamily: "var(--font-main)",
                whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                background: "rgba(255,255,255,.55)", borderRadius: 12,
                padding: "14px 16px", border: "1px solid rgba(196,166,184,.18)",
              }}>
                {record.rawContent || "（无内容）"}
              </pre>
            )}
          </div>

          {/* 空态提示（既无日记也没生成中）*/}
          {diaries.length === 0 && !generating && (
            <div style={{
              textAlign: "center", padding: "32px 16px",
              fontSize: 12, color: "var(--text-faint)", lineHeight: 1.9,
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📓</div>
              点击上方「生成入住者日记」，<br />
              让每位入住者用自己的视角记下这次客厅。
            </div>
          )}
        </div>
      </div>

      {/* 记忆草稿面板 */}
      {viewingDraft && (
        <DiaryMemoryDraftPanel
          draft={viewingDraft.draft}
          diary={viewingDraft.diary}
          char={characters.find((c) => c.id === viewingDraft.diary.charId)}
          onClose={() => setViewingDraft(null)}
        />
      )}
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
  // 客厅记录册
  loungeRecords = [],
  setLoungeRecords,
  // 他的日记（中央日记本）
  onSaveJournal,
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
  const [designatedCharId, setDesignatedCharId] = useState(null); // P1-1 指定先说
  const [showAtPicker, setShowAtPicker]   = useState(false);
  // ── 客厅记录册 ──
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [showRecordList, setShowRecordList] = useState(false);
  const [viewRecord, setViewRecord]       = useState(null); // LoungeRecord 详情

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

  const callCharLLM = async (char, historyMessages, userMsg, alreadyReplied, isDesignated = false) => {
    const model = getModel(char.modelOverride);
    if (!model || !config.apiUrl?.trim() || !config.apiKey?.trim()) {
      throw new Error("API 未配置");
    }

    const charMemories = allMemories[char.id] || {};
    const systemBase   = buildSystemPrompt(char, charMemories);
    const userCtx      = buildUserContext(userProfile, char.id, homeMemory);
    const designatedNote = isDesignated
      ? "\n\n用户指定你先回应这句话。"
      : alreadyReplied.length > 0
        ? "\n\n你已经看到前面成员的回复，请接着回应。不要替别人说话。"
        : "";
    const system       = systemBase + (userCtx ? `\n\n${userCtx}` : "") + GROUP_SYSTEM_ADDITION + designatedNote;
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
    const { parts } = parseResponse(raw, "chat");
    return parts.length > 0 ? parts : ["…"];
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

    // P1-1：计算本轮发言顺序（指定者第一，其余按原顺序）
    const designatedChar = designatedCharId
      ? characters.find((c) => c.id === designatedCharId)
      : null;
    const orderedIds = designatedCharId && group.memberIds.includes(designatedCharId)
      ? [designatedCharId, ...group.memberIds.filter((id) => id !== designatedCharId)]
      : [...group.memberIds];
    setDesignatedCharId(null);
    setShowAtPicker(false);

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
      designatedCharName: designatedChar?.name || null,
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

    for (const charId of orderedIds) {
      if (roundAbortRef.current) break;

      const char = characters.find((c) => c.id === charId);
      if (!char) continue;

      setCurrentSpeaker(charId);

      try {
        const historyForContext = liveMessagesRef.current.filter(
          (m) => !(m.id === userMsg.id)
        );
        const isDesignated = charId === designatedChar?.id;
        const parts = await callCharLLM(char, historyForContext, userMsg, repliedThisRound, isDesignated);

        if (roundAbortRef.current) break;

        // 多条分发：||| 拆开的每段作为独立气泡
        const firstMsg = {
          id:         genId(),
          role:       "char",
          charId,
          authorName: char.name || "入住者",
          content:    parts[0],
          createdAt:  Date.now(),
          time:       timeStr(),
          roundIndex,
          sourceRefs: [
            buildSourceRef({
              sourceType:  "group_chat",
              sourceId:    charId,
              sourceTitle: char.name || "入住者",
              excerpt:     parts[0].slice(0, 80),
            }),
          ],
        };
        appendMessage(firstMsg);
        repliedThisRound.push(firstMsg);

        // 追加后续分条（不重复计入 repliedThisRound）
        for (let pi = 1; pi < parts.length; pi++) {
          if (roundAbortRef.current) break;
          appendMessage({
            id:         genId(),
            role:       "char",
            charId,
            authorName: char.name || "入住者",
            content:    parts[pi],
            createdAt:  Date.now(),
            time:       timeStr(),
            roundIndex,
            sourceRefs: [],
          });
        }
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
  const handleCreate = ({ name, memberIds, topic }) => {
    const now  = Date.now();
    const gId  = genId();
    const tId  = genId();
    const newGroup = {
      id: gId, name, memberIds, topic: topic || "",
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

  // ── 删除客厅 ──
  const handleDeleteGroup = (groupId) => {
    setGroupChats((prev) => prev.filter((g) => g.id !== groupId));
    setGroupThreads((prev) => prev.filter((t) => t.groupId !== groupId));
    if (activeGroupId === groupId) {
      onSelectGroup?.(null);
    }
    setShowGroupList(false);
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

  // ── 整理这次客厅（旧 AI 生成，保留备用）──
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

  // ── 保存到客厅记录册 ──
  const handleSettleConfirm = () => {
    if (!group || !thread || !setLoungeRecords) return;
    const memberChars = (group.memberIds || [])
      .map((id) => characters.find((c) => c.id === id))
      .filter(Boolean);
    const rawContent = buildRawContent(group, messages, characters);
    const record = {
      id:               genId(),
      groupId:          group.id,
      groupName:        group.name,
      memberIds:        group.memberIds,
      memberNames:      memberChars.map((c) => c.name || "ta"),
      createdAt:        group.createdAt,
      savedAt:          Date.now(),
      messageCount:     messages.filter((m) => m.role === "user" || m.role === "char").length,
      rawContent,
      sourceMessageIds: messages.map((m) => m.id),
      status:           "saved",
      derivedDraftIds:  [],
      diaryIds:         [],
      treasureIds:      [],
    };
    setLoungeRecords((prev) => [...prev, record]);
    setShowSettleConfirm(false);
    setShowMoreMenu(false);
    setActionFeedback("📚 已保存到客厅记录册");
  };

  // ── 删除记录 ──
  const handleDeleteRecord = (recordId) => {
    setLoungeRecords((prev) => prev.filter((r) => r.id !== recordId));
    if (viewRecord?.id === recordId) setViewRecord(null);
  };

  // ── 更新记录（含日记）──
  const handleUpdateRecord = useCallback((updatedRecord) => {
    setLoungeRecords((prev) => prev.map((r) => r.id === updatedRecord.id ? updatedRecord : r));
    setViewRecord(updatedRecord);
  }, [setLoungeRecords]);

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
        <div style={{ position: "absolute", inset: 0, background: "rgba(240,230,215,.62)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "18px 16px 14px",
          borderBottom: "1px solid rgba(200,185,160,.3)",
          background: "rgba(248,242,232,.92)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          flexShrink: 0,
        }}>
          <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />
          <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#3a2a1a", letterSpacing: 2 }}>
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
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8, letterSpacing: 0.5 }}>或者选择已有客厅</div>
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
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{g.memberIds.length} 位入住者</div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>→</span>
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

        {/* 记录册入口（空态也可查看） */}
        {loungeRecords.length > 0 && (
          <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
            <button
              onClick={() => setShowRecordList(true)}
              style={{
                padding: "9px 20px", borderRadius: 12, fontSize: 12,
                background: "rgba(255,255,255,.65)", border: "1px solid rgba(196,166,184,.25)",
                color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)",
              }}
            >
              🗂 客厅记录册 · {loungeRecords.length} 条
            </button>
          </div>
        )}

        {/* 记录册列表（空态下） */}
        {showRecordList && (
          <LoungeRecordListPanel
            loungeRecords={loungeRecords}
            groupChats={groupChats}
            onView={(rec) => setViewRecord(rec)}
            onDelete={handleDeleteRecord}
            onClose={() => setShowRecordList(false)}
          />
        )}
        {viewRecord && (
          <LoungeRecordDetailPanel
            record={viewRecord}
            characters={characters}
            config={config}
            ctxConfig={ctxConfig}
            allMemories={allMemories}
            userProfile={userProfile}
            homeMemory={homeMemory}
            onSaveTreasure={onSaveTreasure}
            onAddCharTreasure={onAddCharTreasure}
            onUpdateRecord={handleUpdateRecord}
            onClose={() => setViewRecord(null)}
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
      {/* 遮罩：轻米色半透明，不压背景图 */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(240,230,215,.45)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── 顶栏 ── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(200,185,160,.3)",
          background: "rgba(248,242,232,.92)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#3a2a1a", letterSpacing: 1 }}>
            ☕ {group.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            {members.map((char) => (
              <div key={char.id} style={{
                width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                background: "rgba(196,166,184,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, overflow: "hidden",
                border: "1px solid rgba(196,166,184,.3)",
              }}>
                {char.avatarImg
                  ? <img src={char.avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : (char.emoji || "💜")}
              </div>
            ))}
            <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: 2 }}>
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
            borderRadius: 10, padding: "5px 10px", fontSize: 12,
            color: "#7a6a8e", cursor: "pointer", fontFamily: "var(--font-main)", flexShrink: 0,
          }}
        >
          客厅列表
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
          padding: "6px 16px", fontSize: 12, color: "#9a5050",
          background: "rgba(200,140,140,.08)", borderTop: "1px solid rgba(200,140,140,.12)",
          flexShrink: 0, textAlign: "center",
        }}>
          {sendError}
          <button
            onClick={() => setSendError("")}
            style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9a5050", padding: 0 }}
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* @ 成员选择器 */}
        {showAtPicker && (
          <div style={{
            padding: "8px 12px 6px",
            display: "flex", gap: 8, flexWrap: "wrap",
            borderBottom: "1px solid rgba(196,166,184,.15)",
          }}>
            {members.map((char) => {
              const isSelected = designatedCharId === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => {
                    setDesignatedCharId(isSelected ? null : char.id);
                    setShowAtPicker(false);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                    background: isSelected ? "rgba(120,100,160,.2)" : "rgba(255,255,255,.75)",
                    border: `1px solid ${isSelected ? "rgba(120,100,160,.4)" : "rgba(196,166,184,.3)"}`,
                    fontSize: 12, color: isSelected ? "#5a4a6a" : "#7a6a8e",
                    transition: "all .15s",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{char.emoji || "💜"}</span>
                  {char.name || "ta"}
                </div>
              );
            })}
            {designatedCharId && (
              <div
                onClick={() => { setDesignatedCharId(null); setShowAtPicker(false); }}
                style={{
                  padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                  background: "rgba(196,166,184,.12)",
                  border: "1px solid rgba(196,166,184,.25)",
                  fontSize: 12, color: "var(--text-faint)",
                }}
              >
                取消指定
              </div>
            )}
          </div>
        )}

        {/* 已指定提示条 */}
        {designatedCharId && !showAtPicker && (
          <div style={{ padding: "5px 14px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 12, color: "#8a7898",
              background: "rgba(120,100,160,.1)", border: "1px solid rgba(120,100,160,.18)",
              borderRadius: 8, padding: "2px 8px", letterSpacing: 0.3,
            }}>
              @ {members.find((c) => c.id === designatedCharId)?.name || "ta"} 先说
            </span>
            <button
              onClick={() => setDesignatedCharId(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-faint)", padding: 0 }}
            >✕</button>
          </div>
        )}

        {/* 输入行 */}
        <div style={{
          padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
          display: "flex", alignItems: "flex-end", gap: 8,
        }}>
          {/* @ 按钮 */}
          <button
            onClick={() => setShowAtPicker((v) => !v)}
            disabled={isProcessing}
            title="指定先说"
            style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 12,
              background: designatedCharId ? "rgba(120,100,160,.22)" : "rgba(196,166,184,.18)",
              border: `1px solid ${designatedCharId ? "rgba(120,100,160,.35)" : "rgba(196,166,184,.28)"}`,
              color: designatedCharId ? "#5a4a6a" : "#9a8aac",
              fontSize: 15, cursor: isProcessing ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-main)",
              opacity: isProcessing ? 0.5 : 1,
              transition: "all .15s",
            }}
          >
            @
          </button>

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
              fontSize: "max(16px, 14px)", color: "#3a2e4a", lineHeight: 1.6,
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
      </div>

      {/* ── 切换/新建群聊面板 ── */}
      {showGroupList && (
        <LoungeListPanel
          groupChats={groupChats}
          groupThreads={groupThreads}
          characters={characters}
          activeGroupId={activeGroupId}
          onSelect={(id) => { onSelectGroup?.(id); setShowGroupList(false); }}
          onCreate={() => { setShowGroupList(false); setShowCreate(true); }}
          onDelete={handleDeleteGroup}
          onClose={() => setShowGroupList(false)}
        />
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
          onClose={() => setShowMoreMenu(false)}
          onSettle={() => { setShowMoreMenu(false); setShowSettleConfirm(true); }}
          onViewRecords={() => { setShowMoreMenu(false); setShowRecordList(true); }}
        />
      )}

      {/* 整理确认面板 */}
      {showSettleConfirm && (
        <SettleConfirmPanel
          group={group}
          messages={messages}
          onConfirm={handleSettleConfirm}
          onCancel={() => setShowSettleConfirm(false)}
        />
      )}

      {/* 客厅记录册列表 */}
      {showRecordList && (
        <LoungeRecordListPanel
          loungeRecords={loungeRecords}
          groupChats={groupChats}
          onView={(rec) => { setViewRecord(rec); }}
          onDelete={handleDeleteRecord}
          onClose={() => setShowRecordList(false)}
        />
      )}

      {/* 记录详情 */}
      {viewRecord && (
        <LoungeRecordDetailPanel
          record={viewRecord}
          characters={characters}
          config={config}
          ctxConfig={ctxConfig}
          allMemories={allMemories}
          userProfile={userProfile}
          homeMemory={homeMemory}
          onSaveTreasure={onSaveTreasure}
          onAddCharTreasure={onAddCharTreasure}
          onUpdateRecord={handleUpdateRecord}
          onClose={() => setViewRecord(null)}
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
