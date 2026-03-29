import { demoScenario } from '../data/demoScenario';

const USE_MOCK = false;
const API_BASE = 'http://localhost:8000';

export async function runScenario(params, userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    return { ...demoScenario };
  }
  const res = await fetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error('Scenario run failed');
  return res.json();
}
