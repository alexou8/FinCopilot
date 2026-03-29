const ISSUE_AGENT_STORAGE_PREFIX = 'fincopilot-issue-agent-';
const ISSUE_AGENT_LAST_KEY = 'fincopilot-issue-agent-last';

const COLLABORATION_PROMPTS = {
  debt_vs_savings: {
    question: 'What is the best payoff option or promo APR you found?',
    placeholder: 'Example: 0.99% for 6 months with a 3% transfer fee',
  },
  low_yield_savings: {
    question: 'What is the best savings rate you found from a source you trust?',
    placeholder: 'Example: 4.25% APY with no monthly fee',
  },
  low_emergency_buffer: {
    question: 'What starter emergency-fund target or weekly transfer felt realistic?',
    placeholder: 'Example: $25/week until I reach $750',
  },
  negative_monthly_cashflow: {
    question: 'What monthly cut or support option looked most realistic?',
    placeholder: 'Example: Switch phone plan and save about $22/month',
  },
  high_rent_burden: {
    question: 'What is the cheapest realistic monthly housing option you found?',
    placeholder: 'Example: $975/month for a room plus about $60 internet',
  },
  tuition_or_outlier_shortfall: {
    question: 'What payment plan, bursary, or bridge option did you find?',
    placeholder: 'Example: 3-installment payment plan with a $35 setup fee',
  },
  decision_timeline_unrealistic: {
    question: 'What real cost number changes the timeline the most?',
    placeholder: 'Example: First month plus deposit is closer to $3,200',
  },
  default: {
    question: 'What is the most useful number or option you found?',
    placeholder: 'Paste the best rate, price, fee, or next step you found',
  },
};

export function getIssueAgentStorageKey(taskId) {
  return `${ISSUE_AGENT_STORAGE_PREFIX}${taskId}`;
}

export function createIssueAgentTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `issue-agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getLastIssueAgentTaskId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ISSUE_AGENT_LAST_KEY);
}

export function getIssueAgentUrl(taskId, isDemo = false, sessionId = null, launching = false) {
  const params = new URLSearchParams({ taskId });
  if (sessionId) params.set('sessionId', sessionId);
  if (isDemo) params.set('demo', 'true');
  if (launching) params.set('launching', 'true');
  return `/dashboard/browser-agent?${params.toString()}`;
}

export function buildIssueAgentTask({ issue, research = null, taskId = createIssueAgentTaskId(), launching = !research }) {
  const prompt = COLLABORATION_PROMPTS[issue?.rule_id] || COLLABORATION_PROMPTS.default;

  return {
    taskId,
    createdAt: new Date().toISOString(),
    issue: {
      rule_id: issue?.rule_id,
      severity: issue?.severity,
      title: research?.title || issue?.title,
      action: research?.action || issue?.action,
      explanation: issue?.explanation || '',
    },
    research,
    launching,
    state: launching ? 'idle' : 'running',
    currentStepIndex: 0,
    collaborationPrompt: prompt,
    capturedAnswer: '',
    result: '',
    sessionId: null,
    runtime: null,
    agentUnavailableReason: '',
  };
}

export function saveIssueAgentTask(task) {
  if (typeof window === 'undefined' || !task?.taskId) return;
  window.localStorage.setItem(getIssueAgentStorageKey(task.taskId), JSON.stringify(task));
  window.localStorage.setItem(ISSUE_AGENT_LAST_KEY, task.taskId);
}

export function loadIssueAgentTask(taskId) {
  if (typeof window === 'undefined' || !taskId) return null;
  const raw = window.localStorage.getItem(getIssueAgentStorageKey(taskId));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function updateIssueAgentTask(taskId, updater) {
  const current = loadIssueAgentTask(taskId);
  if (!current) return null;

  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  saveIssueAgentTask(next);
  return next;
}
