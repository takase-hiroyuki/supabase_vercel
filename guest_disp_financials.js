// guest_disp_financials.js

/**
 * 財務諸表（損益計算書・貸借対照表）を表示する関数
 * 計算チェックのための入力項目と検証ロジックを提供する
 * @param {object} playerState - 表示対象プレイヤーの state オブジェクト
 * @param {boolean} isReadOnly - 読み取り専用（他プレイヤーの閲覧時）かどうかのフラグ
 * @param {function} onVerifySuccess - 計算チェック合致時に呼び出すコールバック
 * @param {function} onVerifyFailure - 計算チェック不一致時に呼び出すコールバック
 */
export function renderFinancials(playerState, isReadOnly, onVerifySuccess, onVerifyFailure) {
    const financials = playerState.financials;
    const container = document.getElementById("financials-container");
    if (!container) return;

    // プログラム内部で論理的に正しい合計値を算出（検証用）
    const correctTotalIncome = (financials.income.salary || 0) + (financials.income.passive || 0);
    
    let correctTotalExpenses = 0;
    Object.keys(financials.expenses).forEach(key => {
        if (key !== 'total') {
            correctTotalExpenses += (financials.expenses[key] || 0);
        }
    });
    
    const correctCashflow = correctTotalIncome - correctTotalExpenses;

    let correctTotalAssets = 0; // 拡張用ロジックのプレースホルダー
    let correctTotalLiabilities = 0;
    Object.keys(financials.liabilities).forEach(key => {
        if (key !== 'total') {
            correctTotalLiabilities += (financials.liabilities[key] || 0);
        }
    });

    // スタイルシートを使わないHTML標準要素のみの生成
    container.innerHTML = `
        <fieldset>
            <legend>${playerState.name}の財務諸表（職業: ${playerState.profession} / 現在資金: $${financials.cash}）</legend>
            
            <h3>【損益計算書】</h3>
            <p>給与: $${financials.income.salary} | 不労所得: $${financials.income.passive}</p>
            <label>総収入入力欄: </label>
            <input type="number" id="input-total-income" ${isReadOnly ? 'readonly' : ''} value="${isReadOnly ? correctTotalIncome : ''}"><br>
            
            <p>税金: $${financials.expenses.taxes} | 住宅ローン: $${financials.expenses.mortgage_payment} | 車ローン: $${financials.expenses.car_loan_payment} | その他: $${financials.expenses.other}</p>
            <label>総支出入力欄: </label>
            <input type="number" id="input-total-expenses" ${isReadOnly ? 'readonly' : ''} value="${isReadOnly ? correctTotalExpenses : ''}"><br>
            
            <label>毎月のキャッシュフロー入力欄: </label>
            <input type="number" id="input-cashflow" ${isReadOnly ? 'readonly' : ''} value="${isReadOnly ? correctCashflow : ''}"><br>

            <h3>【貸借対照表】</h3>
            <label>負債合計入力欄: </label>
            <input type="number" id="input-total-liabilities" ${isReadOnly ? 'readonly' : ''} value="${isReadOnly ? correctTotalLiabilities : ''}"><br>
            
            ${isReadOnly ? '' : '<button type="button" id="btn-check-financials">計算チェック</button>'}
            <p id="financials-feedback-message"></p>
        </fieldset>
    `;

    if (isReadOnly) {
        // 他プレイヤー閲覧時は常にロック解除扱いに設定
        onVerifySuccess();
        return;
    }

    // 計算チェックボタンのイベントリスナー設定
    const checkBtn = document.getElementById("btn-check-financials");
    if (checkBtn) {
        checkBtn.addEventListener("click", () => {
            const userIncome = parseInt(document.getElementById("input-total-income").value, 10);
            const userExpenses = parseInt(document.getElementById("input-total-expenses").value, 10);
            const userCashflow = parseInt(document.getElementById("input-cashflow").value, 10);
            const userLiabilities = parseInt(document.getElementById("input-total-liabilities").value, 10);

            const feedback = document.getElementById("financials-feedback-message");

            if (userIncome === correctTotalIncome && 
                userExpenses === correctTotalExpenses && 
                userCashflow === correctCashflow && 
                userLiabilities === correctTotalLiabilities) {
                feedback.textContent = "【検証】計算が合致しました。主要な操作ロックを解除します。";
                onVerifySuccess();
            } else {
                feedback.textContent = "【エラー】計算結果が正しくありません。電卓等で確認の上、修正してください。";
                onVerifyFailure();
            }
        });
    }
}
