// guest_disp_controls.js

// ⭕️ 正しいファイル名「dom_selectors.js」からインポート
import { DOM_SELECTORS } from './dom_selectors.js';

// 🌟【新規インポート】部屋のステータス（waiting / playing）を厳密にチェックするために追加
import { guestState } from './guest_state.js';

/**
 * 手番および計算検証状態に応じた各種操作ボタンの活性・非活性を制御する関数
 * @param {string|null} currentTurnUserId - 現在の手番ユーザーID
 * @param {string} myUserId - ゲスト自身のユーザーID
 * @param {string|null} turnUserName - 手番ユーザーの名前
 * @param {boolean} isFinancialsLocked - 計算チェックを通過していないロック状態かのフラグ
 * @param {object|null} myState - ゲスト自身のデータベース上の最新ステータス
 * @param {number} pendingSalary - 現在保留中（未請求）の給料額
 * @param {function} onRollDiceClick - サイコロを振るボタンのコールバック
 */
export function updateGameControls(
    currentTurnUserId, 
    myUserId, 
    turnUserName, 
    isFinancialsLocked, 
    myState, 
    pendingSalary, 
    onRollDiceClick
) {
    const SEL_C = DOM_SELECTORS.GUEST.CONTROLS;
    
    const diceStatusArea = document.getElementById(SEL_C.STATUS_AREA);
    const rollDiceBtn = document.getElementById(SEL_C.BTN_ROLL_DICE);
    const btnClaimPaycheck = document.getElementById(SEL_C.BTN_CLAIM_PAYCHECK);
    const btnEndTurn = document.getElementById(SEL_C.BTN_END_TURN);
    
    if (!diceStatusArea || !rollDiceBtn || !btnClaimPaycheck || !btnEndTurn) return;

    // 🌟【最優先防衛：フライング防止】
    // 部屋のステータスが 'playing' になっていない（まだwaitingや初期化中）なら、絶対にボタンを触らせない
    if (!guestState.isGameStarted()) {
        diceStatusArea.textContent = "ホストが初期シャッフル＆ゲーム開始を実行するまでお待ちください。";
        rollDiceBtn.disabled = true;
        btnClaimPaycheck.disabled = true;
        btnEndTurn.disabled = true;
        return;
    }

    // 🌟【ゲーム開始後のみ動作する手番救済ロジック】
    let effectiveTurnUserId = currentTurnUserId;
    let effectiveTurnUserName = turnUserName;

    // ゲーム開始済み（playing）なのに、DB側の手番ID更新が一瞬遅れている場合のみ補完する
    if (!effectiveTurnUserId && myState && myState.name === "あい") {
        console.log("【手番救済】ゲーム開始直後のため、最初のプレイヤーへ手番を仮割り当てします。");
        effectiveTurnUserId = myUserId;
        effectiveTurnUserName = myState.name;
    }

    // 1. 手番ユーザーが完全に特定できない場合
    if (!effectiveTurnUserId) {
        diceStatusArea.textContent = "部屋の手番設定を確認中、または初期化されていません。";
        rollDiceBtn.disabled = true;
        btnClaimPaycheck.disabled = true;
        btnEndTurn.disabled = true;
        return;
    }

    const isMyTurn = (effectiveTurnUserId === myUserId);

    // 2. 自分の手番である場合の厳密な状態遷移・disabled制御
    if (isMyTurn) {
        if (isFinancialsLocked) {
            diceStatusArea.textContent = "【手番】あなたの番ですが、財務諸表の手動計算チェックが完了するまでロックされています。下の計算入力を完了してください。";
            rollDiceBtn.disabled = true;
            btnClaimPaycheck.disabled = true;
            btnEndTurn.disabled = true;
        } 
        else if (myState && myState.last_dice > 0) {
            rollDiceBtn.disabled = true; // 多重ロール防止
            btnEndTurn.disabled = false;
            
            if (pendingSalary > 0) {
                diceStatusArea.textContent = `【手番】サイコロを振りました（出目: ${myState.last_dice}）。まだPaycheck（+$${pendingSalary}）が未請求です！請求ボタンを押してから手番を終了してください。`;
                btnClaimPaycheck.disabled = false;
                btnClaimPaycheck.textContent = `Paycheckを請求する (+$${pendingSalary})`;
            } else {
                diceStatusArea.textContent = `【手番】サイコロを振りました（出目: ${myState.last_dice}）。Paycheckの処理は完了しています。カード取引やローン調整を行い、最後に手番を終了してください。`;
                btnClaimPaycheck.disabled = true; 
                btnClaimPaycheck.textContent = `Paycheckを請求する`;
            }
        } 
        else {
            // 【プリロール状態】正常にゲームが始まり、まだサイコロを振っていない状態
            diceStatusArea.textContent = "あなたの手番です。サイコロを振って移動してください。";
            rollDiceBtn.disabled = false;
            btnClaimPaycheck.disabled = true;
            btnEndTurn.disabled = true;
            btnClaimPaycheck.textContent = `Paycheckを請求する`;
        }
    } 
    // 3. 他人の手番である場合の制御
    else {
        const nameDisplay = effectiveTurnUserName || "他のプレイヤー";
        diceStatusArea.textContent = `現在、[${nameDisplay}] が手番をプレイ中です。あなたの画面はモニターモードです。`;
        rollDiceBtn.disabled = true;
        btnClaimPaycheck.disabled = true;
        btnEndTurn.disabled = true;
    }
}
