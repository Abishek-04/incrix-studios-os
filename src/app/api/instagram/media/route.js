import { NextResponse } from 'next/server';
import { getMediaForChannel } from '@/services/instagramMediaService';
// Dynamic import for queue (not available in Vercel production)

/**
 * GET /api/instagram/media?channelId=xxx&type=VIDEO&page=1&limit=20
 * Get media for a channel with filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const mediaType = searchParams.get('type');
    const automationActive = searchParams.get('automationActive');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sort = searchParams.get('sort') || '-timestamp';

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'channelId parameter required' },
        { status: 400 }
      );
    }

    const result = await getMediaForChannel(channelId, {
      mediaType,
      automationActive: automationActive === 'true' ? true : automationActive === 'false' ? false : undefined,
      startDate,
      endDate,
      page,
      limit,
      sort,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Instagram Media API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/instagram/media/sync
 * Trigger immediate sync for a channel
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { channelId } = body;

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'channelId required' },
        { status: 400 }
      );
    }

    // Check if running in production (Vercel) where background jobs are not available
    if (process.env.VERCEL === '1') {
      console.log('[Instagram Media API] Background sync not available in production');
      return NextResponse.json({
        success: true,
        message: 'Background sync not available in serverless environment. Media will sync on next API call.',
        production: true,
      });
    }

    // Queue sync job (only in development)
    try {
      const { queueFullSync } = await import('@/lib/queues/instagramSyncQueue');
      const job = await queueFullSync(channelId);

      return NextResponse.json({
        success: true,
        message: 'Sync job queued',
        jobId: job?.id,
      });
    } catch (queueError) {
      console.log('[Instagram Media API] Queue not available:', queueError.message);
      return NextResponse.json({
        success: true,
        message: 'Background sync not available. Media will sync on next API call.',
        queueAvailable: false,
      });
    }
  } catch (error) {
    console.error('[Instagram Media API] Sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to queue sync' },
      { status: 500 }
    );
  }
}
