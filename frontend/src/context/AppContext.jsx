'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/profileService';
import { getConversationHistory } from '../services/chatService';
import { startBrowserAgent } from '../services/browserAgentService';
import { getIssueResearch } from '../services/issueResearchService';
import {
  buildIssueAgentTask,
  saveIssueAgentTask,
  updateIssueAgentTask,
} from '../lib/issueAgent';
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
  const [activeIssue, setActiveIssue] = useState(null);
  const [issueResearch, setIssueResearch] = useState(null);
  const [issueResearchLoading, setIssueResearchLoading] = useState(false);
  const [issueResearchError, setIssueResearchError] = useState(null);
  const [issueAgentTaskId, setIssueAgentTaskId] = useState(null);
  const [issueAgentSessionId, setIssueAgentSessionId] = useState(null);

  // Simulations (replaces single scenario)
  const [simulations, setSimulations] = useState(isDemo ? demoSimulations : []);
  const [activeSimulation, setActiveSimulation] = useState(isDemo ? demoSimulations[0] : null);

  // Auth user — populated from Supabase after sign-in; demo object when isDemo=true
  const DEMO_AUTH_USER = { id: 'demo-user-001', email: 'alex.chen@laurier.ca', name: 'Alex Chen' };
  const [authUser, setAuthUser]       = useState(isDemo ? DEMO_AUTH_USER : null);

  // UI state — start on simulations in demo so the flagship feature is immediately visible
  const [activeNav, setActiveNav]     = useState(isDemo ? 'simulations' : 'chat');

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});

  const addToast = useCallback((message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    toastTimers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete toastTimers.current[id];
    }, 3000);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (toastTimers.current[id]) {
      clearTimeout(toastTimers.current[id]);
      delete toastTimers.current[id];
    }
  }, []);

  // Onboarding progress — derived from profile fields
  const ONBOARDING_STEPS = [
    { key: 'income',   label: 'Income' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'debt',     label: 'Debt' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'decision', label: 'Decision' },
  ];

  const onboardingProgress = useMemo(() => {
    if (!profile) return { step: 0, total: 5, label: 'Income', completed: false };
    let step = 0;
    for (const s of ONBOARDING_STEPS) {
      if (profile[s.key] != null) step++;
      else break;
    }
    const completed = step >= 5;
    const label = completed ? 'Complete' : ONBOARDING_STEPS[step]?.label ?? 'Income';
    return { step, total: 5, label, completed };
  }, [profile]);

  // Subscribe to Supabase auth state (no-op in demo mode or when Supabase is not configured)
  useEffect(() => {
    if (isDemo || !supabase) return;

    function applySession(session) {
      if (session?.user) {
        const user = {
          id:    session.user.id,
          email: session.user.email,
          name:  session.user.user_metadata?.name ?? session.user.email,
        };
        setAuthUser(user);
        // Load saved profile and conversation history from backend for this user
        getProfile(user.id).then(fp => { if (fp) setProfile(fp); }).catch(console.error);
        getConversationHistory(user.id).then(msgs => { if (msgs.length) setMessages(msgs); }).catch(console.error);
      } else {
        setAuthUser(null);
      }
    }

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    // Listen to future auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const openIssueAgentTab = useCallback(() => {
    setActiveNav('browserAgent');
    return null;
  }, [setActiveNav]);

  const launchIssueResearch = useCallback(async (issue) => {
    const ruleId = issue?.rule_id ?? issue?.ruleId;
    if (!ruleId) {
      throw new Error('Issue rule_id is required');
    }

    setActiveIssue(issue);
    setIssueResearch(null);
    setIssueResearchError(null);
    setIssueResearchLoading(true);
    setActiveNav('browserAgent');

    try {
      const research = await getIssueResearch({
        userId: authUser?.id ?? 'demo-user',
        ruleId,
        issue,
        isDemo,
      });
      let task = buildIssueAgentTask({ issue, research });
      saveIssueAgentTask(task);
      setIssueAgentTaskId(task.taskId);
      setIssueAgentSessionId(null);
      setIssueResearch(research);

      if (!isDemo) {
        try {
          const session = await startBrowserAgent({
            userId: authUser?.id ?? 'demo-user',
            taskId: task.taskId,
            research,
          });

          task = updateIssueAgentTask(task.taskId, current => ({
            ...current,
            sessionId: session.session_id,
            runtime: {
              state: session.state,
              message: session.message,
              active: true,
            },
          })) || task;

          setIssueAgentSessionId(session.session_id);
        } catch (agentError) {
          console.error('Visible browser agent failed to start:', agentError);
          task = updateIssueAgentTask(task.taskId, current => ({
            ...current,
            agentUnavailableReason: agentError.message || 'Visible browser agent unavailable.',
            runtime: {
              state: 'failed',
              message: agentError.message || 'Visible browser agent unavailable.',
              active: false,
            },
          })) || task;
        }
      }

      return research;
    } catch (error) {
      console.error('Issue research failed:', error);
      setIssueResearchError('Could not load guided issue research.');
      throw error;
    } finally {
      setIssueResearchLoading(false);
    }
  }, [authUser?.id, isDemo, setActiveNav]);

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
      activeIssue, setActiveIssue,
      issueResearch, setIssueResearch,
      issueResearchLoading, setIssueResearchLoading,
      issueResearchError, setIssueResearchError,
      issueAgentTaskId, setIssueAgentTaskId,
      issueAgentSessionId, setIssueAgentSessionId,
      launchIssueResearch,
      openIssueAgentTab,

      // Simulations
      simulations, setSimulations,
      activeSimulation, setActiveSimulation,

      // Auth
      authUser, setAuthUser,

      // UI
      activeNav, setActiveNav,

      // Toasts
      toasts, addToast, dismissToast,

      // Onboarding
      onboardingProgress,

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
