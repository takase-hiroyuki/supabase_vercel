// app.js

// 必要な部品を各ファイルからインポート
import { roomId, role } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';
import { insertParticipant, subscribeToParticipants } from './supabase.js';

// 1. 【開通確認用】（タイムスタンプ「0736」に更新）
const debugDiv = document.createElement('div');
debugDiv.style.padding = '5px';
debugDiv.style.background = '#e2f0d9';
debugDiv.innerHTML = `【連動確認】部屋ID: ${roomId || '未指定'}, 役割: ${role || '未指定'} (0736)`;
document.body.insertBefore(debugDiv, document.body.firstChild);

const savedData = getFromStorage('test_time');
const storageDiv = document.createElement('div');
storageDiv.style.padding = '5px';
storageDiv.style.background = '#fff2cc';
storageDiv.innerHTML = `【記憶テスト】ポケットから取り出したデータ: <b>${savedData}</b>`;
document.body.insertBefore(storageDiv, document.body.firstChild);

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
    // 🚀【変更点】?room=game02 のみのURLでも、自動的にゲスト画面（ログイン）が開きます
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
    
    let userId = getFromStorage('user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 11);
        saveToStorage('user_id', userId);
    }
    
    saveToStorage('player_name', username);
    
    try {
        btnLogin.disabled = true;
        btnLogin.textContent = '入室処理中...';
        
        // 🚀Supabaseの「participants」テーブルにデータを送信！
        await insertParticipant(roomId, username, userId);
        
        alert(`Supabaseへの送信が成功しました！\nプレイヤー名: ${username}\nID: ${userId}`);
        
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


// 5. ホスト画面用のリアルタイムデータ監視とテーブル描画
if (role === 'host') {
    const listBody = document.getElementById('host-participant-list');

    // データを画面のテーブル（tbody）に組み立てて出力する関数
    const updateParticipantTable = (participants) => {
        console.log("【デバッグ】テーブル描画処理が走りました。データ件数:", participants.length);
        listBody.innerHTML = ''; // 一旦クリア

        participants.forEach((p, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${p.name} (${p.user_id})</td>
                <td>${p.role}</td>
                <td>（後ほど実装）</td>
            `;
            listBody.appendChild(tr);
        });
    };

    // リアルタイム監視を開始
    console.log("【デバッグ】ホスト画面用のリアルタイム接続を開始します。部屋ID:", roomId);
    subscribeToParticipants(roomId, updateParticipantTable);
}
