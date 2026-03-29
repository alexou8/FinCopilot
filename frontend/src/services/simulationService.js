// Simulation service — runs financial simulations and fetches history.
// Backed by the FastAPI backend which writes to the Supabase simulations table.

const API_BASE = '/api';

/**
 * Map a raw SimulationRecord from the backend into the shape expected by the
 * frontend components (SimulationResultView, SimulationHistoryCard, ComparisonChart).
 */
function apiToFrontend(sim) {
  const before = sim.monthly_net_worth_before || [];
  const after  = sim.monthly_net_worth_after  || [];
  const rec    = sim.recommendation || {};
  const sb     = sim.summary_before || {};
  const sa     = sim.summary_after  || {};

  const trajectories = before.map((b, i) => ({
    month:    b.month,
    current:  b.value,
    scenario: after[i]?.value ?? b.value,
  }));

  return {
    id:        sim.id,
    prompt:    sim.scenario_name,
    createdAt: sim.created_at,
    status:    'completed',
    scenarios: {
      baseline:    { label: 'Current path' },
      alternative: { label: sim.scenario_name },
    },
    verdict: {
      feasible:        rec.feasible ?? (sa.monthly_surplus >= 0),
      headline:        rec.headline  ?? 'Simulation complete',
      summary:         rec.body      ?? '',
      recommendations: rec.recommendations ?? [],
    },
    metrics: {
      current: {
        monthlySavings:      sb.monthly_surplus   ?? 0,
        monthsToGoal:        null,
        emergencyFundMonths: null,
        monthlyInterestPaid: 0,
      },
      scenario: {
        monthlySavings:      sa.monthly_surplus   ?? 0,
        monthsToGoal:        null,
        emergencyFundMonths: null,
        monthlyInterestPaid: 0,
      },
    },
    trajectories,
    // Keep raw fields for debugging / profile pane
    _raw: sim,
  };
}

/**
 * Run a new simulation.
 * Backend: builds profile_after from prompt via AI, computes 12-month net worth
 * trajectories, generates a recommendation, and stores everything in Supabase.
 *
 * @param {{ prompt: string, profileBefore?: object }} params
 * @param {string} userId
 */
/**
 * Named error codes the UI can branch on.
 * - BEFORE_PROFILE_MISSING: user hasn't completed onboarding chat
 * - AFTER_PROFILE_MISSING:  user hasn't described a scenario in the simulation chat
 * - UNKNOWN: anything else
 */
export class SimulationError extends Error {
  constructor(detail, code = 'UNKNOWN') {
    super(detail);
    this.code = code;
  }
}

export async function runSimulation(params, userId = 'demo_user') {
  const res = await fetch(`${API_BASE}/simulations/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:       userId,
      scenario_name: params.prompt || 'Scenario comparison',
      // prompt is optional on the backend — scenario_name is used as the label
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail || 'Simulation failed';
    let code = 'UNKNOWN';
    if (res.status === 404) {
      code = detail.toLowerCase().includes('before') ? 'BEFORE_PROFILE_MISSING' : 'AFTER_PROFILE_MISSING';
    }
    throw new SimulationError(detail, code);
  }
  const sim = await res.json();
  return apiToFrontend(sim);
}

/**
 * Fetch simulation history for a user.
 *
 * @param {string} userId
 */
export async function getSimulations(userId = 'demo_user') {
  const res = await fetch(`${API_BASE}/simulations/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch simulations');
  const sims = await res.json();
  return sims.map(apiToFrontend);
}

/**
 * Delete a simulation by ID.
 *
 * @param {number|string} id
 */
export async function deleteSimulation(id) {
  const res = await fetch(`${API_BASE}/simulations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete simulation');
  return res.json();
}
