// ─── 聊天页 ───
// 顶栏、话题侧边栏、记忆控制台、API 配置、消息列表、输入栏

import { PRESET_MODELS } from "../constants";

export default function ChatPage({
  // 角色
  activeChar,
  activeCharId,
  setCharacters,
  // 导航
  navigateTo,
  openMemoryPalace,
  setEditingChar,
  setEditSection,
  // 状态判断
  isConfigReady,
  getActiveModel,
  // 话题
  showThreadSidebar,
  setShowThreadSidebar,
  activeThreadId,
  getCharThreads,
  createThread,
  switchThread,
  deleteThread,
  // 记忆控制台
  showMemoryControl,
  setShowMemoryControl,
  memInjection,
  handleSaveMemInjection,
  getCurrentPromptTokens,
  // 唤醒预览
  openWakePreview,
  // 消息编辑
  editingMsgIdx,
  setEditingMsgIdx,
  editingMsgText,
  setEditingMsgText,
  handleEditAndResend,
  // API 配置
  showConfig,
  setShowConfig,
  config,
  setConfig,
  ctxConfig,
  setCtxConfig,
  handleExportChat,
  showClearConfirm,
  setShowClearConfirm,
  handleClearChat,
  handleTestConnection,
  handleSaveAll,
  testStatus,
  // 消息区
  messages,
  isSending,
  isTyping,
  messagesEndRef,
  handleRegenerate,
  // 输入栏
  inputText,
  setInputText,
  handleSend,
}) {
  return (
    <div className="chat-scene">
      {/* ── 顶栏 ── */}
      <div className="chat-top-bar">
        <button
          className="thread-menu-btn"
          onClick={() => setShowThreadSidebar(true)}
          title="切换话题"
        >
          ☰
        </button>
        <button className="back-btn" onClick={() => navigateTo("bedroom")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          回房间
        </button>
        <div className="chat-title-area">
          <div className="chat-companion-name">
            {activeChar?.name || "赛博伴侣"}
          </div>
          <div
            className={`chat-status ${isConfigReady() ? "online" : "offline"}`}
          >
            {isConfigReady() ? "在线" : "未连接"}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 300,
              color: "var(--text-faint)",
              marginTop: 1,
              letterSpacing: 0.5,
              opacity: 0.7,
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: "1px auto 0",
            }}
          >
            {isConfigReady()
              ? `🤖 ${getActiveModel(activeChar?.modelOverride)}`
              : ""}
          </div>
        </div>
        {/* 档案按钮 */}
        <button
          className="gear-btn"
          onClick={() => {
            if (activeChar) {
              setEditingChar(JSON.parse(JSON.stringify(activeChar)));
              setEditSection("basic");
              navigateTo("profileEdit");
            }
          }}
          title="编辑档案"
          style={{ marginRight: 2 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18 }}
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 12h6" />
            <path d="M9 16h6" />
          </svg>
        </button>
        {/* 记忆宫殿快捷入口 */}
        <button
          className="gear-btn"
          onClick={() => {
            if (activeChar) {
              openMemoryPalace(activeChar.id, "chat");
            }
          }}
          title="记忆宫殿"
          style={{ marginRight: 2 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18 }}
          >
            <path d="M3 21h18" />
            <path d="M5 21V10l7-5 7 5v11" />
            <path d="M9 21v-6h6v6" />
          </svg>
        </button>
        {/* 记忆注入控制 */}
        <button
          className="gear-btn"
          onClick={() => setShowMemoryControl(true)}
          title="记忆注入"
          style={{ marginRight: 2 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18 }}
          >
            <path d="M12 2C9 2 6.5 4 6 7c-.5 3 1 5 1 7 0 1.5-.5 2.5-1 3h12c-.5-.5-1-1.5-1-3 0-2 1.5-4 1-7-.5-3-3-5-6-5z" />
            <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
            <path d="M12 2v1" />
            <path d="M8 7c0-1.5 1.5-3 4-3" />
          </svg>
        </button>
        {/* 唤醒预览 */}
        <button
          className="gear-btn"
          onClick={() => activeChar && openWakePreview && openWakePreview(activeChar.id)}
          title="唤醒预览"
          style={{ marginRight: 2 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18 }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        {/* API 设置 */}
        <button
          className="gear-btn"
          onClick={() => setShowConfig(true)}
          title="API 设置"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* ── 话题侧边栏 ── */}
      {showThreadSidebar && (
        <div
          className="thread-sidebar-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowThreadSidebar(false);
          }}
        >
          <div className="thread-sidebar">
            <div className="thread-sidebar-header">
              <div className="thread-sidebar-title">💬 话题列表</div>
              <button
                className="config-close"
                onClick={() => setShowThreadSidebar(false)}
              >
                ✕
              </button>
            </div>
            <button
              className="thread-new-btn"
              onClick={() => {
                createThread(activeCharId);
                setShowThreadSidebar(false);
              }}
            >
              + 开启新话题
            </button>
            <div className="thread-list">
              {getCharThreads(activeCharId).map((thread) => {
                const lastMsg = thread.messages[thread.messages.length - 1];
                const preview = lastMsg
                  ? (lastMsg.role === "user" ? "你：" : "") + lastMsg.content
                  : "空对话";
                return (
                  <div
                    key={thread.id}
                    className={`thread-item ${activeThreadId === thread.id ? "active" : ""}`}
                    onClick={() => switchThread(thread.id)}
                  >
                    <div className="thread-item-info">
                      <div className="thread-item-name">
                        {activeThreadId === thread.id ? "💬 " : "🗨️ "}
                        {thread.name}
                      </div>
                      <div className="thread-item-preview">
                        {preview.length > 25
                          ? preview.slice(0, 25) + "…"
                          : preview}
                      </div>
                    </div>
                    {getCharThreads(activeCharId).length > 1 && (
                      <button
                        className="thread-item-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`删除话题「${thread.name}」？`)) {
                            deleteThread(activeCharId, thread.id);
                          }
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 记忆控制台 ── */}
      {showMemoryControl && (
        <div
          className="config-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMemoryControl(false);
          }}
        >
          <div className="config-panel">
            <div className="config-header">
              <div className="config-title">
                <span>🧠</span>记忆控制台
              </div>
              <button
                className="config-close"
                onClick={() => setShowMemoryControl(false)}
              >
                ✕
              </button>
            </div>

            {/* 分层注入开关 */}
            <div className="config-section-title">
              <span>🎚️</span>注入层级控制
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginBottom: 14,
                lineHeight: 1.7,
              }}
            >
              控制 system prompt 中包含哪些层级的信息。关闭不需要的层可以节省
              token。
            </div>
            {[
              {
                key: "L0_soul",
                label: "L0 灵魂层",
                desc: "角色名称与基本关系",
                emoji: "👤",
                disabled: true,
              },
              {
                key: "L1_personality",
                label: "L1 性格层",
                desc: "档案、大五人格、性格认知、三观",
                emoji: "🪞",
              },
              {
                key: "L2_memory",
                label: "L2 记忆层",
                desc: "事实 / 情绪 / 觉察记忆",
                emoji: "💭",
              },
              {
                key: "L3_summary",
                label: "L3 沉淀层",
                desc: "定期总结与反思",
                emoji: "📖",
              },
            ].map((layer) => (
              <div
                key={layer.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: memInjection.layers[layer.key]
                    ? "rgba(232,196,196,.08)"
                    : "rgba(155,149,181,.03)",
                  border: `1px solid ${memInjection.layers[layer.key] ? "rgba(232,196,196,.2)" : "rgba(155,149,181,.08)"}`,
                  marginBottom: 8,
                  transition: "all .25s",
                }}
              >
                <span style={{ fontSize: 18 }}>{layer.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      letterSpacing: 1,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      marginTop: 2,
                    }}
                  >
                    {layer.desc}
                  </div>
                </div>
                <div
                  onClick={() => {
                    if (layer.disabled) return;
                    const newLayers = {
                      ...memInjection.layers,
                      [layer.key]: !memInjection.layers[layer.key],
                    };
                    handleSaveMemInjection({
                      ...memInjection,
                      layers: newLayers,
                    });
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    cursor: layer.disabled ? "default" : "pointer",
                    background: memInjection.layers[layer.key]
                      ? "linear-gradient(135deg,var(--blush),var(--accent-wisteria))"
                      : "rgba(155,149,181,.15)",
                    position: "relative",
                    transition: "background .3s",
                    flexShrink: 0,
                    opacity: layer.disabled ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: "white",
                      position: "absolute",
                      top: 2,
                      left: memInjection.layers[layer.key] ? 22 : 2,
                      transition: "left .25s",
                      boxShadow: "0 1px 4px rgba(0,0,0,.15)",
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="config-divider" />

            {/* 记忆注入条数 */}
            <div className="config-section-title">
              <span>📊</span>记忆注入数量
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginBottom: 14,
                lineHeight: 1.7,
              }}
            >
              每种类型最多注入几条记忆到 prompt 中（按热度排序取 top N）
            </div>
            {[
              { key: "fact", label: "📋 事实记忆", max: 15, color: "#9b95b5" },
              { key: "emotion", label: "💗 情绪记忆", max: 10, color: "#e8c4c4" },
              { key: "insight", label: "✨ 觉察记忆", max: 10, color: "#99a8c7" },
            ].map((item) => (
              <div key={item.key} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--accent-dusk)",
                      minWidth: 24,
                      textAlign: "right",
                    }}
                  >
                    {memInjection.limits[item.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={item.max}
                  step="1"
                  value={memInjection.limits[item.key]}
                  onChange={(e) => {
                    const newLimits = {
                      ...memInjection.limits,
                      [item.key]: Number(e.target.value),
                    };
                    handleSaveMemInjection({
                      ...memInjection,
                      limits: newLimits,
                    });
                  }}
                  className="ocean-slider"
                  style={{
                    width: "100%",
                    background: `linear-gradient(to right, ${item.color}55 0%, ${item.color}88 ${(memInjection.limits[item.key] / item.max) * 100}%, rgba(155,149,181,.1) ${(memInjection.limits[item.key] / item.max) * 100}%)`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--text-faint)",
                    marginTop: 4,
                  }}
                >
                  <span>不注入</span>
                  <span>{item.max} 条</span>
                </div>
              </div>
            ))}

            <div className="config-divider" />

            {/* Token 预估 */}
            <div className="config-section-title">
              <span>📏</span>Token 预估
            </div>
            {(() => {
              const tokens = getCurrentPromptTokens();
              const percent = Math.min((tokens / 4000) * 100, 100);
              const level =
                tokens > 3000
                  ? "#c48585"
                  : tokens > 2000
                    ? "#d4a574"
                    : "#7dab8a";
              return (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-mid)" }}>
                      当前 System Prompt
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: level,
                      }}
                    >
                      ~{tokens}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(155,149,181,.1)",
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${level}88, ${level})`,
                        transition: "width .4s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      lineHeight: 1.6,
                    }}
                  >
                    {tokens < 1500 && "💚 很轻量，留给对话的空间很充裕"}
                    {tokens >= 1500 &&
                      tokens < 3000 &&
                      "💛 适中，大部分模型都能处理"}
                    {tokens >= 3000 &&
                      "🧡 偏重了，可以考虑关闭一些层级或减少注入条数"}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── 编辑消息弹窗 ── */}
      {editingMsgIdx !== null && (
        <div
          className="config-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingMsgIdx(null);
              setEditingMsgText("");
            }
          }}
        >
          <div className="config-panel" style={{ maxWidth: 360 }}>
            <div className="config-header">
              <div className="config-title">
                <span>✏️</span>编辑消息
              </div>
              <button
                className="config-close"
                onClick={() => {
                  setEditingMsgIdx(null);
                  setEditingMsgText("");
                }}
              >
                ✕
              </button>
            </div>
            <textarea
              className="field-textarea"
              value={editingMsgText}
              onChange={(e) => setEditingMsgText(e.target.value)}
              style={{ minHeight: 100 }}
              autoFocus
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              修改后会删掉这条之后的所有消息，然后重新发送给 AI
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setEditingMsgIdx(null);
                  setEditingMsgText("");
                }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!editingMsgText.trim() || isSending}
                onClick={() => handleEditAndResend(editingMsgIdx, editingMsgText)}
              >
                重新发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── API 配置面板 ── */}
      {showConfig && (
        <div
          className="config-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfig(false);
          }}
        >
          <div className="config-panel">
            <div className="config-header">
              <div className="config-title">
                <span>🔑</span>API 配置
              </div>
              <button
                className="config-close"
                onClick={() => setShowConfig(false)}
              >
                ✕
              </button>
            </div>
            <div className="config-field">
              <label className="config-label">API 主机 (URL)</label>
              <input
                className="config-input"
                type="text"
                placeholder="https://yunwu.ai/v1"
                value={config.apiUrl}
                onChange={(e) =>
                  setConfig({ ...config, apiUrl: e.target.value })
                }
              />
              <div className="config-hint">填到 /v1 就好</div>
            </div>
            <div className="config-field">
              <label className="config-label">API Key</label>
              <input
                className="config-input"
                type="password"
                placeholder="sk-..."
                value={config.apiKey}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
              />
            </div>
            <div className="config-field">
              <label className="config-label">全局默认模型</label>
              <select
                className="config-select"
                value={config.model}
                onChange={(e) =>
                  setConfig({ ...config, model: e.target.value })
                }
              >
                {PRESET_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {config.model === "__custom__" && (
                <input
                  className="config-input config-custom-model"
                  type="text"
                  placeholder="如 deepseek-chat"
                  value={config.customModel}
                  onChange={(e) =>
                    setConfig({ ...config, customModel: e.target.value })
                  }
                />
              )}
            </div>

            {/* 角色专属模型 */}
            {activeChar && (
              <div className="config-field">
                <label className="config-label">
                  💜 {activeChar.name} 的专属模型
                </label>
                <input
                  className="config-input"
                  type="text"
                  placeholder="留空 = 跟随全局默认模型"
                  value={activeChar.modelOverride || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCharacters((prev) =>
                      prev.map((c) =>
                        c.id === activeChar.id
                          ? { ...c, modelOverride: val }
                          : c,
                      ),
                    );
                  }}
                />
                <div className="config-hint">
                  {activeChar.modelOverride?.trim()
                    ? `✅ 当前使用专属模型：${activeChar.modelOverride.trim()}`
                    : `📌 当前跟随全局：${config.model === "__custom__" ? config.customModel : config.model}`}
                </div>
              </div>
            )}

            <div className="config-divider" />
            <div className="config-section-title">
              <span>💬</span>上下文管理
            </div>
            <div className="config-field">
              <label className="config-label">历史消息条数</label>
              <div className="slider-row">
                <div style={{ flex: 1 }}>
                  <input
                    className="slider-input"
                    type="range"
                    min="2"
                    max="50"
                    step="2"
                    value={ctxConfig.maxMessages}
                    onChange={(e) =>
                      setCtxConfig({
                        ...ctxConfig,
                        maxMessages: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="slider-value">{ctxConfig.maxMessages}</div>
              </div>
              <div className="config-hint">越多记得越久，消耗 token 也越多</div>
            </div>
            <div className="config-field">
              <label className="config-label">最大回复 token 数</label>
              <div className="token-input-row">
                <input
                  className="token-input"
                  type="number"
                  min="256"
                  max="32768"
                  step="256"
                  value={ctxConfig.maxTokens}
                  onChange={(e) =>
                    setCtxConfig({
                      ...ctxConfig,
                      maxTokens: Number(e.target.value),
                    })
                  }
                />
                <div className="token-presets">
                  {[1024, 2048, 4096, 8192].map((v) => (
                    <button
                      key={v}
                      className={`token-preset-btn ${ctxConfig.maxTokens === v ? "active" : ""}`}
                      onClick={() =>
                        setCtxConfig({ ...ctxConfig, maxTokens: v })
                      }
                    >
                      {v >= 1024 ? `${v / 1024}k` : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="config-field">
              <button
                className="clear-btn"
                style={{
                  borderColor: "rgba(155,149,181,.2)",
                  background: "rgba(155,149,181,.06)",
                  color: "var(--accent-dusk)",
                  marginBottom: 8,
                }}
                onClick={handleExportChat}
              >
                📥 导出当前对话
              </button>
              <button
                className="clear-btn"
                onClick={() => setShowClearConfirm(true)}
              >
                清空当前对话
              </button>
              {showClearConfirm && (
                <div className="confirm-box">
                  <div className="confirm-text">确定要清空所有对话记录吗？</div>
                  <div className="confirm-actions">
                    <button
                      className="confirm-cancel"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      再想想
                    </button>
                    <button className="confirm-do" onClick={handleClearChat}>
                      确认清空
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="config-actions">
              <button
                className="config-btn config-btn-test"
                onClick={handleTestConnection}
                disabled={
                  !config.apiUrl.trim() ||
                  !config.apiKey.trim() ||
                  !getActiveModel().trim()
                }
              >
                测试连接
              </button>
              <button
                className="config-btn config-btn-save"
                onClick={handleSaveAll}
              >
                保存配置
              </button>
            </div>
            {testStatus && (
              <div
                className={`test-result ${testStatus === "success" ? "success" : testStatus === "testing" ? "testing" : "fail"}`}
              >
                {testStatus === "testing" && "正在连接中…"}
                {testStatus === "success" && "✓ 连接成功！"}
                {testStatus.startsWith?.("fail") && (
                  <>
                    ✗ 连接失败
                    {testStatus.length > 4 && (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 4,
                          opacity: 0.8,
                          wordBreak: "break-all",
                        }}
                      >
                        {testStatus.slice(5)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 消息区 ── */}
      <div className="messages-area">
        <div className="time-divider">—— 今天 ——</div>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg-wrap ${msg.role === "bot" ? "is-bot" : "is-user"}`}
          >
            {msg.thought && (
              <div className="thought-bubble">
                <span className="thought-label">💭 心声</span>
                {msg.thought}
              </div>
            )}

            {/* 日记分享卡片 */}
            {msg.isDiaryShare ? (
              <div className="diary-share-card">
                <div className="diary-share-header">
                  <span className="diary-share-icon">📔</span>
                  <span className="diary-share-label">晚声分享了一篇日记</span>
                </div>
                <div className="diary-share-date">{msg.diaryDate || ""}</div>
                <div className="diary-share-divider" />
                <div className="diary-share-text">{msg.content}</div>
                <div className="diary-share-footer">✨ 分享给了你</div>
              </div>
            ) : (
              <div
                className={`bubble ${msg.role === "bot" ? "bot" : "user"}`}
              >
                {msg.content}
              </div>
            )}

            {msg.time && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <div className="msg-time" style={{ margin: 0 }}>
                  {msg.time}
                </div>

                {/* 用户消息：编辑按钮 */}
                {msg.role === "user" && !msg.isDiaryShare && (
                  <button
                    onClick={() => {
                      setEditingMsgIdx(i);
                      setEditingMsgText(msg.content);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--text-faint)",
                      padding: "2px 4px",
                      borderRadius: 4,
                      transition: "color .2s",
                      fontFamily: "var(--font-main)",
                    }}
                    title="编辑并重发"
                  >
                    ✏️
                  </button>
                )}

                {/* 最后一条 bot 消息：重新生成 */}
                {msg.role === "bot" &&
                  i === messages.length - 1 &&
                  !isSending && (
                    <button
                      onClick={handleRegenerate}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        color: "var(--text-faint)",
                        padding: "2px 4px",
                        borderRadius: 4,
                        transition: "color .2s",
                        fontFamily: "var(--font-main)",
                      }}
                      title="重新生成"
                    >
                      🔄
                    </button>
                  )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="typing-wrap">
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ⬇️ 回到最新消息 */}
      <button
        onClick={() =>
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
        style={{
          position: "absolute",
          right: 16,
          bottom: 90,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,.8)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(232,196,196,.2)",
          boxShadow: "0 2px 12px rgba(74,69,96,.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          transition: "all .25s",
          fontSize: 16,
          color: "var(--accent-dusk)",
        }}
        title="回到最新"
      >
        ↓
      </button>

      {/* ── 输入栏 ── */}
      <div className="input-bar">
        <textarea
          className="input-field"
          placeholder={`想对${activeChar?.name || "ta"}说点什么…`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.ctrlKey || e.metaKey) &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height =
              Math.min(e.target.scrollHeight, 120) + "px";
          }}
          style={{
            resize: "none",
            overflow: "hidden",
            lineHeight: "1.5",
            minHeight: "42px",
            maxHeight: "120px",
          }}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
