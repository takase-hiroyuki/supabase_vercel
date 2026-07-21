// guest_disp.js

// 5つのゲスト用表示サブモジュールをインポート
import { renderGameBoard } from './guest_disp_board.js';
import { renderFinancials } from './guest_disp_financials.js';
import { renderPortfolio } from './guest_disp_portfolio.js';
import { renderCurrentCard } from './guest_disp_card.js';
import { updateGameControls } from './guest_disp_controls.js';

// ⭕️ 正しいファイル名「dom_selectors.js」からインポート
import { DOM_SELECTORS } from './dom_selectors.js';

// 🌟 保留中の給料（pendingSalary）および最新のデータを取得するために状態管理モジュールをインポート
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

    // 🌟【修正：$0問題対策】引数のリストから見つからない、またはデータが空の場合、状態管理側から直接最新データを引っ張る
    let myData = participants.find(p => p.user_id === myUserId);
    if (!myData || !myData.state || !myData.state.financials) {
        myData = guestState.getMyData();
    }
    
    const myState = myData ? myData.state : null;
    const isMyTurn = (currentTurnUserId === myUserId);

    // 🌟 現在クライアント側にキープされている未請求の給料額を取得
    const pendingSalary = guestState.getPendingSalary() ?? 0;

    // 3. 操作ボタン類の活性・非活性および手番インジケータ制御
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

        // 🌟 ⑥ 修正: 各マスでのカードドローボタンの活性制御
        const btnDrawSmall = document.getElementById(DOM_SELECTORS.GUEST.CARD.BTN_DRAW_SMALL_DEAL);
        const btnDrawBig = document.getElementById(DOM_SELECTORS.GUEST.CARD.BTN_DRAW_BIG_DEAL);
        const btnDrawMarket = document.getElementById(DOM_SELECTORS.GUEST.CARD.BTN_DRAW_MARKET);
        const btnDrawDoodad = document.getElementById(DOM_SELECTORS.GUEST.CARD.BTN_DRAW_DOODAD);
        
        if (btnDrawSmall && btnDrawBig && btnDrawMarket && btnDrawDoodad) {
            const currentPosition = myData.state.position ?? 0;
            const lastDice = myData.state.last_dice ?? 0;
            
            // 各マスの定義
            const OPPORTUNITY_CELLS = [2, 4, 6, 8, 10, 13, 15, 17, 19, 21, 23];
            const MARKET_CELLS = [12, 22];
            const DOODAD_CELLS = [1, 7, 14];
            
            // 現在地がいずれのマスに該当するか判定
            const isOpportunityCell = OPPORTUNITY_CELLS.includes(currentPosition);
            const isMarketCell = MARKET_CELLS.includes(currentPosition);
            const isDoodadCell = DOODAD_CELLS.includes(currentPosition);
            
            // ドローアクションが可能な共通条件：自分の手番 && サイコロを振った後 && 未請求給料なし && まだ場にカードが出ていない
            const canActCard = isMyTurn && lastDice > 0 && pendingSalary === 0 && (!currentRoomCard || currentRoomCard.status === 'completed');

            // 条件を満たすマスにいる場合のみ、該当するボタンを有効化する
            btnDrawSmall.disabled = !(canActCard && isOpportunityCell);
            btnDrawBig.disabled = !(canActCard && isOpportunityCell);
            btnDrawMarket.disabled = !(canActCard && isMarketCell);
            btnDrawDoodad.disabled = !(canActCard && isDoodadCell);
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
        if (myData.state.financials) {
            renderPortfolio(myData.state.financials);
        }
    }

    // 5. 取引カード情報のレンダリング
    renderCurrentCard(currentRoomCard, myUserId, callbacks.onCardAction);
}
