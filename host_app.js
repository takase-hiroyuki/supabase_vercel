// host_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
import { subscribeToParticipants, clearRoomParticipants } from './supabase.js';

// 1. HTMLの各画面エリア・ボタンをプログラムに覚えさせる
const listBody = document.getElementById('host-participant-list');
const btnClearRoom = document.getElementById('btn-clear-room');

/**
 * 画面上のすごろく盤面（各マス）に配置されているコマをすべて消去する関数
 */
const clearBoardCells = () => {
    for (let i = 0; i < 8; i++) {
        const cell = document.getElementById(`cell-${i}`);
        if (cell) {
            cell.textContent = ''; // マスの中身を空にする
        }
    }
};

// 2. データを画面のテーブル（tbody）およびすごろく盤面に組み立てて出力する関数
const updateParticipantTable = (participants) => {
    console.log("【デバッグ】テーブル・盤面描画処理が走りました。データ件数:", participants.length);
    
    listBody.innerHTML = ''; // 名簿を一旦クリア
    clearBoardCells();       // すごろく盤面を一旦クリア

    participants.forEach((p, index) => {
        // 安全にJSONデータ（state）を取り出す。万が一空なら初期値を入れる
        const state = p.state || { name: '未特定', join_order: 0, position: 0, role: '一般' };

        // --- A. 名簿テーブルへの描画処理 ---
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${state.name || '不明'} (${p.user_id})</td>
            <td>${state.position ?? 0} 番マス</td>
            <td>（後ほど実装）</td>
        `;
        listBody.appendChild(tr);

        // --- B. すごろく盤面へのコマ配置処理 ---
        const targetCellId = `cell-${state.position ?? 0}`;
        const cell = document.getElementById(targetCellId);
        if (cell) {
            // マスの中にプレイヤーの名前を表示する小さな枠（コマ）を作成
            const piece = document.createElement('div');
            piece.style.backgroundColor = '#00bcd4';
            piece.style.color = 'white';
            piece.style.padding = '2px 5px';
            piece.style.margin = '2px 0';
            piece.style.fontSize = '12px';
            piece.style.display = 'inline-block';
            piece.textContent = state.name || '不明';
            
            cell.appendChild(piece);
        }
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
