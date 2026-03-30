import axios from 'axios';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import { refreshLongLivedAccessToken } from './instagramAuthService';

const INSTAGRAM_GRAPH_BASE = 'https://graph.instagram.com/v23.0';

const TOKEN_REFRESH_LEAD_SECONDS = 86400; // 24 hours before expiry

const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
const MEDIA_FIELDS_DETAIL = MEDIA_FIELDS + ',plays';

async function getMediaListViaInstagramGraph(accessToken) {
  const response = await axios.get(`${INSTAGRAM_GRAPH_BASE}/me/media`, {
    params: {
      access_token: accessToken,
      fields: MEDIA_FIELDS,
    },
  });
  return response.data.data || [];
}

async function getMediaDetailsViaInstagramGraph(mediaId, accessToken) {
  const response = await axios.get(`${INSTAGRAM_GRAPH_BASE}/${mediaId}`, {
    params: {
      access_token: accessToken,
      fields: MEDIA_FIELDS_DETAIL,
    },
  });
  return response.data;
}

function shouldRefreshToken(account) {
  if (!account?.tokenExpiresAt) return false;
  const expiresAtMs = new Date(account.tokenExpiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;
  return expiresAtMs - Date.now() <= TOKEN_REFRESH_LEAD_SECONDS * 1000;
}

async function getUsableAccessToken(account) {
  if (!account?.accessToken) throw new Error('Missing Instagram access token');

  if (!shouldRefreshToken(account)) return { accessToken: account.accessToken, account };

  try {
    await connectDB();
    const refreshed = await refreshLongLivedAccessToken(account.accessToken);
    const updated = await InstaAccount.findByIdAndUpdate(
      account._id,
      {
        accessToken: refreshed.access_token || account.accessToken,
        tokenType: refreshed.token_type || account.tokenType || 'bearer',
        tokenExpiresIn: refreshed.expires_in || account.tokenExpiresIn || null,
        tokenExpiresAt: refreshed.expires_in
          ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString()
          : account.tokenExpiresAt || null,
      },
      { new: true }
    ).lean();

    console.log('[instagram] Refreshed long-lived token for', account.username);
    return { accessToken: updated?.accessToken || account.accessToken, account: updated || account };
  } catch (error) {
    console.error('[instagram] Token refresh failed:', error.response?.data || error.message);
    return { accessToken: account.accessToken, account };
  }
}

export const InstagramService = {
  async getAccountMedia(account) {
    try {
      const { accessToken } = await getUsableAccessToken(account);
      const media = await getMediaListViaInstagramGraph(accessToken);
      const hydratedMedia = await Promise.all(
        media.map(async (item) => {
          try { return await getMediaDetailsViaInstagramGraph(item.id, accessToken); }
          catch (_error) { return item; }
        })
      );
      console.log('[instagram] Loaded media:', { username: account.username, count: hydratedMedia.length });
      return hydratedMedia;
    } catch (instagramError) {
      console.error('[instagram] Account media fetch failed:', instagramError.response?.data || instagramError.message);
      if (instagramError.response?.status === 400 || instagramError.response?.status === 401) {
        const authError = new Error('Instagram access token expired');
        authError.status = 401;
        authError.code = 'INSTAGRAM_AUTH_EXPIRED';
        throw authError;
      }
      throw instagramError;
    }
  },

  async replyToComment(commentId, message, account) {
    const endpoint = `${INSTAGRAM_GRAPH_BASE}/${commentId}/replies`;
    const { accessToken } = await getUsableAccessToken(account);

    const attempts = [
      {
        label: 'bearer-form-body',
        run: () => axios.post(endpoint, new URLSearchParams({ message }), {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      },
      {
        label: 'query-access-token',
        run: () => axios.post(endpoint, {}, { params: { message, access_token: accessToken } }),
      },
    ];

    for (const attempt of attempts) {
      try {
        await attempt.run();
        console.log(`[instagram] Comment reply success for ${commentId} using ${attempt.label}`);
        return true;
      } catch (error) {
        console.error('[instagram] Comment reply attempt failed:', { strategy: attempt.label, details: error.response?.data || error.message });
      }
    }

    console.error(`[instagram] Comment reply failed for ${commentId} after all strategies`);
    return false;
  },

  async subscribeToWebhook(accessToken) {
    try {
      const checkResponse = await axios.get(`${INSTAGRAM_GRAPH_BASE}/me/subscribed_apps`, {
        params: { access_token: accessToken },
      });
      const subscribedFields = checkResponse.data?.data?.[0]?.subscribed_fields || [];
      if (subscribedFields.includes('comments')) {
        console.log('[instagram] Webhook already subscribed for comments');
        return { success: true, alreadySubscribed: true };
      }

      const response = await axios.post(`${INSTAGRAM_GRAPH_BASE}/me/subscribed_apps`, null, {
        params: { subscribed_fields: 'comments', access_token: accessToken },
      });
      console.log('[instagram] Webhook subscription success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[instagram] Webhook subscription failed:', error.response?.data || error.message);
    }
  },

  async sendPrivateReply(commentId, message, account) {
    const { accessToken, account: refreshedAccount } = await getUsableAccessToken(account);
    const endpoint = `${INSTAGRAM_GRAPH_BASE}/${refreshedAccount.instagramUserId}/messages`;

    try {
      await axios.post(endpoint, { recipient: { comment_id: commentId }, message: { text: message } }, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      console.log(`[instagram] Private reply success for ${commentId}`);
      return true;
    } catch (error) {
      console.error('[instagram] Private reply failed:', error.response?.data || error.message);
      return false;
    }
  },
};
