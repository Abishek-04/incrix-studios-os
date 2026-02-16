// WhatsApp queue using Bull (disabled in production/Vercel)
// Bull doesn't work in serverless environments like Vercel
// This file provides no-op implementations when Bull is not available

let Queue;
let whatsappQueueInstance = null;

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

    // Create Bull queue for WhatsApp notifications
    whatsappQueueInstance = new Queue('whatsapp-notifications', {
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

    // Log queue events for monitoring
    whatsappQueueInstance.on('completed', (job, result) => {
      console.log(`[Queue] Job ${job.id} completed:`, result);
    });

    whatsappQueueInstance.on('failed', (job, err) => {
      console.error(`[Queue] Job ${job.id} failed:`, err.message);
    });

    whatsappQueueInstance.on('error', (error) => {
      console.error('[Queue] Queue error:', error);
    });
  } catch (error) {
    console.warn('[Queue] Bull not available, WhatsApp notifications disabled');
  }
}

export const whatsappQueue = whatsappQueueInstance;

// Job type constants
export const JOB_TYPES = {
  SEND_WHATSAPP: 'send-whatsapp',
  SEND_BATCH: 'send-batch',
};

/**
 * Queue a WhatsApp notification for a single user
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.phoneNumber - User phone number
 * @param {string} params.message - Message text
 * @param {string} params.templateName - WhatsApp template name (optional)
 * @param {Array} params.templateParams - Template parameters (optional)
 * @param {string} params.notificationId - Notification ID for tracking
 * @returns {Promise<Object>} Bull job object or no-op
 */
export async function queueWhatsAppNotification({
  userId,
  phoneNumber,
  message,
  templateName,
  templateParams,
  notificationId,
}) {
  if (!whatsappQueueInstance) {
    console.log('[Queue] WhatsApp queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  return whatsappQueueInstance.add(JOB_TYPES.SEND_WHATSAPP, {
    userId,
    phoneNumber,
    message,
    templateName,
    templateParams,
    notificationId,
    queuedAt: Date.now(),
  });
}

/**
 * Queue a batch WhatsApp notification for multiple users
 * @param {Object} params
 * @param {Array<string>} params.userIds - Array of user IDs
 * @param {string} params.message - Message text
 * @param {string} params.templateName - WhatsApp template name (optional)
 * @param {Array} params.templateParams - Template parameters (optional)
 * @returns {Promise<Object>} Bull job object or no-op
 */
export async function queueBatchWhatsApp({ userIds, message, templateName, templateParams }) {
  if (!whatsappQueueInstance) {
    console.log('[Queue] WhatsApp queue not available (production mode)');
    return Promise.resolve({ skipped: true, reason: 'Queue not available in production' });
  }

  return whatsappQueueInstance.add(JOB_TYPES.SEND_BATCH, {
    userIds,
    message,
    templateName,
    templateParams,
    queuedAt: Date.now(),
  });
}

export default whatsappQueueInstance;
