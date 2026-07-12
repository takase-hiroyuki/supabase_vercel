// guest_disp.js

/**
 * すごろく盤面のプレイヤー位置をリアルタイムに再描画する関数
 * @param {Array} participants - データベースから取得した全参加者のリスト
 */
export function renderGameBoard(participants) {
    // 盤面上のすべてのマスの表示を一度クリアする
    // ※現在は0〜7マスのため最大7までループ
    for (let i = 0; i <= 7; i++) {
        const cell = document.getElementById(`cell-${i}`);
        if (cell) cell.textContent = "";
    }

    // 参加者全員のデータをもとに、各マスへ名前を書き込む
    participants.forEach(p => {
        if (p.state && typeof p.state.position === 'number') {
            const cell = document.getElementById(`cell-${p.state.position}`);
            if (cell) {
                if (cell.textContent) {
                    cell.textContent += `, ${p.state.name}`;
                } else {
                    cell.textContent = p.state.name;
                }
            }
        }
    });
}
