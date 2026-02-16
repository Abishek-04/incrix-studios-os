import Queue from 'bull';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Bull queue for Instagram automation
export const instagramAutomationQueue = new Queue('instagram-automation', {
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

// Job type constants
export const AUTOMATION_JOB_TYPES = {
  PROCESS_COMMENT: 'process-comment',
  SEND_DM: 'send-dm',
  MESSAGING_EVENT: 'process-messaging-event',
};

/**
 * Queue a comment for automation processing
 */
export async function queueCommentForAutomation({ igUserId, commentData }) {
  return instagramAutomationQueue.add(AUTOMATION_JOB_TYPES.PROCESS_COMMENT, {
    igUserId,
    commentData,
    queuedAt: Date.now(),
  });
}

/**
 * Queue a DM to be sent (with delay if needed)
 */
export async function queueDM({ channelId, recipientId, message, automationRuleId, commentId, delaySeconds = 0 }) {
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
  return instagramAutomationQueue.add(AUTOMATION_JOB_TYPES.MESSAGING_EVENT, {
    event,
    queuedAt: Date.now(),
  });
}

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

export default instagramAutomationQueue;
