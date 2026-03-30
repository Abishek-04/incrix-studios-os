import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import { InstagramService } from '@/services/instagramService';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/instagram/comments?accountId=xxx&mediaId=yyy
 * Fetch comments for a specific media item
 */
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const mediaId = searchParams.get('mediaId');

    if (!accountId || !mediaId) {
      return NextResponse.json({ success: false, error: 'accountId and mediaId required' }, { status: 400 });
    }

    await connectDB();
    const account = await InstaAccount.findById(accountId).lean();
    if (!account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    const comments = await InstagramService.getComments(mediaId, account);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('[instagram-comments] Failed:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load comments' }, { status: 500 });
  }
}
