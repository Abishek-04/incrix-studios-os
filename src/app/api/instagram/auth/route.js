import { NextResponse } from 'next/server';
import { generateSecureToken } from '@/utils/encryption';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_OAUTH_REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';

/**
 * GET /api/instagram/auth
 * Initiate Instagram OAuth flow
 */
export async function GET(request) {
  try {
    if (!INSTAGRAM_APP_ID) {
      return NextResponse.json(
        { success: false, error: 'Instagram API not configured' },
        { status: 500 }
      );
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Generate CSRF token
    const state = generateSecureToken(32);

    // Store state in a temporary way (in production, use Redis)
    // For now, we'll encode userId in the state
    const stateData = Buffer.from(JSON.stringify({ userId, token: state })).toString('base64');

    // Build Facebook OAuth URL
    const scopes = [
      'instagram_basic',
      'instagram_manage_comments',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_manage_metadata',
      'pages_messaging',
      'pages_read_engagement',
    ].join(',');

    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_OAUTH_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${stateData}` +
      `&response_type=code`;

    // Redirect to Facebook OAuth
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('[Instagram Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate Instagram OAuth' },
      { status: 500 }
    );
  }
}
