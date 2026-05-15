// ─── 我的档案覆层 ───
// 全局用户档案：核心信息、共享档案库

import BackButton from "../components/BackButton";
import { USER_PROFILE_FIELDS } from "../constants";
import { genId } from "../utils/helpers";

export default function MyProfilePage({
  setShowMyProfile,
  userProfile,
  setUserProfile,
  characters,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background:
          "linear-gradient(170deg,#f0eaf3 0%,#f4eff5 50%,#f7f2f5 100%)",
        overflowY: "auto",
        animation: "pageFade .3s ease-out",
      }}
    >
      {/* 顶栏 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding:
            "calc(16px + env(safe-area-inset-top, 0px)) 20px 16px",
          background: "rgba(244,239,245,.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(232,196,196,.08)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <BackButton onClick={() => setShowMyProfile(false)} label="返回" />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 3,
          }}
        >
          👤 我的档案
        </div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ padding: "20px 16px", paddingBottom: 120 }}>
        {/* ── 第1层：核心信息 ── */}
        <div className="section-card">
          <div className="section-title">
            <span>🌍</span> 核心信息
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
              marginBottom: 18,
              lineHeight: 1.7,
            }}
          >
            所有角色都会知道这些，ta们一出场就认识你～
          </div>

          {USER_PROFILE_FIELDS.map((field) => (
            <div key={field.key} className="field-group">
              <label className="field-label">{field.label}</label>
              <input
                className="field-input"
                placeholder={field.placeholder}
                value={userProfile.globalFacts[field.key] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserProfile((prev) => ({
                    ...prev,
                    globalFacts: { ...prev.globalFacts, [field.key]: val },
                  }));
                }}
              />
            </div>
          ))}
        </div>

        {/* ── 第2层：共享档案库 ── */}
        <div className="section-card">
          <div className="section-title">
            <span>📂</span> 共享档案库
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
              marginBottom: 18,
              lineHeight: 1.7,
            }}
          >
            写一次就好，勾选决定谁能看到～
          </div>

          {userProfile.sharedVault.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                padding: 16,
                borderRadius: 14,
                background: "rgba(255,255,255,.5)",
                border: "1px solid var(--card-border)",
                marginBottom: 12,
              }}
            >
              <textarea
                className="field-textarea"
                placeholder="写点什么...比如「我小时候在乡下长大」"
                value={entry.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserProfile((prev) => ({
                    ...prev,
                    sharedVault: prev.sharedVault.map((v, i) =>
                      i === idx ? { ...v, content: val } : v,
                    ),
                  }));
                }}
                style={{ minHeight: 60 }}
              />

              {/* 角色勾选 */}
              {characters.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-faint)",
                      marginRight: 2,
                    }}
                  >
                    谁能看：
                  </span>
                  {characters.map((c) => {
                    const checked = (entry.allowedChars || []).includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setUserProfile((prev) => ({
                            ...prev,
                            sharedVault: prev.sharedVault.map((v, i) => {
                              if (i !== idx) return v;
                              const allowed = v.allowedChars || [];
                              return {
                                ...v,
                                allowedChars: checked
                                  ? allowed.filter((id) => id !== c.id)
                                  : [...allowed, c.id],
                              };
                            }),
                          }));
                        }}
                        style={{
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px",
                          borderRadius: 10,
                          background: checked
                            ? "rgba(168,206,178,.15)"
                            : "rgba(155,149,181,.06)",
                          border: `1px solid ${checked ? "rgba(168,206,178,.3)" : "rgba(155,149,181,.1)"}`,
                          cursor: "pointer",
                          transition: "all .2s",
                        }}
                      >
                        <span>{checked ? "✅" : "⬜"}</span>
                        <span>{c.name || "未命名"}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 删除 */}
              <div style={{ textAlign: "right", marginTop: 10 }}>
                <button
                  className="btn-danger"
                  onClick={() => {
                    setUserProfile((prev) => ({
                      ...prev,
                      sharedVault: prev.sharedVault.filter(
                        (_, i) => i !== idx,
                      ),
                    }));
                  }}
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))}

          {/* 添加按钮 */}
          <button
            className="add-char-btn"
            onClick={() => {
              setUserProfile((prev) => ({
                ...prev,
                sharedVault: [
                  ...prev.sharedVault,
                  {
                    id: genId(),
                    content: "",
                    allowedChars: characters.map((c) => c.id),
                  },
                ],
              }));
            }}
          >
            <span style={{ fontSize: 18 }}>+</span> 添加一条
          </button>
        </div>

        {/* ── 第3层提示 ── */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(168,206,178,.06)",
            border: "1px solid rgba(168,206,178,.15)",
            fontSize: 12,
            color: "var(--text-mid)",
            lineHeight: 1.8,
          }}
        >
          <div style={{ fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
            🤫 专属私语层
          </div>
          第三层是你和每个角色之间的专属记忆，由「记忆宫殿」自动维护。
          那些只有ta知道的秘密、你们之间的共同经历……都在聊天中自然生长，不需要手动管理哦～
        </div>
      </div>
    </div>
  );
}
