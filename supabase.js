// supabase.js

// config.js から接続鍵をインポート
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Supabaseライアントを初期化（※HTML側で読み込んでいる大元の辞書『supabase』を使います）
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 参加者データをSupabaseのテーブルに送信（挿入）する関数
 * @param {string} roomId - 部屋ID
 * @param {string} username - プレイヤー名
 * @param {string} userId - プレイヤーの固有ID
 */
export async function insertParticipant(roomId, username, userId) {
    // participants テーブルにデータを1行追加（INSERT）する命令
    const { data, error } = await supabaseClient
        .from('participants')
        .insert([
            { 
                room_id: roomId, 
                user_id: userId, 
                name: username, 
                role: '一般' // 最初は全員「一般」からスタート
            }
        ]);
    
    if (error) {
        console.error('Supabase送信エラー:', error);
        // 【追記デバッグコード】エラーの具体的な中身をテキスト出力
        console.log("【デバッグ・エラー詳細】メッセージ:", error.message);
        console.log("【デバッグ・エラー詳細】コード:", error.code);
        console.log("【デバッグ・エラー詳細】詳細:", error.details);
        throw error;
    } else {
        // 【追記デバッグコード】成功時の確認
        console.log("【デバッグ・成功】insertParticipant が正常に完了しました。返ってきたデータ:", data);
    }
    
    return data;
}
