import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Page from '@/models/Page';

// GET /api/pages/[id] - Get single page with all blocks
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const page = await Page.findOne({ id, deleted: false });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      page
    });

  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PATCH /api/pages/[id] - Update page metadata
export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();
    const { id } = params;

    const updates = {
      ...body,
      updatedAt: Date.now()
    };

    // Add to editors list if not already there
    if (body.editedBy) {
      updates.$addToSet = {
        editors: {
          userId: body.editedBy,
          userName: body.editedByName,
          lastEditedAt: Date.now()
        }
      };
    }

    const page = await Page.findOneAndUpdate(
      { id, deleted: false },
      updates,
      { new: true }
    );

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      page
    });

  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[id] - Soft delete page
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const page = await Page.findOneAndUpdate(
      { id },
      {
        deleted: true,
        deletedAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
