// ─── 唤醒预览页 ───
// 展示某个入住者在聊天时实际会被注入哪些信息
// 复用与 callLLM 完全相同的拼装逻辑，所见即所发

import { useState } from "react";
import BackButton from "../components/BackButton";
import { buildSystemPrompt, buildUserContext } from "../utils/prompt";
import { estimateTokens } from "../utils/helpers";
import { loadMemoryInjection } from "../utils/storage";
import { selectInjectableMemories } from "../utils/memory";

// ── 样式常量 ──
const preStyle = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: 12,
  lineHeight: 1.85,
  color: "#5a4a6a",
  fontFamily: "var(--font-main)",
};

const sectionLabelStyle = {
  fontSize: 10,
  color: "#9a8aac",
  letterSpacing: 1.5,
  marginBottom: 4,
};

const memItemStyle = {
  fontSize: 11,
  color: "#5a4a6a",
  lineHeight: 1.75,
  marginBottom: 2,
};

// ── 工具函数 ──
function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text || "");
  }
  return new Promise((resolve) => {
    const el = document.createElement("textarea");
    el.value = text || "";
    el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    resolve();
  });
}

// ── 小提示条 ──
function Tip({ color = "blue", children }) {
  const palette = {
    red:   { bg: "rgba(192,112,112,.08)", border: "rgba(192,112,112,.2)",  text: "#9a5050" },
    amber: { bg: "rgba(192,160,80,.08)",  border: "rgba(192,160,80,.2)",   text: "#906a20" },
    blue:  { bg: "rgba(100,120,180,.08)", border: "rgba(100,120,180,.2)",  text: "#5a6a9a" },
  }[color] || {};
  return (
    <div style={{
      padding: "10px 14px", marginBottom: 10,
      background: palette.bg, border: `1px solid ${palette.border}`,
      borderRadius: 10, fontSize: 12, color: palette.text, lineHeight: 1.8,
    }}>
      💡 {children}
    </div>
  );
}

// ── 字段行 ──
function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ ...sectionLabelStyle, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#5a4a6a", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

// ── 折叠区块 ──
function Block({ emoji, title, isEmpty, isOpen: initOpen = false, children, copyText, copyLabel, onCopy, copied }) {
  const [open, setOpen] = useState(!!initOpen);

  return (
    <div style={{
      marginBottom: 10, borderRadius: 14, overflow: "hidden",
      border: "1px solid rgba(196,166,184,.25)",
      background: "rgba(255,255,255,.72)",
    }}>
      <button
        onClick={() => !isEmpty && setOpen((o) => !o)}
        style={{
          width: "100%", padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
          background: !isEmpty && open ? "rgba(196,166,184,.1)" : "transparent",
          border: "none", cursor: isEmpty ? "default" : "pointer",
          fontFamily: "var(--font-main)", transition: "background .2s",
        }}
      >
        <span style={{ fontSize: 15 }}>{emoji}</span>
        <span style={{
          flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600,
          color: isEmpty ? "#b0a0c0" : "#5a4a6a", letterSpacing: 1,
        }}>
          {title}
        </span>
        {isEmpty
          ? <span style={{ fontSize: 10, color: "#b0a0c0", padding: "2px 8px", background: "rgba(196,166,184,.1)", borderRadius: 6 }}>暂无</span>
          : <span style={{ fontSize: 11, color: "#9a8aac" }}>{open ? "▲" : "▼"}</span>
        }
      </button>

      {!isEmpty && open && (
        <div style={{ padding: "2px 16px 14px" }}>
          {children}
          {copyText && (
            <button
              onClick={() => onCopy?.(copyText, copyLabel)}
              style={{
                marginTop: 10, padding: "5px 14px",
                background: copied === copyLabel ? "rgba(130,180,140,.2)" : "rgba(255,255,255,.6)",
                border: "1px solid rgba(196,166,184,.3)", borderRadius: 10,
                color: copied === copyLabel ? "#3a7a4a" : "#7a6a8e",
                fontSize: 11, cursor: "pointer", fontFamily: "var(--font-main)",
                transition: "all .2s",
              }}
            >
              {copied === copyLabel ? "✓ 已复制" : "复制"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 主组件 ──
export default function WakePreviewPage({
  char,
  charMemories,
  worldView,
  userProfile,
  ctxConfig,
  navigateTo,
  prevPage,
}) {
  const [copied, setCopied] = useState("");
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const handleCopy = (text, label) => {
    copyToClipboard(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const mig = char?.migration || {};
  const hasMigrationAnchor = !!(
    mig.coreVibe || mig.speechStyleAnchor || mig.intimacyStyle ||
    mig.doNotLoseFeeling || mig.relationshipSummary || mig.doNotChangeRules || mig.wakeSummary
  );

  // ── 与 callLLM 完全相同的 prompt 拼装 ──
  const now = new Date();
  const timeInfo = `【当前时间】${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.toLocaleString("zh-CN", { weekday: "long" })} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const memoryInstruction = `\n\n【记忆写入指令】
  当你在对话中发现以下类型的重要信息时，请在回复末尾用特殊标签写入记忆（用户看不到这些标签）：
  - 用户提到的新事实（生活事件、人物关系、重要变化等）→ [记忆:事实]内容[/记忆]
  - 对话中产生的重要情绪感受 → [记忆:情绪]内容[/记忆]
  - 你从对话中获得的觉察和理解 → [记忆:觉察]内容[/记忆]
  每条记忆控制在30字以内，简洁准确。不是每次都需要写入，只在确实有值得记住的内容时才写。一次最多写入2条。`;

  const userCtx = char ? buildUserContext(userProfile, char.id) : "";
  const mainPrompt = char
    ? buildSystemPrompt(char, charMemories)
    : "（未选择入住者）";
  const worldViewSection = worldView
    ? `\n\n【你的世界观与核心认知】\n${worldView}`
    : "";
  const fullPrompt =
    timeInfo + "\n\n" + mainPrompt + worldViewSection +
    (userCtx ? `\n\n${userCtx}` : "") + memoryInstruction;

  const tokenCount = estimateTokens(fullPrompt);

  // ── 记忆注入统计（与 buildSystemPrompt 使用相同函数） ──
  const memInjection = loadMemoryInjection();
  const topFacts    = selectInjectableMemories(charMemories?.fact    || [], memInjection.limits.fact);
  const topEmotions = selectInjectableMemories(charMemories?.emotion || [], memInjection.limits.emotion);
  const topInsights = selectInjectableMemories(charMemories?.insight || [], memInjection.limits.insight);
  const memCount = topFacts.length + topEmotions.length + topInsights.length;

  // pinned / blocked 统计（所有类型合并）
  const normalize = (items) => (items || []).map((m) => ({
    ...m,
    pinned:     m.pinned     ?? false,
    injectable: m.injectable ?? true,
    source:     m.source     || (m.isAutoMemory ? "auto" : "manual"),
  }));
  const allItems = [
    ...normalize(charMemories?.fact    || []),
    ...normalize(charMemories?.emotion || []),
    ...normalize(charMemories?.insight || []),
  ];
  const pinnedCount  = allItems.filter((m) => m.pinned).length;
  const blockedCount = allItems.filter((m) => m.injectable === false).length;

  const charName = char?.name || "未知入住者";

  // 入住关系锚点复制文本
  const anchorCopyText = hasMigrationAnchor
    ? [
        mig.sourcePlatform    && `来源平台：${mig.sourcePlatform}`,
        mig.coreVibe          && `核心气质：\n${mig.coreVibe}`,
        mig.speechStyleAnchor && `说话方式：\n${mig.speechStyleAnchor}`,
        mig.intimacyStyle     && `亲密方式：\n${mig.intimacyStyle}`,
        mig.doNotLoseFeeling  && `不能丢的感觉：\n${mig.doNotLoseFeeling}`,
        mig.relationshipSummary && `关系基础：\n${mig.relationshipSummary}`,
        mig.doNotChangeRules  && `不可遗忘：\n${mig.doNotChangeRules}`,
        mig.wakeSummary       && `唤醒摘要：\n${mig.wakeSummary}`,
      ].filter(Boolean).join("\n\n")
    : "";

  return (
    <div className="page-fade" style={{
      height: "100vh", overflow: "hidden",
      background: "linear-gradient(160deg, #f0ecf8 0%, #ece5f5 40%, #e5ddf0 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── 顶栏 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 20px 12px",
        borderBottom: "1px solid rgba(196,166,184,.2)",
        background: "rgba(255,255,255,.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton onClick={() => navigateTo(prevPage || "profileEdit")} label="返回" />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
          🌙 {charName}的唤醒预览
        </div>
        <div style={{ width: 48 }} />
      </div>

      {/* ── 主体 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 40px" }}>

        {/* 统计卡片 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { label: "估算 Token", value: tokenCount.toLocaleString() },
            { label: "本次注入",   value: `${memCount} 条` },
            { label: "固定锚点",   value: `${pinnedCount} 条` },
            { label: "暂停注入",   value: blockedCount > 0 ? `${blockedCount} 条` : "—" },
            { label: "上下文上限", value: ctxConfig?.maxTokens ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: "1 1 60px", padding: "10px 6px",
              background: "rgba(255,255,255,.75)",
              borderRadius: 12, border: "1px solid rgba(255,255,255,.55)",
              boxShadow: "0 2px 8px rgba(0,0,0,.04)", textAlign: "center",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#6a5a8e" }}>{value}</div>
              <div style={{ fontSize: 10, color: "#9a8aac", letterSpacing: 0.6, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 提示条 */}
        {!hasMigrationAnchor && (
          <Tip color="red">
            还没有采纳迁入草稿，暂无入住关系锚点。在「入住档案」→「迁入提炼草稿」里采纳草稿后，内容会出现在这里。
          </Tip>
        )}
        {!mig.wakeSummary && (
          <Tip color="amber">
            还没有唤醒摘要。采纳草稿或在入住档案里手动填写「唤醒摘要」字段后会出现在这里。
          </Tip>
        )}
        {memCount === 0 && (
          <Tip color="blue">
            记忆宫殿还没有可注入的记忆。聊天时 AI 写入的记忆、以及你手动添加的记忆会在下次注入进来。
          </Tip>
        )}

        {/* ── 区块 ── */}

        {/* 当前时间 */}
        <Block emoji="📅" title="当前时间" isOpen>
          <pre style={{ ...preStyle, paddingTop: 8 }}>{timeInfo}</pre>
        </Block>

        {/* 入住身份 */}
        <Block emoji="👤" title="入住身份" isOpen>
          <div style={{ paddingTop: 8 }}>
            <Field label="名字" value={charName} />
            <Field label="与你的关系" value={char?.relation} />
            {mig.sourcePlatform && <Field label="来源平台" value={mig.sourcePlatform} />}
          </div>
        </Block>

        {/* 入住关系锚点 */}
        <Block
          emoji="🔗" title="入住关系锚点"
          isEmpty={!hasMigrationAnchor}
          isOpen={hasMigrationAnchor}
          copyText={anchorCopyText}
          copyLabel="anchor"
          onCopy={handleCopy}
          copied={copied}
        >
          <div style={{ paddingTop: 8 }}>
            <Field label="核心气质"     value={mig.coreVibe} />
            <Field label="说话方式"     value={mig.speechStyleAnchor} />
            <Field label="亲密方式"     value={mig.intimacyStyle} />
            <Field label="不能丢的感觉" value={mig.doNotLoseFeeling} />
            {mig.relationshipSummary && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...sectionLabelStyle, marginBottom: 3 }}>关系基础</div>
                <div style={{
                  fontSize: 12, color: "#5a4a6a", lineHeight: 1.8, whiteSpace: "pre-wrap",
                  maxHeight: 160, overflow: "auto",
                  background: "rgba(196,166,184,.06)", borderRadius: 8, padding: "8px 10px",
                }}>
                  {mig.relationshipSummary}
                </div>
              </div>
            )}
          </div>
        </Block>

        {/* 不可遗忘事项 */}
        <Block
          emoji="⚠️" title="不可遗忘事项"
          isEmpty={!mig.doNotChangeRules}
          isOpen={!!mig.doNotChangeRules}
          copyText={mig.doNotChangeRules}
          copyLabel="rules"
          onCopy={handleCopy}
          copied={copied}
        >
          <pre style={{ ...preStyle, paddingTop: 8 }}>{mig.doNotChangeRules}</pre>
        </Block>

        {/* 唤醒摘要 */}
        <Block
          emoji="🌅" title="唤醒摘要"
          isEmpty={!mig.wakeSummary}
          isOpen={!!mig.wakeSummary}
          copyText={mig.wakeSummary}
          copyLabel="wake"
          onCopy={handleCopy}
          copied={copied}
        >
          <pre style={{ ...preStyle, paddingTop: 8 }}>{mig.wakeSummary}</pre>
        </Block>

        {/* 记忆注入 */}
        <Block
          emoji="🧠" title={`本次注入记忆（${memCount} 条）`}
          isEmpty={memCount === 0}
          isOpen={memCount > 0}
        >
          <div style={{ paddingTop: 6 }}>
            {/* 注入策略说明 */}
            <div style={{
              fontSize: 11, color: "#9a8aac", lineHeight: 1.65,
              padding: "6px 10px", marginBottom: 10,
              background: "rgba(100,100,160,.05)", borderRadius: 7,
            }}>
              📌 固定锚点优先进入 · 🔕 暂停唤醒的记忆不出现在此列表
              {blockedCount > 0 && `（已屏蔽 ${blockedCount} 条）`}
            </div>

            {[
              { label: "📋 事实", items: topFacts },
              { label: "💗 情绪", items: topEmotions },
              { label: "✨ 觉察", items: topInsights },
            ].filter(({ items }) => items.length > 0).map(({ label, items }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={sectionLabelStyle}>{label}（{items.length} 条）</div>
                {items.map((m, i) => {
                  const srcMap = { migration: "迁入", auto: "AI", diary: "日记", manual: "手动" };
                  const src = srcMap[m.source] || "";
                  return (
                    <div key={i} style={{ ...memItemStyle, display: "flex", alignItems: "flex-start", gap: 4 }}>
                      <span style={{ color: (m.pinned ?? false) ? "#6070c8" : "#c0b0d0", flexShrink: 0 }}>
                        {(m.pinned ?? false) ? "📌" : "·"}
                      </span>
                      <span style={{ flex: 1 }}>
                        {src && (
                          <span style={{ fontSize: 10, color: "#9a8aac", marginRight: 4 }}>[{src}]</span>
                        )}
                        {m.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Block>

        {/* 用户档案 */}
        <Block
          emoji="🪪" title="用户档案"
          isEmpty={!userCtx}
          isOpen={!!userCtx}
        >
          <pre style={{ ...preStyle, paddingTop: 8 }}>{userCtx}</pre>
        </Block>

        {/* 世界观认知 */}
        <Block
          emoji="🌍" title="世界观与核心认知"
          isEmpty={!worldView}
          isOpen={!!worldView}
        >
          <pre style={{ ...preStyle, paddingTop: 8 }}>{worldView}</pre>
        </Block>

        {/* 完整 System Prompt */}
        <div style={{
          marginTop: 6, borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(196,166,184,.25)",
          background: "rgba(255,255,255,.72)",
        }}>
          <button
            onClick={() => setShowFullPrompt((o) => !o)}
            style={{
              width: "100%", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              background: showFullPrompt ? "rgba(196,166,184,.1)" : "transparent",
              border: "none", cursor: "pointer",
              fontFamily: "var(--font-main)", transition: "background .2s",
            }}
          >
            <span style={{ fontSize: 15 }}>📄</span>
            <span style={{
              flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600,
              color: "#5a4a6a", letterSpacing: 1,
            }}>
              完整 System Prompt
            </span>
            <span style={{ fontSize: 11, color: "#9a8aac" }}>
              ≈{tokenCount.toLocaleString()} tokens · {showFullPrompt ? "▲" : "▼"}
            </span>
          </button>

          {showFullPrompt && (
            <div style={{ padding: "0 16px 14px" }}>
              <pre style={{
                margin: "8px 0",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontSize: 11, lineHeight: 1.8, color: "#5a4a6a",
                fontFamily: "var(--font-main)",
                maxHeight: 440, overflow: "auto",
                background: "rgba(196,166,184,.06)",
                borderRadius: 8, padding: "10px 12px",
              }}>
                {fullPrompt}
              </pre>
              <button
                onClick={() => handleCopy(fullPrompt, "full")}
                style={{
                  padding: "6px 18px",
                  background: copied === "full" ? "rgba(130,180,140,.2)" : "rgba(255,255,255,.6)",
                  border: "1px solid rgba(196,166,184,.3)", borderRadius: 10,
                  color: copied === "full" ? "#3a7a4a" : "#7a6a8e",
                  fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)",
                  transition: "all .2s",
                }}
              >
                {copied === "full" ? "✓ 已复制完整 Prompt" : "复制完整 Prompt"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
