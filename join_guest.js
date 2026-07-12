// join_guest.js
import { roomId } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';
import { insertParticipant, getCurrentTurn, updateCurrentTurn, checkExistingParticipant } from './supabase.js';

/**
 * 【自動ログイン・再入室チェック】
 * リロード時にブラウザのlocalStorageからIDを読み込み、すでにSupabaseに登録されているか確認する
 * @returns {Promise<object|null>} 登録済みの場合はそのプレイヤーデータ、未登録の場合はnull
 */
export async function autoLoginCheck() {
    const userId = getFromStorage('user_id');
    if (!userId) return null; // ID自体が記憶されていなければ未入室

    try {
        // Supabaseに直接問い合わせて、自分がすでに部屋にいるか調べる
        const existingData = await checkExistingParticipant(roomId, userId);
        return existingData; // 存在すればデータオブジェクト、いなければnullが返る
    } catch (error) {
        console.error("【自動ログイン】チェック中にエラーが発生しました:", error);
        return null;
    }
}

/**
 * 【新規入室処理】
 * 入室ボタンが押されたときに、新しくIDを発行してSupabaseに登録する
 * @param {string} username - 入力されたプレイヤー名
 * @returns {Promise<string>} 確定したユーザーID
 */
export async function executeJoin(username) {
    // 既存のIDがあれば使い、無ければ新しくランダム生成
    let userId = getFromStorage('user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 11);
        saveToStorage('user_id', userId);
    }
    
    saveToStorage('player_name', username);
    
    // データベース（Supabase）に新規登録を実行
    await insertParticipant(roomId, username, userId);
    
    // 現在の部屋の手番を確認し、空であれば最初の入室者を自動で手番に設定する
    const currentTurn = await getCurrentTurn(roomId);
    if (!currentTurn) {
        await updateCurrentTurn(roomId, userId);
        console.log("【デバッグ】最初の入室者のため、手番に設定しました:", userId);
    }
    
    return userId;
}
