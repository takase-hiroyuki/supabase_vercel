// config.js

// 1. Supabaseの接続設定（最新のプロジェクト情報）
export const SUPABASE_URL = "https://iasdvzfswkfstscsdlfd.supabase.co";
export const SUPABASE_KEY = "sb_publishable_z_JmCe9P8RyKz_-0zZtEOQ_OKcTryro";

// 2. URLパラメータの解析
const urlParams = new URLSearchParams(window.location.search);
export const roomId = urlParams.get('room'); 

// 🚀【変更点】URLに role=host が明示されていない場合は、すべて「guest」として扱う
const rawRole = urlParams.get('role');
export const role = (rawRole === 'host') ? 'host' : 'guest';


// 【デバッグコード】config.jsの読み込み確認
console.log("【デバッグ】config.js が読み込まれました。");
console.log("URL:", SUPABASE_URL);
console.log("KEYの一部:", SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) + "..." : "無し");
console.log("現在の役割:", role);
