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
