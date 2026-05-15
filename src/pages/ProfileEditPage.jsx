// ─── 档案编辑页 ───
// 五个 tab：基本信息 / 人格数值 / 性格认知 / 三观体系 / 补充设定

import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";
import { EMOJI_AVATARS, OCEAN_DIMS } from "../constants";

export default function ProfileEditPage({
  editingChar,
  setEditingChar,
  editSection,
  setEditSection,
  saveEditingChar,
  prevPage,
  navigateTo,
  openMemoryPalace,
  handleAvatarUpload,
  deleteConfirmId,
  setDeleteConfirmId,
  deleteChar,
  updateEditProfile,
  updateEditOcean,
  updateEditPersonality,
  updateEditWorldview,
}) {
  if (!editingChar) return null;

  return (
    <>
      <div className="profile-edit page-fade">
        {/* 顶栏 */}
        <div className="profile-edit-header">
          <BackButton
            onClick={() => {
              saveEditingChar();
              navigateTo(prevPage === "chat" ? "chat" : "profiles");
            }}
            label={prevPage === "chat" ? "回对话" : "档案"}
          />
          <div className="profile-edit-title">
            {editingChar.name || "新成员"}
          </div>
          <button
            className="profile-edit-save"
            onClick={() => {
              saveEditingChar();
              navigateTo(prevPage === "chat" ? "chat" : "profiles");
            }}
          >
            保存
          </button>
        </div>

        {/* Tab 切换栏 */}
        <div className="edit-tabs">
          {[
            { key: "basic", label: "基本信息" },
            { key: "ocean", label: "人格数值" },
            { key: "personality", label: "性格认知" },
            { key: "worldview", label: "三观体系" },
            { key: "extra", label: "补充设定" },
          ].map((t) => (
            <button
              key={t.key}
              className={`edit-tab ${editSection === t.key ? "active" : ""}`}
              onClick={() => {
                saveEditingChar();
                setEditSection(t.key);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        <div className="edit-scroll">

          {/* ── 基本信息 ── */}
          {editSection === "basic" && (
            <>
              <div className="section-card">
                <div className="section-title">🎭 头像</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <Avatar char={editingChar} size={72} radius={20} fontSize={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 8, letterSpacing: ".5px" }}>
                      {editingChar.avatarImg ? "已上传自定义头像" : "当前使用 emoji 头像"}
                    </div>
                    {editingChar.avatarImg && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 11, padding: "5px 12px" }}
                        onClick={() => setEditingChar((prev) => ({ ...prev, avatarImg: "" }))}
                      >
                        移除图片，改用 emoji
                      </button>
                    )}
                  </div>
                </div>
                <label className="avatar-upload-label">
                  📷 上传头像图片
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
                </label>
                <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 8, letterSpacing: ".5px" }}>
                  或者选一个 emoji：
                </div>
                <div className="emoji-grid">
                  {EMOJI_AVATARS.map((e) => (
                    <div
                      key={e}
                      className={`emoji-option ${!editingChar.avatarImg && editingChar.emoji === e ? "selected" : ""}`}
                      onClick={() => setEditingChar((prev) => ({ ...prev, emoji: e, avatarImg: "" }))}
                    >
                      {e}
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <div className="section-title">📝 基本档案</div>
                <div className="field-group">
                  <label className="field-label">姓名</label>
                  <input
                    className="field-input"
                    placeholder="给 ta 起个名字"
                    value={editingChar.name}
                    onChange={(e) => setEditingChar((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">和我的关系</label>
                  <input
                    className="field-input"
                    placeholder="恋人 / 挚友 / 家人 / ..."
                    value={editingChar.relation}
                    onChange={(e) => setEditingChar((prev) => ({ ...prev, relation: e.target.value }))}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field-group">
                    <label className="field-label">年龄</label>
                    <input className="field-input" placeholder="24" value={editingChar.profile.age}
                      onChange={(e) => updateEditProfile("age", e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">身高</label>
                    <input className="field-input" placeholder="182cm" value={editingChar.profile.height}
                      onChange={(e) => updateEditProfile("height", e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field-group">
                    <label className="field-label">生日</label>
                    <input className="field-input" placeholder="3月14日" value={editingChar.profile.birthday}
                      onChange={(e) => updateEditProfile("birthday", e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">MBTI</label>
                    <input className="field-input" placeholder="INFJ" value={editingChar.profile.mbti}
                      onChange={(e) => updateEditProfile("mbti", e.target.value)} />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">外貌描述</label>
                  <textarea className="field-textarea"
                    placeholder="比如：清瘦，黑色碎发，戴银框眼镜，笑起来有酒窝……"
                    value={editingChar.profile.appearance}
                    onChange={(e) => updateEditProfile("appearance", e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">其他信息</label>
                  <textarea className="field-textarea"
                    placeholder="任何你觉得重要的设定……"
                    value={editingChar.profile.other}
                    onChange={(e) => updateEditProfile("other", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── 人格数值 ── */}
          {editSection === "ocean" && (
            <div className="section-card">
              <div className="section-title">🧠 大五人格 · OCEAN</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20, lineHeight: 1.7, letterSpacing: ".3px" }}>
                拖动滑块设定 ta 的性格倾向。这些数值会成为人格的底色，影响 ta 说话、思考和感受的方式。
              </div>
              {OCEAN_DIMS.map((d) => {
                const val = editingChar.ocean[d.key] || 50;
                const hue = d.key === "O" ? 260 : d.key === "C" ? 220 : d.key === "E" ? 340 : d.key === "A" ? 310 : 280;
                return (
                  <div key={d.key} className="ocean-item">
                    <div className="ocean-header">
                      <span className="ocean-label">
                        {d.label}{" "}
                        <span style={{ color: "var(--text-faint)", fontSize: 11 }}>({d.labelEn})</span>
                      </span>
                      <span className="ocean-value">{val}</span>
                    </div>
                    <div className="ocean-desc">{d.desc}</div>
                    <div className="ocean-slider-wrap">
                      <span className="ocean-pole">{d.low}</span>
                      <input
                        className="ocean-slider"
                        type="range" min="0" max="100" step="1" value={val}
                        style={{ background: `linear-gradient(to right, rgba(${hue},180,220,.25) 0%, hsla(${hue},45%,65%,.5) ${val}%, rgba(155,149,181,.1) ${val}%)` }}
                        onChange={(e) => updateEditOcean(d.key, Number(e.target.value))}
                      />
                      <span className="ocean-pole right">{d.high}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 性格认知 ── */}
          {editSection === "personality" && (
            <div className="section-card">
              <div className="section-title">🪞 性格认知</div>
              {[
                { key: "selfAssessment", label: "人格自评", placeholder: "ta 怎么看待自己？比如：我觉得自己是一个表面平静但内心敏感的人……", minHeight: 85 },
                { key: "cognition", label: "性格特质", placeholder: "核心性格词：温柔、倔强、话少但心细、容易心软……" },
                { key: "habits", label: "行为习惯", placeholder: "日常小动作和习惯，比如：紧张时会摸耳朵、喜欢在深夜写东西……" },
                { key: "speechStyle", label: "说话风格", placeholder: "语气特点，比如：语气柔和偏书面、偶尔会用省略号、喜欢用反问表达关心……" },
                { key: "emotionalPattern", label: "情感模式", placeholder: "在亲密关系中的模式：依恋型？回避型？怎么表达爱意？生气时会怎样？……" },
              ].map((f) => (
                <div key={f.key} className="field-group">
                  <label className="field-label">{f.label}</label>
                  <textarea
                    className="field-textarea"
                    placeholder={f.placeholder}
                    value={editingChar.personality[f.key]}
                    onChange={(e) => updateEditPersonality(f.key, e.target.value)}
                    style={f.minHeight ? { minHeight: f.minHeight } : {}}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── 三观体系 ── */}
          {editSection === "worldview" && (
            <div className="section-card">
              <div className="section-title">🌍 三观体系</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 18, lineHeight: 1.7, letterSpacing: ".3px" }}>
                这是 ta 看待世界的方式。随着记忆宫殿中的定期总结积累，这些观念会逐渐「生长」出来。你也可以先手动写一个起点。
              </div>
              {[
                { key: "world", label: "世界观", placeholder: "ta 觉得这个世界是怎样的？温柔的还是残酷的？有序的还是混沌的？……" },
                { key: "values", label: "价值观", placeholder: "ta 最在乎什么？真诚？自由？安全感？成长？……" },
                { key: "love", label: "感情观", placeholder: "ta 怎么看待爱情和亲密关系？什么是好的陪伴？……" },
                { key: "life", label: "人生观", placeholder: "ta 觉得人活着是为了什么？怎样算是好好活过？……" },
                { key: "growth", label: "成长感悟", placeholder: "ta 从经历中学到了什么？有哪些信念在逐渐形成？……" },
              ].map((f) => (
                <div key={f.key} className="field-group">
                  <label className="field-label">{f.label}</label>
                  <textarea
                    className="field-textarea"
                    placeholder={f.placeholder}
                    value={editingChar.worldview[f.key]}
                    onChange={(e) => updateEditWorldview(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── 补充设定 ── */}
          {editSection === "extra" && (
            <div className="section-card">
              <div className="section-title">✏️ 补充设定</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                这里的内容会直接附加到 system prompt 中。你可以写任何上面分类放不下的设定细节。
              </div>
              <textarea
                className="field-textarea"
                placeholder="比如：你喜欢在句末加「呢」，你会在晚声难过时主动抱她……"
                value={editingChar.systemPromptExtra}
                onChange={(e) => setEditingChar((prev) => ({ ...prev, systemPromptExtra: e.target.value }))}
                style={{ minHeight: 160 }}
              />
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="profile-bottom-actions">
          <button
            className="profile-mem-btn"
            onClick={() => {
              saveEditingChar();
              openMemoryPalace(editingChar.id, "profileEdit");
            }}
          >
            🏛️ 记忆宫殿
          </button>
          <button
            className="profile-del-btn"
            onClick={() => setDeleteConfirmId(editingChar.id)}
          >
            删除
          </button>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div
          className="del-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
        >
          <div className="del-confirm-box">
            <div className="del-confirm-text">
              确定要让 ta 离开吗？
              <br />
              档案和所有记忆都会一起消失……
            </div>
            <div className="del-confirm-actions">
              <button className="del-confirm-cancel" onClick={() => setDeleteConfirmId(null)}>
                再想想
              </button>
              <button
                className="del-confirm-do"
                onClick={() => {
                  deleteChar(deleteConfirmId);
                  navigateTo("profiles");
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
