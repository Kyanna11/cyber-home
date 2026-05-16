// ─── 记忆相关工具函数 ───

import { genId } from "./helpers";

// 计算单条记忆的热度分数
export function calculateHeat(memory) {
  if (typeof memory === "string") return 1;

  const now = Date.now();
  const lastActive = memory.lastMentioned || memory.createdAt || now;
  const daysSince = (now - lastActive) / (1000 * 60 * 60 * 24);

  let recency = 0;
  if (daysSince <= 3) recency = 3;
  else if (daysSince <= 7) recency = 2;
  else if (daysSince <= 30) recency = 1;

  const importance = memory.important ? 3 : 0;
  const mentions = Math.min(memory.mentions || 0, 5);

  return importance + mentions + recency;
}

// 把热度分数转成等级标签
export function getHeatLevel(heat) {
  if (heat >= 5) return { level: "hot", emoji: "🔴", label: "活跃" };
  if (heat >= 3) return { level: "warm", emoji: "🟡", label: "普通" };
  if (heat >= 1) return { level: "fading", emoji: "🟠", label: "褪色中" };
  return { level: "cold", emoji: "⚪", label: "已归档" };
}

// 把旧格式记忆（纯字符串）迁移为新格式（对象）
export function migrateMemoryEntries(entries) {
  if (!entries || !Array.isArray(entries)) return [];
  return entries.map((item) => {
    if (typeof item === "object" && item.text) {
      return {
        text: item.text,
        important: item.important || false,
        mentions: item.mentions || 0,
        createdAt: item.createdAt || Date.now(),
        lastMentioned: item.lastMentioned || null,
      };
    }
    return {
      text: String(item),
      important: false,
      mentions: 0,
      createdAt: Date.now(),
      lastMentioned: null,
    };
  });
}

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

  // 规范化新字段（旧数据无这些字段时取默认值）
  const normalized = migrated.map((m) => ({
    ...m,
    pinned:     m.pinned     ?? false,
    injectable: m.injectable ?? true,
    priority:   m.priority   ?? 0,
    source:     m.source     || (m.isAutoMemory ? "auto" : "manual"),
    heat:       calculateHeat(m),
  }));

  // 过滤掉禁止注入的
  const allowed = normalized.filter((m) => m.injectable !== false);

  // 三层：固定 → 重要 → 热度
  const pinned    = allowed.filter((m) => m.pinned);
  const important = allowed.filter((m) => m.important && !m.pinned)
                           .sort((a, b) => b.heat - a.heat);
  const rest      = allowed.filter((m) => !m.pinned && !m.important)
                           .sort((a, b) => b.heat - a.heat);

  // 固定记忆全部保留，剩余槽位按优先级填充
  const remaining  = Math.max(0, limit - pinned.length);
  const impSlice   = important.slice(0, remaining);
  const remaining2 = Math.max(0, remaining - impSlice.length);
  const restSlice  = rest.slice(0, remaining2);

  return [...pinned, ...impSlice, ...restSlice];
}

// 从 AI 回复中提取记忆标签，自动存入记忆库
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
    if (type && text && text.length > 0 && text.length <= 100) {
      newMemories.push({ type, text });
    }
  }

  if (newMemories.length > 0) {
    const charMem = allMemories[charId] || {
      fact: [],
      emotion: [],
      insight: [],
      summaries: [],
    };

    newMemories.forEach(({ type, text }) => {
      const entry = {
        id: genId(),
        text,
        time: new Date().toLocaleString("zh-CN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        ts: Date.now(),
        important: false,
        mentions: 0,
        createdAt: Date.now(),
        lastMentioned: null,
        isAutoMemory: true,
        // 注入控制字段
        pinned:     false,
        injectable: true,
        priority:   0,
        source:     "auto",
      };
      charMem[type] = [entry, ...(charMem[type] || [])];
    });

    setAllMemories((prev) => ({ ...prev, [charId]: charMem }));
    console.log(
      `🧠 AI 自动写入了 ${newMemories.length} 条记忆:`,
      newMemories.map((m) => `[${m.type}] ${m.text}`)
    );
  }

  // 把标签从显示文本里去掉，用户看不到
  return raw.replace(/\[记忆:(事实|情绪|觉察)\].*?\[\/记忆\]/gs, "").trim();
}
