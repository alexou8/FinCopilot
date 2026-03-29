import { comparisonToFrontend, legacyToFrontend, frontendToLegacy } from './profileAdapter';

const USE_MOCK = false;
const API_BASE = '/api';

export async function getProfile(userId = 'demo-user') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return null;
  }

  // Try the comparison profile first (has decision field, richer data)
  const rawRes = await fetch(`${API_BASE}/profiles/${encodeURIComponent(userId)}/comparison`);
  if (rawRes.ok) {
    const data = await rawRes.json();
    const profile = comparisonToFrontend(data);
    if (profile) return profile;
  }

  // Fall back to legacy endpoint
  const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(userId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Profile fetch failed');
  const data = await res.json();
  return legacyToFrontend(data);
}

export async function updateProfile(userId = 'demo-user', profile) {
  if (USE_MOCK) return profile;
  // Translate frontend shape → FinancialProfile before sending
  const payload = frontendToLegacy(profile);
  const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Profile update failed');
  const data = await res.json();
  // Translate the confirmed response back so local state stays in sync
  return legacyToFrontend(data) ?? profile;
}
