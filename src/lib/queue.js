import Queue from 'bull';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Bull queue for WhatsApp notifications
export const whatsappQueue = new Queue('whatsapp-notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds, then 25 seconds, then 125 seconds
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for monitoring
    removeOnFail: 200, // Keep last 200 failed jobs for debugging
  },
});

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
 * @returns {Promise<Object>} Bull job object
 */
export async function queueWhatsAppNotification({
  userId,
  phoneNumber,
  message,
  templateName,
  templateParams,
  notificationId,
}) {
  return whatsappQueue.add(JOB_TYPES.SEND_WHATSAPP, {
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
 * @returns {Promise<Object>} Bull job object
 */
export async function queueBatchWhatsApp({ userIds, message, templateName, templateParams }) {
  return whatsappQueue.add(JOB_TYPES.SEND_BATCH, {
    userIds,
    message,
    templateName,
    templateParams,
    queuedAt: Date.now(),
  });
}

// Log queue events for monitoring
whatsappQueue.on('completed', (job, result) => {
  console.log(`[Queue] Job ${job.id} completed:`, result);
});

whatsappQueue.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job.id} failed:`, err.message);
});

whatsappQueue.on('error', (error) => {
  console.error('[Queue] Queue error:', error);
});

export default whatsappQueue;
