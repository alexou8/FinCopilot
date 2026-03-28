import { getMockResponse } from '../data/demoConversation';

const USE_MOCK = true;
const API_BASE = '/api';

export async function sendMessage(message, userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    return getMockResponse(message);
  }
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}
