import { getDemoIssueResearch } from '../data/demoIssueResearch';

const API_BASE = '/api';

export async function getIssueResearch({ userId = 'demo-user', ruleId, issue, isDemo = false }) {
  if (!ruleId) {
    throw new Error('Issue rule_id is required');
  }

  if (isDemo) {
    await new Promise(resolve => setTimeout(resolve, 350));
    return getDemoIssueResearch(issue);
  }

  const res = await fetch(`${API_BASE}/issues/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, rule_id: ruleId }),
  });

  if (res.status === 404) {
    throw new Error('Issue research target not found');
  }
  if (!res.ok) {
    throw new Error('Issue research failed');
  }

  return res.json();
}
