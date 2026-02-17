import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import PendingJob from '@/models/PendingJob';
import { executeDMSend } from '@/services/instagramAutomationProcessor';
import { refreshLongLivedToken } from '@/services/instagramTokenService';

/**
 * GET /api/cron/instagram
 * Vercel Cron Job — runs every 5 minutes to:
 * 1. Process pending delayed DMs
 * 2. Refresh expiring tokens
 * 3. Mark expired tokens
 */
export async function GET(request) {
  try {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const results = {
      pendingDMs: { processed: 0, sent: 0, failed: 0 },
      tokenRefresh: { checked: 0, refreshed: 0, failed: 0 },
      expiredTokens: { marked: 0 },
    };

    // 1. Process pending delayed DMs whose executeAfter has passed
    await processPendingDMs(results);

    // 2. Refresh tokens expiring within 7 days
    await refreshExpiringTokens(results);

    // 3. Mark tokens that have already expired
    await markExpiredTokens(results);

    console.log('[Instagram Cron] Completed:', JSON.stringify(results));

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Instagram Cron] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process pending DM jobs whose delay has elapsed
 */
async function processPendingDMs(results) {
  const now = new Date();

  // Find pending DM jobs ready to execute
  const pendingJobs = await PendingJob.find({
    type: 'send_dm',
    status: 'pending',
    executeAfter: { $lte: now },
  }).limit(50); // Process up to 50 per run to stay within Vercel timeout

  results.pendingDMs.processed = pendingJobs.length;

  for (const job of pendingJobs) {
    try {
      // Mark as processing to prevent duplicate execution
      await PendingJob.updateOne(
        { id: job.id, status: 'pending' },
        { $set: { status: 'processing' }, $inc: { attempts: 1 } }
      );

      const { recipientId, message, automationRuleId, logId, includeFiles } = job.payload;

      await executeDMSend(job.channelId, recipientId, message, {
        automationRuleId,
        logId,
        includeFiles,
      });

      // Mark completed
      await PendingJob.updateOne(
        { id: job.id },
        { $set: { status: 'completed', completedAt: new Date() } }
      );

      results.pendingDMs.sent++;
    } catch (error) {
      console.error(`[Instagram Cron] Failed to send DM job ${job.id}:`, error.message);

      const shouldRetry = job.attempts < job.maxAttempts;

      await PendingJob.updateOne(
        { id: job.id },
        {
          $set: {
            status: shouldRetry ? 'pending' : 'failed',
            lastError: error.message,
            // If retrying, delay by 30 seconds * attempt number
            ...(shouldRetry && {
              executeAfter: new Date(Date.now() + 30000 * (job.attempts + 1)),
            }),
          },
        }
      );

      results.pendingDMs.failed++;
    }
  }
}

/**
 * Refresh tokens that are expiring within 7 days
 */
async function refreshExpiringTokens(results) {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const expiringChannels = await Channel.find({
    platform: 'instagram',
    connectionStatus: { $in: ['connected', 'token_expiring'] },
    $or: [
      { userTokenExpiry: { $lte: sevenDaysFromNow, $gt: new Date() } },
      { tokenExpiry: { $lte: sevenDaysFromNow, $gt: new Date() } },
    ],
  });

  results.tokenRefresh.checked = expiringChannels.length;

  for (const channel of expiringChannels) {
    try {
      await Channel.updateOne(
        { id: channel.id },
        { $set: { connectionStatus: 'token_expiring' } }
      );

      await refreshLongLivedToken(channel.id);
      results.tokenRefresh.refreshed++;
    } catch (error) {
      console.error(`[Instagram Cron] Token refresh failed for ${channel.igUsername}:`, error.message);
      results.tokenRefresh.failed++;
    }
  }
}

/**
 * Mark channels with fully expired tokens
 */
async function markExpiredTokens(results) {
  const now = new Date();

  const result = await Channel.updateMany(
    {
      platform: 'instagram',
      connectionStatus: { $in: ['connected', 'token_expiring'] },
      $or: [
        { userTokenExpiry: { $lte: now } },
        { tokenExpiry: { $lte: now } },
      ],
    },
    { $set: { connectionStatus: 'token_expired' } }
  );

  results.expiredTokens.marked = result.modifiedCount || 0;
}
