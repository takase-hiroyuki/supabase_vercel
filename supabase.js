// supabase.js

// config.js から接続鍵をインポート
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Supabaseクライアントを初期化（※HTML側で読み込んでいる大元の辞書『supabase』を使います）
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 参加者データをSupabaseのテーブルに送信（挿入）する関数
 * @param {string} roomId - 部屋ID
 * @param {string} username - プレイヤー名
 * @param {string} userId - プレイヤーの固有ID
 */
export async function insertParticipant(roomId, username, userId) {
    // JSON型カラム「state」に格納するオブジェクトの定義
    const playerState = {
        name: username,
        join_order: 0, // 入室順（後ほどロジック実装）
        position: 0,   // 初期位置（0: スタート）
        role: '一般'   // 初期役割
    };

    // participants テーブルにデータを1行追加（INSERT）
    const { data, error } = await supabaseClient
        .from('participants')
        .insert([
            { 
                room_id: roomId, 
                user_id: userId, 
                state: playerState // JSON型カラムにオブジェクトを割り当て
            }
        ]);
    
    if (error) {
        console.error('Supabase送信エラー:', error);
        console.log("【デバッグ・エラー詳細】メッセージ:", error.message);
        console.log("【デバッグ・エラー詳細】コード:", error.code);
        console.log("【デバッグ・エラー詳細】詳細:", error.details);
        throw error;
    } else {
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
 * 部屋のデータをリセットする関数
 */
export async function clearRoomParticipants(targetRoomId) {
    const { data, error } = await supabaseClient
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId)
        .select();

    if (error) {
        alert("ERROR: " + error.message);
        throw error;
    }
    
    const deleteCount = data ? data.length : 0;
    alert("COUNT: " + deleteCount);
    
    return data;
}
