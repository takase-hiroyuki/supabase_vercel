// app.js

// config.js と storage.js から必要な部品をインポート
import { roomId, role } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';

// 1. 【開通確認用】URL解析・記憶テストの表示（タイムスタンプ「0605」）
const debugDiv = document.createElement('div');
debugDiv.style.padding = '5px';
debugDiv.style.background = '#e2f0d9';
debugDiv.innerHTML = `【連動確認】部屋ID: ${roomId || '未指定'}, 役割: ${role || '未指定'} (0605)`;
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
    sectionLogin.style.display = 'block';
    document.getElementById('guest-room-id').textContent = roomId || "未指定";
}

// 4. 【新規追加】「入室する」ボタンが押された時の動き
btnLogin.addEventListener('click', () => {
    const username = inputUsername.value.trim(); // 入力された名前を取得（前後の空白を削除）
    
    if (!username) {
        alert('名前を入力してください！');
        return;
    }
    
    // 倉庫番（storage.js）を使って、入力された名前を記憶ポケットに保存する
    saveToStorage('player_name', username);
    
    // ちゃんと保存できたか、アラートで確認してみる
    const checkName = getFromStorage('player_name');
    alert(`記憶ポケットに「${checkName}」を保存しました！`);
});
