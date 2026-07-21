// guest_disp_card.js

// ⭕️ 正しいファイル名「dom_selectors.js」からインポート
import { DOM_SELECTORS } from './dom_selectors.js';
import { guestState } from './guest_state.js'; // 🌟 手番判定用にインポート

/**
 * 共通の部屋データから、現在引き出されて共有されているカード情報を描画し、
 * 静的に常設されたカードアクションボタンのdisabled状態を制御する関数
 * @param {object} currentCard - rooms.game_state.current_card のデータ
 * @param {string} myUserId - ゲスト自身のユーザーID
 * @param {function} onCardAction - ボタン押下時のイベント仲介
 */
export function renderCurrentCard(currentCard, myUserId, onCardAction) {
    const SEL_C = DOM_SELECTORS.GUEST.CARD;
    
    // 静的常設ボタン群の要素を確実に取得
    const btnBuyRealEstate = document.getElementById(SEL_C.BTN_BUY_REALESTATE);
    const btnBuyStock = document.getElementById(SEL_C.BTN_BUY_STOCK);
    const btnSellStock = document.getElementById(SEL_C.BTN_SELL_STOCK);
    const btnPayDoodad = document.getElementById(SEL_C.BTN_PAY_DOODAD);
    const btnPass = document.getElementById(SEL_C.BTN_PASS);

    // テキスト・数値表示用の要素を取得
    const elStatusMsg = document.getElementById(SEL_C.STATUS_MESSAGE);
    const elNumContainer = document.getElementById(SEL_C.NUMERICAL_DETAILS_CONTAINER);
    const elCost = document.getElementById(SEL_C.DETAIL_COST);
    const elDownpayment = document.getElementById(SEL_C.DETAIL_DOWNPAYMENT);
    const elCashflow = document.getElementById(SEL_C.DETAIL_CASHFLOW);

    // 1. 場にカードがない、またはすでに処理完了(completed)状態の場合のUI同期
    if (!currentCard || currentCard.status === "completed") {
        if (elStatusMsg) {
            elStatusMsg.textContent = "現在場に出ているカードはありません。";
        }
        if (elNumContainer) {
            elNumContainer.style.display = "none"; // 数値エリアを隠す
        }
        
        // 全ボタンをグレーアウト（押せないけれど、そこに存在する教育的状態）
        if (btnBuyRealEstate) btnBuyRealEstate.disabled = true;
        if (btnBuyStock) btnBuyStock.disabled = true;
        if (btnSellStock) btnSellStock.disabled = true;
        if (btnPayDoodad) btnPayDoodad.disabled = true;
        if (btnPass) btnPass.disabled = true;
        return;
    }

    // 2. カードが存在する場合のテキスト・数値データの同期
    if (elStatusMsg) {
        // 🌟 タイトル、種類、説明文を表示
        elStatusMsg.textContent = `【${currentCard.title || '無題のカード'}】(種類: ${currentCard.type})\n${currentCard.description || ''}`;
    }

    // 🌟 数値データの抽出と表示制御
    // データベースのカードオブジェクト（JSON）に定義されているキーが存在するかチェック
    const hasCost = currentCard.cost !== undefined && currentCard.cost !== null;
    const hasDownpayment = currentCard.down_payment !== undefined && currentCard.down_payment !== null;
    const hasCashflow = currentCard.cash_flow !== undefined && currentCard.cash_flow !== null;

    if (hasCost || hasDownpayment || hasCashflow) {
        // いずれかの数値が存在する場合はエリアを表示
        if (elNumContainer) elNumContainer.style.display = "block";
        
        // 各数値をフォーマットして流し込む（データがない場合は 0 を表示）
        if (elCost) elCost.textContent = hasCost ? currentCard.cost.toLocaleString() : '0';
        if (elDownpayment) elDownpayment.textContent = hasDownpayment ? currentCard.down_payment.toLocaleString() : '0';
        if (elCashflow) elCashflow.textContent = hasCashflow ? currentCard.cash_flow.toLocaleString() : '0';
    } else {
        // 数値データが一切ないカード（例: 一部のMarket等）の場合は非表示
        if (elNumContainer) elNumContainer.style.display = "none";
    }

    // 3. 自分自身にこのカードに対する選択権・所有権があるかを判定
    // 🌟 現在の手番ユーザー ＝ このカードを処理する権利を持つユーザーとして判定
    const isMyCardTurn = guestState.isMyTurn(); 
    const deckType = currentCard.type; // 🌟 'small_deal', 'big_deal', 'market', 'doodad' 

    // 4. 教育的 disabled 制御：カードの種類に応じて、選択可能なオプションのみを解放
    if (isMyCardTurn) {
        // 不動産・ビジネスカード (Small/Big Deal の一部)
        if (deckType === 'big_deal' || deckType === 'small_deal') {
            if (btnBuyRealEstate) btnBuyRealEstate.disabled = false;
            if (btnBuyStock) btnBuyStock.disabled = false; // 株か不動産かは未確定なため両方解放
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
