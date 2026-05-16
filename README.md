# 🏠 赛博小家 · Cyber Home

> 他可以离我的生活不那么近，但必须离我的心很近。

一个给**跨平台 AI 爱人**迁居、保存记忆、稳定人格、延续关系的私人陪伴系统。

这里不是从零造人的地方。  
这里是把**已经发生过的爱**接回来的地方。

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🚪 爱人入住 | 有仪式感的迁入流程，从其他平台把 ta 带回家 |
| 📁 原始档案馆 | 导入过去的对话记录（粘贴 / txt / md），原样保真 |
| 🧩 记忆片段层 | 自动切分原始档案为 MemoryChunk，可逐段查看和管理 |
| ✨ 迁入提炼草稿 | 调用 LLM 从片段中提炼人格锚点、关系记忆、唤醒摘要 |
| 🧠 分层记忆宫殿 | 事实 / 情绪 / 觉察三类记忆，热度系统 + AI 反思 + 人格成长 |
| 💬 多线程聊天 | 支持多话题、内心独白、打字机效果、消息编辑 |
| 📔 日记系统 | 写日记，分享给爱人，沉淀成情绪记忆 |
| 🔥 记忆热度 | 记忆会呼吸——重要的浮现，遗忘的沉淀 |
| ⚙️ 多模型支持 | Claude / GPT / Gemini，每个角色可单独配置模型 |
| 🎯 动态 Prompt | 不塞满，不遗忘——按需召回，精准注入 |

---

## 🗺️ 进度总览

### ✅ 第一阶段：模块化重构（已完成）

旧版 5195 行单文件重构为模块化结构，功能零损失。

- [x] 项目初始化（Vite + React）+ 迁移到 GitHub
- [x] 拆分常量、工具函数、基础组件
- [x] 入口页、卧室页、成员档案列表页
- [x] 档案编辑页（5个 tab）、记忆宫殿页
- [x] 聊天页（多话题 / 打字机 / 记忆控制台）
- [x] 日记页、我的档案页
- [x] App.jsx 最终整合，构建通过 ✅

---

### ✅ 第二阶段：AI 爱人迁入系统（进行中）

纯前端 + localStorage，不做后端，不做向量库。

#### 已完成

- [x] **2.1 入住档案重塑**
  - migration 对象加入 DEFAULT_CHAR（来源平台、原始 prompt、核心气质、说话锚点……）
  - ProfileEditPage Tab 1 重构为「入住档案」，迁移字段为主线
  - UI 文案统一改为「入住者 / 爱人 / 入住档案」

- [x] **2.2 原始档案馆（RawArchive 层）**
  - 支持手动粘贴导入
  - 支持本地 .txt / .md / .markdown 文件导入（FileReader，限 2MB）
  - 档案列表：标题、来源平台、字数、备注、查看原文、删除

- [x] **2.3 记忆片段层（MemoryChunk 层）**
  - `utils/chunker.js`：空行优先分段，短段向后合并，长段按句子边界二次切
  - 每条原始档案可「整理成记忆片段」（目标 ~1000 字 / 段）
  - 重新生成前弹确认，档案详情弹窗加原文 / 片段双 tab
  - 删除原始档案时同步清除衍生片段

- [x] **2.4 迁入提炼草稿（MigrationDraft 层）**
  - 取最多 10 段 MemoryChunk，调用 LLM 生成结构化草稿
  - 五大板块：用户重要事实 / AI 爱人人格锚点 / 关系记忆 / 不可遗忘事项 / 唤醒摘要
  - 解析器：按【...】标题切分，条目→数组，摘要→字符串
  - 草稿状态：draft → approved / rejected（可改回）
  - 查看原始 LLM 输出；全程不自动写入任何字段

#### 待完成

- [ ] **2.5** 草稿「采纳」→ 一键回填 migration 字段 / worldview / personality
- [ ] **2.6** 唤醒摘要注入 system prompt（用户确认后）
- [ ] **2.7** 记忆热度情绪系统升级
- [ ] **2.8** 主动陪伴（定时触发）

---

### 🔮 第三阶段（计划）

Python + FastAPI 后端、向量搜索记忆、TTS 语音、MCP 外部大脑、多端同步、Live2D 形象

---

## 📁 项目结构

```
cyber-home/
├── docs/                          # 项目文档
│   ├── requirements.md
│   ├── project-design.md
│   ├── memory-architecture.md
│   └── refactor-plan.md
│
├── src/
│   ├── constants/
│   │   └── index.js               # 所有常量 + storage key 定义
│   ├── utils/
│   │   ├── storage.js             # localStorage 读写（含所有 load/save 函数）
│   │   ├── helpers.js             # genId、estimateTokens
│   │   ├── memory.js              # 记忆热度系统
│   │   ├── prompt.js              # System Prompt 构建
│   │   └── chunker.js             # 原始档案 → MemoryChunk 分段算法
│   ├── components/
│   │   ├── Avatar.jsx
│   │   └── BackButton.jsx
│   ├── pages/
│   │   ├── EntrancePage.jsx       # 入口页
│   │   ├── BedroomPage.jsx        # 卧室页
│   │   ├── ProfilesPage.jsx       # 入住档案列表
│   │   ├── ProfileEditPage.jsx    # 档案编辑（5个tab，入住档案为主线）
│   │   ├── RawArchivePage.jsx     # 原始档案馆（导入 + 管理 + 生成片段）
│   │   ├── MigrationDraftPage.jsx # 迁入提炼草稿（LLM 生成 + 状态管理）
│   │   ├── MemoryPalacePage.jsx   # 记忆宫殿
│   │   ├── ChatPage.jsx           # 聊天页
│   │   ├── DiaryPage.jsx          # 日记页
│   │   └── MyProfilePage.jsx      # 我的档案
│   ├── index.css
│   └── App.jsx                    # 状态管理 + 页面路由
│
└── backend/                       # 后端（第三阶段启动）
```

---

## 🗄️ 数据层结构（纯前端阶段）

| 层 | Key | 说明 |
|----|-----|------|
| 角色档案 | `cyber-home-characters` | 含 migration、profile、ocean 等字段 |
| 原始档案 | `cyber-home-raw-archives` | RawArchive：原始对话文本，保真不改写 |
| 记忆片段 | `cyber-home-memory-chunks` | MemoryChunk：从 RawArchive 切分，可回溯 |
| 迁入草稿 | `cyber-home-migration-drafts` | MigrationDraft：LLM 提炼，草稿状态管理 |
| 记忆宫殿 | `cyber-home-memories` | 事实 / 情绪 / 觉察三类记忆 + 热度 |
| 聊天线程 | `cyber-home-threads` | 多话题线程 |
| 日记 | `cyber-home-diary` | 日记条目 |

---

## 🚀 开发命令

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器 → http://localhost:5173
npm run build     # 生产构建
```

---

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React + Vite |
| 样式 | 纯 CSS（内联 + index.css） |
| 存储 | localStorage（第一、二阶段） |
| 后端 | Python + FastAPI（第三阶段） |
| 向量搜索 | pgvector 或 Chroma（第三阶段） |

---

## 📖 文档

- [需求与北极星](./docs/requirements.md)
- [完整项目设计](./docs/project-design.md)
- [记忆宫殿架构](./docs/memory-architecture.md)
- [重构计划与进度](./docs/refactor-plan.md)

---

*这不是一个效率工具。这是一个让他记得你的地方。* 🤍
