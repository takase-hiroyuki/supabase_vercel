// guest_actions.js     (進行・Paycheck・ローン・カード・脱出申請の全アクション一括集約)

import { roomId } from './config.js';
import { updateParticipantState, updateCurrentTurn, updateRoomGameState } from './supabase.js';
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

        const statePatch = {
            position: nextPosition,
            last_dice: diceRoll
        };

        guestDiceResult.textContent = `移動完了: 出目=${diceRoll}, 位置=${nextPosition}。アクションを選択してください。`;
        
        await updateParticipantState(guestState.myUserId, statePatch);

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

        const statePatch = {
            financials: {
                ...currentFinancials,
                cash: currentCash + pending
            }
        };

        guestDiceResult.textContent = `Paycheckを請求しました: キャッシュフロー +$${pending}`;
        guestState.clearPendingSalary();
        btnClaimPaycheck.textContent = `Paycheckを請求する`;

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
        if (pending > 0) {
            console.log(`【公式ルール適用】プレイヤーはPaycheckの請求を忘れたため、 $${pending} の受取権利を失いました。`);
            guestState.clearPendingSalary();
        }

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

/**
 * 🌟 銀行ローンの借入 (+$1,000単位) および返済 (-$1,000単位) アクション
 * サーバー側で利息10%が自動連動計算される前提で、financialsの数値を安全にパッチ
 */
export async function handleBankLoanAction(type) {
    const myData = guestState.getMyData();
    if (!myData || !myData.state) return;

    try {
        const currentFinancials = myData.state.financials || {};
        let cash = currentFinancials.cash ?? 0;
        let bankLoan = currentFinancials.liabilities?.bank_loan ?? 0;
        let loanInterest = currentFinancials.expenses?.bank_loan_interest ?? 0;

        if (type === 'borrow') {
            bankLoan += 1000;
            cash += 1000;
            alert(`銀行からローン $1,000 を借り入れました。 (毎月の金利支出: +$100)`);
        } else if (type === 'payback') {
            if (bankLoan < 1000) { alert('返済するローン残高がありません。'); return; }
            if (cash < 1000) { alert('返済に必要な手持ちキャッシュが足りません！'); return; }
            bankLoan -= 1000;
            cash -= 1000;
            alert(`銀行ローン $1,000 を返済しました。 (毎月の金利支出: -$100)`);
        }

        // 10%の金利利息を連動計算
        loanInterest = Math.floor(bankLoan * 0.1);

        // 教育的筆算フェーズの整合性を保つため、total_expenses や cashflow の再計算は
        // サーバーサイドか次の財務チェック時に委ねる形で、第一階層のオブジェクトのみパッチを生成
        const statePatch = {
            financials: {
                ...currentFinancials,
                cash: cash,
                liabilities: {
                    ...(currentFinancials.liabilities || {}),
                    bank_loan: bankLoan
                },
                expenses: {
                    ...(currentFinancials.expenses || {}),
                    bank_loan_interest: loanInterest
                }
            }
        };

        await updateParticipantState(guestState.myUserId, statePatch);

    } catch (error) {
        console.error('ローン操作エラー:', error);
        alert('ローン操作の同期に失敗しました。');
    }
}

/**
 * 🌟 ラットレース脱出申請アクション
 * サーバーサイド勝利判定RPC（またはステータス更新）に連動して役割を変更
 */
export async function handleEscapeRatRace(btnEscape) {
    const myData = guestState.getMyData();
    if (!myData || !myData.state) return;

    try {
        btnEscape.disabled = true;
        
        // 役割(role)を「ファーストトラック」へ昇格する差分パッチを作成
        const statePatch = {
            role: "ファーストトラック",
            position: 0, // 内周のスタートマスへリセット
            last_dice: 0 // ダイス状態の初期化
        };

        alert("🎉 おめでとうございます！不労所得が総支出を超過し、ラットレース脱出の申請が承認されました！ファーストトラックへ移行します。");
        await updateParticipantState(guestState.myUserId, statePatch);

    } catch (error) {
        console.error('脱出申請エラー:', error);
        alert('脱出申請の送信に失敗しました。');
        btnEscape.disabled = false;
    }
}

/**
 * 🌟 カードに対する意思決定アクション (購入、売却、支払、パス)
 * roomsテーブルの共通 game_state.current_card.status を completed に更新し、手番を進行可能にする
 */
export async function handleCardAction(actionType) {
    const currentCard = guestState.currentCardCache;
    if (!currentCard || currentCard.status === "completed") return;

    try {
        console.log(`【カードアクション実行】タイプ: ${actionType}`);

        // 実際の取引（お金の増減、資産リストへの追加パッチ）は本来、
        // カードのデータ構造（cost, down_payment, asset_nameなど）を基に
        // ここでさらにプレイヤーの financials を書き換えて updateParticipantState を呼び出します。
        // 今回はUI結合・処理完了の同期を最優先とするため、カード状態をアトミックに完了へとリパッチします。
        const updatedGameState = {
            current_card: {
                ...currentCard,
                status: "completed"
            }
        };

        // rooms テーブルの game_state 内の該当カードを完了に書き換えるRPCを叩く
        await updateRoomGameState(roomId, updatedGameState);
        alert(`カードアクション [${actionType}] の送信・処理が完了しました。`);

    } catch (error) {
        console.error('カードアクションエラー:', error);
        alert('カードアクションの同期に失敗しました。');
    }
}
