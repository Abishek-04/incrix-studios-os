import { NextResponse } from 'next/server';
import { generateSecureToken } from '@/utils/encryption';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_OAUTH_REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';

/**
 * GET /api/instagram/auth
 * Initiate Instagram Business Login OAuth flow
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

    // Instagram Business Login scopes (must match what's in Meta dashboard)
    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_manage_comments',
    ].join(',');

    // Use Instagram API OAuth endpoint (must use Instagram App ID, not Facebook App ID)
    const oauthUrl = `https://api.instagram.com/oauth/authorize` +
      `?client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_OAUTH_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${scopes}` +
      `&state=${stateData}`;

    // Redirect to Instagram OAuth
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('[Instagram Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate Instagram OAuth' },
      { status: 500 }
    );
  }
}
