import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET /api/courses — list all courses
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const courses = await Course.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error('[API] Error fetching courses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/courses — create a course
export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers can create courses
    if (user.role !== 'manager' && user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Only managers can create courses' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, description, thumbnail, courseTakerId } = body;

    if (!name || !courseTakerId) {
      return NextResponse.json({ success: false, error: 'Name and course taker are required' }, { status: 400 });
    }

    // Look up course taker
    const courseTaker = await User.findOne({ id: courseTakerId }).lean();
    if (!courseTaker) {
      return NextResponse.json({ success: false, error: 'Course taker not found' }, { status: 404 });
    }

    const course = await Course.create({
      id: `CRS-${uuidv4().slice(0, 8)}`,
      name,
      description: description || '',
      thumbnail: thumbnail || '',
      courseTakerId,
      courseTakerName: courseTaker.name,
      createdBy: user.id,
    });

    // Add course_taker tag to user if not already present
    await User.updateOne(
      { id: courseTakerId },
      { $addToSet: { tags: 'course_taker' } }
    );

    return NextResponse.json({ success: true, course: course.toObject() }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating course:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
