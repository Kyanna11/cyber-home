// ─── 记忆相关工具函数 ───

import { genId } from "./helpers";

// ══════════════════════════════════════════════════════════
//  基础工具
// ══════════════════════════════════════════════════════════

// 计算单条记忆的热度分数
export function calculateHeat(memory) {
  if (typeof memory === "string") return 1;

  const now = Date.now();
  const lastActive = memory.lastMentioned || memory.createdAt || now;
  const daysSince = (now - lastActive) / (1000 * 60 * 60 * 24);

  let recency = 0;
  if (daysSince <= 3)       recency = 4; // 刚聊到的
  else if (daysSince <= 14) recency = 3; // 两周内
  else if (daysSince <= 30) recency = 2; // 一个月内
  else if (daysSince <= 60) recency = 1; // 两个月内

  const importance = memory.important ? 4 : 0;
  const pinned     = memory.pinned    ? 10 : 0; // pinned 直接拉满
  const mentions   = Math.min(memory.mentions || 0, 5);

  return pinned + importance + mentions + recency;
}

// 把热度分数转成等级标签
export function getHeatLevel(heat) {
  if (heat >= 10) return { level: "pinned", emoji: "📌", label: "固定" };
  if (heat >= 5)  return { level: "hot",    emoji: "🔴", label: "活跃" };
  if (heat >= 3)  return { level: "warm",   emoji: "🟡", label: "普通" };
  if (heat >= 1)  return { level: "fading", emoji: "🟠", label: "褪色中" };
  return { level: "cold", emoji: "⚪", label: "已归档" };
}

// 把旧格式记忆（纯字符串）迁移为新格式（对象）
export function migrateMemoryEntries(entries) {
  if (!entries || !Array.isArray(entries)) return [];
  return entries.map((item) => {
    if (typeof item === "object" && item.text) {
      return {
        text:          item.text,
        important:     item.important     || false,
        mentions:      item.mentions      || 0,
        createdAt:     item.createdAt     || Date.now(),
        lastMentioned: item.lastMentioned || null,
        pinned:        item.pinned        ?? false,
        injectable:    item.injectable    ?? true,
        priority:      item.priority      ?? 0,
        source:        item.source        || (item.isAutoMemory ? "auto" : "manual"),
        id:            item.id            || genId(),
      };
    }
    return {
      id:            genId(),
      text:          String(item),
      important:     false,
      mentions:      0,
      createdAt:     Date.now(),
      lastMentioned: null,
      pinned:        false,
      injectable:    true,
      priority:      0,
      source:        "manual",
    };
  });
}

// ══════════════════════════════════════════════════════════
//  关键词提取 & 文本相似度
// ══════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  "的","了","是","在","有","和","就","不","也","都",
  "很","会","能","要","这","那","她","他","我","你",
  "说","又","还","但","吧","呢","啊","吗","着","过",
  "一个","什么","怎么","可以","因为","所以","如果","已经",
  "一些","一样","这样","那样","然后","其实","觉得","知道",
  "时候","没有","现在","自己","这个","这些","他们","她们",
]);

/**
 * 从文本中提取有意义的关键词（过滤停用词，保留2字以上词汇）
 * @param {string} text
 * @returns {string[]}
 */
export function extractKeywords(text) {
  if (!text) return [];
  return text
    .replace(/[，。！？、：；""''（）【】《》\s\n\r]/g, " ")
    .split(" ")
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * 基于字符级 bigram 的 Dice 系数文本相似度（0~1，越高越相似）
 * 零依赖，中文效果不错
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function textSimilarity(a, b) {
  const getBigrams = (str) => {
    const s = (str || "").replace(/\s+/g, "");
    const bigrams = new Set();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.substring(i, i + 2));
    }
    return bigrams;
  };
  const setA = getBigrams(a);
  const setB = getBigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach(bg => { if (setB.has(bg)) intersection++; });
  return (2 * intersection) / (setA.size + setB.size);
}

// ══════════════════════════════════════════════════════════
//  话题召回
// ══════════════════════════════════════════════════════════

/**
 * 根据最近对话内容，从记忆池中召回相关记忆
 * @param {object[]} recentMessages  最近的消息列表（含 content 字段）
 * @param {object[]} allMemories     所有记忆条目（已含 keywords 字段或会自动提取）
 * @param {number}   limit           最多返回多少条
 * @returns {object[]}               带 relevance 分数的记忆数组，已排序
 */
export function recallByTopic(recentMessages, allMemories, limit) {
  if (!recentMessages?.length || !allMemories?.length || limit <= 0) return [];

  // 从最近 6 条消息提取话题关键词（3轮对话）
  const recentText = recentMessages
    .slice(-6)
    .map(m => m.content || "")
    .join(" ");

  const topicKeywords = extractKeywords(recentText);
  if (topicKeywords.length === 0) return [];

  const scored = allMemories
    .filter(m => m.injectable !== false)
    .map(entry => {
      const entryKeywords = entry.keywords || extractKeywords(entry.text);
      const matchCount = entryKeywords.filter(kw =>
        topicKeywords.some(tk => tk.includes(kw) || kw.includes(tk))
      ).length;
      // 关键词匹配数 × 10 + 热度小权重
      const relevance = matchCount * 10 + (calculateHeat(entry) * 0.5);
      return { ...entry, keywords: entryKeywords, relevance, matchCount };
    })
    .filter(e => e.matchCount > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

  return scored;
}

// ══════════════════════════════════════════════════════════
//  自动记忆质量门槛
// ══════════════════════════════════════════════════════════

const LOW_VALUE_PATTERNS = [
  /今天(心情|状态|感觉)(不错|还好|一般|很好|不太好)/,
  /^(她|他)(说了|提到了|聊了)(一些|很多|一点)/,
  /^(开心|难过|累了|疲惫|高兴)$/,
  /^(很|比较|有点)(开心|难过|累|忙|好)/,
  /情绪(不错|还好|一般)/,
];

/**
 * 判断一条自动记忆是否值得写入（三重门槛）
 * @param {object}   newEntry        { text: string }
 * @param {object[]} existingMemories 已有的同类型记忆
 * @returns {boolean}
 */
export function shouldSaveAutoMemory(newEntry, existingMemories = []) {
  const text = (newEntry.text || "").trim();

  // ① 长度门槛：太短没信息量，太长不精炼
  if (text.length < 6 || text.length > 50) return false;

  // ② 模糊去重：跟已有记忆相似度过高则丢弃
  const isDuplicate = existingMemories.some(
    existing => textSimilarity(existing.text, text) > 0.7
  );
  if (isDuplicate) return false;

  // ③ 低信息量模式检查
  if (LOW_VALUE_PATTERNS.some(p => p.test(text))) return false;

  return true;
}

// ══════════════════════════════════════════════════════════
//  记忆热度更新（双向检查 + 2关键词门槛）
// ══════════════════════════════════════════════════════════

/**
 * 根据一轮对话内容更新相关记忆的热度
 * 同时检查用户消息 + AI 回复，要求匹配 ≥2 个关键词才算"被提及"
 * @param {string}   userMessage
 * @param {string}   aiResponse
 * @param {object}   charMemories   { fact: [], emotion: [], insight: [], consolidated: [], archived: [] }
 * @returns {object}                 更新后的 charMemories（含归档恢复）
 */
export function updateMemoryHeat(userMessage, aiResponse, charMemories) {
  if (!charMemories) return charMemories;

  const combinedText = (userMessage || "") + " " + (aiResponse || "");
  const conversationKeywords = extractKeywords(combinedText);
  if (conversationKeywords.length === 0) return charMemories;

  const updated = { ...charMemories };
  const toRestoreFromArchive = [];

  // 遍历所有活跃分类 + consolidated
  const activeTypes = ["fact", "emotion", "insight", "consolidated"];
  activeTypes.forEach(type => {
    if (!updated[type]) return;
    updated[type] = updated[type].map(entry => {
      const entryKeywords = entry.keywords || extractKeywords(entry.text);
      const matchedKeywords = entryKeywords.filter(kw =>
        conversationKeywords.some(ck => ck.includes(kw) || kw.includes(ck))
      );
      // 要求至少 2 个不同关键词才算命中（大幅降低误触发）
      if (matchedKeywords.length >= 2) {
        return {
          ...entry,
          keywords:      entryKeywords, // 缓存关键词
          mentions:      (entry.mentions || 0) + 1,
          lastMentioned: Date.now(),
        };
      }
      return entry.keywords ? entry : { ...entry, keywords: entryKeywords };
    });
  });

  // 检查归档记忆是否被话题触发 → 自动恢复
  if (updated.archived?.length) {
    const stillArchived = [];
    updated.archived.forEach(entry => {
      const entryKeywords = entry.keywords || extractKeywords(entry.text);
      const matchedKeywords = entryKeywords.filter(kw =>
        conversationKeywords.some(ck => ck.includes(kw) || kw.includes(ck))
      );
      if (matchedKeywords.length >= 2) {
        // 归档记忆被话题触发，恢复到原来的分类
        const restoreType = entry.archivedFrom || "fact";
        const restored = {
          ...entry,
          keywords:      entryKeywords,
          mentions:      (entry.mentions || 0) + 1,
          lastMentioned: Date.now(),
          archivedAt:    undefined,
          archivedFrom:  undefined,
          _restoredAt:   Date.now(),
        };
        toRestoreFromArchive.push({ type: restoreType, entry: restored });
      } else {
        stillArchived.push(entry.keywords ? entry : { ...entry, keywords: entryKeywords });
      }
    });
    updated.archived = stillArchived;

    // 把恢复的条目放回对应分类
    toRestoreFromArchive.forEach(({ type, entry }) => {
      updated[type] = [entry, ...(updated[type] || [])];
      console.log(`🔥 归档记忆被话题唤起：[${type}] ${entry.text}`);
    });
  }

  return updated;
}

// ══════════════════════════════════════════════════════════
//  自动归档（90天未活跃的记忆移入 archived）
// ══════════════════════════════════════════════════════════

const ARCHIVE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000; // 90天

/**
 * 检查并归档长期不活跃的记忆
 * pinned / important 的记忆永不自动归档
 * @param {object} charMemories
 * @returns {object} 更新后的 charMemories
 */
export function autoArchiveCheck(charMemories) {
  if (!charMemories) return charMemories;

  const now = Date.now();
  const updated = { ...charMemories };
  const toArchive = [];

  ["fact", "emotion", "insight"].forEach(type => {
    if (!updated[type]) return;
    const active = [];
    updated[type].forEach(entry => {
      // pinned / important 永不自动归档
      if (entry.pinned || entry.important) {
        active.push(entry);
        return;
      }
      const lastActive = entry.lastMentioned || entry.createdAt || now;
      if (now - lastActive > ARCHIVE_THRESHOLD_MS) {
        toArchive.push({ ...entry, archivedAt: now, archivedFrom: type });
      } else {
        active.push(entry);
      }
    });
    updated[type] = active;
  });

  if (toArchive.length > 0) {
    updated.archived = [...toArchive, ...(updated.archived || [])];
    console.log(`📦 自动归档了 ${toArchive.length} 条记忆`);
  }

  return updated;
}

// ══════════════════════════════════════════════════════════
//  双层记忆注入组装（常驻层 + 话题召回层）
// ══════════════════════════════════════════════════════════

/**
 * 为 system prompt 组装记忆注入内容
 * 第一层：常驻记忆（pinned + important，占预算40%）
 * 第二层：话题召回（跟当前对话相关，占剩余60%）
 * @param {object}   charMemories   { fact, emotion, insight, consolidated, archived }
 * @param {object[]} recentMessages 最近的聊天记录
 * @param {number}   totalLimit     总条数预算（默认12）
 * @returns {{ resident: object[], recalled: object[] }}
 */
export function assembleMemoryInjection(charMemories, recentMessages = [], totalLimit = 12) {
  if (!charMemories) return { resident: [], recalled: [] };

  // 合并所有分类的记忆条目
  const allEntries = [
    ...(charMemories.fact        || []),
    ...(charMemories.emotion     || []),
    ...(charMemories.insight     || []),
    ...(charMemories.consolidated || []),
    ...(charMemories.archived    || []),
  ].map(m => ({
    ...m,
    keywords: m.keywords || extractKeywords(m.text),
    heat:     calculateHeat(m),
    // 规范化注入控制字段
    pinned:     m.pinned     ?? false,
    injectable: m.injectable ?? true,
    important:  m.important  ?? false,
  }));

  // 过滤禁止注入的
  const allowed = allEntries.filter(m => m.injectable !== false);

  // ── 第一层：常驻记忆（pinned + important）──
  const RESIDENT_BUDGET = Math.floor(totalLimit * 0.4);
  const pinned    = allowed.filter(m => m.pinned);
  const important = allowed
    .filter(m => m.important && !m.pinned)
    .sort((a, b) => b.heat - a.heat);

  const residentRaw = [...pinned, ...important].slice(0, RESIDENT_BUDGET);

  // ── 第二层：话题召回（排除已在常驻层的）──
  const RECALL_BUDGET = totalLimit - residentRaw.length;
  const residentIds   = new Set(residentRaw.map(m => m.id).filter(Boolean));
  const recallPool    = allowed.filter(m => !residentIds.has(m.id));
  const recalled      = recallByTopic(recentMessages, recallPool, RECALL_BUDGET);

  return { resident: residentRaw, recalled };
}

// ══════════════════════════════════════════════════════════
//  容量检查
// ══════════════════════════════════════════════════════════

const CAPACITY_LIMITS = {
  fact:         30,
  emotion:      20,
  insight:      15,
  consolidated: 30,
  archived:     100,
};

/**
 * 检查记忆容量，返回超出上限的分类列表
 * @param {object} charMemories
 * @returns {{ type: string, count: number, limit: number }[]}
 */
export function checkCapacityWarnings(charMemories) {
  if (!charMemories) return [];
  return Object.entries(CAPACITY_LIMITS)
    .filter(([type, limit]) => (charMemories[type] || []).length > limit)
    .map(([type, limit]) => ({
      type,
      count: charMemories[type].length,
      limit,
    }));
}

// ══════════════════════════════════════════════════════════
//  旧版兼容 API（保持对外接口不变）
// ══════════════════════════════════════════════════════════

// 按热度排序，取前 N 条（用于注入 system prompt）
export function getTopMemories(entries, limit) {
  if (!entries || entries.length === 0) return [];
  const migrated = migrateMemoryEntries(entries);
  return migrated
    .map((m) => ({ ...m, heat: calculateHeat(m) }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, limit);
}

// 带注入控制的记忆选取：pinned 优先 → important → 热度排序
// injectable === false 的条目完全跳过
export function selectInjectableMemories(entries, limit) {
  if (!entries || entries.length === 0 || limit <= 0) return [];
  const migrated = migrateMemoryEntries(entries);

  const normalized = migrated.map((m) => ({
    ...m,
    pinned:     m.pinned     ?? false,
    injectable: m.injectable ?? true,
    priority:   m.priority   ?? 0,
    source:     m.source     || (m.isAutoMemory ? "auto" : "manual"),
    heat:       calculateHeat(m),
  }));

  const allowed    = normalized.filter((m) => m.injectable !== false);
  const pinned     = allowed.filter((m) => m.pinned);
  const important  = allowed.filter((m) => m.important && !m.pinned).sort((a, b) => b.heat - a.heat);
  const rest       = allowed.filter((m) => !m.pinned && !m.important).sort((a, b) => b.heat - a.heat);

  const remaining  = Math.max(0, limit - pinned.length);
  const impSlice   = important.slice(0, remaining);
  const remaining2 = Math.max(0, remaining - impSlice.length);
  const restSlice  = rest.slice(0, remaining2);

  return [...pinned, ...impSlice, ...restSlice];
}

// 从 AI 回复中提取记忆标签，自动存入记忆库（含质量门槛）
// 返回清理掉标签后的干净回复文本
export function extractAndSaveMemories(raw, charId, allMemories, setAllMemories) {
  if (!raw || !charId) return raw;

  const memoryRegex = /\[记忆:(事实|情绪|觉察)\](.*?)\[\/记忆\]/gs;
  const typeMap = { 事实: "fact", 情绪: "emotion", 觉察: "insight" };
  let match;
  const newMemories = [];

  while ((match = memoryRegex.exec(raw)) !== null) {
    const type = typeMap[match[1]];
    const text = match[2].trim();
    if (type && text) {
      newMemories.push({ type, text });
    }
  }

  if (newMemories.length > 0) {
    const charMem = allMemories[charId] || {
      fact: [], emotion: [], insight: [], summaries: [],
      consolidated: [], archived: [],
    };

    let saved = 0;
    newMemories.forEach(({ type, text }) => {
      // ── 质量门槛：三重检查 ──
      if (!shouldSaveAutoMemory({ text }, charMem[type] || [])) {
        console.log(`🚫 自动记忆被质量门槛拦截：[${type}] ${text}`);
        return;
      }

      const entry = {
        id:            genId(),
        text,
        time: new Date().toLocaleString("zh-CN", {
          month:  "short",
          day:    "numeric",
          hour:   "2-digit",
          minute: "2-digit",
        }),
        ts:            Date.now(),
        important:     false,
        mentions:      0,
        createdAt:     Date.now(),
        lastMentioned: null,
        isAutoMemory:  true,
        pinned:        false,
        injectable:    true,
        priority:      0,
        source:        "auto",
        keywords:      extractKeywords(text), // 预计算关键词，加速话题召回
      };
      charMem[type] = [entry, ...(charMem[type] || [])];
      saved++;
    });

    if (saved > 0) {
      setAllMemories((prev) => ({ ...prev, [charId]: charMem }));
      console.log(`🧠 AI 写入了 ${saved}/${newMemories.length} 条记忆（质量门槛通过）`);
    }
  }

  return raw.replace(/\[记忆:(事实|情绪|觉察)\].*?\[\/记忆\]/gs, "").trim();
}
