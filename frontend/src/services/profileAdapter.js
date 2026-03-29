// profileAdapter.js
// Translates between backend API shapes and the frontend profile shape.
//
// Backend shapes:
//   ComparisonProfile — returned by POST /chat  (income_sources, recurring_expenses, debts, accounts)
//   FinancialProfile  — returned by GET /profiles/{id}  (income.amount, expenses[], debt[], accounts[])
//
// Frontend shape (demoProfile):
//   { income: { monthly, sources[] }, expenses: { monthly, categories[] },
//     debt: [{ id, label, balance, interestRate, minPayment }],
//     accounts: [{ id, label, balance, type }], completionPercent }

const COLORS = ['#006666','#008080','#33a3a3','#66c2c2','#004d4d','#003333','#00a3a3','#339999'];

function normalizeMonthly(amount, frequency) {
  const freq = (frequency || 'monthly').toLowerCase();
  if (freq === 'weekly')              return amount * 4.33;
  if (freq === 'biweekly')            return amount * 2.17;
  if (freq === 'yearly' || freq === 'annually') return amount / 12;
  return amount;
}

function computeCompletion(hasIncome, hasExpenses, hasDebt, hasAccounts) {
  const filled = [hasIncome, hasExpenses, hasDebt, hasAccounts].filter(Boolean).length;
  return Math.round((filled / 4) * 100);
}

/**
 * ComparisonProfile (from POST /chat) → frontend profile shape.
 * Returns null if cp is falsy or entirely empty.
 */
export function comparisonToFrontend(cp) {
  if (!cp) return null;

  const sources = (cp.income_sources || []).map(s => ({
    label: s.name,
    amount: s.amount,
    frequency: s.frequency || 'monthly',
  }));

  const monthly_income =
    cp.dashboard_summary?.monthly_income != null
      ? cp.dashboard_summary.monthly_income
      : sources.reduce((sum, s) => sum + normalizeMonthly(s.amount, s.frequency), 0);

  const categories = (cp.recurring_expenses || []).map((e, i) => ({
    label: e.name,
    amount: e.amount,
    color: COLORS[i % COLORS.length],
  }));

  const monthly_expenses = categories.reduce((sum, c) => sum + c.amount, 0);

  const debt = (cp.debts || []).map((d, i) => ({
    id: `debt-${i}`,
    label: d.name,
    balance: d.balance,
    interestRate: d.interest_rate ?? 0,
    minPayment: d.minimum_payment ?? 0,
  }));

  const accounts = (cp.accounts || []).map((a, i) => ({
    id: `acct-${i}`,
    label: a.name,
    balance: a.balance,
    type: a.type || 'chequing',
  }));

  const income   = sources.length   > 0 ? { monthly: Math.round(monthly_income),   sources }    : null;
  const expenses = categories.length > 0 ? { monthly: Math.round(monthly_expenses), categories } : null;
  const debtArr  = debt.length      > 0 ? debt    : null;
  const acctArr  = accounts.length  > 0 ? accounts : null;

  // Return null if nothing was extracted yet
  if (!income && !expenses && !debtArr && !acctArr) return null;

  return {
    income,
    expenses,
    debt:             debtArr,
    accounts:         acctArr,
    decision:         cp.decision ?? null,
    completionPercent: computeCompletion(!!income, !!expenses, !!debtArr, !!acctArr),
  };
}

/**
 * FinancialProfile (from GET /profiles/{id}) → frontend profile shape.
 */
export function legacyToFrontend(fp) {
  if (!fp) return null;

  const sources = fp.income?.amount != null
    ? [{ label: 'Income', amount: fp.income.amount, frequency: fp.income.frequency || 'monthly' }]
    : [];

  const monthly_income = fp.income?.amount ?? 0;

  const categories = (fp.expenses || []).map((e, i) => ({
    label: e.name,
    amount: e.amount,
    color: COLORS[i % COLORS.length],
  }));

  const monthly_expenses = categories.reduce((sum, c) => sum + c.amount, 0);

  const debt = (fp.debt || []).map((d, i) => ({
    id: `debt-${i}`,
    label: d.type,
    balance: d.balance,
    interestRate: d.interest_rate ?? 0,
    minPayment: d.minimum_payment ?? 0,
  }));

  const accounts = (fp.accounts || []).map((a, i) => ({
    id: `acct-${i}`,
    label: a.type.charAt(0).toUpperCase() + a.type.slice(1),
    balance: a.balance,
    type: a.type,
  }));

  const income   = sources.length   > 0 ? { monthly: Math.round(monthly_income),   sources }    : null;
  const expenses = categories.length > 0 ? { monthly: Math.round(monthly_expenses), categories } : null;
  const debtArr  = debt.length      > 0 ? debt    : null;
  const acctArr  = accounts.length  > 0 ? accounts : null;

  if (!income && !expenses && !debtArr && !acctArr) return null;

  return {
    income,
    expenses,
    debt:             debtArr,
    accounts:         acctArr,
    completionPercent: computeCompletion(!!income, !!expenses, !!debtArr, !!acctArr),
  };
}

/**
 * Frontend profile shape → FinancialProfile (for PUT /profiles/{id}).
 */
export function frontendToLegacy(profile) {
  if (!profile) return {};

  const income = profile.income?.sources?.length > 0
    ? {
        amount:      profile.income.monthly,
        frequency:   'monthly',
        is_variable: profile.income.sources.length > 1,
      }
    : undefined;

  const expenses = (profile.expenses?.categories || []).map(c => ({
    name:      c.label,
    amount:    c.amount,
    frequency: 'monthly',
  }));

  const debt = (profile.debt || []).map(d => ({
    type:            d.label,
    balance:         d.balance,
    interest_rate:   d.interestRate,
    minimum_payment: d.minPayment,
  }));

  const accounts = (profile.accounts || []).map(a => ({
    type:          a.type,
    balance:       a.balance,
    interest_rate: null,
  }));

  return {
    income:   income                   || undefined,
    expenses: expenses.length > 0      ? expenses : undefined,
    debt:     debt.length > 0          ? debt     : undefined,
    accounts: accounts.length > 0      ? accounts : undefined,
  };
}
