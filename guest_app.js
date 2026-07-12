// guest_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';
import { insertParticipant, subscribeToRoom, subscribeToParticipants, getCurrentTurn, updateCurrentTurn } from './supabase.js';

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

        // 💡【重複防止ロジック】すでにこの部屋に自分が存在しているか、最新の参加者リストを一度確認する
        // subscribeToParticipants 内部で行っている最初の一時取得と同じ方法、または簡易チェック
        // 今回は安全のため、一時的に確認する処理を挟むか、または名簿が空でない場合に備える
        
        await insertParticipant(roomId, username, userId);
        
        // データベース上の現在の部屋の手番を確認する
        const currentTurn = await getCurrentTurn(roomId);
        if (!currentTurn) {
            await updateCurrentTurn(roomId, userId);
            console.log("【デバッグ】最初の入室者のため、手番に設定しました:", userId);
        }
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（入室済み）';
        
        startMonitoring(userId);
        
    } catch (error) {
        // 💡【重複エラー時のフォールバック】
        // もしSupabase側で一意制約（Unique）エラー、または同一IDによるエラーが出た場合は
        // データを新規挿入せず、そのまま既存のデータを用いてゲーム画面へ進ませます。
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('already exists')) {
            console.log("【デバッグ】既に同一IDで入室済みのデータを検知。そのままゲーム画面へ移行します。");
            
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

    subscribeToParticipants(roomId, (participants) => {
        console.log("参加者リストが更新されました:", participants);
        latestParticipants = participants; 
        updateTurnDisplay(); 
    });

    subscribeToRoom(roomId, (currentTurnUserId) => {
        currentTurnUserIdCache = currentTurnUserId; 
        updateTurnDisplay(); 
    });
}
