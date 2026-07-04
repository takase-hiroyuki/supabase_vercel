// app.js

// config.js から部屋IDと役割（host/guest）をインポート
import { roomId, role } from './config.js';

// 1. 【開通確認用】画面の最上部にインポート結果を表示する（タイムスタンプ「0552」等とあわせて確認用）
const debugDiv = document.createElement('div');
debugDiv.style.padding = '5px';
debugDiv.style.background = '#e2f0d9';
debugDiv.innerHTML = `【連動確認】部屋ID: ${roomId || '未指定'}, 役割: ${role || '未指定'} (0552)`;
document.body.insertBefore(debugDiv, document.body.firstChild);

// 2. HTML of 画面エリアをプログラムに覚えさせる
const sectionLogin = document.getElementById('section-login');
const sectionGuest = document.getElementById('section-guest');
const sectionHost = document.getElementById('section-host');

// 3. 役割（role）に応じた画面の自動表示切り替え
if (role === 'host') {
    // ホスト画面の非表示を解除し、部屋IDを画面に反映
    sectionHost.style.display = 'block';
    document.getElementById('host-room-id').textContent = roomId || "未指定";

} else if (role === 'guest') {
    // ゲストの場合は、まず「名前入力（ログイン）」の画面を表示する
    sectionLogin.style.display = 'block';
    document.getElementById('guest-room-id').textContent = roomId || "未指定";
}
