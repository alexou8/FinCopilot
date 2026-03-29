const API_BASE = '/api';

export async function startBrowserAgent({ userId, taskId, research }) {
  const res = await fetch(`${API_BASE}/issues/browser-agent/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      task_id: taskId,
      research,
    }),
  });

  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || 'Browser agent start failed');
  }

  return res.json();
}

export async function getBrowserAgentStatus(sessionId) {
  const res = await fetch(`${API_BASE}/issues/browser-agent/status/${sessionId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || 'Browser agent status failed');
  }
  return res.json();
}

export async function pauseBrowserAgent(sessionId) {
  return postSessionAction(`${API_BASE}/issues/browser-agent/pause/${sessionId}`);
}

export async function resumeBrowserAgent(sessionId) {
  return postSessionAction(`${API_BASE}/issues/browser-agent/resume/${sessionId}`);
}

export async function stopBrowserAgent(sessionId) {
  return postSessionAction(`${API_BASE}/issues/browser-agent/stop/${sessionId}`);
}

export async function answerBrowserAgent(sessionId, answer) {
  return postSessionAction(`${API_BASE}/issues/browser-agent/answer/${sessionId}`, {
    answer,
  });
}

async function postSessionAction(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || 'Browser agent action failed');
  }
  return res.json();
}

async function safeDetail(res) {
  try {
    const payload = await res.json();
    return payload?.detail || payload?.error || null;
  } catch (_error) {
    return null;
  }
}
