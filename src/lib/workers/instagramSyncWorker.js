import instagramSyncQueue, { SYNC_JOB_TYPES } from '../queues/instagramSyncQueue.js';
import { syncMedia, syncMediaStats } from '../../services/instagramMediaService.js';
import { checkAndRefreshExpiringTokens } from '../../services/instagramTokenService.js';
import connectDB from '../mongodb.js';
import Channel from '../../models/Channel.js';

// Process full sync jobs
instagramSyncQueue.process(SYNC_JOB_TYPES.FULL_SYNC, async (job) => {
  const { channelId } = job.data;

  console.log(`[InstagramSync] Processing full sync for channel ${channelId}`);

  try {
    const result = await syncMedia(channelId);
    return result;
  } catch (error) {
    console.error(`[InstagramSync] Full sync failed for ${channelId}:`, error);
    throw error;
  }
});

// Process stats sync jobs
instagramSyncQueue.process(SYNC_JOB_TYPES.STATS_SYNC, async (job) => {
  const { channelId } = job.data;

  console.log(`[InstagramSync] Processing stats sync for channel ${channelId}`);

  try {
    const result = await syncMediaStats(channelId);
    return result;
  } catch (error) {
    console.error(`[InstagramSync] Stats sync failed for ${channelId}:`, error);
    throw error;
  }
});

// Process token refresh jobs
instagramSyncQueue.process(SYNC_JOB_TYPES.TOKEN_REFRESH, async (job) => {
  console.log('[InstagramSync] Processing token refresh check');

  try {
    const result = await checkAndRefreshExpiringTokens();
    return result;
  } catch (error) {
    console.error('[InstagramSync] Token refresh failed:', error);
    throw error;
  }
});

// Schedule daily token refresh check
instagramSyncQueue.add(
  SYNC_JOB_TYPES.TOKEN_REFRESH,
  {},
  {
    repeat: {
      cron: '0 2 * * *', // Every day at 2 AM
    },
    jobId: 'token-refresh-daily',
  }
).then(() => {
  console.log('[InstagramSync] Scheduled daily token refresh check');
}).catch((err) => {
  console.error('[InstagramSync] Error scheduling token refresh:', err);
});

// On startup, schedule sync jobs for all connected Instagram channels
async function initializeChannelSyncs() {
  try {
    await connectDB();

    const instagramChannels = await Channel.find({
      platform: 'instagram',
      connectionStatus: 'connected',
    });

    console.log(`[InstagramSync] Found ${instagramChannels.length} connected Instagram channels`);

    for (const channel of instagramChannels) {
      const { scheduleChannelSync } = await import('../queues/instagramSyncQueue.js');
      await scheduleChannelSync(channel.id, false); // We'll check for active automations later
    }

    console.log('[InstagramSync] Initialized sync jobs for all channels');
  } catch (error) {
    console.error('[InstagramSync] Error initializing channel syncs:', error);
  }
}

// Initialize on startup
initializeChannelSyncs();

// Log worker status
console.log('[InstagramSync] Worker started and listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[InstagramSync] SIGTERM received, closing gracefully');
  await instagramSyncQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[InstagramSync] SIGINT received, closing gracefully');
  await instagramSyncQueue.close();
  process.exit(0);
});
