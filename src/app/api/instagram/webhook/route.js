import { NextResponse } from 'next/server';
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

  console.log('[webhook] Verification request:', { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.error('[webhook] Verification failed');
  return new Response(null, { status: 403 });
}

/**
 * POST /api/instagram/webhook
 * Receive Instagram webhook events (comments, messages)
 */
export async function POST(request) {
  await connectDB();
  const body = await request.json();

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
