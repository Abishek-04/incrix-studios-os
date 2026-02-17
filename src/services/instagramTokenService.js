import connectDB from '../lib/mongodb.js';
import Channel from '../models/Channel.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { refreshUserToken, getUserPages } from './facebookGraphService.js';

/**
 * Refresh a long-lived Facebook User Token + re-fetch the Page Token
 * @param {string} channelId - Channel ID to refresh
 * @returns {Promise<Object>} Result with success status
 */
export async function refreshLongLivedToken(channelId) {
  try {
    await connectDB();

    // Get channel with tokens
    const channel = await Channel.findOne({ id: channelId })
      .select('+accessToken +fbPageAccessToken +userAccessToken');

    if (!channel || channel.platform !== 'instagram') {
      throw new Error('Instagram channel not found');
    }

    // Need the User Token to refresh
    const encryptedUserToken = channel.userAccessToken;
    if (!encryptedUserToken) {
      // Fall back to accessToken for backward compat (old channels)
      if (channel.accessToken) {
        console.warn(`[InstagramToken] Channel ${channelId} has no user token, marking for reconnect`);
        await Channel.updateOne(
          { id: channelId },
          { $set: { connectionStatus: 'requires_reconnect' } }
        );
        throw new Error('Channel needs reconnection — no user token available');
      }
      throw new Error('No access token found');
    }

    const currentUserToken = decrypt(encryptedUserToken);

    // Step 1: Refresh the User Token via Facebook API
    console.log(`[InstagramToken] Refreshing user token for channel ${channelId}...`);
    const refreshResult = await refreshUserToken(currentUserToken);
    const newUserToken = refreshResult.accessToken;
    const expiresIn = refreshResult.expiresIn || 5184000; // ~60 days

    // Step 2: Re-fetch Page Token using the new User Token
    let newPageToken = null;
    if (channel.fbPageId) {
      try {
        const pages = await getUserPages(newUserToken);
        const matchingPage = pages.find(p => p.id === channel.fbPageId);

        if (matchingPage) {
          newPageToken = matchingPage.access_token;
          console.log(`[InstagramToken] Re-fetched page token for ${channel.fbPageName}`);
        } else {
          console.warn(`[InstagramToken] Page ${channel.fbPageId} not found in user's pages`);
        }
      } catch (pageError) {
        console.warn(`[InstagramToken] Could not re-fetch page token:`, pageError.message);
      }
    }

    // Step 3: Encrypt and save the new tokens
    const updateFields = {
      userAccessToken: encrypt(newUserToken),
      userTokenExpiry: new Date(Date.now() + expiresIn * 1000),
      tokenExpiry: new Date(Date.now() + expiresIn * 1000),
      tokenRefreshedAt: new Date(),
      connectionStatus: 'connected',
    };

    if (newPageToken) {
      const encryptedPageToken = encrypt(newPageToken);
      updateFields.accessToken = encryptedPageToken;
      updateFields.fbPageAccessToken = encryptedPageToken;
    }

    await Channel.updateOne(
      { id: channelId },
      { $set: updateFields }
    );

    console.log(`[InstagramToken] Refreshed tokens for channel ${channelId}`);

    return {
      success: true,
      channelId,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      pageTokenRefreshed: !!newPageToken,
    };
  } catch (error) {
    console.error('[InstagramToken] Refresh error:', error);

    // Update channel status to error
    try {
      await Channel.updateOne(
        { id: channelId },
        { $set: { connectionStatus: 'error' } }
      );
    } catch (updateError) {
      console.error('[InstagramToken] Failed to update channel status:', updateError);
    }

    throw error;
  }
}

/**
 * Check all Instagram channels and refresh tokens expiring within 7 days
 * Called by the Vercel cron job
 */
export async function checkAndRefreshExpiringTokens() {
  try {
    await connectDB();

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Find Instagram channels with tokens expiring soon
    const expiringChannels = await Channel.find({
      platform: 'instagram',
      connectionStatus: { $in: ['connected', 'token_expiring'] },
      $or: [
        { userTokenExpiry: { $lte: sevenDaysFromNow } },
        { tokenExpiry: { $lte: sevenDaysFromNow } },
      ],
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
 * Get decrypted Page Access Token for a channel (used for API calls)
 * @param {string} channelId - Channel ID
 * @returns {Promise<string>} Decrypted page access token
 */
export async function getPageAccessToken(channelId) {
  await connectDB();

  const channel = await Channel.findOne({ id: channelId })
    .select('+accessToken +fbPageAccessToken');

  if (!channel) {
    throw new Error('Channel not found');
  }

  // Prefer the dedicated Page Token field, fall back to accessToken
  const encryptedToken = channel.fbPageAccessToken || channel.accessToken;
  if (!encryptedToken) {
    throw new Error('No access token found for channel');
  }

  return decrypt(encryptedToken);
}

/**
 * Get decrypted access token for a channel (backward compatible)
 * @param {string} channelId - Channel ID
 * @returns {Promise<string>} Decrypted access token
 */
export async function getAccessToken(channelId) {
  return getPageAccessToken(channelId);
}

export default {
  refreshLongLivedToken,
  checkAndRefreshExpiringTokens,
  getPageAccessToken,
  getAccessToken,
};
