/**
 * Instagram Automation Queue
 * Uses Bull/Redis for local development, falls back to no-op in Vercel production.
 * Production uses inline processing via instagramAutomationProcessor.js instead.
 */

const isVercel = process.env.VERCEL === '1';

// Job type constants (used by both Bull and inline processor)
export const AUTOMATION_JOB_TYPES = {
  PROCESS_COMMENT: 'process-comment',
  SEND_DM: 'send-dm',
  MESSAGING_EVENT: 'process-messaging-event',
};

let instagramAutomationQueue = null;

if (!isVercel) {
  try {
    const Queue = (await import('bull')).default;

    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    instagramAutomationQueue = new Queue('instagram-automation', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    // Log queue events
    instagramAutomationQueue.on('completed', (job, result) => {
      console.log(`[InstagramAutomation] Job ${job.id} completed:`, result);
    });

    instagramAutomationQueue.on('failed', (job, err) => {
      console.error(`[InstagramAutomation] Job ${job.id} failed:`, err.message);
    });

    instagramAutomationQueue.on('error', (error) => {
      console.error('[InstagramAutomation] Queue error:', error);
    });

    console.log('[InstagramAutomation] Bull queue initialized (local dev)');
  } catch (error) {
    console.warn('[InstagramAutomation] Bull queue not available:', error.message);
  }
}

/**
 * Queue a comment for automation processing
 * In production, use processCommentEvent from instagramAutomationProcessor instead
 */
export async function queueCommentForAutomation({ igUserId, commentData }) {
  if (!instagramAutomationQueue) {
    console.log('[InstagramAutomation] Queue not available — use inline processor in production');
    return null;
  }

  return instagramAutomationQueue.add(AUTOMATION_JOB_TYPES.PROCESS_COMMENT, {
    igUserId,
    commentData,
    queuedAt: Date.now(),
  });
}

/**
 * Queue a DM to be sent (with delay if needed)
 * In production, use PendingJob model or executeDMSend from instagramAutomationProcessor instead
 */
export async function queueDM({ channelId, recipientId, message, automationRuleId, commentId, delaySeconds = 0 }) {
  if (!instagramAutomationQueue) {
    console.log('[InstagramAutomation] Queue not available — use inline processor in production');
    return null;
  }

  return instagramAutomationQueue.add(
    AUTOMATION_JOB_TYPES.SEND_DM,
    {
      channelId,
      recipientId,
      message,
      automationRuleId,
      commentId,
      queuedAt: Date.now(),
    },
    {
      delay: delaySeconds * 1000,
    }
  );
}

/**
 * Queue a messaging event for processing (delivery receipts, etc.)
 */
export async function queueMessagingEvent({ event }) {
  if (!instagramAutomationQueue) {
    console.log('[InstagramAutomation] Queue not available — messaging events logged inline');
    return null;
  }

  return instagramAutomationQueue.add(AUTOMATION_JOB_TYPES.MESSAGING_EVENT, {
    event,
    queuedAt: Date.now(),
  });
}

export { instagramAutomationQueue };
export default instagramAutomationQueue;
