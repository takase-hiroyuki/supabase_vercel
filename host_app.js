// host_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
// 【修正】コメントを実態（insertParticipant）に合わせて整理しました。supabaseクライアント自体もインポートに追加。
import { supabase, subscribeToParticipants, clearRoomParticipants, subscribeToRoom, updateCurrentTurn, deleteParticipant } from './supabase.js';
import { renderTurnDisplay, renderParticipantDisplay } from './host_disp.js'; // 表示用ファイルをインポート

// ====== 新規追加：ホスト用ID ======
const HOST_USER_ID = 'host-admin-01';
// ===================================

// 1. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const listBody = document.getElementById('host-participant-list');
const btnClearRoom = document.getElementById('btn-clear-room');
const hostDiceMonitor = document.getElementById('host-dice-monitor');

// 手番設定用の入力欄（入室順）とボタン
const inputNextTurnOrder = document.getElementById('input-next-turn-order');
const btnSetTurn = document.getElementById('btn-set-turn');

// 「🎲 初期シャッフル＆ゲーム開始」ボタン
const btnInitialShuffleStart = document.getElementById('btn-initial-shuffle-start');

// キャッシュ用の変数
let latestParticipants = [];
let currentTurnUserIdCache = null;

// 手番の表示を更新する共通関数
const updateTurnDisplay = () => {
    renderTurnDisplay(currentTurnUserIdCache, latestParticipants, hostDiceMonitor);
};

// 2. データを画面のテーブル（tbody）およびすごろく盤面に組み立てて出力する関数
const updateParticipantTable = (participants) => {
    latestParticipants = participants; // キャッシュを更新
    
    // 分離した外部ファイルの描画関数を実行
    renderParticipantDisplay(participants, listBody);

    // 参加者情報が更新されたら手番表示も再計算する
    updateTurnDisplay();
};

// ====== 新規追加：初期シャッフル＆ゲーム開始 ======
if (btnInitialShuffleStart) {
    btnInitialShuffleStart.addEventListener('click', async () => {
        if (!confirm("初期シャッフルを行ってゲームを開始しますか？")) return;

        try {
            btnInitialShuffleStart.disabled = true;
            btnInitialShuffleStart.textContent = '処理中...';

            // データベースの start_game_with_shuffled_decks 関数を呼び出す
            const { data, error } = await supabase.rpc('start_game_with_shuffled_decks', {
                p_room_id: roomId,
                p_host_user_id: HOST_USER_ID
            });

            if (error) {
                console.error("RPC呼び出しエラー:", error);
                alert("通信エラーが発生しました: " + error.message);
                return;
            }

            if (data.success) {
                alert(data.message);
                // 成功時は、roomsテーブルの更新を検知して画面が切り替わる仕組み（後続実装）を待つ
            } else {
                alert("エラー: " + data.error);
            }
        } catch (err) {
            console.error("予期せぬエラー:", err);
            alert("エラーが発生しました。コンソールを確認してください。");
        } finally {
            btnInitialShuffleStart.disabled = false;
            btnInitialShuffleStart.textContent = '🎲 初期シャッフル＆ゲーム開始';
        }
    });
}
// ===============================================

// 3.「を手番にする」ボタンが押された時の動き（配列インデックスから特定）
if (btnSetTurn) {
    btnSetTurn.addEventListener('click', async () => {
        const orderValue = parseInt(inputNextTurnOrder.value, 10);

        if (isNaN(orderValue) || orderValue < 1 || orderValue > latestParticipants.length) {
            alert(`Valid entry sequence (between 1 and ${latestParticipants.length}) is required.`);
            return;
        }

        const targetPlayer = latestParticipants[orderValue - 1];
        
        try {
            btnSetTurn.disabled = true;
            btnSetTurn.textContent = '設定中...';
            
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
    console.log("【ホストDB3】subscribeToRoomを受信しました。currentTurnUserId:", currentTurnUserId);
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

        const targetPlayer = latestParticipants[orderValue - 1];
        
        if (!confirm(`プレイヤー「${targetPlayer.state?.name || '不明'}」を退室させますか？`)) {
            return;
        }

        try {
            btnKickParticipant.disabled = true;
            btnKickParticipant.textContent = '処理中...';

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
