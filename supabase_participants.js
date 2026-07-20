// supabase_participants.js

import { supabase } from './supabase_client.js';

export async function insertParticipant(roomId, username, userId, initialState) {
    // 💡 呼び出し元から渡されたダミー職業データ(initialState)を無視し、必ず「未定」状態で初期化する
    const pendingState = {
        name: username, // 入力されたプレイヤー名は保持
        profession: "未定", // ホストが開始ボタンを押すまでは未定
        financials: {
            cash: 0,
            cashflow: 0,
            income: { salary: 0, passive: 0, total: 0 },
            expenses: { taxes: 0, mortgage_payment: 0, car_loan_payment: 0, other: 0, total: 0 },
            liabilities: { mortgage: 0, car_loan: 0, retail_debt: 0 },
            assets: { stocks: {}, real_estate: {} }
        },
        position: 0, // 盤面上の位置
        last_dice: 0
    };

    const { data, error } = await supabase
        .from('participants')
        .insert([{ room_id: roomId, user_id: userId, state: pendingState }])
        .select();
    
    if (error) {
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
 * 【排他制御対応】参加者のステート（JSONB）をアトミックに部分更新する関数
 * オブジェクト全体の完全上書きを禁止し、差分のみをデータベース側でマージする。
 * 
 * @param {string} userId - 対象ユーザーのID
 * @param {object} statePatch - 更新したいプロパティのみを格納したオブジェクト（例: { last_dice: 0 }）
 */
export async function updateParticipantState(userId, statePatch) {
    // データベース側に用意するRPC 'merge_participant_state' を呼び出し、
    // 引数として対象ユーザーIDと、差分のパッチオブジェクトを渡す
    const { data, error } = await supabase
        .rpc('merge_participant_state', {
            target_user_id: userId,
            state_patch: statePatch
        });

    if (error) {
        console.error('Supabaseアトミック更新エラー:', error);
        throw error;
    }
    return data;
}

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

export function subscribeToParticipants(targetRoomId, onUpdate) {
    supabase
        .from('participants')
        .select('*')
        .eq('room_id', targetRoomId)
        .order('id', { ascending: true })
        .then(({ data, error }) => {
            if (!error && data) onUpdate(data);
        });

    return supabase
        .channel('public:participants')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'participants' },
            async (payload) => {
                console.log("【デバッグ・Realtime受信】participants変更を検知しました:", payload);

                if (payload.eventType === 'DELETE') {
                    const { data: currentParticipants } = await supabase
                        .from('participants')
                        .select('id')
                        .eq('room_id', targetRoomId);

                    if (currentParticipants && currentParticipants.length === 0) {
                        console.warn("【システム】データベースリセットを検知しました。ローカルデータを破棄します。");
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                        return;
                    }
                }

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
