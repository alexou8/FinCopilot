// Demo simulation history — used when USE_MOCK = true in simulationService.js
// Each entry mirrors what will be stored in Supabase: simulations table

export const demoSimulations = [
  {
    id: 'sim-demo-001',
    prompt: 'Should I move out in 8 months?',
    createdAt: '2025-03-15T10:30:00Z',
    status: 'completed',
    scenarios: {
      baseline: { label: 'Staying at home' },
      alternative: { label: 'Moving out' },
    },
    title: 'Should I move out in 8 months?',
    verdict: {
      feasible: false,
      headline: 'Possible — but only with significant changes',
      summary:
        "At your current savings rate of $170/month you'll fall $3,480 short of your $4,500 goal. If you cut dining out by $120/month and redirect it to savings you'd reach the deadline with $1,900 — still short. To truly hit the target you need to increase income by ~$350/month or cut expenses aggressively.",
      recommendations: [
        'Reduce dining out from $220 → $100/month (+$120 saved)',
        'Switch savings to a 3% HISA (+$36/year in interest)',
        'Pick up extra shifts March–May to boost income (+$200–400/month)',
      ],
    },
    metrics: {
      current: {
        monthlySavings: 170,
        monthsToGoal: 26,
        emergencyFundMonths: 0.4,
        monthlyInterestPaid: 39,
      },
      scenario: {
        monthlySavings: 337,
        monthsToGoal: 13,
        emergencyFundMonths: 1.1,
        monthlyInterestPaid: 14,
      },
    },
    trajectories: (() => {
      const months = ['Now', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      return months.map((month, i) => ({
        month,
        current: Math.round(890 + 170 * i),
        scenario: Math.round(890 + 337 * i),
        goal: 4500,
      }));
    })(),
  },
  {
    id: 'sim-demo-002',
    prompt: 'Can I afford to drop a course and work more hours?',
    createdAt: '2025-03-10T15:45:00Z',
    status: 'completed',
    scenarios: {
      baseline: { label: 'Full course load' },
      alternative: { label: 'Drop 1 course + more work' },
    },
    title: 'Can I afford to drop a course and work more hours?',
    verdict: {
      feasible: true,
      headline: 'Yes — dropping a course frees up meaningful cash flow',
      summary:
        'Dropping one course reduces tuition by ~$800 this term and lets you work 8 more hours per week (+$320/month). This gives you a positive monthly surplus of $490, up from $170. The tradeoff is 4 extra months to graduate — worth it financially if your timeline is flexible.',
      recommendations: [
        'Submit a course drop request before the refund deadline',
        'Redirect extra income to the emergency fund first (target: 3 months of expenses)',
        'Revisit graduation timeline with your advisor',
      ],
    },
    metrics: {
      current: {
        monthlySavings: 170,
        monthsToGoal: 26,
        emergencyFundMonths: 0.4,
        monthlyInterestPaid: 39,
      },
      scenario: {
        monthlySavings: 490,
        monthsToGoal: 9,
        emergencyFundMonths: 2.1,
        monthlyInterestPaid: 28,
      },
    },
    trajectories: (() => {
      const months = ['Now', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      return months.map((month, i) => ({
        month,
        current: Math.round(890 + 170 * i),
        scenario: Math.round(890 + 490 * i),
        goal: 4500,
      }));
    })(),
  },
];
