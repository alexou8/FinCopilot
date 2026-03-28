'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { demoProfile } from '../data/demoProfile';
import { demoConversation } from '../data/demoConversation';
import { demoIssues } from '../data/demoIssues';
import { demoSimulations } from '../data/demoSimulations';

const AppContext = createContext(null);

export function AppProvider({ children, isDemo = false }) {
  // Chat
  const [messages, setMessages]       = useState(isDemo ? demoConversation : []);
  const [isTyping, setIsTyping]       = useState(false);

  // Profile (financial data)
  const [profile, setProfile]         = useState(isDemo ? demoProfile : null);
  const [updatedFields, setUpdatedFields] = useState({});

  // Issues
  const [issues, setIssues]           = useState(isDemo ? demoIssues : []);

  // Simulations (replaces single scenario)
  const [simulations, setSimulations] = useState(isDemo ? demoSimulations : []);
  const [activeSimulation, setActiveSimulation] = useState(isDemo ? demoSimulations[0] : null);

  // Auth user — populated from Supabase after sign-in; demo object when isDemo=true
  const DEMO_AUTH_USER = { id: 'demo-user-001', email: 'alex.chen@laurier.ca', name: 'Alex Chen' };
  const [authUser, setAuthUser]       = useState(isDemo ? DEMO_AUTH_USER : null);

  // UI state — start on simulations in demo so the flagship feature is immediately visible
  const [activeNav, setActiveNav]     = useState(isDemo ? 'simulations' : 'chat');

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateProfileField = useCallback((field) => {
    setUpdatedFields(prev => ({ ...prev, [field]: Date.now() }));
    setTimeout(() => {
      setUpdatedFields(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }, 1500);
  }, []);

  return (
    <AppContext.Provider value={{
      // Chat
      messages, setMessages, addMessage,
      isTyping, setIsTyping,

      // Profile
      profile, setProfile,
      updatedFields, updateProfileField,

      // Issues
      issues, setIssues,

      // Simulations
      simulations, setSimulations,
      activeSimulation, setActiveSimulation,

      // Auth
      authUser, setAuthUser,

      // UI
      activeNav, setActiveNav,

      // Legacy compatibility (some hooks still reference these)
      // TODO: remove once all consumers are migrated
      activePanel: 'simulations',
      setActivePanel: () => {},
      scenario: activeSimulation,
      setScenario: setActiveSimulation,

      isDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
