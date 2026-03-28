import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/instagram/accounts/[id]/sync — fetch fresh profile data from Instagram
export async function POST(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const account = await InstaAccount.findOne({ _id: id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if (!account.accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 400 });
    }

    // Fetch profile from Instagram Graph API
    const fields = 'id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website,account_type';
    const igRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=${fields}&access_token=${account.accessToken}`
    );

    if (!igRes.ok) {
      const err = await igRes.json().catch(() => ({}));
      console.error('[instagram/sync] API error:', err);
      return NextResponse.json({ error: 'Instagram API error', details: err.error?.message || 'Unknown' }, { status: 502 });
    }

    const profile = await igRes.json();

    // Update stored data
    account.username = profile.username || account.username;
    account.name = profile.name || '';
    account.biography = profile.biography || '';
    account.followerCount = profile.followers_count || 0;
    account.followsCount = profile.follows_count || 0;
    account.mediaCount = profile.media_count || 0;
    account.profilePictureUrl = profile.profile_picture_url || account.profilePictureUrl;
    account.website = profile.website || '';
    account.accountType = profile.account_type || account.accountType;
    account.lastSynced = new Date();

    await account.save();

    return NextResponse.json({
      success: true,
      profile: {
        username: account.username,
        name: account.name,
        biography: account.biography,
        followerCount: account.followerCount,
        followsCount: account.followsCount,
        mediaCount: account.mediaCount,
        profilePictureUrl: account.profilePictureUrl,
        website: account.website,
        accountType: account.accountType,
        lastSynced: account.lastSynced,
      }
    });
  } catch (err) {
    console.error('[instagram/sync POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
