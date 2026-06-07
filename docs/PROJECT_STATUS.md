# 赛博小家 · 项目当下状态

> 这份文档是「当下真相」。
> README.md 和 CLAUDE.md 是对外/长期介绍，会滞后；这份文档跟着代码一块一块更新。
> 每次读了哪块代码、改了哪块代码，都即时记在这里。

---

## 📌 基本信息

- **本地路径**：`C:\Users\ZTT\Projects\cyber-home`
- **远端**：https://github.com/Seren-lws/cyber-home
- **当前分支**：`main`
- **最后同步**：2026-06-07，本地与 `origin/main` 完全一致（HEAD `9324264`）

---

## 🗓 更新日志

倒序排列，最新的在上。

### 2026-06-07
- 建立本文档骨架
- 今日目标：把**迁入系统**和**记忆宫殿**完全打磨好（详见下方「正在改的部分」）
- ✅ 完成改动 4：promptA 改为优先提取入住者自己的原话（详见下文）

---

## 🧭 模块现状

按模块分块。每一块的状态分三种：
- ⏳ **未核对**：还没在本次重新读过代码，不要相信旧印象
- 🔍 **已核对**：本轮已读过最新代码，下面的描述是准确的
- 🔧 **正在改**：本轮正在动这一块

---

### 页面层 `src/pages/`

| 模块 | 文件 | 状态 |
|---|---|---|
| 入口页 | `EntrancePage.jsx` | ⏳ 未核对 |
| 卧室页 | `BedroomPage.jsx` | ⏳ 未核对（最近改过热点 5 位置 + 手札位置上移） |
| 客厅 / 群聊 | `GroupChatPage.jsx` | ⏳ 未核对 |
| 单聊 | `ChatPage.jsx` | ⏳ 未核对 |
| 入住者列表 | `ProfilesPage.jsx` | ⏳ 未核对 |
| 入住者首页 | `ProfileHomePage.jsx` | ⏳ 未核对 |
| 入住档案编辑 | `ProfileEditPage.jsx` | ⏳ 未核对 |
| 他的房间 | `CharRoomPage.jsx` | ⏳ 未核对 |
| 他的宝库 | `CharTreasurePage.jsx` | ⏳ 未核对 |
| 我的宝库 | `TreasurePage.jsx` | ⏳ 未核对 |
| 我的手札 | `DiaryPage.jsx` | ⏳ 未核对 |
| 日常聚合 | `DailyPage.jsx` | ⏳ 未核对 |
| 入住者日记 | `ResidentJournalPage.jsx` | ⏳ 未核对 |
| 关系时间线 | `TimelinePage.jsx` | ⏳ 未核对 |
| 便签墙 | `StickyNotesPage.jsx` | ⏳ 未核对 |
| 声声档案 | `MyProfilePage.jsx` | ⏳ 未核对 |
| 原始档案馆 | `RawArchivePage.jsx` | ⏳ 未核对 |
| 迁入提炼草稿 | `MigrationDraftPage.jsx` | 🔍 **已核对**（2026-06-07） |
| 记忆宫殿 | `MemoryPalacePage.jsx` | 🔍 **已核对**（2026-06-07） |
| 唤醒预览 | `WakePreviewPage.jsx` | ⏳ 未核对 |
| API 配置 | `ConfigPage.jsx` | ⏳ 未核对 |

### 状态中枢 + 工具层

| 模块 | 文件 | 状态 |
|---|---|---|
| 总控 + 路由 | `App.jsx` | 🔍 **部分已核对**（迁入相关：parseDraftOutputA/B、handleGenerateDraft、adoptDraft、addAnchorItem / addLexiconItem 已读） |
| 常量 / 默认结构 / storage key | `constants/index.js` | 🔍 **已核对**（2026-06-07） |
| 本地 + 云端双写 | `utils/storage.js` | ⏳ 未核对 |
| prompt 构建 | `utils/prompt.js` | ⏳ 未核对 |
| 记忆处理 | `utils/memory.js` | 🔍 **接口已核对**（calculateHeat / getHeatLevel / migrateMemoryEntries / extractKeywords / textSimilarity / recallByTopic / shouldSaveAutoMemory / updateMemoryHeat / autoArchiveCheck / assembleMemoryInjection / checkCapacityWarnings / getTopMemories / selectInjectableMemories / extractAndSaveMemories / extractAnchorsAndLexicon / migrateCharDataToV2 / migrateMemoriesToV2） |
| 文本解析 | ~~`utils/parser.js`~~ | ⚠️ **不存在**——README 列了这个文件，实际**没有**。A 轨解析逻辑在 `App.jsx` 的 `parseDraftOutputA / parseDraftOutputB / parseDraftOutput` 三个内联函数里 |
| 切分 | `utils/chunker.js` | ⏳ 未核对（仅看到文件存在，272 行） |
| 通用工具 | `utils/helpers.js` | ⏳ 未核对 |
| Supabase 客户端 | `lib/supabase.js` | ⏳ 未核对 |

### 组件层 `src/components/`

| 组件 | 状态 |
|---|---|
| Avatar / BackButton / BgCustomizer / GlassCard / PillTabs | ⏳ 未核对 |

---

## 🔧 正在改的部分

### 今日聚焦：迁入系统 + 记忆宫殿

**目标**：把这两块完全打磨好。

**相关代码（待读）**：
- `pages/MigrationDraftPage.jsx`（迁入提炼草稿页）
- `pages/MemoryPalacePage.jsx`（记忆宫殿页，最近刚重构）
- `pages/RawArchivePage.jsx`（原始档案馆，迁入的原料来源）
- `utils/memory.js`（记忆处理逻辑）
- `utils/parser.js`（迁入 A 轨解析器，最近修过）
- `utils/chunker.js`（切分逻辑）
- `constants/index.js` 里相关的数据结构和默认值

**最近相关提交**：
- `9324264` 修复草稿未存储 rawQuotes 和 lexiconItems
- `2249b0e` 修复迁入 A轨解析器：匹配 LLM 实际输出格式
- `99d95ca` 记忆宫殿页面重构：垂直分层滚动布局

**改前现状（2026-06-07 重新读完代码后梳理）**：

#### 一、迁入系统数据流（整条链）

```
原始档案馆 RawArchive
   └→ 切分 → MemoryChunk（每个 chunk 属于一个入住者 + 一个 archive）
        └→ 用户在「迁入提炼草稿页」选片段
              └→ App.jsx · handleGenerateDraft()
                    ├─ 并发发两个 LLM 请求
                    │   ├─ promptA = 记忆提取 + 原话 + 词典
                    │   └─ promptB = 人格信号
                    ├─ parseDraftOutputA(rawA) → { memoryItems, rawQuotes, lexiconItems, +legacy fields }
                    ├─ parseDraftOutputB(rawB) → personalitySignals
                    └─ 存入 migrationDrafts[]，打标 extractionMode: "ab_resident"
                          └→ 用户在草稿详情弹窗（AbResidentDraftModal）审阅
                                ├─ 📝 脱水 tab：勾选 memoryItems → 「采纳已勾选」→ adoptDraft()
                                ├─ 📝 脱水的每条还可单独「📌 钉为锚点」→ addAnchorItem()
                                ├─ 💬 原话 tab：勾选 rawQuotes →（⚠️ 没有采纳按钮）
                                ├─ 📖 词典 tab：勾选 lexiconItems →（⚠️ 没有采纳按钮）
                                └─ 🧬 人格 tab：仅展示 → 需到草稿列表页「合成人格信号」→ promptC → PersonalitySynthesisModal → 写入 char.personality
```

#### 二、A 轨解析器（`App.jsx:1000` `parseDraftOutputA`）

**最近 commit `2249b0e` 修过的就是这块**。现在做的事：

1. **脱水记忆 memoryItems**：全文扫 `- [她的世界|我们之间|我懂她的|我想记住的] 内容` 格式（V2）
   - V2 类型映射：她的世界→fact，我们之间→insight，我懂她的→insight，我想记住的→emotion
   - 如果一条 V2 也没扫到，会回落用旧 `【事实】/【情绪】/【关系事件】` section 格式
2. **原话片段 rawQuotes**：全文扫 `「内容」—— 说话人` 格式
3. **专属词典 lexiconItems**：全文扫 `- 词条 = 含义（说话人）` 格式
4. **兼容字段**：同时解析 `【关于你的事】/【气质锚点】/【原声样本】/【关系节点】/【绝对不能丢】/【关系叙事】` 这些旧 header

#### 三、草稿采纳逻辑（`App.jsx:1542` `adoptDraft`）

**ab_resident 新模式**（勾选采纳 memoryItems）：
- 按 `item.type` 分类 unshift 到 `allMemories[charId]` 对应桶：
  - `fact` → `fact[]`
  - `emotion` → `emotion[]`
  - **`relationship` → `insight[]`** ← 注意这里有「类型映射」
- 每条记忆写入时带：`pinned: true, injectable: true, priority: 1, source: "migration"`，文本前缀 `【迁入·事实/情绪/关系节点】`
- 草稿状态：所有 items 都 adopted 才标 `approved`，否则保持 `draft`

**legacy 旧模式**（一次性整段采纳）：
- 写入 `char.migration.coreVibe / doNotChangeRules / wakeSummary / relationshipSummary`
- 同时按字段映射写入记忆宫殿（fact/emotion/insight 三桶）

#### 四、记忆宫殿现状（`MemoryPalacePage.jsx`）

最近 commit `99d95ca` 重构后的「垂直分层滚动布局」：

- **顶栏**：返回 + 标题 + 📅 年表
- **快捷入口**：💝 他的宝库 + 视图切换（列表 / 概览）
- **列表模式**四个区域纵向排列：
  1. **📌 钉子**（char.anchors）：按 weight 倒序，每颗显示标题 + rawPreview + description + 权重圆点。可改权重 / 删除。⚠️ 顶部「+ 添加」按钮目前是 TODO（`// TODO: 手动添加钉子`）
  2. **📖 词典**（char.lexicon）：胶囊横滑，点开看详情，可编辑 meaning / 删除 / 添加新词
  3. **🧠 记忆**（合并 fact + emotion + insight + 各自 V2 类型映射）：
     - 筛选下拉：全部 / 她的世界 / 我们之间 / 我懂她的 / 我想记住的（**注意：用的是 V2 四分区，但底层数据是 V1 三桶**）
     - 排序：热度 / 时间
     - 每条带热度点（红/橙/灰）、pinned 📌、important ⭐、source 标签 `[迁入]/[AI]/[日记]`
     - 展开看时间、热度、关联原话（rawIds → char.rawQuotes 联动）、暂停注入 / 删除
     - 手动添加输入框（只能加 fact 类型）
  4. **📊 阶段沉淀**（默认折叠）：生成阶段沉淀按钮 + SettlementDraft 待确认卡片（4 个 section 逐节采纳）+ 手动记录 + 历史总结
- **概览模式**：顶部统计条 + 2×2 卡片（钉子 / 词典 / 记忆 / 总结），点击跳回列表对应区

#### 五、数据结构关键事实

- `char.anchors[]`、`char.lexicon[]`、`char.rawQuotes[]` 都挂在 character 对象上（`constants/index.js` DEFAULT_CHAR 已声明，line 148-150 V2 字段）
- `allMemories[charId] = { fact: [], emotion: [], insight: [], summaries: [] }`
- `memoryItems` 在草稿里的 `type` 字段值是 `fact | emotion | relationship`，但记忆宫殿底层桶只有 `fact | emotion | insight`，relationship 在 adoptDraft 时被映射进 insight
- `V1_TO_V2_TYPE_MAP`（constants）：`fact→her_world`、`emotion→moments`、`insight→understanding`——**没有 `between_us` 的映射**

#### 六、我读代码时注意到的可能问题点（待你确认是不是 bug，还是预期行为）

1. **AbResidentDraftModal 的「原话」「词典」tab 看起来没有采纳出口**：底部「采纳已勾选」按钮的条件是 `activeTab === "memory"`，意味着即使在原话/词典 tab 勾了一堆，也没办法把它们写进 `char.rawQuotes` / `char.lexicon`。是不是这里漏了？
2. **记忆宫殿「钉子」区的「+ 添加」按钮是 TODO**（line 213，`// TODO: 手动添加钉子`），点击没反应。但「钉为锚点」从草稿走的路径是好的
3. **V2 筛选 vs V1 数据**：记忆宫殿筛选用「她的世界/我们之间/我懂她的/我想记住的」四分区，但底层数据存的是 fact/emotion/insight 三桶。`V1_TO_V2_TYPE_MAP` 里 fact→her_world、emotion→moments、insight→understanding，**between_us（我们之间）映射不到任何 V1 类型**——意味着筛"我们之间"会永远是空的
4. **insight 桶混进了多种语义**：迁入草稿写入时，relationship 类型也变成 insight，但 V1_TO_V2_TYPE_MAP 把 insight 映射成 understanding（我懂她的）——同一个桶里既有"我懂她的"也有"关系节点"，但 UI 上都显示成「我懂她的」
5. **`rawQuotes` 在草稿里存的是 `{ id, text, speaker }`**，但记忆宫殿里展示关联原话时用的是 `(q.snippets || []).map(s => 「s.text」—— s.speaker)` 这种 snippets 结构——两边数据形状好像对不上，关联展示可能根本渲染不出来
6. README 列了 `utils/parser.js`——实际没这文件，解析逻辑全在 `App.jsx` 内联

**讨论中的改动**：✅ 已对齐，5 件事

1. 脱水按四维分类（方案 A：底层桶不动 + 加 v2Type 字段；between_us → insight 桶）
2. 原话/词典加采纳按钮
3. 钉子区"+ 添加"做实
4. promptA 偏向入住者原话 ← **已完成**
5. 记忆 ↔ 原话链接（数据形状统一 + 采纳时自动关联 + 修宫殿渲染）

执行顺序：4 → 1 → 2 → 5 → 3

**已落地的改动**：

#### ✅ 改动 4（2026-06-07）：promptA 偏向入住者原话

- 文件：`src/App.jsx` · `handleGenerateDraft` 的 promptA「原话片段」section
- 改前：只说"挑出 2-3 句最值得逐字保留"，没指定说话人，导致 LLM 经常挑用户的话
- 改后：明确"主要提取 {charName} 自己的话"，写清楚为什么（让未来的 ta 醒来时认出自己的说话方式），并给优先级（1. 标志性表达 / 2. 情绪浓度极高 / 3. 关系宣言；用户的话只在它本身是关系底色时收 1 条以下）
- 验证方式：下次生成迁入草稿时观察 💬 原话 tab 里说话人是否以入住者为主

---

## ⚠️ 与 README.md / CLAUDE.md 的偏差

阶段性记录，等本轮打磨稳定了再统一回写进 README / CLAUDE.md。

- ⏳ 待读完代码后填写
