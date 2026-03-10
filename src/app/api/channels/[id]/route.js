import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import DeletedItem from '@/models/DeletedItem';
import { buildCurrentUserContext, canManageAllProjects } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const channelId = decodeURIComponent(id);
    const body = await request.json();
    const currentUser = buildCurrentUserContext(body.currentUser || {});

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
    const body = await request.json().catch(() => ({}));
    const currentUser = buildCurrentUserContext(body.currentUser || {});

    if (!canManageAllProjects(currentUser)) {
      return NextResponse.json({ success: false, error: 'Only managers can delete channels' }, { status: 403 });
    }

    const channel = await Channel.findOne({ id: channelId });
    if (!channel) {
      return NextResponse.json({ success: false, error: 'Channel not found' }, { status: 404 });
    }

    // Add to recycle bin
    const plain = channel.toObject();
    delete plain._id;
    delete plain.__v;

    const recycledItem = await DeletedItem.create({
      id: uuidv4(),
      entityType: 'channel',
      entityId: channelId,
      source: 'channels_api',
      deletedBy: currentUser.name || 'system',
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
