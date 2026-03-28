export const demoIssues = [
  {
    id: 'issue-1',
    severity: 'critical',
    title: 'Credit card interest exceeds savings earnings',
    explanation:
      "You're paying ~$39/month in credit card interest (19.99% on $2,340) while earning only ~$7/month from your savings account (0.5% on $1,420). Every month you don't address this, you're $32 in the hole on this imbalance alone.",
    action: 'See payoff plan',
    actionType: 'scenario',
  },
  {
    id: 'issue-2',
    severity: 'critical',
    title: 'Emergency fund covers less than 1 month of expenses',
    explanation:
      'Your chequing balance ($890) covers only 13 days of your $1,980/month expenses. Financial advisors recommend 3 months minimum. A single unexpected expense — car repair, medical, job loss — could push you into debt.',
    action: 'Build emergency fund plan',
    actionType: 'advice',
  },
  {
    id: 'issue-3',
    severity: 'warning',
    title: 'Move-out goal timeline is unrealistic at current savings rate',
    explanation:
      'You want to move out in 6 months and need $4,500. At $170/month savings you\'ll only accumulate $1,020 — a $3,480 shortfall. Hitting September requires tripling your savings rate to $520/month.',
    action: 'Run move-out scenario',
    actionType: 'scenario',
  },
  {
    id: 'issue-4',
    severity: 'warning',
    title: 'Savings account earning near-zero interest',
    explanation:
      'Your TD Savings at 0.5% APY is one of the lowest rates available. HISAs like EQ Bank or Wealthsimple Cash offer 3.0–3.5% APY with the same CDIC insurance — a 6× improvement for zero extra effort.',
    action: 'Compare HISA options',
    actionType: 'advice',
  },
];
