import { NextResponse } from 'next/server';
import { generateSecureToken } from '@/utils/encryption';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_OAUTH_REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';

/**
 * GET /api/instagram/auth
 * Initiate Facebook Login OAuth flow to access Instagram Graph API
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

    // Generate CSRF token and encode userId in state
    const token = generateSecureToken(32);
    const stateData = Buffer.from(JSON.stringify({ userId, token })).toString('base64');

    // Facebook Login scopes for Instagram Graph API
    const scopes = [
      'instagram_manage_comments',
      'pages_show_list',
      'pages_messaging',
    ].join(',');

    // Use Facebook OAuth endpoint
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_OAUTH_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${stateData}`;

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
