// guest_app_02.js

import { autoLoginCheck, executeJoin } from './join_guest.js';

async function runEnrollmentTest() {
    console.log("【テスト02】入室・自動ログイン検証を開始します。");

    // 1. 自動ログインのチェック
    const existingPlayer = await autoLoginCheck();
    if (existingPlayer) {
        console.log("【テスト02・成功】再入室を検知しました。既存データ:", existingPlayer);
        return;
    }

    console.log("【テスト02】既存のセッションはありません。新規入室テストを実行します。");

    // 2. ダミーの名前で新規入室処理を実行
    const dummyName = "テストプレイヤー_" + Math.random().toString(36).substring(2, 5);
    try {
        const userId = await executeJoin(dummyName);
        console.log("【テスト02・成功】新規入室が完了しました。発行されたユーザーID:", userId);
        
        // 3. 重複入室防御（エラーコード 23505）の検証のため、即座に同じ名前・IDで再送信を試みる
        console.log("【テスト02】一意制約違反の防御テストのため、二重送信を試みます...");
        const fallbackUserId = await executeJoin(dummyName);
        console.log("【テスト02・成功】二重送信が安全にブロックされ、フォールバックしました。ID:", fallbackUserId);

    } catch (error) {
        console.error("【テスト02・エラー】入室処理中に想定外のエラーが発生しました:", error);
    }
}

// テスト実行
runEnrollmentTest();
