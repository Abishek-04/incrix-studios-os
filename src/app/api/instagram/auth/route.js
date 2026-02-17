import { NextResponse } from 'next/server';
import { generateSecureToken } from '@/utils/encryption';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
const REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';

/**
 * GET /api/instagram/auth
 * Initiate Facebook Login OAuth flow to get Page Access Token for Instagram messaging
 */
export async function GET(request) {
  try {
    if (!FACEBOOK_APP_ID) {
      return NextResponse.json(
        { success: false, error: 'Facebook App not configured' },
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

    // Facebook Login scopes for Instagram messaging + page management
    const scopes = [
      'pages_show_list',
      'pages_messaging',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_manage_comments',
      'instagram_manage_messages',
    ].join(',');

    // Use Facebook Login OAuth (not Instagram Login) to get Page tokens
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth` +
      `?client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${scopes}` +
      `&state=${stateData}`;

    // Redirect to Facebook OAuth
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('[Instagram Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}
