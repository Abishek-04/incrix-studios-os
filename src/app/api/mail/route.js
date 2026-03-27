import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Mail from '@/models/Mail';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'inbox';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 30;

    // Use the custom string `id` field (not MongoDB _id)
    const uid = user.id;
    let query = {};
    if (folder === 'inbox') {
      // Mails where I'm a recipient but NOT the sender
      query = { to: uid, from: { $ne: uid }, [`isDeleted.${uid}`]: { $ne: true } };
    } else if (folder === 'sent') {
      // Mails where I'm the sender (regardless of who's in `to`)
      query = { from: uid, [`isDeleted.${uid}`]: { $ne: true } };
    } else if (folder === 'starred') {
      query = { $or: [{ to: uid }, { from: uid }], [`isStarred.${uid}`]: true, [`isDeleted.${uid}`]: { $ne: true } };
    }

    const [mails, total] = await Promise.all([
      Mail.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Mail.countDocuments(query),
    ]);

    const unread = await Mail.countDocuments({ to: uid, from: { $ne: uid }, [`isRead.${uid}`]: { $ne: true }, [`isDeleted.${uid}`]: { $ne: true } });

    return NextResponse.json({ mails, total, unread, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[mail GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const { to, subject, body: mailBody, attachments = [], replyToId } = body;

    if (!to?.length || !subject?.trim()) {
      return NextResponse.json({ error: 'Recipients and subject are required' }, { status: 400 });
    }

    const recipients = await User.find({ id: { $in: to } }).lean();
    const toNames = recipients.map(r => r.name);

    let threadId = `THREAD-${Date.now()}`;
    if (replyToId) {
      const original = await Mail.findOne({ id: replyToId }).lean();
      if (original) threadId = original.threadId || original.id;
    }

    const mail = await Mail.create({
      id: `MAIL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: user.id,
      fromName: user.name,
      fromAvatar: user.profilePhoto || '',
      fromColor: user.avatarColor || 'bg-indigo-500',
      to,
      toNames,
      subject: subject.trim(),
      body: mailBody || '',
      attachments,
      replyToId: replyToId || null,
      threadId,
      isRead: { [user.id]: true },
    });

    return NextResponse.json({ mail: mail.toJSON() }, { status: 201 });
  } catch (err) {
    console.error('[mail POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
