import whatsappQueue, { JOB_TYPES } from './queue.js';
import { sendWhatsAppMessage, sendWhatsAppTemplate } from '../services/whatsappService.js';
import connectDB from './mongodb.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { runDeadlineChecks } from './cron/deadlineChecker.js';

// Process single WhatsApp notification jobs
whatsappQueue.process(JOB_TYPES.SEND_WHATSAPP, async (job) => {
  const { userId, phoneNumber, message, templateName, templateParams, notificationId } = job.data;

  console.log(`[WhatsApp Queue] Processing job ${job.id} for user ${userId}`);

  try {
    await connectDB();

    // Verify user wants WhatsApp notifications
    const user = await User.findOne({ id: userId });
    if (!user || !user.notifyViaWhatsapp || !user.phoneNumber) {
      console.log(`[WhatsApp Queue] User ${userId} not eligible for WhatsApp`);
      return { skipped: true, reason: 'User not opted in or no phone number' };
    }

    // Send message via WhatsApp API
    let result;
    if (templateName) {
      // Use WhatsApp template (required for business accounts)
      result = await sendWhatsAppTemplate({
        to: user.phoneNumber,
        templateName,
        templateParams,
      });
    } else {
      // Send plain text message
      result = await sendWhatsAppMessage({
        to: user.phoneNumber,
        message,
      });
    }

    // Update notification with delivery status
    if (notificationId) {
      await Notification.updateOne(
        { id: notificationId },
        {
          $set: {
            whatsappMessageId: result.messageId,
            whatsappStatus: 'sent',
            whatsappSentAt: new Date(),
          },
        }
      );
    }

    console.log(`[WhatsApp Queue] Sent message ${result.messageId} to ${user.phoneNumber}`);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error(`[WhatsApp Queue] Error processing job ${job.id}:`, error);

    // Update notification with error
    if (notificationId) {
      await Notification.updateOne(
        { id: notificationId },
        {
          $set: {
            whatsappStatus: 'failed',
            whatsappError: error.message,
          },
        }
      );
    }

    throw error; // Will trigger retry
  }
});

// Process batch WhatsApp notification jobs
whatsappQueue.process(JOB_TYPES.SEND_BATCH, async (job) => {
  const { userIds, message, templateName, templateParams } = job.data;

  console.log(`[WhatsApp Queue] Processing batch job ${job.id} for ${userIds.length} users`);

  try {
    await connectDB();

    // Get users who have WhatsApp enabled
    const users = await User.find({
      id: { $in: userIds },
      notifyViaWhatsapp: true,
      phoneNumber: { $exists: true, $ne: null },
    });

    console.log(`[WhatsApp Queue] Found ${users.length} eligible users for batch`);

    const results = [];
    for (const user of users) {
      try {
        let result;
        if (templateName) {
          result = await sendWhatsAppTemplate({
            to: user.phoneNumber,
            templateName,
            templateParams,
          });
        } else {
          result = await sendWhatsAppMessage({
            to: user.phoneNumber,
            message,
          });
        }
        results.push({ userId: user.id, success: true, messageId: result.messageId });
        console.log(`[WhatsApp Queue] Sent to ${user.id}`);
      } catch (error) {
        console.error(`[WhatsApp Queue] Error sending to ${user.id}:`, error);
        results.push({ userId: user.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[WhatsApp Queue] Batch completed: ${successCount}/${users.length} sent`);

    return { totalSent: successCount, results };

  } catch (error) {
    console.error(`[WhatsApp Queue] Batch job ${job.id} failed:`, error);
    throw error;
  }
});

// Add deadline checking job type
const DEADLINE_CHECK_JOB = 'deadline-check';

// Process deadline check jobs
whatsappQueue.process(DEADLINE_CHECK_JOB, async (job) => {
  console.log('[DeadlineChecker] Running scheduled deadline check...');
  try {
    const results = await runDeadlineChecks();
    return results;
  } catch (error) {
    console.error('[DeadlineChecker] Error in scheduled check:', error);
    throw error;
  }
});

// Schedule repeatable job for deadline checking (runs every hour)
whatsappQueue.add(
  DEADLINE_CHECK_JOB,
  {},
  {
    repeat: {
      cron: '0 * * * *', // Every hour at :00
    },
    jobId: 'deadline-checker-hourly',
  }
).then(() => {
  console.log('[DeadlineChecker] Scheduled hourly deadline checks');
}).catch((err) => {
  console.error('[DeadlineChecker] Error scheduling deadline checks:', err);
});

// Log worker status
console.log('[WhatsApp Queue] Worker started and listening for jobs');
console.log('[WhatsApp Queue] Deadline checker scheduled (every hour)');
console.log(`[WhatsApp Queue] Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[WhatsApp Queue] SIGTERM received, closing gracefully');
  await whatsappQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[WhatsApp Queue] SIGINT received, closing gracefully');
  await whatsappQueue.close();
  process.exit(0);
});
