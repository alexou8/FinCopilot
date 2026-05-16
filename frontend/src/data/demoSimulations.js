// Demo simulation history and mock generation helpers for GitHub Pages / demo mode.

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

// ─── Demo simulation generator ───────────────────────────────────────────────

const MONTHS = ['Now', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

function buildTrajectories(currentRate, scenarioRate, start = 890) {
  return MONTHS.map((month, i) => ({
    month,
    current: Math.round(start + currentRate * i),
    scenario: Math.round(start + scenarioRate * i),
    goal: 4500,
  }));
}

const SCENARIO_TEMPLATES = [
  {
    keywords: ['car', 'vehicle', 'auto', 'drive'],
    build: (prompt) => ({
      scenarios: { baseline: { label: 'No car purchase' }, alternative: { label: 'Buy a used car' } },
      verdict: {
        feasible: false,
        headline: 'Tight — a car purchase would strain your budget for 18+ months',
        summary: "A used car in the $8,000–12,000 range adds ~$320/month (loan + insurance). At your current $170/month surplus this puts you at a $150/month deficit. You'd need to cut dining out and personal spending significantly, or delay until your emergency fund clears $2,000+.",
        recommendations: [
          'Build emergency fund to $2,000+ before committing to a car payment',
          'Look for 0% financing promos to reduce monthly carrying cost',
          'Factor in insurance — typically $150–200/month for student drivers',
        ],
      },
      metrics: {
        current:  { monthlySavings: 170,  monthsToGoal: 26,   emergencyFundMonths: 0.4, monthlyInterestPaid: 39 },
        scenario: { monthlySavings: -150, monthsToGoal: null, emergencyFundMonths: 0.2, monthlyInterestPaid: 58 },
      },
      trajectories: buildTrajectories(170, -150),
    }),
  },
  {
    keywords: ['internship', 'co-op', 'coop', 'unpaid', 'placement'],
    build: (prompt) => ({
      scenarios: { baseline: { label: 'Current path' }, alternative: { label: 'Take unpaid internship' } },
      verdict: {
        feasible: true,
        headline: 'Doable — but only with 3+ months of buffer saved first',
        summary: "Dropping your $1,200/month part-time income for a 4-month unpaid internship creates a $1,030/month deficit. You'd burn through roughly $4,120 in savings — more than your current $2,310 total. Save aggressively for 3 months beforehand or negotiate even a small stipend to change the math.",
        recommendations: [
          'Save $600–800/month for 3 months before the internship starts',
          'Negotiate a stipend — even $500/month significantly changes the outcome',
          'Cut subscriptions and dining out during the internship period',
        ],
      },
      metrics: {
        current:  { monthlySavings: 170,   monthsToGoal: 26,   emergencyFundMonths: 0.4, monthlyInterestPaid: 39 },
        scenario: { monthlySavings: -1030, monthsToGoal: null, emergencyFundMonths: 0.1, monthlyInterestPaid: 39 },
      },
      trajectories: buildTrajectories(170, -1030),
    }),
  },
  {
    keywords: ['drop', 'course', 'class', 'withdraw', 'reduce course'],
    build: (prompt) => ({
      scenarios: { baseline: { label: 'Full course load' }, alternative: { label: 'Drop 1 course + more work' } },
      verdict: {
        feasible: true,
        headline: 'Yes — dropping a course frees up meaningful cash flow',
        summary: "Dropping one course reduces tuition by ~$800 this term and lets you work 8 more hours per week (+$320/month). Monthly surplus jumps from $170 to $490. Tradeoff: 4 extra months to graduate — worth it financially if your timeline is flexible.",
        recommendations: [
          'Submit the course drop before the tuition refund deadline',
          'Redirect extra income to emergency fund first (target: 3 months of expenses)',
          'Revisit graduation timeline with your academic advisor',
        ],
      },
      metrics: {
        current:  { monthlySavings: 170, monthsToGoal: 26, emergencyFundMonths: 0.4, monthlyInterestPaid: 39 },
        scenario: { monthlySavings: 490, monthsToGoal: 9,  emergencyFundMonths: 2.1, monthlyInterestPaid: 28 },
      },
      trajectories: buildTrajectories(170, 490),
    }),
  },
  {
    keywords: ['move out', 'apartment', 'own place', 'my own', 'solo', 'roommate', 'rent'],
    build: (prompt) => ({
      scenarios: { baseline: { label: 'Stay where you are' }, alternative: { label: 'Move out independently' } },
      verdict: {
        feasible: false,
        headline: 'Possible — but only with significant changes to income or spending',
        summary: "At $170/month savings you'll fall $3,480 short of the $4,500 move-out goal. Cut dining out to $100/month and you reach $337/month saved — still 13 months away. To hit a 6-month deadline you need to add ~$350/month in income or cuts.",
        recommendations: [
          'Reduce dining out from $220 → $100/month (+$120 saved)',
          'Switch savings to a 3% HISA to accelerate growth',
          'Pick up extra shifts to boost income by $200–400/month',
        ],
      },
      metrics: {
        current:  { monthlySavings: 170, monthsToGoal: 26, emergencyFundMonths: 0.4, monthlyInterestPaid: 39 },
        scenario: { monthlySavings: 337, monthsToGoal: 13, emergencyFundMonths: 1.1, monthlyInterestPaid: 14 },
      },
      trajectories: buildTrajectories(170, 337),
    }),
  },
  {
    keywords: ['work more', 'extra hours', 'second job', 'side hustle', 'freelance', 'income'],
    build: (prompt) => ({
      scenarios: { baseline: { label: 'Current income' }, alternative: { label: 'Increase income' } },
      verdict: {
        feasible: true,
        headline: 'High impact — more income is the fastest lever at your savings rate',
        summary: "Adding $400/month from extra hours or freelance work more than triples your monthly surplus from $170 to $570. At that rate you hit your $4,500 move-out goal in under 8 months and fully pay off the credit card within 5 months.",
        recommendations: [
          'Target $400/month extra — roughly 8–10 additional hours/week at your current wage',
          'Prioritize credit card payoff first (saves ~$39/month in interest)',
          'Automate savings transfers so income growth goes straight to goals',
        ],
      },
      metrics: {
        current:  { monthlySavings: 170, monthsToGoal: 26, emergencyFundMonths: 0.4, monthlyInterestPaid: 39 },
        scenario: { monthlySavings: 570, monthsToGoal: 8,  emergencyFundMonths: 1.8, monthlyInterestPaid: 22 },
      },
      trajectories: buildTrajectories(170, 570),
    }),
  },
];

/**
 * Generate a plausible simulation result for the demo without a backend.
 * Matches prompt keywords to a template; falls back to a generic positive scenario.
 */
export function createDemoSimulation(prompt) {
  const lower = prompt.toLowerCase();
  const match = SCENARIO_TEMPLATES.find(t => t.keywords.some(kw => lower.includes(kw)));

  const boost = 80 + Math.floor(Math.random() * 150);
  const generic = {
    scenarios: { baseline: { label: 'Current path' }, alternative: { label: prompt.slice(0, 55) } },
    verdict: {
      feasible: true,
      headline: 'Positive outcome — this scenario improves your financial trajectory',
      summary: `Modeling your scenario against the demo profile: with an estimated +$${boost}/month improvement in net savings, you'd reach your $4,500 goal in roughly ${Math.ceil(4500 / (170 + boost))} months instead of 26. Consistency is the key variable — budget improvements only compound if maintained for at least 3 months.`,
      recommendations: [
        'Track month one closely to validate the projected savings change',
        'Redirect any surplus immediately to your highest-priority goal',
        'Revisit this simulation in 60 days with updated actuals',
      ],
    },
    metrics: {
      current:  { monthlySavings: 170,         monthsToGoal: 26,                            emergencyFundMonths: 0.4, monthlyInterestPaid: 39 },
      scenario: { monthlySavings: 170 + boost, monthsToGoal: Math.ceil(4500 / (170 + boost)), emergencyFundMonths: 0.8, monthlyInterestPaid: 32 },
    },
    trajectories: buildTrajectories(170, 170 + boost),
  };

  const template = match ? match.build(prompt) : generic;

  return {
    id: `sim-demo-${Date.now()}`,
    prompt,
    createdAt: new Date().toISOString(),
    status: 'completed',
    ...template,
  };
}

// ─── Simulation scenario chat replies (demo mode) ─────────────────────────────

const SCENARIO_CHAT_REPLIES = [
  {
    keywords: ['move out', 'apartment', 'rent my own', 'own place', 'solo', 'move'],
    reply: "Got it — moving out is one of the biggest student financial decisions. To model it accurately:\n\n1. Do you have a target monthly rent?\n2. Solo or with roommates?\n3. Estimating first + last month deposit?\n\nGive me those and I'll have everything I need. Then hit **Run Simulation** to see the full comparison.",
  },
  {
    keywords: ['car', 'vehicle', 'auto', 'drive', 'buy a car'],
    reply: "Car purchase — solid one to model. A few inputs:\n\n1. New or used? Rough price range?\n2. Planning to finance or pay cash?\n3. Have a sense of insurance costs?\n\nOnce I have those numbers I'll run the monthly cash-flow comparison for you.",
  },
  {
    keywords: ['internship', 'co-op', 'unpaid', 'placement'],
    reply: "Unpaid internship — real cash-flow risk here. To model it:\n\n1. How many months is the internship?\n2. Will you still work part-time during it?\n3. Any living cost changes (e.g., moving home)?\n\nThose three inputs let me show exactly what happens to your savings trajectory if you take it.",
  },
  {
    keywords: ['drop', 'course', 'class', 'withdraw'],
    reply: "Dropping a course — worth the math before deciding. Key inputs:\n\n1. What's the tuition refund if you drop now?\n2. Would you pick up more work hours instead?\n3. Does this push out your graduation date?\n\nShoot me those details and I'll run the scenario.",
  },
  {
    keywords: ['work more', 'extra hours', 'second job', 'side hustle', 'freelance'],
    reply: "More income is usually the highest-leverage move at your savings rate. To model it:\n\n1. How many extra hours per week are realistic?\n2. Same hourly rate as your current job?\n3. Any extra costs (transport, childcare) to offset?\n\nOnce confirmed, run the simulation to see the net surplus change over 12 months.",
  },
  {
    keywords: ['budget', 'cut', 'spend less', 'reduce expenses', 'save more'],
    reply: "Spending cuts compound fast when redirected. Looking at your profile, your three highest-impact levers are:\n\n- **Dining out**: $220 → $100 = +$120/month\n- **Subscriptions**: $85 → $50 = +$35/month\n- **Personal misc**: $210 → $150 = +$60/month\n\nTell me which cuts feel realistic and I'll model the combined impact. Then hit **Run Simulation**.",
  },
];

/**
 * Return a context-aware reply for the scenario chat in demo mode.
 */
export function getDemoSimulationChatReply(text) {
  const lower = text.toLowerCase();
  const match = SCENARIO_CHAT_REPLIES.find(r => r.keywords.some(kw => lower.includes(kw)));
  if (match) return match.reply;
  return "Good scenario to model. A few things I need to run the comparison accurately:\n\n1. What would change about your monthly income or fixed expenses?\n2. Is there a one-time upfront cost?\n3. What timeframe are you planning for?\n\nOnce you've described it, hit **Run Simulation** to see the 12-month net worth comparison.";
}
