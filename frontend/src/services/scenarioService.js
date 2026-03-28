import { demoScenario } from '../data/demoScenario';

const USE_MOCK = false;
const API_BASE = '/api';

export async function runScenario(params, userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    return { ...demoScenario };
  }
  // Step 1: parse the natural-language question into structured changes
  const res = await fetch(`${API_BASE}/scenarios/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, question: params.question }),
  });
  if (!res.ok) throw new Error('Scenario run failed');
  return res.json();
}
