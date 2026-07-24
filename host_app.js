// host_app.js

// 必要な部品を各ファイルからインポート
import { roomId } from './config.js';
// 🌟【追加】 manualReshuffleDeck をインポートに追加
import { supabase, subscribeToParticipants, clearRoomParticipants, subscribeToRoom, updateCurrentTurn, deleteParticipant, manualReshuffleDeck } from './supabase.js';
// DOMセレクターをインポート
import { DOM_SELECTORS } from './dom_selectors.js';
import { renderTurnDisplay, renderParticipantDisplay, renderDeckCounts } from './host_disp.js'; 

// ====== 新規追加：ホスト用ID ======
const HOST_USER_ID = 'host-admin-01';
// ===================================

// 1. HTMLの各画面エリア・ボタン・入力欄をプログラムに覚えさせる
const listBody = document.getElementById(DOM_SELECTORS.HOST.PARTICIPANT_LIST);
const btnClearRoom = document.getElementById(DOM_SELECTORS.HOST.KICK_CONTROL.BTN_CLEAR_ROOM);
const hostDiceMonitor = document.getElementById(DOM_SELECTORS.HOST.DICE_MONITOR);
const displayRoomStatus = document.getElementById(DOM_SELECTORS.HOST.LIFECYCLE.DISPLAY_ROOM_STATUS);

// 手番設定用の入力欄（入室順）とボタン
const inputNextTurnOrder = document.getElementById(DOM_SELECTORS.HOST.TURN_CONTROL.INPUT_NEXT_ORDER);
const btnSetTurn = document.getElementById(DOM_SELECTORS.HOST.TURN_CONTROL.BTN_SET_TURN);

// 「🎲 初期シャッフル＆ゲーム開始」ボタン
const btnInitialShuffleStart = document.getElementById(DOM_SELECTORS.HOST.LIFECYCLE.BTN_INITIAL_SHUFFLE);

// 🌟【新設】 デッキ個別リシャッフルボタンの取得
const btnReshuffleSmallDeal = document.getElementById(DOM_SELECTORS.HOST.DECK_MONITOR.BTN_RESHUFFLE_SMALL_DEAL);
const btnReshuffleBigDeal = document.getElementById(DOM_SELECTORS.HOST.DECK_MONITOR.BTN_RESHUFFLE_BIG_DEAL);
const btnReshuffleMarket = document.getElementById(DOM_SELECTORS.HOST.DECK_MONITOR.BTN_RESHUFFLE_MARKET);
const btnReshuffleDoodad = document.getElementById(DOM_SELECTORS.HOST.DECK_MONITOR.BTN_RESHUFFLE_DOODAD);

// 退室管理用の要素
const btnKickParticipant = document.getElementById(DOM_SELECTORS.HOST.KICK_CONTROL.BTN_KICK_PARTICIPANT);
const inputKickOrder = document.getElementById(DOM_SELECTORS.HOST.KICK_CONTROL.INPUT_KICK_ORDER);

// キャッシュ用の変数
let latestParticipants = [];
let currentTurnUserIdCache = null;

// 手番の表示を更新する共通関数
const updateTurnDisplay = () => {
    renderTurnDisplay(currentTurnUserIdCache, latestParticipants, hostDiceMonitor);
};

// 2. データを画面のテーブル（tbody）およびすごろく盤面に組み立てて出力する関数
const updateParticipantTable = (participants) => {
    latestParticipants = participants; 
    
    renderParticipantDisplay(participants, listBody);
    updateTurnDisplay();
};

// ====== 🌟ページロード時のルーム状態初期フェッチ関数 ======
const fetchInitialRoomState = async () => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('game_state, current_turn_user_id')
            .eq('id', roomId)
            .single();

        if (error) {
            console.error("初期ルーム状態の取得に失敗しました:", error);
            return;
        }

        if (data) {
            currentTurnUserIdCache = data.current_turn_user_id;
            const isPlaying = data.game_state !== null && Object.keys(data.game_state).length > 0;

            if (displayRoomStatus) {
                if (isPlaying) {
                    displayRoomStatus.textContent = 'playing (ゲーム進行中)';
                    if (btnInitialShuffleStart) {
                        btnInitialShuffleStart.disabled = true;
                        btnInitialShuffleStart.textContent = 'ゲーム開始済み';
                    }
                } else {
                    displayRoomStatus.textContent = 'waiting (準備中)';
                    if (btnInitialShuffleStart) {
                        btnInitialShuffleStart.disabled = false;
                        btnInitialShuffleStart.textContent = '🎲 初期シャッフル＆ゲーム開始';
                    }
                }
            }

            if (data.game_state) {
                renderDeckCounts(data.game_state);
            }

            updateTurnDisplay();
        }
    } catch (err) {
        console.error("初期ルーム状態フェッチ例外:", err);
    }
};

// ====== 初期シャッフル＆ゲーム開始 ======
if (btnInitialShuffleStart) {
    btnInitialShuffleStart.addEventListener('click', async () => {
        if (!confirm("初期シャッフルを行ってゲームを開始しますか？")) return;

        try {
            btnInitialShuffleStart.disabled = true;
            btnInitialShuffleStart.textContent = '処理中...';

            const { data, error } = await supabase.rpc('start_game_with_shuffled_decks', {
                p_room_id: roomId,
                p_host_user_id: HOST_USER_ID
            });

            if (error) throw error; 

            if (data.success) {
                alert(data.message);
                btnInitialShuffleStart.textContent = 'ゲーム開始済み';
                
                if (displayRoomStatus) {
                    displayRoomStatus.textContent = 'playing (ゲーム進行中)';
                }

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
                btnInitialShuffleStart.disabled = false;
                btnInitialShuffleStart.textContent = '🎲 初期シャッフル＆ゲーム開始';
            }
        } catch (err) {
            console.error("エラー:", err);
            alert("エラーが発生しました。通信状態を確認してください。");
            btnInitialShuffleStart.disabled = false;
            btnInitialShuffleStart.textContent = '🎲 初期シャッフル＆ゲーム開始';
        }
    });
}
// ===============================================

// ====== 🌟【新設】デッキ個別 手動リシャッフルイベント群 ======
const setupReshuffleEvent = (btnElement, deckType, label) => {
    if (!btnElement) return;
    
    btnElement.addEventListener('click', async () => {
        if (!confirm(`【${label}】の捨て札を回収し、シャッフルして山札に戻します。よろしいですか？`)) return;

        try {
            btnElement.disabled = true;
            btnElement.textContent = '🔄 処理中...';

            const result = await manualReshuffleDeck(roomId, HOST_USER_ID, deckType);
            
            if (result.success) {
                alert(`✅ リシャッフル完了\n【${label}】の山札が再構築されました（${result.new_deck_count}枚）`);
            } else {
                alert(`⚠️ エラー: ${result.error}`);
            }
        } catch (error) {
            console.error(`リシャッフルエラー (${deckType}):`, error);
            alert(`通信エラーが発生しました。`);
        } finally {
            btnElement.disabled = false;
            btnElement.textContent = '🔄 リシャッフル';
        }
    });
};

// 各ボタンに対してイベントを設定
setupReshuffleEvent(btnReshuffleSmallDeal, 'small_deal', 'Small Deal (好機:小)');
setupReshuffleEvent(btnReshuffleBigDeal, 'big_deal', 'Big Deal (好機:大)');
setupReshuffleEvent(btnReshuffleMarket, 'market', 'Market (市場)');
setupReshuffleEvent(btnReshuffleDoodad, 'doodad', 'Doodad (無駄遣い)');
// ===============================================

// 3.「を手番にする」ボタンが押された時の動き
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
            
            inputNextTurnOrder.value = ''; 
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

// ページ起動時に一度サーバーから最新状態を必ず取得して適用
fetchInitialRoomState();

subscribeToParticipants(roomId, updateParticipantTable);

// 部屋（手番情報・ゲーム状態）の変更をリアルタイム監視
subscribeToRoom(roomId, (roomData) => {
    console.log("【ホストDB3】roomsテーブルの更新通知を受信しました。最新状態を再取得します。");
    // 通知が来たら、手番文字列かオブジェクトかに依存せず、
    // 確実にDBから最新の game_state を取ってきて再描画する関数を呼ぶ
    fetchInitialRoomState(); 
});

// 5. 部屋データのリセットボタン
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
            
            inputKickOrder.value = ''; 
        } catch (error) {
            alert('退室処理に失敗しました。');
        } finally {
            btnKickParticipant.disabled = false;
            btnKickParticipant.textContent = '退室させる';
        }
    });
}
