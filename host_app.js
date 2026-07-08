// host_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
import { subscribeToParticipants, clearRoomParticipants } from './supabase.js';

// 1. HTMLの各画面エリア・ボタンをプログラムに覚えさせる
const listBody = document.getElementById('host-participant-list');
const btnClearRoom = document.getElementById('btn-clear-room');

// 2. データを画面のテーブル（tbody）に組み立てて出力する関数
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

// 3. リアルタイム監視を開始
console.log("【デバッグ】ホスト画面用のリアルタイム接続を開始します。部屋ID:", roomId);
subscribeToParticipants(roomId, updateParticipantTable);

// 4. 部屋データのリセットボタンが押された時の動き
if (btnClearRoom) {
    btnClearRoom.addEventListener('click', async () => {
        if (!confirm('本当にこの部屋の参加者データをすべてリセットしますか？')) {
            return;
        }
        
        try {
            btnClearRoom.disabled = true;
            btnClearRoom.textContent = 'リセット中...';
            
            // データベースのデータを削除
            await clearRoomParticipants(roomId);
            
            alert('部屋のデータをリセットしました。');
        } catch (error) {
            alert('データのリセットに失敗しました。');
        } finally {
            btnClearRoom.disabled = false;
            btnClearRoom.textContent = '部屋のデータをリセット';
        }
    });
}
