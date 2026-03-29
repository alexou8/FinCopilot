export const demoIssues = [
  {
    id: 'issue-1',
    rule_id: 'debt_vs_savings',
    severity: 'critical',
    title: 'Credit card interest exceeds savings earnings',
    explanation:
      "You're paying about $39/month in credit card interest while earning only about $7/month from savings. That gap keeps costing you money every month.",
    action: 'See payoff plan',
    actionType: 'research',
  },
  {
    id: 'issue-2',
    rule_id: 'low_emergency_buffer',
    severity: 'critical',
    title: 'Emergency fund covers less than 1 month of expenses',
    explanation:
      'Your chequing balance covers only about 13 days of expenses, which leaves very little buffer if something unexpected happens this month.',
    action: 'Build emergency fund plan',
    actionType: 'research',
  },
  {
    id: 'issue-3',
    rule_id: 'decision_timeline_unrealistic',
    severity: 'warning',
    title: 'Move-out goal timeline is unrealistic at current savings rate',
    explanation:
      "At your current savings pace, you'll miss the move-out target by a wide margin. This goal needs either lower costs, more income, or a later date.",
    action: 'Run move-out scenario',
    actionType: 'research',
  },
  {
    id: 'issue-4',
    rule_id: 'low_yield_savings',
    severity: 'warning',
    title: 'Savings account earning near-zero interest',
    explanation:
      'Your savings account is barely growing, which means you may be missing better rates available in cash accounts with similar day-to-day usability.',
    action: 'Compare HISA options',
    actionType: 'research',
  },
];
