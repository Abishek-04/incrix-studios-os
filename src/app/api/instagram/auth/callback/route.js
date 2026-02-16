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
 * Handle Facebook Login OAuth callback and discover linked Instagram Business Account
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

    // Step 1: Exchange code for short-lived Facebook token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v21.0/oauth/access_token',
      {
        params: {
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          redirect_uri: INSTAGRAM_OAUTH_REDIRECT_URI,
          code,
        },
      }
    );

    const shortLivedToken = tokenResponse.data.access_token;

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResponse = await axios.get(
      'https://graph.facebook.com/v21.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const longLivedToken = longLivedResponse.data.access_token;
    const expiresIn = longLivedResponse.data.expires_in; // ~5184000 seconds (60 days)

    // Step 3: Get user's Facebook Pages
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v21.0/me/accounts',
      {
        params: {
          access_token: longLivedToken,
        },
      }
    );

    const pages = pagesResponse.data.data;

    if (!pages || pages.length === 0) {
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent('No Facebook Pages found. Your Instagram Business/Creator account must be linked to a Facebook Page.')}`
      );
    }

    // Step 4: Find the Instagram Business Account linked to a page
    let igAccount = null;
    let pageAccessToken = null;

    for (const page of pages) {
      try {
        const igResponse = await axios.get(
          `https://graph.facebook.com/v21.0/${page.id}`,
          {
            params: {
              fields: 'instagram_business_account',
              access_token: page.access_token,
            },
          }
        );

        if (igResponse.data.instagram_business_account) {
          // Found the linked Instagram account — get its details
          const igUserId = igResponse.data.instagram_business_account.id;
          pageAccessToken = page.access_token;

          const profileResponse = await axios.get(
            `https://graph.facebook.com/v21.0/${igUserId}`,
            {
              params: {
                fields: 'id,name,username,profile_picture_url,followers_count,follows_count,media_count',
                access_token: page.access_token,
              },
            }
          );

          igAccount = profileResponse.data;
          break;
        }
      } catch (err) {
        console.error(`[Instagram Callback] Error checking page ${page.id}:`, err.message);
        continue;
      }
    }

    if (!igAccount) {
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent('No Instagram Business/Creator account found linked to your Facebook Pages. Please connect your Instagram account to a Facebook Page first.')}`
      );
    }

    await connectDB();

    // Step 5: Encrypt & store in database
    const channelId = `ig-${igAccount.id}`;
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
          igUserId: igAccount.id,
          igUsername: igAccount.username,
          igProfilePicUrl: igAccount.profile_picture_url || null,
          accountType: 'BUSINESS',
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
