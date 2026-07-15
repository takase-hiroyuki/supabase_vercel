// guest_app_03.js

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToParticipants, subscribeToRoom } from './supabase.js';
import { refreshGuestUI } from './guest_disp.js';

console.log("【テスト03】手番監視およびUIハブ分配検証を開始します。");

const myUserId = getFromStorage('user_id') || 'user_dummy_test';
let currentParticipants = [];
let currentTurnId = null;

// UIから呼び出されるダミーのコールバックオブジェクト
const dummyCallbacks = {
    onRollDice: () => console.log("【テスト03】サイコロボタンが押されました。"),
    onVerifySuccess: () => console.log("【テスト03】計算チェック成功コールバックがトリガーされました。"),
    onVerifyFailure: () => console.log("【テスト03】計算チェック不一致コールバックがトリガーされました。"),
    onCardAction: (actionType) => console.log(`【テスト03】カードアクション [${actionType}] がトリガーされました。`)
};

function render() {
    console.log("【テスト03】refreshGuestUI を呼び出します。手番:", currentTurnId, "自分:", myUserId);
    refreshGuestUI(
        currentParticipants,
        currentTurnId,
        myUserId,
        myUserId, // 自分の財務諸表を表示
        false,    // ロックは暫定で解除状態とする
        null,     // カードデータは無し
        dummyCallbacks
    );
}

// 同期受信の結合
subscribeToParticipants(roomId, (participants) => {
    currentParticipants = participants;
    render();
});

subscribeToRoom(roomId, (currentTurnUserId) => {
    currentTurnId = currentTurnUserId;
    render();
});
