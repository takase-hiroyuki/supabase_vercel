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


/**
 * リアルタイムで参加者リストの変更を監視し、描画関数を実行する関数
 * @param {string} targetRoomId - 監視する部屋ID
 * @param {function} onUpdate - データ更新時に実行する描画関数
 */
export function subscribeToParticipants(targetRoomId, onUpdate) {
    // 1. 最初の一回、現在テーブルにあるデータを取得して描画に渡す
    supabaseClient
        .from('participants')
        .select('*')
        .eq('room_id', targetRoomId)
        .order('id', { ascending: true })
        .then(({ data, error }) => {
            if (!error && data) onUpdate(data);
        });

    // 2. リアルタイム通信を開始して、データの追加や更新を監視する
    return supabaseClient
        .channel('public:participants')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'participants' },
            async (payload) => {
                console.log("【デバッグ・Realtime受信】変更を検知しました:", payload);
                // 変更があったので最新のリストを再取得して描画関数に渡す
                const { data } = await supabaseClient
                    .from('participants')
                    .select('*')
                    .eq('room_id', targetRoomId)
                    .order('id', { ascending: true });
                if (data) onUpdate(data);
            }
        )
        .subscribe((status, err) => {
            console.log("【デバッグ・Realtime状態】接続ステータス:", status);
            if (err) console.error("【デバッグ・Realtimeエラー】詳細:", err);
        });
}

/**
 * 指定された部屋IDの参加者データをすべて削除（リセット）する関数
 * @param {string} targetRoomId - リセットする部屋ID
 */
export async function clearRoomParticipants(targetRoomId) {
    const { data, error } = await supabaseClient
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId);

    if (error) {
        console.error('データリセットエラー:', error);
        throw error;
    }
    
    console.log(`【デバッグ】部屋 ${targetRoomId} のデータをリセットしました。`);
    return data;
}
