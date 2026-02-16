import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/config/permissions';
import { logUserAction } from '@/utils/activityLogger';
import {
  logUserUpdated,
  logProfileUpdated,
  logNotificationSettingsUpdated,
  logWhatsAppEnabled
} from '@/lib/services/activityLogger';

/**
 * GET /api/users/[id]
 * Get a specific user
 */
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const user = await User.findOne({ id }).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user.toObject()
    });
  } catch (error) {
    console.error('[API] Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { currentUser, updates } = body;

    // Permission check: Users can edit themselves, or need EDIT_USERS permission to edit others
    const isEditingSelf = currentUser && currentUser.id === id;
    const hasEditPermission = currentUser && hasPermission(currentUser.role, PERMISSIONS.EDIT_USERS);

    if (!currentUser || (!isEditingSelf && !hasEditPermission)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If editing self, restrict to only personal settings
    const personalSettingsOnly = ['whatsappNumber', 'notificationPreferences', 'phoneNumber', 'name', 'avatarColor'];
    if (isEditingSelf && !hasEditPermission) {
      // Check if trying to update restricted fields
      const restrictedFields = Object.keys(updates).filter(key => !personalSettingsOnly.includes(key));
      if (restrictedFields.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot modify restricted fields' },
          { status: 403 }
        );
      }
    }

    // Find user
    const user = await User.findOne({ id });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'role', 'avatarColor', 'isActive', 'notifyViaWhatsapp', 'whatsappNumber', 'notificationPreferences'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        user[key] = updates[key];
      }
    });

    user.updatedAt = Date.now();
    await user.save();

    // Log activity (legacy)
    const actionType = updates.role ? 'role_changed' :
                       updates.isActive !== undefined ? (updates.isActive ? 'activated' : 'deactivated') :
                       'updated';
    logUserAction(actionType, user.toObject(), currentUser);

    // Enhanced activity logging
    if (isEditingSelf) {
      // User updating their own profile
      if (updates.notificationPreferences) {
        await logNotificationSettingsUpdated(currentUser, updates.notificationPreferences);
      }
      if (updates.whatsappNumber && updates.notificationPreferences?.whatsapp?.enabled) {
        await logWhatsAppEnabled(currentUser, updates.whatsappNumber);
      }
      if (updates.name || updates.phoneNumber || updates.avatarColor) {
        await logProfileUpdated(currentUser, updates);
      }
    } else {
      // Admin updating another user
      await logUserUpdated(user.toObject(), currentUser, updates);
    }

    return NextResponse.json({
      success: true,
      user: user.toObject()
    });
  } catch (error) {
    console.error('[API] Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (Super Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const currentUserRole = searchParams.get('role');

    // Permission check
    if (!hasPermission(currentUserRole, PERMISSIONS.DELETE_USERS)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Find and delete user
    const user = await User.findOneAndDelete({ id });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Log activity
    const currentUser = { id: 'system', name: 'System', role: currentUserRole };
    logUserAction('deleted', user.toObject(), currentUser);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
