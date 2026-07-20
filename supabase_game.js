// supabase_game.js

// 接続クライアントを正確な名前でインポート
import { supabase } from './supabase_client.js';
// 【追加】アトミック部分更新用RPCを安全に呼び出すためのインポートを追加
import { updateParticipantState } from './supabase_participants.js';

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
 * 
 * 【修正経緯】
 * 従来の処理ではフロントサイドで一度state全体を取得（FETCH）し、組み立て直してから
 * 完全上書き（UPDATE）を行っていたため、ミリ秒単位の競合によるロストアップデートリスクがありました。
 * 「アトミック部分更新原則」に準拠するため、FETCH処理を撤廃。
 * データベース層に実装されたRPC 'merge_participant_state' を直接発行し、
 * 対象プレイヤーの last_dice のみをアトミックに差分更新（0へリセット）した上で手番を移行するよう修正しました。
 * 
 * @param {string} targetRoomId - 部屋ID
 * @param {string|null} nextUserId - 次に手番を持つプレイヤーのuser_id
 */
export async function updateCurrentTurn(targetRoomId, nextUserId) {
    if (nextUserId) {
        // 【データアクセス方針5.2.1/5.2.2適用】
        // クライアントサイドでの完全上書きによる破壊を防ぐため、RPCを用いたアトミック差分マージを実行
        const { error: updatePlayerError } = await supabase
            .rpc('merge_participant_state', {
                target_user_id: nextUserId,
                state_patch: { last_dice: 0 }
            });

        if (updatePlayerError) {
            console.error('手番開始時のlast_diceアトミックリセットに失敗:', updatePlayerError);
            throw updatePlayerError;
        }
        console.log(`【デバッグ】ユーザー [${nextUserId}] の last_dice を RPC 経由で安全に 0 に初期化しました。`);
    }

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
    const { data, error } = await supabase
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId)
        .select();

    if (error) {
        console.error("削除エラー:", error.message);
        throw error;
    }

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
 * @param {function} onUpdate -データ更新時に実行する関数
 */
export function subscribeToRoom(targetRoomId, onUpdate) {
    getCurrentTurn(targetRoomId).then((currentTurnUserId) => {
        onUpdate(currentTurnUserId);
    }).catch((err) => {
        console.error("手番の初期値取得に失敗しました:", err);
    });

    return supabase
        .channel('public:rooms')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${targetRoomId}` },
            (payload) => {
                console.log("【デバッグ・Realtime受信】rooms変更を検知しました:", payload);
                
                let nextTurnUserId = null;
                if (payload.eventType !== 'DELETE' && payload.new) {
                    nextTurnUserId = payload.new.current_turn_user_id;
                }
                
                onUpdate(nextTurnUserId);
            }
        )
        .subscribe();
}
