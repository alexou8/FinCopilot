// Simulation service — runs financial simulations and fetches history.
// Backed by the FastAPI backend which writes to the Supabase simulations table.

const API_BASE = '/api';

/**
 * Map a raw SimulationRecord from the backend into the shape expected by the
 * frontend components (SimulationResultView, SimulationHistoryCard, ComparisonChart).
 */
/**
 * Compute months-to-goal: how many months of saving at `surplus` to reach `targetAmount`.
 * Returns null if surplus <= 0 or no target is set.
 */
function computeMonthsToGoal(surplus, targetAmount) {
  if (!targetAmount || surplus <= 0) return null;
  return Math.ceil(targetAmount / surplus);
}

/**
 * Compute emergency fund coverage: how many months of expenses the accounts can cover.
 * Returns null if monthly expenses are 0.
 */
function computeEmergencyFundMonths(accountTotal, monthlyExpenses) {
  if (!monthlyExpenses || monthlyExpenses <= 0) return null;
  return Math.round((accountTotal / monthlyExpenses) * 10) / 10;
}

function apiToFrontend(sim) {
  const before = sim.monthly_net_worth_before || [];
  const after  = sim.monthly_net_worth_after  || [];
  const rec    = sim.recommendation || {};
  const sb     = sim.summary_before || {};
  const sa     = sim.summary_after  || {};

  // Extract decision target from the before-profile (if available)
  const decision = sim.profile_data_before?.decision;
  const targetAmount = decision?.target_amount ?? null;

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
        monthsToGoal:        computeMonthsToGoal(sb.monthly_surplus, targetAmount),
        emergencyFundMonths: computeEmergencyFundMonths(sb.account_total ?? 0, sb.monthly_expenses ?? 0),
        monthlyInterestPaid: 0,
      },
      scenario: {
        monthlySavings:      sa.monthly_surplus   ?? 0,
        monthsToGoal:        computeMonthsToGoal(sa.monthly_surplus, targetAmount),
        emergencyFundMonths: computeEmergencyFundMonths(sa.account_total ?? 0, sa.monthly_expenses ?? 0),
        monthlyInterestPaid: 0,
      },
    },
    trajectories,
    targetAmount,
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
