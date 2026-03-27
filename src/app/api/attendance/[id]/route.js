import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const record = await Attendance.findOne({ id });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (record.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (body.checkOutTime) record.checkOutTime = new Date();
    if (body.status) record.status = body.status;
    if (body.notes !== undefined) record.notes = body.notes;
    await record.save();

    return NextResponse.json({ record: record.toJSON() });
  } catch (err) {
    console.error('[attendance PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
