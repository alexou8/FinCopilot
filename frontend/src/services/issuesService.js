import { demoIssues } from '../data/demoIssues';

const USE_MOCK = true;
const API_BASE = '/api';

export async function getIssues(userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return [...demoIssues];
  }
  const res = await fetch(`${API_BASE}/issues/${userId}`);
  if (!res.ok) throw new Error('Issues fetch failed');
  return res.json();
}
