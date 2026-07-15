// guest_app_04.js

import { roomId } from './config.js';
import { getFromStorage } from './storage.js';
import { subscribeToParticipants, subscribeToRoom } from './supabase.js';
import { refreshGuestUI } from './guest_disp.js';

console.log("【テスト04】財務手動計算チェックおよびアクションロック検証を開始します。");

const myUserId = getFromStorage('user_id') || 'user_dummy_test';
let currentParticipants = [];
let currentTurnId = null;

// 財務計算のロック状態を管理する内部状態フラグ（初期値はロック状態）
let isFinancialsLocked = true;

const testCallbacks = {
    onRollDice: () => console.log("【アクション】サイコロのロールが許可されました！"),
    onVerifySuccess: () => {
        console.log("【ロジック】正解を検知。ロックを解除して再描画します。");
        isFinancialsLocked = false;
        render(); // ロック解除状態を反映するために再描画
    },
    onVerifyFailure: () => {
        console.log("【ロジック】不正解を検知。ロックを維持または再適用します。");
        isFinancialsLocked = true;
        render();
    },
    onCardAction: (action) => console.log("カードアクション:", action)
};

function render() {
    refreshGuestUI(
        currentParticipants,
        currentTurnId,
        myUserId,
        myUserId,
        isFinancialsLocked, // ロック状態をUIへ注入
        null,
        testCallbacks
    );
}

subscribeToParticipants(roomId, (participants) => {
    currentParticipants = participants;
    render();
});

subscribeToRoom(roomId, (currentTurnUserId) => {
    currentTurnId = currentTurnUserId;
    render();
});
