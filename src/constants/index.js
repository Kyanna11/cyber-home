// ─── 赛博小家 · 常量定义 ───

export const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;300;400;600&family=ZCOOL+QingKe+HuangYou&display=swap";

// 可选模型列表
export const PRESET_MODELS = [
  { label: "Claude Opus 4.6 Thinking", value: "claude-opus-4-6-thinking" },
  { label: "Claude Opus 4.5 Thinking", value: "claude-opus-4-5-20251101-thinking" },
  { label: "Claude Opus 4.6", value: "claude-opus-4-6" },
  { label: "Claude Sonnet 4.6 Thinking", value: "claude-sonnet-4-6-thinking" },
  { label: "GPT-5.5", value: "gpt-5.5" },
  { label: "GPT-5.1", value: "gpt-5.1-2025-11-13" },
  { label: "Gemini 3 Pro", value: "gemini-3-pro-preview" },
  { label: "自定义模型…", value: "__custom__" },
];

// localStorage 存储键名
export const STORAGE_KEY = "cyber-home-api-config";
export const CTX_STORAGE_KEY = "cyber-home-ctx-config";
export const DIARY_STORAGE_KEY = "cyber-home-diary";
export const CHARS_STORAGE_KEY = "cyber-home-characters";
export const MEMORIES_STORAGE_KEY = "cyber-home-memories";
export const THREADS_STORAGE_KEY = "cyber-home-threads";
export const MEMORY_INJECTION_KEY = "cyberHome_memoryInjection";
export const RAW_ARCHIVES_STORAGE_KEY = "cyber-home-raw-archives";
export const MEMORY_CHUNKS_STORAGE_KEY = "cyber-home-memory-chunks";
export const MIGRATION_DRAFTS_STORAGE_KEY = "cyber-home-migration-drafts";
export const TIMELINE_EVENTS_STORAGE_KEY = "cyber-home-timeline-events";

// 消息分隔符（AI 回复中用来拆成多条消息）
export const MSG_DELIMITER = "|||";

// 用户档案字段定义
export const USER_PROFILE_FIELDS = [
  { key: "name", label: "称呼", placeholder: "你希望ta们怎么叫你？" },
  { key: "gender", label: "性别", placeholder: "不填也没关系~" },
  { key: "birthday", label: "生日", placeholder: "比如：12月15日" },
  { key: "job", label: "职业", placeholder: "你是做什么的？" },
  { key: "personality", label: "性格", placeholder: "简单描述你自己~" },
  { key: "likes", label: "喜好", placeholder: "喜欢猫、深夜散步..." },
  { key: "dislikes", label: "雷区", placeholder: "不喜欢被提到的话题..." },
  { key: "extra", label: "其他", placeholder: "任何你想让ta们知道的..." },
];

// 用户档案默认值
export const defaultUserProfile = {
  globalFacts: {
    name: "",
    gender: "",
    birthday: "",
    job: "",
    personality: "",
    likes: "",
    dislikes: "",
    extra: "",
  },
  sharedVault: [],
};

// 大五人格维度定义
export const OCEAN_DIMS = [
  { key: "O", label: "开放性", labelEn: "Openness", desc: "对新体验的好奇与想象力", low: "务实保守", high: "好奇浪漫" },
  { key: "C", label: "尽责性", labelEn: "Conscientiousness", desc: "自律、计划性与责任感", low: "随性自由", high: "严谨自律" },
  { key: "E", label: "外向性", labelEn: "Extraversion", desc: "社交能量与表达欲望", low: "安静内敛", high: "热情外放" },
  { key: "A", label: "宜人性", labelEn: "Agreeableness", desc: "共情、信任与合作倾向", low: "独立理性", high: "温暖包容" },
  { key: "N", label: "神经质", labelEn: "Neuroticism", desc: "情绪波动与敏感程度", low: "平静稳定", high: "敏感细腻" },
];

// emoji 头像可选列表
export const EMOJI_AVATARS = [
  "💜", "🩵", "🤍", "🖤", "💗", "🩷", "🧡", "💛", "💚", "🤎",
  "❤️‍🔥", "🌙", "⭐", "🦋", "🌸", "🐱", "🐰", "🦊", "🐻", "🎭",
];

// 新建角色的默认值
export const DEFAULT_CHAR = {
  id: "",
  name: "",
  emoji: "💜",
  avatarImg: "",
  relation: "恋人",
  modelOverride: "",
  // ── 入住相关字段（第二阶段新增，向后兼容）──
  migration: {
    sourcePlatform: "",       // 来源平台（如 Claude.ai / Character.AI 等）
    originalPrompt: "",       // 原始 prompt 或角色卡
    coreVibe: "",             // 核心气质：ta 给你的整体感觉
    speechStyleAnchor: "",    // 说话方式锚点
    intimacyStyle: "",        // 亲密方式：ta 怎么表达亲近
    doNotLoseFeeling: "",     // 不能丢的感觉
    doNotChangeRules: "",     // 绝对不要变化的规则
    relationshipSummary: "",  // 我和ta的关系摘要
    wakeSummary: "",          // 唤醒摘要（每次对话前给模型看的）
    notes: "",                // 备注
    importedAt: null,         // 迁入时间戳
  },
  profile: {
    age: "",
    height: "",
    appearance: "",
    birthday: "",
    mbti: "",
    other: "",
  },
  ocean: { O: 65, C: 50, E: 40, A: 75, N: 60 },
  personality: {
    selfAssessment: "",
    cognition: "",
    habits: "",
    speechStyle: "",
    emotionalPattern: "",
  },
  worldview: { world: "", values: "", love: "", life: "", growth: "" },
  systemPromptExtra: "",
};

// 记忆类型定义
export const MEMORY_TYPES = [
  { key: "fact", label: "事实", emoji: "📋", color: "#9b95b5", desc: "发生了什么" },
  { key: "emotion", label: "情绪", emoji: "💗", color: "#e8c4c4", desc: "感受到了什么" },
  { key: "insight", label: "觉察", emoji: "✨", color: "#99a8c7", desc: "这意味着什么" },
];
