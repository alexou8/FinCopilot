import { demoProfile } from '../data/demoProfile';

const USE_MOCK = true;
const API_BASE = '/api';

let localProfile = { ...demoProfile };

export async function getProfile(userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return { ...localProfile };
  }
  const res = await fetch(`${API_BASE}/profile/${userId}`);
  if (!res.ok) throw new Error('Profile fetch failed');
  return res.json();
}

export async function updateProfile(userId = 'demo-user', updates) {
  if (USE_MOCK) {
    localProfile = { ...localProfile, ...updates };
    return { ...localProfile };
  }
  const res = await fetch(`${API_BASE}/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Profile update failed');
  return res.json();
}

export function resetProfile() {
  localProfile = { ...demoProfile };
}
