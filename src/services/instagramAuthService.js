import axios from 'axios';
import jwt from 'jsonwebtoken';

const INSTAGRAM_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_ME_URL = 'https://graph.instagram.com/me';
const INSTAGRAM_LONG_LIVED_TOKEN_URL = 'https://graph.instagram.com/access_token';
const INSTAGRAM_REFRESH_TOKEN_URL = 'https://graph.instagram.com/refresh_access_token';

function getConfig() {
  return {
    appId: process.env.INSTAGRAM_APP_ID || '',
    appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3005/api/instagram/auth/callback',
    scopes: (process.env.INSTAGRAM_SCOPES || 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

export function buildInstagramLoginUrl(studioUserId) {
  const config = getConfig();
  // Sign userId into a short-lived JWT as CSRF protection
  const stateToken = jwt.sign(
    { userId: studioUserId, purpose: 'instagram_oauth' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  const params = new URLSearchParams({
    enable_fb_login: '0',
    force_authentication: '1',
    auth_type: 'reauthenticate',
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(','),
    state: stateToken,
  });
  return `${INSTAGRAM_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Verify the OAuth state token and extract userId
 */
export function verifyOAuthState(stateToken) {
  try {
    const decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'instagram_oauth') return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function exchangeCodeForAccessToken(code) {
  const config = getConfig();
  const payload = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await axios.post(INSTAGRAM_TOKEN_URL, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export async function exchangeForLongLivedAccessToken(accessToken) {
  const config = getConfig();
  const response = await axios.get(INSTAGRAM_LONG_LIVED_TOKEN_URL, {
    params: {
      grant_type: 'ig_exchange_token',
      client_secret: config.appSecret,
      access_token: accessToken,
    },
  });
  return response.data;
}

export async function refreshLongLivedAccessToken(accessToken) {
  const response = await axios.get(INSTAGRAM_REFRESH_TOKEN_URL, {
    params: {
      grant_type: 'ig_refresh_token',
      access_token: accessToken,
    },
  });
  return response.data;
}

export async function fetchInstagramProfile(accessToken) {
  const response = await axios.get(INSTAGRAM_GRAPH_ME_URL, {
    params: {
      fields: 'user_id,username,account_type,profile_picture_url',
      access_token: accessToken,
    },
  });
  return response.data;
}
