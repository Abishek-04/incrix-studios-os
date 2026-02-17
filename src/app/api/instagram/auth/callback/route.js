import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import { encrypt } from '@/utils/encryption';
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getUserPages,
  getInstagramAccountForPage,
  getInstagramProfile,
  subscribePageToWebhooks,
  getGrantedPermissions,
  getMe,
} from '@/services/facebookGraphService';

const REDIRECT_URI = process.env.INSTAGRAM_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/instagram/auth/callback';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * GET /api/instagram/auth/callback
 * Handle Facebook Login OAuth callback — exchange code for tokens, find linked Instagram account
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');

    // Check for OAuth errors
    if (error) {
      const errorMsg = errorReason || error;
      console.error('[Instagram Callback] OAuth error:', errorMsg);
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent(errorMsg)}`
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

    if (!userId) {
      return NextResponse.redirect(`${BASE_URL}/instagram?error=invalid_state`);
    }

    // Step 1: Exchange code for short-lived User Token
    console.log('[Instagram Callback] Exchanging code for token...');
    const shortLivedResult = await exchangeCodeForToken(code, REDIRECT_URI);
    const shortLivedToken = shortLivedResult.accessToken;

    // Step 2: Exchange for long-lived User Token (~60 days)
    console.log('[Instagram Callback] Exchanging for long-lived token...');
    const longLivedResult = await exchangeForLongLivedToken(shortLivedToken);
    const longLivedUserToken = longLivedResult.accessToken;
    const userTokenExpiresIn = longLivedResult.expiresIn || 5184000; // ~60 days

    // Step 3: Debug — check what permissions were actually granted
    console.log('[Instagram Callback] Checking granted permissions...');
    let grantedPerms = [];
    let meInfo = {};
    try {
      [grantedPerms, meInfo] = await Promise.all([
        getGrantedPermissions(longLivedUserToken),
        getMe(longLivedUserToken),
      ]);
      console.log('[Instagram Callback] User:', meInfo.name, meInfo.id);
      console.log('[Instagram Callback] Permissions:', JSON.stringify(grantedPerms));
    } catch (permErr) {
      console.error('[Instagram Callback] Permission check failed:', permErr.response?.data || permErr.message);
    }

    const grantedNames = grantedPerms
      .filter(p => p.status === 'granted')
      .map(p => p.permission);

    if (!grantedNames.includes('pages_show_list')) {
      const allPerms = grantedPerms.map(p => `${p.permission}:${p.status}`).join(', ');
      console.error('[Instagram Callback] pages_show_list not granted. All perms:', allPerms);
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent('permissions_missing: pages_show_list not granted. Granted: ' + (allPerms || 'none'))}`
      );
    }

    // Step 4: Get user's Facebook Pages (includes Page Access Tokens)
    console.log('[Instagram Callback] Fetching user pages...');
    let pages;
    try {
      pages = await getUserPages(longLivedUserToken);
      console.log(`[Instagram Callback] Found ${pages?.length || 0} pages:`, pages?.map(p => p.name));
    } catch (pageErr) {
      console.error('[Instagram Callback] Failed to fetch pages:', pageErr.response?.data || pageErr.message);
      const detail = pageErr.response?.data?.error?.message || pageErr.message;
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent('pages_fetch_failed: ' + detail)}`
      );
    }

    if (!pages || pages.length === 0) {
      console.error('[Instagram Callback] No Facebook Pages found for user', meInfo.name);
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=${encodeURIComponent('no_pages_found: Logged in as ' + (meInfo.name || 'unknown') + ' (ID: ' + (meInfo.id || '?') + '). Permissions: ' + grantedNames.join(', '))}`
      );
    }

    // Step 4: Find a Page with a linked Instagram Business Account
    let selectedPage = null;
    let igAccount = null;

    for (const page of pages) {
      try {
        console.log(`[Instagram Callback] Checking page "${page.name}" (${page.id}) for IG account...`);
        const igBizAccount = await getInstagramAccountForPage(page.id, page.access_token);
        if (igBizAccount) {
          selectedPage = page;
          igAccount = igBizAccount;
          console.log(`[Instagram Callback] Found IG account on page "${page.name}":`, igBizAccount.username || igBizAccount.id);
          break;
        }
      } catch (err) {
        console.warn(`[Instagram Callback] Could not check page ${page.name} (${page.id}):`, err.response?.data || err.message);
        continue;
      }
    }

    if (!selectedPage || !igAccount) {
      const pageNames = pages.map(p => p.name).join(', ');
      console.error(`[Instagram Callback] No IG Business Account found. Pages checked: ${pageNames}`);
      return NextResponse.redirect(
        `${BASE_URL}/instagram?error=no_instagram_account`
      );
    }

    const pageAccessToken = selectedPage.access_token;
    const pageId = selectedPage.id;
    const pageName = selectedPage.name;

    // Step 5: Get full Instagram profile details
    console.log(`[Instagram Callback] Found IG account ${igAccount.username || igAccount.id} on page ${pageName}`);
    let igProfile;
    try {
      igProfile = await getInstagramProfile(igAccount.id, pageAccessToken);
    } catch (err) {
      console.warn('[Instagram Callback] Could not fetch full profile, using partial data:', err.message);
      igProfile = igAccount;
    }

    // Step 6: Subscribe Page to webhooks for comment/messaging events
    try {
      await subscribePageToWebhooks(pageId, pageAccessToken);
      console.log(`[Instagram Callback] Page ${pageName} subscribed to webhooks`);
    } catch (err) {
      console.warn('[Instagram Callback] Webhook subscription failed (non-fatal):', err.message);
    }

    // Step 7: Store everything in the Channel document
    await connectDB();

    const channelId = `ig-${igProfile.ig_id || igProfile.id}`;
    const encryptedPageToken = encrypt(pageAccessToken);
    const encryptedUserToken = encrypt(longLivedUserToken);

    await Channel.updateOne(
      { id: channelId },
      {
        $set: {
          id: channelId,
          platform: 'instagram',
          name: igProfile.name || `@${igProfile.username}`,
          link: `https://instagram.com/${igProfile.username}`,
          avatarUrl: igProfile.profile_picture_url || null,
          email: userId,
          memberId: userId,

          // Instagram identifiers
          igUserId: igProfile.ig_id || igProfile.id,
          igUsername: igProfile.username,
          igProfilePicUrl: igProfile.profile_picture_url || null,
          igBusinessAccountId: igProfile.id,

          // Facebook Page
          fbPageId: pageId,
          fbPageName: pageName,

          // Tokens (both encrypted)
          accessToken: encryptedPageToken, // Page Token (backward compat field)
          fbPageAccessToken: encryptedPageToken, // Page Token (new field)
          userAccessToken: encryptedUserToken, // User Token for refreshing
          tokenExpiry: new Date(Date.now() + userTokenExpiresIn * 1000),
          userTokenExpiry: new Date(Date.now() + userTokenExpiresIn * 1000),
          tokenRefreshedAt: new Date(),

          // Stats
          followerCount: igProfile.followers_count || 0,
          followsCount: igProfile.follows_count || 0,
          mediaCount: igProfile.media_count || 0,

          // Status
          connectionStatus: 'connected',
          lastSynced: null,
        },
      },
      { upsert: true }
    );

    console.log(`[Instagram Callback] Channel ${channelId} created/updated for @${igProfile.username}`);

    // Redirect to Instagram page with success
    return NextResponse.redirect(
      `${BASE_URL}/instagram?success=true&connected=1`
    );
  } catch (error) {
    console.error('[Instagram Callback] Error:', error.response?.data || error.message);

    let errorMsg = 'connection_failed';

    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      errorMsg = fbError.message || fbError.error_user_msg || errorMsg;

      // Map common Facebook API error codes to readable messages
      if (fbError.code === 190) {
        errorMsg = 'token_expired';
      } else if (fbError.code === 10) {
        errorMsg = 'permissions_error';
      } else if (fbError.code === 100) {
        errorMsg = 'invalid_parameter';
      }
    }

    return NextResponse.redirect(
      `${BASE_URL}/instagram?error=${encodeURIComponent(errorMsg)}`
    );
  }
}
