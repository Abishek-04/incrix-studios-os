import webPush from 'web-push';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:admin@incrix.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * Send a push notification to a user's subscribed devices.
 * Automatically cleans up stale/expired subscriptions.
 */
export async function sendPushToUser(userId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[WebPush] VAPID keys not configured, skipping push');
    return;
  }

  try {
    await connectDB();
    const user = await User.findOne({ id: userId }).select('pushSubscriptions');

    if (!user?.pushSubscriptions?.length) return;

    const staleEndpoints = [];

    await Promise.allSettled(
      user.pushSubscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
            },
            JSON.stringify(payload)
          );
        } catch (err) {
          // 410 Gone or 404 means the subscription is no longer valid
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleEndpoints.push(sub.endpoint);
          } else {
            console.error(`[WebPush] Failed to send to ${sub.endpoint}:`, err.message);
          }
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await User.updateOne(
        { id: userId },
        { $pull: { pushSubscriptions: { endpoint: { $in: staleEndpoints } } } }
      );
    }
  } catch (error) {
    console.error('[WebPush] sendPushToUser error:', error);
  }
}
