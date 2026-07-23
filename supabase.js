// supabase.js

// 3つの分割モジュールから関数およびクライアントをインポート
import { supabase } from './supabase_client.js';
import { 
    insertParticipant, 
    updateParticipantState, 
    checkExistingParticipant, 
    deleteParticipant, 
    subscribeToParticipants 
} from './supabase_participants.js';
import { 
    getCurrentTurn, 
    updateCurrentTurn, 
    updateRoomGameState, 
    clearRoomParticipants, 
    subscribeToRoom 
} from './supabase_game.js';

/**
 * 山札からカードを1枚引く (RPC呼び出し)
 * ※山札枯渇時は data.error_code === 'DECK_EMPTY' が返却される
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
 * ※チート対策のため金額指定引数を廃止。データベース側の自動計算に委ねる
 */
export async function processFinancialTransaction(roomId, userId) {
    const { data, error } = await supabase.rpc('process_financial_transaction', {
        p_room_id: roomId,
        p_user_id: userId
    });

    if (error) {
        console.error("【エラー】財務トランザクション処理に失敗しました:", error);
        throw error;
    }
    
    return data;
}

/**
 * 手番を終了して次のプレイヤーへ移行する (RPC呼び出し)
 * ※Doodad等の強制フェーズにおけるスキップ防止と、カードのGraveyard退避を実行
 */
export async function passAndEndTurn(roomId, userId) {
    const { data, error } = await supabase.rpc('pass_and_end_turn', {
        p_room_id: roomId,
        p_user_id: userId
    });

    if (error) throw error;
    return data;
}

/**
 * 【ホスト用】捨て札をシャッフルして山札を再構築する (RPC呼び出し)
 */
export async function manualReshuffleDeck(roomId, userId, deckType) {
    const { data, error } = await supabase.rpc('manual_reshuffle_deck', {
        p_room_id: roomId,
        p_user_id: userId,
        p_deck_type: deckType
    });

    if (error) throw error;
    return data;
}

/**
 * 不動産資産を購入する (RPC呼び出し)
 */
export async function buyRealEstateAsset(roomId, userId, assetName, cost, downPayment, mortgage, passiveIncome) {
    const { data, error } = await supabase.rpc('buy_real_estate_asset', {
        p_room_id: roomId,
        p_user_id: userId,
        p_asset_name: assetName,
        p_cost: cost,
        p_down_payment: downPayment,
        p_mortgage: mortgage,
        p_passive_income: passiveIncome
    });

    if (error) throw error;
    return data;
}

/**
 * 株式資産を購入する (RPC呼び出し)
 */
export async function buyStockAsset(roomId, userId, stockSymbol, buyPrice, quantity) {
    const { data, error } = await supabase.rpc('buy_stock_asset', {
        p_room_id: roomId,
        p_user_id: userId,
        p_stock_symbol: stockSymbol,
        p_buy_price: buyPrice,
        p_quantity: quantity
    });

    if (error) throw error;
    return data;
}

/**
 * 株式資産を売却する (RPC呼び出し)
 */
export async function sellStockAsset(roomId, userId, stockSymbol, sellPrice, quantity) {
    const { data, error } = await supabase.rpc('sell_stock_asset', {
        p_room_id: roomId,
        p_user_id: userId,
        p_stock_symbol: stockSymbol,
        p_sell_price: sellPrice,
        p_quantity: quantity
    });

    if (error) throw error;
    return data;
}

/**
 * @module supabase
 * @description 各エンドポイントおよびゲームロジック用Supabase操作関数を集約するハブモジュール
 */
export {
    supabase,
    insertParticipant,
    updateParticipantState, 
    checkExistingParticipant,
    deleteParticipant,
    subscribeToParticipants,
    getCurrentTurn,
    updateCurrentTurn,
    updateRoomGameState, 
    clearRoomParticipants,
    subscribeToRoom
};

console.log("【デバッグ】supabase.js: ハブ（統合窓口）モジュールとして正常に読み込まれました。");
