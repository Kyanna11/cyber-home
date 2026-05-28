// ─── 原始档案分段工具（对话感知版）───
// 把 RawArchive 的 rawText 切分成 MemoryChunk 片段数组
// 优先识别对话格式（时间戳 / 说话人标记）按 session 切分
// 退化为空行分段切分

const TARGET_CHARS  = 2500; // 目标字数（去空格后）—— 比旧版大，保留更多上下文
const MIN_CHARS     = 400;
const MAX_CHARS     = 4000;

// ── 常见时间戳正则 ──
// 覆盖格式：2024-03-12 14:30、2024/03/12 14:30、03-12 14:30、下午 2:30 等
const TS_PATTERNS = [
  /^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}/,
  /^\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}/,
  /^(?:上午|下午|早上|晚上|凌晨)\s*\d{1,2}:\d{2}/,
  /^\d{1,2}:\d{2}:\d{2}/,
  /^\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\]/,  // [2024-03-12 14:30:00]
  /^\d{4}年\d{1,2}月\d{1,2}日/,
];

// 常见说话人标记（"用户:"、"Ta:"、"晚声:"、"坏克:"、"User:"）
const SPEAKER_PATTERNS = [
  /^([^\n:：]{1,20})\s*[:：]\s+/,  // "名字: 内容"
  /^<([^>]{1,20})>/,               // "<名字>内容"（部分平台）
];

function charLen(text) {
  return (text || "").replace(/\s/g, "").length;
}

// ── 从一行里尝试提取时间戳 ──
function extractTimestamp(line) {
  for (const pat of TS_PATTERNS) {
    const m = line.match(pat);
    if (m) return m[0];
  }
  return null;
}

// ── 把时间戳字符串解析为 Date（仅做相对比较） ──
function parseTs(tsStr) {
  if (!tsStr) return null;
  try {
    // 标准化分隔符后尝试解析
    const normalized = tsStr
      .replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, " ")
      .replace(/[/]/g, "-")
      .replace(/上午|早上/g, "").replace(/下午|晚上/g, "").replace(/凌晨/g, "")
      .trim();
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// ── 检测文本的整体格式 ──
function detectFormat(lines) {
  let tsCount = 0;
  let speakerCount = 0;
  const sampleSize = Math.min(lines.length, 60);

  for (let i = 0; i < sampleSize; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (extractTimestamp(line)) tsCount++;
    if (SPEAKER_PATTERNS.some(p => p.test(line))) speakerCount++;
  }

  const ratio = 1 / Math.max(sampleSize, 1) * sampleSize;
  if (tsCount >= 3) return "timestamped";
  if (speakerCount >= 5) return "speaker_marked";
  return "freeform";
}

// ── 按时间戳 session 切分（gap > 2小时 = 新 session）──
function splitBySession(rawText) {
  const lines = rawText.split(/\r?\n/);
  const sessions = [];
  let current = [];
  let lastTs = null;
  const GAP_MS = 2 * 60 * 60 * 1000; // 2小时

  for (const line of lines) {
    const ts = extractTimestamp(line.trim());
    if (ts) {
      const parsed = parseTs(ts);
      if (parsed && lastTs && (parsed - lastTs) > GAP_MS) {
        // 发现时间间隔 > 2h，切断
        if (current.length > 0) {
          sessions.push(current.join("\n"));
          current = [];
        }
      }
      lastTs = parsed || lastTs;
    }
    current.push(line);
  }
  if (current.length > 0) sessions.push(current.join("\n"));
  return sessions.filter(s => s.trim().length > 0);
}

// ── 按话题/说话人节奏切分 ──
// 不在说话人中途切断，在自然段落边界切断
function splitBySpeakerRhythm(rawText) {
  const paragraphs = rawText.split(/\r?\n\s*\r?\n/).filter(Boolean);
  const chunks = [];
  let buffer = "";

  for (const para of paragraphs) {
    const combined = buffer ? buffer + "\n\n" + para : para;
    const len = charLen(combined);

    if (len <= TARGET_CHARS) {
      buffer = combined;
    } else if (charLen(buffer) < MIN_CHARS) {
      buffer = combined;
    } else {
      if (charLen(buffer) > MAX_CHARS) {
        chunks.push(...splitLongParagraph(buffer));
      } else {
        chunks.push(buffer.trim());
      }
      buffer = para;
    }
  }
  if (buffer.trim()) {
    if (charLen(buffer) > MAX_CHARS) {
      chunks.push(...splitLongParagraph(buffer));
    } else {
      chunks.push(buffer.trim());
    }
  }
  return chunks.filter(c => c.trim().length > 0);
}

// ── 对单段过长的文本按中文句子边界二次切分 ──
function splitLongParagraph(text) {
  const parts = text
    .split(/(?<=[。！？…]+(?:\n|$)|[\n]{1}(?=\n))/)
    .filter(Boolean);

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

// ── 自动生成分块标签 ──
// 尝试从前几行提取日期/内容特征作为标签
function generateChunkLabel(chunkText, index) {
  const lines = chunkText.split("\n").map(l => l.trim()).filter(Boolean);

  // 尝试提取第一行的时间戳
  for (const line of lines.slice(0, 5)) {
    const ts = extractTimestamp(line);
    if (ts) {
      // 把时间戳格式化为短日期
      const parsed = parseTs(ts);
      if (parsed) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        const hour = parsed.getHours();
        const period = hour < 6 ? "凌晨" : hour < 12 ? "上午" : hour < 18 ? "下午" : "晚上";
        return `${y}-${m}-${d} ${period}的对话`;
      }
    }
  }

  // 尝试用前几行内容做摘要标签（取前40字，去掉说话人前缀）
  const preview = lines
    .slice(0, 3)
    .join(" ")
    .replace(/^[^\n:：]{1,20}\s*[:：]\s+/, "") // 去掉说话人前缀
    .slice(0, 40)
    .trim();

  if (preview.length >= 5) return preview + (preview.length === 40 ? "…" : "");

  return `片段 ${index + 1}`;
}

/**
 * 将原始档案文本切分为片段对象数组。
 * @param {string} rawText  原始对话全文
 * @param {object} options  { minChars, targetChars, maxChars }（可选）
 * @returns {{ text: string, label: string, index: number, detectedFormat: string }[]}
 */
export function splitRawTextToChunks(rawText, options = {}) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const fmt = detectFormat(lines);

  let textChunks;

  if (fmt === "timestamped") {
    // 按 session（时间间隔）切分，太大的 session 再细切
    const sessions = splitBySession(rawText);
    textChunks = sessions.flatMap(sess => {
      if (charLen(sess) > MAX_CHARS) return splitLongParagraph(sess);
      if (charLen(sess) < MIN_CHARS) return [sess]; // 保留短 session
      return [sess];
    });
    // 合并过短的相邻片段
    textChunks = mergeShortChunks(textChunks);
  } else {
    // freeform 或 speaker_marked：按空行 + 说话节奏切分
    textChunks = splitBySpeakerRhythm(rawText);
  }

  return textChunks
    .filter(t => t.trim().length > 0)
    .map((text, index) => ({
      text,
      label: generateChunkLabel(text, index),
      index,
      detectedFormat: fmt,
    }));
}

// 把太短的相邻片段合并到合适大小
function mergeShortChunks(chunks) {
  const result = [];
  let buffer = "";

  for (const chunk of chunks) {
    const combined = buffer ? buffer + "\n\n" + chunk : chunk;
    if (charLen(combined) <= TARGET_CHARS || charLen(buffer) < MIN_CHARS) {
      buffer = combined;
    } else {
      if (buffer.trim()) result.push(buffer.trim());
      buffer = chunk;
    }
  }
  if (buffer.trim()) result.push(buffer.trim());
  return result;
}

// ── 向后兼容：老版本只返回字符串数组 ──
export function splitRawTextToChunkTexts(rawText, options = {}) {
  return splitRawTextToChunks(rawText, options).map(c => c.text);
}
