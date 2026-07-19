// supabase_participants.js

import { supabase } from './supabase_client.js';

export async function insertParticipant(roomId, username, userId, initialState) {
    const { data, error } = await supabase
        .from('participants')
        .insert([{ room_id: roomId, user_id: userId, state: initialState }])
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

                // 【追加】リセットシグナル（DELETEイベント）の検知とゾンビデータ破棄
                if (payload.eventType === 'DELETE') {
                    const { data: currentParticipants } = await supabase
                        .from('participants')
                        .select('id')
                        .eq('room_id', targetRoomId);

                    // 部屋の参加者が0人になった場合、リセットとみなしてローカルデータを破棄
                    if (currentParticipants && currentParticipants.length === 0) {
                        console.warn("【システム】データベースリセットを検知しました。ローカルデータを破棄します。");
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload(); // または window.location.href = '/' 等、初期化用URLへ遷移
                        return; // 以降の描画処理を停止
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
