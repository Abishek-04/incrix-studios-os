// Instagram sync queue using Bull (disabled in production/Vercel)
// Bull doesn't work in serverless environments like Vercel
// This file provides no-op implementations when Bull is not available

let Queue;
let instagramSyncQueueInstance = null;

// Only import Bull in development (not in Vercel/production)
if (typeof window === 'undefined' && process.env.VERCEL !== '1') {
  try {
    Queue = require('bull');

    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    // Create Bull queue for Instagram sync
    instagramSyncQueueInstance = new Queue('instagram-sync', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000, // 10 seconds, then 100 seconds, then 1000 seconds
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });

    // Log queue events for monitoring
    instagramSyncQueueInstance.on('completed', (job, result) => {
      console.log(`[InstagramSync] Job ${job.id} completed:`, result);
    });

    instagramSyncQueueInstance.on('failed', (job, err) => {
      console.error(`[InstagramSync] Job ${job.id} failed:`, err.message);
    });

    instagramSyncQueueInstance.on('error', (error) => {
      console.error('[InstagramSync] Queue error:', error);
    });
  } catch (error) {
    console.warn('[InstagramSync] Bull not available, background sync disabled');
  }
}

export const instagramSyncQueue = instagramSyncQueueInstance;

// Job type constants
export const SYNC_JOB_TYPES = {
  FULL_SYNC: 'full-sync',
  STATS_SYNC: 'stats-sync',
  TOKEN_REFRESH: 'token-refresh',
};

/**
 * Queue a full media sync for a channel
 */
export async function queueFullSync(channelId) {
  if (!instagramSyncQueueInstance) {
    console.log('[InstagramSync] Queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  return instagramSyncQueueInstance.add(SYNC_JOB_TYPES.FULL_SYNC, {
    channelId,
    queuedAt: Date.now(),
  });
}

/**
 * Queue a stats-only sync for a channel
 */
export async function queueStatsSync(channelId) {
  if (!instagramSyncQueueInstance) {
    console.log('[InstagramSync] Queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  return instagramSyncQueueInstance.add(SYNC_JOB_TYPES.STATS_SYNC, {
    channelId,
    queuedAt: Date.now(),
  });
}

/**
 * Queue token refresh check
 */
export async function queueTokenRefresh() {
  if (!instagramSyncQueueInstance) {
    console.log('[InstagramSync] Queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  return instagramSyncQueueInstance.add(SYNC_JOB_TYPES.TOKEN_REFRESH, {
    queuedAt: Date.now(),
  });
}

/**
 * Schedule repeatable sync jobs for a channel
 */
export async function scheduleChannelSync(channelId, hasActiveAutomation = false) {
  if (!instagramSyncQueueInstance) {
    console.log('[InstagramSync] Queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  // Full sync every 30 minutes
  await instagramSyncQueueInstance.add(
    SYNC_JOB_TYPES.FULL_SYNC,
    { channelId },
    {
      repeat: {
        every: 30 * 60 * 1000, // 30 minutes
      },
      jobId: `full-sync-${channelId}`,
    }
  );

  // Stats sync every 10 minutes if has active automation
  if (hasActiveAutomation) {
    await instagramSyncQueueInstance.add(
      SYNC_JOB_TYPES.STATS_SYNC,
      { channelId },
      {
        repeat: {
          every: 10 * 60 * 1000, // 10 minutes
        },
        jobId: `stats-sync-${channelId}`,
      }
    );
  }

  console.log(`[InstagramSync] Scheduled sync jobs for channel ${channelId}`);
}

/**
 * Remove scheduled jobs for a channel
 */
export async function removeChannelSync(channelId) {
  if (!instagramSyncQueueInstance) {
    console.log('[InstagramSync] Queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  await instagramSyncQueueInstance.removeRepeatable(SYNC_JOB_TYPES.FULL_SYNC, {
    every: 30 * 60 * 1000,
    jobId: `full-sync-${channelId}`,
  });

  await instagramSyncQueueInstance.removeRepeatable(SYNC_JOB_TYPES.STATS_SYNC, {
    every: 10 * 60 * 1000,
    jobId: `stats-sync-${channelId}`,
  });

  console.log(`[InstagramSync] Removed sync jobs for channel ${channelId}`);
}

export default instagramSyncQueueInstance;
