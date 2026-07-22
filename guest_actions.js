// guest_actions.js     (進行・Paycheck・ローン・カード・脱出申請の全アクション一括集約)

import { roomId } from './config.js';
// 🌟 supabase.js から購入用RPC関数を追加インポート
import { 
    updateParticipantState, 
    updateCurrentTurn, 
    updateRoomGameState, 
    drawCard, 
    processFinancialTransaction,
    buyRealEstateAsset,
    buyStockAsset,
    sellStockAsset
} from './supabase.js';
import { rollDice, calculateNextPosition } from './dice.js';
import { guestState } from './guest_state.js';

// --- 給料日（Paycheck）マスの配置定義 ---
const PAYDAY_CELLS = [0, 5, 11, 18];

// 🌟 --- ラットレースのマス定義（全24マス） ---
const BOARD_CELLS = [
    'paycheck',    // 00ＣＦ
    'doodad',      // 01娯楽
    'opportunity', // 02好機
    'charity',     // 03寄付
    'opportunity', // 04好機
    'paycheck',    // 05ＣＦ
    'opportunity', // 06好機
    'doodad',      // 07娯楽
    'opportunity', // 08好機
    'baby',        // 09子供
    'opportunity', // 10好機
    'paycheck',    // 11ＣＦ
    'market',      // 12市場
    'opportunity', // 13好機
    'doodad',      // 14娯楽
    'opportunity', // 15好機
    'charity',     // 16寄付
    'opportunity', // 17好機
    'paycheck',    // 18ＣＦ
    'opportunity', // 19好機
    'downsized',   // 20解雇
    'opportunity', // 21好機
    'market',      // 22市場
    'opportunity'  // 23好機
];

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
    if (!guestState.isGameStarted()) {
        alert("ホストがゲームを開始するまでお待ちください。");
        return;
    }

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

        const calculatedSalary = calculateSalaryOnMove(currentPosition, nextPosition, cashflow);
        guestState.setPendingSalary(calculatedSalary);

        const statePatch = {
            position: nextPosition,
            last_dice: diceRoll
        };

        const cellType = BOARD_CELLS[nextPosition];
        guestDiceResult.textContent = `移動完了: 出目=${diceRoll}, 位置=${nextPosition}（${cellType}）。`;
        
        await updateParticipantState(guestState.myUserId, statePatch);

        const pending = guestState.getPendingSalary();
        if (pending > 0) {
            btnClaimPaycheck.disabled = false;
            btnClaimPaycheck.textContent = `Paycheckを請求する (+$${pending})`;
            guestDiceResult.textContent += ` まずは給料を請求してください。`;
        } else {
            btnClaimPaycheck.disabled = true;
            btnClaimPaycheck.textContent = `Paycheckを請求する`;
            
            if (cellType === 'doodad' || cellType === 'market') {
                await handleDrawCard(cellType, guestDiceResult);
            } else if (cellType === 'opportunity') {
                guestDiceResult.textContent += ` Small DealかBig Dealを選択してください。`;
            }
        }
        btnEndTurn.disabled = false;

    } catch (error) {
        guestDiceResult.textContent = `例外発生: ${error.message}`;
        btnRollDice.disabled = false;
    }
}

/**
 * 山札からカードを引き、部屋全体（ホスト画面含む）に表示するアクション
 */
export async function handleDrawCard(deckType, guestDiceResult) {
    if (!guestState.isGameStarted()) return;

    try {
        guestDiceResult.textContent = `カードを引いています...`;
        
        const result = await drawCard(roomId, guestState.myUserId, deckType);
        
        if (!result.success) {
            alert(result.error);
            guestDiceResult.textContent = `エラー: ${result.error}`;
            return;
        }

        const currentCardData = {
            id: result.card_id,
            type: deckType,
            title: result.title,
            description: result.description,
            // 🌟 追加: DBから取得した金額データをキャッシュへ保存
            cost: result.cost,
            down_payment: result.down_payment,
            mortgage: result.mortgage,
            passive_income: result.passive_income,
            symbol: result.symbol,
            asset_type: result.asset_type,
            status: "active"
        };

        await updateRoomGameState(roomId, { current_card: currentCardData });

        guestDiceResult.textContent = `【${result.title}】を引きました！内容を確認し、アクションを選択してください。`;

    } catch (error) {
        console.error('カードドローエラー:', error);
        alert('カードの取得に失敗しました。');
        guestDiceResult.textContent = `カードの取得に失敗しました。`;
    }
}

/**
 * Paycheck（キャッシュフロー）を請求するアクション
 */
export async function handleClaimPaycheck(btnClaimPaycheck, guestDiceResult) {
    if (!guestState.isGameStarted()) return;

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

        const currentPosition = myData.state.position ?? 0;
        const cellType = BOARD_CELLS[currentPosition];

        if (cellType === 'doodad' || cellType === 'market') {
            await handleDrawCard(cellType, guestDiceResult);
        } else if (cellType === 'opportunity') {
            guestDiceResult.textContent += ` 続けて、Small DealかBig Dealを選択してください。`;
        }

    } catch (error) {
        alert('Paycheckの請求処理に失敗しました。');
        btnClaimPaycheck.disabled = false;
    }
}

/**
 * 手番を終了して次のプレイヤーへ回すアクション（もらい忘れ含む）
 */
export async function handleEndTurn(btnEndTurn, btnClaimPaycheck, guestDiceResult) {
    if (!guestState.isGameStarted()) return;

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
 * 銀行ローンの借入 (+$1,000単位) および返済 (-$1,000単位) アクション
 */
export async function handleBankLoanAction(type) {
    if (!guestState.isGameStarted()) {
        alert("ゲーム開始前はローン操作を行えません。");
        return;
    }

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

        loanInterest = Math.floor(bankLoan * 0.1);

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
 * ラットレース脱出申請アクション
 */
export async function handleEscapeRatRace(btnEscape) {
    if (!guestState.isGameStarted()) return;

    const myData = guestState.getMyData();
    if (!myData || !myData.state) return;

    try {
        btnEscape.disabled = true;
        
        const statePatch = {
            role: "ファーストトラック",
            position: 0,
            last_dice: 0
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
 * 各種RPC関数を用いてサーバーサイドで安全に財務データを更新し、ロックを解除する
 */
export async function handleCardAction(actionType) {
    if (!guestState.isGameStarted()) return;

    const currentCard = guestState.currentCardCache;
    if (!currentCard || currentCard.status === "completed") return;

    try {
        console.log(`【カードアクション実行】タイプ: ${actionType}`);

        if (actionType === 'pass') {
            await processFinancialTransaction(roomId, guestState.myUserId, 0, 0, true);
            alert("パスしました。");
        } 
        else if (actionType === 'pay_doodad') {
            const cost = currentCard.cost || 0; 
            await processFinancialTransaction(roomId, guestState.myUserId, -cost, 0, true);
            alert(`無駄遣い費用 $${cost.toLocaleString()} を支払いました。`);
        }
        else if (actionType === 'buy_real_estate') {
            // 不動産の購入
            const title = currentCard.title || "不動産";
            const cost = currentCard.cost || 0;
            const downPayment = currentCard.down_payment || 0;
            const mortgage = currentCard.mortgage || 0;
            const passiveIncome = currentCard.passive_income || 0;

            const res = await buyRealEstateAsset(roomId, guestState.myUserId, title, cost, downPayment, mortgage, passiveIncome);
            if (!res.success) throw new Error(res.error);
            
            alert(`【${title}】を購入しました！ (不労所得 +$${passiveIncome})`);
        }
        else if (actionType === 'buy_stock') {
            // 株式の購入（購入数はプロンプトで確認）
            const symbol = currentCard.symbol || "STOCK";
            const price = currentCard.cost || 0;
            
            const quantityStr = prompt(`【${symbol}】をいくらで購入しますか？\n(1株: $${price})`, "10");
            if (!quantityStr) return; // キャンセル時
            const quantity = parseInt(quantityStr, 10);
            if (isNaN(quantity) || quantity <= 0) {
                alert("正しい数値を入力してください。");
                return;
            }

            const res = await buyStockAsset(roomId, guestState.myUserId, symbol, price, quantity);
            if (!res.success) throw new Error(res.error);
            
            alert(`【${symbol}】を ${quantity} 株購入しました。`);
        }
        else if (actionType === 'sell_stock') {
            // 株式の売却（売却数はプロンプトで確認）
            const symbol = currentCard.symbol || "STOCK";
            const price = currentCard.cost || 0;
            
            const quantityStr = prompt(`【${symbol}】をいくらで売却しますか？\n(1株: $${price})`, "10");
            if (!quantityStr) return;
            const quantity = parseInt(quantityStr, 10);
            if (isNaN(quantity) || quantity <= 0) {
                alert("正しい数値を入力してください。");
                return;
            }

            const res = await sellStockAsset(roomId, guestState.myUserId, symbol, price, quantity);
            if (!res.success) throw new Error(res.error);
            
            alert(`【${symbol}】を ${quantity} 株売却しました。`);
        }
        else {
            alert(`未対応のアクションです: [${actionType}]`);
        }

    } catch (error) {
        console.error('カードアクションエラー:', error);
        alert(error.message || 'カードアクションの処理に失敗しました。');
    }
}
