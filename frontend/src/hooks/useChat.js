'use client';

import { useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { sendMessage } from '../services/chatService';
import { getIssues } from '../services/issuesService';
import { demoScenario } from '../data/demoScenario';

const DEMO_REPLIES = [
  "This is a live demo — full AI chat requires a connected backend. Feel free to explore the profile, issues, and simulations panels using the sidebar!",
  "In the full version, I'd parse that and update your financial profile in real time. For now, check out the Issues and Simulations tabs to see what the platform can do.",
  "Great question! In a live session I'd respond with personalised guidance. Try clicking 'Issues' in the sidebar to see detected financial risks for the demo profile.",
  "I'm running in demo mode, so I can't process new messages — but the rest of the dashboard is fully interactive. Try the Simulations panel to model financial scenarios.",
];

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const FIELD_TOAST_MAP = {
  income: { message: 'Income updated', type: 'income' },
  expenses: { message: 'Expenses recorded', type: 'expenses' },
  debt: { message: 'Debt info captured', type: 'debt' },
  accounts: { message: 'Accounts linked', type: 'accounts' },
  decision: { message: 'Goal detected', type: 'decision' },
};

let demoReplyIndex = 0;

export function useChat() {
  const {
    addMessage,
    setIsTyping,
    setProfile,
    updateProfileField,
    authUser,
    setActivePanel,
    setScenario,
    setIssues,
    addToast,
    setActiveNav,
    isDemo,
  } = useApp();

  const issuesFetchedRef = useRef(false);

  const send = useCallback(async (text) => {
    const userId = authUser?.id ?? 'demo_user';

    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setIsTyping(true);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: DEMO_REPLIES[demoReplyIndex % DEMO_REPLIES.length],
        timestamp: new Date().toISOString(),
      });
      demoReplyIndex++;
      setIsTyping(false);
      return;
    }

    try {
      const response = await sendMessage(text, userId);
      const aiMsg = {
        id: generateId(),
        role: 'assistant',
        content: response.aiMessage,
        timestamp: new Date().toISOString(),
        profileUpdates: response.profileUpdates || {},
      };
      addMessage(aiMsg);

      if (response.profileUpdates) {
        const update = Object.fromEntries(
          Object.entries(response.profileUpdates).filter(([, value]) => value != null)
        );

        if (Object.keys(update).length > 0) {
          setProfile(prev => ({ ...(prev || {}), ...update }));
          Object.keys(update).forEach(field => {
            updateProfileField(field);
            const toastConfig = FIELD_TOAST_MAP[field];
            if (toastConfig) {
              addToast(toastConfig.message, toastConfig.type);
            }
          });
        }

        if (update.decision?.description && !issuesFetchedRef.current) {
          issuesFetchedRef.current = true;
          getIssues(userId)
            .then(issues => {
              setIssues(issues);
              addToast(
                `Profile complete. ${issues.length} issue${issues.length !== 1 ? 's' : ''} found.`,
                'success'
              );
              setTimeout(() => {
                setActiveNav('issues');
              }, 1500);
            })
            .catch(error => console.error('Auto-fetch issues failed:', error));
        }
      }

      if (response.type === 'scenario') {
        setScenario(demoScenario);
        setActivePanel('scenario');
      }
    } catch (_error) {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      });
    } finally {
      setIsTyping(false);
    }
  }, [
    addMessage,
    setIsTyping,
    setProfile,
    updateProfileField,
    authUser,
    setActivePanel,
    setScenario,
    setIssues,
    addToast,
    setActiveNav,
  ]);

  return { send };
}
