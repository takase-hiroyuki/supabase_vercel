// config.js

// 1. Supabaseの接続設定（※後ほど本番の鍵に書き換えますが、今はこのままでOKです）
export const SUPABASE_URL = "https://your-project-id.supabase.co";
export const SUPABASE_KEY = "your-anon-key";

// 2. URLパラメータの解析（?room=game01&role=host などの文字を分解して取り出す）
const urlParams = new URLSearchParams(window.location.search);

export const roomId = urlParams.get('room'); // 例: 'game01' という文字を輸出
export const role = urlParams.get('role');     // 例: 'host' または 'guest' を輸出
