import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

/**
 * POST /api/whatsapp/send
 * Manual WhatsApp message sending endpoint (for admin/manager use)
 */
export async function POST(request) {
  try {
    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = authUser.role || (authUser.roles && authUser.roles[0]);
    if (!['superadmin', 'manager'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { userIds, message } = await request.json();

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get users who have WhatsApp enabled and have phone numbers
    const users = await User.find({
      id: { $in: userIds },
      notifyViaWhatsapp: true,
      phoneNumber: { $exists: true, $ne: null },
      active: true,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible users found (must have WhatsApp enabled and phone number)',
        sent: 0,
        failed: 0,
        results: [],
      });
    }

    console.log(`[WhatsApp Send] Sending to ${users.length} users`);

    // Send message to each user
    const results = [];
    for (const user of users) {
      try {
        const result = await sendWhatsAppMessage({
          to: user.phoneNumber,
          message,
        });

        results.push({
          userId: user.id,
          userName: user.name,
          phoneNumber: user.phoneNumber,
          success: true,
          messageId: result.messageId,
        });

        console.log(`[WhatsApp Send] Sent to ${user.name} (${user.phoneNumber})`);
      } catch (error) {
        results.push({
          userId: user.id,
          userName: user.name,
          phoneNumber: user.phoneNumber,
          success: false,
          error: error.message,
        });

        console.error(`[WhatsApp Send] Failed to send to ${user.name}:`, error.message);
      }
    }

    // Calculate success/failure counts
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent to ${successCount} of ${users.length} users`,
      sent: successCount,
      failed: failureCount,
      totalEligibleUsers: users.length,
      totalRequestedUsers: userIds.length,
      results,
    });

  } catch (error) {
    console.error('[WhatsApp Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
