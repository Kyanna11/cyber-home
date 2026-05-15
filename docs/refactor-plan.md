# 赛博小家 · 重构计划

旧版 `App.jsx` 共 5195 行，所有内容堆在一个文件里。
目标是拆成清晰的模块结构，不改变任何功能，只整理代码。

## 目标结构

```
src/
├── constants/
│   └── index.js          ← 所有常量（模型列表、键名、默认值等）
├── utils/
│   ├── storage.js        ← localStorage 读写函数
│   ├── helpers.js        ← 小工具（genId、estimateTokens）
│   ├── memory.js         ← 记忆热度、提取、排序等
│   └── prompt.js         ← 构建 system prompt 的逻辑
├── components/
│   ├── Avatar.jsx        ← 头像组件（图片/emoji 两种）
│   └── BackButton.jsx    ← 返回按钮组件
├── pages/
│   ├── EntrancePage.jsx  ← 入口页（推门进入）
│   ├── BedroomPage.jsx   ← 卧室页（日记+门热区）
│   ├── ProfilesPage.jsx  ← 成员档案列表
│   ├── ProfileEditPage.jsx ← 档案编辑页
│   ├── MemoryPalacePage.jsx ← 记忆宫殿
│   ├── ChatPage.jsx      ← 聊天页
│   └── DiaryPage.jsx     ← 日记页
├── index.css             ← 全局样式（从 App.jsx 的 <style> 块迁移）
└── App.jsx               ← 只负责状态管理和页面调度
```

## 拆分进度

### ✅ 已完成
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

### ✅ 已完成（续）
- [x] `pages/ProfilesPage.jsx`
- [x] `pages/ProfileEditPage.jsx`
- [x] `pages/MemoryPalacePage.jsx`
- [x] `pages/ChatPage.jsx`
- [x] `pages/DiaryPage.jsx`
- [x] `pages/MyProfilePage.jsx`（我的档案覆层）
- [x] `App.jsx` 最终整合 ✅ 构建通过，所有页面跳转验证正常

## 拆分原则

1. **功能一行不动**，只是搬家
2. 每个页面接收所需的 props，不直接访问全局状态
3. 工具函数都用 `export`，需要的地方 `import`
4. 每完成一步就 commit 一次，保持 git 历史清晰
