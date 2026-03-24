import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import DeletedItem from '@/models/DeletedItem';
import { getAuthUser } from '@/lib/auth';
import { buildCurrentUserContext, canManageAllProjects } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

function buildContextFromUser(user) {
  return buildCurrentUserContext({
    id: user.id || String(user._id || ''),
    name: user.name || '',
    role: user.role || '',
    roles: Array.isArray(user.roles) ? user.roles : []
  });
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const channelId = decodeURIComponent(id);
    const body = await request.json();

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    if (!canManageAllProjects(currentUser)) {
      return NextResponse.json({ success: false, error: 'Only managers can update channels' }, { status: 403 });
    }

    const channel = await Channel.findOne({ id: channelId });
    if (!channel) {
      return NextResponse.json({ success: false, error: 'Channel not found' }, { status: 404 });
    }

    const updates = body.updates || {};
    const allowedFields = ['name', 'link', 'email', 'credentials', 'memberId', 'avatarUrl'];
    const sanitized = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        sanitized[key] = updates[key];
      }
    }

    const updated = await Channel.findOneAndUpdate(
      { id: channelId },
      { $set: sanitized },
      { new: true }
    );

    return NextResponse.json({ success: true, channel: updated });
  } catch (error) {
    console.error('[Channels] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update channel' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const channelId = decodeURIComponent(id);

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    if (!canManageAllProjects(currentUser)) {
      return NextResponse.json({ success: false, error: 'Only managers can delete channels' }, { status: 403 });
    }

    const channel = await Channel.findOne({ id: channelId });
    if (!channel) {
      return NextResponse.json({ success: false, error: 'Channel not found' }, { status: 404 });
    }

    const plain = channel.toObject();
    delete plain._id;
    delete plain.__v;

    const recycledItem = await DeletedItem.create({
      id: uuidv4(),
      entityType: 'channel',
      entityId: channelId,
      source: 'channels_api',
      deletedBy: authUser.name || 'system',
      data: plain,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await Channel.deleteOne({ id: channelId });

    return NextResponse.json({ success: true, deletedItemId: recycledItem.id });
  } catch (error) {
    console.error('[Channels] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete channel' }, { status: 500 });
  }
}
