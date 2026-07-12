// host_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
import { subscribeToParticipants, clearRoomParticipants, subscribeToRoom, updateCurrentTurn, deleteParticipant } from './supabase.js';

// 1. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const listBody = document.getElementById('host-participant-list');
const btnClearRoom = document.getElementById('btn-clear-room');
const hostDiceMonitor = document.getElementById('host-dice-monitor');

// 手番設定用の入力欄（入室順）とボタン
const inputNextTurnOrder = document.getElementById('input-next-turn-order');
const btnSetTurn = document.getElementById('btn-set-turn');

// キャッシュ用の変数
let latestParticipants = [];
let currentTurnUserIdCache = null;

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

// 手番の表示を更新する共通関数
const updateTurnDisplay = () => {
    if (!hostDiceMonitor) return;

    if (!currentTurnUserIdCache) {
        hostDiceMonitor.textContent = "手番が設定されていません（入室順の番号を指定してください）";
        return;
    }

    // 参加者リストの中から現在の手番のIDに一致する人を探す
    const activePlayer = latestParticipants.find(p => p.user_id === currentTurnUserIdCache);
    const activePlayerName = activePlayer && activePlayer.state ? activePlayer.state.name : currentTurnUserIdCache;

    // ご要望の文言のみを出力
    hostDiceMonitor.textContent = `次は ${activePlayerName} の番です`;
};

// 2. データを画面のテーブル（tbody）およびすごろく盤面に組み立てて出力する関数
const updateParticipantTable = (participants) => {
    console.log("【デバッグ】テーブル・盤面描画処理が走りました。データ件数:", participants.length);
    
    latestParticipants = participants; // キャッシュを更新
    listBody.innerHTML = ''; // 名簿を一旦クリア
    clearBoardCells();       // すごろく盤面を一旦クリア

    participants.forEach((p, index) => {
        const state = p.state || { name: '未特定', position: 0, role: '一般' };

        // --- A. 名簿テーブルへの描画処理（表示崩れ防止のため、列数を3列に完全統一） ---
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${state.name || '不明'} (${p.user_id})</td>
            <td>${state.position ?? 0} 番マス</td>
        `;
        listBody.appendChild(tr);

        // --- B. すごろく盤面へのコマ配置処理（インラインスタイルを完全排除） ---
        const targetCellId = `cell-${state.position ?? 0}`;
        const cell = document.getElementById(targetCellId);
        if (cell) {
            // JSによる .style 制御を使わず、HTML標準属性のテーブル要素（またはブロック）で構造化
            const pieceTable = document.createElement('table');
            pieceTable.setAttribute('border', '0');
            pieceTable.setAttribute('cellspacing', '0');
            pieceTable.setAttribute('cellpadding', '2');
            pieceTable.setAttribute('width', '100%');
            
            const pieceTr = document.createElement('tr');
            const pieceTd = document.createElement('td');
            
            pieceTd.setAttribute('bgcolor', '#00bcd4');
            pieceTd.setAttribute('align', 'center');
            
            // 文字色白を表現するため標準の font タグを使用
            const fontTag = document.createElement('font');
            fontTag.setAttribute('color', 'white');
            fontTag.setAttribute('size', '2');
            fontTag.textContent = state.name || '不明';
            
            pieceTd.appendChild(fontTag);
            pieceTr.appendChild(pieceTd);
            pieceTable.appendChild(pieceTr);
            cell.appendChild(pieceTable);
        }
    });

    // 参加者情報が更新されたら手番表示も再計算する
    updateTurnDisplay();
};

// 3.「を手番にする」ボタンが押された時の動き（配列インデックスから特定）
if (btnSetTurn) {
    btnSetTurn.addEventListener('click', async () => {
        const orderValue = parseInt(inputNextTurnOrder.value, 10);

        if (isNaN(orderValue) || orderValue < 1 || orderValue > latestParticipants.length) {
            alert(`有効な入室順（1 から ${latestParticipants.length} の間）を入力してください。`);
            return;
        }

        // 入力された番号（1始まり）を配列のインデックス（0始まり）に変換してプレイヤーを特定
        const targetPlayer = latestParticipants[orderValue - 1];
        
        try {
            btnSetTurn.disabled = true;
            btnSetTurn.textContent = '設定中...';
            
            // Supabaseのroomsテーブルに対象プレイヤーのIDを書き込む
            await updateCurrentTurn(roomId, targetPlayer.user_id);
            
            inputNextTurnOrder.value = ''; // 入力欄をクリア
        } catch (error) {
            alert('手番の設定に失敗しました。');
        } finally {
            btnSetTurn.disabled = false;
            btnSetTurn.textContent = 'を手番にする';
        }
    });
}

// 4. リアルタイム監視を開始
console.log("【デバッグ】ホスト画面用のリアルタイム接続を開始します。部屋ID:", roomId);
subscribeToParticipants(roomId, updateParticipantTable);

// 部屋（手番情報）の変更をリアルタイム監視
subscribeToRoom(roomId, (currentTurnUserId) => {
    currentTurnUserIdCache = currentTurnUserId; // 手番IDをキャッシュに保存
    updateTurnDisplay(); // 表示を更新
});

// 5. 部屋データのリセットボタン（全員を退室させる）が押された時の動き
if (btnClearRoom) {
    btnClearRoom.addEventListener('click', async () => {
        if (!confirm('本当にこの部屋の参加者データをすべてリセットしますか？')) {
            return;
        }
        
        try {
            btnClearRoom.disabled = true;
            btnClearRoom.textContent = 'リセット中...';
            
            await clearRoomParticipants(roomId);
            
            alert('部屋のデータをリセットしました。');
        } catch (error) {
            alert('データのリセットに失敗しました。');
        } finally {
            btnClearRoom.disabled = false;
            btnClearRoom.textContent = '全員を退室させる';
        }
    });
}

// 6. 特定の参加者を退室させる処理
const btnKickParticipant = document.getElementById('btn-kick-participant');
const inputKickOrder = document.getElementById('input-kick-order');

if (btnKickParticipant && inputKickOrder) {
    btnKickParticipant.addEventListener('click', async () => {
        const orderValue = parseInt(inputKickOrder.value.trim(), 10);
        
        if (isNaN(orderValue) || orderValue < 1 || orderValue > latestParticipants.length) {
            alert(`有効な退室者の番号（1 から ${latestParticipants.length} の間）を入力してください。`);
            return;
        }

        // 入力された番号（1始まり）からキャッシュ配列のプレイヤーを特定
        const targetPlayer = latestParticipants[orderValue - 1];
        
        if (!confirm(`プレイヤー「${targetPlayer.state?.name || '不明'}」を退室させますか？`)) {
            return;
        }

        try {
            btnKickParticipant.disabled = true;
            btnKickParticipant.textContent = '処理中...';

            // Supabase から該当ユーザーを削除（手番の自動移譲は supabase.js 内で実行されます）
            await deleteParticipant(roomId, targetPlayer.user_id);
            
            inputKickOrder.value = ''; // 入力欄をクリア
        } catch (error) {
            alert('退室処理に失敗しました。');
        } finally {
            btnKickParticipant.disabled = false;
            btnKickParticipant.textContent = '退室させる';
        }
    });
}
