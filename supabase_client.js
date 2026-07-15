// supabase_client.js

// config.js から接続情報をインポート
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// HTML側（CDN等）でグローバルに読み込まれている `supabase` オブジェクトを使用して、
// 本システム専用の接続インスタンスを生成
export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("【デバッグ】supabase_client.js: Supabaseクライアントの初期化が完了しました。");
