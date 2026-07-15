// supabase_game.js

// 接続クライアントを正確な名前でインポート
import { supabase } from './supabase_client.js';

/**
 * 指定した部屋の現在の手番（プレイヤーID）を取得する関数
 * @param {string} targetRoomId - 部屋ID
 * @returns {Promise<string|null>} 現在の手番のuser_id（データがない場合はnull）
 */
export async function getCurrentTurn(targetRoomId) {
    const { data, error } = await supabase
        .from('rooms')
        .select('current_turn_user_id')
        .eq('id', targetRoomId)
        .maybeSingle();

    if (error) {
        console.error('rooms取得エラー:', error);
        throw error;
    }
    return data ? data.current_turn_user_id : null;
}

/**
 * 指定した部屋の手番（プレイヤーID）を更新する関数
 * @param {string} targetRoomId - 部屋ID
 * @param {string|null} nextUserId - 次に手番を持つプレイヤーのuser_id
 */
export async function updateCurrentTurn(targetRoomId, nextUserId) {
    const { data, error } = await supabase
        .from('rooms')
        .upsert({ id: targetRoomId, current_turn_user_id: nextUserId })
        .select();

    if (error) {
        console.error('rooms更新エラー:', error);
        throw error;
    }
    return data;
}

/**
 * 部屋のデータをリセットする関数（一括削除）
 * @param {string} targetRoomId - 部屋ID
 */
export async function clearRoomParticipants(targetRoomId) {
    // 1. 該当する部屋の参加者を物理削除
    const { data, error } = await supabase
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId)
        .select();

    if (error) {
        console.error("削除エラー:", error.message);
        throw error;
    }

    // 2. 部屋の手番情報（current_turn_user_id）もNULLに更新し、DBをクリーンアップ
    const { error: roomError } = await supabase
        .from('rooms')
        .update({ current_turn_user_id: null })
        .eq('id', targetRoomId);

    if (roomError) {
        console.error("部屋の手番リセットエラー:", roomError.message);
        throw roomError;
    }
    
    return data;
}

/**
 * 部屋（rooms）の変更をリアルタイムで監視する関数
 * @param {string} targetRoomId - 監視する部屋ID
 * @param {function} onUpdate - データ更新時に実行する関数
 */
export function subscribeToRoom(targetRoomId, onUpdate) {
    // 初期化時に現在の手番を一度取得して反映
    getCurrentTurn(targetRoomId).then((currentTurnUserId) => {
        onUpdate(currentTurnUserId);
    }).catch((err) => {
        console.error("手番の初期値取得に失敗しました:", err);
    });

    // リアルタイム通信を開始して、roomsテーブルの変更を監視する
    return supabase
        .channel('public:rooms')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${targetRoomId}` },
            (payload) => {
                console.log("【デバッグ・Realtime受信】rooms変更を検知しました:", payload);
                
                // DELETEイベント発生時、またはpayload.newが存在しない場合の安全なフォールバック
                let nextTurnUserId = null;
                if (payload.eventType !== 'DELETE' && payload.new) {
                    nextTurnUserId = payload.new.current_turn_user_id;
                }
                
                onUpdate(nextTurnUserId);
            }
        )
        .subscribe();
}
