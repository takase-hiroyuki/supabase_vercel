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
 * 
 * 【修正経緯】
 * 従来の処理では rooms テーブルの current_turn_user_id を切り替えるだけで、
 * 次のプレイヤー（nextUserId）の last_dice を 0 にリセットする処理が欠落していました。
 * これにより前周の出目が残り、手番開始直後にUIがロックされるバグが発生。
 * 対策として、手番変更前に participants テーブルから新プレイヤーの最新の state を取得し、
 * その中の last_dice を 0 に安全に上書きしてから手番を移行するよう修正しました。
 * 
 * @param {string} targetRoomId - 部屋ID
 * @param {string|null} nextUserId - 次に手番を持つプレイヤーのuser_id
 */
export async function updateCurrentTurn(targetRoomId, nextUserId) {
    if (nextUserId) {
        const { data: participant, error: fetchError } = await supabase
            .from('participants')
            .select('state')
            .eq('room_id', targetRoomId)
            .eq('user_id', nextUserId)
            .maybeSingle();

        if (fetchError) {
            console.error('移行先プレイヤーの取得失敗:', fetchError);
            throw fetchError;
        }

        if (participant && participant.state) {
            const updatedState = {
                ...participant.state,
                last_dice: 0
            };

            const { error: updatePlayerError } = await supabase
                .from('participants')
                .update({ state: updatedState })
                .eq('room_id', targetRoomId)
                .eq('user_id', nextUserId);

            if (updatePlayerError) {
                console.error('手番開始時のlast_diceリセットに失敗:', updatePlayerError);
                throw updatePlayerError;
            }
            console.log(`【デバッグ】ユーザー [${nextUserId}] の last_dice を 0 に初期化しました。`);
        }
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
