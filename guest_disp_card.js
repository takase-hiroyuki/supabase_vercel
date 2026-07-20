// guest_disp_card.js

import { DOM_SELECTORS } from './selectors.js';

/**
 * 共通の部屋データから、現在引き出されて共有されているカード情報を描画し、
 * 静的に常設されたカードアクションボタンのdisabled状態を制御する関数
 * @param {object} currentCard - rooms.game_state.current_card のデータ
 * @param {string} myUserId - ゲスト自身のユーザーID
 * @param {function} onCardAction - ボタン押下時のイベント仲介（※現在は親で一括登録するためデバッグログ等で利用可能）
 */
export function renderCurrentCard(currentCard, myUserId, onCardAction) {
    const SEL_C = DOM_SELECTORS.GUEST.CARD;
    
    // 静的常設ボタン群の要素を確実に取得
    const btnBuyRealEstate = document.getElementById(SEL_C.BTN_BUY_REALESTATE);
    const btnBuyStock = document.getElementById(SEL_C.BTN_BUY_STOCK);
    const btnSellStock = document.getElementById(SEL_C.BTN_SELL_STOCK);
    const btnPayDoodad = document.getElementById(SEL_C.BTN_PAY_DOODAD);
    const btnPass = document.getElementById(SEL_C.BTN_PASS);

    // 1. 場にカードがない、またはすでに処理完了(completed)状態の場合のUI同期
    if (!currentCard || currentCard.status === "completed") {
        const container = document.getElementById(SEL_C.CONTAINER);
        if (container) {
            // テキスト表示領域のみ初期化し、ボタン群はすべて無効化してそこに残す
            container.querySelector("p").textContent = "現在場に出ているカードはありません。";
        }
        
        // 全ボタンをグレーアウト（押せないけれど、そこに存在する教育的状態）
        if (btnBuyRealEstate) btnBuyRealEstate.disabled = true;
        if (btnBuyStock) btnBuyStock.disabled = true;
        if (btnSellStock) btnSellStock.disabled = true;
        if (btnPayDoodad) btnPayDoodad.disabled = true;
        if (btnPass) btnPass.disabled = true;
        return;
    }

    // 2. カードが存在する場合のテキスト記述の同期
    const container = document.getElementById(SEL_C.CONTAINER);
    if (container) {
        const textElement = container.querySelector("p");
        if (textElement) {
            textElement.textContent = `【${currentCard.title || '無題のカード'}】(種類: ${currentCard.deck_type}) 
            総額: $${currentCard.cost ?? 0} | 頭金: $${currentCard.down_payment ?? 0} | ローン残高: $${currentCard.mortgage ?? 0} | 増加不労所得: +$${currentCard.passive_income ?? 0}`;
        }
    }

    // 3. 自分自身にこのカードに対する選択権・所有権があるかを判定
    const isMyCardTurn = (currentCard.owner_user_id === myUserId);
    const deckType = currentCard.deck_type; // 'small_deal', 'big_deal', 'market', 'doodad' など

    // 4. 教育的 disabled 制御：カードの種類に応じて、選択可能なオプションのみを解放
    if (isMyCardTurn) {
        // 不動産・ビジネスカード (Small/Big Deal の一部)
        if (deckType === 'big_deal' || (deckType === 'small_deal' && (currentCard.passive_income > 0 || currentCard.mortgage > 0))) {
            if (btnBuyRealEstate) btnBuyRealEstate.disabled = false;
            if (btnBuyStock) btnBuyStock.disabled = true;
            if (btnSellStock) btnSellStock.disabled = true;
            if (btnPayDoodad) btnPayDoodad.disabled = true;
        } 
        // 株式・ファンドカード (Small Deal の一部)
        else if (deckType === 'small_deal' && currentCard.passive_income === 0 && currentCard.mortgage === 0) {
            if (btnBuyRealEstate) btnBuyRealEstate.disabled = true;
            if (btnBuyStock) btnBuyStock.disabled = false;
            if (btnSellStock) btnSellStock.disabled = true;
            if (btnPayDoodad) btnPayDoodad.disabled = true;
        } 
        // 市場カード (Market) -> 保有資産の売却フェーズ
        else if (deckType === 'market') {
            if (btnBuyRealEstate) btnBuyRealEstate.disabled = true;
            if (btnBuyStock) btnBuyStock.disabled = true;
            if (btnSellStock) btnSellStock.disabled = false; // 売却権利を活性化
            if (btnPayDoodad) btnPayDoodad.disabled = true;
        } 
        // 無駄遣いカード (Doodad) -> 強制支払い、パス不可
        else if (deckType === 'doodad') {
            if (btnBuyRealEstate) btnBuyRealEstate.disabled = true;
            if (btnBuyStock) btnBuyStock.disabled = true;
            if (btnSellStock) btnSellStock.disabled = true;
            if (btnPayDoodad) btnPayDoodad.disabled = false; // 支払うのみ活性化
        }

        // Doodad（無駄遣い）以外は、自分の意思で「パスする」ことが選べる
        if (btnPass) {
            btnPass.disabled = (deckType === 'doodad');
        }
    } else {
        // 自分の手番・カード権がない場合は、選択肢が「そこにある」ことを見せつつ、すべて一律で無効化
        if (btnBuyRealEstate) btnBuyRealEstate.disabled = true;
        if (btnBuyStock) btnBuyStock.disabled = true;
        if (btnSellStock) btnSellStock.disabled = true;
        if (btnPayDoodad) btnPayDoodad.disabled = true;
        if (btnPass) btnPass.disabled = true;
    }
}
