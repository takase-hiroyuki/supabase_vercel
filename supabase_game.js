// supabase_game.js

// 接続クライアントを正確な名前でインポート
import { supabase } from './supabase_client.js';
// アトミック部分更新用RPCを安全に呼び出すためのインポート
import { updateParticipantState } from './supabase_participants.js';

/**
 * 指定した部屋の現在の手番および部屋全体のデータを取得する関数
 * @param {string} targetRoomId - 部屋ID
 * @returns {Promise<object|null>} 部屋レコード全体（データがない場合はnull）
 */
export async function getRoomData(targetRoomId) {
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', targetRoomId)
        .maybeSingle();

    if (error) {
        console.error('roomsデータ取得エラー:', error);
        throw error;
    }
    return data;
}

/**
 * 指定した部屋の現在の手番（プレイヤーID）を取得する関数
 * （※互換性および既存のハブ経由での呼び出しを維持）
 */
export async function getCurrentTurn(targetRoomId) {
    const data = await getRoomData(targetRoomId);
    return data ? data.current_turn_user_id : null;
}

/**
 * 🌟【新規追加】部屋のゲーム状態（game_stateカラム）を安全に更新する関数
 * 完全上書きを回避し、既存のgame_stateオブジェクトと部分マージ（パッチ適用）してアトミックに保存します
 * @param {string} targetRoomId - 部屋ID
 * @param {object} gameStatePatch - game_state 内にマージしたい差分オブジェクト
 */
export async function updateRoomGameState(targetRoomId, gameStatePatch) {
    try {
        // 現在の部屋データを一度安全に取得
        const roomData = await getRoomData(targetRoomId);
        const currentGameState = roomData?.game_state || {};

        // 破壊を防ぐため、既存の構造を引き継いだ上で差分パッチを適用
        const updatedGameState = {
            ...currentGameState,
            ...gameStatePatch
        };

        const { data, error } = await supabase
            .from('rooms')
            .update({ game_state: updatedGameState })
            .eq('id', targetRoomId)
            .select();

        if (error) {
            console.error('rooms game_state 更新エラー:', error);
            throw error;
        }
        return data;
    } catch (err) {
        console.error('updateRoomGameState 内で例外が発生しました:', err);
        throw err;
    }
}

/**
 * 指定した部屋の手番（プレイヤーID）を更新する関数
 * @param {string} targetRoomId - 部屋ID
 * @param {string|null} nextUserId - 次に手番を持つプレイヤーのuser_id
 */
export async function updateCurrentTurn(targetRoomId, nextUserId) {
    if (nextUserId) {
        // RPCを用いたアトミック差分マージを実行して last_dice を安全に 0 に初期化
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
        .update({ current_turn_user_id: null, game_state: null }) // カード状態も合わせてクリア
        .eq('id', targetRoomId);

    if (roomError) {
        console.error("部屋の手番リセットエラー:", roomError.message);
        throw roomError;
    }
    
    return data;
}

/**
 * 部屋（rooms）の変更をリアルタイムで監視する関数
 * 🌟手番IDだけでなく、game_state（ドローカード情報）も親（App）へ漏れなく通知できるようコールバック引数を拡張
 * @param {string} targetRoomId - 監視する部屋ID
 * @param {function} onUpdate - データ更新時に実行する関数。引数に (current_turn_user_id, fullRoomData) を受け取ります
 */
export function subscribeToRoom(targetRoomId, onUpdate) {
    // 初回読み込み時のデータ同期
    getRoomData(targetRoomId).then((roomData) => {
        if (roomData) {
            onUpdate(roomData.current_turn_user_id, roomData);
        } else {
            onUpdate(null, null);
        }
    }).catch((err) => {
        console.error("部屋の初期値取得に失敗しました:", err);
    });

    return supabase
        .channel('public:rooms')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${targetRoomId}` },
            (payload) => {
                console.log("【デバッグ・Realtime受信】rooms変更を検知しました:", payload);
                
                let nextTurnUserId = null;
                let fullRoomData = null;
                
                if (payload.eventType !== 'DELETE' && payload.new) {
                    nextTurnUserId = payload.new.current_turn_user_id;
                    fullRoomData = payload.new;
                }
                
                // 親の guest_app.js へ最新の手番IDと部屋データ全体を安全に流し込む
                onUpdate(nextTurnUserId, fullRoomData);
            }
        )
        .subscribe();
}
