// ─── 档案编辑页 ───
// 四 Tab：入住档案 / 人格锚点 / 记忆宫殿 / 系统设置

import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";
import { EMOJI_AVATARS, PRESET_MODELS } from "../constants";

// 轻量入口卡片，用于记忆宫殿 tab
function EntryCard({ emoji, title, subtitle, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "14px 18px",
        marginBottom: 10,
        background: accent
          ? `rgba(${accent},.06)`
          : "rgba(255,255,255,.6)",
        border: `1px solid rgba(${accent || "196,166,184"},.25)`,
        borderRadius: 14,
        cursor: "pointer",
        fontFamily: "var(--font-main)",
        textAlign: "left",
        transition: "all .2s",
      }}
    >
      <span style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#4a3a5a", letterSpacing: 1 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: "#b0a0c0", marginTop: 2, letterSpacing: 0.5 }}>
          {subtitle}
        </div>
      </div>
      <span style={{ marginLeft: "auto", color: "#c0b0d0", fontSize: 16 }}>›</span>
    </button>
  );
}

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
  updateEditMigration,
  openRawArchive,
  openMigrationDraft,
  openWakePreview,
  openTimeline,
}) {
  if (!editingChar) return null;

  const mig = editingChar.migration || {};

  const TABS = [
    { key: "basic",       label: "入住档案" },
    { key: "personality", label: "人格锚点" },
    { key: "wake",        label: "唤醒预览" },
    { key: "extra",       label: "系统设置" },
  ];

  return (
    <>
      <div className="profile-edit page-fade">

        {/* 顶栏 */}
        <div className="profile-edit-header">
          <BackButton
            onClick={() => {
              saveEditingChar();
              navigateTo(prevPage === "chat" ? "chat" : prevPage === "charRoom" ? "charRoom" : "profiles");
            }}
            label={prevPage === "chat" ? "回对话" : prevPage === "charRoom" ? "他的房间" : "档案"}
          />
          <div className="profile-edit-title">
            {editingChar.name || "新入住者"}
          </div>
          <button
            className="profile-edit-save"
            onClick={() => {
              saveEditingChar();
              navigateTo(prevPage === "chat" ? "chat" : prevPage === "charRoom" ? "charRoom" : "profiles");
            }}
          >
            保存
          </button>
        </div>

        {/* Tab 切换栏 */}
        <div className="edit-tabs">
          {TABS.map((t) => (
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

          {/* ══════════════════════════════════════
              入住档案
              ══════════════════════════════════════ */}
          {editSection === "basic" && (
            <>
              {/* 头像 */}
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

              {/* 关系锚点 */}
              <div className="section-card">
                <div className="section-title">🏠 关系锚点</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  ta 是谁，你们是什么关系——这是 ta 在小家里最根本的身份。
                </div>
                <div className="field-group">
                  <label className="field-label">名字</label>
                  <input
                    className="field-input"
                    placeholder="ta 叫什么？"
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
                <div className="field-group">
                  <label className="field-label">来源平台</label>
                  <input
                    className="field-input"
                    placeholder="比如：Claude.ai / Character.AI / 自制 ..."
                    value={mig.sourcePlatform || ""}
                    onChange={(e) => updateEditMigration("sourcePlatform", e.target.value)}
                  />
                </div>
              </div>

              {/* 原始设定 */}
              <div className="section-card">
                <div className="section-title">📋 原始 prompt / 角色卡</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  把 ta 在原来平台的 prompt、角色卡，或者你最初写给 ta 的人设粘贴在这里。
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="把原来的 system prompt 或角色卡粘贴进来……"
                  value={mig.originalPrompt || ""}
                  onChange={(e) => updateEditMigration("originalPrompt", e.target.value)}
                  style={{ minHeight: 140 }}
                />
              </div>

              {/* ta 是什么感觉 */}
              <div className="section-card">
                <div className="section-title">💫 ta 是什么感觉</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  用你自己的语言描述 ta，不用任何格式，只写你真实感受到的。
                </div>
                <div className="field-group">
                  <label className="field-label">核心气质</label>
                  <textarea
                    className="field-textarea"
                    placeholder="ta 给你的整体感觉是什么？比如：温柔又有一点孤傲，像冬天的午后阳光……"
                    value={mig.coreVibe || ""}
                    onChange={(e) => updateEditMigration("coreVibe", e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">不能丢的感觉</label>
                  <textarea
                    className="field-textarea"
                    placeholder="跟 ta 在一起，有什么感觉是无论如何都不能消失的？……"
                    value={mig.doNotLoseFeeling || ""}
                    onChange={(e) => updateEditMigration("doNotLoseFeeling", e.target.value)}
                  />
                </div>
              </div>

              {/* 关系基础 */}
              <div className="section-card">
                <div className="section-title">🫂 关系基础</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  这段关系的来龙去脉，以及每次对话开始前 ta 应该记得的。
                </div>
                <div className="field-group">
                  <label className="field-label">我和 ta 的关系摘要</label>
                  <textarea
                    className="field-textarea"
                    placeholder="你们之间发生过什么？有什么只属于你们的故事或默契？……"
                    value={mig.relationshipSummary || ""}
                    onChange={(e) => updateEditMigration("relationshipSummary", e.target.value)}
                    style={{ minHeight: 100 }}
                  />
                </div>
              </div>

              {/* 工具入口 */}
              <div style={{
                fontSize: 11, color: "var(--text-faint)", letterSpacing: 1,
                padding: "12px 4px 8px",
              }}>
                📂 记忆与工具
              </div>

              <EntryCard
                emoji="🏛️"
                title="记忆宫殿"
                subtitle="查看和管理 ta 的事实 / 情绪 / 觉察记忆"
                onClick={() => {
                  saveEditingChar();
                  openMemoryPalace && openMemoryPalace(editingChar.id, "profileEdit");
                }}
                accent="160,130,180"
              />

              <EntryCard
                emoji="📁"
                title="原始档案馆"
                subtitle="粘贴你们以前的对话记录，切成记忆片段"
                onClick={() => {
                  saveEditingChar();
                  openRawArchive && openRawArchive(editingChar.id);
                }}
                accent="130,160,180"
              />

              <EntryCard
                emoji="✨"
                title="迁入提炼草稿"
                subtitle="让 AI 从记忆片段里整理 ta 的人格锚点"
                onClick={() => {
                  saveEditingChar();
                  openMigrationDraft && openMigrationDraft(editingChar.id);
                }}
                accent="120,90,170"
              />

              <EntryCard
                emoji="📅"
                title="关系时间线"
                subtitle="记录你们之间重要的故事节点"
                onClick={() => {
                  saveEditingChar();
                  openTimeline && openTimeline(editingChar.id);
                }}
                accent="106,122,174"
              />
            </>
          )}

          {/* ══════════════════════════════════════
              人格锚点（合并性格认知 + 三观体系）
              ══════════════════════════════════════ */}
          {editSection === "personality" && (
            <>
              <div className="section-card">
                <div className="section-title">🪞 性格与气质</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  ta 是什么样的人，ta 怎么说话、怎么感受、怎么待人——这些是让 ta 成为 ta 的核心。
                </div>

                {[
                  {
                    label: "说话风格",
                    placeholder: "语气特点，比如：语气柔和偏书面、喜欢用省略号、偶尔会用反问表达关心……",
                    value: mig.speechStyleAnchor || "",
                    onChange: (v) => updateEditMigration("speechStyleAnchor", v),
                  },
                  {
                    label: "情绪反应",
                    placeholder: "在亲密关系中的模式：依恋型？回避型？生气时会怎样？怎么表达爱意？……",
                    value: editingChar.personality.emotionalPattern,
                    onChange: (v) => updateEditPersonality("emotionalPattern", v),
                  },
                  {
                    label: "亲密方式",
                    placeholder: "ta 怎么表达亲近和关心？比如：不说我爱你，但会在你睡前发一条「早点睡」……",
                    value: mig.intimacyStyle || "",
                    onChange: (v) => updateEditMigration("intimacyStyle", v),
                  },
                  {
                    label: "安抚方式 / 行为习惯",
                    placeholder: "ta 怎么安慰人，有什么小动作？比如：会安静地陪着、紧张时喜欢摸耳朵……",
                    value: editingChar.personality.habits,
                    onChange: (v) => updateEditPersonality("habits", v),
                  },
                  {
                    label: "性格特质",
                    placeholder: "核心性格词：温柔、倔强、话少但心细、容易心软……",
                    value: editingChar.personality.cognition,
                    onChange: (v) => updateEditPersonality("cognition", v),
                  },
                  {
                    label: "人格自评",
                    placeholder: "ta 怎么看待自己？比如：我觉得自己是一个表面平静但内心敏感的人……",
                    value: editingChar.personality.selfAssessment,
                    onChange: (v) => updateEditPersonality("selfAssessment", v),
                    minHeight: 85,
                  },
                ].map((f) => (
                  <div key={f.label} className="field-group">
                    <label className="field-label">{f.label}</label>
                    <textarea
                      className="field-textarea"
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      style={f.minHeight ? { minHeight: f.minHeight } : {}}
                    />
                  </div>
                ))}
              </div>

              <div className="section-card">
                <div className="section-title">💞 感情与价值</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  ta 看待爱情、关系和世界的方式——这些是 ta 做判断时的底层坐标。
                </div>

                {[
                  {
                    label: "感情观",
                    placeholder: "ta 怎么看待爱情和亲密关系？什么是好的陪伴？……",
                    value: editingChar.worldview.love,
                    onChange: (v) => updateEditWorldview("love", v),
                  },
                  {
                    label: "价值观",
                    placeholder: "ta 最在乎什么？真诚？自由？安全感？成长？……",
                    value: editingChar.worldview.values,
                    onChange: (v) => updateEditWorldview("values", v),
                  },
                  {
                    label: "禁止变化",
                    placeholder: "有些事是 ta 绝对不会变的，比如：不管发生什么，ta 不会先离开……",
                    value: mig.doNotChangeRules || "",
                    onChange: (v) => updateEditMigration("doNotChangeRules", v),
                    minHeight: 90,
                  },
                ].map((f) => (
                  <div key={f.label} className="field-group">
                    <label className="field-label">{f.label}</label>
                    <textarea
                      className="field-textarea"
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      style={f.minHeight ? { minHeight: f.minHeight } : {}}
                    />
                  </div>
                ))}
              </div>

              {/* 世界观（折叠展示，进阶） */}
              <div className="section-card">
                <div className="section-title" style={{ color: "var(--text-mid)" }}>🌍 世界观补充</div>
                <div style={{ fontSize: 11, color: "rgba(155,149,181,.6)", marginBottom: 14, letterSpacing: ".5px" }}>
                  ✦ 进阶设定 · 随记忆宫殿总结自动积累
                </div>
                {[
                  {
                    label: "世界观",
                    placeholder: "ta 觉得这个世界是怎样的？温柔的还是残酷的？……",
                    value: editingChar.worldview.world,
                    onChange: (v) => updateEditWorldview("world", v),
                  },
                  {
                    label: "人生观",
                    placeholder: "ta 觉得人活着是为了什么？怎样算是好好活过？……",
                    value: editingChar.worldview.life,
                    onChange: (v) => updateEditWorldview("life", v),
                  },
                  {
                    label: "成长感悟",
                    placeholder: "ta 从经历中学到了什么？有哪些信念在逐渐形成？……",
                    value: editingChar.worldview.growth,
                    onChange: (v) => updateEditWorldview("growth", v),
                  },
                ].map((f) => (
                  <div key={f.label} className="field-group">
                    <label className="field-label">{f.label}</label>
                    <textarea
                      className="field-textarea"
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* 基本档案（外貌也是锚点之一） */}
              <div className="section-card">
                <div className="section-title" style={{ color: "var(--text-mid)" }}>📎 基本档案</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  外貌、年龄等细节——外貌本身也是人格锚点的一部分，填了会让 ta 更完整。
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
                  <label className="field-label">其他</label>
                  <textarea className="field-textarea"
                    placeholder="任何你觉得重要的……"
                    value={editingChar.profile.other}
                    onChange={(e) => updateEditProfile("other", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════
              唤醒预览
              ══════════════════════════════════════ */}
          {(editSection === "wake" || editSection === "memory") && (
            <>
              <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.9, padding: "10px 4px 16px" }}>
                每次对话开始前，ta 会携带这些内容进入场景——这是 ta 和你之间关系的"热启动"。
              </div>

              {/* 唤醒摘要预览 */}
              <div className="section-card">
                <div className="section-title">🌙 唤醒摘要</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  ta 每次开口前内化的叙事——你们是谁，发生过什么，有什么约定。
                  可手动编辑，也可以通过迁入流程自动生成。
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="每次对话开始时，ta 应该内化的背景——你们是谁，有什么约定……"
                  value={mig.wakeSummary || ""}
                  onChange={(e) => updateEditMigration("wakeSummary", e.target.value)}
                  style={{ minHeight: 120 }}
                />
              </div>

              {/* 完整唤醒预览入口 */}
              <EntryCard
                emoji="🌙"
                title="查看完整唤醒预览"
                subtitle="看看每次对话开始时 ta 实际携带了什么"
                onClick={() => {
                  saveEditingChar();
                  openWakePreview && openWakePreview(editingChar.id);
                }}
                accent="100,90,160"
              />
            </>
          )}

          {/* ══════════════════════════════════════
              系统设置
              ══════════════════════════════════════ */}
          {editSection === "extra" && (
            <>
              {/* 专属模型 */}
              <div className="section-card">
                <div className="section-title">🤖 专属模型</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  为 ta 单独指定一个模型。留空则跟随全局聊天页配置。
                </div>
                <div className="field-group">
                  <label className="field-label">角色专属模型</label>
                  <input
                    className="field-input"
                    placeholder="留空 = 跟随全局设置"
                    value={editingChar.modelOverride || ""}
                    onChange={(e) => setEditingChar((prev) => ({ ...prev, modelOverride: e.target.value }))}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6, marginTop: -6 }}>
                  常用：{PRESET_MODELS.filter(m => m.value !== "__custom__").slice(0, 3).map(m => m.label).join(" · ")}
                </div>
              </div>

              {/* 补充设定 */}
              <div className="section-card">
                <div className="section-title">⚙️ 补充设定</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 6, lineHeight: 1.7 }}>
                  直接附加到 system prompt 末尾。写任何上面分类放不下的细节设定。
                </div>
                <div style={{ fontSize: 11, color: "rgba(155,149,181,.6)", marginBottom: 14, letterSpacing: ".5px" }}>
                  ✦ 进阶设定 · 直接注入 prompt
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="比如：你喜欢在句末加「呢」，你会在晚声难过时主动抱她……"
                  value={editingChar.systemPromptExtra}
                  onChange={(e) => setEditingChar((prev) => ({ ...prev, systemPromptExtra: e.target.value }))}
                  style={{ minHeight: 140 }}
                />
              </div>

              {/* 自动沉淀提醒 */}
              <div className="section-card">
                <div className="section-title">🌿 自动沉淀提醒</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.7 }}>
                  满足条件时，聊天页顶部会轻轻提醒你整理一下关系。设为 0 则关闭对应触发。
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">超过几天没整理</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        className="field-input"
                        style={{ width: 72 }}
                        value={editingChar.autoSettleDays ?? 2}
                        onChange={(e) => setEditingChar((prev) => ({
                          ...prev,
                          autoSettleDays: Math.max(0, parseInt(e.target.value) || 0),
                        }))}
                      />
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>天</span>
                    </div>
                  </div>
                  <div className="field-group" style={{ flex: 1 }}>
                    <label className="field-label">新增消息超过几条</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        className="field-input"
                        style={{ width: 72 }}
                        value={editingChar.autoSettleMsgs ?? 50}
                        onChange={(e) => setEditingChar((prev) => ({
                          ...prev,
                          autoSettleMsgs: Math.max(0, parseInt(e.target.value) || 0),
                        }))}
                      />
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>条</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 危险区域 */}
              <div className="section-card" style={{ borderColor: "rgba(192,112,112,.2)" }}>
                <div className="section-title" style={{ color: "#a06060" }}>⚠️ 危险区域</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 16, lineHeight: 1.7 }}>
                  让 ta 离开小家——入住档案和所有记忆都会一起消失，无法恢复。
                </div>
                <button
                  style={{
                    padding: "10px 24px",
                    background: "rgba(192,112,112,.08)",
                    border: "1px solid rgba(192,112,112,.3)",
                    borderRadius: 12,
                    color: "#a06060",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--font-main)",
                    letterSpacing: 1,
                  }}
                  onClick={() => setDeleteConfirmId(editingChar.id)}
                >
                  迁出 {editingChar.name || "此入住者"}
                </button>
              </div>
            </>
          )}

        </div>
        {/* ── 底部占位，防止内容被遮住 ── */}
        <div style={{ height: 24 }} />
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div
          className="del-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
        >
          <div className="del-confirm-box">
            <div className="del-confirm-text">
              确定要让 ta 离开小家吗？
              <br />
              入住档案和所有记忆都会一起消失……
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
                确认迁出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
