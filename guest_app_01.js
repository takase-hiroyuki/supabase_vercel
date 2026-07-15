// guest_app_01.js

import { roomId } from './config.js';
import { subscribeToParticipants, subscribeToRoom } from './supabase.js';

console.log("【テスト01】初期化・接続検証を開始します。部屋ID:", roomId);

try {
    // 参加者リストのリアルタイム監視テスト
    const participantSubscription = subscribeToParticipants(roomId, (participants) => {
        console.log("【テスト01・受信成功】現在の参加者リスト:", participants);
    });

    // 部屋状態（手番）のリアルタイム監視テスト
    const roomSubscription = subscribeToRoom(roomId, (currentTurnUserId) => {
        console.log("【テスト01・受信成功】現在の手番ユーザーID:", currentTurnUserId);
    });

    console.log("【テスト01】すべてのリアルタイムリスナーが正常に登録されました。エラーはありません。");
} catch (error) {
    console.error("【テスト01・致命的エラー】初期化または接続に失敗しました:", error);
}
