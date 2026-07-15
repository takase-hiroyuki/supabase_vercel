// supabase_client.js

import { supabaseUrl, supabaseAnonKey } from './config.js';

// CDNのグローバル変数に依存せず、URLから直接 createClient をインポートして生成する
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

console.log("【デバッグ】supabase_client.js: クライアント初期化を開始します。");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("【デバッグ】supabase_client.js: Supabaseクライアントの初期化が完了しました。");
