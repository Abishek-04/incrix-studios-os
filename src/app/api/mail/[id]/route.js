import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Mail from '@/models/Mail';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const mail = await Mail.findOne({ id }).lean();
    if (!mail) return NextResponse.json({ error: 'Mail not found' }, { status: 404 });

    await Mail.updateOne({ id }, { $set: { [`isRead.${user.id}`]: true } });

    const thread = mail.threadId
      ? await Mail.find({ threadId: mail.threadId }).sort({ createdAt: 1 }).lean()
      : [mail];

    return NextResponse.json({ mail: { ...mail, [`isRead.${user.id}`]: true }, thread });
  } catch (err) {
    console.error('[mail/id GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const updates = {};

    if (body.isRead !== undefined) updates[`isRead.${user.id}`] = body.isRead;
    if (body.isStarred !== undefined) updates[`isStarred.${user.id}`] = body.isStarred;

    await Mail.updateOne({ id }, { $set: updates });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[mail/id PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    await Mail.updateOne({ id }, { $set: { [`isDeleted.${user.id}`]: true } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[mail/id DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
