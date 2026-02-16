import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { queueBatchWhatsApp } from '@/lib/queue';

/**
 * POST /api/whatsapp/broadcast
 * Send broadcast WhatsApp message to multiple users
 * Admin only
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { userIds, message, templateName, templateParams } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'userIds array is required' },
        { status: 400 }
      );
    }

    if (!message && !templateName) {
      return NextResponse.json(
        { success: false, error: 'message or templateName is required' },
        { status: 400 }
      );
    }

    // Verify users exist and have WhatsApp enabled
    const users = await User.find({
      id: { $in: userIds },
      'notificationPreferences.whatsapp.enabled': true,
      whatsappNumber: { $exists: true, $ne: null },
    }).select('id whatsappNumber');

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No eligible users found' },
        { status: 404 }
      );
    }

    // Queue batch WhatsApp job
    await queueBatchWhatsApp({
      userIds: users.map((u) => u.id),
      message,
      templateName,
      templateParams,
    });

    return NextResponse.json({
      success: true,
      queuedCount: users.length,
      message: `Broadcast queued for ${users.length} users`,
    });
  } catch (error) {
    console.error('[Broadcast API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to queue broadcast' },
      { status: 500 }
    );
  }
}
