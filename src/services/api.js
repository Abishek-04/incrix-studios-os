const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ── Core Fetch (cookies sent automatically by browser) ──

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error('Session expired');
      }

      return true;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let res = await fetch(`${API_BASE_URL}${url}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers,
  });

  // If 401, try refresh once then retry
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await fetch(`${API_BASE_URL}${url}`, {
        cache: 'no-store',
        credentials: 'include',
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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // ignore
  }
}

export async function getCurrentUser() {
  try {
    const res = await fetchWithAuth('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
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
