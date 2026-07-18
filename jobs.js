// jobs.js

export const JOBS_LIST = [
  {
    profession: "医師",
    financials: {
      cash: 400,
      cashflow: 3550,
      income: { salary: 13200, passive: 0, total: 13200 },
      expenses: { taxes: 3420, mortgage_payment: 1900, car_loan_payment: 380, other: 3950, total: 9650 },
      liabilities: { mortgage: 202000, car_loan: 19000, retail_debt: 160000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "航空機パイロット",
    financials: {
      cash: 400,
      cashflow: 2600,
      income: { salary: 9500, passive: 0, total: 9500 },
      expenses: { taxes: 2350, mortgage_payment: 1330, car_loan_payment: 300, other: 2920, total: 6900 },
      liabilities: { mortgage: 143000, car_loan: 15000, retail_debt: 23000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "弁護士",
    financials: {
      cash: 400,
      cashflow: 2080,
      income: { salary: 7500, passive: 0, total: 7500 },
      expenses: { taxes: 1830, mortgage_payment: 1100, car_loan_payment: 220, other: 2270, total: 5420 },
      liabilities: { mortgage: 115000, car_loan: 11000, retail_debt: 85000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "エンジニア",
    financials: {
      cash: 400,
      cashflow: 1690,
      income: { salary: 4900, passive: 0, total: 4900 },
      expenses: { taxes: 1050, mortgage_payment: 700, car_loan_payment: 140, other: 1320, total: 3210 },
      liabilities: { mortgage: 75000, car_loan: 7000, retail_debt: 17000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "ビジネスマネジャー",
    financials: {
      cash: 400,
      cashflow: 1670,
      income: { salary: 4600, passive: 0, total: 4600 },
      expenses: { taxes: 910, mortgage_payment: 700, car_loan_payment: 120, other: 1200, total: 2930 },
      liabilities: { mortgage: 75000, car_loan: 6000, retail_debt: 16000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "看護婦",
    financials: {
      cash: 480,
      cashflow: 1120,
      income: { salary: 3100, passive: 0, total: 3100 },
      expenses: { taxes: 600, mortgage_payment: 400, car_loan_payment: 100, other: 880, total: 1980 },
      liabilities: { mortgage: 47000, car_loan: 5000, retail_debt: 10000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "警察官",
    financials: {
      cash: 520,
      cashflow: 1120,
      income: { salary: 3000, passive: 0, total: 3000 },
      expenses: { taxes: 580, mortgage_payment: 400, car_loan_payment: 100, other: 800, total: 1880 },
      liabilities: { mortgage: 46000, car_loan: 5000, retail_debt: 3000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "教師",
    financials: {
      cash: 400,
      cashflow: 1110,
      income: { salary: 3300, passive: 0, total: 3300 },
      expenses: { taxes: 630, mortgage_payment: 500, car_loan_payment: 100, other: 960, total: 2190 },
      liabilities: { mortgage: 50000, car_loan: 5000, retail_debt: 16000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "秘書",
    financials: {
      cash: 710,
      cashflow: 880,
      income: { salary: 2500, passive: 0, total: 2500 },
      expenses: { taxes: 460, mortgage_payment: 400, car_loan_payment: 80, other: 680, total: 1620 },
      liabilities: { mortgage: 38000, car_loan: 4000, retail_debt: 3000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "トラック運転手",
    financials: {
      cash: 750,
      cashflow: 880,
      income: { salary: 2500, passive: 0, total: 2500 },
      expenses: { taxes: 460, mortgage_payment: 400, car_loan_payment: 80, other: 680, total: 1620 },
      liabilities: { mortgage: 38000, car_loan: 4000, retail_debt: 3000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "機械工",
    financials: {
      cash: 670,
      cashflow: 720,
      income: { salary: 2000, passive: 0, total: 2000 },
      expenses: { taxes: 360, mortgage_payment: 300, car_loan_payment: 60, other: 560, total: 1280 },
      liabilities: { mortgage: 31000, car_loan: 3000, retail_debt: 2000 },
      assets: { stocks: {}, real_estate: {} }
    }
  },
  {
    profession: "ビルの管理人",
    financials: {
      cash: 560,
      cashflow: 650,
      income: { salary: 1600, passive: 0, total: 1600 },
      expenses: { taxes: 280, mortgage_payment: 200, car_loan_payment: 60, other: 410, total: 950 },
      liabilities: { mortgage: 20000, car_loan: 4000, retail_debt: 3000 },
      assets: { stocks: {}, real_estate: {} }
    }
  }
];

/**
 * ランダムに1つの職業オブジェクトを取得する関数
 */
export function getRandomJob() {
  const randomIndex = Math.floor(Math.random() * JOBS_LIST.length);
  return JOBS_LIST[randomIndex];
}
