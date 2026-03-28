export const demoScenario = {
  title: 'Can I afford to move out by September?',
  verdict: {
    feasible: false,
    headline: 'Possible — but only with significant changes',
    summary:
      "At your current savings rate of $170/month, you'll fall $3,480 short of your $4,500 goal by September. If you cut dining out by $120/month and redirect it to savings, you'd reach September with $1,900 — still short, but a much better foundation. To truly hit September, you need to either increase income by ~$350/month or cut expenses aggressively.",
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
    const months = ['Now','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    return months.map((month, i) => ({
      month,
      current:  Math.round(890 + 170 * i),
      scenario: Math.round(890 + 337 * i),
      goal: 4500,
    }));
  })(),
};
