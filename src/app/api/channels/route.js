import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
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

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const currentUser = await resolveUser(request, body);

    if (!isManagerUser(currentUser)) {
      return NextResponse.json({ success: false, error: 'Only managers can create channels' }, { status: 403 });
    }

    const channel = body.channel;
    if (!channel || !channel.id || !channel.platform || !channel.name || !channel.link) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const created = await Channel.create({
      id: channel.id,
      platform: channel.platform,
      name: channel.name,
      link: channel.link,
      email: channel.email || '',
      credentials: channel.credentials || '',
      memberId: channel.memberId || undefined,
      avatarUrl: channel.avatarUrl || undefined
    });

    return NextResponse.json({ success: true, channel: created });
  } catch (error) {
    console.error('[Channels] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create channel' }, { status: 500 });
  }
}
