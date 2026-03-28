// Simulation service — runs a financial simulation and fetches simulation history.
// Backed by Supabase (simulations table) once credentials are configured.
// Set USE_MOCK = false to use real backend API + Supabase storage.

import { supabase } from '../lib/supabase';
import { demoSimulations } from '../data/demoSimulations';

// Simulation backend endpoints don't exist yet — keep mock on until they are built
const USE_MOCK = true;
const API_BASE = '/api';

/**
 * Run a new simulation.
 * Backend uses AI to parse the prompt and determine what to model
 * (e.g. "move out" → adds rent expense, removes current housing savings).
 * Result is stored in Supabase: simulations table.
 *
 * @param {{ prompt: string, profileBefore: object, profileAfter?: object }} params
 * @param {string} userId
 */
export async function runSimulation(params, userId = 'demo-user') {
  if (USE_MOCK) {
    await delay(1800 + Math.random() * 800);
    // Return the first demo simulation as a template with the user's prompt
    const result = {
      ...demoSimulations[0],
      id: `sim-${Date.now()}`,
      prompt: params.prompt,
      title: params.prompt,
      createdAt: new Date().toISOString(),
    };
    return result;
  }

  // TODO: POST to backend simulation endpoint
  // Backend will:
  //   1. Use Claude/OpenAI to understand the prompt and build profileAfter
  //   2. Run deterministic financial projections for both profiles
  //   3. Store result in Supabase: simulations table
  //   4. Return the full simulation result
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, userId }),
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

/**
 * Fetch simulation history for a user.
 * TODO: Replace fetch with Supabase query once auth is set up:
 *   supabase.from('simulations').select().eq('user_id', userId).order('created_at', { ascending: false })
 */
export async function getSimulations(userId = 'demo-user') {
  if (USE_MOCK) {
    await delay(300);
    return [...demoSimulations];
  }
  const res = await fetch(`${API_BASE}/simulations?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch simulations');
  return res.json();
}

/**
 * Delete a simulation by ID.
 * TODO: supabase.from('simulations').delete().eq('id', id).eq('user_id', userId)
 */
export async function deleteSimulation(id, userId = 'demo-user') {
  if (USE_MOCK) {
    await delay(300);
    return { error: null };
  }
  const res = await fetch(`${API_BASE}/simulations/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to delete simulation');
  return res.json();
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
