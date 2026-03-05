import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

/**
 * GET handler for webhook verification (Meta requirement)
 * Meta will call this endpoint to verify the webhook URL during setup
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('[WhatsApp Webhook] Verification failed');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST handler for incoming webhook events from WhatsApp
 * Handles message status updates (sent, delivered, read) and incoming messages
 */
export async function POST(request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const bodyText = await request.text();

    if (WHATSAPP_APP_SECRET && signature) {
      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', WHATSAPP_APP_SECRET)
        .update(bodyText)
        .digest('hex');
      if (expectedSig !== signature) {
        console.warn('[WhatsApp Webhook] Invalid signature');
        return new Response('Forbidden', { status: 403 });
      }
    }

    const body = JSON.parse(bodyText);

    console.log('[WhatsApp Webhook] Received event');

    // Handle status updates and incoming messages
    if (body.entry && body.entry[0]?.changes) {
      for (const change of body.entry[0].changes) {
        // Handle message status updates (sent, delivered, read, failed)
        if (change.value?.statuses) {
          for (const status of change.value.statuses) {
            await handleStatusUpdate(status);
          }
        }

        // Handle incoming messages (for future AI integration)
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            await handleIncomingMessage(message);
          }
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle delivery status updates for sent WhatsApp messages
 * Updates the notification record with delivery status
 */
async function handleStatusUpdate(status) {
  const { id: messageId, status: deliveryStatus, timestamp } = status;

  console.log(`[WhatsApp Webhook] Message ${messageId} status: ${deliveryStatus}`);

  try {
    await connectDB();

    // Update notification with delivery status
    const update = {
      $set: {
        whatsappStatus: deliveryStatus, // sent, delivered, read, failed
      },
    };

    // Add timestamps based on status
    if (deliveryStatus === 'delivered') {
      update.$set.whatsappDeliveredAt = new Date(timestamp * 1000);
    } else if (deliveryStatus === 'read') {
      update.$set.whatsappReadAt = new Date(timestamp * 1000);
    }

    const result = await Notification.updateOne(
      { whatsappMessageId: messageId },
      update
    );

    if (result.modifiedCount > 0) {
      console.log(`[WhatsApp Webhook] Updated notification for message ${messageId}`);
    } else {
      console.log(`[WhatsApp Webhook] No notification found for message ${messageId}`);
    }
  } catch (error) {
    console.error(`[WhatsApp Webhook] Error updating status for ${messageId}:`, error);
  }
}

/**
 * Handle incoming messages from users
 * This is for future AI integration where users can send messages to the system
 */
async function handleIncomingMessage(message) {
  const { from, text, timestamp } = message;

  console.log(`[WhatsApp Webhook] Incoming message from ${from}: ${text?.body}`);

  // TODO: Implement AI response logic (Phase 8)
  // Possible features:
  // 1. Parse message intent (e.g., "show my projects", "update status")
  // 2. Query database based on sender phone number
  // 3. Generate AI response using Claude/OpenAI
  // 4. Send response via WhatsApp API

  // For now, just log the message
  console.log('[WhatsApp Webhook] Message logged. AI response not yet implemented.');
}
