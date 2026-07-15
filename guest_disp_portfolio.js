// guest_disp_portfolio.js

/**
 * プレイヤーが所有している資産（株、不動産等）のポートフォリオ一覧を描画する関数
 * @param {object} financials - プレイヤーの financials オブジェクト
 */
export function renderPortfolio(financials) {
    const container = document.getElementById("portfolio-container");
    if (!container) return;

    let stocksHtml = "";
    if (financials.assets.stocks && Object.keys(financials.assets.stocks).length > 0) {
        Object.keys(financials.assets.stocks).forEach(symbol => {
            const s = financials.assets.stocks[symbol];
            stocksHtml += `<tr><td>${symbol}</td><td>${s.shares}株</td><td>$${s.average_price}</td></tr>`;
        });
    } else {
        stocksHtml = "<tr><td colspan='3'>保有している株式はありません</td></tr>";
    }

    let reHtml = "";
    if (financials.assets.real_estate && Object.keys(financials.assets.real_estate).length > 0) {
        Object.keys(financials.assets.real_estate).forEach(key => {
            const r = financials.assets.real_estate[key];
            reHtml += `<tr><td>${key}</td><td>$${r.down_payment}</td><td>$${r.cost}</td><td>+$${r.passive_income}</td></tr>`;
        });
    } else {
        reHtml = "<tr><td colspan='4'>保有している不動産・ビジネスはありません</td></tr>";
    }

    container.innerHTML = `
        <fieldset>
            <legend>現在の保有資産リスト（ポートフォリオ）</legend>
            <h4>■ 株式・ファンド</h4>
            <table border="1">
                <thead><tr><th>銘柄</th><th>保有数</th><th>平均取得単価</th></tr></thead>
                <tbody>${stocksHtml}</tbody>
            </table>
            <h4>■ 不動産・ビジネス</h4>
            <table border="1">
                <thead><tr><th>物件名・投資内容</th><th>頭金</th><th>総額</th><th>生み出す不労所得</th></tr></thead>
                <tbody>${reHtml}</tbody>
            </table>
        </fieldset>
    `;
}
