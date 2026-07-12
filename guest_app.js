// guest_app.js

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToRoom, subscribeToParticipants, updateParticipantState, updateCurrentTurn } from './supabase.js';
import { autoLoginCheck, executeJoin } from './join_guest.js';
import { rollDice, calculateNextPosition } from './dice.js';
import { renderGameBoard } from './guest_disp.js'; // 【変更】表示用ファイルをインポート

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

    document.getElementById('debug-storage-id').textContent = storedId ? storedId : "未定義";
    document.getElementById('debug-storage-name').textContent = storedName ? storedName : "未定義";
}

// 実行して現在の記憶状態を表示
displayLocalStorageStatus();

// 初期状態の画面セットアップ
document.getElementById('guest-room-id').textContent = roomId || "未指定";

// 【即時実行】ページ読み込み時の自動ログインチェック
(async function init() {
    console.log("【初期化】自動ログインチェックを開始します...");
    const existingPlayer = await autoLoginCheck();

    if (existingPlayer) {
        console.log("【初期化】登録済みのプレイヤーを検出しました。ログイン画面をスキップします:", existingPlayer);
        
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        
        const username = existingPlayer.state?.name || getFromStorage('player_name') || "ゲスト";
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（再入室）';
        
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
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（入室済み）';
        
        startMonitoring(userId);
        
    } catch (error) {
        if (error.code === '23505') {
            console.log("【デバッグ】データベース側で重複登録をブロックしました。安全に画面を移行します。");
            const userId = getFromStorage('user_id');
            sectionLogin.style.display = 'none';
            sectionGuest.style.display = 'block';
            document.getElementById('guest-name').textContent = username;
            document.getElementById('guest-role').textContent = '一般（再入室）';
            startMonitoring(userId);
        } else {
            alert('Supabaseへの送信に失敗しました。コンソールエラーを確認してください。');
            btnLogin.disabled = false;
            btnLogin.textContent = '入室する';
        }
    }
});

/**
 * 手番のリアルタイム監視を開始する関数
 * @param {string} myUserId - 自分のユーザーID
 */
function startMonitoring(myUserId) {
    let latestParticipants = []; 
    let currentTurnUserIdCache = null; 

    const diceContainer = guestDiceResult.parentElement;

    const updateTurnDisplay = () => {
        if (!currentTurnUserIdCache) {
            guestDiceResult.textContent = "手番が設定されていません";
            btnRollDice.disabled = true;
            if (diceContainer) {
                diceContainer.style.backgroundColor = 'transparent';
                diceContainer.style.padding = '0px';
            }
            return;
        }

        if (currentTurnUserIdCache === myUserId) {
            guestDiceResult.textContent = "あなたの番です。ボタンを押してください";
            btnRollDice.disabled = false;
            
            if (diceContainer) {
                diceContainer.style.backgroundColor = '#fff9c4';
                diceContainer.style.padding = '10px';
            }
        } else {
            const activePlayer = latestParticipants.find(p => p.user_id === currentTurnUserIdCache);
            const activePlayerName = activePlayer && activePlayer.state ? activePlayer.state.name : currentTurnUserIdCache;
            
            guestDiceResult.textContent = `現在は、${activePlayerName} の番です`;
            btnRollDice.disabled = true;
            
            if (diceContainer) {
                diceContainer.style.backgroundColor = 'transparent';
                diceContainer.style.padding = '0px';
            }
        }
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
                last_dice: diceRoll
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
        updateTurnDisplay(); 

        // 【変更】分離した外部ファイルの描画関数を実行
        renderGameBoard(participants);
    });

    // 部屋状態（手番）のリアルタイム監視
    subscribeToRoom(roomId, (currentTurnUserId) => {
        currentTurnUserIdCache = currentTurnUserId; 
        updateTurnDisplay(); 
    });
}
