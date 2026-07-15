// supabase_participants.js

// 接続クライアントを正確な名前でインポート
import { supabase } from './supabase_client.js';

/**
 * 参加者データをSupabaseのテーブルに送信（挿入）する関数
 * @param {string} roomId - 部屋ID
 * @param {string} username - プレイヤー名
 * @param {string} userId - プレイヤーの固有ID
 */
export async function insertParticipant(roomId, username, userId) {
    // キャッシュフローゲーム用初期stateオブジェクト
    const playerState = {
        name: username,
        role: "一般",
        last_dice: 0,
        track: "rat_race", // "rat_race" (ラットレース) または "fast_track" (ファーストトラック)
        position: 0,       // 0〜23（各トラック24マス）
        profession: "弁護士", // 職業名
        financials: {
            // 簡易損益計算書 (Income Statement)
            income: { salary: 7500, passive: 0, total: 7500 },
            expenses: { taxes: 1800, mortgage_payment: 1100, car_loan_payment: 220, other: 1500, total: 4620 },
            cashflow: 2880, // 手取りキャッシュフロー (総収入 - 総支出)
            cash: 2880,     // 手元資金
            // 簡易貸借対照表 (Balance Sheet)
            assets: { stocks: {}, real_estate: {} },
            liabilities: { mortgage: 115000, car_loan: 11000, retail_debt: 1000 }
        }
    };

    // participants テーブルにデータを1行追加
    const { data, error } = await supabase
        .from('participants')
        .insert([
            { 
                room_id: roomId, 
                user_id: userId, 
                state: playerState 
            }
        ])
        .select();
    
    if (error) {
        // 重複入室時の一意制約違反（PostgreSQL エラーコード: 23505）を検知
        if (error.code === '23505') {
            console.warn('【警告】同一IDによる重複入室を防御しました（一意制約違反を検知）:', userId);
        } else {
            console.error('Supabase送信エラー:', error);
        }
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
    const { data, error } = await supabase
        .from('participants')
        .update({ state: newState })
        .eq('user_id', userId)
        .select();

    if (error) {
        console.error('Supabase更新エラー:', error);
        throw error;
    }
    
    return data;
}

/**
 * 指定したプレイヤーがすでに部屋に登録されているか確認する関数
 * @param {string} targetRoomId - 部屋ID
 * @param {string} targetUserId - プレイヤー固有ID
 * @returns {object|null} 登録されている場合はその行のデータ、ない場合はnull
 */
export async function checkExistingParticipant(targetRoomId, targetUserId) {
    const { data, error } = await supabase
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
 * 特定の参加者を削除（退室処理）する関数
 * @param {string} targetRoomId - 部屋ID
 * @param {string} targetUserId - 削除対象のユーザーID
 */
export async function deleteParticipant(targetRoomId, targetUserId) {
    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('room_id', targetRoomId)
        .eq('user_id', targetUserId);

    if (error) {
        console.error('参加者削除エラー:', error);
        throw error;
    }
}

/**
 * リアルタイムで参加者リストの変更を監視し、描画関数を実行する関数
 * @param {string} targetRoomId - 監視する部屋ID
 * @param {function} onUpdate - データ更新時に実行する描画関数
 */
export function subscribeToParticipants(targetRoomId, onUpdate) {
    // 最初の一回、現在テーブルにあるデータを自動連番（id）順に取得して描画に渡す
    supabase
        .from('participants')
        .select('*')
        .eq('room_id', targetRoomId)
        .order('id', { ascending: true })
        .then(({ data, error }) => {
            if (!error && data) onUpdate(data);
        });

    // リアルタイム通信を開始して、データの追加や更新を監視する
    return supabase
        .channel('public:participants')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'participants' },
            async (payload) => {
                console.log("【デバッグ・Realtime受信】participants変更を検知しました:", payload);
                // 変更があったので最新のリストを自動連番（id）順で再取得して描画関数に渡す
                const { data } = await supabase
                    .from('participants')
                    .select('*')
                    .eq('room_id', targetRoomId)
                    .order('id', { ascending: true });
                if (data) onUpdate(data);
            }
        )
        .subscribe();
}
