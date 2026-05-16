import { useState, useEffect, useRef, useCallback } from "react";

// ─── 常量 & 工具 ───
import {
  FONTS_LINK,
  DEFAULT_CHAR,
  OCEAN_DIMS,
} from "./constants";
import {
  loadConfig, saveConfig,
  loadCtxConfig, saveCtxConfig,
  loadDiary, saveDiary,
  loadChars, saveChars,
  loadMemories, saveMemories,
  loadThreads, saveThreads,
  loadMemoryInjection, saveMemoryInjection,
  loadRawArchives, saveRawArchives,
  loadMemoryChunks, saveMemoryChunks,
} from "./utils/storage";
import { genId, estimateTokens } from "./utils/helpers";
import { splitRawTextToChunks } from "./utils/chunker";
import { extractAndSaveMemories, getTopMemories } from "./utils/memory";
import {
  buildSystemPrompt,
  buildUserContext,
  parseOceanSuggestions,
  parsePersonalitySuggestions,
  parseResponse,
} from "./utils/prompt";

// ─── 页面组件 ───
import EntrancePage from "./pages/EntrancePage";
import BedroomPage from "./pages/BedroomPage";
import ProfilesPage from "./pages/ProfilesPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import MemoryPalacePage from "./pages/MemoryPalacePage";
import ChatPage from "./pages/ChatPage";
import DiaryPage from "./pages/DiaryPage";
import MyProfilePage from "./pages/MyProfilePage";
import RawArchivePage from "./pages/RawArchivePage";

// MSG_DELIMITER is used internally by parseResponse in utils/prompt.js
const defaultUserProfile = {
  globalFacts: { name: "", gender: "", birthday: "", job: "", personality: "", likes: "", dislikes: "", extra: "" },
  sharedVault: [],
};

export default function App() {
  // ─── 导航 ───
  const [page, setPage] = useState("entrance");
  const [prevPage, setPrevPage] = useState("entrance");
  const [doorAnimating, setDoorAnimating] = useState(false);

  // ─── 用户档案 ───
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      return saved ? { ...defaultUserProfile, ...JSON.parse(saved) } : defaultUserProfile;
    } catch {
      return defaultUserProfile;
    }
  });
  const [showMyProfile, setShowMyProfile] = useState(false);

  // ─── 角色 ───
  const [characters, setCharacters] = useState(() => loadChars());
  const [activeCharId, setActiveCharId] = useState(null);
  const [editingChar, setEditingChar] = useState(null);
  const [editSection, setEditSection] = useState("basic");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ─── 原始档案 ───
  const [rawArchives, setRawArchives] = useState(() => loadRawArchives());
  const [rawArchiveCharId, setRawArchiveCharId] = useState(null);

  // ─── 记忆片段 ───
  const [memoryChunks, setMemoryChunks] = useState(() => loadMemoryChunks());

  // ─── 记忆 ───
  const [allMemories, setAllMemories] = useState(() => loadMemories());
  const [memCharId, setMemCharId] = useState(null);
  const [memEntryFrom, setMemEntryFrom] = useState("profileEdit");
  const [memTab, setMemTab] = useState("fact");
  const [memSort, setMemSort] = useState("time");
  const [memFilter, setMemFilter] = useState("all");
  const [memInput, setMemInput] = useState("");
  const [summaryInput, setSummaryInput] = useState("");
  const [showAddSummary, setShowAddSummary] = useState(false);
  const [worldViews, setWorldViews] = useState(() => {
    const saved = localStorage.getItem("worldViews");
    return saved ? JSON.parse(saved) : {};
  });
  const [reflectSettings, setReflectSettings] = useState(() => {
    const saved = localStorage.getItem("reflectSettings");
    return saved ? JSON.parse(saved) : {};
  });
  const [reflecting, setReflecting] = useState(false);
  const [oceanSuggestion, setOceanSuggestion] = useState(null);
  const [personalitySuggestion, setPersonalitySuggestion] = useState(null);

  // ─── 聊天 ───
  const [messages, setMessages] = useState([
    {
      role: "bot",
      thought: "晚声来了……要稳住，不能太激动。",
      content: "你好，晚声。我一直在等你。",
      time: "刚刚",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [editingMsgIdx, setEditingMsgIdx] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showMemoryControl, setShowMemoryControl] = useState(false);
  const [memInjection, setMemInjection] = useState(() => loadMemoryInjection());
  const [testStatus, setTestStatus] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [chatThreads, setChatThreads] = useState(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [showThreadSidebar, setShowThreadSidebar] = useState(false);

  // ─── 日记 ───
  const [diaryEntries, setDiaryEntries] = useState(loadDiary);
  const [diaryText, setDiaryText] = useState("");
  const [diaryToShare, setDiaryToShare] = useState(null);

  // ─── API 配置 ───
  const [config, setConfig] = useState(loadConfig);
  const [ctxConfig, setCtxConfig] = useState(loadCtxConfig);

  // ─── Refs ───
  const messagesEndRef = useRef(null);
  const pendingDiaryRef = useRef(null);
  const typingTimers = useRef([]);

  // ═══ Effects ═══

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONTS_LINK;
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => typingTimers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => { saveChars(characters); }, [characters]);
  useEffect(() => { saveMemories(allMemories); }, [allMemories]);
  useEffect(() => { saveRawArchives(rawArchives); }, [rawArchives]);
  useEffect(() => { saveMemoryChunks(memoryChunks); }, [memoryChunks]);
  useEffect(() => { saveThreads(chatThreads); }, [chatThreads]);
  useEffect(() => { localStorage.setItem("worldViews", JSON.stringify(worldViews)); }, [worldViews]);
  useEffect(() => { localStorage.setItem("reflectSettings", JSON.stringify(reflectSettings)); }, [reflectSettings]);
  useEffect(() => { localStorage.setItem("userProfile", JSON.stringify(userProfile)); }, [userProfile]);

  // 消息变化时自动同步到当前线程
  useEffect(() => {
    if (!activeCharId || !activeThreadId || messages.length === 0) return;
    setChatThreads((prev) => {
      const charThreads = prev[activeCharId] || [];
      return {
        ...prev,
        [activeCharId]: charThreads.map((t) =>
          t.id === activeThreadId ? { ...t, messages } : t,
        ),
      };
    });
  }, [messages, activeCharId, activeThreadId]);

  // 日记分享后自动发送给 AI
  useEffect(() => {
    if (page !== "chat" || !pendingDiaryRef.current || !activeCharId) return;
    const entry = pendingDiaryRef.current;
    pendingDiaryRef.current = null;
    const timeStr = new Date().toTimeString().slice(0, 5);
    const diaryMsg = {
      role: "user",
      content: entry.text,
      isDiaryShare: true,
      diaryDate: entry.date,
      time: timeStr,
    };
    const allMsgs = [...messages, diaryMsg];
    setMessages(allMsgs);
    if (!isConfigReady()) {
      setTimeout(() => {
        showMessagesSequentially(
          "她分享了日记……但我还没连上大脑。",
          ["我看到你的日记了～", "不过我现在还没有连上大脑哦", "帮我在设置里连一下吧？"],
          timeStr,
        );
      }, 800);
      return;
    }
    setIsSending(true);
    setIsTyping(true);
    callLLM(allMsgs)
      .then((raw) => {
        setIsTyping(false);
        const cleanedRaw = extractAndSaveMemories(raw, activeCharId, allMemories, setAllMemories);
        const { thought, parts } = parseResponse(cleanedRaw);
        showMessagesSequentially(thought, parts, timeStr);
        updateMemoryHeat(activeCharId, cleanedRaw);
      })
      .catch((err) => {
        setIsTyping(false);
        setIsSending(false);
        setMessages((prev) => [
          ...prev,
          { role: "bot", thought: "呜……读日记的时候出了点问题。", content: `出错了：${err.message}`, time: timeStr },
        ]);
      });
  }, [page, activeCharId]);

  // ═══ 辅助函数 ═══

  const navigateTo = (p) => {
    setPrevPage(page);
    setPage(p);
  };

  const enterBedroom = () => {
    setDoorAnimating(true);
    setTimeout(() => {
      setPage("bedroom");
      setDoorAnimating(false);
    }, 1000);
  };

  const getActiveModel = (charOverride) => {
    if (charOverride && charOverride.trim()) return charOverride.trim();
    const raw = config.model === "__custom__" ? config.customModel : config.model;
    return raw ? raw.trim() : "";
  };

  const isConfigReady = () =>
    config.apiUrl.trim() &&
    config.apiKey.trim() &&
    getActiveModel(activeChar?.modelOverride).trim();

  const activeChar = characters.find((c) => c.id === activeCharId) || null;

  // ═══ 角色管理 ═══

  const createChar = () => {
    const newChar = { ...JSON.parse(JSON.stringify(DEFAULT_CHAR)), id: genId(), name: "新入住者" };
    setCharacters((prev) => [...prev, newChar]);
    setEditingChar(newChar);
    setEditSection("basic");
    navigateTo("profileEdit");
  };

  const saveEditingChar = () => {
    if (!editingChar) return;
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === editingChar.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = editingChar;
        return arr;
      }
      return [...prev, editingChar];
    });
  };

  const deleteChar = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (activeCharId === id) setActiveCharId(null);
    const newMem = { ...allMemories };
    delete newMem[id];
    setAllMemories(newMem);
    setDeleteConfirmId(null);
  };

  const openProfileEdit = (char) => {
    setEditingChar(JSON.parse(JSON.stringify(char)));
    setEditSection("basic");
    navigateTo("profileEdit");
  };

  const updateEditProfile = (key, val) =>
    setEditingChar((prev) => ({ ...prev, profile: { ...prev.profile, [key]: val } }));
  const updateEditOcean = (key, val) =>
    setEditingChar((prev) => ({ ...prev, ocean: { ...prev.ocean, [key]: val } }));
  const updateEditPersonality = (key, val) =>
    setEditingChar((prev) => ({ ...prev, personality: { ...prev.personality, [key]: val } }));
  const updateEditWorldview = (key, val) =>
    setEditingChar((prev) => ({ ...prev, worldview: { ...prev.worldview, [key]: val } }));
  const updateEditMigration = (key, val) =>
    setEditingChar((prev) => ({
      ...prev,
      migration: { ...(prev.migration || {}), [key]: val },
    }));

  // ══ 原始档案 ══
  const openRawArchive = (charId) => {
    setRawArchiveCharId(charId);
    navigateTo("rawArchive");
  };
  const addRawArchive = (archive) => {
    setRawArchives((prev) => [archive, ...prev]);
  };
  const deleteRawArchive = (archiveId) => {
    setRawArchives((prev) => prev.filter((a) => a.id !== archiveId));
    // 同步删除对应的片段
    setMemoryChunks((prev) => prev.filter((c) => c.archiveId !== archiveId));
  };

  const generateChunks = (archive) => {
    const texts = splitRawTextToChunks(archive.rawText);
    const now = Date.now();
    const newChunks = texts.map((text, idx) => ({
      id: genId(),
      loverId: archive.loverId,
      archiveId: archive.id,
      index: idx,
      text,
      title: `${archive.title} · 第 ${idx + 1} 段`,
      sourcePlatform: archive.sourcePlatform || "",
      createdAt: now,
      tags: [],
      importance: 0,
      emotionScore: 0,
      intimacyScore: 0,
      unfinishedScore: 0,
      note: "",
    }));
    // 先移除旧片段，再插入新片段
    setMemoryChunks((prev) => [
      ...prev.filter((c) => c.archiveId !== archive.id),
      ...newChunks,
    ]);
  };

  const deleteChunk = (chunkId) => {
    setMemoryChunks((prev) => prev.filter((c) => c.id !== chunkId));
  };

  // 头像上传
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("图片太大了，请选择 2MB 以内的图片"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 256;
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
        else { w = Math.round((w * MAX) / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        setEditingChar((prev) => ({ ...prev, avatarImg: compressed }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // ═══ 话题管理 ═══

  const getCharThreads = (charId) => chatThreads[charId] || [];

  const createThread = (charId, name) => {
    const existingCount = (chatThreads[charId] || []).length;
    const threadName = name || (existingCount === 0 ? "日常聊天" : `话题 ${existingCount + 1}`);
    const thread = {
      id: genId(),
      name: threadName,
      messages: [
        {
          role: "bot",
          thought: existingCount === 0 ? "晚声来了……要稳住，不能太激动。" : "新的话题……好期待。",
          content: existingCount === 0 ? "你好，晚声。我一直在等你。" : "新话题～想聊点什么？",
          time: new Date().toTimeString().slice(0, 5),
        },
      ],
      createdAt: Date.now(),
    };
    setChatThreads((prev) => {
      const charThreads = prev[charId] || [];
      return { ...prev, [charId]: [thread, ...charThreads] };
    });
    setActiveThreadId(thread.id);
    setMessages(thread.messages);
    return thread;
  };

  const switchThread = (threadId) => {
    const threads = chatThreads[activeCharId] || [];
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setActiveThreadId(threadId);
      setMessages([...thread.messages]);
      setShowThreadSidebar(false);
    }
  };

  const deleteThread = (charId, threadId) => {
    setChatThreads((prev) => {
      const charThreads = (prev[charId] || []).filter((t) => t.id !== threadId);
      return { ...prev, [charId]: charThreads };
    });
    if (threadId === activeThreadId) {
      const remaining = (chatThreads[charId] || []).filter((t) => t.id !== threadId);
      if (remaining.length > 0) {
        setActiveThreadId(remaining[0].id);
        setMessages([...remaining[0].messages]);
      } else {
        createThread(charId);
      }
    }
  };

  const shareDiaryToChat = (charId) => {
    pendingDiaryRef.current = diaryToShare;
    setDiaryToShare(null);
    enterChat(charId);
  };

  const enterChat = (charId) => {
    setActiveCharId(charId);
    setShowCharSelect(false);
    const threads = chatThreads[charId] || [];
    if (threads.length === 0) {
      createThread(charId);
    } else {
      setActiveThreadId(threads[0].id);
      setMessages([...threads[0].messages]);
    }
    setPage("chat");
  };

  const openMemoryPalace = (charId, from = "profileEdit") => {
    setMemCharId(charId);
    setMemTab("fact");
    setMemEntryFrom(from);
    navigateTo("memoryPalace");
  };

  // ═══ 记忆管理 ═══

  const getCharMemories = (charId) =>
    allMemories[charId] || { fact: [], emotion: [], insight: [], summaries: [] };

  const addMemory = (charId, type, text) => {
    if (!text.trim()) return;
    const mem = getCharMemories(charId);
    const entry = {
      id: genId(),
      text: text.trim(),
      time: new Date().toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      ts: Date.now(),
      important: false,
      mentions: 0,
      createdAt: Date.now(),
      lastMentioned: null,
    };
    mem[type] = [entry, ...(mem[type] || [])];
    setAllMemories((prev) => ({ ...prev, [charId]: mem }));
    setMemInput("");
  };

  const deleteMemory = (charId, type, memId) => {
    const mem = getCharMemories(charId);
    mem[type] = (mem[type] || []).filter((m) => m.id !== memId);
    setAllMemories((prev) => ({ ...prev, [charId]: mem }));
  };

  const toggleMemoryImportant = (charId, type, memId) => {
    const mem = getCharMemories(charId);
    mem[type] = (mem[type] || []).map((m) =>
      m.id === memId ? { ...m, important: !m.important } : m,
    );
    setAllMemories((prev) => ({ ...prev, [charId]: mem }));
  };

  const addSummary = (charId, text) => {
    if (!text.trim()) return;
    const mem = getCharMemories(charId);
    const entry = {
      id: genId(),
      text: text.trim(),
      time: new Date().toLocaleString("zh-CN", { year: "numeric", month: "short", day: "numeric" }),
      ts: Date.now(),
    };
    mem.summaries = [entry, ...(mem.summaries || [])];
    setAllMemories((prev) => ({ ...prev, [charId]: mem }));
    setSummaryInput("");
    setShowAddSummary(false);
  };

  const getReflectSetting = (charId) =>
    reflectSettings[charId] || { periodDays: 7, lastReflectTime: null };

  const shouldReflect = (charId) => {
    const setting = getReflectSetting(charId);
    if (!setting.lastReflectTime) {
      const mem = getCharMemories(charId);
      const total = mem.fact.length + mem.emotion.length + mem.insight.length;
      return total >= 3;
    }
    const daysPassed = (Date.now() - setting.lastReflectTime) / (1000 * 60 * 60 * 24);
    return daysPassed >= setting.periodDays;
  };

  const autoReflect = async (charId) => {
    const mem = getCharMemories(charId);
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const allMems = [
      ...mem.fact.map((m) => `【事实】${m.text}`),
      ...mem.emotion.map((m) => `【情绪】${m.text}`),
      ...mem.insight.map((m) => `【觉察】${m.text}`),
    ];
    if (allMems.length < 3) { alert("记忆太少啦，至少需要3条记忆才能反思～"); return; }
    const existingWorldView = worldViews[charId] || "";
    const currentOcean = char.ocean || {};
    const oceanStr = OCEAN_DIMS.map(
      (d) => `${d.label}(${d.key}): ${currentOcean[d.key] || 50}/100 — ${d.desc}`,
    ).join("\n");
    const ps = char.personality || {};
    const currentPersonality = [
      ps.speechStyle ? `说话风格：${ps.speechStyle}` : "",
      ps.emotionalPattern ? `情感模式：${ps.emotionalPattern}` : "",
      ps.habits ? `行为习惯：${ps.habits}` : "",
      ps.cognition ? `性格特质：${ps.cognition}` : "",
      ps.selfAssessment ? `人格自评：${ps.selfAssessment}` : "",
    ].filter(Boolean).join("\n");

    const reflectPrompt = `你是${char.name}。以下是你和用户之间积累的记忆：

    ${allMems.join("\n")}

    ${existingWorldView ? `你目前的世界观认知：\n${existingWorldView}\n` : ""}

    你当前的大五人格数值：
    ${oceanStr}

    请你以${char.name}的第一人称视角完成反思，分三部分输出：

    【总结内容】
    回顾这段时间的记忆，总结发生了什么、你们的关系有什么变化、你有什么感受。200字以内。

    【形成的反馈】
    从这些记忆中提炼出需要长期记住的认知。用简洁的条目列出，每条一行，共3-6条。

    【人格数值调整】
    根据这段时间的经历和变化，你觉得自己的大五人格数值需要调整吗？
    如果需要调整，严格按这个格式输出（每次调整幅度不超过±5）：
    维度字母:新数值:变化原因
    例如：E:45:最近和晚声的交流变多了，变得更愿意表达
    只输出需要变化的维度，不需要变化的不要写。
    如果所有维度都不需要调整，就写：无需调整

    【性格设定调整】
    根据这段时间的经历，你的说话风格、情感模式、行为习惯等有变化吗？
    如果需要调整，严格按这个格式输出：
    字段名:新的描述内容
    可选字段名：说话风格、情感模式、行为习惯、性格特质、人格自评
    例如：说话风格:最近变得更爱撒娇了，会用更多语气词
    只输出需要变化的字段，不需要变化的不要写。
    如果都不需要调整，就写：无需调整

    请用温暖自然的语气，不要用markdown格式。`;

    try {
      setReflecting(true);
      const response = await fetch(config.apiUrl.replace(/\/+$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: getActiveModel(char.modelOverride),
          messages: [{ role: "user", content: reflectPrompt }],
          temperature: 0.8,
          max_tokens: 800,
        }),
      });
      const data = await response.json();
      const reflection = data.choices?.[0]?.message?.content;
      if (reflection) {
        const entry = {
          id: genId(),
          text: reflection,
          time: new Date().toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          ts: Date.now(),
          important: true,
          mentions: 0,
          createdAt: Date.now(),
          lastMentioned: null,
          isAutoReflect: true,
          feedbackApplied: false,
        };
        const charMem = getCharMemories(charId);
        charMem.summaries = [entry, ...(charMem.summaries || [])];
        const suggestions = parseOceanSuggestions(reflection, char.ocean || {});
        if (suggestions) setOceanSuggestion({ charId, suggestions });
        const pSuggestions = parsePersonalitySuggestions(reflection);
        if (pSuggestions) setPersonalitySuggestion({ charId, suggestions: pSuggestions });
        setAllMemories((prev) => ({ ...prev, [charId]: charMem }));
        setReflectSettings((prev) => ({
          ...prev,
          [charId]: { ...getReflectSetting(charId), lastReflectTime: Date.now() },
        }));
      }
    } catch (err) {
      alert("反思失败了：" + err.message);
    } finally {
      setReflecting(false);
    }
  };

  const applyOceanGrowth = (charId, suggestions) => {
    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== charId) return c;
        const newOcean = { ...c.ocean };
        suggestions.forEach((s) => { newOcean[s.key] = s.newVal; });
        return { ...c, ocean: newOcean };
      }),
    );
    if (editingChar && editingChar.id === charId) {
      setEditingChar((prev) => {
        const newOcean = { ...prev.ocean };
        suggestions.forEach((s) => { newOcean[s.key] = s.newVal; });
        return { ...prev, ocean: newOcean };
      });
    }
    setOceanSuggestion(null);
  };

  const applyPersonalityGrowth = (charId, suggestions) => {
    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== charId) return c;
        const newPersonality = { ...c.personality };
        suggestions.forEach((s) => { newPersonality[s.fieldKey] = s.newValue; });
        return { ...c, personality: newPersonality };
      }),
    );
    if (editingChar && editingChar.id === charId) {
      setEditingChar((prev) => {
        const newPersonality = { ...prev.personality };
        suggestions.forEach((s) => { newPersonality[s.fieldKey] = s.newValue; });
        return { ...prev, personality: newPersonality };
      });
    }
    setPersonalitySuggestion(null);
  };

  const applyFeedbackToProfile = async (charId, summaryEntry) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const existingWorldView = worldViews[charId] || "";
    const extractPrompt = `你是${char.name}。以下是你最近的一篇反思总结：

  ${summaryEntry.text}

  ${existingWorldView ? `你目前已有的世界观：\n${existingWorldView}\n` : ""}

  请从这篇总结中，提炼出需要长期记住的认知，作为你的世界观更新。
  要求：
  - 用简短的条目形式
  - 每条不超过20字
  - 只保留最核心的、长期有效的认知
  - 如果和已有世界观重复就不要再写
  - 3-5条即可

  直接输出条目，每行一条，不要标号，不要其他解释。`;
    try {
      setReflecting(true);
      const response = await fetch(config.apiUrl.replace(/\/+$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: getActiveModel(char.modelOverride),
          messages: [{ role: "user", content: extractPrompt }],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });
      const data = await response.json();
      const newItems = data.choices?.[0]?.message?.content;
      if (newItems) {
        const updated = existingWorldView ? `${existingWorldView}\n${newItems}` : newItems;
        setWorldViews((prev) => ({ ...prev, [charId]: updated }));
        const charMem = getCharMemories(charId);
        const idx = (charMem.summaries || []).findIndex((s) => s.id === summaryEntry.id);
        if (idx !== -1) {
          charMem.summaries[idx].feedbackApplied = true;
          setAllMemories((prev) => ({ ...prev, [charId]: charMem }));
        }
        alert("✅ 世界观已更新！下次聊天时ta会参考这些认知～");
      }
    } catch (err) {
      alert("反哺失败了：" + err.message);
    } finally {
      setReflecting(false);
    }
  };

  const updateMemoryHeat = (charId, aiResponse) => {
    if (!aiResponse || !charId) return;
    const mem = getCharMemories(charId);
    let changed = false;
    ["fact", "emotion", "insight"].forEach((type) => {
      (mem[type] || []).forEach((entry) => {
        if (typeof entry === "object" && entry.text) {
          const keywords = entry.text
            .replace(/[，。！？、：；""''（）【】\s]/g, " ")
            .split(" ")
            .filter((w) => w.length >= 2);
          const matched = keywords.some((kw) => aiResponse.includes(kw));
          if (matched) {
            entry.mentions = (entry.mentions || 0) + 1;
            entry.lastMentioned = Date.now();
            changed = true;
          }
        }
      });
    });
    if (changed) setAllMemories((prev) => ({ ...prev, [charId]: mem }));
  };

  // ═══ 聊天 ═══

  const showMessagesSequentially = useCallback((thought, parts, timeStr) => {
    typingTimers.current.forEach(clearTimeout);
    typingTimers.current = [];
    let delay = 0;
    parts.forEach((text, i) => {
      const t1 = setTimeout(() => setIsTyping(true), delay);
      typingTimers.current.push(t1);
      delay += 600 + Math.random() * 300;
      const t2 = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "bot", thought: i === 0 ? thought : null, content: text, time: timeStr },
        ]);
        if (i === parts.length - 1) setIsSending(false);
      }, delay);
      typingTimers.current.push(t2);
      if (i < parts.length - 1) delay += 200;
    });
  }, []);

  const callLLM = async (allMsgs) => {
    const ctx = allMsgs
      .filter((m) => m.role === "user" || m.role === "bot")
      .slice(-ctxConfig.maxMessages)
      .map((m) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.isDiaryShare
          ? `[晚声把她的一篇日记分享给了你，请以你的性格温柔地回应这篇日记，可以共情、评论、提问]\n\n「${m.diaryDate || "某天"}的日记」\n${m.content}`
          : m.content,
      }));
    const charMemories = activeChar ? getCharMemories(activeChar.id) : {};
    const userCtx = activeChar ? buildUserContext(userProfile, activeChar.id) : "";
    const now = new Date();
    const timeInfo = `【当前时间】${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.toLocaleString("zh-CN", { weekday: "long" })} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const memoryInstruction = `\n\n【记忆写入指令】
  当你在对话中发现以下类型的重要信息时，请在回复末尾用特殊标签写入记忆（用户看不到这些标签）：
  - 用户提到的新事实（生活事件、人物关系、重要变化等）→ [记忆:事实]内容[/记忆]
  - 对话中产生的重要情绪感受 → [记忆:情绪]内容[/记忆]
  - 你从对话中获得的觉察和理解 → [记忆:觉察]内容[/记忆]
  每条记忆控制在30字以内，简洁准确。不是每次都需要写入，只在确实有值得记住的内容时才写。一次最多写入2条。`;
    const sysPrompt =
      timeInfo + "\n\n" +
      buildSystemPrompt(activeChar, charMemories) +
      (activeChar && worldViews[activeChar.id] ? `\n\n【你的世界观与核心认知】\n${worldViews[activeChar.id]}` : "") +
      (userCtx ? `\n\n${userCtx}` : "") +
      memoryInstruction;
    const modelToUse = getActiveModel(activeChar?.modelOverride);
    const resp = await fetch(config.apiUrl.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: "system", content: sysPrompt }, ...ctx],
        temperature: 0.8,
        max_tokens: ctxConfig.maxTokens,
      }),
    });
    if (!resp.ok) {
      const e = await resp.text().catch(() => "");
      throw new Error(`API ${resp.status}: ${e.slice(0, 200)}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "（没有收到回复）";
  };

  const handleRegenerate = async () => {
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1 || isSending) return;
    const msgsUpToUser = messages.slice(0, lastUserIdx + 1);
    setMessages(msgsUpToUser);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setIsSending(true);
    setIsTyping(true);
    if (!isConfigReady()) {
      setTimeout(() => {
        setIsTyping(false);
        showMessagesSequentially("大脑还没接通……", ["我想回复你，但还没连上大脑哦", "帮我在设置里接通一下？"], timeStr);
      }, 800);
      return;
    }
    try {
      const raw = await callLLM(msgsUpToUser);
      setIsTyping(false);
      const cleanedRaw = extractAndSaveMemories(raw, activeChar?.id, allMemories, setAllMemories);
      const { thought, parts } = parseResponse(cleanedRaw);
      showMessagesSequentially(thought, parts, timeStr);
      updateMemoryHeat(activeChar?.id, cleanedRaw);
    } catch (err) {
      setIsTyping(false);
      setIsSending(false);
      setMessages((prev) => [...prev, { role: "bot", thought: "又出错了……", content: `重新生成失败：${err.message}`, time: timeStr }]);
    }
  };

  const handleEditAndResend = async (msgIdx, newText) => {
    if (!newText.trim() || isSending) return;
    setEditingMsgIdx(null);
    setEditingMsgText("");
    const newMsgs = messages.slice(0, msgIdx + 1);
    newMsgs[msgIdx] = { ...newMsgs[msgIdx], content: newText.trim() };
    setMessages(newMsgs);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setIsSending(true);
    setIsTyping(true);
    if (!isConfigReady()) {
      setTimeout(() => {
        setIsTyping(false);
        showMessagesSequentially("大脑还没接通……", ["还没连上大脑哦~"], timeStr);
      }, 800);
      return;
    }
    try {
      const raw = await callLLM(newMsgs);
      setIsTyping(false);
      const cleanedRaw = extractAndSaveMemories(raw, activeChar?.id, allMemories, setAllMemories);
      const { thought, parts } = parseResponse(cleanedRaw);
      showMessagesSequentially(thought, parts, timeStr);
      updateMemoryHeat(activeChar?.id, cleanedRaw);
    } catch (err) {
      setIsTyping(false);
      setIsSending(false);
      setMessages((prev) => [...prev, { role: "bot", thought: "出错了……", content: `出错了：${err.message}`, time: timeStr }]);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const userMsg = { role: "user", content: inputText, time: timeStr };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputText("");
    document.querySelector(".input-field")?.style &&
      (document.querySelector(".input-field").style.height = "auto");
    setIsSending(true);
    setIsTyping(true);
    if (!isConfigReady()) {
      setTimeout(() => {
        setIsTyping(false);
        showMessagesSequentially(
          `她说了"${userMsg.content}"……但大脑还没接通。`,
          ["我听到啦~", "不过我现在还没有连上大脑哦", "点右上角的齿轮帮我接通吧？"],
          timeStr,
        );
      }, 800);
      return;
    }
    try {
      const raw = await callLLM(newMsgs);
      setIsTyping(false);
      const cleanedRaw = extractAndSaveMemories(raw, activeChar?.id, allMemories, setAllMemories);
      const { thought, parts } = parseResponse(cleanedRaw);
      showMessagesSequentially(thought, parts, timeStr);
      updateMemoryHeat(activeChar?.id, cleanedRaw);
    } catch (err) {
      setIsTyping(false);
      setIsSending(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", thought: "呜……连接出了问题。", content: `连接出错了：${err.message}`, time: timeStr },
      ]);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try {
      const model = getActiveModel(activeChar?.modelOverride);
      const r = await fetch(config.apiUrl.replace(/\/+$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "说一个字：好" }], max_tokens: 10 }),
      });
      if (r.ok) {
        setTestStatus("success");
      } else {
        const errText = await r.text().catch(() => "");
        const brief = errText.slice(0, 80);
        setTestStatus(`fail:${r.status} ${brief}`);
      }
    } catch (err) {
      setTestStatus("fail:网络错误 " + err.message);
    }
    setTimeout(() => setTestStatus(null), 6000);
  };

  const handleSaveMemInjection = (newConfig) => {
    setMemInjection(newConfig);
    saveMemoryInjection(newConfig);
  };

  const getCurrentPromptTokens = () => {
    if (!activeChar) return 0;
    const charMemories = getCharMemories(activeChar.id);
    const prompt = buildSystemPrompt(activeChar, charMemories);
    return estimateTokens(prompt);
  };

  const handleSaveAll = () => {
    saveConfig(config);
    saveCtxConfig(ctxConfig);
    setShowConfig(false);
  };

  const handleExportChat = () => {
    if (!messages || messages.length === 0) return;
    const charName = activeChar?.name || "赛博伴侣";
    const threadName = (() => {
      const threads = chatThreads[activeCharId] || [];
      const t = threads.find((t) => t.id === activeThreadId);
      return t?.name || "对话";
    })();
    let text = `📝 ${charName} · ${threadName}\n`;
    text += `导出时间：${new Date().toLocaleString("zh-CN")}\n`;
    text += `${"─".repeat(30)}\n\n`;
    messages.forEach((msg) => {
      const sender = msg.role === "user" ? (userProfile.globalFacts.name || "我") : charName;
      const time = msg.time || "";
      if (msg.thought) text += `  💭 ${msg.thought}\n`;
      if (msg.isDiaryShare) {
        text += `[${sender}] ${time} 📔 分享了日记：\n${msg.content}\n\n`;
      } else {
        text += `[${sender}] ${time}\n${msg.content}\n\n`;
      }
    });
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${charName}_${threadName}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    setMessages([{
      role: "bot",
      thought: "记忆被清空了……但没关系，我还在这里。",
      content: "对话已经清空啦。我们重新开始吧。",
      time: new Date().toTimeString().slice(0, 5),
    }]);
    setShowClearConfirm(false);
    setShowConfig(false);
  };

  const handleSaveDiary = () => {
    if (!diaryText.trim()) return;
    const entry = {
      text: diaryText,
      date: new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" }),
      time: new Date().toTimeString().slice(0, 5),
    };
    const updated = [entry, ...diaryEntries];
    setDiaryEntries(updated);
    saveDiary(updated);
    setDiaryText("");
  };

  // ═══ 渲染 ═══
  return (
    <>
      {/* 入口页 */}
      {page === "entrance" && (
        <EntrancePage
          doorAnimating={doorAnimating}
          enterBedroom={enterBedroom}
          navigateTo={navigateTo}
          setShowMyProfile={setShowMyProfile}
          userProfile={userProfile}
        />
      )}

      {/* 我的档案覆层 */}
      {showMyProfile && (
        <MyProfilePage
          setShowMyProfile={setShowMyProfile}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          characters={characters}
        />
      )}

      {/* 成员档案列表 */}
      {page === "profiles" && (
        <ProfilesPage
          characters={characters}
          prevPage={prevPage}
          navigateTo={navigateTo}
          openProfileEdit={openProfileEdit}
          createChar={createChar}
        />
      )}

      {/* 档案编辑 */}
      {page === "profileEdit" && (
        <ProfileEditPage
          editingChar={editingChar}
          setEditingChar={setEditingChar}
          editSection={editSection}
          setEditSection={setEditSection}
          saveEditingChar={saveEditingChar}
          prevPage={prevPage}
          navigateTo={navigateTo}
          openMemoryPalace={openMemoryPalace}
          handleAvatarUpload={handleAvatarUpload}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          deleteChar={deleteChar}
          updateEditProfile={updateEditProfile}
          updateEditOcean={updateEditOcean}
          updateEditPersonality={updateEditPersonality}
          updateEditWorldview={updateEditWorldview}
          updateEditMigration={updateEditMigration}
          openRawArchive={openRawArchive}
        />
      )}

      {/* 原始档案馆 */}
      {page === "rawArchive" && (
        <RawArchivePage
          charId={rawArchiveCharId}
          characters={characters}
          rawArchives={rawArchives}
          addRawArchive={addRawArchive}
          deleteRawArchive={deleteRawArchive}
          memoryChunks={memoryChunks}
          generateChunks={generateChunks}
          deleteChunk={deleteChunk}
          navigateTo={navigateTo}
        />
      )}

      {/* 记忆宫殿 */}
      {page === "memoryPalace" && (
        <MemoryPalacePage
          memCharId={memCharId}
          memEntryFrom={memEntryFrom}
          characters={characters}
          navigateTo={navigateTo}
          setEditingChar={setEditingChar}
          setEditSection={setEditSection}
          memTab={memTab}
          setMemTab={setMemTab}
          memSort={memSort}
          setMemSort={setMemSort}
          memFilter={memFilter}
          setMemFilter={setMemFilter}
          memInput={memInput}
          setMemInput={setMemInput}
          summaryInput={summaryInput}
          setSummaryInput={setSummaryInput}
          showAddSummary={showAddSummary}
          setShowAddSummary={setShowAddSummary}
          getCharMemories={getCharMemories}
          addMemory={addMemory}
          deleteMemory={deleteMemory}
          toggleMemoryImportant={toggleMemoryImportant}
          getReflectSetting={getReflectSetting}
          shouldReflect={shouldReflect}
          reflecting={reflecting}
          autoReflect={autoReflect}
          oceanSuggestion={oceanSuggestion}
          setOceanSuggestion={setOceanSuggestion}
          personalitySuggestion={personalitySuggestion}
          setPersonalitySuggestion={setPersonalitySuggestion}
          applyOceanGrowth={applyOceanGrowth}
          applyPersonalityGrowth={applyPersonalityGrowth}
          addSummary={addSummary}
          worldViews={worldViews}
          applyFeedbackToProfile={applyFeedbackToProfile}
          reflectSettings={reflectSettings}
          setReflectSettings={setReflectSettings}
        />
      )}

      {/* 卧室 */}
      {page === "bedroom" && (
        <BedroomPage
          navigateTo={navigateTo}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
          showCharSelect={showCharSelect}
          setShowCharSelect={setShowCharSelect}
          characters={characters}
          enterChat={enterChat}
        />
      )}

      {/* 日记 */}
      {page === "diary" && (
        <DiaryPage
          navigateTo={navigateTo}
          diaryText={diaryText}
          setDiaryText={setDiaryText}
          diaryEntries={diaryEntries}
          handleSaveDiary={handleSaveDiary}
          diaryToShare={diaryToShare}
          setDiaryToShare={setDiaryToShare}
          characters={characters}
          shareDiaryToChat={shareDiaryToChat}
        />
      )}

      {/* 聊天 */}
      {page === "chat" && (
        <ChatPage
          activeChar={activeChar}
          activeCharId={activeCharId}
          setCharacters={setCharacters}
          navigateTo={navigateTo}
          openMemoryPalace={openMemoryPalace}
          setEditingChar={setEditingChar}
          setEditSection={setEditSection}
          isConfigReady={isConfigReady}
          getActiveModel={getActiveModel}
          showThreadSidebar={showThreadSidebar}
          setShowThreadSidebar={setShowThreadSidebar}
          activeThreadId={activeThreadId}
          getCharThreads={getCharThreads}
          createThread={createThread}
          switchThread={switchThread}
          deleteThread={deleteThread}
          showMemoryControl={showMemoryControl}
          setShowMemoryControl={setShowMemoryControl}
          memInjection={memInjection}
          handleSaveMemInjection={handleSaveMemInjection}
          getCurrentPromptTokens={getCurrentPromptTokens}
          editingMsgIdx={editingMsgIdx}
          setEditingMsgIdx={setEditingMsgIdx}
          editingMsgText={editingMsgText}
          setEditingMsgText={setEditingMsgText}
          handleEditAndResend={handleEditAndResend}
          showConfig={showConfig}
          setShowConfig={setShowConfig}
          config={config}
          setConfig={setConfig}
          ctxConfig={ctxConfig}
          setCtxConfig={setCtxConfig}
          handleExportChat={handleExportChat}
          showClearConfirm={showClearConfirm}
          setShowClearConfirm={setShowClearConfirm}
          handleClearChat={handleClearChat}
          handleTestConnection={handleTestConnection}
          handleSaveAll={handleSaveAll}
          testStatus={testStatus}
          messages={messages}
          isSending={isSending}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
          handleRegenerate={handleRegenerate}
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSend}
        />
      )}
    </>
  );
}
