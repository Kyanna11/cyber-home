// ─── 日记页 ───
// 写日记、查看历史、分享给指定角色

import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

export default function DiaryPage({
  navigateTo,
  diaryText,
  setDiaryText,
  diaryEntries,
  handleSaveDiary,
  diaryToShare,
  setDiaryToShare,
  characters,
  shareDiaryToChat,
}) {
  return (
    <>
      <div className="diary-page page-fade">
        <div className="diary-header">
          <BackButton onClick={() => navigateTo("bedroom")} label="回房间" />
          <div className="diary-header-title">📔 我的日记</div>
          <div className="diary-header-spacer" />
        </div>

        <div className="diary-content">
          {/* 写日记区 */}
          <div className="diary-write-area">
            <textarea
              className="diary-textarea"
              placeholder="今天想写点什么……"
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
            />
            <button
              className="diary-save-btn"
              onClick={handleSaveDiary}
              disabled={!diaryText.trim()}
            >
              写好了，收起来
            </button>
          </div>

          {/* 日记列表 */}
          <div className="diary-entries">
            {diaryEntries.length === 0 ? (
              <div className="diary-empty">
                还没有写过日记呢
                <br />
                在这里记下你的心情吧
              </div>
            ) : (
              diaryEntries.map((entry, i) => (
                <div key={i} className="diary-entry">
                  <div className="diary-entry-date">
                    {entry.date} {entry.time}
                  </div>
                  <div className="diary-entry-text">{entry.text}</div>
                  {/* 📤 分享按钮 */}
                  <div style={{ marginTop: 10, textAlign: "right" }}>
                    <button
                      onClick={() => setDiaryToShare(entry)}
                      style={{
                        background: "none",
                        border: "1px solid rgba(155,149,181,.15)",
                        borderRadius: 10,
                        padding: "5px 14px",
                        fontSize: 12,
                        color: "var(--text-mid)",
                        cursor: "pointer",
                        fontFamily: "var(--font-main)",
                        letterSpacing: 1,
                        transition: "all .2s",
                      }}
                    >
                      📤 分享给ta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 📤 分享日记 - 选角色弹窗 */}
      {diaryToShare && (
        <div
          className="del-confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDiaryToShare(null);
          }}
        >
          <div className="char-panel" style={{ maxWidth: 360 }}>
            <div className="char-panel-title">📔 分享日记给谁？</div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(155,149,181,.04)",
                border: "1px solid rgba(155,149,181,.08)",
                marginBottom: 16,
                fontSize: 13,
                color: "var(--text-mid)",
                lineHeight: 1.7,
                maxHeight: 80,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  marginBottom: 4,
                }}
              >
                📅 {diaryToShare.date}
              </div>
              {diaryToShare.text.length > 60
                ? diaryToShare.text.slice(0, 60) + "……"
                : diaryToShare.text}
            </div>

            {characters.length === 0 && (
              <div
                style={{
                  padding: "16px 0",
                  color: "var(--text-faint)",
                  fontSize: 13,
                  lineHeight: 1.8,
                  textAlign: "center",
                }}
              >
                还没有成员呢
                <br />
                先去添加一位吧
              </div>
            )}

            {characters.map((char) => (
              <div
                key={char.id}
                className="char-card"
                onClick={() => shareDiaryToChat(char.id)}
              >
                <Avatar char={char} size={42} radius={14} fontSize={20} />
                <div className="char-info">
                  <div className="char-name">{char.name || "未命名"}</div>
                  <div className="char-relation">{char.relation || ""}</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  📤
                </span>
              </div>
            ))}

            <button
              className="char-close"
              onClick={() => setDiaryToShare(null)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}
