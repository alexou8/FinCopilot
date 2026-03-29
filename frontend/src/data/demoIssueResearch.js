const DEMO_RESEARCH_BY_RULE = {
  debt_vs_savings: {
    rule_id: 'debt_vs_savings',
    title: 'High-interest debt is outpacing your savings',
    action: 'See payoff options',
    mode: 'live',
    search_query: 'best ways to pay off high interest credit card debt balance transfer Canada',
    search_url:
      'https://www.google.com/search?q=best+ways+to+pay+off+high+interest+credit+card+debt+balance+transfer+Canada',
    browser_goal:
      'Find current debt payoff options that reduce interest faster than keeping cash in a low-yield savings account.',
    summary:
      'The fastest wins usually come from lowering the card interest rate or making a one-time payoff using idle cash. A guided search should compare nonprofit counselling, balance transfer details, and simple repayment tactics before you act.',
    findings: [
      {
        label: 'Current drag',
        value: '$32/month',
        detail: 'Your debt interest is beating what your savings earns by roughly this amount.',
      },
      {
        label: 'Best research target',
        value: 'Balance transfer or payoff',
        detail: 'Look for current intro-rate offers, fees, and credit counselling options.',
      },
    ],
    steps: [
      {
        title: 'Search debt payoff options',
        action: 'Open current balance transfer and credit counselling resources.',
        reason: 'This is the fastest way to see whether you can cut the interest rate immediately.',
        source_hint: 'Official bank offer pages and nonprofit counselling sites.',
      },
      {
        title: 'Compare fees against savings',
        action: 'Check transfer fees, promo windows, and how much cash you could safely apply now.',
        reason: 'A lower rate is only worth it if the math beats your current setup.',
        source_hint: 'Focus on APR, transfer fee, and minimum payment details.',
      },
      {
        title: 'Pick one move this week',
        action: 'Choose the lowest-friction option and estimate the monthly interest you would avoid.',
        reason: 'Research only matters once it changes the next payment decision.',
      },
    ],
    recommendations: [
      {
        title: 'Price out one balance transfer',
        description: 'Compare the fee and promo period against the interest you are paying now.',
        expected_impact: 'Potentially meaningful monthly interest savings.',
      },
      {
        title: 'Use part of savings if your buffer stays intact',
        description: 'A partial payoff can be rational when the debt APR is far above the savings rate.',
        expected_impact: 'Immediate reduction in interest cost.',
      },
    ],
    sources: [
      { title: 'Canada.ca', url: 'https://www.canada.ca/' },
      { title: 'FCAC', url: 'https://www.canada.ca/en/financial-consumer-agency.html' },
    ],
  },
  low_emergency_buffer: {
    rule_id: 'low_emergency_buffer',
    title: 'Your emergency buffer is under 1 month',
    action: 'Build a cash buffer',
    mode: 'live',
    search_query: 'how to build an emergency fund quickly student budget Canada',
    search_url:
      'https://www.google.com/search?q=how+to+build+an+emergency+fund+quickly+student+budget+Canada',
    browser_goal:
      'Find realistic starter-emergency-fund tactics that work on a student-sized budget.',
    summary:
      'The first goal is not a perfect emergency fund. It is reaching a small, usable buffer quickly with a no-fee place to park cash and a repeatable transfer plan.',
    findings: [
      {
        label: 'Current buffer',
        value: '13 days',
        detail: 'That leaves little room for a car repair, medical cost, or job disruption.',
      },
      {
        label: 'Research focus',
        value: 'Starter fund systems',
        detail: 'Look for small automatic transfer ideas and fee-free cash accounts.',
      },
    ],
    steps: [
      {
        title: 'Search starter buffer guidance',
        action: 'Open trustworthy emergency-fund guides and student support resources.',
        reason: 'The goal is to find a realistic first target, not generic advice.',
      },
      {
        title: 'Find a low-friction account',
        action: 'Compare fee-free cash accounts or HISAs that can hold the buffer.',
        reason: 'The buffer must stay accessible and should not lose money to fees.',
      },
      {
        title: 'Set a weekly target',
        action: 'Translate the guidance into one automatic transfer you can keep for the next month.',
        reason: 'Consistency matters more than an ambitious number you will abandon.',
      },
    ],
    recommendations: [
      {
        title: 'Start with a one-paycheque buffer target',
        description: 'Use the research to set a first milestone you can actually hit.',
        expected_impact: 'Lower chance of adding new debt for small emergencies.',
      },
      {
        title: 'Automate one transfer',
        description: 'Even a small weekly amount can rebuild the buffer if it happens automatically.',
      },
    ],
    sources: [
      { title: 'FCAC', url: 'https://www.canada.ca/en/financial-consumer-agency.html' },
    ],
  },
  decision_timeline_unrealistic: {
    rule_id: 'decision_timeline_unrealistic',
    title: 'Your current timeline looks unrealistic',
    action: 'Compare alternative plans',
    mode: 'live',
    search_query: 'cost to move out first apartment budget deposits utilities internet Canada',
    search_url:
      'https://www.google.com/search?q=cost+to+move+out+first+apartment+budget+deposits+utilities+internet+Canada',
    browser_goal:
      'Pull current move-out cost examples so the timeline can be reset with real numbers instead of guesses.',
    summary:
      'When the timeline is unrealistic, the best next step is pricing the decision more accurately. Housing, deposits, internet, and transit often push the target up faster than expected.',
    findings: [
      {
        label: 'Main issue',
        value: 'Goal costs are under-researched',
        detail: 'The browser pass should verify deposits, monthly rent, internet, and transit costs.',
      },
      {
        label: 'Best lever',
        value: 'Cheaper housing path',
        detail: 'Shared housing or a later date may shrink the gap faster than minor budget cuts.',
      },
    ],
    steps: [
      {
        title: 'Search move-out cost examples',
        action: 'Open current rent, deposit, utility, and internet cost pages.',
        reason: 'This establishes a realistic target amount for the plan.',
      },
      {
        title: 'Compare lower-cost versions',
        action: 'Check shared housing, roommate, or lower-amenity options.',
        reason: 'A cheaper version of the plan may be feasible sooner.',
      },
      {
        title: 'Reset the timeline',
        action: 'Use the verified costs to estimate how much longer the goal will take.',
        reason: 'The corrected timeline should be based on current prices, not hope.',
      },
    ],
    recommendations: [
      {
        title: 'Price the low-cost version first',
        description: 'Find the cheapest realistic move-out setup before assuming the current plan is fixed.',
        expected_impact: 'Could reduce the savings target and shorten the delay.',
      },
      {
        title: 'Use verified costs in the next scenario',
        description: 'Bring rent, internet, transit, and deposit numbers back into the simulator.',
      },
    ],
    sources: [
      { title: 'Rentals.ca', url: 'https://rentals.ca/' },
      { title: 'Numbeo', url: 'https://www.numbeo.com/cost-of-living/' },
    ],
  },
  low_yield_savings: {
    rule_id: 'low_yield_savings',
    title: 'Your savings are earning very little',
    action: 'Compare savings options',
    mode: 'live',
    search_query: 'best high interest savings account rates Canada no monthly fee',
    search_url:
      'https://www.google.com/search?q=best+high+interest+savings+account+rates+Canada+no+monthly+fee',
    browser_goal:
      'Find current high-yield cash options with better rates and low friction.',
    summary:
      'A live search should compare current HISA or cash-account rates, monthly fees, and transfer flexibility. The goal is not to chase every promotion, but to find one clearly better home for idle cash.',
    findings: [
      {
        label: 'Current rate',
        value: '0.5% APY',
        detail: 'That is likely leaving easy interest on the table.',
      },
      {
        label: 'Best research target',
        value: 'Official rate pages',
        detail: 'Compare APY, fees, CDIC coverage, and transfer limits.',
      },
    ],
    steps: [
      {
        title: 'Search current cash rates',
        action: 'Open official HISA or cash-account rate pages.',
        reason: 'Current rates change often, so this needs live verification.',
      },
      {
        title: 'Compare the real trade-offs',
        action: 'Check APY, fees, access rules, and any promotional conditions.',
        reason: 'A higher headline rate is not enough if the account is hard to use.',
      },
      {
        title: 'Choose one upgrade path',
        action: 'Pick the simplest account that materially improves the rate.',
        reason: 'The best option is the one you will actually switch into.',
      },
    ],
    recommendations: [
      {
        title: 'Shortlist two no-fee options',
        description: 'Use the browser pass to narrow the field before opening anything.',
        expected_impact: 'Higher monthly interest with minimal behaviour change.',
      },
      {
        title: 'Check TFSA room if relevant',
        description: 'A registered cash option may help if you want to shelter the interest.',
      },
    ],
    sources: [
      { title: 'Ratehub', url: 'https://www.ratehub.ca/' },
      { title: 'Canada.ca', url: 'https://www.canada.ca/' },
    ],
  },
};

export function getDemoIssueResearch(issue) {
  return DEMO_RESEARCH_BY_RULE[issue?.rule_id] || {
    rule_id: issue?.rule_id || issue?.id || 'issue',
    title: issue?.title || 'Financial issue',
    action: issue?.action || 'Open research',
    mode: 'manual',
    search_query: 'financial issue solutions current costs trusted resources',
    search_url:
      'https://www.google.com/search?q=financial+issue+solutions+current+costs+trusted+resources',
    browser_goal:
      'Gather a few trustworthy sources and bring the most relevant numbers back into FinCopilot.',
    summary:
      'This issue can still use the guided research workspace even in demo mode. Open the search tab, compare a few trusted sources, and keep the numbers that change the decision.',
    findings: [
      {
        label: 'Issue',
        value: issue?.title || 'Financial issue',
      },
    ],
    steps: [
      {
        title: 'Open the search',
        action: 'Start with a focused search query.',
        reason: 'The browser workspace is designed to narrow the web to a few useful sources.',
      },
      {
        title: 'Capture current numbers',
        action: 'Look for costs, rates, or eligibility details.',
        reason: 'Live inputs are more useful than generic advice.',
      },
      {
        title: 'Bring back one decision-ready insight',
        action: 'Use the number that changes the next action you would take.',
        reason: 'A small concrete action beats a vague plan.',
      },
    ],
    recommendations: [
      {
        title: 'Start with trusted sources',
        description: 'Prefer official institutions, providers, and nonprofit organizations.',
      },
    ],
    sources: [],
  };
}
