import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import { AutomationEngine } from '@/services/instagramAutomationEngine';

/**
 * GET /api/instagram/webhook
 * Instagram webhook verification (hub.challenge)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken || !token) {
    return new Response(null, { status: 403 });
  }

  // Timing-safe comparison for verify token
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken);
  if (mode === 'subscribe' && a.length === b.length && timingSafeEqual(a, b)) {
    console.log('[webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.error('[webhook] Verification failed');
  return new Response(null, { status: 403 });
}

/**
 * Verify Instagram webhook signature (x-hub-signature-256)
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!signature || !process.env.INSTAGRAM_APP_SECRET) return false;
  const expected = 'sha256=' + createHmac('sha256', process.env.INSTAGRAM_APP_SECRET)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/instagram/webhook
 * Receive Instagram webhook events (comments, messages)
 */
export async function POST(request) {
  // Verify webhook signature
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[webhook] Invalid signature');
    return new Response('Invalid signature', { status: 403 });
  }

  await connectDB();
  const body = JSON.parse(rawBody);

  console.log('\n===== INSTAGRAM WEBHOOK RECEIVED =====');
  console.log('Time:', new Date().toISOString());
  console.log('Object:', body.object || '<missing>');

  for (const entry of body.entry || []) {
    // Find the Instagram account by any matching ID
    const entryId = entry.id ? String(entry.id) : null;
    let account = null;

    if (entryId) {
      account = await InstaAccount.findOne({
        $or: [
          { instagramUserId: entryId },
          { instagramLoginId: entryId },
          { instagramTokenUserId: entryId },
        ],
      }).lean();
    }

    for (const change of entry.changes || []) {
      if (change.field === 'comments' || (change.field === 'feed' && change.value?.item === 'comment')) {
        const comment = change.value || {};
        console.log('--- COMMENT EVENT ---');
        console.log('Comment ID:', comment.id || '<missing>');
        console.log('Media ID:', comment.media?.id || comment.media_id || '<missing>');
        console.log('From:', comment.from?.username || '<unknown>');
        console.log('Text:', comment.text || '<empty>');

        if (!account) {
          console.warn(`[webhook] No account found for entry id ${entryId}`);
          continue;
        }

        await AutomationEngine.processCommentEvent({
          commentId: comment.id,
          text: comment.text || '',
          mediaId: comment.media?.id || comment.media_id || '',
          fromId: comment.from?.id ? String(comment.from.id) : '',
          fromUsername: comment.from?.username || '',
        }, account);
      }
    }

    for (const event of entry.messaging || []) {
      console.log('--- MESSAGING EVENT ---');
      console.log('Sender:', event.sender?.id || '<missing>');
      console.log('Text:', event.message?.text || '<none>');
    }
  }

  console.log('======================================\n');
  return NextResponse.json({ received: true });
}
