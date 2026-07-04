// app.js

// 必要な部品を各ファイルからインポート
import { roomId, role } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';
import { insertParticipant } from './supabase.js'; // ⭕Supabase通信関数をインポート

// 1. 【開通確認用】（タイムスタンプ「0730」に更新）
const debugDiv = document.createElement('div');
debugDiv.style.padding = '5px';
debugDiv.style.background = '#e2f0d9';
debugDiv.innerHTML = `【連動確認】部屋ID: ${roomId || '未指定'}, 役割: ${role || '未指定'} (0730)`;
document.body.insertBefore(debugDiv, document.body.firstChild);

// 2. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');
const sectionHost = document.getElementById('section-host');

const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');

// 3. 役割（role）に応じた画面の自動表示切り替え
if (role === 'host') {
    sectionHost.style.display = 'block';
    document.getElementById('host-room-id').textContent = roomId || "未指定";
} else if (role === 'guest') {
    sectionLogin.style.display = 'block';
    document.getElementById('guest-room-id').textContent = roomId || "未指定";
}

// 4. 「入室する」ボタンが押された時の動き
btnLogin.addEventListener('click', async () => {
    const username = inputUsername.value.trim();
    
    if (!username) {
        alert('名前を入力してください！');
        return;
    }
    
    // プレイヤー固有のユーザーIDを記憶ポケットから取得、なければ新規作成
    let userId = getFromStorage('user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 11);
        saveToStorage('user_id', userId); // 記憶ポケットに保存
    }
    
    // プレイヤー名を記憶ポケットに保存
    saveToStorage('player_name', username);
    
    try {
        // ボタンを連打できないように一時的に無効化
        btnLogin.disabled = true;
        btnLogin.textContent = '入室処理中...';
        
        // 🚀【本番】Supabaseの「participants」テーブルにデータを送信！
        await insertParticipant(roomId, username, userId);
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
        // 送信が成功したら、ログイン画面を隠して「参加者画面（ステータス）」を表示する
        sectionLogin.style.display = 'none';
        sectionGuest.style.display = 'block';
        document.getElementById('guest-name').textContent = username;
        document.getElementById('guest-role').textContent = '一般（入室済み）';
        
    } catch (error) {
        alert('Supabaseへの送信に失敗しました。コンソールエラーを確認してください。');
        // エラー時はボタンを元に戻す
        btnLogin.disabled = false;
        btnLogin.textContent = '入室する';
    }
});
