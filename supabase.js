// supabase.js

// 3つの分割モジュールから関数およびクライアントをインポート
import { supabase } from './supabase_client.js';
import { 
    insertParticipant, 
    updateParticipantState, // 引数が仕様変更（第2引数は差分オブジェクトを受け取る）
    checkExistingParticipant, 
    deleteParticipant, 
    subscribeToParticipants 
} from './supabase_participants.js';
import { 
    getCurrentTurn, 
    updateCurrentTurn, 
    updateRoomGameState, // ⭕️ 共通カード状態パッチ用関数をインポート
    clearRoomParticipants, 
    subscribeToRoom 
} from './supabase_game.js';

/**
 * 山札からカードを1枚引く (RPC呼び出し)
 * @param {string} roomId - 部屋ID
 * @param {string} userId - プレイヤーのユーザーID
 * @param {string} deckType - デッキの種類 ('small_deal', 'big_deal', 'market', 'doodad')
 * @returns {Promise<object>} データベースからの処理結果（カード情報など）
 */
export async function drawCard(roomId, userId, deckType) {
    const { data, error } = await supabase.rpc('draw_card_from_deck', {
        p_room_id: roomId,
        p_user_id: userId,
        p_deck_type: deckType
    });

    if (error) {
        console.error("【エラー】カードのドローに失敗しました:", error);
        throw error;
    }
    
    return data;
}

/**
 * 財務データのトランザクション処理およびカード状態の更新 (RPC呼び出し)
 * @param {string} roomId - 部屋ID
 * @param {string} userId - プレイヤーのユーザーID
 * @param {number} cashDelta - キャッシュの増減額（マイナスなら支出）
 * @param {number} passiveIncomeDelta - 不労所得の増減額
 * @param {boolean} unlockCalc - 処理後に計算ロックを解除するかどうか
 */
export async function processFinancialTransaction(roomId, userId, cashDelta, passiveIncomeDelta, unlockCalc) {
    const { data, error } = await supabase.rpc('process_financial_transaction', {
        p_user_id: userId,
        p_room_id: roomId,
        p_cash_delta: cashDelta,
        p_passive_income_delta: passiveIncomeDelta,
        p_unlock_calc: unlockCalc
    });

    if (error) {
        console.error("【エラー】財務トランザクション処理に失敗しました:", error);
        throw error;
    }
    
    return data;
}

/**
 * @module supabase
 * @description 各エンドポイントおよびゲームロジック用Supabase操作関数を集約するハブモジュール
 * 
 * 💡 注意 (データアクセス方針 5.2):
 * updateParticipantState(userId, statePatch) は、オブジェクト全体の完全上書きを禁止しています。
 * プレイヤー情報の更新時には、変更したいプロパティ（例: { last_dice: 3 }）のみを渡してください。
 */
export {
    supabase,
    insertParticipant,
    updateParticipantState, // 差分アトミック更新版
    checkExistingParticipant,
    deleteParticipant,
    subscribeToParticipants,
    getCurrentTurn,
    updateCurrentTurn,
    updateRoomGameState, // ⭕️ 外部アクションモジュールから使えるようにエクスポート
    clearRoomParticipants,
    subscribeToRoom
};

console.log("【デバッグ】supabase.js: ハブ（統合窓口）モジュールとして正常に読み込まれました。");
