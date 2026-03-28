export const demoConversation = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hey Alex! I'm FinCopilot, your personal financial thinking partner. I'm here to help you understand your money, spot issues, and answer big questions like \"can I afford to move out?\"\n\nTo get started, can you tell me about your income? Do you work part-time, get OSAP, or have any family support?",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: "I work part-time at a retail store, about $1,200/month. I also get OSAP — around $650/month in grants. And my parents chip in $300.",
    timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: "Got it — I've updated your income profile. You're bringing in **$2,150/month** total:\n- Part-time job: $1,200\n- OSAP grant: $650\n- Family support: $300\n\nNow let's look at expenses. What's your rent situation?",
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    profileUpdates: { income: true },
  },
  {
    id: 'msg-4',
    role: 'user',
    content: "Renting a room for $900/month. Groceries ~$320, dining out ~$220 (I know, too much), transport $180, subscriptions $85, phone $65, misc personal stuff ~$210.",
    timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
  },
  {
    id: 'msg-5',
    role: 'assistant',
    content: "Logged all your expenses — **$1,980/month** total, leaving a **$170/month surplus**. That's tight but workable.\n\nQuick observations:\n- Dining out ($220) is your biggest discretionary spend\n- Your savings account at 0.5% APY is basically doing nothing\n\nDo you have any debt? Student loans, credit card balance?",
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    profileUpdates: { expenses: true },
  },
  {
    id: 'msg-6',
    role: 'user',
    content: "OSAP loan of ~$18,400 but I don't pay that yet. And a TD credit card with $2,340 on it at 19.99%.",
    timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
  },
  {
    id: 'msg-7',
    role: 'assistant',
    content: "That credit card is costing you real money. At **19.99% APR**, $2,340 costs you ~$39/month in interest — while your savings earns only ~$7/month.\n\nI've flagged this as a critical issue. OSAP is fine for now — no payments until 6 months post-graduation.\n\nAny financial goals you're working toward?",
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    profileUpdates: { debt: true },
  },
  {
    id: 'msg-8',
    role: 'user',
    content: "I really want to move out on my own by September. I figure I need about $4,500 for first + last + setup.",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'msg-9',
    role: 'assistant',
    content: "Love the goal — here's the reality check:\n\nYou need **$4,500 in ~6 months**. At $170/month savings you'd only reach $1,900 — **$2,600 short**.\n\nTo hit September you'd need to save **$520/month**, meaning an extra $350 in cuts or income. Check the Issues panel to see exactly what's standing in your way.",
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    profileUpdates: { goal: true },
  },
];

const demoResponses = [
  {
    triggers: ['move out', 'afford', 'own place', 'apartment', 'rent my own'],
    response: {
      aiMessage: "Let me run a what-if scenario for you.\n\n**Current path:** At $170/month savings you'd reach $4,500 in ~26 months.\n\n**If you cut dining out to $100/month** (+$120 saved) and make extra credit card payments, you could hit **$337/month savings** and get there in ~13 months.\n\nI've loaded the full scenario comparison — check the Scenario tab!",
      type: 'scenario',
    },
  },
  {
    triggers: ['credit card', 'debt', 'interest', 'pay off', 'payoff'],
    response: {
      aiMessage: "Your TD card at **19.99% APR** is genuinely expensive. Here's a concrete plan:\n\n1. **Redirect $120/month** from dining out to the card\n2. Total monthly payment: **$167** ($47 min + $120 extra)\n3. **Paid off in 16 months** vs. never if you pay minimums\n4. **Interest saved: ~$380**\n\nOnce it's gone, that $167/month becomes savings toward your move-out goal.",
      type: 'advice',
    },
  },
  {
    triggers: ['osap', 'student loan', 'loans', 'loan'],
    response: {
      aiMessage: "Your OSAP situation is actually solid compared to most students:\n\n- **$18,400** at 6.5% APR\n- **No payments required** until 6 months post-graduation\n- Once repayment starts: ~$200–250/month minimum\n\nStrategy: **Don't stress about OSAP now.** Focus on the credit card first (19.99% vs 6.5% — 3× the rate). After the CC is clear and you've moved out, start voluntary OSAP payments to reduce principal.",
      type: 'advice',
    },
  },
  {
    triggers: ['savings', 'hisa', 'high interest', 'account', 'interest account'],
    response: {
      aiMessage: "Your TD Savings at **0.5% APY** is essentially a parking lot — it's losing value to inflation.\n\n**Better options:**\n- **EQ Bank HISA**: 3.0% APY, no fees, CDIC insured\n- **Wealthsimple Cash**: 3.5% APY, instant transfers\n- **TFSA savings**: Tax-free growth at same rates\n\nMoving your $1,420 to a 3% HISA earns **$43/year** instead of $7. It's a 5-minute account opening.",
      type: 'advice',
    },
  },
  {
    triggers: ['budget', 'cut', 'save more', 'spending', 'reduce'],
    response: {
      aiMessage: "Looking at your spending, here are the highest-impact cuts:\n\n| Category | Current | Target | Saved |\n|----------|---------|--------|-------|\n| Dining out | $220 | $100 | +$120 |\n| Subscriptions | $85 | $50 | +$35 |\n| Personal | $210 | $160 | +$50 |\n\n**Total potential: +$205/month** — that nearly doubles your savings rate from $170 to $375/month. At that pace you'd hit your move-out goal in ~9 months.",
      type: 'advice',
    },
  },
];

export function getMockResponse(message) {
  const lower = message.toLowerCase();
  for (const item of demoResponses) {
    if (item.triggers.some(t => lower.includes(t))) {
      return {
        aiMessage: item.response.aiMessage,
        type: item.response.type,
        profileUpdates: {},
      };
    }
  }
  return {
    aiMessage: "Based on your profile — $2,150/month income, $1,980 expenses, $170 surplus — I'd prioritize three things:\n\n1. **Pay down your credit card** (19.99% APR is expensive)\n2. **Move savings to a HISA** (earn 3% instead of 0.5%)\n3. **Trim dining out** to boost your monthly surplus\n\nWhat would you like to dive deeper into?",
    type: 'advice',
    profileUpdates: {},
  };
}
