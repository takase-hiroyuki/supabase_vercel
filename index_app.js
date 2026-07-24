// index_app.js My Game - ゲスト画面 司令塔プログラム

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToRoom, subscribeToParticipants, updateParticipantState } from './supabase.js';
import { autoLoginCheck, executeJoin } from './join_guest.js';
import { refreshGuestUI } from './guest_disp.js';
import { DOM_SELECTORS } from './dom_selectors.js';
import { guestState } from './guest_state.js';

// 追加アクションハンドラー（脱出申請、カード、ローン）をインポート
import { 
    handleRollDice, 
    handleClaimPaycheck, 
    handleEndTurn,
    handleEscapeRatRace,
    handleCardAction,
    handleBankLoanAction,
    handleDrawCard // ドロー用アクションをインポート
} from './guest_actions.js';

const SEL_G = DOM_SELECTORS.GUEST;
const sectionLogin = document.getElementById(SEL_G.LOGIN.SECTION);
const sectionGuest = document.getElementById(SEL_G.STATUS.SECTION);
const inputUsername = document.getElementById(SEL_G.LOGIN.INPUT_USERNAME);
const btnLogin = document.getElementById(SEL_G.LOGIN.BTN_LOGIN);
const btnRollDice = document.getElementById(SEL_G.CONTROLS.BTN_ROLL_DICE);
const guestDiceResult = document.getElementById(SEL_G.CONTROLS.DICE_RESULT);

const btnClaimPaycheck = document.getElementById(SEL_G.CONTROLS.BTN_CLAIM_PAYCHECK);
const btnEndTurn = document.getElementById(SEL_G.CONTROLS.BTN_END_TURN);

// 新常設コントロールボタン群の取得
const btnEscapeRatRace = document.getElementById(SEL_G.CONTROLS.BTN_ESCAPE_RAT_RACE);

// 山札ドローボタン4種の取得
const btnDrawSmallDeal = document.getElementById(SEL_G.CARD.BTN_DRAW_SMALL_DEAL);
const btnDrawBigDeal = document.getElementById(SEL_G.CARD.BTN_DRAW_BIG_DEAL);
const btnDrawMarket = document.getElementById(SEL_G.CARD.BTN_DRAW_MARKET); 
const btnDrawDoodad = document.getElementById(SEL_G.CARD.BTN_DRAW_DOODAD); 

const btnBuyRealEstate = document.getElementById(SEL_G.CARD.BTN_BUY_REALESTATE);
const btnBuyStock = document.getElementById(SEL_G.CARD.BTN_BUY_STOCK);
const btnSellStock = document.getElementById(SEL_G.CARD.BTN_SELL_STOCK);
const btnPayDoodad = document.getElementById(SEL_G.CARD.BTN_PAY_DOODAD);
const btnCardPass = document.getElementById(SEL_G.CARD.BTN_PASS);
const btnBorrowLoan = document.getElementById(SEL_G.PORTFOLIO.BTN_BORROW_LOAN);
const btnPaybackLoan = document.getElementById(SEL_G.PORTFOLIO.BTN_PAYBACK_LOAN);

// デバッグ用：localStorageの記憶状態を画面に反映する関数
function displayLocalStorageStatus() {
    const storedId = getFromStorage('user_id');
    const storedName = getFromStorage('player_name');

    const elId = document.getElementById(SEL_G.DEBUG.STORAGE_ID);
    const elName = document.getElementById(SEL_G.DEBUG.STORAGE_NAME);

    if (elId) elId.textContent = storedId ? storedId : "未定義";
    if (elName) elName.textContent = storedName ? storedName : "未定義";
}

displayLocalStorageStatus();

const roomEl = document.getElementById(SEL_G.STATUS.ROOM_ID);
if (roomEl) roomEl.textContent = roomId || "未指定";

// 役割と職業テキストを安全に流し込む関数
function updateStatusProfessionUI(state) {
    const elRole = document.getElementById(SEL_G.STATUS.ROLE);
    const elProfession = document.getElementById(SEL_G.STATUS.PROFESSION);
    
    if (elRole) elRole.textContent = `${state?.role || '一般'}（認証済み）`;
    if (elProfession) elProfession.textContent = state?.profession || '一般';
}

// 【即時実行】ページ読み込み時の自動ログインチェック
(async function init() {
    console.log("【初期化】自動ログインチェックを開始します...");
    const existingPlayer = await autoLoginCheck();

    if (existingPlayer) {
        sectionLogin.hidden = true;
        sectionGuest.hidden = false;
        
        const username = existingPlayer.state?.name || getFromStorage('player_name') || "ゲスト";
        const elName = document.getElementById(SEL_G.STATUS.NAME);
        if (elName) elName.textContent = username;
        
        updateStatusProfessionUI(existingPlayer.state);
        startMonitoring(existingPlayer.user_id);
    } else {
        sectionLogin.hidden = false;
    }
})();

// 新規登録入室処理
btnLogin.addEventListener('click', async () => {
    const username = inputUsername.value.trim();
    if (!username) { alert('名前を入力してください！'); return; }
    
    try {
        btnLogin.disabled = true;
        btnLogin.textContent = '入室処理中...';
        const userId = await executeJoin(username);
        
        sectionLogin.hidden = true;
        sectionGuest.hidden = false;
        
        const elName = document.getElementById(SEL_G.STATUS.NAME);
        if (elName) elName.textContent = username;
        
        startMonitoring(userId);
    } catch (error) {
        if (error.code === '23505') {
            const userId = getFromStorage('user_id');
            sectionLogin.hidden = true;
            sectionGuest.hidden = false;
            const elName = document.getElementById(SEL_G.STATUS.NAME);
            if (elName) elName.textContent = username;
            
            startMonitoring(userId);
        } else {
            alert('Supabaseへの送信に失敗しました。');
            btnLogin.disabled = false;
            btnLogin.textContent = '入室する';
        }
    }
});

/**
 * 手番とUI全体のリアルタイム監視を開始する関数
 */
function startMonitoring(myUserId) {
    guestState.setMyUserId(myUserId);

    // データベース変更に伴うUI再描画の司令塔処理
    const triggerUIRefresh = () => {
        const myData = guestState.getMyData();
        const isFinancialsLocked = guestState.isFinancialsLocked();
        const isMyTurn = guestState.isMyTurn();
        const pending = guestState.getPendingSalary();
        
        const currentRoomCard = guestState.currentCardCache || null;

        if (myData && myData.state) {
            updateStatusProfessionUI(myData.state);
        }


        // 🌟 サイコロボタンの活性制御：自分の手番、かつ財務ロックがなく、未請求給与がなく、終了ボタンが押されていない、かつ「ゲームがプレイ状態（開始済み）」であること
        if (isMyTurn && !isFinancialsLocked && pending === 0 && btnEndTurn.disabled && guestState.isGameStarted()) {
            btnRollDice.disabled = false;
            btnRollDice.textContent = 'O サイコロを振る'; // ← 追加：アクティブな時の文字列
        } else {
            btnRollDice.disabled = true;
            btnRollDice.textContent = 'X サイコロを振る'; // ← 追加：非アクティブな時の文字列
        }
        
        // 取引・ローン・脱出申請ボタン等のdisabled制御を表示モジュール側へ一括集約
        refreshGuestUI(
            guestState.latestParticipants,
            guestState.currentTurnUserIdCache,
            guestState.myUserId,
            isFinancialsLocked,
            currentRoomCard,
            {
                onRollDice: () => { btnRollDice.click(); },
                onVerifySuccess: async () => {
                    if (!myData || !myData.state) return;
                    
                    const statePatch = { is_calculating: false };
                    try {
                        await updateParticipantState(guestState.myUserId, statePatch);
                        alert("計算チェックに成功しました！ロックが解除され、サイコロが振れるようになります。");
                    } catch (err) {
                        alert("ロック解除の同期に失敗しました。再試行してください。");
                    }
                },
                onVerifyFailure: (errorMsg) => { alert(errorMsg); },
                onCardAction: (action) => console.log("【カードアクション】", action)
            }
        );
    };

    // --- イベントハンドラーの紐付け ---
    
    // サイコロを振る
    btnRollDice.addEventListener('click', () => {
        handleRollDice(btnRollDice, btnClaimPaycheck, btnEndTurn, guestDiceResult);
    });

    // Paycheckを請求する
    btnClaimPaycheck.addEventListener('click', () => {
        handleClaimPaycheck(btnClaimPaycheck, guestDiceResult);
    });

    // 手番を終了する
    btnEndTurn.addEventListener('click', () => {
        handleEndTurn(btnEndTurn, btnClaimPaycheck, guestDiceResult);
    });

    // ラットレース脱出申請
    btnEscapeRatRace.addEventListener('click', () => {
        handleEscapeRatRace(btnEscapeRatRace);
    });

    // 共通：ドローボタンを全て無効化する関数
    const disableAllDrawButtons = () => {
        if(btnDrawSmallDeal) btnDrawSmallDeal.disabled = true;
        if(btnDrawBigDeal) btnDrawBigDeal.disabled = true;
        if(btnDrawMarket) btnDrawMarket.disabled = true;
        if(btnDrawDoodad) btnDrawDoodad.disabled = true;
    };

    // 山札からカードを引くイベント
    if (btnDrawSmallDeal) {
        btnDrawSmallDeal.addEventListener('click', () => {
            disableAllDrawButtons();
            handleDrawCard('small_deal', guestDiceResult);
        });
    }

    if (btnDrawBigDeal) {
        btnDrawBigDeal.addEventListener('click', () => {
            disableAllDrawButtons();
            handleDrawCard('big_deal', guestDiceResult);
        });
    }

    if (btnDrawMarket) {
        btnDrawMarket.addEventListener('click', () => {
            disableAllDrawButtons();
            handleDrawCard('market', guestDiceResult);
        });
    }

    if (btnDrawDoodad) {
        btnDrawDoodad.addEventListener('click', () => {
            disableAllDrawButtons();
            handleDrawCard('doodad', guestDiceResult);
        });
    }

    // カード意思決定アクションボタン群
    btnBuyRealEstate.addEventListener('click', () => handleCardAction('buy_real_estate'));
    btnBuyStock.addEventListener('click', () => handleCardAction('buy_stock'));
    // 🌟 修正: 'sell_asset' -> 'sell_stock' に変更し、guest_actions.js と一致させる
    btnSellStock.addEventListener('click', () => handleCardAction('sell_stock'));
    btnPayDoodad.addEventListener('click', () => handleCardAction('pay_doodad'));
    btnCardPass.addEventListener('click', () => handleCardAction('pass'));

    // 銀行ローン借入・返済アクション
    btnBorrowLoan.addEventListener('click', () => handleBankLoanAction('borrow'));
    btnPaybackLoan.addEventListener('click', () => handleBankLoanAction('payback'));

    // 参加者のリアルタイム監視
    subscribeToParticipants(roomId, (participants) => {
        guestState.setParticipants(participants);
        triggerUIRefresh();
    });

    // 部屋状態のリアルタイム監視
    subscribeToRoom(roomId, (currentTurnUserId, fullRoomData) => {
        guestState.setCurrentTurnUserId(currentTurnUserId);
        
        // 部屋データの状態（waiting / playing）を抽出し、状態管理へセット
        if (fullRoomData) {
            if (fullRoomData.game_state) {
                guestState.currentCardCache = fullRoomData.game_state.current_card;
            }
            if (fullRoomData.game_state && fullRoomData.game_state.status) {
                guestState.setRoomStatus(fullRoomData.game_state.status);
            } else if (fullRoomData.status) {
                guestState.setRoomStatus(fullRoomData.status);
            }
        }
        triggerUIRefresh();
    });

    
}
