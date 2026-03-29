'use client';

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { sendMessage } from '../services/chatService';
import { demoScenario } from '../data/demoScenario';

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useChat() {
  const { addMessage, setIsTyping, setProfile, updateProfileField, authUser, setActivePanel, setScenario } = useApp();

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
        // Only merge non-null sections so a partial extraction doesn't clear existing data
        const update = Object.fromEntries(
          Object.entries(response.profileUpdates).filter(([, v]) => v != null)
        );
        if (Object.keys(update).length > 0) {
          setProfile(prev => ({ ...(prev || {}), ...update }));
          Object.keys(update).forEach(field => updateProfileField(field));
        }
      }

      if (response.type === 'scenario') {
        setScenario(demoScenario);
        setActivePanel('scenario');
      }
    } catch (err) {
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
  }, [addMessage, setIsTyping, setProfile, updateProfileField, authUser, setActivePanel, setScenario]);

  return { send };
}
