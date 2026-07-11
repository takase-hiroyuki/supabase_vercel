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
    let latestParticipants = []; // 最新の参加者リストを記憶しておく変数
    let currentTurnUserIdCache = null; // 最新の手番IDを記憶しておく変数

    // サイコロの出目テキストが表示されている親のdiv要素を取得
    const diceContainer = guestDiceResult.parentElement;

    // 他人のIDからユーザー名を探して手番表示を更新する共通処理
    const updateTurnDisplay = () => {
        if (!currentTurnUserIdCache) return;

        if (currentTurnUserIdCache === myUserId) {
            guestDiceResult.textContent = "あなたの番です。ボタンを押してください";
            btnRollDice.disabled = false;
            
            // 💡自分がサイコロを振れるときは、エリアの背景色を薄い黄色（#fff9c4）にする
            if (diceContainer) {
                diceContainer.style.backgroundColor = '#fff9c4';
                diceContainer.style.padding = '10px';
            }
        } else {
            // 参加者リストの中から、現在の手番のIDに一致する人を探す
            const activePlayer = latestParticipants.find(p => p.user_id === currentTurnUserIdCache);
            // stateの中に名前があるため、そこから取得（見つからない場合はIDを表示）
            const activePlayerName = activePlayer && activePlayer.state ? activePlayer.state.name : currentTurnUserIdCache;
            
            guestDiceResult.textContent = `現在は、${activePlayerName} の番です`;
            btnRollDice.disabled = true;
            
            // 💡他人の手番のときは背景色を透明（なし）に戻す
            if (diceContainer) {
                diceContainer.style.backgroundColor = 'transparent';
                diceContainer.style.padding = '0px';
            }
        }
    };

    // 参加者リスト全体の変更を監視
    subscribeToParticipants(roomId, (participants) => {
        console.log("参加者リストが更新されました:", participants);
        latestParticipants = participants; // リストを最新に更新
        updateTurnDisplay(); // 名前の表示を最新にするために再実行
    });

    // 部屋（手番情報）の変更を監視
    subscribeToRoom(roomId, (currentTurnUserId) => {
        if (!currentTurnUserId) {
            guestDiceResult.textContent = "手番が設定されていません";
            btnRollDice.disabled = true;
            return;
        }

        currentTurnUserIdCache = currentTurnUserId; // 手番IDをキャッシュに保存
        updateTurnDisplay(); // 表示を更新
    });
}
