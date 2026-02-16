import axios from 'axios';
import connectDB from '../lib/mongodb.js';
import Channel from '../models/Channel.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

/**
 * Refresh a long-lived Instagram access token
 * @param {string} channelId - Channel ID to refresh
 * @returns {Promise<Object>} Result with success status
 */
export async function refreshLongLivedToken(channelId) {
  try {
    await connectDB();

    // Get channel with access token
    const channel = await Channel.findOne({ id: channelId }).select('+accessToken');

    if (!channel || channel.platform !== 'instagram') {
      throw new Error('Instagram channel not found');
    }

    if (!channel.accessToken) {
      throw new Error('No access token found');
    }

    // Decrypt the token
    const currentToken = decrypt(channel.accessToken);

    // Refresh the long-lived token (Instagram Business Login API)
    const response = await axios.get(
      `https://graph.instagram.com/refresh_access_token`,
      {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: currentToken,
        },
      }
    );

    const newToken = response.data.access_token;
    const expiresIn = response.data.expires_in; // ~5184000 seconds (60 days)

    // Encrypt and save new token
    const encryptedToken = encrypt(newToken);

    await Channel.updateOne(
      { id: channelId },
      {
        $set: {
          accessToken: encryptedToken,
          tokenExpiry: new Date(Date.now() + expiresIn * 1000),
          tokenRefreshedAt: new Date(),
          connectionStatus: 'connected',
        },
      }
    );

    console.log(`[InstagramToken] Refreshed token for channel ${channelId}`);

    return {
      success: true,
      channelId,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (error) {
    console.error('[InstagramToken] Refresh error:', error);

    // Update channel status to error
    await Channel.updateOne(
      { id: channelId },
      {
        $set: {
          connectionStatus: 'error',
        },
      }
    );

    throw error;
  }
}

/**
 * Check all Instagram channels and refresh tokens expiring within 7 days
 * Should be called by a cron job/repeatable task
 */
export async function checkAndRefreshExpiringTokens() {
  try {
    await connectDB();

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Find Instagram channels with tokens expiring soon
    const expiringChannels = await Channel.find({
      platform: 'instagram',
      connectionStatus: { $in: ['connected', 'token_expiring'] },
      tokenExpiry: { $lte: sevenDaysFromNow },
    });

    console.log(`[InstagramToken] Found ${expiringChannels.length} channels with expiring tokens`);

    const results = [];

    for (const channel of expiringChannels) {
      try {
        // Update status to token_expiring
        await Channel.updateOne(
          { id: channel.id },
          { $set: { connectionStatus: 'token_expiring' } }
        );

        // Refresh token
        const result = await refreshLongLivedToken(channel.id);
        results.push({ ...result, username: channel.igUsername });
      } catch (error) {
        console.error(`[InstagramToken] Failed to refresh ${channel.igUsername}:`, error);
        results.push({
          success: false,
          channelId: channel.id,
          username: channel.igUsername,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      checked: expiringChannels.length,
      results,
    };
  } catch (error) {
    console.error('[InstagramToken] Check expiring tokens error:', error);
    throw error;
  }
}

/**
 * Get decrypted access token for a channel
 * @param {string} channelId - Channel ID
 * @returns {Promise<string>} Decrypted access token
 */
export async function getAccessToken(channelId) {
  await connectDB();

  const channel = await Channel.findOne({ id: channelId }).select('+accessToken');

  if (!channel || !channel.accessToken) {
    throw new Error('Channel or access token not found');
  }

  return decrypt(channel.accessToken);
}

export default {
  refreshLongLivedToken,
  checkAndRefreshExpiringTokens,
  getAccessToken,
};
