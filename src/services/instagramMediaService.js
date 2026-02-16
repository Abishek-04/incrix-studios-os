import axios from 'axios';
import connectDB from '../lib/mongodb.js';
import Channel from '../models/Channel.js';
import InstagramMedia from '../models/InstagramMedia.js';
import { getAccessToken } from './instagramTokenService.js';

/**
 * Sync all media from Instagram for a channel
 * @param {string} channelId - Channel ID
 * @returns {Promise<Object>} Sync results
 */
export async function syncMedia(channelId) {
  try {
    await connectDB();

    const channel = await Channel.findOne({ id: channelId });

    if (!channel || channel.platform !== 'instagram') {
      throw new Error('Instagram channel not found');
    }

    const accessToken = await getAccessToken(channelId);
    let syncedCount = 0;
    let nextUrl = `https://graph.instagram.com/v21.0/${channel.igUserId}/media`;

    const params = {
      fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count',
      access_token: accessToken,
      limit: 100,
    };

    // Paginate through all media
    while (nextUrl) {
      const response = await axios.get(nextUrl, { params: nextUrl === `https://graph.instagram.com/v21.0/${channel.igUserId}/media` ? params : {} });

      const mediaItems = response.data.data || [];

      for (const media of mediaItems) {
        await InstagramMedia.updateOne(
          { igMediaId: media.id },
          {
            $set: {
              channelId,
              igMediaId: media.id,
              mediaType: media.media_type,
              mediaUrl: media.media_url,
              thumbnailUrl: media.thumbnail_url,
              permalink: media.permalink,
              caption: media.caption || '',
              timestamp: new Date(media.timestamp),
              likeCount: media.like_count || 0,
              commentCount: media.comments_count || 0,
            },
          },
          { upsert: true }
        );

        syncedCount++;
      }

      // Get next page
      nextUrl = response.data.paging?.next || null;

      // Remove params for subsequent requests (next URL includes them)
      if (nextUrl) {
        params.access_token = accessToken; // Keep token in params
      }
    }

    // Update channel last synced time
    await Channel.updateOne(
      { id: channelId },
      {
        $set: {
          lastSynced: new Date(),
        },
      }
    );

    console.log(`[InstagramMedia] Synced ${syncedCount} media items for ${channel.igUsername}`);

    return {
      success: true,
      channelId,
      syncedCount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[InstagramMedia] Sync error:', error);
    throw error;
  }
}

/**
 * Sync only stats (likes, comments) for existing media
 * @param {string} channelId - Channel ID
 * @returns {Promise<Object>} Sync results
 */
export async function syncMediaStats(channelId) {
  try {
    await connectDB();

    const channel = await Channel.findOne({ id: channelId });

    if (!channel || channel.platform !== 'instagram') {
      throw new Error('Instagram channel not found');
    }

    // Get all media for this channel
    const mediaItems = await InstagramMedia.find({ channelId }).select('igMediaId');

    if (mediaItems.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    const accessToken = await getAccessToken(channelId);
    let updatedCount = 0;

    // Update stats for each media (batch if possible)
    for (const media of mediaItems) {
      try {
        const response = await axios.get(
          `https://graph.instagram.com/v21.0/${media.igMediaId}`,
          {
            params: {
              fields: 'like_count,comments_count',
              access_token: accessToken,
            },
          }
        );

        await InstagramMedia.updateOne(
          { igMediaId: media.igMediaId },
          {
            $set: {
              likeCount: response.data.like_count || 0,
              commentCount: response.data.comments_count || 0,
            },
          }
        );

        updatedCount++;
      } catch (error) {
        console.error(`[InstagramMedia] Error updating stats for ${media.igMediaId}:`, error);
      }
    }

    console.log(`[InstagramMedia] Updated stats for ${updatedCount} media items`);

    return {
      success: true,
      channelId,
      updatedCount,
    };
  } catch (error) {
    console.error('[InstagramMedia] Stats sync error:', error);
    throw error;
  }
}

/**
 * Get media for a channel with filters and pagination
 * @param {string} channelId - Channel ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Media items and pagination info
 */
export async function getMediaForChannel(channelId, options = {}) {
  try {
    await connectDB();

    const {
      mediaType,
      automationActive,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sort = '-timestamp',
    } = options;

    const query = { channelId };

    if (mediaType) {
      query.mediaType = mediaType;
    }

    if (automationActive !== undefined) {
      query.automationActive = automationActive;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      InstagramMedia.find(query).sort(sort).limit(limit).skip(skip).lean(),
      InstagramMedia.countDocuments(query),
    ]);

    return {
      success: true,
      media,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[InstagramMedia] Get media error:', error);
    throw error;
  }
}

export default {
  syncMedia,
  syncMediaStats,
  getMediaForChannel,
};
