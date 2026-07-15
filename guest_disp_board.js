// guest_disp_board.js

/**
 * すごろく盤面（ラットレース/ファーストトラック各24マス）のプレイヤー位置をリアルタイムに再描画する関数
 * @param {Array} participants - データベースから取得した全参加者のリスト
 */
export function renderGameBoard(participants) {
    // ラットレース（外周）とファーストトラック（内周）の全24マス（0〜23）の表示をクリア
    for (let i = 0; i < 24; i++) {
        const ratCell = document.getElementById(`rat-cell-${i}`);
        if (ratCell) ratCell.textContent = "";

        const fastCell = document.getElementById(`fast-cell-${i}`);
        if (fastCell) fastCell.textContent = "";
    }

    // 参加者全員のデータをもとに、該当するトラックの該当マスへ名前を書き込む
    participants.forEach(p => {
        if (p.state && typeof p.state.position === 'number' && p.state.track) {
            let cellId = "";
            if (p.state.track === "rat_race") {
                cellId = `rat-cell-${p.state.position}`;
            } else if (p.state.track === "fast_track") {
                cellId = `fast-cell-${p.state.position}`;
            }

            const cell = document.getElementById(cellId);
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
