// guest_app.js

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToRoom, subscribeToParticipants, updateParticipantState, updateCurrentTurn } from './supabase.js';
import { autoLoginCheck, executeJoin } from './join_guest.js';
import { rollDice, calculateNextPosition } from './dice.js';
// 【変更】すべての描画を司る一括更新ハブ（refreshGuestUI）をインポート
import { refreshGuestUI } from './guest_disp.js';

// HTML要素の取得
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');
const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');
const btnRollDice = document.getElementById('btn-roll-dice');
const guestDiceResult = document.getElementById('guest-dice-result');

// デバッグ用：localStorageの記憶状態を画面に反映する関数
function displayLocalStorageStatus() {
    const storedId = getFromStorage('user_id');
    const storedName = getFromStorage('player_name');

    const elId = document.getElementById('debug-storage-id');
    const elName = document.getElementById('debug-storage-name');

    if (elId) elId.textContent = storedId ? storedId : "未定義";
    if (elName) elName.textContent = storedName ? storedName : "未定義";
}

// 実行して現在の記憶状態を表示
displayLocalStorageStatus();

// 初期状態の画面セットアップ
const roomEl = document.getElementById('guest-room-id');
if (roomEl) roomEl.textContent = roomId || "未指定";

// 【即時実行】ページ読み込み時の自動ログインチェック
(async function init() {
    console.log("【初期化】自動ログインチェックを開始します...");
    const existingPlayer = await autoLoginCheck();

    if (existingPlayer) {
        console.log("【初期化】登録済みのプレイヤーを検出しました。ログイン画面をスキップします:", existingPlayer);
        
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        
        const username = existingPlayer.state?.name || getFromStorage('player_name') || "ゲスト";
        const elName = document.getElementById('guest-name');
        const elRole = document.getElementById('guest-role');
        if (elName) elName.textContent = username;
        if (elRole) elRole.textContent = '一般（再入室）';
        
        startMonitoring(existingPlayer.user_id);
    } else {
        console.log("【初期化】未登録の環境です。ログイン画面を表示します。");
        sectionLogin.style.display = 'block';
    }
})();

// 「入室する」ボタンが押された時の新規登録処理
btnLogin.addEventListener('click', async () => {
    const username = inputUsername.value.trim();
    
    if (!username) {
        alert('名前を入力してください！');
        return;
    }
    
    try {
        btnLogin.disabled = true;
        btnLogin.textContent = '入室処理中...';

        const userId = await executeJoin(username);
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        
        const elName = document.getElementById('guest-name');
        const elRole = document.getElementById('guest-role');
        if (elName) elName.textContent = username;
        if (elRole) elRole.textContent = '一般（入室済み）';
        
        startMonitoring(userId);
        
    } catch (error) {
        if (error.code === '23505') {
            console.log("【デバッグ】データベース側で重複登録をブロックしました。安全に画面を移行します。");
            const userId = getFromStorage('user_id');
            sectionLogin.style.display = 'none';
            sectionGuest.style.display = 'block';
            
            const elName = document.getElementById('guest-name');
            const elRole = document.getElementById('guest-role');
            if (elName) elName.textContent = username;
            if (elRole) elRole.textContent = '一般（再入室）';
            startMonitoring(userId);
        } else {
            alert('Supabaseへの送信に失敗しました。コンソールエラーを確認してください。');
            btnLogin.disabled = false;
            btnLogin.textContent = '入室する';
        }
    }
});

/**
 * 手番とUI全体のリアルタイム監視を開始する関数
 * @param {string} myUserId - 自分のユーザーID
 */
function startMonitoring(myUserId) {
    let latestParticipants = []; 
    let currentTurnUserIdCache = null; 

    // UIを最新のデータに基づいて一括再描画する中間処理
    const triggerUIRefresh = () => {
        // guest_disp.js の引数設計（7つ）に合わせて完全なデータを引き渡す
        refreshGuestUI(
            latestParticipants,       // 1. 最新の参加者リスト
            currentTurnUserIdCache,   // 2. 手番ユーザーIDのキャッシュ
            myUserId,                 // 3. 自分のユーザーID
            myUserId,                 // 4. 表示対象プレイヤー（自分自身）
            false,                    // 5. 財務計算ロック（仮でfalse）
            null,                     // 6. 共通カード情報（未実装のため仮でnull）
            {                         // 7. guest_disp.js が期待する各種コールバック群
                onRollDice: () => {
                    // btnRollDice のクリックイベントをトリガーする
                    btnRollDice.click();
                },
                onVerifySuccess: () => console.log("【財務検証】成功"),
                onVerifyFailure: () => console.log("【財務検証】失敗"),
                onCardAction: (action) => console.log("【カードアクション】", action)
            }
        );
    };

    // サイコロを振るボタンが押された時の処理
    btnRollDice.addEventListener('click', async () => {
        const myData = latestParticipants.find(p => p.user_id === myUserId);
        if (!myData || !myData.state) {
            guestDiceResult.textContent = `エラー: 自分のデータが見つかりません (myUserId: ${myUserId})`;
            alert('自分のプレイヤーデータが見つかりません。');
            return;
        }

        try {
            btnRollDice.disabled = true;

            const diceRoll = rollDice();
            const currentPosition = myData.state.position ?? 0;
            const nextPosition = calculateNextPosition(currentPosition, diceRoll);

            const updatedState = {
                name: myData.state.name,
                position: nextPosition,
                role: myData.state.role || '一般',
                last_dice: diceRoll,
                // 既存の財務・ポートフォリオデータを破損させないよう安全に維持・継承
                financials: myData.state.financials || {}
            };

            guestDiceResult.textContent = `送信開始: 出目=${diceRoll}, 次位置=${nextPosition}, ID=${myUserId}`;

            const dbResult = await updateParticipantState(myUserId, updatedState);
            console.log("【デバッグ・UPDATE戻り値】:", dbResult);

            if (latestParticipants.length > 0) {
                const myIndex = latestParticipants.findIndex(p => p.user_id === myUserId);
                const nextIndex = (myIndex + 1) % latestParticipants.length;
                const nextTurnUserId = latestParticipants[nextIndex].user_id;

                console.log(`【デバッグ・手番移行】次の手番IDを送信します: ${nextTurnUserId}`);
                await updateCurrentTurn(roomId, nextTurnUserId);
            }

            guestDiceResult.textContent = `送信成功: 出目=${diceRoll}, 位置=${nextPosition}`;

        } catch (error) {
            guestDiceResult.textContent = `例外発生: ${error.message || JSON.stringify(error)}`;
            alert('サイコロ処理の送信に失敗しました。');
            btnRollDice.disabled = false;
        }
    });

    // 参加者のリアルタイム監視
    subscribeToParticipants(roomId, (participants) => {
        latestParticipants = participants; 
        triggerUIRefresh(); // UIを一括書き換え
    });

    // 部屋状態（手番）のリアルタイム監視
    subscribeToRoom(roomId, (currentTurnUserId) => {
        currentTurnUserIdCache = currentTurnUserId; 
        triggerUIRefresh(); // UIを一括書き換え
    });
}
