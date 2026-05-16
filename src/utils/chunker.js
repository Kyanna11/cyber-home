// ─── 原始档案分段工具 ───
// 把 RawArchive 的 rawText 切分成 MemoryChunk 片段数组
// 规则：按空行优先分段；太短则向后合并；单段过长则按句子边界二次切分
// 不识别说话人，不解析平台格式，只保留原文

const TARGET_CHARS = 1000; // 目标字数（去空格后）
const MIN_CHARS    = 200;  // 低于此字数时向后合并
const MAX_CHARS    = 1500; // 超过此字数时尝试二次切分

// 计算去掉空白后的字数
function charLen(text) {
  return (text || "").replace(/\s/g, "").length;
}

// 对单段过长的文本按中文句子边界二次切分
function splitLongParagraph(text) {
  // 在句末标点后切分，保留标点
  const parts = text.split(/(?<=[。！？…]+(?:\n|$)|[\n]{1}(?=\n))/).filter(Boolean);

  const chunks = [];
  let current = "";

  for (const part of parts) {
    const combined = current ? current + part : part;
    if (charLen(combined) > TARGET_CHARS && current) {
      chunks.push(current.trim());
      current = part;
    } else {
      current = combined;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // 如果句子切分没有效果（整块都是一个句子），强行按行切
  if (chunks.length <= 1 && charLen(text) > MAX_CHARS) {
    const lines = text.split("\n").filter(Boolean);
    const forced = [];
    let buf = "";
    for (const line of lines) {
      const combined = buf ? buf + "\n" + line : line;
      if (charLen(combined) > TARGET_CHARS && buf) {
        forced.push(buf.trim());
        buf = line;
      } else {
        buf = combined;
      }
    }
    if (buf.trim()) forced.push(buf.trim());
    return forced.length > 1 ? forced : chunks;
  }

  return chunks;
}

/**
 * 将原始档案文本切分为片段文本数组。
 * @param {string} rawText  原始对话全文
 * @param {object} options  { minChars, targetChars, maxChars }（可选，覆盖默认值）
 * @returns {string[]}      切分后的片段文本数组（保留原文，不改写）
 */
export function splitRawTextToChunks(rawText, options = {}) {
  const min    = options.minChars    ?? MIN_CHARS;
  const target = options.targetChars ?? TARGET_CHARS;
  const max    = options.maxChars    ?? MAX_CHARS;

  if (!rawText || !rawText.trim()) return [];

  // 按空行拆段（支持 \r\n）
  const paragraphs = rawText
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const result = [];
  let buffer = "";

  for (const para of paragraphs) {
    const paraLen = charLen(para);

    if (!buffer) {
      buffer = para;
      continue;
    }

    const combined = buffer + "\n\n" + para;
    const combinedLen = charLen(combined);

    if (combinedLen <= target) {
      // 还没到目标大小，继续合并
      buffer = combined;
    } else if (charLen(buffer) < min) {
      // buffer 太短，即使超了目标也继续合并
      buffer = combined;
    } else {
      // buffer 已达到合适大小，先处理 buffer
      if (charLen(buffer) > max) {
        // buffer 自身太长，再拆一次
        result.push(...splitLongParagraph(buffer));
      } else {
        result.push(buffer.trim());
      }
      buffer = para;
    }
  }

  // 最后剩余的 buffer
  if (buffer.trim()) {
    if (charLen(buffer) > max) {
      result.push(...splitLongParagraph(buffer));
    } else {
      result.push(buffer.trim());
    }
  }

  // 过滤掉空片段
  return result.filter((c) => c.trim().length > 0);
}
