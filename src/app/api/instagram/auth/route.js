import { NextResponse } from 'next/server';
import { buildInstagramLoginUrl } from '@/services/instagramAuthService';

/**
 * GET /api/instagram/auth?userId=xxx
 * Redirect user to Instagram OAuth login
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const loginUrl = buildInstagramLoginUrl(userId);
    console.log('[instagram-auth] Redirecting to Instagram OAuth');
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('[instagram-auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}
