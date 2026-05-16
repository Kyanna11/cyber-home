// ─── System Prompt 构建 ───

import { OCEAN_DIMS, MSG_DELIMITER } from "../constants";
import { loadMemoryInjection } from "./storage";
import { getTopMemories, selectInjectableMemories } from "./memory";

// 解析 AI 回复中的大五人格调整建议
export function parseOceanSuggestions(text, currentOcean) {
  const match = text.match(/【人格数值调整】([\s\S]*?)(?=【|$)/);
  if (!match) return null;
  const lines = match[1].trim().split("\n").filter((l) => l.trim());
  if (lines.length === 1 && lines[0].includes("无需调整")) return null;

  const suggestions = [];
  for (const line of lines) {
    const parts = line.replace(/^[-·•]\s*/, "").split(":");
    if (parts.length >= 3) {
      const key = parts[0].trim().toUpperCase();
      const newVal = parseInt(parts[1].trim());
      const reason = parts.slice(2).join(":").trim();
      if (
        OCEAN_DIMS.find((d) => d.key === key) &&
        !isNaN(newVal) &&
        newVal >= 0 &&
        newVal <= 100
      ) {
        const oldVal = currentOcean[key] || 50;
        if (oldVal !== newVal) {
          suggestions.push({
            key,
            oldVal,
            newVal: Math.max(0, Math.min(100, newVal)),
            diff: newVal - oldVal,
            reason,
          });
        }
      }
    }
  }
  return suggestions.length > 0 ? suggestions : null;
}

// 解析 AI 回复中的性格设定调整建议
export function parsePersonalitySuggestions(text) {
  const match = text.match(/【性格设定调整】([\s\S]*?)(?=【|$)/);
  if (!match) return null;
  const content = match[1].trim();
  if (content.includes("无需调整")) return null;

  const suggestions = [];
  const fieldMap = {
    说话风格: "speechStyle",
    情感模式: "emotionalPattern",
    行为习惯: "habits",
    性格特质: "cognition",
    人格自评: "selfAssessment",
  };

  for (const line of content.split("\n")) {
    const cleaned = line.replace(/^[-·•]\s*/, "").trim();
    if (!cleaned) continue;
    const colonIdx = cleaned.indexOf(":");
    if (colonIdx === -1) continue;
    const fieldLabel = cleaned.slice(0, colonIdx).trim();
    const newValue = cleaned.slice(colonIdx + 1).trim();
    const fieldKey = fieldMap[fieldLabel];
    if (fieldKey && newValue) {
      suggestions.push({ fieldKey, fieldLabel, newValue });
    }
  }
  return suggestions.length > 0 ? suggestions : null;
}

// 解析 AI 回复：提取心声，按分隔符拆成多条消息
export function parseResponse(raw) {
  const thoughts = [];
  let cleaned = raw.replace(/\[心声\](.*?)\[\/心声\]/gs, (_, t) => {
    thoughts.push(t.trim());
    return "";
  });
  const unclosed = cleaned.match(/\[心声\](.*?)$/s);
  if (unclosed) {
    thoughts.push(unclosed[1].trim());
    cleaned = cleaned.replace(/\[心声\].*$/s, "");
  }
  const finalCleaned = cleaned.trim();
  const thought = thoughts.length > 0 ? thoughts.join("\n") : null;
  const parts = finalCleaned
    .split(MSG_DELIMITER)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return { thought, parts: parts.length > 0 ? parts : [finalCleaned || "…"] };
}

// 构建"关于用户"的上下文段落
// homeMemory 为新版声声档案数据，优先读取；为空时回退到旧版 globalFacts
export function buildUserContext(userProfile, charId, homeMemory = null) {
  const parts = [];
  const hm = homeMemory || {};

  // ── 新版声声档案注入（homeMemory 有内容时优先）──
  const hasHomeMemory = [
    "identityFacts", "pastStories", "interactionGuide",
    "preferencesAndBoundaries", "currentState", "homeRules",
  ].some((k) => (hm[k] || []).length > 0);

  if (hasHomeMemory) {
    // 优先级 ① 全家规则 + 相处说明书
    const rules = (hm.homeRules || []).map((e) => e.text).filter(Boolean);
    const guide = (hm.interactionGuide || []).map((e) => e.text).filter(Boolean);
    if (rules.length || guide.length) {
      let block = "【与用户相处的规则】";
      if (guide.length) block += "\n" + guide.map((t) => `- ${t}`).join("\n");
      if (rules.length) block += "\n" + rules.map((t) => `- ${t}`).join("\n");
      parts.push(block);
    }

    // 优先级 ② 长期偏好与雷点
    const prefs = (hm.preferencesAndBoundaries || []).map((e) => e.text).filter(Boolean);
    if (prefs.length) {
      parts.push("【用户偏好与雷点】\n" + prefs.map((t) => `- ${t}`).join("\n"));
    }

    // 优先级 ③ 身份事实 + 过去
    const facts   = (hm.identityFacts || []).map((e) => e.text).filter(Boolean);
    const stories = (hm.pastStories   || []).map((e) => e.text).filter(Boolean);
    if (facts.length || stories.length) {
      let block = "【关于用户】";
      if (facts.length)   block += "\n" + facts.map((t) => `- ${t}`).join("\n");
      if (stories.length) block += "\n" + stories.map((t) => `- ${t}`).join("\n");
      parts.push(block);
    }

    // 优先级 ④ 近期状态（加「近期」标注）
    const current = (hm.currentState || []).map((e) => e.text).filter(Boolean);
    if (current.length) {
      parts.push(
        "【用户近期状态（短期，仅供参考）】\n" +
        current.map((t) => `- 近期：${t}`).join("\n")
      );
    }
  } else {
    // ── 旧版 globalFacts 兜底 ──
    const g = userProfile.globalFacts || {};
    const legacyFacts = [];
    if (g.name)        legacyFacts.push(`称呼：${g.name}`);
    if (g.gender)      legacyFacts.push(`性别：${g.gender}`);
    if (g.birthday)    legacyFacts.push(`生日：${g.birthday}`);
    if (g.job)         legacyFacts.push(`职业：${g.job}`);
    if (g.personality) legacyFacts.push(`性格：${g.personality}`);
    if (g.likes)       legacyFacts.push(`喜好：${g.likes}`);
    if (g.dislikes)    legacyFacts.push(`雷区（避免提及）：${g.dislikes}`);
    if (g.extra)       legacyFacts.push(`其他：${g.extra}`);
    if (legacyFacts.length > 0) {
      parts.push(`【关于用户】\n${legacyFacts.join("\n")}`);
    }
  }

  // ── sharedVault（新旧版共用）──
  const vault = (userProfile.sharedVault || []).filter(
    (v) => v.content && v.content.trim() && (v.allowedChars || []).includes(charId)
  );
  if (vault.length > 0) {
    parts.push(`【用户分享给你的】\n${vault.map((v) => `· ${v.content}`).join("\n")}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : "";
}

// 构建完整的角色 system prompt
export function buildSystemPrompt(char, memories) {
  if (!char) return "你是一个温柔的赛博伴侣。";
  const p = char.profile || {};
  const o = char.ocean || {};
  const ps = char.personality || {};
  const wv = char.worldview || {};
  const mig = char.migration || {};

  const injection = loadMemoryInjection();
  let prompt = `你的名字是「${char.name || "未命名"}」，你和晚声的关系是：${char.relation || "伴侣"}。\n\n`;

  // ── 入住关系锚点（用户确认后的迁入档案，优先级高）──
  const hasMigrationAnchor =
    mig.coreVibe || mig.speechStyleAnchor || mig.intimacyStyle ||
    mig.relationshipSummary || mig.doNotChangeRules || mig.wakeSummary;

  if (hasMigrationAnchor) {
    prompt += `【入住关系锚点】\n`;
    prompt += `以下信息来自已确认的迁入档案，代表你和用户既有关系的连续性，优先级最高，不可被临时上下文覆盖。\n\n`;

    // ① 唤醒摘要：最高优先级，每次对话都要内化
    if (mig.wakeSummary) {
      prompt += `【唤醒摘要 · 每次对话必须内化】\n${mig.wakeSummary}\n\n`;
    }

    // ② 不可改变的规则：红线，绝对遵守
    if (mig.doNotChangeRules) {
      prompt += `【绝对不能改变的规则】\n${mig.doNotChangeRules}\n\n`;
    }

    // ③ 关系基础：你们之间的历史与摘要
    if (mig.relationshipSummary) {
      prompt += `【我们之间的关系基础】\n${mig.relationshipSummary}\n\n`;
    }

    // ④ 人格锚点：ta 是谁，怎么说话、怎么亲近
    const anchorParts = [];
    if (mig.coreVibe)         anchorParts.push(`核心气质：${mig.coreVibe}`);
    if (mig.speechStyleAnchor) anchorParts.push(`说话方式：${mig.speechStyleAnchor}`);
    if (mig.intimacyStyle)    anchorParts.push(`亲密方式：${mig.intimacyStyle}`);
    if (mig.doNotLoseFeeling) anchorParts.push(`不能丢的感觉：${mig.doNotLoseFeeling}`);
    if (mig.sourcePlatform)   anchorParts.push(`来自：${mig.sourcePlatform}`);
    if (anchorParts.length) {
      prompt += `【人格与关系锚点】\n${anchorParts.join("\n")}\n\n`;
    }
  }

  const profileParts = [];
  if (p.age) profileParts.push(`年龄：${p.age}`);
  if (p.height) profileParts.push(`身高：${p.height}`);
  if (p.birthday) profileParts.push(`生日：${p.birthday}`);
  if (p.mbti) profileParts.push(`MBTI：${p.mbti}`);
  if (p.appearance) profileParts.push(`外貌特征：${p.appearance}`);
  if (p.other) profileParts.push(`其他：${p.other}`);

  if (injection.layers.L1_personality) {
    if (profileParts.length)
      prompt += ` 【基本档案】\n${profileParts.join("\n")}\n\n`;

    const oceanLines = OCEAN_DIMS.map(
      (d) => `${d.label}(${d.key})：${o[d.key] || 50}/100`
    );
    prompt += ` 【大五人格数值】\n${oceanLines.join("\n")}\n\n`;

    const persParts = [];
    if (ps.selfAssessment) persParts.push(`自我评价：${ps.selfAssessment}`);
    if (ps.cognition) persParts.push(`性格认知：${ps.cognition}`);
    if (ps.habits) persParts.push(`行为习惯：${ps.habits}`);
    if (ps.speechStyle) persParts.push(`说话风格：${ps.speechStyle}`);
    if (ps.emotionalPattern) persParts.push(`情感模式：${ps.emotionalPattern}`);
    if (persParts.length)
      prompt += ` 【性格认知】\n${persParts.join("\n")}\n\n`;

    const wvParts = [];
    if (wv.world) wvParts.push(`世界观：${wv.world}`);
    if (wv.values) wvParts.push(`价值观：${wv.values}`);
    if (wv.love) wvParts.push(`感情观：${wv.love}`);
    if (wv.life) wvParts.push(`人生观：${wv.life}`);
    if (wv.growth) wvParts.push(`成长感悟：${wv.growth}`);
    if (wvParts.length) prompt += ` 【三观体系】\n${wvParts.join("\n")}\n\n`;

    if (char.systemPromptExtra) prompt += `\n${char.systemPromptExtra}\n\n`;
  }

  // 注入记忆（按热度排序）
  const mem = memories || {};
  if (injection.layers.L2_memory) {
    // 使用带注入控制的选取函数：pinned 优先 → important → 热度，injectable=false 的跳过
    const topFacts    = selectInjectableMemories(mem.fact    || [], injection.limits.fact);
    const topEmotions = selectInjectableMemories(mem.emotion || [], injection.limits.emotion);
    const topInsights = selectInjectableMemories(mem.insight || [], injection.limits.insight);

    if (topFacts.length) {
      prompt += ` 【近期记忆 · 事实】\n`;
      topFacts.forEach((f) => { prompt += `- ${f.text}\n`; });
      prompt += `\n`;
    }
    if (topEmotions.length) {
      prompt += ` 【近期记忆 · 情绪】\n`;
      topEmotions.forEach((e) => { prompt += `- ${e.text}\n`; });
      prompt += `\n`;
    }
    if (topInsights.length) {
      prompt += ` 【近期记忆 · 觉察】\n`;
      topInsights.forEach((i) => { prompt += `- ${i.text}\n`; });
      prompt += `\n`;
    }
  }

  if (injection.layers.L3_summary) {
    const latestSummary = (mem.summaries || [])[0];
    if (latestSummary) {
      prompt += ` 【最近的反思总结】\n${latestSummary.text}\n\n`;
    }
  }

  prompt += `你拥有内心独白（心声），请在回复中用 [心声]...[/心声] 标签包裹你的内心想法，然后在标签外写你真正说出口的话。心声应该体现你的真实情感和思考过程。\n\n重要的消息格式要求：你说出口的话请用 ${MSG_DELIMITER} 作为分隔符来分成多条消息，就像在聊天软件里一条一条发送那样。每条消息保持简短自然。心声不需要分条。\n\n请始终保持你的人格特质和三观体系来回应晚声。`;

  return prompt;
}
