import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatChannel from '@/models/ChatChannel';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Default channels seeded on first access
const DEFAULT_CHANNELS = [
  { name: 'General', slug: 'general', description: 'Company-wide conversations', team: 'general', emoji: '🏠', isDefault: true },
  { name: 'Announcements', slug: 'announcements', description: 'Official announcements from management', team: 'general', emoji: '📣', isDefault: true, isReadOnly: true },
  { name: 'Dev Team', slug: 'dev-team', description: 'Development team discussions', team: 'dev', emoji: '💻', isDefault: false },
  { name: 'Content Team', slug: 'content-team', description: 'Content creation & production', team: 'content', emoji: '🎬', isDefault: false },
  { name: 'Design Team', slug: 'design-team', description: 'Design discussions and feedback', team: 'design', emoji: '🎨', isDefault: false },
  { name: 'Marketing', slug: 'marketing', description: 'Marketing campaigns and strategy', team: 'marketing', emoji: '📈', isDefault: false },
  { name: 'Editing Team', slug: 'editing-team', description: 'Video editing and post-production', team: 'editing', emoji: '✂️', isDefault: false },
  { name: 'Hardware Team', slug: 'hardware-team', description: 'Custom hardware and microcontroller projects', team: 'hardware', emoji: '🔧', isDefault: false },
  { name: 'Classory', slug: 'classory', description: 'Classory LMS product discussions', team: null, emoji: '🎓', isDefault: false },
];

// Which channels each role can see
const ROLE_CHANNELS = {
  superadmin: 'all',
  manager: 'all',
  creator: ['general', 'announcements', 'content-team', 'classory'],
  editor: ['general', 'announcements', 'editing-team', 'content-team'],
  designer: ['general', 'announcements', 'design-team'],
  developer: ['general', 'announcements', 'dev-team', 'classory'],
};

async function seedDefaultChannels(systemUserId) {
  const existing = await ChatChannel.find({ type: 'channel' }).lean();
  const existingSlugs = new Set(existing.map(c => c.slug));

  const toCreate = DEFAULT_CHANNELS.filter(c => !existingSlugs.has(c.slug));
  if (!toCreate.length) return;

  const now = Date.now();
  await ChatChannel.insertMany(
    toCreate.map((c, i) => ({
      id: `CH-${now}-${i}`,
      type: c.isReadOnly ? 'announcement' : 'channel',
      createdBy: systemUserId,
      ...c
    }))
  );
}

export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    await seedDefaultChannels(user.id);

    const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
    const isManager = userRoles.some(r => ['superadmin', 'manager'].includes(r));

    // Get team channels visible to this user
    let channelQuery = { type: { $in: ['channel', 'announcement'] } };

    if (!isManager) {
      // Get allowed slugs from all user roles
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

    const [channels, dms] = await Promise.all([
      ChatChannel.find(channelQuery).sort({ isDefault: -1, name: 1 }).lean(),
      ChatChannel.find({ type: 'dm', members: user.id }).sort({ lastMessageAt: -1 }).lean()
    ]);

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
