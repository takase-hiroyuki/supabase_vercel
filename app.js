// app.js

// config.js と storage.js から必要な部品をインポート
import { roomId, role } from './config.js';
import { saveToStorage, getFromStorage } from './storage.js';

// 1. 【開通確認用】URL解析の表示（タイムスタンプを「0600」に更新）
const debugDiv = document.createElement('div');
debugDiv.style.padding = '5px';
debugDiv.style.background = '#e2f0d9';
debugDiv.innerHTML = `【連動確認】部屋ID: ${roomId || '未指定'}, 役割: ${role || '未指定'} (0600)`;
document.body.insertBefore(debugDiv, document.body.firstChild);

// 2. 【記憶ポケット実験】値を保存して、すぐに取り出してみる
// テストとして、現在の時間を記憶ポケットに「test_time」という名前で保存します
saveToStorage('test_time', '0600に保存されたデータ');

// 保存したデータを倉庫番（storage.js）経由で取り出します
const savedData = getFromStorage('test_time');

// 取り出したデータを画面に追記して証明します
const storageDiv = document.createElement('div');
storageDiv.style.padding = '5px';
storageDiv.style.background = '#fff2cc'; // 黄色っぽい背景
storageDiv.innerHTML = `【記憶テスト】ポケットから取り出したデータ: <b>${savedData}</b>`;
document.body.insertBefore(storageDiv, document.body.firstChild);

// 3. HTMLの各画面エリアをプログラムに覚えさせる
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');
const sectionHost = document.getElementById('section-host');

// 4. 役割（role）に応じた画面の自動表示切り替え
if (role === 'host') {
    sectionHost.style.display = 'block';
    document.getElementById('host-room-id').textContent = roomId || "未指定";
} else if (role === 'guest') {
    sectionLogin.style.display = 'block';
    document.getElementById('guest-room-id').textContent = roomId || "未指定";
}
