'use client';

import { useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { sendMessage } from '../services/chatService';
import { getIssues } from '../services/issuesService';
import { demoScenario } from '../data/demoScenario';
import { getMockResponse } from '../data/demoConversation';

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
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      const mockResponse = getMockResponse(text);
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: mockResponse.aiMessage,
        timestamp: new Date().toISOString(),
      });
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
    isDemo,
  ]);

  return { send };
}
