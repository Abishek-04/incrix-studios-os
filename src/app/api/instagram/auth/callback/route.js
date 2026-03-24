import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import Channel from '@/models/Channel';
import { InstagramService } from '@/services/instagramService';
import {
  exchangeCodeForAccessToken,
  exchangeForLongLivedAccessToken,
  fetchInstagramProfile,
} from '@/services/instagramAuthService';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005';

/**
 * GET /api/instagram/auth/callback
 * Handle Instagram OAuth callback — exchange code for tokens, store account
 */
export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // studio userId passed via state param

  if (error) {
    console.error('[instagram-callback] OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/instagram?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/instagram?error=missing_code`);
  }

  // state = studio userId who initiated the connection
  const studioUserId = state || '';

  try {
    console.log('[instagram-callback] Exchanging code for token...');
    const tokenData = await exchangeCodeForAccessToken(code);

    // Exchange for long-lived token (~60 days)
    let finalTokenData = tokenData;
    if (tokenData.access_token) {
      try {
        const longLivedData = await exchangeForLongLivedAccessToken(tokenData.access_token);
        finalTokenData = { ...tokenData, ...longLivedData, permissions: tokenData.permissions || [] };
        console.log('[instagram-callback] Got long-lived token');
      } catch (llError) {
        console.error('[instagram-callback] Long-lived token exchange failed:', llError.message);
      }
    }

    // Fetch Instagram profile
    const profile = finalTokenData.access_token
      ? await fetchInstagramProfile(finalTokenData.access_token)
      : null;

    if (!profile) {
      return NextResponse.redirect(`${BASE_URL}/instagram?error=profile_fetch_failed`);
    }

    console.log('[instagram-callback] Profile:', profile.username, profile.account_type);

    const instagramUserId = String(profile.user_id || '');

    // Check if this Instagram account is already connected
    let account = await InstaAccount.findOne({ instagramUserId });

    const accountPayload = {
      connectedBy: studioUserId,
      instagramUserId,
      instagramLoginId: profile.id ? String(profile.id) : '',
      instagramTokenUserId: finalTokenData.user_id ? String(finalTokenData.user_id) : '',
      username: profile.username || '',
      profilePictureUrl: profile.profile_picture_url || '',
      accountType: profile.account_type || '',
      accessToken: finalTokenData.access_token,
      tokenType: finalTokenData.token_type || 'bearer',
      tokenExpiresIn: finalTokenData.expires_in || null,
      tokenExpiresAt: finalTokenData.expires_in
        ? new Date(Date.now() + Number(finalTokenData.expires_in) * 1000).toISOString()
        : null,
      permissions: finalTokenData.permissions || [],
      connectedAt: new Date().toISOString(),
    };

    if (account) {
      // Update existing account (re-connecting refreshes the token)
      account = await InstaAccount.findByIdAndUpdate(account._id, accountPayload, { new: true });
      console.log('[instagram-callback] Updated existing account:', account.username);
    } else {
      account = await InstaAccount.create(accountPayload);
      console.log('[instagram-callback] Created new account:', account.username);
    }

    // Also create/update a Channel entry so it appears in Channels page
    const channelId = `IG-${instagramUserId}`;
    const existingChannel = await Channel.findOne({ id: channelId });
    const channelPayload = {
      id: channelId,
      platform: 'instagram',
      name: profile.username || '',
      link: `https://instagram.com/${profile.username || ''}`,
      avatarUrl: profile.profile_picture_url || '',
      email: '',
      memberId: studioUserId,
      igUserId: instagramUserId,
      igUsername: profile.username || '',
      igProfilePicUrl: profile.profile_picture_url || '',
      connectionStatus: 'connected',
    };

    if (existingChannel) {
      await Channel.findByIdAndUpdate(existingChannel._id, channelPayload);
      console.log('[instagram-callback] Updated channel:', channelId);
    } else {
      await Channel.create(channelPayload);
      console.log('[instagram-callback] Created channel:', channelId);
    }

    // Subscribe to webhook for comments
    await InstagramService.subscribeToWebhook(finalTokenData.access_token);

    return NextResponse.redirect(`${BASE_URL}/instagram?success=true&connected=${account.username}`);
  } catch (err) {
    const details = err.response?.data || err.message;
    console.error('[instagram-callback] Exchange failed:', details);
    return NextResponse.redirect(`${BASE_URL}/instagram?error=connection_failed`);
  }
}
