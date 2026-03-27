import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatChannel from '@/models/ChatChannel';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_CHANNELS = [
  { name: 'General', slug: 'general', description: 'Company-wide conversations', team: 'general', emoji: '🏠', isDefault: true, type: 'channel' },
  { name: 'Announcements', slug: 'announcements', description: 'Official announcements', team: 'general', emoji: '📣', isDefault: true, type: 'announcement', isReadOnly: true },
  { name: 'Dev Team', slug: 'dev-team', description: 'Development discussions', team: 'dev', emoji: '💻', isDefault: false, type: 'channel' },
  { name: 'Content Team', slug: 'content-team', description: 'Content creation', team: 'content', emoji: '🎬', isDefault: false, type: 'channel' },
  { name: 'Design Team', slug: 'design-team', description: 'Design feedback', team: 'design', emoji: '🎨', isDefault: false, type: 'channel' },
  { name: 'Marketing', slug: 'marketing', description: 'Marketing strategy', team: 'marketing', emoji: '📈', isDefault: false, type: 'channel' },
  { name: 'Editing Team', slug: 'editing-team', description: 'Video editing', team: 'editing', emoji: '✂️', isDefault: false, type: 'channel' },
  { name: 'Hardware Team', slug: 'hardware-team', description: 'Hardware projects', team: 'hardware', emoji: '🔧', isDefault: false, type: 'channel' },
  { name: 'Classory', slug: 'classory', description: 'Classory LMS discussions', team: null, emoji: '🎓', isDefault: false, type: 'channel' },
];

const ROLE_CHANNELS = {
  superadmin: 'all',
  manager: 'all',
  creator: ['general', 'announcements', 'content-team', 'classory'],
  editor: ['general', 'announcements', 'editing-team', 'content-team'],
  designer: ['general', 'announcements', 'design-team'],
  developer: ['general', 'announcements', 'dev-team', 'classory'],
};

async function seedDefaultChannels(userId) {
  try {
    // Check ALL channel types, not just 'channel'
    const existing = await ChatChannel.find({ type: { $in: ['channel', 'announcement'] } }).lean();
    const existingSlugs = new Set(existing.map(c => c.slug));

    const toCreate = DEFAULT_CHANNELS.filter(c => !existingSlugs.has(c.slug));
    if (!toCreate.length) return;

    const now = Date.now();
    // Insert one by one to avoid bulk failure
    for (let i = 0; i < toCreate.length; i++) {
      const c = toCreate[i];
      try {
        await ChatChannel.create({
          id: `CH-${now}-${i}`,
          name: c.name,
          slug: c.slug,
          description: c.description,
          team: c.team,
          emoji: c.emoji,
          isDefault: c.isDefault,
          isReadOnly: c.isReadOnly || false,
          type: c.type,
          createdBy: userId,
          members: [],
        });
      } catch (e) {
        // Skip if already exists (duplicate slug)
        if (e.code !== 11000) console.error('Seed channel error:', c.slug, e.message);
      }
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  }
}

export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    await seedDefaultChannels(user.id);

    const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
    const isManager = userRoles.some(r => ['superadmin', 'manager'].includes(r));

    let channelQuery = { type: { $in: ['channel', 'announcement'] } };

    if (!isManager) {
      const allowedSlugs = new Set();
      for (const role of userRoles) {
        const allowed = ROLE_CHANNELS[role];
        if (allowed === 'all') { allowedSlugs.clear(); break; }
        if (Array.isArray(allowed)) allowed.forEach(s => allowedSlugs.add(s));
      }
      if (allowedSlugs.size > 0) {
        channelQuery.slug = { $in: Array.from(allowedSlugs) };
      }
    }

    const [channels, rawDms] = await Promise.all([
      ChatChannel.find(channelQuery).sort({ isDefault: -1, name: 1 }).lean(),
      ChatChannel.find({ type: 'dm', members: user.id }).sort({ lastMessageAt: -1, createdAt: -1 }).lean()
    ]);

    // Attach dmUser info for each DM
    let dms = rawDms;
    if (rawDms.length > 0) {
      const User = (await import('@/models/User')).default;
      const otherUserIds = rawDms.map(dm => dm.members?.find(m => m !== user.id)).filter(Boolean);
      const otherUsers = otherUserIds.length > 0 ? await User.find({ id: { $in: otherUserIds } }).lean() : [];
      const userMap = Object.fromEntries(otherUsers.map(u => [u.id, u]));

      dms = rawDms.map(dm => {
        const otherId = dm.members?.find(m => m !== user.id) || dm.members?.[0];
        const otherUser = userMap[otherId];
        if (otherUser) {
          dm.dmUser = { id: otherUser.id, name: otherUser.name, avatarColor: otherUser.avatarColor, profilePhoto: otherUser.profilePhoto || '', role: otherUser.role };
        }
        return dm;
      });
    }

    return NextResponse.json({ channels, dms });
  } catch (err) {
    console.error('[chat/channels GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
    if (!userRoles.some(r => ['superadmin', 'manager'].includes(r))) {
      return NextResponse.json({ error: 'Only managers can create channels' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, description, team, emoji } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Channel name required' }, { status: 400 });

    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const exists = await ChatChannel.findOne({ slug }).lean();
    if (exists) return NextResponse.json({ error: 'Channel already exists' }, { status: 409 });

    const channel = await ChatChannel.create({
      id: `CH-${Date.now()}`,
      name: name.trim(),
      slug,
      description: description || '',
      team: team || null,
      emoji: emoji || '#',
      type: 'channel',
      createdBy: user.id,
      isDefault: false
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (err) {
    console.error('[chat/channels POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
