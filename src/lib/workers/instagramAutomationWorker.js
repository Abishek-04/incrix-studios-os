import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import instagramAutomationQueue, { AUTOMATION_JOB_TYPES, queueDM } from '../queues/instagramAutomationQueue.js';
import connectDB from '../mongodb.js';
import Channel from '../../models/Channel.js';
import InstagramMedia from '../../models/InstagramMedia.js';
import AutomationRule from '../../models/AutomationRule.js';
import AutomationLog from '../../models/AutomationLog.js';
import { getAccessToken } from '../../services/instagramTokenService.js';

/**
 * Check if comment matches keyword triggers
 */
function matchesKeywords(commentText, keywords) {
  if (!keywords || keywords.length === 0) return true;

  const lowerText = commentText.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Check if comment contains excluded keywords
 */
function hasExcludedKeywords(commentText, excludeKeywords) {
  if (!excludeKeywords || excludeKeywords.length === 0) return false;

  const lowerText = commentText.toLowerCase();
  return excludeKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Format message with variables
 */
function formatMessage(template, variables) {
  let message = template;

  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, variables[key] || '');
  });

  return message;
}

/**
 * Process comment event and apply automation rules
 */
instagramAutomationQueue.process(AUTOMATION_JOB_TYPES.PROCESS_COMMENT, async (job) => {
  const { igUserId, commentData } = job.data;
  const startTime = Date.now();

  console.log(`[InstagramAutomation] Processing comment from IG user ${igUserId}`);

  try {
    await connectDB();

    // Find the channel by Instagram user ID
    const channel = await Channel.findOne({ igUserId });

    if (!channel) {
      console.log(`[InstagramAutomation] Channel not found for IG user ${igUserId}`);
      return { skipped: true, reason: 'Channel not found' };
    }

    // Extract comment details
    const { id: commentId, text: commentText, from, media } = commentData;
    const commenterUserId = from?.id;
    const commenterUsername = from?.username;
    const mediaId = media?.id;

    if (!commenterUserId || !commentText) {
      return { skipped: true, reason: 'Invalid comment data' };
    }

    // Don't DM yourself
    if (commenterUserId === igUserId) {
      console.log(`[InstagramAutomation] Skipping self-comment`);
      return { skipped: true, reason: 'Self-comment' };
    }

    // Find matching automation rules
    const rules = await AutomationRule.find({
      channelId: channel.id,
      status: 'active',
      $or: [
        { mediaId: mediaId },
        { mediaId: null }
      ]
    });

    console.log(`[InstagramAutomation] Found ${rules.length} active rules`);

    if (rules.length === 0) {
      return { skipped: true, reason: 'No active rules' };
    }

    const results = [];

    for (const rule of rules) {
      try {
        // KEYWORD CHECK
        if (rule.trigger.type === 'keyword_comment') {
          if (!matchesKeywords(commentText, rule.trigger.keywords)) {
            await AutomationLog.create({
              id: uuidv4(),
              automationRuleId: rule.id,
              channelId: channel.id,
              igMediaId: mediaId,
              igCommentId: commentId,
              igUserId: commenterUserId,
              igUsername: commenterUsername,
              commentText,
              dmStatus: 'keyword_filtered',
            });

            await AutomationRule.updateOne(
              { id: rule.id },
              { $inc: { 'stats.totalTriggered': 1 } }
            );

            results.push({ ruleId: rule.id, status: 'keyword_filtered' });
            continue;
          }
        }

        // EXCLUDE KEYWORDS CHECK
        if (hasExcludedKeywords(commentText, rule.trigger.excludeKeywords)) {
          await AutomationLog.create({
            id: uuidv4(),
            automationRuleId: rule.id,
            channelId: channel.id,
            igMediaId: mediaId,
            igCommentId: commentId,
            igUserId: commenterUserId,
            igUsername: commenterUsername,
            commentText,
            dmStatus: 'keyword_filtered',
          });

          results.push({ ruleId: rule.id, status: 'excluded_keyword' });
          continue;
        }

        // DEDUPLICATION CHECK
        if (rule.deduplication.enabled) {
          const windowStart = new Date(Date.now() - rule.deduplication.windowHours * 60 * 60 * 1000);

          const recentLog = await AutomationLog.findOne({
            automationRuleId: rule.id,
            igUserId: commenterUserId,
            channelId: channel.id,
            dmStatus: { $in: ['sent', 'queued'] },
            createdAt: { $gte: windowStart },
          });

          if (recentLog) {
            await AutomationLog.create({
              id: uuidv4(),
              automationRuleId: rule.id,
              channelId: channel.id,
              igMediaId: mediaId,
              igCommentId: commentId,
              igUserId: commenterUserId,
              igUsername: commenterUsername,
              commentText,
              dmStatus: 'deduped',
            });

            await AutomationRule.updateOne(
              { id: rule.id },
              {
                $inc: {
                  'stats.totalTriggered': 1,
                  'stats.totalDeduped': 1
                },
                $set: { 'stats.lastTriggeredAt': new Date() }
              }
            );

            results.push({ ruleId: rule.id, status: 'deduped' });
            continue;
          }
        }

        // DAILY LIMIT CHECK
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayCount = await AutomationLog.countDocuments({
          automationRuleId: rule.id,
          dmStatus: 'sent',
          createdAt: { $gte: todayStart },
        });

        if (todayCount >= rule.dailyLimit) {
          await AutomationLog.create({
            id: uuidv4(),
            automationRuleId: rule.id,
            channelId: channel.id,
            igMediaId: mediaId,
            igCommentId: commentId,
            igUserId: commenterUserId,
            igUsername: commenterUsername,
            commentText,
            dmStatus: 'rate_limited',
          });

          results.push({ ruleId: rule.id, status: 'rate_limited' });
          continue;
        }

        // FORMAT MESSAGE
        let postCaption = '';
        let postLink = '';

        if (mediaId) {
          const mediaDoc = await InstagramMedia.findOne({ igMediaId: mediaId });
          if (mediaDoc) {
            postCaption = mediaDoc.caption || '';
            postLink = mediaDoc.permalink;
          }
        }

        const formattedMessage = formatMessage(rule.response.messageTemplate, {
          username: commenterUsername,
          comment_text: commentText,
          post_caption: postCaption,
          post_link: postLink,
        });

        // CREATE LOG (queued status)
        const log = await AutomationLog.create({
          id: uuidv4(),
          automationRuleId: rule.id,
          channelId: channel.id,
          igMediaId: mediaId,
          igCommentId: commentId,
          igUserId: commenterUserId,
          igUsername: commenterUsername,
          commentText,
          dmStatus: 'queued',
        });

        // QUEUE DM (with delay)
        await queueDM({
          channelId: channel.id,
          recipientId: commenterUserId,
          message: formattedMessage,
          automationRuleId: rule.id,
          commentId: commentId,
          delaySeconds: rule.response.delaySeconds || 5,
          logId: log.id,
          includeFiles: rule.response.includeFiles,
        });

        // Update rule stats
        await AutomationRule.updateOne(
          { id: rule.id },
          {
            $inc: { 'stats.totalTriggered': 1 },
            $set: { 'stats.lastTriggeredAt': new Date() }
          }
        );

        results.push({ ruleId: rule.id, status: 'queued', logId: log.id });

      } catch (ruleError) {
        console.error(`[InstagramAutomation] Error processing rule ${rule.id}:`, ruleError);
        results.push({ ruleId: rule.id, status: 'error', error: ruleError.message });
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`[InstagramAutomation] Processed comment in ${responseTime}ms`);

    return {
      success: true,
      channelId: channel.id,
      commentId,
      rulesProcessed: rules.length,
      results,
      responseTimeMs: responseTime,
    };

  } catch (error) {
    console.error('[InstagramAutomation] Error processing comment:', error);
    throw error;
  }
});

/**
 * Send Instagram DM
 */
instagramAutomationQueue.process(AUTOMATION_JOB_TYPES.SEND_DM, async (job) => {
  const { channelId, recipientId, message, automationRuleId, logId, includeFiles } = job.data;
  const startTime = Date.now();

  console.log(`[InstagramAutomation] Sending DM to ${recipientId}`);

  try {
    await connectDB();

    // Get access token
    const accessToken = await getAccessToken(channelId);

    // Send text message
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const messageId = response.data.message_id;

    // Send file attachments if any
    if (includeFiles && includeFiles.length > 0) {
      for (const file of includeFiles) {
        try {
          await axios.post(
            `https://graph.facebook.com/v21.0/me/messages`,
            {
              recipient: { id: recipientId },
              message: {
                attachment: {
                  type: file.type === 'document' ? 'file' : file.type,
                  payload: { url: file.url },
                },
              },
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (fileError) {
          console.error('[InstagramAutomation] Error sending file attachment:', fileError);
        }
      }
    }

    const responseTime = Date.now() - startTime;

    // Update log
    if (logId) {
      await AutomationLog.updateOne(
        { id: logId },
        {
          $set: {
            dmStatus: 'sent',
            dmSentAt: new Date(),
            responseTimeMs: responseTime,
          },
        }
      );
    }

    // Update rule stats
    await AutomationRule.updateOne(
      { id: automationRuleId },
      {
        $inc: { 'stats.totalSent': 1 },
        $set: { 'stats.lastSentAt': new Date() },
      }
    );

    console.log(`[InstagramAutomation] DM sent successfully: ${messageId}`);

    return {
      success: true,
      messageId,
      recipientId,
      responseTimeMs: responseTime,
    };

  } catch (error) {
    console.error('[InstagramAutomation] Error sending DM:', error);

    // Update log with error
    if (logId) {
      await AutomationLog.updateOne(
        { id: logId },
        {
          $set: {
            dmStatus: 'failed',
            errorMessage: error.response?.data?.error?.message || error.message,
          },
        }
      );
    }

    // Update rule stats
    await AutomationRule.updateOne(
      { id: automationRuleId },
      { $inc: { 'stats.totalFailed': 1 } }
    );

    throw error;
  }
});

/**
 * Process messaging events (delivery receipts, read receipts)
 */
instagramAutomationQueue.process(AUTOMATION_JOB_TYPES.MESSAGING_EVENT, async (job) => {
  const { event } = job.data;

  console.log(`[InstagramAutomation] Processing messaging event:`, event);

  // Handle delivery receipts, read receipts, etc.
  // This can be expanded to update AutomationLog with delivery status

  return { success: true, processed: true };
});

// Log worker status
console.log('[InstagramAutomation] Worker started and listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[InstagramAutomation] SIGTERM received, closing gracefully');
  await instagramAutomationQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[InstagramAutomation] SIGINT received, closing gracefully');
  await instagramAutomationQueue.close();
  process.exit(0);
});
