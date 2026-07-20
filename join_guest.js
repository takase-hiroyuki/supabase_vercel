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
        return existingData; // 存在すればデータオブジェクト、存在しない場合はnullが返る
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

    // データベース側で強制的に「未定」の完全な初期データに上書きされるため、
    // ここでは最低限のメタデータ（名前、ロール、トラッキング状態など）のみを渡す
    const initialState = {
        name: username,
        role: "general",                    // 🌟要件定義書に基づき、日本語からシステム識別子 "general" へ統一
        track: "rat_race",
        position: 0,
        last_dice: 0,
        is_calculating: false,              // 🌟初期ゲームロックを完全に回避するため、入室時は作業可能（false）にする
        calculation_phase: null             // 🌟ゲーム開始直後は筆算フェーズではないため null に初期化
    };
    
    try {
        // データベース（Supabase）に新規登録を実行
        // 実際の職業データやキャッシュなどの初期化は supabase_participants.js の内部で行われる
        await insertParticipant(roomId, username, userId, initialState);
    } catch (error) {
        // 重複入室時の一意制約違反（エラーコード: 23505）の場合は、
        // すでに登録は完了しているため、エラーを投げずにそのまま正常系としてフォールバック処理へ進む
        if (error.code === '23505') {
            console.log("【デバッグ】一意制約違反を検知したため、安全にゲーム画面へフォールバックします:", userId);
        } else {
            // それ以外の想定外のエラーは上位へそのままスローしてクラッシュを防ぐ
            throw error;
        }
    }
    
    // 💡 注意: 手番の自動設定は削除しています。
    // 手番は「ホストがゲーム開始ボタンを押した際のSQL(RPC)」でランダムに決定されるため、
    // ここで最初に入室した人を固定で手番にしてしまう処理は競合の原因になるため省きました。
    
    return userId;
}
