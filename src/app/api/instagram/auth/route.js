import { NextResponse } from 'next/server';
import { buildInstagramLoginUrl } from '@/services/instagramAuthService';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/instagram/auth
 * Redirect authenticated user to Instagram OAuth login
 */
export async function GET(request) {
  try {
    const decoded = await authenticate(request);
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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
