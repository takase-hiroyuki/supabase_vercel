/**
 * すごろく盤面（ラットレース/ファーストトラック各24マス）のプレイヤー位置をリアルタイムに再描画する関数
 * @param {Array} participants - データベースから取得した全参加者のリスト
 */
export function renderGameBoard(participants) {
    // ラットレース（外周）とファーストトラック（内周）の全24マス（0〜23）の表示をクリア
    for (let i = 0; i < 24; i++) {
        const ratCell = document.getElementById(`rat-cell-${i}`);
        if (ratCell) ratCell.innerHTML = "";

        const fastCell = document.getElementById(`fast-cell-${i}`);
        if (fastCell) fastCell.innerHTML = "";
    }

    // 参加者全員のデータをもとに、該当するトラックの該当マスへ名前を書き込む
    participants.forEach(p => {
        // positionが存在するかを判定（数値・文字列どちらでも対応可能にする）
        if (p.state && p.state.position !== undefined && p.state.position !== null) {
            const position = parseInt(p.state.position, 10);
            
            // trackが未設定の場合は、デフォルトで 'rat_race'（ラットレース）とみなす
            const track = p.state.track || "rat_race";
            
            let cellId = "";
            if (track === "rat_race") {
                cellId = `rat-cell-${position}`;
            } else if (track === "fast_track") {
                cellId = `fast-cell-${position}`;
            }

            const cell = document.getElementById(cellId);
            if (cell) {
                // プレイヤーを目立たせるための視覚的なバッジ（タグ）を生成
                const playerBadge = document.createElement('span');
                
                // CSSインラインスタイルで色を付けて目立たせる（黄色背景）
                playerBadge.style.display = "inline-block";
                playerBadge.style.backgroundColor = "#ffc107";
                playerBadge.style.color = "#000";
                playerBadge.style.padding = "2px 6px";
                playerBadge.style.margin = "0 2px";
                playerBadge.style.borderRadius = "4px";
                playerBadge.style.fontSize = "0.85em";
                playerBadge.style.fontWeight = "bold";
                playerBadge.style.boxShadow = "1px 1px 2px rgba(0,0,0,0.2)";
                
                // プレイヤー名をセット
                playerBadge.textContent = p.state.name;
                
                // マス目にバッジを追加
                cell.appendChild(playerBadge);
            }
        }
    });
}
