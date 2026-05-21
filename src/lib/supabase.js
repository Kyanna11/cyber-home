// ─── Supabase 客户端 ───
// 环境变量未配置时 supabase = null，app 降级为纯 localStorage 模式

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (url && key) ? createClient(url, key) : null;
