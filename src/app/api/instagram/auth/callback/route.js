import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import InstaAutomation from '@/models/InstaAutomation';
import Channel from '@/models/Channel';
import { InstagramService } from '@/services/instagramService';
import {
  exchangeCodeForAccessToken,
  exchangeForLongLivedAccessToken,
  fetchInstagramProfile,
  verifyOAuthState,
} from '@/services/instagramAuthService';

/**
 * GET /api/instagram/auth/callback
 * Handle Instagram OAuth callback — exchange code for tokens, store account
 */
export async function GET(request) {
  await connectDB();
  const reqUrl = new URL(request.url);
  const BASE_URL = `${reqUrl.protocol}//${reqUrl.host}`;
  const { searchParams } = reqUrl;
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

  // Verify CSRF state token and extract userId
  if (!state) {
    return NextResponse.redirect(`${BASE_URL}/instagram?error=missing_state`);
  }
  const studioUserId = verifyOAuthState(state);
  if (!studioUserId) {
    return NextResponse.redirect(`${BASE_URL}/instagram?error=invalid_state`);
  }

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

      // Migrate orphaned automations from any previous account with same Instagram user
      // (e.g. user disconnected then reconnected — old _id is gone, automations reference it)
      const oldAccounts = await InstaAccount.find({ instagramUserId, _id: { $ne: account._id } }).select('_id').lean();
      if (oldAccounts.length === 0) {
        // No old account docs exist, but automations might be orphaned if the doc was deleted
        // Try to find automations created by the same studio user for any accountId
        const orphaned = await InstaAutomation.find({ createdBy: studioUserId }).lean();
        const newAccountId = account._id.toString();
        const orphanedForOtherIds = orphaned.filter(a => a.accountId !== newAccountId);
        if (orphanedForOtherIds.length > 0) {
          const oldIds = [...new Set(orphanedForOtherIds.map(a => a.accountId))];
          // Check if those accountIds still exist — if not, they're orphaned
          const existingAccounts = await InstaAccount.find({ _id: { $in: oldIds } }).select('_id').lean();
          const existingIdSet = new Set(existingAccounts.map(a => a._id.toString()));
          const orphanedAccountIds = oldIds.filter(id => !existingIdSet.has(id));
          if (orphanedAccountIds.length > 0) {
            const migrated = await InstaAutomation.updateMany(
              { accountId: { $in: orphanedAccountIds } },
              { $set: { accountId: newAccountId } }
            );
            console.log(`[instagram-callback] Migrated ${migrated.modifiedCount} orphaned automations to new account`);
          }
        }
      }
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

    // Subscribe to webhook for comments (non-blocking — don't fail the connection)
    try {
      await InstagramService.subscribeToWebhook(finalTokenData.access_token);
    } catch (whErr) {
      console.error('[instagram-callback] Webhook subscription failed (non-critical):', whErr.message);
    }

    return NextResponse.redirect(`${BASE_URL}/instagram?success=true&connected=${account.username}`);
  } catch (err) {
    const details = err.response?.data || err.message;
    console.error('[instagram-callback] Exchange failed:', details);
    return NextResponse.redirect(`${BASE_URL}/instagram?error=connection_failed`);
  }
}
