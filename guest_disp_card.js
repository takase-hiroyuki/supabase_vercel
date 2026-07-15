// guest_disp_card.js

/**
 * 共通の部屋データから、現在引き出されて共有されているカード情報を描画する関数
 * @param {object} currentCard - rooms.game_state.current_card のデータ
 * @param {string} myUserId - ゲスト自身のユーザーID
 * @param {function} onCardAction - ボタン押下時のDB操作を媒介するコールバック
 */
export function renderCurrentCard(currentCard, myUserId, onCardAction) {
    const container = document.getElementById("card-display-container");
    if (!container) return;

    if (!currentCard || currentCard.status === "completed") {
        container.innerHTML = "<fieldset><legend>ドローカード状況</legend><p>現在場に出ているカードはありません。</p></fieldset>";
        return;
    }

    let actionButtonsHtml = "";

    // 仮の所有権（交渉権）を持っているプレイヤーが自分自身であるか検証
    if (currentCard.owner_user_id === myUserId) {
        actionButtonsHtml = `
            <button type="button" id="btn-card-buy-bank">銀行から購入（実行）する</button>
            <button type="button" id="btn-card-sell-negotiate">他人に権利を売却する</button>
            <button type="button" id="btn-card-pass">パス（破棄）する</button>
        `;
    } else {
        actionButtonsHtml = `
            <p>※現在、所有権を持つプレイヤーの交渉・選択待ち状態です。</p>
            <button type="button" id="btn-card-buy-approve">購入を承認する（売却合意時）</button>
        `;
    }

    container.innerHTML = `
        <fieldset>
            <legend>引き出されたカード [種類: ${currentCard.deck_type}]</legend>
            <h4>【${currentCard.title}】</h4>
            <p>総額: $${currentCard.cost} | 頭金: $${currentCard.down_payment} | ローン残高: $${currentCard.mortgage} | 増加不労所得: +$${currentCard.passive_income}</p>
            <hr>
            <div>${actionButtonsHtml}</div>
        </fieldset>
    `;

    // 各アクションボタンのイベント登録
    const btnBuyBank = document.getElementById("btn-card-buy-bank");
    if (btnBuyBank) btnBuyBank.addEventListener("click", () => onCardAction("buy_bank"));

    const btnSellNeg = document.getElementById("btn-card-sell-negotiate");
    if (btnSellNeg) btnSellNeg.addEventListener("click", () => onCardAction("sell_negotiate"));

    const btnPass = document.getElementById("btn-card-pass");
    if (btnPass) btnPass.addEventListener("click", () => onCardAction("pass"));

    const btnApprove = document.getElementById("btn-card-buy-approve");
    if (btnApprove) btnApprove.addEventListener("click", () => onCardAction("approve_purchase"));
}
