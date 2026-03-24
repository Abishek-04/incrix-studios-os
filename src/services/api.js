const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ── Token Management ──

function getAccessToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

function getRefreshToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
}

function setTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ── Core Fetch ──

async function refreshAccessToken() {
  const rt = getRefreshToken();
  if (!rt) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (data.accessToken) setTokens(data.accessToken, null);
  return data.accessToken;
}

export async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE_URL}${url}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  // If 401, try refresh once
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE_URL}${url}`, {
        cache: 'no-store',
        ...options,
        headers,
      });
    } catch {
      throw new Error('Session expired');
    }
  }

  return res;
}

// ── Auth ──

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.success) {
    setTokens(data.accessToken, data.refreshToken);
  }

  return data;
}

export async function logout() {
  try {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  clearTokens();
}

export async function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetchWithAuth('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export function hasToken() {
  return Boolean(getAccessToken());
}

// ── State ──

export async function fetchState() {
  const res = await fetchWithAuth('/api/state');
  return res.json();
}

export async function saveState(data) {
  const res = await fetchWithAuth('/api/state', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Project CRUD ──

export async function createProject(projectData) {
  const res = await fetchWithAuth('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ project: projectData }),
  });
  return res.json();
}

export async function updateProject(projectId, projectData) {
  const res = await fetchWithAuth(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ project: projectData }),
  });
  return res.json();
}

export async function deleteProject(projectId) {
  const res = await fetchWithAuth(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
  return res.json();
}

// ── Daily Task CRUD ──

export async function createDailyTask(taskData) {
  const res = await fetchWithAuth('/api/daily-tasks', {
    method: 'POST',
    body: JSON.stringify({ task: taskData }),
  });
  return res.json();
}

export async function updateDailyTask(taskId, updates) {
  const res = await fetchWithAuth(`/api/daily-tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  });
  return res.json();
}

export async function deleteDailyTask(taskId) {
  const res = await fetchWithAuth(`/api/daily-tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
  return res.json();
}

// ── Channel CRUD ──

export async function createChannel(channelData) {
  const res = await fetchWithAuth('/api/channels', {
    method: 'POST',
    body: JSON.stringify({ channel: channelData }),
  });
  return res.json();
}

export async function updateChannel(channelId, updates) {
  const res = await fetchWithAuth(`/api/channels/${encodeURIComponent(channelId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  });
  return res.json();
}

export async function deleteChannel(channelId) {
  const res = await fetchWithAuth(`/api/channels/${encodeURIComponent(channelId)}`, {
    method: 'DELETE',
  });
  return res.json();
}

// Debounced save
let saveTimeout = null;
export function debouncedSave(data, delay = 1000) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveState(data), delay);
}
