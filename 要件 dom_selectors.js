/**
 * My Game - DOMセレクター定数定義ファイル
 * host.html および index.html (guest) 内のすべての静的HTML要素のIDを一括管理します。
 */

export const DOM_SELECTORS = {
    // =========================================================================
    // 1. ゲスト画面 (index.html) 用のID定義
    // =========================================================================
    GUEST: {
        // ブラウザの記憶状態エリア
        DEBUG: {
            STORAGE_ID: 'debug-storage-id',
            STORAGE_NAME: 'debug-storage-name'
        },

        // プレイヤー登録（ログイン）エリア
        LOGIN: {
            SECTION: 'section-login',
            INPUT_USERNAME: 'input-username',
            BTN_LOGIN: 'btn-login'
        },

        // あなたのステータス表示エリア
        STATUS: {
            SECTION: 'section-guest',
            ROOM_ID: 'guest-room-id',
            NAME: 'guest-name',
            DISPLAY_CURRENT_CASH: 'display-current-cash', // ★ $0 問題のターゲットID
            ROLE: 'guest-role'
        },

        // 手番・サイコロ制御エリア
        CONTROLS: {
            STATUS_AREA: 'dice-status-area',
            DICE_RESULT: 'guest-dice-result',
            BTN_ROLL_DICE: 'btn-roll-dice',
            // --- 公式準拠：Paycheck手動請求用のIDを追加 ---
            BTN_CLAIM_PAYCHECK: 'btn-claim-paycheck', // Paycheckを請求するボタン
            BTN_END_TURN: 'btn-end-turn'              // 手番を終了するボタン
        },

        // カードドロー・取引エリア
        CARD: {
            CONTAINER: 'card-display-container'
        },

        // 財務諸表（PL/BS）手動計算エリア
        FINANCIALS: {
            CONTAINER: 'financials-container',
            CALC_PHASE_NAME: 'calc-phase-name',
            CALC_LOCK_STATUS: 'calc-lock-status',
            DISPLAY_SALARY: 'display-salary',
            DISPLAY_PASSIVE_INCOME: 'display-passive-income',
            INPUT_TOTAL_INCOME: 'input-total-income',
            DISPLAY_TOTAL_EXPENSES: 'display-total-expenses',
            INPUT_NET_CASHFLOW: 'input-net-cashflow',
            BTN_CHECK_CALCULATIONS: 'btn-check-calculations'
        },

        // 資産・負債状況エリア (ポートフォリオ)
        PORTFOLIO: {
            CONTAINER: 'portfolio-container',
            STOCKS: 'display-portfolio-stocks',
            REAL_ESTATE: 'display-portfolio-realestate',
            LIABILITY_MORTGAGE: 'display-liability-mortgage',
            LIABILITY_CAR_LOAN: 'display-liability-carloan',
            LIABILITY_RETAIL: 'display-liability-retail'
        },

        // ゲスト用すごろく盤面モニターID生成用のプレフィックス
        BOARD: {
            RAT_PREFIX: 'rat-cell-', // 動的に 'rat-cell-0'〜'rat-cell-23' を取得する用
            FAST_PREFIX: 'fast-cell-' // 動的に 'fast-cell-0'〜'fast-cell-23' を取得する用
        }
    },

    // =========================================================================
    // 2. ホスト画面 (host.html) 用のID定義
    // =========================================================================
    HOST: {
        SECTION: 'section-host',
        
        // サイコロ監視エリア
        DICE_MONITOR: 'host-dice-monitor',

        // 手番プレイヤー手動制御エリア
        TURN_CONTROL: {
            INPUT_NEXT_ORDER: 'input-next-turn-order',
            BTN_SET_TURN: 'btn-set-turn'
        },

        // 退室管理エリア
        KICK_CONTROL: {
            INPUT_KICK_ORDER: 'input-kick-order',
            BTN_KICK_PARTICIPANT: 'btn-kick-participant',
            BTN_CLEAR_ROOM: 'btn-clear-room'
        },

        // 参加者名簿テーブル
        PARTICIPANT_LIST: 'host-participant-list',

        // ホスト用盤面モニターID生成用のプレフィックス
        BOARD: {
            CELL_PREFIX: 'cell-' // 動的に 'cell-0'〜'cell-23' を取得する用
        }
    }
};
