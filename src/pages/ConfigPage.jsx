// ─── 大脑连接 / API 设置页 ───
// 可从首页入口或聊天"更多"菜单进入

import { PRESET_MODELS } from "../constants";
import BackButton from "../components/BackButton";

export default function ConfigPage({
  // 导航
  navigateTo,
  prevPage,
  // API 配置
  config,
  setConfig,
  ctxConfig,
  setCtxConfig,
  // 角色（可选，有时从首页进入没有 activeChar）
  activeChar,
  setCharacters,
  getActiveModel,
  // 操作
  handleTestConnection,
  handleSaveAll,
  testStatus,
  // 聊天专属（有 activeChar 时才显示）
  handleExportChat,
  showClearConfirm,
  setShowClearConfirm,
  handleClearChat,
}) {
  const hasChatContext = !!activeChar;

  return (
    <div style={{
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
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <BackButton onClick={() => navigateTo(prevPage || "entrance")} label="返回" />
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#5a4a6a", letterSpacing: 2 }}>
          🧠 大脑连接
        </div>
        <div style={{ width: 48 }} />
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 48px" }}>

        {/* 说明 */}
        <div style={{
          padding: "12px 16px", borderRadius: 14, marginBottom: 20,
          background: "rgba(255,255,255,.6)", border: "1px solid rgba(196,166,184,.2)",
          fontSize: 12, color: "#7a6a8e", lineHeight: 1.8,
        }}>
          配置 API、模型和上下文，让小家里的入住者真正醒来。
          {!hasChatContext && (
            <div style={{ marginTop: 6, color: "#9a8aac", fontSize: 12 }}>
              配置后回首页「推门进入」即可开始聊天。
            </div>
          )}
        </div>

        {/* ── API 连接 ── */}
        <Section title="🔑 API 连接">
          <Field label="API 主机">
            <input
              className="config-input"
              type="text"
              placeholder="https://yunwu.ai/v1"
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
            />
            <div className="config-hint">填到 /v1 就好</div>
          </Field>

          <Field label="API Key">
            <input
              className="config-input"
              type="password"
              placeholder="sk-..."
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
          </Field>

          <Field label="全局默认模型">
            <select
              className="config-select"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            >
              {PRESET_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {config.model === "__custom__" && (
              <input
                className="config-input config-custom-model"
                type="text"
                placeholder="如 deepseek-chat"
                value={config.customModel}
                onChange={(e) => setConfig({ ...config, customModel: e.target.value })}
              />
            )}
          </Field>

          {/* 当前入住者专属模型 */}
          {hasChatContext && (
            <Field label={`💜 ${activeChar.name} 的专属模型`}>
              <input
                className="config-input"
                type="text"
                placeholder="留空 = 跟随全局默认"
                value={activeChar.modelOverride || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setCharacters((prev) =>
                    prev.map((c) => c.id === activeChar.id ? { ...c, modelOverride: val } : c)
                  );
                }}
              />
              <div className="config-hint">
                {activeChar.modelOverride?.trim()
                  ? `✅ 专属：${activeChar.modelOverride.trim()}`
                  : `📌 跟随全局：${config.model === "__custom__" ? config.customModel : config.model}`}
              </div>
            </Field>
          )}

          {/* 操作按钮 */}
          <div className="config-actions" style={{ marginTop: 8 }}>
            <button
              className="config-btn config-btn-test"
              onClick={handleTestConnection}
              disabled={!config.apiUrl.trim() || !config.apiKey.trim() || !getActiveModel?.().trim()}
            >
              测试连接
            </button>
            <button className="config-btn config-btn-save" onClick={handleSaveAll}>
              保存配置
            </button>
          </div>
          {testStatus && (
            <div className={`test-result ${testStatus === "success" ? "success" : testStatus === "testing" ? "testing" : "fail"}`}>
              {testStatus === "testing" && "正在连接中…"}
              {testStatus === "success" && "✓ 连接成功！"}
              {testStatus.startsWith?.("fail") && (
                <>
                  ✗ 连接失败
                  {testStatus.length > 4 && (
                    <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8, wordBreak: "break-all" }}>
                      {testStatus.slice(5)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Section>

        {/* ── 上下文管理 ── */}
        <Section title="💬 上下文管理">
          <Field label="历史消息条数">
            <div className="slider-row">
              <div style={{ flex: 1 }}>
                <input
                  className="slider-input"
                  type="range" min="2" max="50" step="2"
                  value={ctxConfig.maxMessages}
                  onChange={(e) => setCtxConfig({ ...ctxConfig, maxMessages: Number(e.target.value) })}
                />
              </div>
              <div className="slider-value">{ctxConfig.maxMessages}</div>
            </div>
            <div className="config-hint">越多记得越久，消耗 token 也越多</div>
          </Field>

          <Field label="最大回复 token 数">
            <div className="token-input-row">
              <input
                className="token-input"
                type="number" min="256" max="32768" step="256"
                value={ctxConfig.maxTokens}
                onChange={(e) => setCtxConfig({ ...ctxConfig, maxTokens: Number(e.target.value) })}
              />
              <div className="token-presets">
                {[1024, 2048, 4096, 8192].map((v) => (
                  <button
                    key={v}
                    className={`token-preset-btn ${ctxConfig.maxTokens === v ? "active" : ""}`}
                    onClick={() => setCtxConfig({ ...ctxConfig, maxTokens: v })}
                  >
                    {v >= 1024 ? `${v / 1024}k` : v}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </Section>

        {/* ── 聊天管理（仅在有活跃对话时显示）── */}
        {hasChatContext && (
          <Section title="📋 当前对话">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="clear-btn"
                style={{
                  borderColor: "rgba(155,149,181,.2)",
                  background: "rgba(155,149,181,.06)",
                  color: "var(--accent-dusk)",
                }}
                onClick={handleExportChat}
              >
                📥 导出当前对话
              </button>
              <button className="clear-btn" onClick={() => setShowClearConfirm(true)}>
                清空当前对话
              </button>
              {showClearConfirm && (
                <div className="confirm-box">
                  <div className="confirm-text">确定要清空所有对话记录吗？</div>
                  <div className="confirm-actions">
                    <button className="confirm-cancel" onClick={() => setShowClearConfirm(false)}>再想想</button>
                    <button className="confirm-do" onClick={handleClearChat}>确认清空</button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

// ── 小辅助组件 ──
function Section({ title, children }) {
  return (
    <div style={{
      marginBottom: 20, borderRadius: 16,
      background: "rgba(255,255,255,.65)",
      border: "1px solid rgba(196,166,184,.2)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px 8px",
        fontSize: 12, color: "#9a8aac", letterSpacing: 1.5,
        borderBottom: "1px solid rgba(196,166,184,.1)",
      }}>
        {title}
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="config-field" style={{ marginBottom: 14 }}>
      <label className="config-label">{label}</label>
      {children}
    </div>
  );
}
