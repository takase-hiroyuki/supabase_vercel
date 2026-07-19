// guest_disp_financials.js

/**
 * 財務諸表（損益計算書・貸借対照表）を表示・バインドする関数
 * 静的な index.html の要素に対して値を代入し、状態に応じた制御を行う
 * @param {object} playerState - 表示対象プレイヤーの state オブジェクト
 * @param {boolean} isReadOnly - 読み取り専用（他プレイヤーの閲覧時）かどうかのフラグ
 * @param {function} onVerifySuccess - 計算チェック合致時に呼び出すコールバック
 * @param {function} onVerifyFailure - 計算チェック不一致時に呼び出すコールバック
 */
export function renderFinancials(playerState, isReadOnly, onVerifySuccess, onVerifyFailure) {
    const financials = playerState.financials;

    // index.html に存在する静的要素の取得
    const calcPhaseName = document.getElementById("calc-phase-name");
    const calcLockStatus = document.getElementById("calc-lock-status");
    const displaySalary = document.getElementById("display-salary");
    const displayPassiveIncome = document.getElementById("display-passive-income");
    const displayTotalExpenses = document.getElementById("display-total-expenses");
    
    const inputTotalIncome = document.getElementById("input-total-income");
    const inputNetCashflow = document.getElementById("input-net-cashflow");
    const btnCheckCalculations = document.getElementById("btn-check-calculations");

    // 要素が存在しない場合は処理を中断
    if (!inputTotalIncome || !inputNetCashflow || !btnCheckCalculations) return;

    // --- 1. テキスト情報の代入 ---
    if (calcPhaseName) {
        // 現在の計算フェーズ（income_tax 等）を表示用にマッピング（必要に応じて日本語名へ）
        calcPhaseName.textContent = playerState.calculation_phase || "未定";
    }

    if (calcLockStatus) {
        if (playerState.is_calculating) {
            calcLockStatus.textContent = isReadOnly ? "他プレイヤーが計算検証中..." : "計算検証待ち (ロック中)";
            calcLockStatus.style.color = "red";
        } else {
            calcLockStatus.textContent = "計算完了 (解除済み)";
            calcLockStatus.style.color = "green";
        }
    }

    // 基本財務データの表示更新
    if (displaySalary) displaySalary.textContent = financials.income.salary || 0;
    if (displayPassiveIncome) displayPassiveIncome.textContent = financials.income.passive || 0;
    
    // 総支出の計算と表示
    let correctTotalExpenses = 0;
    Object.keys(financials.expenses).forEach(key => {
        if (key !== 'total') {
            correctTotalExpenses += (financials.expenses[key] || 0);
        }
    });
    if (displayTotalExpenses) displayTotalExpenses.textContent = correctTotalExpenses;

    // --- 2. 閲覧モード（自分か他人か）および計算状態による制御 ---
    if (isReadOnly || !playerState.is_calculating) {
        // 他人の画面を見ている、または既に計算が完了している場合は入力とボタンをロック
        inputTotalIncome.disabled = true;
        inputNetCashflow.disabled = true;
        btnCheckCalculations.disabled = true;
        
        // 既に計算完了している場合は、参考値として正解を最初から入れておくなどのケア
        if (!playerState.is_calculating) {
            const correctTotalIncome = (financials.income.salary || 0) + (financials.income.passive || 0);
            inputTotalIncome.value = correctTotalIncome;
            inputNetCashflow.value = correctTotalIncome - correctTotalExpenses;
        }
    } else {
        // 自分の手番かつ計算フェーズ中の場合は入力を許可
        inputTotalIncome.disabled = false;
        inputNetCashflow.disabled = false;
        btnCheckCalculations.disabled = false;
    }

    // --- 3. 計算チェックボタンのイベントバインド ---
    // 重複登録を防ぐため、一度イベントリスナーをクリアして再設定する
    btnCheckCalculations.onclick = null;
    btnCheckCalculations.onclick = () => {
        // 入力値の取得（空文字の場合は0として扱う）
        const userTotalIncome = parseInt(inputTotalIncome.value, 10) || 0;
        const userNetCashflow = parseInt(inputNetCashflow.value, 10) || 0;

        // プログラム内部での正解判定ロジック
        const correctTotalIncome = (financials.income.salary || 0) + (financials.income.passive || 0);
        const correctCashflow = correctTotalIncome - correctTotalExpenses;

        // 検証
        if (userTotalIncome === correctTotalIncome && userNetCashflow === correctCashflow) {
            onVerifySuccess();
        } else {
            let errorMsg = "計算が正しくありません。\n";
            if (userTotalIncome !== correctTotalIncome) errorMsg += "・総収入の計算が違います。\n";
            if (userNetCashflow !== correctCashflow) errorMsg += "・キャッシュフローの計算が違います。\n";
            onVerifyFailure(errorMsg);
        }
    };
}
