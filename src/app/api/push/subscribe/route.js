import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';

// POST — Save push subscription for a user
export async function POST(request) {
  try {
    let decoded;
    try {
      decoded = await authenticate(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId, subscription } = await request.json();

    // Users can only modify their own subscriptions
    if (userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    await connectDB();

    // Remove any existing subscription with the same endpoint, then add the new one
    await User.updateOne(
      { id: userId },
      { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
    );

    await User.updateOne(
      { id: userId },
      { $push: { pushSubscriptions: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      }}}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Remove a push subscription
export async function DELETE(request) {
  try {
    let decoded;
    try {
      decoded = await authenticate(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId, endpoint } = await request.json();

    // Users can only modify their own subscriptions
    if (userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userId || !endpoint) {
      return NextResponse.json({ error: 'userId and endpoint are required' }, { status: 400 });
    }

    await connectDB();

    await User.updateOne(
      { id: userId },
      { $pull: { pushSubscriptions: { endpoint } } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
