// guest_app.js　司令塔

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToRoom, subscribeToParticipants, updateParticipantState } from './supabase.js';
import { autoLoginCheck, executeJoin } from './join_guest.js';
import { refreshGuestUI } from './guest_disp.js';

// 分割したカスタムモジュールから状態とアクションをインポート
import { guestState } from './guest_state.js';
import { handleRollDice, handleClaimPaycheck, handleEndTurn } from './guest_actions.js';

// HTML要素の取得
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');
const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');
const btnRollDice = document.getElementById('btn-roll-dice');
const guestDiceResult = document.getElementById('guest-dice-result');

const btnClaimPaycheck = document.getElementById('btn-claim-paycheck');
const btnEndTurn = document.getElementById('btn-end-turn');

// デバッグ用：localStorageの記憶状態を画面に反映する関数
function displayLocalStorageStatus() {
    const storedId = getFromStorage('user_id');
    const storedName = getFromStorage('player_name');

    const elId = document.getElementById('debug-storage-id');
    const elName = document.getElementById('debug-storage-name');

    if (elId) elId.textContent = storedId ? storedId : "未定義";
    if (elName) elName.textContent = storedName ? storedName : "未定義";
}

displayLocalStorageStatus();

const roomEl = document.getElementById('guest-room-id');
if (roomEl) roomEl.textContent = roomId || "未指定";

// 【即時実行】ページ読み込み時の自動ログインチェック
(async function init() {
    console.log("【初期化】自動ログインチェックを開始します...");
    const existingPlayer = await autoLoginCheck();

    if (existingPlayer) {
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        
        const username = existingPlayer.state?.name || getFromStorage('player_name') || "ゲスト";
        const elName = document.getElementById('guest-name');
        const elRole = document.getElementById('guest-role');
        if (elName) elName.textContent = username;
        if (elRole) elRole.textContent = '一般（再入室）';
        
        startMonitoring(existingPlayer.user_id);
    } else {
        sectionLogin.style.display = 'block';
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
        
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        
        const elName = document.getElementById('guest-name');
        const elRole = document.getElementById('guest-role');
        if (elName) elName.textContent = username;
        if (elRole) elRole.textContent = '一般（入室済み）';
        
        startMonitoring(userId);
    } catch (error) {
        if (error.code === '23505') {
            const userId = getFromStorage('user_id');
            sectionLogin.style.display = 'none';
            sectionGuest.style.display = 'block';
            const elName = document.getElementById('guest-name');
            const elRole = document.getElementById('guest-role');
            if (elName) elName.textContent = username;
            if (elRole) elRole.textContent = '一般（再入室）';
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
    // 状態管理クラスに自分のIDをセット
    guestState.setMyUserId(myUserId);

    // データベース変更に伴うUI再描画の司令塔処理
    const triggerUIRefresh = () => {
        const myData = guestState.getMyData();
        const isFinancialsLocked = guestState.isFinancialsLocked();
        const isMyTurn = guestState.isMyTurn();
        const pending = guestState.getPendingSalary();

        // 状態の変化に合わせて「サイコロを振る」ボタンの活性状態を制御
        // (自分の手番、財務ロックなし、かつサイコロ移動前のアクション待ちでない場合のみ有効)
        if (isMyTurn && !isFinancialsLocked && pending === 0 && btnEndTurn.disabled) {
            btnRollDice.disabled = false;
        } else {
            btnRollDice.disabled = true;
        }

        refreshGuestUI(
            guestState.latestParticipants,
            guestState.currentTurnUserIdCache,
            guestState.myUserId,
            guestState.myUserId,
            isFinancialsLocked,
            null,
            {
                onRollDice: () => { btnRollDice.click(); },
                onVerifySuccess: async () => {
                    if (!myData || !myData.state) return;
                    const unlockedState = { ...myData.state, is_calculating: false };
                    try {
                        await updateParticipantState(guestState.myUserId, unlockedState);
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

    // --- イベントハンドラーの紐付け（進行ロジックはすべてモジュールへ委譲） ---
    
    // サイコロを振る
    btnRollDice.addEventListener('click', () => {
        handleRollDice(btnRollDice, btnClaimPaycheck, btnEndTurn, guestDiceResult);
    });

    // Paycheckを請求する
    btnClaimPaycheck.addEventListener('click', () => {
        handleClaimPaycheck(btnClaimPaycheck, guestDiceResult);
    });

    // 手番を終了する（もらい忘れ対応）
    btnEndTurn.addEventListener('click', () => {
        handleEndTurn(btnEndTurn, btnClaimPaycheck, guestDiceResult);
    });

    // 参加者のリアルタイム監視
    subscribeToParticipants(roomId, (participants) => {
        guestState.setParticipants(participants);
        triggerUIRefresh();
    });

    // 部屋状態（手番）のリアルタイム監視
    subscribeToRoom(roomId, (currentTurnUserId) => {
        guestState.setCurrentTurnUserId(currentTurnUserId);
        triggerUIRefresh();
    });
}
