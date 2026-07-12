// guest_app.js

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToRoom, subscribeToParticipants, updateParticipantState } from './supabase.js';
import { autoLoginCheck, executeJoin } from './join_guest.js';
import { rollDice, calculateNextPosition } from './dice.js';

// HTML要素の取得
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');
const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');
const btnRollDice = document.getElementById('btn-roll-dice');
const guestDiceResult = document.getElementById('guest-dice-result');

// 初期状態の画面セットアップ
document.getElementById('guest-room-id').textContent = roomId || "未指定";

// 【即時実行】ページ読み込み時の自動ログインチェック
(async function init() {
    console.log("【初期化】自動ログインチェックを開始します...");
    const existingPlayer = await autoLoginCheck();

    if (existingPlayer) {
        console.log("【初期化】登録済みのプレイヤーを検出しました。ログイン画面をスキップします:", existingPlayer);
        
        // すでに登録されていれば、名前入力画面をスキップして直接ゲーム画面へ
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        
        const username = existingPlayer.state?.name || getFromStorage('player_name') || "ゲスト";
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（再入室）';
        
        // リアルタイム監視を開始
        startMonitoring(existingPlayer.user_id);
    } else {
        console.log("【初期化】未登録の環境です。ログイン画面を表示します。");
        // 未登録ならログイン画面を表示
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

        // join_guest.js に切り離した入室ロジックを実行
        const userId = await executeJoin(username);
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
        // 画面をゲーム画面へ移行
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（入室済み）';
        
        // リアルタイム監視を開始
        startMonitoring(userId);
        
    } catch (error) {
        // 既にユニーク制約で弾かれた場合やその他のエラー処理
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
        // 現在の自分のデータをキャッシュから取得
        const myData = latestParticipants.find(p => p.user_id === myUserId);
        if (!myData || !myData.state) {
            // 【デバッグ挿入】データ未検出時の状態を出力
            guestDiceResult.textContent = `エラー: 自分のデータが見つかりません (myUserId: ${myUserId})`;
            alert('自分のプレイヤーデータが見つかりません。');
            return;
        }

        try {
            btnRollDice.disabled = true;

            // 1. 出目を決定 (1〜6)
            const diceRoll = rollDice();

            // 2. 移動後の位置を算出 (0〜7マス構造、7を超えたら周回)
            const currentPosition = myData.state.position ?? 0;
            const nextPosition = calculateNextPosition(currentPosition, diceRoll);

            // 3. 更新用のstateオブジェクトを組み立てる (データベースをキレイに保つため join_order は含めない)
            const updatedState = {
                name: myData.state.name,
                position: nextPosition,
                role: myData.state.role || '一般',
                last_dice: diceRoll
            };

            // 【デバッグ挿入】送信直前の状態を出力
            guestDiceResult.textContent = `送信開始: 出目=${diceRoll}, 次位置=${nextPosition}, ID=${myUserId}`;

            // 4. Supabaseへ状態を送信（アップデート）
            await updateParticipantState(myUserId, updatedState);

            // 【デバッグ挿入】送信成功時の状態を出力
            guestDiceResult.textContent = `送信成功: 出目=${diceRoll}, 位置=${nextPosition}`;

        } catch (error) {
            // 【デバッグ挿入】例外発生時の状態を出力
            guestDiceResult.textContent = `例外発生: ${error.message || JSON.stringify(error)}`;
            alert('サイコロ処理の送信に失敗しました。');
            btnRollDice.disabled = false;
        }
    });

    subscribeToParticipants(roomId, (participants) => {
        latestParticipants = participants; 
        updateTurnDisplay(); 
    });

    subscribeToRoom(roomId, (currentTurnUserId) => {
        currentTurnUserIdCache = currentTurnUserId; 
        updateTurnDisplay(); 
    });
}
