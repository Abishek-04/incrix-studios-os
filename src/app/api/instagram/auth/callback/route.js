import { NextResponse } from 'next/server';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import { encrypt } from '@/utils/encryption';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_OAUTH_REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * GET /api/instagram/auth/callback
 * Handle Instagram Business Login OAuth callback
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${BASE_URL}/instagram?error=missing_parameters`);
    }

    // Decode state to get userId
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (err) {
      return NextResponse.redirect(`${BASE_URL}/instagram?error=invalid_state`);
    }

    // Step 1: Exchange code for short-lived Instagram token
    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_OAUTH_REDIRECT_URI,
        code,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const shortLivedToken = tokenResponse.data.access_token;
    const igUserId = tokenResponse.data.user_id;

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResponse = await axios.get(
      'https://graph.instagram.com/access_token',
      {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: INSTAGRAM_APP_SECRET,
          access_token: shortLivedToken,
        },
      }
    );

    const longLivedToken = longLivedResponse.data.access_token;
    const expiresIn = longLivedResponse.data.expires_in; // ~5184000 seconds (60 days)

    // Step 3: Get Instagram account details
    const profileResponse = await axios.get(
      `https://graph.instagram.com/v21.0/me`,
      {
        params: {
          fields: 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
          access_token: longLivedToken,
        },
      }
    );

    const igAccount = profileResponse.data;

    await connectDB();

    // Create or update channel
    const channelId = `ig-${igAccount.user_id || igUserId}`;
    const encryptedToken = encrypt(longLivedToken);

    await Channel.updateOne(
      { id: channelId },
      {
        $set: {
          id: channelId,
          platform: 'instagram',
          name: igAccount.name || `@${igAccount.username}`,
          link: `https://instagram.com/${igAccount.username}`,
          avatarUrl: igAccount.profile_picture_url || null,
          email: userId,
          igUserId: igAccount.user_id || igUserId,
          igUsername: igAccount.username,
          igProfilePicUrl: igAccount.profile_picture_url || null,
          accountType: igAccount.account_type,
          accessToken: encryptedToken,
          tokenExpiry: new Date(Date.now() + expiresIn * 1000),
          tokenRefreshedAt: new Date(),
          followerCount: igAccount.followers_count || 0,
          followsCount: igAccount.follows_count || 0,
          mediaCount: igAccount.media_count || 0,
          connectionStatus: 'connected',
          lastSynced: null,
          memberId: userId,
        },
      },
      { upsert: true }
    );

    // Redirect to Instagram page with success
    return NextResponse.redirect(
      `${BASE_URL}/instagram?success=true&connected=1`
    );
  } catch (error) {
    console.error('[Instagram Callback] Error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.error_message || error.message || 'connection_failed';
    return NextResponse.redirect(
      `${BASE_URL}/instagram?error=${encodeURIComponent(errorMsg)}`
    );
  }
}
