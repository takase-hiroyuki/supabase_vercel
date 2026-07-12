// supabase.js

// config.js から接続鍵をインポート
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Supabaseクライアントを初期化（HTML側で読み込んでいる大元の辞書『supabase』を使用）
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 参加者データをSupabaseのテーブルに送信（挿入）する関数
 * @param {string} roomId - 部屋ID
 * @param {string} username - プレイヤー名
 * @param {string} userId - プレイヤーの固有ID
 */
export async function insertParticipant(roomId, username, userId) {
    // JSON型カラム「state」に格納するオブジェクトの定義（不要な join_order は廃止）
    const playerState = {
        name: username,
        position: 0,   // 初期位置（0: スタート）
        role: '一般',  // 初期役割
        last_dice: 0   // 初期サイコロの出目（0はまだ振っていない状態）
    };

    // participants テーブルにデータを1行追加（INSERT）
    const { data, error } = await supabaseClient
        .from('participants')
        .insert([
            { 
                room_id: roomId, 
                user_id: userId, 
                state: playerState 
            }
        ]);
    
    if (error) {
        console.error('Supabase送信エラー:', error);
        throw error;
    }
    
    return data;
}

/**
 * 特定のプレイヤーの「state（JSONデータ）」を更新する関数
 * @param {string} userId - 更新対象のプレイヤー固有ID
 * @param {object} newState - 新しい状態のJSONオブジェクト
 */
export async function updateParticipantState(userId, newState) {
    const { data, error } = await supabaseClient
        .from('participants')
        .update({ state: newState }) // stateカラムの中身を丸ごと上書き
        .eq('user_id', userId);      // user_id が一致する行が対象

    if (error) {
        console.error('Supabase更新エラー:', error);
        throw error;
    }
    
    return data;
}

/**
 * リアルタイムで参加者リストの変更を監視し、描画関数を実行する関数
 * @param {string} targetRoomId - 監視する部屋ID
 * @param {function} onUpdate - データ更新時に実行する描画関数
 */
export function subscribeToParticipants(targetRoomId, onUpdate) {
    // 1. 最初の一回、現在テーブルにあるデータを自動連番（id）順に取得して描画に渡す
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
                // 変更があったので最新のリストを自動連番（id）順で再取得して描画関数に渡す
                const { data } = await supabaseClient
                    .from('participants')
                    .select('*')
                    .eq('room_id', targetRoomId)
                    .order('id', { ascending: true });
                if (data) onUpdate(data);
            }
        )
        .subscribe();
}

/**
 * 部屋のデータをリセットする関数（一括削除）
 * @param {string} targetRoomId - 部屋ID
 */
export async function clearRoomParticipants(targetRoomId) {
    // 1. 該当する部屋の参加者を物理削除
    const { data, error } = await supabaseClient
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId)
        .select();

    if (error) {
        console.error("削除エラー:", error.message);
        throw error;
    }

    // 2. 部屋の手番情報（current_turn_user_id）もNULLに更新し、DBをクリーンアップ
    const { error: roomError } = await supabaseClient
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
 * 指定した部屋の現在の手番（プレイヤーID）を取得する関数
 * @param {string} targetRoomId - 部屋ID
 * @returns {string|null} 現在の手番のuser_id（データがない場合はnull）
 */
export async function getCurrentTurn(targetRoomId) {
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
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
 * 部屋（rooms）の変更をリアルタイムで監視する関数
 * @param {string} targetRoomId - 監視する部屋ID
 * @param {function} onUpdate - データ更新時に実行する関数
 */
export function subscribeToRoom(targetRoomId, onUpdate) {
    getCurrentTurn(targetRoomId).then((currentTurnUserId) => {
        onUpdate(currentTurnUserId);
    });

    return supabaseClient
        .channel('public:rooms')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${targetRoomId}` },
            (payload) => {
                console.log("【デバッグ】【rooms】変更を検知しました:", payload);
                const nextTurnUserId = payload.new ? payload.new.current_turn_user_id : null;
                onUpdate(nextTurnUserId);
            }
        )
        .subscribe();
}

/**
 * 指定したプレイヤーがすでに部屋に登録されているか確認する関数
 * @param {string} targetRoomId - 部屋ID
 * @param {string} targetUserId - プレイヤー固有ID
 * @returns {object|null} 登録されている場合はその行のデータ、ない場合はnull
 */
export async function checkExistingParticipant(targetRoomId, targetUserId) {
    const { data, error } = await supabaseClient
        .from('participants')
        .select('*')
        .eq('room_id', targetRoomId)
        .eq('user_id', targetUserId)
        .maybeSingle();

    if (error) {
        console.error('参加者確認エラー:', error);
        throw error;
    }
    return data;
}

/**
 * 特定の参加者を削除（退室処理）し、必要に応じて手番を次のプレイヤーに移譲する関数
 * @param {string} targetRoomId - 部屋ID
 * @param {string} targetUserId - 削除対象のユーザーID
 */
export async function deleteParticipant(targetRoomId, targetUserId) {
    // 1. 削除前に、現在の全参加者リストを自動連番（id）順で取得し、現在の手番も確認
    const { data: participants } = await supabaseClient
        .from('participants')
        .select('*')
        .eq('room_id', targetRoomId)
        .order('id', { ascending: true });
        
    const currentTurn = await getCurrentTurn(targetRoomId);

    // 2. 該当ユーザーのレコードを物理削除
    const { error } = await supabaseClient
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId)
        .eq('user_id', targetUserId);

    if (error) {
        console.error('参加者削除エラー:', error);
        throw error;
    }

    // 3. 削除されたプレイヤーが現在の手番保持者であった場合の移譲ロジック
    if (currentTurn === targetUserId && participants) {
        // 削除対象の配列内インデックスを特定
        const targetIndex = participants.findIndex(p => p.user_id === targetUserId);
        let nextPlayerId = null;

        if (targetIndex !== -1 && participants.length > 1) {
            // 次のインデックスのプレイヤーが存在すれば特定（末尾なら最初のプレイヤー [0] に戻る）
            const nextIndex = (targetIndex + 1) < participants.length ? (targetIndex + 1) : 0;
            
            // 選択した次の候補が自分自身（削除対象）でないことを確認してIDを設定
            if (participants[nextIndex].user_id !== targetUserId) {
                nextPlayerId = participants[nextIndex].user_id;
            }
        }

        // 次の手番IDを書き込み（生存プレイヤーがいない場合は null になる）
        await updateCurrentTurn(targetRoomId, nextPlayerId);
    }
}
