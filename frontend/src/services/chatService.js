import { getMockResponse } from '../data/demoConversation';
import { comparisonToFrontend } from './profileAdapter';

const USE_MOCK = false;
const API_BASE = '/api';

export async function sendMessage(
  message,
  userId = 'demo-user',
  profileTarget = 'before',
  chatMode = 'onboarding',
  profileUserId = null,
) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    return getMockResponse(message);
  }
  const body = { message, user_id: userId, profile_target: profileTarget, chat_mode: chatMode };
  if (profileUserId) body.profile_user_id = profileUserId;
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Chat request failed');
  const data = await res.json();

  // data.profile is a ComparisonProfile — translate to frontend shape before returning
  const profileUpdates = comparisonToFrontend(data.profile);

  return {
    aiMessage: data.reply,
    profileUpdates,
  };
}
