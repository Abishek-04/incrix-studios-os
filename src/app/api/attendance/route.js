import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');
    const month = searchParams.get('month'); // YYYY-MM

    const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
    const isManager = userRoles.some(r => ['superadmin', 'manager'].includes(r));

    let query = {};

    if (date) {
      // Get all attendance for a specific date
      query.date = date;
      if (!isManager) query.userId = user.id;
    } else if (userId && month) {
      // Get a user's attendance for a month
      if (!isManager && userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const [y, m] = month.split('-');
      const startDate = `${y}-${m}-01`;
      const endDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      const endDate = `${y}-${m}-${String(endDay).padStart(2, '0')}`;
      query = { userId, date: { $gte: startDate, $lte: endDate } };
    } else if (month) {
      // Get all attendance for a month (managers only)
      if (!isManager) query.userId = user.id;
      const [y, m] = month.split('-');
      const startDate = `${y}-${m}-01`;
      const endDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      const endDate = `${y}-${m}-${String(endDay).padStart(2, '0')}`;
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default: today for self
      const today = new Date().toISOString().split('T')[0];
      query = { date: today, userId: user.id };
    }

    const records = await Attendance.find(query).sort({ date: 1, userName: 1 }).lean();
    return NextResponse.json({ records });
  } catch (err) {
    console.error('[attendance GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const { date, status, notes } = body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!['office', 'wfh', 'leave', 'half_day'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if already checked in for this date
    const existing = await Attendance.findOne({ userId: user.id, date: targetDate });
    if (existing) {
      // Update existing
      existing.status = status;
      existing.notes = notes || existing.notes;
      if (!existing.checkInTime && status !== 'leave') existing.checkInTime = new Date();
      await existing.save();
      return NextResponse.json({ record: existing.toJSON() });
    }

    const record = await Attendance.create({
      id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      date: targetDate,
      userId: user.id,
      userName: user.name,
      status,
      checkInTime: status !== 'leave' ? new Date() : null,
      notes: notes || '',
    });

    return NextResponse.json({ record: record.toJSON() }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Already checked in for this date' }, { status: 409 });
    }
    console.error('[attendance POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
