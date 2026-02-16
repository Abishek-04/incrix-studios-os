import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import { encrypt } from '@/utils/encryption';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_OAUTH_REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';

/**
 * GET /api/instagram/auth/callback
 * Handle Instagram OAuth callback
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
        `/instagram?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect('/instagram?error=missing_parameters');
    }

    // Decode state to get userId
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (err) {
      return NextResponse.redirect('/instagram?error=invalid_state');
    }

    // Exchange code for short-lived token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v21.0/oauth/access_token`,
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

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedResponse = await axios.get(
      `https://graph.facebook.com/v21.0/oauth/access_token`,
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

    // Get user's Facebook pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v21.0/me/accounts`,
      {
        params: {
          access_token: longLivedToken,
        },
      }
    );

    const pages = pagesResponse.data.data;

    if (!pages || pages.length === 0) {
      return NextResponse.redirect('/instagram?error=no_pages_found');
    }

    await connectDB();

    const connectedAccounts = [];

    // For each page, get the connected Instagram Business Account
    for (const page of pages) {
      try {
        const igAccountResponse = await axios.get(
          `https://graph.facebook.com/v21.0/${page.id}`,
          {
            params: {
              fields: 'instagram_business_account',
              access_token: page.access_token,
            },
          }
        );

        const igBusinessAccountId = igAccountResponse.data.instagram_business_account?.id;

        if (!igBusinessAccountId) {
          continue; // Skip pages without Instagram
        }

        // Get Instagram account details
        const igDetailsResponse = await axios.get(
          `https://graph.facebook.com/v21.0/${igBusinessAccountId}`,
          {
            params: {
              fields: 'id,username,profile_picture_url,followers_count,media_count',
              access_token: page.access_token,
            },
          }
        );

        const igAccount = igDetailsResponse.data;

        // Create or update channel
        const channelId = `ig-${igAccount.id}`;
        const encryptedToken = encrypt(page.access_token);

        await Channel.updateOne(
          { id: channelId },
          {
            $set: {
              id: channelId,
              platform: 'instagram',
              name: `@${igAccount.username}`,
              link: `https://instagram.com/${igAccount.username}`,
              avatarUrl: igAccount.profile_picture_url,
              email: userId, // Store user ID who connected it
              igUserId: igAccount.id,
              igUsername: igAccount.username,
              igProfilePicUrl: igAccount.profile_picture_url,
              fbPageId: page.id,
              fbPageName: page.name,
              accessToken: encryptedToken,
              tokenExpiry: new Date(Date.now() + expiresIn * 1000),
              tokenRefreshedAt: new Date(),
              followerCount: igAccount.followers_count,
              mediaCount: igAccount.media_count,
              connectionStatus: 'connected',
              lastSynced: null,
              memberId: userId,
            },
          },
          { upsert: true }
        );

        connectedAccounts.push({
          username: igAccount.username,
          followers: igAccount.followers_count,
        });
      } catch (pageError) {
        console.error('[Instagram Callback] Error processing page:', pageError);
      }
    }

    if (connectedAccounts.length === 0) {
      return NextResponse.redirect('/instagram?error=no_instagram_accounts');
    }

    // Redirect to Instagram page with success
    return NextResponse.redirect(
      `/instagram?success=true&connected=${connectedAccounts.length}`
    );
  } catch (error) {
    console.error('[Instagram Callback] Error:', error);
    return NextResponse.redirect(
      `/instagram?error=${encodeURIComponent(error.message || 'connection_failed')}`
    );
  }
}
