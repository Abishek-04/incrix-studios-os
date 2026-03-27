import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import ChatChannel from '@/models/ChatChannel';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export async function GET(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id: channelId } = await params;
    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before'); // cursor for pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || PAGE_SIZE), 100);

    const query = { channelId, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    messages.reverse(); // oldest first

    // Mark messages as read by this user
    await ChatMessage.updateMany(
      { channelId, isDeleted: false, readBy: { $ne: user.id } },
      { $addToSet: { readBy: user.id } }
    );

    const hasMore = messages.length === limit;
    const oldest = messages[0]?.createdAt?.toISOString() || null;

    return NextResponse.json({ messages, hasMore, cursor: oldest });
  } catch (err) {
    console.error('[chat/messages GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id: channelId } = await params;

    // Verify channel exists
    const channel = await ChatChannel.findOne({ id: channelId }).lean();
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    // Read-only check
    if (channel.isReadOnly) {
      const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
      if (!userRoles.some(r => ['superadmin', 'manager'].includes(r))) {
        return NextResponse.json({ error: 'This channel is read-only' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { content, type = 'text', replyToId, mentions = [], fileUrl, fileName } = body;

    if (type === 'text' && !content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Fetch reply context if any
    let replyToContent = '';
    let replyToSender = '';
    if (replyToId) {
      const replyMsg = await ChatMessage.findOne({ id: replyToId }).lean();
      if (replyMsg) {
        replyToContent = replyMsg.content?.slice(0, 100) || '';
        replyToSender = replyMsg.senderName;
      }
    }

    const message = await ChatMessage.create({
      id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.profilePhoto || '',
      senderColor: user.avatarColor || 'bg-indigo-600',
      content: content?.trim() || '',
      type,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      replyToId: replyToId || null,
      replyToContent,
      replyToSender,
      mentions,
      reactions: [],
      readBy: [user.id]
    });

    // Update channel last message cache
    await ChatChannel.updateOne(
      { id: channelId },
      {
        lastMessage: content?.slice(0, 80) || (fileName || 'File'),
        lastMessageAt: new Date(),
        lastMessageBy: user.name
      }
    );

    const msgObj = message.toJSON();

    // Broadcast via Pusher (works on Vercel)
    try {
      const { getPusher } = await import('@/lib/pusher');
      const pusher = getPusher();
      await pusher.trigger(`chat-${channelId}`, 'new-message', msgObj);
    } catch (_) {}

    // Also broadcast via Socket.io if available (local dev)
    try {
      const { getIO } = await import('@/lib/socket-server');
      const io = getIO();
      io.to(`chat:${channelId}`).emit('chat:message:new', msgObj);
    } catch (_) {}

    return NextResponse.json({ message: msgObj }, { status: 201 });
  } catch (err) {
    console.error('[chat/messages POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
