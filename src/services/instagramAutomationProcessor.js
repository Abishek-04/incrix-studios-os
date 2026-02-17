import { v4 as uuidv4 } from 'uuid';
import connectDB from '../lib/mongodb.js';
import Channel from '../models/Channel.js';
import InstagramMedia from '../models/InstagramMedia.js';
import AutomationRule from '../models/AutomationRule.js';
import AutomationLog from '../models/AutomationLog.js';
import PendingJob from '../models/PendingJob.js';
import { decrypt } from '../utils/encryption.js';
import { sendInstagramDM, sendInstagramDMAttachment } from './facebookGraphService.js';

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
 * Format message template with variables
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
 * Process a comment event and apply automation rules.
 * This is the inline (serverless-compatible) version of what the Bull worker did.
 */
export async function processCommentEvent(igUserId, commentData) {
  const startTime = Date.now();

  console.log(`[AutomationProcessor] Processing comment from IG user ${igUserId}`);

  try {
    await connectDB();

    // Find the channel by Instagram user ID
    const channel = await Channel.findOne({
      $or: [
        { igUserId },
        { igBusinessAccountId: igUserId },
      ]
    });

    if (!channel) {
      console.log(`[AutomationProcessor] Channel not found for IG user ${igUserId}`);
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
    if (commenterUserId === igUserId || commenterUserId === channel.igBusinessAccountId) {
      console.log(`[AutomationProcessor] Skipping self-comment`);
      return { skipped: true, reason: 'Self-comment' };
    }

    // Find matching automation rules
    const rules = await AutomationRule.find({
      channelId: channel.id,
      status: 'active',
      $or: [
        { mediaId: mediaId },
        { mediaId: null },
      ],
    });

    console.log(`[AutomationProcessor] Found ${rules.length} active rules`);

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
        if (rule.deduplication?.enabled) {
          const windowStart = new Date(
            Date.now() - (rule.deduplication.windowHours || 24) * 60 * 60 * 1000
          );

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
                $inc: { 'stats.totalTriggered': 1, 'stats.totalDeduped': 1 },
                $set: { 'stats.lastTriggeredAt': new Date() },
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

        // Update rule stats
        await AutomationRule.updateOne(
          { id: rule.id },
          {
            $inc: { 'stats.totalTriggered': 1 },
            $set: { 'stats.lastTriggeredAt': new Date() },
          }
        );

        const delaySeconds = rule.response.delaySeconds || 0;

        if (delaySeconds > 0) {
          // Delayed DM: create a PendingJob for the cron to pick up
          await PendingJob.create({
            id: uuidv4(),
            type: 'send_dm',
            channelId: channel.id,
            payload: {
              recipientId: commenterUserId,
              message: formattedMessage,
              automationRuleId: rule.id,
              logId: log.id,
              includeFiles: rule.response.includeFiles || [],
            },
            executeAfter: new Date(Date.now() + delaySeconds * 1000),
          });

          results.push({ ruleId: rule.id, status: 'queued_delayed', logId: log.id });
        } else {
          // Send immediately
          try {
            await executeDMSend(channel, commenterUserId, formattedMessage, {
              automationRuleId: rule.id,
              logId: log.id,
              includeFiles: rule.response.includeFiles || [],
            });
            results.push({ ruleId: rule.id, status: 'sent', logId: log.id });
          } catch (sendError) {
            console.error(`[AutomationProcessor] DM send failed:`, sendError.message);
            results.push({ ruleId: rule.id, status: 'send_failed', logId: log.id });
          }
        }
      } catch (ruleError) {
        console.error(`[AutomationProcessor] Error processing rule ${rule.id}:`, ruleError);
        results.push({ ruleId: rule.id, status: 'error', error: ruleError.message });
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`[AutomationProcessor] Processed comment in ${responseTime}ms`);

    return {
      success: true,
      channelId: channel.id,
      commentId,
      rulesProcessed: rules.length,
      results,
      responseTimeMs: responseTime,
    };
  } catch (error) {
    console.error('[AutomationProcessor] Error processing comment:', error);
    throw error;
  }
}

/**
 * Execute sending a DM via the Instagram messaging API (through Facebook Page).
 * Used both for immediate sends and by the cron job for delayed sends.
 */
export async function executeDMSend(channel, recipientId, message, options = {}) {
  const { automationRuleId, logId, includeFiles = [] } = options;
  const startTime = Date.now();

  try {
    // Get Page Access Token
    const channelWithToken = typeof channel === 'string'
      ? await Channel.findOne({ id: channel }).select('+accessToken +fbPageAccessToken')
      : channel.accessToken
        ? channel
        : await Channel.findOne({ id: channel.id }).select('+accessToken +fbPageAccessToken');

    if (!channelWithToken) {
      throw new Error('Channel not found');
    }

    const encryptedToken = channelWithToken.fbPageAccessToken || channelWithToken.accessToken;
    if (!encryptedToken) {
      throw new Error('No access token found for channel');
    }

    const pageAccessToken = decrypt(encryptedToken);
    const pageId = channelWithToken.fbPageId;

    if (!pageId) {
      throw new Error('No Facebook Page ID found - channel needs reconnection');
    }

    // Send the text DM
    const result = await sendInstagramDM(pageId, pageAccessToken, recipientId, message);

    // Send file attachments if any
    for (const file of includeFiles) {
      try {
        await sendInstagramDMAttachment(pageId, pageAccessToken, recipientId, file);
      } catch (fileError) {
        console.error('[AutomationProcessor] Error sending file attachment:', fileError.message);
      }
    }

    const responseTime = Date.now() - startTime;

    // Update log status to sent
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
    if (automationRuleId) {
      await AutomationRule.updateOne(
        { id: automationRuleId },
        {
          $inc: { 'stats.totalSent': 1 },
          $set: { 'stats.lastSentAt': new Date() },
        }
      );
    }

    console.log(`[AutomationProcessor] DM sent successfully: ${result.messageId}`);
    return { success: true, messageId: result.messageId, responseTimeMs: responseTime };
  } catch (error) {
    console.error('[AutomationProcessor] Error sending DM:', error.message);

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
    if (automationRuleId) {
      await AutomationRule.updateOne(
        { id: automationRuleId },
        { $inc: { 'stats.totalFailed': 1 } }
      );
    }

    throw error;
  }
}

export default {
  processCommentEvent,
  executeDMSend,
};
