const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

let accessToken = null;
let refreshToken = null;

// Load tokens from localStorage on client
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
}

async function refreshAccessToken() {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // Refresh token expired, need to re-login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/';
    }
    throw new Error('Session expired');
  }

  const data = await response.json();
  accessToken = data.accessToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
  }
  return accessToken;
}

async function fetchWithAuth(url, options = {}) {
  // Add auth header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });

  // If 401/403, try refreshing token
  if (response.status === 401 || response.status === 403) {
    try {
      await refreshAccessToken();
      // Retry with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
      });
    } catch (error) {
      throw error;
    }
  }

  return response;
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success && typeof window !== 'undefined') {
    if (data.accessToken) {
      accessToken = data.accessToken;
      localStorage.setItem('access_token', accessToken);
    }
    if (data.refreshToken) {
      refreshToken = data.refreshToken;
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (data.user) {
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
  }

  return data;
}

export async function logout() {
  try {
    await fetchWithAuth('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  }
}

export async function fetchState() {
  const response = await fetch(`${API_BASE_URL}/api/state`);
  const data = await response.json();
  return data;
}

export async function saveState(data) {
  const response = await fetch(`${API_BASE_URL}/api/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Debounced save (keep existing pattern)
let saveTimeout = null;
export function debouncedSave(data, delay = 1000) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveState(data), delay);
}

export async function getCurrentUser() {
  try {
    const response = await fetchWithAuth('/api/auth/me');
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}
