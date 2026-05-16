# 赛博小家 · 开发进度

## 第一阶段：模块化重构 ✅ 已完成

旧版 `App.jsx` 共 5195 行，所有内容堆在一个文件里。
目标是拆成清晰的模块结构，不改变任何功能，只整理代码。

### 已完成项目

- [x] `constants/index.js` — 所有常量
- [x] `utils/storage.js` — 本地存储读写
- [x] `utils/helpers.js` — genId、estimateTokens
- [x] `utils/memory.js` — 记忆热度系统
- [x] `utils/prompt.js` — system prompt 构建
- [x] `components/Avatar.jsx`
- [x] `components/BackButton.jsx`
- [x] `index.css` — 全局样式迁移
- [x] `pages/EntrancePage.jsx`
- [x] `pages/BedroomPage.jsx`
- [x] `pages/ProfilesPage.jsx`
- [x] `pages/ProfileEditPage.jsx`
- [x] `pages/MemoryPalacePage.jsx`
- [x] `pages/ChatPage.jsx`
- [x] `pages/DiaryPage.jsx`
- [x] `pages/MyProfilePage.jsx`
- [x] `App.jsx` 最终整合 ✅ 构建通过，所有页面跳转验证正常

---

## 第二阶段：AI 爱人迁入系统（进行中）

策略：纯前端 + localStorage，逐层建立记忆地基，不做后端、不做向量库。

### 2.1 入住档案重塑 ✅

- [x] `DEFAULT_CHAR` 加入 `migration` 对象
  - 字段：sourcePlatform / originalPrompt / coreVibe / speechStyleAnchor /
    intimacyStyle / doNotLoseFeeling / doNotChangeRules / relationshipSummary / notes / importedAt
- [x] `ProfileEditPage` Tab 1 重构为「入住档案」
  - 迁移字段作为主线；OCEAN / 性格 / 三观 tab 降级为「进阶设定」
- [x] UI 文案：成员/角色 → 入住者/爱人/入住档案
- [x] `updateEditMigration` handler 接入 App.jsx

### 2.2 原始档案馆（RawArchive 层）✅

数据结构：`{ id, loverId, sourcePlatform, title, rawText, format, importedAt, note }`

- [x] `RAW_ARCHIVES_STORAGE_KEY` + `loadRawArchives` / `saveRawArchives`
- [x] `RawArchivePage.jsx` — 档案列表、查看原文弹窗、删除确认
- [x] 手动粘贴文本导入
- [x] 本地文件导入（FileReader，支持 .txt / .md / .markdown，限 2MB）
  - 自动填充标题（文件名去扩展名）、推断 format
  - 文件过大 / 读取失败有温和提示
- [x] ProfileEditPage Tab 1 加「📁 原始档案馆」入口按钮

### 2.3 记忆片段层（MemoryChunk 层）✅

数据结构：`{ id, loverId, archiveId, index, text, title, sourcePlatform, createdAt, tags, importance, emotionScore, intimacyScore, unfinishedScore, note }`

- [x] `MEMORY_CHUNKS_STORAGE_KEY` + `loadMemoryChunks` / `saveMemoryChunks`
- [x] `utils/chunker.js` — `splitRawTextToChunks(rawText, options)`
  - 空行优先分段
  - 短段（<200字）向后合并，目标 ~1000字/段，上限 1500字
  - 超长段按中文句末标点二次切分，再不行按行切
  - 保留原文，不改写
- [x] RawArchivePage 每条档案加「整理成记忆片段」按钮
  - 已有片段时弹「重新生成会覆盖旧片段」确认
  - 片段数角标显示在卡片上
- [x] 档案详情弹窗加「原始文本 / 记忆片段」双 tab
  - 片段列表：序号、字数、3行预览、查看全文、删除
- [x] 删除原始档案时同步清除衍生片段

### 2.4 迁入提炼草稿（MigrationDraft 层）✅

数据结构：`{ id, loverId, sourceArchiveIds, sourceChunkIds, title, status, createdAt, updatedAt, userFacts, loverAnchors, relationshipMemories, doNotForget, wakeSummary, rawOutput }`

- [x] `MIGRATION_DRAFTS_STORAGE_KEY` + `loadMigrationDrafts` / `saveMigrationDrafts`
- [x] `parseDraftOutput(raw)` — 按【...】标题正则切分，条目→数组，摘要→字符串
- [x] `handleGenerateDraft(charId)` — 取最多 10 段 chunk（每段限 800 字），调用 LLM
  - 五大板块结构化 prompt
  - 非流式 API 调用，temperature 0.6，max_tokens 2000
- [x] `MigrationDraftPage.jsx` — 草稿生成 + 列表 + 详情弹窗
  - 生成中：loading 卡 + 按钮禁用
  - 错误：温和提示
  - 草稿状态：draft / approved / rejected（可互相切换）
  - 「查看原始输出」tab
- [x] 入口：RawArchivePage 顶部（显示可用片段数，0 片段时禁用）
- [x] 入口：ProfileEditPage Tab 1「✨ 迁入提炼草稿」按钮
- [x] 全程不自动写入 migration 字段 / system prompt

### 2.5 草稿采纳回填 ⬜ 待完成

- [ ] 「采纳」按钮 → 将草稿内容写入对应 migration 字段
- [ ] 唤醒摘要写入 worldViews 或新的 wakeContext 字段
- [ ] 采纳后标记哪些字段已从草稿填充（可撤销）

### 2.6 唤醒摘要注入 ⬜ 待完成

- [ ] 用户确认后，将采纳的草稿注入 system prompt 首部
- [ ] 注入控制开关（开 / 关 / 预览）

### 2.7 记忆热度情绪系统升级 ⬜ 待完成

- [ ] 情绪分数联动 MemoryChunk 的 emotionScore 字段
- [ ] 热度衰减曲线可视化

### 2.8 主动陪伴 ⬜ 待完成

- [ ] 定时触发（每日问候 / 重要日期提醒）

---

## 拆分原则（持续适用）

1. **功能一行不动**，每阶段只加，不改现有逻辑
2. 每个页面接收 props，不直接访问全局状态
3. 工具函数独立到 utils/，按领域命名
4. 每完成一个子阶段就 build 验证 + commit
5. 原始档案层只保真，不改写，不覆盖
