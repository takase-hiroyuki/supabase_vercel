// host_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
// 【修正】コメントを実態（insertParticipant）に合わせて整理しました。supabaseクライアント自体もインポートに追加。
import { supabase, subscribeToParticipants, clearRoomParticipants, subscribeToRoom, updateCurrentTurn, deleteParticipant } from './supabase.js';
// ★ renderDeckCounts を追加インポート
import { renderTurnDisplay, renderParticipantDisplay, renderDeckCounts } from './host_disp.js'; // 表示用ファイルをインポート

// ====== 新規追加：ホスト用ID ======
const HOST_USER_ID = 'host-admin-01';
// ===================================

// 1. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const listBody = document.getElementById('host-participant-list');
const btnClearRoom = document.getElementById('btn-clear-room');
const hostDiceMonitor = document.getElementById('host-dice-monitor');
// 【追加1】ステータス表示用の要素を取得
const displayRoomStatus = document.getElementById('host-room-status');

// 手番設定用の入力欄（入室順）とボタン
const inputNextTurnOrder = document.getElementById('input-next-turn-order');
const btnSetTurn = document.getElementById('btn-set-turn');

// 「🎲 初期シャッフル＆ゲーム開始」ボタン
const btnInitialShuffleStart = document.getElementById('btn-initial-shuffle-start');

// 退室管理用の要素
const btnKickParticipant = document.getElementById('btn-kick-participant');
const inputKickOrder = document.getElementById('input-kick-order');

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

// ====== 🌟新規追加：ページロード時のルーム状態初期フェッチ関数 ======
const fetchInitialRoomState = async () => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('status, game_state, current_turn_user_id')
            .eq('id', roomId)
            .single();

        if (error) {
            console.error("初期ルーム状態の取得に失敗しました:", error);
            return;
        }

        if (data) {
            currentTurnUserIdCache = data.current_turn_user_id;

            // ステータスとボタンのUI復元
            if (displayRoomStatus) {
                if (data.status === 'playing') {
                    displayRoomStatus.textContent = 'playing (ゲーム進行中)';
                    if (btnInitialShuffleStart) {
                        btnInitialShuffleStart.disabled = true;
                        btnInitialShuffleStart.textContent = 'ゲーム開始済み';
                    }
                } else {
                    displayRoomStatus.textContent = 'waiting (準備中)';
                }
            }

            // 山札データのUI復元
            if (data.game_state) {
                renderDeckCounts(data.game_state);
            }

            updateTurnDisplay();
        }
    } catch (err) {
        console.error("初期ルーム状態フェッチ例外:", err);
    }
};
// =========================================================================

// ====== 新規追加：初期シャッフル＆ゲーム開始 ======
if (btnInitialShuffleStart) {
    btnInitialShuffleStart.addEventListener('click', async () => {
        if (!confirm("初期シャッフルを行ってゲームを開始しますか？")) return;

        try {
            // 一旦ボタンを無効化
            btnInitialShuffleStart.disabled = true;
            btnInitialShuffleStart.textContent = '処理中...';

            // データベースの start_game_with_shuffled_decks 関数を呼び出す
            const { data, error } = await supabase.rpc('start_game_with_shuffled_decks', {
                p_room_id: roomId,
                p_host_user_id: HOST_USER_ID
            });

            if (error) {
                throw error; // 下のcatchブロックへ処理を移す
            }

            if (data.success) {
                alert(data.message);
                // 【変更】成功時はボタンを無効化したままにし、文字を変える
                btnInitialShuffleStart.textContent = 'ゲーム開始済み';
                
                // 【追加2・修正】HTML側の固定文字との重複を防ぐため、状態の文字列のみをセットする
                if (displayRoomStatus) {
                    displayRoomStatus.textContent = 'playing (ゲーム進行中)';
                }

                // 🌟【新規追加】初期シャッフル直後に最新データを再フェッチし、山札の残り枚数を即時反映
                const { data: roomData, error: roomError } = await supabase
                    .from('rooms')
                    .select('game_state, current_turn_user_id')
                    .eq('id', roomId)
                    .single();

                if (!roomError && roomData) {
                    currentTurnUserIdCache = roomData.current_turn_user_id;
                    renderDeckCounts(roomData.game_state);
                    updateTurnDisplay();
                }

            } else {
                alert("エラー: " + data.error);
                // エラー時はボタンを元に戻す
                btnInitialShuffleStart.disabled = false;
                btnInitialShuffleStart.textContent = '🎲 初期シャッフル＆ゲーム開始';
            }
        } catch (err) {
            console.error("エラー:", err);
            alert("エラーが発生しました。通信状態を確認してください。");
            // エラー時はボタンを元に戻す
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

// 🌟【追加】ページ起動時に一度サーバーから最新状態を必ず取得して適用
fetchInitialRoomState();

subscribeToParticipants(roomId, updateParticipantTable);

// 部屋（手番情報・ゲーム状態）の変更をリアルタイム監視
// ★ 引数を部屋オブジェクト全体、あるいは必要データを受け取れる形式に適合
subscribeToRoom(roomId, (roomData) => {
    if (roomData && typeof roomData === 'object') {
        console.log("【ホストDB3】subscribeToRoomを受信しました。データオブジェクト:", roomData);
        currentTurnUserIdCache = roomData.current_turn_user_id;
        
        // 🌟 リアルタイム更新時にも残り枚数描画関数を実行
        renderDeckCounts(roomData.game_state);
    } else {
        // 引数が単一のID文字列（互換性フォールバック）だった場合
        console.log("【ホストDB3】subscribeToRoomを受信しました。currentTurnUserId:", roomData);
        currentTurnUserIdCache = roomData;
    }
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
if (btnKickParticipant && inputKickOrder) {
    btnKickParticipant.addEventListener('click', async () => {
        const orderValue = parseInt(inputKickOrder.value.trim(), 10);
        
        if (isNaN(orderValue) || orderValue < 1 || orderValue > latestParticipants.length) {
            alert(`Valid sequence (between 1 and ${latestParticipants.length}) is required.`);
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
