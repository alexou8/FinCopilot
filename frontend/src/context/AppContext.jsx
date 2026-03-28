'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { demoProfile } from '../data/demoProfile';
import { demoConversation } from '../data/demoConversation';
import { demoIssues } from '../data/demoIssues';

const AppContext = createContext(null);

export function AppProvider({ children, isDemo = false }) {
  const [messages, setMessages]         = useState(isDemo ? demoConversation : []);
  const [profile, setProfile]           = useState(isDemo ? demoProfile : null);
  const [issues, setIssues]             = useState(isDemo ? demoIssues : []);
  const [scenario, setScenario]         = useState(null);
  const [updatedFields, setUpdatedFields] = useState({});
  const [activePanel, setActivePanel]   = useState('issues');
  const [activeNav, setActiveNav]       = useState('chat');
  const [isTyping, setIsTyping]         = useState(false);

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
      messages, setMessages, addMessage,
      profile, setProfile,
      issues, setIssues,
      scenario, setScenario,
      updatedFields, updateProfileField,
      activePanel, setActivePanel,
      activeNav, setActiveNav,
      isTyping, setIsTyping,
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
