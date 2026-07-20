// guest_disp.js

// 5つのゲスト用表示サブモジュールをインポート
import { renderGameBoard } from './guest_disp_board.js';
import { renderFinancials } from './guest_disp_financials.js';
import { renderPortfolio } from './guest_disp_portfolio.js';
import { renderCurrentCard } from './guest_disp_card.js';
import { updateGameControls } from './guest_disp_controls.js';

// ⭕️ 正しいファイル名「dom_selectors.js」からインポート
import { DOM_SELECTORS } from './dom_selectors.js';

// 🌟 保留中の給料（pendingSalary）を取得するために状態管理モジュールをインポート
import { guestState } from './guest_state.js';

/**
 * 【ゲストUIハブ】
 * リアルタイム同期で受け取った全てのデータ分配と状態遷移を制御する
 * @param {Array} participants - 最新の全参加者リスト
 * @param {string|null} currentTurnUserId - 現在の手番ユーザーID
 * @param {string} myUserId - 操作しているゲスト自身のID
 * @param {boolean} isFinancialsLocked - 計算検証のロック状態フラグ
 * @param {object|null} currentRoomCard - roomsから取得した現在の共通カード情報
 * @param {object} callbacks - 各コンポーネント用のアクションイベント群
 */
export function refreshGuestUI(
    participants, 
    currentTurnUserId, 
    myUserId, 
    isFinancialsLocked, 
    currentRoomCard,
    callbacks
) {
    // 1. 盤面表示の更新
    renderGameBoard(participants);

    // 2. 手番ユーザー名の特定
    const turnUser = participants.find(p => p.user_id === currentTurnUserId);
    const turnUserName = turnUser ? turnUser.state.name : null;

    // 自身のstateを取得
    const myData = participants.find(p => p.user_id === myUserId);
    const myState = myData ? myData.state : null;
    const isMyTurn = (currentTurnUserId === myUserId);

    // 🌟 現在クライアント側にキープされている未請求の給料額を取得
    const pendingSalary = guestState.getPendingSalary() ?? 0;

    // 3. 操作ボタン類の活性・非活性および手番インジケータ制御
    // ⭕️ 引数に「pendingSalary」を追加してコントロール側へ分配
    updateGameControls(
        currentTurnUserId, 
        myUserId, 
        turnUserName, 
        isFinancialsLocked, 
        myState,
        pendingSalary,
        callbacks.onRollDice
    );

    // ==========================================
    // 「あなたのステータス」および新設常設ボタンのリアルタイム同期・活性制御
    // ==========================================
    if (myData && myData.state) {
        // ① 手持ちキャッシュの同期
        const elHandCash = document.getElementById(DOM_SELECTORS.GUEST.STATUS.DISPLAY_CURRENT_CASH);
        if (elHandCash) {
            const currentCash = myData.state.financials?.cash ?? 0;
            elHandCash.textContent = currentCash.toLocaleString();
        }

        // ② 割り当てられた職業名の同期
        const elProfession = document.getElementById(DOM_SELECTORS.GUEST.STATUS.PROFESSION);
        if (elProfession) {
            elProfession.textContent = myData.state.profession || '一般';
        }

        // ③ 銀行ローン残高および利息支出の同期
        const elBankLoan = document.getElementById(DOM_SELECTORS.GUEST.PORTFOLIO.DISPLAY_LIABILITY_BANKLOAN);
        if (elBankLoan) {
            const bankLoanVal = myData.state.financials?.liabilities?.bank_loan ?? 0;
            elBankLoan.textContent = bankLoanVal.toLocaleString();
        }

        const elLoanInterest = document.getElementById(DOM_SELECTORS.GUEST.PORTFOLIO.DISPLAY_EXPENSE_LOANINTEREST);
        if (elLoanInterest) {
            const loanInterestVal = myData.state.financials?.expenses?.bank_loan_interest ?? 0;
            elLoanInterest.textContent = loanInterestVal.toLocaleString();
        }

        // ④ 銀行ローン操作ボタンの活性制御（自分の手番かつ計算ロック中でない場合のみ有効）
        const btnBorrow = document.getElementById(DOM_SELECTORS.GUEST.PORTFOLIO.BTN_BORROW_LOAN);
        const btnPayback = document.getElementById(DOM_SELECTORS.GUEST.PORTFOLIO.BTN_PAYBACK_LOAN);
        const canOperateLoan = isMyTurn && !isFinancialsLocked;
        
        if (btnBorrow) {
            btnBorrow.disabled = !canOperateLoan;
        }
        if (btnPayback) {
            const currentBankLoan = myData.state.financials?.liabilities?.bank_loan ?? 0;
            // 返済は手番中かつロックなし、かつ残高が $1,000 以上ある場合のみ有効
            btnPayback.disabled = !(canOperateLoan && currentBankLoan >= 1000);
        }

        // ⑤ ラットレース脱出申請ボタンの活性制御
        const btnEscape = document.getElementById(DOM_SELECTORS.GUEST.CONTROLS.BTN_ESCAPE_RAT_RACE);
        if (btnEscape) {
            const passiveIncome = myData.state.financials?.passive_income ?? 0;
            const totalExpenses = myData.state.financials?.total_expenses ?? 0;
            // 不労所得が総支出を上回っており、自分の手番かつロックなしの場合に有効
            const canEscape = isMyTurn && !isFinancialsLocked && (passiveIncome > totalExpenses);
            btnEscape.disabled = !canEscape;
        }
    }
    // ==========================================

    // 4. 閲覧対象プレイヤー（自分自身）の財務諸表の更新
    if (myData && myData.state) {
        const isReadOnly = false; // 参加者本人の画面のため編集可能
        
        // 財務数値のレンダリング
        renderFinancials(
            myData.state, 
            isReadOnly, 
            callbacks.onVerifySuccess, 
            callbacks.onVerifyFailure
        );

        // 資産ポートフォリオのレンダリング
        renderPortfolio(myData.state.financials);
    }

    // 5. 取引カード情報のレンダリング
    renderCurrentCard(currentRoomCard, myUserId, callbacks.onCardAction);
}
