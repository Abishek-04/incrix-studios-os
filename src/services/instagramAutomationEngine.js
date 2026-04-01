import connectDB from '@/lib/mongodb';
import InstaAutomation from '@/models/InstaAutomation';
import InstaUsage from '@/models/InstaUsage';
import InstaProcessedEvent from '@/models/InstaProcessedEvent';
import { InstagramService } from './instagramService';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function hasRecentEvent(key) {
  const doc = await InstaProcessedEvent.findOne({ key });
  return !!doc;
}

async function markEventProcessed(key) {
  await InstaProcessedEvent.updateOne({ key }, { key, createdAt: new Date() }, { upsert: true });
}

async function getMonthlyUsage(accountId) {
  const month = currentMonth();
  const doc = await InstaUsage.findOne({ accountId, month });
  return doc ? doc.repliesSent : 0;
}

async function incrementUsage(accountId) {
  const month = currentMonth();
  await InstaUsage.findOneAndUpdate(
    { accountId, month },
    { $inc: { repliesSent: 1 } },
    { upsert: true }
  );
}

export const AutomationEngine = {
  async processCommentEvent(commentEvent, account) {
    await connectDB();

    const { commentId, text, mediaId, fromId, fromUsername } = commentEvent;

    if (!text || !commentId) {
      console.log('[engine] Empty comment text or missing id, skipping');
      return;
    }

    const accountId = account._id.toString();
    const recentEventKey = `${accountId}:${commentId}`;
    if (await hasRecentEvent(recentEventKey)) {
      console.log(`[engine] Duplicate comment event ignored for ${commentId}`);
      return;
    }

    // Ignore self-authored comments
    if (fromUsername && fromUsername === account.username) {
      console.log('[engine] Ignoring self-authored comment by username');
      return;
    }
    if (fromId && [account.instagramUserId, account.instagramLoginId, account.instagramTokenUserId].includes(fromId)) {
      console.log('[engine] Ignoring self-authored comment by user id');
      return;
    }

    // Find matching automations for this account
    const allAutomations = await InstaAutomation.find({ accountId, active: true }).lean();
    const matchingAutomations = allAutomations.filter(a =>
      a.triggerType === 'comment' &&
      (!a.targetMediaId || a.targetMediaId === 'any' || a.targetMediaId === mediaId)
    );

    if (matchingAutomations.length === 0) {
      console.log(`[engine] No active automations found for account ${account.username}`);
      return;
    }

    // Match trigger keywords (supports comma-separated multiple keywords)
    const lowerText = text.toLowerCase();
    const matched = matchingAutomations.find(rule => {
      const triggerWords = rule.triggerKeyword.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
      return triggerWords.some(word => {
        if (rule.matchType === 'exact') return lowerText === word;
        return lowerText.includes(word);
      });
    });

    if (!matched) {
      console.log('[engine] No trigger word found, skipping');
      return;
    }

    console.log(`[engine] Trigger matched "${matched.triggerKeyword}" for ${account.username}`);
    const fallbackMessage = matched.compiledReplyMessage || matched.replyMessage || '';
    const commentMessage = (matched.commentReplyMessage != null && matched.commentReplyMessage !== '') ? matched.commentReplyMessage : fallbackMessage;
    let dmMessage = (matched.dmReplyMessage != null && matched.dmReplyMessage !== '') ? matched.dmReplyMessage : fallbackMessage;

    await markEventProcessed(recentEventKey);

    let commentSent = false;
    let dmSent = false;

    if (matched.replyType === 'comment' || matched.replyType === 'both') {
      commentSent = await InstagramService.replyToComment(commentId, commentMessage, account);
    }

    if (matched.replyType === 'dm' || matched.replyType === 'both') {
      // Send rich card with image + button when product link exists, otherwise plain text
      const dmOptions = {};
      if (matched.productLink) {
        dmOptions.productLink = matched.productLink;
        // Use custom product image if provided, otherwise fall back to reel thumbnail
        dmOptions.imageUrl = matched.productImageUrl || matched.targetMediaUrl || null;
        dmOptions.buttonText = matched.buttonText || 'Check Now';
        // Don't append link to message — it goes in the button
        dmMessage = (matched.dmReplyMessage != null && matched.dmReplyMessage !== '') ? matched.dmReplyMessage : (matched.replyMessage || '');
      }
      dmSent = await InstagramService.sendPrivateReply(commentId, dmMessage, account, dmOptions);
    }

    // Update stats
    const inc = {};
    if (commentSent) inc.commentReplies = 1;
    if (dmSent) inc.dmReplies = 1;
    if (Object.keys(inc).length > 0) {
      await InstaAutomation.findByIdAndUpdate(matched._id, { $inc: inc });
    }

    await incrementUsage(accountId);
  },
};
