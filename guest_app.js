// guest_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';
import { insertParticipant, subscribeToRoom, subscribeToParticipants } from './supabase.js';

// 1. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');

const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');
const btnRollDice = document.getElementById('btn-roll-dice');
const guestDiceResult = document.getElementById('guest-dice-result');

// 2. 初期状態の画面セットアップ
sectionLogin.style.display = 'block';
document.getElementById('guest-room-id').textContent = roomId || "未指定";

// 3. 「入室する」ボタンが押された時の動き
btnLogin.addEventListener('click', async () => {
    const username = inputUsername.value.trim();
    
    if (!username) {
        alert('名前を入力してください！');
        return;
    }
    
    let userId = getFromStorage('user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 11);
        saveToStorage('user_id', userId);
    }
    
    saveToStorage('player_name', username);
    
    try {
        btnLogin.disabled = true;
        btnLogin.textContent = '入室処理中...';
        
        await insertParticipant(roomId, username, userId);
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（入室済み）';
        
        // 入室が成功したら、手番の監視と参加者リストの監視を開始する
        startMonitoring(userId);
        
    } catch (error) {
        alert('Supabaseへの送信に失敗しました。コンソールエラーを確認してください。');
        btnLogin.disabled = false;
        btnLogin.textContent = '入室する';
    }
});

/**
 * 手番のリアルタイム監視を開始する関数
 * @param {string} myUserId - 自分のユーザーID
 */
function startMonitoring(myUserId) {
    // 参加者リスト全体の変更を監視
    subscribeToParticipants(roomId, (participants) => {
        console.log("参加者リストが更新されました:", participants);
    });

    // 部屋（手番情報）の変更を監視
    subscribeToRoom(roomId, (currentTurnUserId) => {
        if (!currentTurnUserId) {
            guestDiceResult.textContent = "手番が設定されていません";
            btnRollDice.disabled = true;
            return;
        }

        // 自分の手番かどうかを判定
        if (currentTurnUserId === myUserId) {
            guestDiceResult.textContent = "あなたの番です。ボタンを押してください";
            btnRollDice.disabled = false;
        } else {
            guestDiceResult.textContent = `現在は、${currentTurnUserId} の番です`;
            btnRollDice.disabled = true;
        }
    });
}
