// guest_state.js       (新設：未請求のPaycheck状態や手番判定などのデータ管理)

/**
 * ゲスト画面のゲーム進行状態を管理するクラス
 */
class GuestStateManager {
    constructor() {
        this.latestParticipants = [];
        this.currentTurnUserIdCache = null;
        this.myUserId = null;
        this.pendingSalary = 0; // 未請求のPaycheck額（もらい忘れ判定用）
        this.currentCardCache = null; // 🌟【追加】現在部屋で開かれているカードデータをキャッシュするプロパティ
    }

    // 自分のユーザーIDを設定
    setMyUserId(userId) {
        this.myUserId = userId;
    }

    // 同期された参加者データを更新
    setParticipants(participants) {
        this.latestParticipants = participants;
    }

    // 同期された現在のターン（ユーザーID）を更新
    setCurrentTurnUserId(userId) {
        this.currentTurnUserIdCache = userId;
    }

    // 自分のデータを取得
    getMyData() {
        if (!this.myUserId) return null;
        return this.latestParticipants.find(p => p.user_id === this.myUserId) || null;
    }

    // 自分が手番かどうかを判定
    isMyTurn() {
        if (!this.myUserId || !this.currentTurnUserIdCache) return false;
        return this.currentTurnUserIdCache === this.myUserId;
    }

    // 自分が計算検証ロック中かどうかを判定
    isFinancialsLocked() {
        const myData = this.getMyData();
        return myData && myData.state ? (myData.state.is_calculating ?? false) : false;
    }

    // 未請求のPaycheck額を設定・取得・クリア
    getPendingSalary() {
        return this.pendingSalary;
    }

    setPendingSalary(amount) {
        this.pendingSalary = amount;
    }

    clearPendingSalary() {
        this.pendingSalary = 0;
    }

    // 次のプレイヤーのユーザーIDを計算して取得
    getNextTurnUserId() {
        if (this.latestParticipants.length === 0 || !this.myUserId) return null;
        const myIndex = this.latestParticipants.findIndex(p => p.user_id === this.myUserId);
        if (myIndex === -1) return null;
        
        const nextIndex = (myIndex + 1) % this.latestParticipants.length;
        return this.latestParticipants[nextIndex].user_id;
    }
}

// 単一のインスタンスをエクスポートしてアプリ全体で状態を共有
export const guestState = new GuestStateManager();
