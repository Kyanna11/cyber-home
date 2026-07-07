// ─── Supabase 客户端 ───
// 环境变量未配置时使用假值占位，app 仍可运行，用户可在界面设置中填入真实值

import { createClient } from "@supabase/supabase-js";

// 优先用环境变量，没有就用假值占位（部署后可在设置里覆盖）
const url = import.meta.env.VITE_SUPABASE_URL || 'https://fake-project.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'fake-anon-key-please-replace';

// 只要 url 和 key 存在（即使是假的），就创建客户端
// 这样 localStorage 降级机制依然正常工作
export const supabase = createClient(url, key);
