import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import DeletedItem from '@/models/DeletedItem';
import User from '@/models/User';
import { buildCurrentUserContext, normalizeRole } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = new Set(['manager', 'superadmin']);

async function resolveUser(request, body = null) {
  const raw = body?.currentUser || {};
  const id = String(raw.id || raw._id || '').trim();
  const name = String(raw.name || '').trim();

  if (!id && !name) return buildCurrentUserContext({});

  let user = null;
  if (id) user = await User.findOne({ id }).select('id name role roles');
  if (!user && name) {
    user = await User.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    }).select('id name role roles');
  }
  if (!user) return buildCurrentUserContext({});

  return buildCurrentUserContext({
    id: user.id || String(user._id || ''),
    name: user.name || '',
    role: user.role || '',
    roles: Array.isArray(user.roles) ? user.roles : []
  });
}

function isManagerUser(currentUser) {
  const primary = normalizeRole(currentUser?.role);
  if (primary) return MANAGER_ROLES.has(primary);
  return (currentUser?.roles || []).some(r => MANAGER_ROLES.has(normalizeRole(r)));
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const channelId = decodeURIComponent(id);
    const body = await request.json();
    const currentUser = await resolveUser(request, body);

    if (!isManagerUser(currentUser)) {
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
    const currentUser = await resolveUser(request, body);

    if (!isManagerUser(currentUser)) {
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
