import axios from 'axios';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

/**
 * Exchange an authorization code for a short-lived User Access Token
 */
export async function exchangeCodeForToken(code, redirectUri) {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: redirectUri,
      code,
    },
  });

  return {
    accessToken: response.data.access_token,
    tokenType: response.data.token_type,
    expiresIn: response.data.expires_in,
  };
}

/**
 * Exchange a short-lived User Token for a long-lived User Token (~60 days)
 */
export async function exchangeForLongLivedToken(shortLivedToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  });

  return {
    accessToken: response.data.access_token,
    tokenType: response.data.token_type,
    expiresIn: response.data.expires_in, // ~5184000 seconds (60 days)
  };
}

/**
 * Get all Facebook Pages managed by the user.
 * Page tokens returned here are long-lived (non-expiring) when derived from a long-lived user token.
 */
export async function getUserPages(userAccessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: {
      access_token: userAccessToken,
      fields: 'id,name,access_token,category,instagram_business_account',
    },
  });

  return response.data.data || [];
}

/**
 * Get the Instagram Business Account linked to a Facebook Page
 */
export async function getInstagramAccountForPage(pageId, pageAccessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/${pageId}`, {
    params: {
      access_token: pageAccessToken,
      fields: 'instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count,ig_id}',
    },
  });

  return response.data.instagram_business_account || null;
}

/**
 * Get Instagram profile details using the IG Business Account ID
 */
export async function getInstagramProfile(igBusinessAccountId, accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/${igBusinessAccountId}`, {
    params: {
      access_token,
      fields: 'id,ig_id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography',
    },
  });

  return response.data;
}

/**
 * Subscribe a Facebook Page to webhook events (comments, messaging)
 */
export async function subscribePageToWebhooks(pageId, pageAccessToken) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${pageId}/subscribed_apps`,
    null,
    {
      params: {
        access_token: pageAccessToken,
        subscribed_fields: 'feed',
      },
    }
  );

  return response.data;
}

/**
 * Send an Instagram DM via the Facebook Page
 * Requires a Page Access Token and the recipient's IGSID (Instagram-Scoped ID)
 */
export async function sendInstagramDM(pageId, pageAccessToken, recipientIGSID, messageText) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${pageId}/messages`,
    {
      recipient: { id: recipientIGSID },
      message: { text: messageText },
    },
    {
      params: { access_token: pageAccessToken },
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return {
    messageId: response.data.message_id,
    recipientId: response.data.recipient_id,
  };
}

/**
 * Send an Instagram DM with a file attachment
 */
export async function sendInstagramDMAttachment(pageId, pageAccessToken, recipientIGSID, attachment) {
  const attachmentType = attachment.type === 'document' ? 'file' : attachment.type;

  const response = await axios.post(
    `${GRAPH_API_BASE}/${pageId}/messages`,
    {
      recipient: { id: recipientIGSID },
      message: {
        attachment: {
          type: attachmentType,
          payload: { url: attachment.url },
        },
      },
    },
    {
      params: { access_token: pageAccessToken },
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return {
    messageId: response.data.message_id,
    recipientId: response.data.recipient_id,
  };
}

/**
 * Get media for an Instagram Business Account
 */
export async function getInstagramMedia(igBusinessAccountId, accessToken, options = {}) {
  const { limit = 25, after } = options;

  const params = {
    access_token: accessToken,
    fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count',
    limit,
  };

  if (after) {
    params.after = after;
  }

  const response = await axios.get(`${GRAPH_API_BASE}/${igBusinessAccountId}/media`, { params });

  return {
    data: response.data.data || [],
    paging: response.data.paging || null,
  };
}

/**
 * Refresh a long-lived User Token (extends by another ~60 days)
 */
export async function refreshUserToken(currentToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      fb_exchange_token: currentToken,
    },
  });

  return {
    accessToken: response.data.access_token,
    tokenType: response.data.token_type,
    expiresIn: response.data.expires_in,
  };
}

/**
 * Debug/inspect a token to check its validity and metadata
 */
export async function debugToken(inputToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/debug_token`, {
    params: {
      input_token: inputToken,
      access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
    },
  });

  return response.data.data;
}

export default {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getUserPages,
  getInstagramAccountForPage,
  getInstagramProfile,
  subscribePageToWebhooks,
  sendInstagramDM,
  sendInstagramDMAttachment,
  getInstagramMedia,
  refreshUserToken,
  debugToken,
};
