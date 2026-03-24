import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

// PATCH /api/courses/[id] — update a course
export async function PATCH(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'manager' && user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Only managers can edit courses' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, description, thumbnail, courseTakerId, status } = body;

    const course = await Course.findOne({ id });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (name !== undefined) course.name = name;
    if (description !== undefined) course.description = description;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (status !== undefined) course.status = status;

    // If course taker changed, update the tag
    if (courseTakerId && courseTakerId !== course.courseTakerId) {
      const newTaker = await User.findOne({ id: courseTakerId }).lean();
      if (!newTaker) {
        return NextResponse.json({ success: false, error: 'Course taker not found' }, { status: 404 });
      }
      course.courseTakerId = courseTakerId;
      course.courseTakerName = newTaker.name;

      // Add tag to new taker
      await User.updateOne({ id: courseTakerId }, { $addToSet: { tags: 'course_taker' } });
    }

    await course.save();

    return NextResponse.json({ success: true, course: course.toObject() });
  } catch (error) {
    console.error('[API] Error updating course:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/courses/[id] — delete a course
export async function DELETE(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'manager' && user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Only managers can delete courses' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const course = await Course.findOneAndDelete({ id });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    console.error('[API] Error deleting course:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
