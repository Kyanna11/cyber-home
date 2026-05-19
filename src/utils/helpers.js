// ─── 通用小工具函数 ───

// 生成唯一 ID（时间戳 + 随机数）
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * 构建统一来源引用对象
 * sourceType: "chat" | "treasure" | "note" | "scene" | "timeline" |
 *             "memory" | "profile" | "archive" | "chunk"
 */
export function buildSourceRef({
  sourceType,
  sourceId   = "",
  sourceTitle = "",
  excerpt    = "",
} = {}) {
  return {
    sourceType: sourceType || "chat",
    sourceId:   String(sourceId   || ""),
    sourceTitle: String(sourceTitle || ""),
    excerpt:    String(excerpt    || "").slice(0, 80),
  };
}

// 粗略估算文本的 token 数
// 中文字按 1.5 个 token，英文字符按 0.25 个 token
export function estimateTokens(text) {
  if (!text) return 0;
  let tokens = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    tokens += code > 0x4e00 && code < 0x9fff ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}
