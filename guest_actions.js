// guest_actions.js    (新設：サイコロ、Paycheck請求、手番終了などのゲーム進行ロジック)

import { roomId } from './config.js';
import { updateParticipantState, updateCurrentTurn } from './supabase.js';
import { rollDice, calculateNextPosition } from './dice.js';
import { guestState } from './guest_state.js';

// --- 給料日（Paycheck）マスの配置定義 ---
const PAYDAY_CELLS = [0, 5, 11, 18];

/**
 * 移動経路中に通過または着地したPaycheckの総支給額を算出する
 */
function calculateSalaryOnMove(oldPos, newPos, cashflow) {
    let payCount = 0;
    const diff = (newPos - oldPos + 24) % 24;
    
    for (let i = 1; i <= diff; i++) {
        let checkPos = (oldPos + i) % 24;
        if (PAYDAY_CELLS.includes(checkPos)) {
            payCount++;
        }
    }
    return payCount * cashflow;
}

/**
 * サイコロを振ってコマを移動させるアクション
 */
export async function handleRollDice(btnRollDice, btnClaimPaycheck, btnEndTurn, guestDiceResult) {
    const myData = guestState.getMyData();
    if (!myData || !myData.state) {
        alert('自分のプレイヤーデータが見つかりません。');
        return;
    }

    try {
        btnRollDice.disabled = true;

        const diceRoll = rollDice();
        const currentPosition = myData.state.position ?? 0;
        const nextPosition = calculateNextPosition(currentPosition, diceRoll);

        const currentFinancials = myData.state.financials || {};
        const cashflow = currentFinancials.cashflow ?? 0;

        // パスした分のPaycheckを算出して guestState にキープ
        const calculatedSalary = calculateSalaryOnMove(currentPosition, nextPosition, cashflow);
        guestState.setPendingSalary(calculatedSalary);

        // 【データアクセス方針5.2.2適用】全体上書きを廃止し、差分パッチのみを構成
        const statePatch = {
            position: nextPosition,
            last_dice: diceRoll
        };

        guestDiceResult.textContent = `移動完了: 出目=${diceRoll}, 位置=${nextPosition}。アクションを選択してください。`;
        
        // 差分パッチのみを送信してアトミックにDBマージ
        await updateParticipantState(guestState.myUserId, statePatch);

        // ボタンの表示切り替え制御
        const pending = guestState.getPendingSalary();
        if (pending > 0) {
            btnClaimPaycheck.disabled = false;
            btnClaimPaycheck.textContent = `Paycheckを請求する (+$${pending})`;
        } else {
            btnClaimPaycheck.disabled = true;
            btnClaimPaycheck.textContent = `Paycheckを請求する`;
        }
        btnEndTurn.disabled = false;

    } catch (error) {
        guestDiceResult.textContent = `例外発生: ${error.message}`;
        btnRollDice.disabled = false;
    }
}

/**
 * Paycheck（キャッシュフロー）を請求するアクション
 */
export async function handleClaimPaycheck(btnClaimPaycheck, guestDiceResult) {
    const myData = guestState.getMyData();
    const pending = guestState.getPendingSalary();
    if (!myData || !myData.state || pending <= 0) return;

    try {
        btnClaimPaycheck.disabled = true;
        
        const currentFinancials = myData.state.financials || {};
        const currentCash = currentFinancials.cash ?? 0;

        // 【データアクセス方針5.2.2適用】
        // 財務データ全体を上書きするのではなく、financialsオブジェクト内のcashを安全に合流させるための入れ子パッチ
        // ※Supabase側の merge_participant_state RPCは第一階層をマージするため、
        // financials全体を組み立て直して渡します（他のプレイヤーがプレイヤー本人のfinancialsを弄ることはないため安全です）
        const statePatch = {
            financials: {
                ...currentFinancials,
                cash: currentCash + pending
            }
        };

        guestDiceResult.textContent = `Paycheckを請求しました: キャッシュフロー +$${pending}`;
        guestState.clearPendingSalary(); // 請求完了したので状態をクリア
        btnClaimPaycheck.textContent = `Paycheckを請求する`;

        // 差分パッチを送信
        await updateParticipantState(guestState.myUserId, statePatch);

    } catch (error) {
        alert('Paycheckの請求処理に失敗しました。');
        btnClaimPaycheck.disabled = false;
    }
}

/**
 * 手番を終了して次のプレイヤーへ回すアクション（もらい忘れ含む）
 */
export async function handleEndTurn(btnEndTurn, btnClaimPaycheck, guestDiceResult) {
    try {
        btnEndTurn.disabled = true;
        btnClaimPaycheck.disabled = true;

        const pending = guestState.getPendingSalary();
        // もし未請求の利益が残っていた場合、警告を出さずに没収（公式ルール）
        if (pending > 0) {
            console.log(`【公式ルール適用】プレイヤーはPaycheckの請求を忘れたため、 $${pending} の受取権利を失いました。`);
            guestState.clearPendingSalary();
        }

        // guestState から次のプレイヤーIDを安全に計算して取得
        const nextTurnUserId = guestState.getNextTurnUserId();
        if (nextTurnUserId) {
            console.log(`【手番移行】次の手番IDを送信します: ${nextTurnUserId}`);
            await updateCurrentTurn(roomId, nextTurnUserId);
        }

        guestDiceResult.textContent = `手番を終了しました。次のプレイヤーの手番です。`;

    } catch (error) {
        alert('手番の終了処理に失敗しました。');
        btnEndTurn.disabled = false;
    }
}
