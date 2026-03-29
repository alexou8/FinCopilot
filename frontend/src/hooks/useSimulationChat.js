'use client';

import { useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { sendMessage } from '../services/chatService';

function generateId() {
  return `sim-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Chat hook for the simulation scenario panel.
 * Messages are kept in local state only (not persisted to the main chat).
 * Sends with profile_target="after" and chat_mode="simulation" so the backend
 * uses SIMULATION_CHAT_PROMPT and saves the extracted profile to profile_data_after.
 * Conversation history is stored under "{userId}_sim" to keep it separate from
 * the onboarding chat.
 */
export function useSimulationChat() {
  const { authUser } = useApp();
  const [simMessages, setSimMessages] = useState([]);
  const [isSimTyping, setIsSimTyping] = useState(false);

  const userId = authUser?.id ?? 'demo_user';
  // Separate conversation bucket so the sim chat doesn't mix with onboarding history
  const simConvId = `${userId}_sim`;

  const send = useCallback(async (text) => {
    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setSimMessages(prev => [...prev, userMsg]);
    setIsSimTyping(true);

    try {
      const response = await sendMessage(
        text,
        simConvId,      // conversation scope (stored under userId_sim)
        'after',        // profile_target → saves to profile_data_after
        'simulation',   // chat_mode → uses SIMULATION_CHAT_PROMPT
        userId,         // profile_user_id → extracts profile for real userId
      );
      setSimMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: response.aiMessage,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setSimMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsSimTyping(false);
    }
  }, [userId, simConvId]);

  // The first user message is used as the scenario name/prompt when running the simulation
  const scenarioPrompt = simMessages.find(m => m.role === 'user')?.content ?? '';

  const clearSimChat = useCallback(() => setSimMessages([]), []);

  return { simMessages, isSimTyping, send, scenarioPrompt, clearSimChat };
}
