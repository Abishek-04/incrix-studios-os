import { NextResponse } from 'next/server';
import crypto from 'crypto';

const INSTAGRAM_WEBHOOK_VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

/**
 * Verify webhook signature from Meta
 */
function verifySignature(body, signature) {
  if (!APP_SECRET || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(body)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

/**
 * GET /api/webhooks/instagram
 * Webhook verification endpoint (Meta sends this to verify your endpoint)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[Instagram Webhook] Verification request:', { mode, token });

    if (mode === 'subscribe' && token === INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
      console.log('[Instagram Webhook] Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    }

    console.warn('[Instagram Webhook] Verification failed');
    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[Instagram Webhook] Verification error:', error);
    return new Response('Error', { status: 500 });
  }
}

/**
 * POST /api/webhooks/instagram
 * Handle incoming webhook events from Instagram — processes inline (no Bull/Redis needed)
 */
export async function POST(request) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const bodyText = await request.text();

    // Verify signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifySignature(bodyText, signature)) {
        console.warn('[Instagram Webhook] Invalid signature');
        return new Response('Forbidden', { status: 403 });
      }
    }

    const body = JSON.parse(bodyText);

    console.log('[Instagram Webhook] Received event:', JSON.stringify(body, null, 2));

    // Handle Instagram object events
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        // Handle comment events — process inline
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              console.log('[Instagram Webhook] Comment event:', change.value);

              try {
                const { processCommentEvent } = await import('@/services/instagramAutomationProcessor');
                await processCommentEvent(entry.id, change.value);
              } catch (processingError) {
                console.error('[Instagram Webhook] Comment processing error:', processingError.message);
                // Don't throw — we still want to return 200 to Meta
              }
            }
          }
        }

        // Handle messaging events (DM delivery, read receipts)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            console.log('[Instagram Webhook] Messaging event:', event);
            // Messaging events can be processed inline if needed
            // For now, just log them — delivery receipts don't require action
          }
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Instagram Webhook] Error processing webhook:', error);
    // Still return 200 to prevent Meta from retrying
    return new Response('OK', { status: 200 });
  }
}
