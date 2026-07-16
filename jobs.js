// jobs.js

// 12種類の職業テンプレートデータ
export const JOBS_LIST = [
  {
    role: "医師",
    savings: 400,
    salary: 13200,
    financials: {
      income: { salary: 13200, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 13200 },
      expenses: { tax: 3420, mortgage: 1900, education_loan: 750, car_loan: 380, credit_card: 270, retail_payment: 50, other_expenses: 2880, child_expense_unit: 640, child_count: 0, child_expenses: 0, total_expenses: 9650 },
      cash_flow: 3550,
      assets: { savings: 400, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 202000, education_loan: 150000, car_loan: 19000, credit_card: 9000, retail_debt: 1000 }
    }
  },
  {
    role: "航空機パイロット",
    savings: 400,
    salary: 9500,
    financials: {
      income: { salary: 9500, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 9500 },
      expenses: { tax: 2350, mortgage: 1330, education_loan: 0, car_loan: 300, credit_card: 660, retail_payment: 50, other_expenses: 2210, child_expense_unit: 480, child_count: 0, child_expenses: 0, total_expenses: 6900 },
      cash_flow: 2600,
      assets: { savings: 400, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 143000, education_loan: 0, car_loan: 15000, credit_card: 22000, retail_debt: 1000 }
    }
  },
  {
    role: "弁護士",
    savings: 400,
    salary: 7500,
    financials: {
      income: { salary: 7500, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 7500 },
      expenses: { tax: 1830, mortgage: 1100, education_loan: 390, car_loan: 220, credit_card: 180, retail_payment: 50, other_expenses: 1650, child_expense_unit: 380, child_count: 0, child_expenses: 0, total_expenses: 5420 },
      cash_flow: 2080,
      assets: { savings: 400, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 115000, education_loan: 78000, car_loan: 11000, credit_card: 6000, retail_debt: 1000 }
    }
  },
  {
    role: "エンジニア",
    savings: 400,
    salary: 4900,
    financials: {
      income: { salary: 4900, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 4900 },
      expenses: { tax: 1050, mortgage: 700, education_loan: 60, car_loan: 140, credit_card: 120, retail_payment: 50, other_expenses: 1090, child_expense_unit: 250, child_count: 0, child_expenses: 0, total_expenses: 3210 },
      cash_flow: 1690,
      assets: { savings: 400, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 75000, education_loan: 12000, car_loan: 7000, credit_card: 4000, retail_debt: 1000 }
    }
  },
  {
    role: "ビジネスマネジャー",
    savings: 400,
    salary: 4600,
    financials: {
      income: { salary: 4600, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 4600 },
      expenses: { tax: 910, mortgage: 700, education_loan: 60, car_loan: 120, credit_card: 90, retail_payment: 50, other_expenses: 1000, child_expense_unit: 240, child_count: 0, child_expenses: 0, total_expenses: 2930 },
      cash_flow: 1670,
      assets: { savings: 400, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 75000, education_loan: 12000, car_loan: 6000, credit_card: 3000, retail_debt: 1000 }
    }
  },
  {
    role: "看護婦",
    savings: 480,
    salary: 3100,
    financials: {
      income: { salary: 3100, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 3100 },
      expenses: { tax: 600, mortgage: 400, education_loan: 30, car_loan: 100, credit_card: 90, retail_payment: 50, other_expenses: 710, child_expense_unit: 170, child_count: 0, child_expenses: 0, total_expenses: 1980 },
      cash_flow: 1120,
      assets: { savings: 480, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 47000, education_loan: 6000, car_loan: 5000, credit_card: 3000, retail_debt: 1000 }
    }
  },
  {
    role: "警察官",
    savings: 520,
    salary: 3000,
    financials: {
      income: { salary: 3000, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 3000 },
      expenses: { tax: 580, mortgage: 400, education_loan: 0, car_loan: 100, credit_card: 60, retail_payment: 50, other_expenses: 690, child_expense_unit: 160, child_count: 0, child_expenses: 0, total_expenses: 1880 },
      cash_flow: 1120,
      assets: { savings: 520, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 46000, education_loan: 0, car_loan: 5000, credit_card: 2000, retail_debt: 1000 }
    }
  },
  {
    role: "教師",
    savings: 400,
    salary: 3300,
    financials: {
      income: { salary: 3300, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 3300 },
      expenses: { tax: 630, mortgage: 500, education_loan: 60, car_loan: 100, credit_card: 90, retail_payment: 50, other_expenses: 760, child_expense_unit: 180, child_count: 0, child_expenses: 0, total_expenses: 2190 },
      cash_flow: 1110,
      assets: { savings: 400, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 50000, education_loan: 12000, car_loan: 5000, credit_card: 3000, retail_debt: 1000 }
    }
  },
  {
    role: "秘書",
    savings: 710,
    salary: 2500,
    financials: {
      income: { salary: 2500, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 2500 },
      expenses: { tax: 460, mortgage: 400, education_loan: 0, car_loan: 80, credit_card: 60, retail_payment: 50, other_expenses: 570, child_expense_unit: 140, child_count: 0, child_expenses: 0, total_expenses: 1620 },
      cash_flow: 880,
      assets: { savings: 710, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 38000, education_loan: 0, car_loan: 4000, credit_card: 2000, retail_debt: 1000 }
    }
  },
  {
    role: "トラック運転手",
    savings: 750,
    salary: 2500,
    financials: {
      income: { salary: 2500, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 2500 },
      expenses: { tax: 460, mortgage: 400, education_loan: 0, car_loan: 80, credit_card: 60, retail_payment: 50, other_expenses: 570, child_expense_unit: 140, child_count: 0, child_expenses: 0, total_expenses: 1620 },
      cash_flow: 880,
      assets: { savings: 750, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 38000, education_loan: 0, car_loan: 4000, credit_card: 2000, retail_debt: 1000 }
    }
  },
  {
    role: "機械工",
    savings: 670,
    salary: 2000,
    financials: {
      income: { salary: 2000, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 2000 },
      expenses: { tax: 360, mortgage: 300, education_loan: 0, car_loan: 60, credit_card: 60, retail_payment: 50, other_expenses: 450, child_expense_unit: 110, child_count: 0, child_expenses: 0, total_expenses: 1280 },
      cash_flow: 720,
      assets: { savings: 670, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 31000, education_loan: 0, car_loan: 3000, credit_card: 2000, retail_debt: 1000 }
    }
  },
  {
    role: "ビルの管理人",
    savings: 560,
    salary: 1600,
    financials: {
      income: { salary: 1600, interest: 0, dividends: 0, real_estate: 0, passive_income: 0, total_income: 1600 },
      expenses: { tax: 280, mortgage: 200, education_loan: 0, car_loan: 60, credit_card: 60, retail_payment: 50, other_expenses: 300, child_expense_unit: 70, child_count: 0, child_expenses: 0, total_expenses: 950 },
      cash_flow: 650,
      assets: { savings: 560, stocks: [], real_estate_business: [] },
      liabilities: { mortgage: 20000, education_loan: 0, car_loan: 4000, credit_card: 2000, retail_debt: 1000 }
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
