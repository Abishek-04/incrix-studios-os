import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatChannel from '@/models/ChatChannel';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/chat/dm?userId=xxx — get or create DM channel with another user
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: 'Invalid target user' }, { status: 400 });
    }

    const targetUser = await User.findOne({ id: targetUserId }).lean();
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find existing DM channel
    const members = [user.id, targetUserId].sort();
    let channel = await ChatChannel.findOne({
      type: 'dm',
      members: { $all: members, $size: 2 }
    }).lean();

    if (!channel) {
      channel = await ChatChannel.create({
        id: `DM-${Date.now()}`,
        name: `${user.name} & ${targetUser.name}`,
        slug: `dm-${members.join('-')}`,
        type: 'dm',
        members,
        createdBy: user.id,
        isDefault: false
      });
      channel = channel.toJSON();
    }

    // Attach target user info for display
    channel.dmUser = {
      id: targetUser.id,
      name: targetUser.name,
      avatarColor: targetUser.avatarColor,
      profilePhoto: targetUser.profilePhoto,
      role: targetUser.role
    };

    return NextResponse.json({ channel });
  } catch (err) {
    console.error('[chat/dm GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
