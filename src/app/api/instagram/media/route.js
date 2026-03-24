import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import { InstagramService } from '@/services/instagramService';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/instagram/media?accountId=xxx
 * Fetch media for an Instagram account directly from Instagram Graph API
 */
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    await connectDB();
    const account = await InstaAccount.findById(accountId).lean();
    if (!account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    const media = await InstagramService.getAccountMedia(account);
    return NextResponse.json({ success: true, media });
  } catch (error) {
    if (error.status === 401 || error.code === 'INSTAGRAM_AUTH_EXPIRED') {
      return NextResponse.json({
        success: false,
        error: 'Instagram session expired. Please reconnect.',
        code: 'INSTAGRAM_AUTH_EXPIRED',
      }, { status: 401 });
    }
    console.error('[instagram-media] Failed:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load Instagram media' }, { status: 500 });
  }
}
