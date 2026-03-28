export const demoProfile = {
  id: 'demo-user',
  name: 'Alex Chen',
  year: '3rd Year',
  program: 'Business Administration',
  school: 'Wilfrid Laurier University',
  completionPercent: 78,

  income: {
    monthly: 2150,
    sources: [
      { label: 'Part-time Job (Retail)', amount: 1200, frequency: 'monthly' },
      { label: 'OSAP Grant',             amount: 650,  frequency: 'monthly' },
      { label: 'Family Support',         amount: 300,  frequency: 'monthly' },
    ],
  },

  expenses: {
    monthly: 1980,
    categories: [
      { label: 'Rent',          amount: 900, color: '#006666' },
      { label: 'Groceries',     amount: 320, color: '#008080' },
      { label: 'Dining Out',    amount: 220, color: '#FF2157' },
      { label: 'Transport',     amount: 180, color: '#FE9900' },
      { label: 'Personal',      amount: 210, color: '#1E2938' },
      { label: 'Subscriptions', amount: 85,  color: '#718096' },
      { label: 'Phone',         amount: 65,  color: '#4a5568' },
    ],
  },

  debt: [
    {
      id: 'd1',
      label: 'OSAP Student Loan',
      balance: 18400,
      interestRate: 6.5,
      minPayment: 0,
      note: 'No payments until 6 months post-graduation',
    },
    {
      id: 'd2',
      label: 'TD Credit Card',
      balance: 2340,
      interestRate: 19.99,
      minPayment: 47,
      note: 'High-interest — priority to pay down',
    },
  ],

  accounts: [
    { id: 'a1', label: 'TD Chequing', balance: 890,  type: 'chequing' },
    { id: 'a2', label: 'TD Savings',  balance: 1420, type: 'savings', apy: 0.5 },
  ],

  goal: {
    label: 'Move Out by September',
    targetDate: '2025-09-01',
    targetAmount: 4500,
    currentAmount: 890,
    monthlySavingsNeeded: 520,
    currentMonthlySavings: 170,
    monthsAway: 6,
    projectedMonths: 14,
  },
};
