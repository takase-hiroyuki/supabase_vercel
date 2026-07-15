// guest_disp_controls.js

/**
 * 手番および計算検証状態に応じた各種操作ボタンの活性・非活性を制御する関数
 * @param {string|null} currentTurnUserId - 現在の手番ユーザーID
 * @param {string} myUserId - ゲスト自身のユーザーID
 * @param {string|null} turnUserName - 手番ユーザーの名前
 * @param {boolean} isFinancialsLocked - 計算チェックを通過していないロック状態かのフラグ
 * @param {function} onRollDiceClick - サイコロを振るボタンのコールバック
 */
export function updateGameControls(currentTurnUserId, myUserId, turnUserName, isFinancialsLocked, onRollDiceClick) {
    const diceStatusArea = document.getElementById("dice-status-area");
    const rollDiceBtn = document.getElementById("btn-roll-dice");
    
    if (!diceStatusArea || !rollDiceBtn) return;

    // 初期化状態のリセット
    diceStatusArea.style.backgroundColor = "transparent";
    diceStatusArea.style.padding = "0px";

    if (!currentTurnUserId) {
        diceStatusArea.textContent = "手番が設定されていません。";
        rollDiceBtn.disabled = true;
        return;
    }

    if (currentTurnUserId === myUserId) {
        // 自分の手番である場合
        if (isFinancialsLocked) {
            diceStatusArea.textContent = "【手番】あなたの番ですが、財務諸表の計算チェックが完了するまでロックされています。";
            rollDiceBtn.disabled = true;
        } else {
            diceStatusArea.style.backgroundColor = "#fff9c4";
            diceStatusArea.style.padding = "10px";
            diceStatusArea.textContent = "あなたの番です。ボタンを押してください。";
            rollDiceBtn.disabled = false;
        }
    } else {
        // 他人の手番である場合
        const nameDisplay = turnUserName || currentTurnUserId;
        diceStatusArea.textContent = `現在は、[${nameDisplay}] の番です。`;
        rollDiceBtn.disabled = true;
    }
}
