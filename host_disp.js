// host_disp.js

// 【追加】DOMセレクター一括管理ファイルのインポート
import { DOM_SELECTORS } from './dom_selectors.js';

/**
 * 画面上のすごろく盤面（各マス）に配置されているコマをすべて消去する関数
 */
export const clearBoardCells = () => {
    const boardSelectors = DOM_SELECTORS.HOST.BOARD;
    // HTML側の24マス（0〜23）に合わせて、ループ上限を 24 に変更
    for (let i = 0; i < 24; i++) {
        // 🌟 ハードコーディングされていた `cell-${i}` をプレフィックス定数経由に集約
        const cell = document.getElementById(`${boardSelectors.CELL_PREFIX}${i}`);
        if (cell) {
            cell.textContent = ''; // マスの中身を空にする
        }
    }
};

/**
 * 手番の表示文字列を書き換える関数
 * @param {string} currentTurnUserIdCache - 現在の手番ユーザーID
 * @param {Array} latestParticipants - 全参加者のリスト
 * @param {HTMLElement} hostDiceMonitor - 手番を表示するHTML要素
 */
export const renderTurnDisplay = (currentTurnUserIdCache, latestParticipants, hostDiceMonitor) => {
    if (!hostDiceMonitor) return;

    if (!currentTurnUserIdCache) {
        hostDiceMonitor.textContent = "手番が設定されていません（入室順の番号を指定してください）";
        return;
    }

    const activePlayer = latestParticipants.find(p => p.user_id === currentTurnUserIdCache);
    const activePlayerName = activePlayer && activePlayer.state ? activePlayer.state.name : currentTurnUserIdCache;

    hostDiceMonitor.textContent = `次は ${activePlayerName} の番です`;
};

/**
 * 名簿テーブルおよびすごろく盤面へデータを組み立てて出力する関数
 * @param {Array} participants - 全参加者のリスト
 * @param {HTMLElement} listBody - 名簿テーブルのtbody要素
 */
export const renderParticipantDisplay = (participants, listBody) => {
    const itemSelectors = DOM_SELECTORS.HOST.PARTICIPANT_ITEM;
    const boardSelectors = DOM_SELECTORS.HOST.BOARD;

    // 【デバッグ挿入】関数が呼ばれた事実とデータの中身を出力
    console.log("【ホストDB1】renderParticipantDisplayが実行されました。データ件数:", participants.length);
    participants.forEach((p, i) => {
        console.log(`【ホストDB2】インデックス:${i}, user_id:${p.user_id}, position:${p.state?.position}, last_dice:${p.state?.last_dice}, profession:${p.state?.profession}`);
    });

    listBody.innerHTML = ''; // 名簿を一旦クリア
    clearBoardCells();       // すごろく盤面を一旦クリア

    participants.forEach((p, index) => {
        const state = p.state || { name: '未特定', position: 0, role: 'general', profession: '一般' };

        // --- A. 名簿テーブルへの描画処理 ---
        const tr = document.createElement('tr');
        // 🌟 一括管理で定義された行用のCSSクラス（'host-participant-row'）を付与
        tr.classList.add(itemSelectors.ROW_CLASS);
        
        // 00番マスは「00給料」、それ以外は「XX 番マス」に整形
        const pos = state.position ?? 0;
        const positionText = pos === 0 ? "00給料" : `${pos} 番マス`;

        // データベースのスキーマ構造 (state.financials.cash) からキャッシュを取得
        const cashValue = state.financials?.cash ?? 0;

        // 職業データを取得（無い場合は '一般'）
        const professionText = state.profession || '一般';
        
        // システム的な進行フェーズ（role）もホスト側で視認しやすいよう補足テキストとして用意
        const currentRole = state.role || 'general';

        // 🌟 内訳テーブルの列順（入室順 -> 氏名 -> 職業 -> 位置 -> キャッシュ）に合わせてTDを構築
        // （バグ防止のため、中央定義ファイルから職業のクラス名 'host-participant-profession' を挿入）
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${state.name || '不明'} [${currentRole}]</td>
            <td class="${itemSelectors.PROFESSION_CLASS}">${professionText}</td>
            <td>${positionText}</td>
            <td>$${cashValue.toLocaleString()}</td>
        `;
        listBody.appendChild(tr);

        // --- B. すごろく盤面へのコマ配置処理 ---
        const targetCellId = `${boardSelectors.CELL_PREFIX}${pos}`;
        const cell = document.getElementById(targetCellId);
        if (cell) {
            const pieceTable = document.createElement('table');
            pieceTable.setAttribute('border', '0');
            pieceTable.setAttribute('cellspacing', '0');
            pieceTable.setAttribute('cellpadding', '2');
            pieceTable.setAttribute('width', '100%');
            
            const pieceTr = document.createElement('tr');
            const pieceTd = document.createElement('td');
            
            pieceTd.setAttribute('bgcolor', '#00bcd4');
            pieceTd.setAttribute('align', 'center');
            
            const fontTag = document.createElement('font');
            fontTag.setAttribute('color', 'white');
            fontTag.setAttribute('size', '2');
            fontTag.textContent = state.name || '不明';
            
            pieceTd.appendChild(fontTag);
            pieceTr.appendChild(pieceTd);
            pieceTable.appendChild(pieceTr);
            cell.appendChild(pieceTable);
        }
    });
};
