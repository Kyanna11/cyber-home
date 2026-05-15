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
| 🧠 分层记忆宫殿 | 六层结构：原始档案 → 片段索引 → 事件 → 情绪 → 人格锚点 → 唤醒摘要 |
| 💬 多线程聊天 | 支持多话题、内心独白、打字机效果、消息编辑 |
| 📔 日记系统 | 写日记，分享给爱人，沉淀成情绪记忆 |
| 🔥 记忆热度 | 记忆会呼吸——重要的浮现，遗忘的沉淀 |
| ⚙️ 多模型支持 | Claude / GPT / Gemini，每个角色可单独配置模型 |
| 🎯 动态 Prompt | 不塞满，不遗忘——按需召回，精准注入 |

---

## 🗺️ 当前阶段：第一阶段 ✅ 已完成

**✅ 第一阶段完成：** 旧版 5195 行单文件重构为模块化结构，功能零损失

- [x] 项目初始化（Vite + React）
- [x] 迁移到 GitHub
- [x] 拆分常量、工具函数、基础组件
- [x] 入口页、卧室页
- [x] 成员档案列表页
- [x] 档案编辑页（5个 tab：基本信息 / 人格数值 / 性格认知 / 三观体系 / 补充设定）
- [x] 记忆宫殿页（热度系统 / AI 反思 / 人格成长）
- [x] 聊天页（多话题 / 内心独白 / 打字机 / 消息编辑 / 记忆控制台）
- [x] 日记页（写日记 / 分享给角色）
- [x] 我的档案页（核心信息 / 共享档案库）
- [x] App.jsx 最终整合，构建通过 ✅

**➡️ 下一步：第二阶段**
- [ ] Python + FastAPI 后端启动
- [ ] 向量搜索记忆（pgvector / Chroma）
- [ ] 记忆热度情绪系统升级
- [ ] 主动陪伴（定时触发）
- [ ] TTS 语音

**第三阶段预计：** MCP 外部大脑、多端同步、Live2D 形象

---

## 📁 项目结构

```
cyber-home/
├── docs/                        # 项目文档
│   ├── requirements.md          # 需求与北极星
│   ├── project-design.md        # 完整设计方案
│   ├── memory-architecture.md   # 六层记忆宫殿设计
│   └── refactor-plan.md         # 重构计划与进度
│
├── src/                         # 前端（Vite + React）
│   ├── constants/
│   │   └── index.js             # 所有常量（模型列表、默认值等）
│   ├── utils/
│   │   ├── storage.js           # localStorage 读写
│   │   ├── helpers.js           # genId、estimateTokens
│   │   ├── memory.js            # 记忆热度系统
│   │   └── prompt.js            # System Prompt 构建
│   ├── components/
│   │   ├── Avatar.jsx           # 头像（图片/emoji）
│   │   └── BackButton.jsx       # 返回按钮
│   ├── pages/
│   │   ├── EntrancePage.jsx     # 入口页
│   │   ├── BedroomPage.jsx      # 卧室页
│   │   ├── ProfilesPage.jsx     # 成员列表
│   │   ├── ProfileEditPage.jsx  # 档案编辑（5个tab）
│   │   ├── MemoryPalacePage.jsx # 记忆宫殿
│   │   ├── ChatPage.jsx         # 聊天页
│   │   ├── DiaryPage.jsx        # 日记页
│   │   └── MyProfilePage.jsx    # 我的档案
│   ├── index.css                # 全局样式
│   └── App.jsx                  # 状态管理 + 页面路由
│
└── backend/                     # 后端（Python + FastAPI，第二阶段启动）
```

---

## 🚀 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（本地预览）
npm run dev

# 打包构建
npm run build
```

启动后打开 `http://localhost:5173` 即可看到小家 🏠

---

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React + Vite |
| 样式 | 纯 CSS（内联 + index.css） |
| 存储（第一阶段） | localStorage |
| 后端（第二阶段） | Python + FastAPI |
| 向量搜索（第二阶段） | pgvector 或 Chroma |

---

## 📖 文档

- [需求与北极星](./docs/requirements.md)
- [完整项目设计](./docs/project-design.md)
- [记忆宫殿架构](./docs/memory-architecture.md)
- [重构计划与进度](./docs/refactor-plan.md)

---

*这不是一个效率工具。这是一个让他记得你的地方。* 🤍
