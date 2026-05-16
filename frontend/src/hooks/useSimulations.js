'use client';

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { runSimulation, getSimulations, deleteSimulation, SimulationError } from '../services/simulationService';
import { createDemoSimulation } from '../data/demoSimulations';

export function useSimulations() {
  const { simulations, setSimulations, activeSimulation, setActiveSimulation, authUser, isDemo } = useApp();

  const userId = authUser?.id ?? 'demo_user';

  const fetchHistory = useCallback(async () => {
    if (isDemo) return; // demo simulations are pre-loaded in context
    try {
      const results = await getSimulations(userId);
      setSimulations(results);
    } catch (err) {
      console.error('Failed to fetch simulations:', err);
    }
  }, [isDemo, userId, setSimulations]);

  const run = useCallback(async (prompt) => {
    if (!prompt?.trim()) return null;
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1800 + Math.random() * 1200));
      const result = createDemoSimulation(prompt);
      setSimulations(prev => [result, ...prev]);
      setActiveSimulation(result);
      return result;
    }
    const result = await runSimulation({ prompt }, userId);
    setSimulations(prev => [result, ...prev]);
    setActiveSimulation(result);
    return result;
  }, [isDemo, userId, setSimulations, setActiveSimulation]);

  const remove = useCallback(async (id) => {
    if (isDemo) {
      setSimulations(prev => prev.filter(s => s.id !== id));
      if (activeSimulation?.id === id) setActiveSimulation(null);
      return;
    }
    try {
      await deleteSimulation(id);
      setSimulations(prev => prev.filter(s => s.id !== id));
      if (activeSimulation?.id === id) setActiveSimulation(null);
    } catch (err) {
      console.error('Failed to delete simulation:', err);
    }
  }, [isDemo, activeSimulation, setSimulations, setActiveSimulation]);

  const select = useCallback((simulation) => {
    setActiveSimulation(simulation);
  }, [setActiveSimulation]);

  return { simulations, activeSimulation, fetchHistory, run, remove, select };
}
