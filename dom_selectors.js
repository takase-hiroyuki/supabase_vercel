// dom_selectors.js

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
            ROLE: 'guest-role',
            PROFESSION: 'guest-profession' // 🌟ゲスト画面に職業名（教師・パイロット等）を表示する用
        },

        // 手番・サイコロ制御エリア
        CONTROLS: {
            STATUS_AREA: 'dice-status-area',
            DICE_RESULT: 'guest-dice-result',
            BTN_ROLL_DICE: 'btn-roll-dice',
            // --- 公式準拠：手動アクション・脱出申請ボタン ---
            BTN_CLAIM_PAYCHECK: 'btn-claim-paycheck', // Paycheckを請求するボタン
            BTN_END_TURN: 'btn-end-turn',              // 手番を終了するボタン
            BTN_ESCAPE_RAT_RACE: 'btn-escape-rat-race' // 🌟 タイポを修正：ラットレース脱出を申請するボタン
        },

        // カードドロー・取引エリア
        CARD: {
            CONTAINER: 'card-display-container',
            DRAW_OPTIONS_CONTAINER: 'deck-draw-options',   // 🌟 追加: 山札選択用フィールドID
            BTN_DRAW_SMALL_DEAL: 'btn-draw-small-deal',    // 🌟 追加: Small Dealドローボタン
            BTN_DRAW_BIG_DEAL: 'btn-draw-big-deal',        // 🌟 追加: Big Dealドローボタン
            OPTIONS_CONTAINER: 'card-action-options',   // 🌟 カードアクション選択肢の親フィールドID
            BTN_BUY_REALESTATE: 'btn-card-buy-realestate', // 🌟 不動産/ビジネス購入ボタン
            BTN_BUY_STOCK: 'btn-card-buy-stock',           // 🌟 株式/ファンド購入ボタン
            BTN_SELL_STOCK: 'btn-card-sell-stock',         // 🌟 株式市場売却ボタン
            BTN_PAY_DOODAD: 'btn-card-pay-doodad',         // 🌟 無駄遣い費用支払ボタン
            BTN_PASS: 'btn-card-pass'                      // 🌟 カードアクションパスボタン
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
            LIABILITY_RETAIL: 'display-liability-retail',
            // --- 🌟 手動借入銀行ローン用コントロール＆表示項目 ---
            LOAN_CONTROL_CONTAINER: 'bank-loan-control',  // 🌟 銀行ローン操作パネルID
            BTN_BORROW_LOAN: 'btn-borrow-loan',            // 🌟 銀行ローンを借り入れるボタン
            BTN_PAYBACK_LOAN: 'btn-payback-loan',          // 🌟 銀行ローンを返済するボタン
            DISPLAY_LIABILITY_BANKLOAN: 'display-liability-bankloan',   // 🌟 銀行ローン残高表示用
            DISPLAY_EXPENSE_LOANINTEREST: 'display-expense-loaninterest' // 🌟 ローン利息支出表示用
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
        
        // 🌟部屋ステータス管理・ライフサイクル制御エリア
        LIFECYCLE: {
            DISPLAY_ROOM_STATUS: 'host-room-status',              // 現在の部屋ステータス表示用
            BTN_INITIAL_SHUFFLE: 'btn-initial-shuffle-start',     // 初期シャッフル＆ゲーム開始ボタン
            BTN_MANUAL_RESHUFFLE: 'btn-manual-reshuffle',          // 山札再シャッフルボタン
            BTN_FORCE_GAME_END: 'btn-force-game-end',              // 全員強制退室＆ゲーム終了ボタン
            BTN_INITIALIZE_ROOM: 'btn-initialize-room'            // 部屋を初期化するボタン
        },

        // 🌟4種類の山札および使用済みカードの残り枚数監視モニター
        DECK_MONITOR: {
            SMALL_DEAL_COUNT: 'deck-count-small-deal',
            BIG_DEAL_COUNT: 'deck-count-big-deal',
            MARKET_COUNT: 'deck-count-market', // 🌟 MARK_COUNT から MARKET_COUNT に修正
            DOODAD_COUNT: 'deck-count-doodad'
        },

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
        
        // 名簿の各行（DOM行生成時やセレクター特定用）で利用するクラス・属性の識別子
        PARTICIPANT_ITEM: {
            ROW_CLASS: 'host-participant-row',
            PROFESSION_CLASS: 'host-participant-profession' 
        },

        // ホスト用盤面モニターID生成用のプレフィックス
        BOARD: {
            CELL_PREFIX: 'cell-' // 動的に 'cell-0'〜'cell-23' を取得する用
        }
    }
};
