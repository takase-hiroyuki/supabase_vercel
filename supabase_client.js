// supabase_client.js

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// URLから直接 createClient をインポート
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

console.log("【デバッグ】supabase_client.js: クライアント初期化を開始します。");

// config.js の大文字変数名に準拠して初期化
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("【デバッグ】supabase_client.js: Supabaseクライアントの初期化が完了しました。");
