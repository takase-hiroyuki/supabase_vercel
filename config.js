// config.js

// 1. Supabaseの接続設定（最新のプロジェクト情報）
export const SUPABASE_URL = "https://iasdvzfswkfstscsdlfd.supabase.co";
export const SUPABASE_KEY = "sb_publishable_z_JmCe9P8RyKz_-0zZtEOQ_OKcTryro";

// 2. URLパラメータの解析
const urlParams = new URLSearchParams(window.location.search);
export const roomId = urlParams.get('room'); 
export const role = urlParams.get('role');
