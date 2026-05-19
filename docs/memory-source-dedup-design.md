# 来源引用与记忆去重 · 设计文档

> 状态：设计草案，未实现。  
> 目标：解决同一段内容被重复写入宝库、时间线、档案、记忆宫殿的问题。

---

## 一、问题说明

### 当前的重复路径

同一段聊天内容，用户可能通过以下操作把它写入多个地方：

```
聊天消息
  ├─ 珍藏到宝库          → Treasure（保存原文）
  ├─ 记下这一刻          → TimelineEvent（保存摘要）
  ├─ 帮我记住            → MemoryItem（保存短条目）
  ├─ 整理一下我们        → SettlementDraft → 采纳后写入 MemoryItem
  └─ 场景结束后          → SceneThread 内容 → 可能被再次珍藏 / 沉淀
```

这会产生三类问题：

**1. 原文重复存储**  
同一段 200 字的入住者回复，可能以完整文本同时存在于宝库、时间线描述、记忆宫殿的 content 字段里。LocalStorage 空间有限，长期累积会造成压力。

**2. 修改不同步**  
用户在宝库里修改了备注或标题，时间线里关联的那份副本并不知道，两处展示不一致。

**3. Prompt 注入臃肿**  
如果记忆宫殿里保存了原文全文，且标记了 `pinned: true`，会被直接注入 prompt，大量占用 token，影响模型表现。用户通常只需要入住者知道"关键事实"，而不是每次都把原文背一遍。

**4. 用户感知混乱**  
"这件事我到底存在哪里了？"——用户不确定同一件事有没有被记住，反复操作，导致更多重复。

---

## 二、设计原则

### 核心分工

| 模块 | 负责 | 不做 |
|------|------|------|
| **我的宝库** | 保存原文珍藏 | 不默认注入 prompt |
| **关系时间线** | 保存事件节点（标题 + 短描述 + 时间） | 不复制长原文 |
| **声声档案 homeMemory** | 保存关于用户的确认短条目 | 不保存长篇原文 |
| **记忆宫殿** | 保存关系可用记忆和人格锚点（短） | 不默认保存原文 |
| **Prompt 注入** | 只注入短摘要 / 锚点 / 规则 | 不默认注入原文 |

### 七条原则

1. **原文只保存一份**——宝库是原文的唯一存储地，其他模块通过引用指向它。
2. **引用优先于复制**——能用 `sourceId` 引用的，不新建副本。
3. **提炼优先于原文**——写入档案和记忆宫殿时，存提炼后的短条目，不存全文。
4. **Prompt 只注入摘要**——原文不进入 prompt，除非用户主动触发"拿给他看 / 继续写下去"。
5. **不强制阻止重复**——用户有权把同一件事写到多处，系统提示但不拦截。
6. **来源可追溯**——每条记录都知道自己从哪里来，支持"查看原文"跳转。
7. **第一版靠 sourceType + sourceId 判重**——不做语义去重，不调用 embedding。

---

## 三、统一来源引用字段

### 3.1 字段定义

在需要追踪来源的对象上，统一加入以下字段：

```js
// 标准来源引用结构
{
  sourceRefs: [
    {
      sourceType: "chat"      // 聊天消息
               | "treasure"  // 我的宝库
               | "note"      // 手札
               | "scene"     // 亲密场景线程
               | "archive"   // 原始档案
               | "chunk"     // 记忆片段
               | "timeline"  // 时间线事件
               | "profile"   // 声声档案条目
               | "memory",   // 记忆宫殿条目
      sourceId:    string,   // 对应对象的 id
      sourceTitle: string,   // 来源的可读标题（冗余存储，防止原始对象被删后无法展示）
      excerpt:     string,   // 来源内容的前 80 字（用于提示，不用于 prompt）
    }
  ]
}
```

### 3.2 简化版（第一版可用）

如果一条记录只有单一来源，可以用简化字段代替数组：

```js
{
  originType:  "chat" | "treasure" | "note" | "scene" | ...,
  originId:    string,
  originTitle: string,
  originExcerpt: string,  // 前 80 字预览
}
```

两种方式兼容：有 `sourceRefs` 优先，无则看 `originType/originId`。

### 3.3 哪些对象需要支持来源引用

| 对象 | 是否需要 sourceRefs | 说明 |
|------|-------------------|------|
| `Treasure` | ✅ 需要 | 知道是从哪条聊天 / 手札 / 场景收藏来的 |
| `TimelineEvent` | ✅ 需要 | 事件节点指向它所记录的宝库条目或聊天 |
| `HomeEntry`（homeMemory 单条） | ✅ 需要 | 知道从哪个 ProfileDraft / 手札 / 聊天里采纳的 |
| `MemoryItem` | ✅ 需要 | 知道从哪段聊天 / 沉淀草稿 / 迁入草稿来的 |
| `SettlementDraft` | ✅ 需要 | 知道基于哪个线程 / 时间段生成的 |
| `MigrationDraft` | ✅ 已有 `sourceChunkIds` | 补充 sourceRefs 标准字段 |
| `ProfileDraft` | ✅ 需要 | 知道从手札 / 聊天 / 迁入草稿中提炼 |
| `SceneThread` | 🔶 可选 | 场景线程本身是来源，不需要引用其他来源 |
| `SelfCurationDraft` | ✅ 已有 `sourceChunkIds` | 补充 sourceRefs 标准字段 |

---

## 四、各模块分工细化

### 4.1 我的宝库 Treasure

**职责：原文的唯一存储地**

```js
// 当前已有
{
  id, charId,
  content,          // 原文全文（唯一保存在这里）
  title, note, tags,
  sourceMessageId,  // 当前字段
  // 新增
  sourceRefs: [...],
}
```

**规则：**
- 宝库是原文唯一存储地，其他地方引用 `treasureId`，不复制 `content`。
- 当原文超过 300 字时，其他模块应只存 `excerpt`（前 80 字），不存全文。
- 不默认注入 prompt，除非用户在宝库里手动标记「注入」（未实现，后续功能）。

---

### 4.2 关系时间线 TimelineEvent

**职责：事件节点，不保存长原文**

```js
{
  id, charId,
  title,            // 事件标题（必填，短）
  description,      // 描述（可选，建议 100 字以内）
  occurredAt,
  emotionTag,
  importance,
  // 新增
  sourceRefs: [
    { sourceType: "treasure", sourceId: "...", sourceTitle: "那天他说的话", excerpt: "..." }
  ]
}
```

**规则：**
- `description` 保存用户自己写的短描述，不复制宝库原文。
- 如果事件来自宝库，只存 `sourceRefs`，不复制 `content`。
- 展示时可以通过 `sourceId` 查找宝库条目显示完整原文（"查看原文 →"）。

---

### 4.3 声声档案 HomeEntry

**职责：关于用户的确认短条目**

```js
// homeMemory 中每个条目（当前是字符串数组，需结构化）
{
  id,
  section,          // "who_am_i" | "past" | "manual" | ...
  content,          // 短条目（建议 30 字以内）
  confirmedAt,
  // 新增
  sourceRefs: [
    { sourceType: "note", sourceId: "...", sourceTitle: "手札·2025-03-10", excerpt: "..." }
  ]
}
```

**规则：**
- `content` 是提炼后的短条目，不存原文。
- 可通过 `sourceRefs` 追溯到原始手札或聊天。
- 注入 prompt 时只注入 `content` 短文本，不展开 `sourceRefs`。

> ⚠️ **注意**：当前 homeMemory 是字符串数组结构，升级为对象数组是破坏性变更，需要做数据迁移（见第六节）。

---

### 4.4 记忆宫殿 MemoryItem

**职责：关系可用记忆和人格锚点（短）**

```js
{
  id, charId,
  type,             // "fact" | "emotion" | "insight" | "anchor" | ...
  content,          // 短条目（建议 50 字以内）
  pinned, injectable, important, priority,
  // 新增
  sourceRefs: [
    { sourceType: "chat", sourceId: "...", sourceTitle: "聊天 2025-03-08", excerpt: "..." }
  ]
}
```

**规则：**
- `content` 是提炼后的短条目，不保存原文全文。
- `pinned: true` + `injectable: true` 的条目才进入 prompt。
- 展示时可以通过 `sourceRefs` 查看原始内容。

---

### 4.5 SettlementDraft / MigrationDraft / ProfileDraft

这三种草稿本质上是"中间态"——由 AI 生成、用户审批、采纳后写入目标模块。

**规则：**
- 草稿里的 `sourceChunkIds` 和 `sourceRefs` 记录分析所基于的原始素材。
- 草稿采纳后，目标条目（HomeEntry / MemoryItem）继承 `sourceRefs`，不再保存原文。
- 草稿本身（未采纳前）可以存较完整的内容，不强制截断。

---

## 五、Prompt 注入规则

### 5.1 默认注入（每次聊天都有）

```
[系统级]
├─ char.systemPrompt（原始角色卡）
├─ char.wakeSummary（唤醒摘要，200字以内）
├─ char.doNotChangeRules（不可改变的规则）
├─ char.relationshipSummary（关系摘要）
│
[声声档案]
├─ homeMemory 各分区的短条目（内容本身，不含 sourceRefs）
│
[记忆宫殿]
└─ pinned: true 且 injectable: true 的 MemoryItem（content 短文本）
```

### 5.2 不默认注入

| 内容 | 原因 |
|------|------|
| 宝库原文（Treasure.content） | 原文太长，占用大量 token |
| 手札全文（Note.content） | 同上 |
| 亲密场景对话全文 | 同上 |
| RawArchive 原文 | 原始档案不是给模型看的 |
| 时间线长描述（TimelineEvent.description > 100字） | 注入摘要已足够 |
| MemoryItem.content 超过 80 字的条目 | 应该提炼后再标记为 injectable |

### 5.3 按需注入（用户主动触发）

以下操作会触发临时注入，仅在当次请求有效：

| 用户操作 | 临时注入内容 |
|----------|-------------|
| "继续写下去"（宝库） | 对应 Treasure.content 全文 |
| "分享手札给他" | 手札全文 + 分享意图 |
| "给他看这个链接" | 链接标题 + 备注 + 意图 |
| "基于这段内容生成草稿" | 对应片段全文 |
| 亲密邀请开场 | sceneConfig 场景描述 |

---

## 六、第一版实现建议

### 6.1 分阶段策略

第一版不做大规模数据结构改造，优先解决最容易产生重复的路径。

**阶段一（低成本，立即可做）：**

1. **Treasure → TimelineEvent 引用**  
   当用户点击宝库里的"记下这一刻"时，生成的 TimelineEvent 里加入 `sourceRefs: [{ sourceType: "treasure", sourceId: treasure.id, ... }]`，不复制 `content`。

2. **MemoryItem 来源追踪**  
   "帮我记住"生成的 MemoryItem 里加入 `sourceRefs: [{ sourceType: "chat", sourceId: messageId, ... }]`。

3. **ProfileDraft 来源追踪**  
   ProfileDraft 里加入 `sourceRefs`，采纳后传递给 HomeEntry。

**阶段二（中成本，下一阶段做）：**

4. **HomeEntry 结构化**  
   homeMemory 从字符串数组升级为对象数组，加入 `sourceRefs`。需要写迁移脚本，读取旧数据时转换格式。

5. **宝库重复提示**  
   在"珍藏到宝库"时，检查是否已有相同 `sourceType + sourceId` 的 Treasure，若有则提示"已收藏，是否继续？"

6. **时间线重复提示**  
   同上，"记下这一刻"时检查 `sourceRefs` 是否已有同源记录。

**阶段三（高成本，后续规划）：**

7. 语义去重（见第七节）
8. 宝库内容直接引用（其他模块只存 ID）
9. Prompt 注入控制 UI（用户可见哪些内容被注入）

### 6.2 重复检测轻量方案

```js
// 判断是否同源重复（第一版）
function isDuplicateSource(existingItems, newSourceType, newSourceId) {
  return existingItems.some(item =>
    item.sourceRefs?.some(ref =>
      ref.sourceType === newSourceType && ref.sourceId === newSourceId
    ) ||
    item.originType === newSourceType && item.originId === newSourceId
  );
}
```

使用场景：
- 珍藏到宝库前：检查 `treasures` 是否已有同源 item
- 记下这一刻前：检查 `timelineEvents` 是否已有同源 event
- 帮我记住前：检查 `allMemories` 是否已有同源 memory

提示文案示例（不阻止，只提示）：

```
「这段内容已经收藏到宝库（3月10日那天他说的话）。
 是否继续将它添加到时间线？」

[ 继续添加 ]  [ 跳过 ]
```

---

## 七、后续语义去重与向量规划

> 第一版不实现，记录在此供后续参考。

### 7.1 为什么第一版不做语义去重

- 语义相似性需要 embedding，当前没有后端和向量库。
- 本地 LocalStorage 不适合存储向量。
- 用户的记录量在 MVP 阶段有限，`sourceType + sourceId` 已经能覆盖大部分重复场景。

### 7.2 未来语义去重方案

当接入后端后，可以在以下时机做语义去重：

1. **写入前检测**  
   新建 MemoryItem 时，在后端用 cosine similarity 检查是否已有高度相似的条目（阈值 > 0.92），提示用户合并或跳过。

2. **定期去重建议**  
   后台任务周期扫描，找出语义相似的多条记录，生成"去重建议卡片"，用户手动确认合并。

3. **宝库归一化**  
   多个 Treasure 如果来源相同（同一 messageId），自动合并为一条，保留最新编辑的版本。

### 7.3 未来 embedding 规划

```
MemoryItem.content
  → 生成 embedding
  → 存入向量数据库（Supabase pgvector 或自建）
  → 写入新条目时，先查最近邻
  → 相似度 > 阈值：提示重复
  → 相似度 0.7~0.92：提示"可能相关，查看原有记录？"
```

---

## 八、各模块关系图（第一版目标状态）

```
聊天 / 场景 / 手札
        │
        ▼
   ┌────────────┐
   │  我的宝库  │  ← 原文唯一存储地
   │  Treasure  │
   └────┬───────┘
        │ sourceRefs（引用）
        ▼
  ┌──────────────────────────────┐
  │         其他模块              │
  │                              │
  │  TimelineEvent               │  ← 事件节点，引用宝库
  │  MemoryItem                  │  ← 短锚点，引用来源
  │  HomeEntry（声声档案）        │  ← 短条目，引用来源
  │  SettlementDraft 采纳结果    │  ← 引用生成所用的 chunks
  └──────────────────────────────┘
        │
        │ 只注入短文本
        ▼
   ┌────────────┐
   │   Prompt   │  ← 短摘要 / 锚点 / 规则
   └────────────┘
```

---

## 九、遗留问题与待确认

1. **HomeEntry 结构化的迁移**  
   homeMemory 从字符串数组升级为对象数组，需要一个迁移函数，在 App 初始化时检测旧数据格式并转换。旧字符串条目迁移后 `sourceRefs` 为空，不影响功能。

2. **宝库内容长度上限**  
   宝库保存原文全文，但 LocalStorage 有 5MB 上限。建议单条 Treasure 最大 5000 字，超出时提示用户截断或放弃保存。

3. **时间线描述上限**  
   TimelineEvent.description 建议 200 字以内。超出部分通过 `sourceRefs` 跳转到宝库查看，不在时间线里展开。

4. **场景线程的原文保存**  
   亲密场景结束后，当前设计是在聊天线程里保存完整对话。场景对话是否应该也走"宝库原文"流程，还是单独维护，待定。  
   初步建议：用户手动珍藏的场景片段进宝库，完整场景对话留在线程里，不自动复制到宝库。

5. **MigrationDraft / SelfCurationDraft 采纳后的原文处理**  
   草稿采纳后会创建 MemoryItem，MemoryItem.content 应该是提炼后的短文本，不是草稿的 rawOutput。rawOutput 只保留在草稿对象里，方便用户回看原始输出。
