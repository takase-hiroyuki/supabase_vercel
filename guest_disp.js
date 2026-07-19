// guest_disp.js

// 5つのゲスト用表示サブモジュールをインポート
import { renderGameBoard } from './guest_disp_board.js';
import { renderFinancials } from './guest_disp_financials.js';
import { renderPortfolio } from './guest_disp_portfolio.js';
import { renderCurrentCard } from './guest_disp_card.js';
import { updateGameControls } from './guest_disp_controls.js';

// 【追加】DOMセレクター一括管理ファイルのインポート
import { DOM_SELECTORS } from './dom_selectors.js';

/**
 * 【ゲストUIハブ】
 * リアルタイム同期で受け取った全てのデータ分配と状態遷移を制御する
 * @param {Array} participants - 最新の全参加者リスト
 * @param {string|null} currentTurnUserId - 現在の手番ユーザーID
 * @param {string} myUserId - 操作しているゲスト自身のID
 * @param {string|null} currentViewTargetId - 財務諸表の閲覧対象ユーザーID
 * @param {boolean} isFinancialsLocked - 計算検証のロック状態フラグ
 * @param {object|null} currentRoomCard - roomsから取得した現在の共通カード情報
 * @param {object} callbacks - 各コンポーネント用のアクションイベント群
 */
export function refreshGuestUI(
    participants, 
    currentTurnUserId, 
    myUserId, 
    currentViewTargetId, 
    isFinancialsLocked, 
    currentRoomCard,
    callbacks
) {
    // 1. 盤面表示の更新
    renderGameBoard(participants);

    // 2. 手番ユーザー名の特定
    const turnUser = participants.find(p => p.user_id === currentTurnUserId);
    const turnUserName = turnUser ? turnUser.state.name : null;

    // 3. 操作ボタン類の活性・非活性および手番インジケータ制御
    updateGameControls(
        currentTurnUserId, 
        myUserId, 
        turnUserName, 
        isFinancialsLocked, 
        callbacks.onRollDice
    );

    // ==========================================
    // 【加筆】「あなたのステータス」欄（キャッシュ ＆ 職業名）のリアルタイム同期
    // ==========================================
    const myData = participants.find(p => p.user_id === myUserId);
    if (myData && myData.state) {
        // ① 手持ちキャッシュの同期
        const elHandCash = document.getElementById(DOM_SELECTORS.GUEST.STATUS.DISPLAY_CURRENT_CASH);
        if (elHandCash) {
            const currentCash = myData.state.financials?.cash ?? 0;
            elHandCash.textContent = currentCash.toLocaleString();
        }

        // ② 🌟割り当てられた職業名の同期を追加
        const elProfession = document.getElementById(DOM_SELECTORS.GUEST.STATUS.PROFESSION);
        if (elProfession) {
            elProfession.textContent = myData.state.profession || '一般';
        }
    }
    // ==========================================

    // 4. 表示対象プレイヤーの決定と財務表示の振り分け
    const targetId = currentViewTargetId || myUserId;
    const targetUser = participants.find(p => p.user_id === targetId);

    if (targetUser && targetUser.state) {
        const isReadOnly = (targetId !== myUserId);
        
        // 財務数値のレンダリング
        renderFinancials(
            targetUser.state, 
            isReadOnly, 
            callbacks.onVerifySuccess, 
            callbacks.onVerifyFailure
        );

        // 資産ポートフォリオのレンダリング
        renderPortfolio(targetUser.state.financials);
    }

    // 5. 取引カード情報のレンダリング
    renderCurrentCard(currentRoomCard, myUserId, callbacks.onCardAction);
}
