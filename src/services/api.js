const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Session expired');
  }

  return true;
}

export async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  let response = await fetch(`${API_BASE_URL}${url}`, {
    cache: 'no-store',
    ...options,
    headers,
    credentials: 'include', // Always send cookies
  });

  // If 401, try refreshing token and retry once
  if (response.status === 401) {
    try {
      await refreshAccessToken();
      response = await fetch(`${API_BASE_URL}${url}`, {
        cache: 'no-store',
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (error) {
      throw error;
    }
  }

  return response;
}

// ── Auth ──

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Receive HttpOnly cookies
    body: JSON.stringify({ email, password })
  });

  return response.json();
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    // Ignore logout errors
  }
}

export async function getCurrentUser() {
  try {
    const response = await fetchWithAuth('/api/auth/me');
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    return null;
  }
}

// ── State ──

export async function fetchState() {
  const response = await fetchWithAuth('/api/state');
  const data = await response.json();
  return data;
}

export async function saveState(data) {
  const response = await fetchWithAuth('/api/state', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}

// ── Project CRUD ──

export async function createProject(projectData) {
  const response = await fetchWithAuth('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ project: projectData })
  });
  return response.json();
}

export async function updateProject(projectId, projectData) {
  const response = await fetchWithAuth(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ project: projectData })
  });
  return response.json();
}

export async function deleteProject(projectId) {
  const response = await fetchWithAuth(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE'
  });
  return response.json();
}

// ── Daily Task CRUD ──

export async function createDailyTask(taskData) {
  const response = await fetchWithAuth('/api/daily-tasks', {
    method: 'POST',
    body: JSON.stringify({ task: taskData })
  });
  return response.json();
}

export async function updateDailyTask(taskId, updates) {
  const response = await fetchWithAuth(`/api/daily-tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates })
  });
  return response.json();
}

export async function deleteDailyTask(taskId) {
  const response = await fetchWithAuth(`/api/daily-tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE'
  });
  return response.json();
}

// ── Channel CRUD ──

export async function createChannel(channelData) {
  const response = await fetchWithAuth('/api/channels', {
    method: 'POST',
    body: JSON.stringify({ channel: channelData })
  });
  return response.json();
}

export async function updateChannel(channelId, updates) {
  const response = await fetchWithAuth(`/api/channels/${encodeURIComponent(channelId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates })
  });
  return response.json();
}

export async function deleteChannel(channelId) {
  const response = await fetchWithAuth(`/api/channels/${encodeURIComponent(channelId)}`, {
    method: 'DELETE'
  });
  return response.json();
}

// Debounced save
let saveTimeout = null;
export function debouncedSave(data, delay = 1000) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveState(data), delay);
}
