'use client';

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { runSimulation, getSimulations, deleteSimulation } from '../services/simulationService';

export function useSimulations() {
  const { simulations, setSimulations, activeSimulation, setActiveSimulation, profile } = useApp();

  const fetchHistory = useCallback(async (userId = 'demo-user') => {
    try {
      const results = await getSimulations(userId);
      setSimulations(results);
    } catch (err) {
      console.error('Failed to fetch simulations:', err);
    }
  }, [setSimulations]);

  const run = useCallback(async (prompt) => {
    if (!prompt?.trim()) return null;
    try {
      const result = await runSimulation({
        prompt,
        profileBefore: profile,
        // profileAfter is derived by the backend AI from the prompt
      });
      // Prepend to history and set as active
      setSimulations(prev => [result, ...prev]);
      setActiveSimulation(result);
      return result;
    } catch (err) {
      console.error('Simulation failed:', err);
      return null;
    }
  }, [profile, setSimulations, setActiveSimulation]);

  const remove = useCallback(async (id, userId = 'demo-user') => {
    try {
      await deleteSimulation(id, userId);
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
