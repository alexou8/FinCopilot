import { getMockResponse } from '../data/demoConversation';

const USE_MOCK = false;
const API_BASE = '/api';

export async function sendMessage(message, userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    return getMockResponse(message);
  }
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, message }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  const data = await res.json();
  // Map backend shape { reply, profile } → shape expected by useChat
  return {
    aiMessage: data.reply,
    profileUpdates: data.profile || {},
    type: null,
  };
}
