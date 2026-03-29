'use client';

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { runSimulation, getSimulations, deleteSimulation, SimulationError } from '../services/simulationService';

export function useSimulations() {
  const { simulations, setSimulations, activeSimulation, setActiveSimulation, authUser } = useApp();

  const userId = authUser?.id ?? 'demo_user';

  const fetchHistory = useCallback(async () => {
    try {
      const results = await getSimulations(userId);
      setSimulations(results);
    } catch (err) {
      console.error('Failed to fetch simulations:', err);
    }
  }, [userId, setSimulations]);

  const run = useCallback(async (prompt) => {
    if (!prompt?.trim()) return null;
    const result = await runSimulation({ prompt }, userId);
    setSimulations(prev => [result, ...prev]);
    setActiveSimulation(result);
    return result;
  }, [userId, setSimulations, setActiveSimulation]);

  const remove = useCallback(async (id) => {
    try {
      await deleteSimulation(id);
      setSimulations(prev => prev.filter(s => s.id !== id));
      if (activeSimulation?.id === id) setActiveSimulation(null);
    } catch (err) {
      console.error('Failed to delete simulation:', err);
    }
  }, [activeSimulation, setSimulations, setActiveSimulation]);

  const select = useCallback((simulation) => {
    setActiveSimulation(simulation);
  }, [setActiveSimulation]);

  return { simulations, activeSimulation, fetchHistory, run, remove, select };
}
