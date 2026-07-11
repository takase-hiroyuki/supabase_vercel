// dice.js

/**
 * 1〜6のサイコロの目をランダムに決定して返す関数
 * @returns {number} 1から6までの整数
 */
export function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

/**
 * 現在の位置とサイコロの出目から、次のマス目の位置（0〜7）を計算する関数
 * @param {number} currentPosition - 現在のマス目の番号 (0〜7)
 * @param {number} diceRoll - サイコロの出目 (1〜6)
 * @returns {number} 移動後のマス目の番号 (0〜7)
 */
export function calculateNextPosition(currentPosition, diceRoll) {
    // 0〜7マスのループ構造。合計が8以上なら8で割った余り（0〜7）にする
    return (currentPosition + diceRoll) % 8;
}

/**
 * サイコロの出目（数値）に対応する文字列表現を返す関数（表示用）
 * @param {number} diceRoll - サイコロの出目 (1〜6)
 * @returns {string} ⚀ (1) 〜 ⚅ (6) の文字列
 */
export function getDiceFaceText(diceRoll) {
    const diceFaces = ['⚀ (1)', '⚁ (2)', '⚂ (3)', '⚃ (4)', '⚄ (5)', '⚅ (6)'];
    if (diceRoll >= 1 && diceRoll <= 6) {
        return diceFaces[diceRoll - 1];
    }
    return 'まだ振っていません';
}
