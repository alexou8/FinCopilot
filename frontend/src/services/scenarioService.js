import { demoScenario } from '../data/demoScenario';

const USE_MOCK = true;
const API_BASE = '/api';

export async function runScenario(params, userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    return { ...demoScenario };
  }
  const res = await fetch(`${API_BASE}/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, userId }),
  });
  if (!res.ok) throw new Error('Scenario run failed');
  return res.json();
}
