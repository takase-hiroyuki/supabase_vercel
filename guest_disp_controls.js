// guest_disp_controls.js

// ⭕️ 正しいファイル名「dom_selectors.js」からインポート
import { DOM_SELECTORS } from './dom_selectors.js';

/**
 * 手番および計算検証状態に応じた各種操作ボタンの活性・非活性を制御する関数
 * @param {string|null} currentTurnUserId - 現在の手番ユーザーID
 * @param {string} myUserId - ゲスト自身のユーザーID
 * @param {string|null} turnUserName - 手番ユーザーの名前
 * @param {boolean} isFinancialsLocked - 計算チェックを通過していないロック状態かのフラグ
 * @param {object|null} myState - ゲスト自身のデータベース上の最新ステータス
 * @param {number} pendingSalary - 🌟【新規追加】現在保留中（未請求）の給料額
 * @param {function} onRollDiceClick - サイコロを振るボタンのコールバック
 */
export function updateGameControls(
    currentTurnUserId, 
    myUserId, 
    turnUserName, 
    isFinancialsLocked, 
    myState, 
    pendingSalary, // 🌟 引数を追加して競合を防御
    onRollDiceClick
) {
    const SEL_C = DOM_SELECTORS.GUEST.CONTROLS;
    
    const diceStatusArea = document.getElementById(SEL_C.STATUS_AREA);
    const rollDiceBtn = document.getElementById(SEL_C.BTN_ROLL_DICE);
    const btnClaimPaycheck = document.getElementById(SEL_C.BTN_CLAIM_PAYCHECK);
    const btnEndTurn = document.getElementById(SEL_C.BTN_END_TURN);
    
    if (!diceStatusArea || !rollDiceBtn || !btnClaimPaycheck || !btnEndTurn) return;

    // 1. 部屋の手番自体が未設定の初期状態
    if (!currentTurnUserId) {
        diceStatusArea.textContent = "部屋の手番設定を確認中、または初期化されていません。";
        rollDiceBtn.disabled = true;
        btnClaimPaycheck.disabled = true;
        btnEndTurn.disabled = true;
        return;
    }

    const isMyTurn = (currentTurnUserId === myUserId);

    // 2. 自分の手番である場合の厳密な状態遷移・disabled制御（教育的アプローチ）
    if (isMyTurn) {
        if (isFinancialsLocked) {
            // 【財務ロック状態】手番だが、まず手動計算チェックをパスしなければいけない
            diceStatusArea.textContent = "【手番】あなたの番ですが、財務諸表の手動計算チェックが完了するまでロックされています。下の計算入力を完了してください。";
            rollDiceBtn.disabled = true;
            btnClaimPaycheck.disabled = true;
            btnEndTurn.disabled = true;
        } 
        else if (myState && myState.last_dice > 0) {
            // 【ポストロール状態】すでにサイコロを振った後の状態
            
            rollDiceBtn.disabled = true; // 同一手番内の多重ロールを厳格にチート防止ロック
            btnEndTurn.disabled = false; // 手番終了はいつでも可能
            
            // 🌟【ここを修正】保留中の給料がある場合のみボタンを解放し、もらい忘れ没収の権利を残す
            if (pendingSalary > 0) {
                diceStatusArea.textContent = `【手番】サイコロを振りました（出目: ${myState.last_dice}）。まだPaycheck（+$${pendingSalary}）が未請求です！請求ボタンを押してから手番を終了してください。`;
                btnClaimPaycheck.disabled = false;
                btnClaimPaycheck.textContent = `Paycheckを請求する (+$${pendingSalary})`;
            } else {
                // すでに請求済みの場合は、リアルタイム同期による上書きをブロックしてグレーアウトを維持
                diceStatusArea.textContent = `【手番】サイコロを振りました（出目: ${myState.last_dice}）。Paycheckの処理は完了しています。カード取引やローン調整を行い、最後に手番を終了してください。`;
                btnClaimPaycheck.disabled = true; 
                btnClaimPaycheck.textContent = `Paycheckを請求する`;
            }
        } 
        else {
            // 【プリロール状態】自分の手番で、まだサイコロを振っていない状態
            diceStatusArea.textContent = "あなたの手番です。サイコロを振して移動してください。";
            
            rollDiceBtn.disabled = false;
            btnClaimPaycheck.disabled = true; // サイコロを振る前にPaycheckは請求できない
            btnEndTurn.disabled = true;       // 移動前に手番を終わらせることはできない
            btnClaimPaycheck.textContent = `Paycheckを請求する`;
        }
    } 
    // 3. 他人の手番である場合の制御
    else {
        const nameDisplay = turnUserName || "他のプレイヤー";
        diceStatusArea.textContent = `現在、[${nameDisplay}] が手番をプレイ中です。あなたの画面はモニターモードです。`;
        
        // 他人の手番中は、手番コントロール系のアクションは一律ですべて無効化（押せないけれどそこに見える状態）
        rollDiceBtn.disabled = true;
        btnClaimPaycheck.disabled = true;
        btnEndTurn.disabled = true;
    }
}
