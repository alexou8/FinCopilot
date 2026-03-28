import { demoIssues } from '../data/demoIssues';

const USE_MOCK = false;
const API_BASE = '/api';

export async function getIssues(userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return [...demoIssues];
  }
  // Backend expects POST with { user_id } body, returns { issues: [...] }
  const res = await fetch(`${API_BASE}/issues/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error('Issues fetch failed');
  const data = await res.json();
  return data.issues;
}
