// ─── 成员档案列表页 ───
// 展示所有角色卡片，可以新建角色

import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";

export default function ProfilesPage({
  characters,
  prevPage,
  navigateTo,
  openProfileEdit,
  createChar,
}) {
  return (
    <div className="profiles-page page-fade">
      <div className="profiles-header">
        <BackButton
          onClick={() => navigateTo(prevPage === "bedroom" ? "bedroom" : "entrance")}
          label={prevPage === "bedroom" ? "回房间" : "首页"}
        />
        <div className="profiles-header-title">入住档案</div>
        <div className="profiles-header-spacer" />
      </div>

      <div className="profiles-scroll">
        {characters.length === 0 && (
          <div className="empty-hint">
            还没有入住者
            <br />
            点下方按钮迎接 ta 回家吧
          </div>
        )}

        {characters.map((char) => (
          <div
            key={char.id}
            className="profile-card"
            onClick={() => openProfileEdit(char)}
          >
            <Avatar char={char} size={48} radius={16} fontSize={24} />
            <div className="profile-card-info">
              <div className="profile-card-name">{char.name || "未命名"}</div>
              <div className="profile-card-relation">
                {char.relation || "未设定关系"}
              </div>
            </div>
            <div className="profile-card-arrow">›</div>
          </div>
        ))}

        <button className="add-char-btn" onClick={createChar}>
          <span style={{ fontSize: 18 }}>🏠</span> 迎接新的入住者
        </button>
      </div>
    </div>
  );
}
