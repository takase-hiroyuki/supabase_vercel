// guest_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';
import { insertParticipant } from './supabase.js';

// 1. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');

const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');

// 2. 初期状態の画面セットアップ
// ゲスト画面が開かれたら、自動的にログイン（登録）エリアを表示する
sectionLogin.style.display = 'block';
document.getElementById('guest-room-id').textContent = roomId || "未指定";

// 3. 「入室する」ボタンが押された時の動き
btnLogin.addEventListener('click', async () => {
    const username = inputUsername.value.trim();
    
    if (!username) {
        alert('名前を入力してください！');
        return;
    }
    
    // ブラウザの記憶ポケットからユーザーIDを取得、なければ新規作成
    let userId = getFromStorage('user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 11);
        saveToStorage('user_id', userId);
    }
    
    // 名前も記憶ポケットに保存
    saveToStorage('player_name', username);
    
    try {
        // 連打防止のためにボタンを無効化
        btnLogin.disabled = true;
        btnLogin.textContent = '入室処理中...';
        
        // Supabaseの「participants」テーブルにデータを送信！
        await insertParticipant(roomId, username, userId);
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
        // 画面をログインからステータス表示に切り替える
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（入室済み）';
        
    } catch (error) {
        alert('Supabaseへの送信に失敗しました。コンソールエラーを確認してください。');
        btnLogin.disabled = false;
        btnLogin.textContent = '入室する';
    }
});
