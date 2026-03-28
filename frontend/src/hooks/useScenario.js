'use client';

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { runScenario } from '../services/scenarioService';
import { demoScenario } from '../data/demoScenario';

export function useScenario() {
  const { scenario, setScenario, setActivePanel } = useApp();

  const loadDemo = useCallback(() => {
    setScenario(demoScenario);
    setActivePanel('scenario');
  }, [setScenario, setActivePanel]);

  const run = useCallback(async (params) => {
    try {
      const result = await runScenario(params);
      setScenario(result);
      setActivePanel('scenario');
    } catch (err) {
      console.error('Scenario failed:', err);
    }
  }, [setScenario, setActivePanel]);

  return { scenario, run, loadDemo };
}
