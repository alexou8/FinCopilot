import { getMockResponse } from '../data/demoConversation';
import { comparisonToFrontend } from './profileAdapter';

const USE_MOCK = false;
const API_BASE = '/api';

/**
 * Fetch the full onboarding conversation history for a user.
 * Returns an array of { id, role, content, timestamp } message objects.
 */
export async function getConversationHistory(userId) {
  const res = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.messages || []).map((msg, i) => ({
    id: `hist-${i}`,
    role: msg.role,
    content: msg.content,
    timestamp: msg.created_at || null,
  }));
}

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
