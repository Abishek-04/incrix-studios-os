import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeletedItem from '@/models/DeletedItem';
import { v4 as uuidv4 } from 'uuid';
import { hasPermission, PERMISSIONS } from '@/config/permissions';
import { logUserAction } from '@/utils/activityLogger';
import {
  logUserUpdated,
  logProfileUpdated,
  logNotificationSettingsUpdated,
  logWhatsAppEnabled,
  logPasswordChange
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
    const { currentUser, updates: rawUpdates } = body;
    const updates = rawUpdates || {};
    const safeUpdatesForLogs = { ...updates };
    delete safeUpdatesForLogs.currentPassword;
    delete safeUpdatesForLogs.newPassword;

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
    const personalSettingsOnly = ['whatsappNumber', 'notificationPreferences', 'phoneNumber', 'name', 'avatarColor', 'profilePhoto', 'currentPassword', 'newPassword'];
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
    const user = await User.findOne({ id }).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const requestedPasswordChange = typeof updates.newPassword === 'string' && updates.newPassword.length > 0;
    if (requestedPasswordChange) {
      const isResettingOtherUser = !isEditingSelf && hasEditPermission;

      if (!isResettingOtherUser && isEditingSelf) {
        const currentPassword = updates?.currentPassword;
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: 'Current password is required' },
            { status: 400 }
          );
        }

        const isCurrentValid = await user.comparePassword(currentPassword);
        if (!isCurrentValid) {
          return NextResponse.json(
            { success: false, error: 'Current password is incorrect' },
            { status: 400 }
          );
        }
      }

      if (updates.newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      user.password = updates.newPassword;
    }

    // Update fields
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'role', 'avatarColor', 'profilePhoto', 'isActive', 'notifyViaWhatsapp', 'whatsappNumber', 'notificationPreferences'];
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
      if (updates.name || updates.phoneNumber || updates.avatarColor || updates.profilePhoto !== undefined) {
        await logProfileUpdated(currentUser, safeUpdatesForLogs);
      }
      if (requestedPasswordChange) {
        await logPasswordChange(currentUser);
      }
    } else {
      // Admin updating another user
      await logUserUpdated(
        user.toObject(),
        currentUser,
        requestedPasswordChange
          ? { ...safeUpdatesForLogs, passwordChanged: true }
          : safeUpdatesForLogs
      );
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
    const user = await User.findOne({ id });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const deletedItem = await DeletedItem.create({
      id: uuidv4(),
      entityType: 'user',
      entityId: user.id,
      source: 'users_api',
      deletedBy: currentUserRole || 'system',
      data: user.toObject(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
    });

    await User.deleteOne({ id });

    // Log activity
    const currentUser = { id: 'system', name: 'System', role: currentUserRole };
    logUserAction('deleted', user.toObject(), currentUser);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedItemId: deletedItem.id
    });
  } catch (error) {
    console.error('[API] Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
