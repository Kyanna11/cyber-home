// ─── 本地数据存取 ───
// 所有跟 localStorage 打交道的函数都在这里

import {
  STORAGE_KEY,
  CTX_STORAGE_KEY,
  DIARY_STORAGE_KEY,
  CHARS_STORAGE_KEY,
  MEMORIES_STORAGE_KEY,
  THREADS_STORAGE_KEY,
  MEMORY_INJECTION_KEY,
  RAW_ARCHIVES_STORAGE_KEY,
  MEMORY_CHUNKS_STORAGE_KEY,
  MIGRATION_DRAFTS_STORAGE_KEY,
  TIMELINE_EVENTS_STORAGE_KEY,
  SETTLEMENT_DRAFTS_STORAGE_KEY,
  PROFILE_DRAFTS_STORAGE_KEY,
  HOME_MEMORY_KEY,
  DEFAULT_HOME_MEMORY,
  TREASURES_STORAGE_KEY,
  STICKY_NOTES_STORAGE_KEY,
  SELF_CURATION_DRAFTS_STORAGE_KEY,
  GROUP_CHATS_STORAGE_KEY,
  GROUP_THREADS_STORAGE_KEY,
  CHAR_TREASURES_STORAGE_KEY,
} from "../constants";

// 通用读写
export function loadJSON(key, fallback) {
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch {}
  return fallback;
}

export function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// API 配置
export function loadConfig() {
  return loadJSON(STORAGE_KEY, { apiUrl: "", apiKey: "", model: "gpt-4.1", customModel: "" });
}
export function saveConfig(c) {
  saveJSON(STORAGE_KEY, c);
}

// 上下文配置
export function loadCtxConfig() {
  return loadJSON(CTX_STORAGE_KEY, { maxMessages: 20, maxTokens: 4096 });
}
export function saveCtxConfig(c) {
  saveJSON(CTX_STORAGE_KEY, c);
}

// 日记
export function loadDiary() {
  return loadJSON(DIARY_STORAGE_KEY, []);
}
export function saveDiary(d) {
  saveJSON(DIARY_STORAGE_KEY, d);
}

// 角色列表
export function loadChars() {
  return loadJSON(CHARS_STORAGE_KEY, []);
}
export function saveChars(c) {
  saveJSON(CHARS_STORAGE_KEY, c);
}

// 记忆数据
export function loadMemories() {
  return loadJSON(MEMORIES_STORAGE_KEY, {});
}
export function saveMemories(m) {
  saveJSON(MEMORIES_STORAGE_KEY, m);
}

// 话题线程
export function loadThreads() {
  return loadJSON(THREADS_STORAGE_KEY, {});
}
export function saveThreads(t) {
  saveJSON(THREADS_STORAGE_KEY, t);
}

// 原始档案
export function loadRawArchives() {
  return loadJSON(RAW_ARCHIVES_STORAGE_KEY, []);
}
export function saveRawArchives(a) {
  saveJSON(RAW_ARCHIVES_STORAGE_KEY, a);
}

// 记忆片段
export function loadMemoryChunks() {
  return loadJSON(MEMORY_CHUNKS_STORAGE_KEY, []);
}
export function saveMemoryChunks(chunks) {
  saveJSON(MEMORY_CHUNKS_STORAGE_KEY, chunks);
}

// 迁入提炼草稿
export function loadMigrationDrafts() {
  return loadJSON(MIGRATION_DRAFTS_STORAGE_KEY, []);
}
export function saveMigrationDrafts(drafts) {
  saveJSON(MIGRATION_DRAFTS_STORAGE_KEY, drafts);
}

// 关系时间线事件
export function loadTimelineEvents() {
  return loadJSON(TIMELINE_EVENTS_STORAGE_KEY, []);
}
export function saveTimelineEvents(events) {
  saveJSON(TIMELINE_EVENTS_STORAGE_KEY, events);
}

// 阶段沉淀草稿
export function loadSettlementDrafts() {
  return loadJSON(SETTLEMENT_DRAFTS_STORAGE_KEY, []);
}
export function saveSettlementDrafts(drafts) {
  saveJSON(SETTLEMENT_DRAFTS_STORAGE_KEY, drafts);
}

// 声声档案草稿
export function loadProfileDrafts() {
  return loadJSON(PROFILE_DRAFTS_STORAGE_KEY, []);
}
export function saveProfileDrafts(drafts) {
  saveJSON(PROFILE_DRAFTS_STORAGE_KEY, drafts);
}

// 声声档案 homeMemory
export function loadHomeMemory() {
  return loadJSON(HOME_MEMORY_KEY, { ...DEFAULT_HOME_MEMORY });
}
export function saveHomeMemory(m) {
  saveJSON(HOME_MEMORY_KEY, m);
}

// 宝库
export function loadTreasures() {
  return loadJSON(TREASURES_STORAGE_KEY, []);
}
export function saveTreasures(t) {
  saveJSON(TREASURES_STORAGE_KEY, t);
}

// 便签墙
export function loadStickyNotes() {
  return loadJSON(STICKY_NOTES_STORAGE_KEY, []);
}
export function saveStickyNotes(notes) {
  saveJSON(STICKY_NOTES_STORAGE_KEY, notes);
}

// 自选迁入草稿（他的行李）
export function loadSelfCurationDrafts() {
  return loadJSON(SELF_CURATION_DRAFTS_STORAGE_KEY, []);
}
export function saveSelfCurationDrafts(drafts) {
  saveJSON(SELF_CURATION_DRAFTS_STORAGE_KEY, drafts);
}

// 群聊 (GroupChat 元数据)
export function loadGroupChats() {
  return loadJSON(GROUP_CHATS_STORAGE_KEY, []);
}
export function saveGroupChats(chats) {
  saveJSON(GROUP_CHATS_STORAGE_KEY, chats);
}

// 群聊线程 (GroupThread，包含 messages)
export function loadGroupThreads() {
  return loadJSON(GROUP_THREADS_STORAGE_KEY, []);
}
export function saveGroupThreads(threads) {
  saveJSON(GROUP_THREADS_STORAGE_KEY, threads);
}

// 他的宝库（入住者珍藏用户的话）
export function loadCharTreasures() {
  return loadJSON(CHAR_TREASURES_STORAGE_KEY, []);
}
export function saveCharTreasures(items) {
  saveJSON(CHAR_TREASURES_STORAGE_KEY, items);
}
export function getCharTreasuresByCharId(items, charId) {
  return (items || []).filter((t) => t.charId === charId);
}

// 记忆注入配置
export function loadMemoryInjection() {
  return loadJSON(MEMORY_INJECTION_KEY, {
    layers: {
      L0_soul: true,
      L1_personality: true,
      L2_memory: true,
      L3_summary: true,
    },
    limits: {
      fact: 6,
      emotion: 3,
      insight: 3,
    },
  });
}
export function saveMemoryInjection(config) {
  saveJSON(MEMORY_INJECTION_KEY, config);
}
