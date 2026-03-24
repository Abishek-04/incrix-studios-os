'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/admin/UserManagement';
import { RoleGuard } from '@/components/common/PermissionGuard';
import { ROLES } from '@/config/permissions';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useToast } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';

export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const showToast = useToast();

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth('/api/users?all=1');
        const data = await response.json();

        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.error || 'Failed to load users');
        }
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // CRUD handlers
  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetchWithAuth(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ updates })
      });

      const data = await response.json();
      if (data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            (u.id || u._id) === userId ? data.user : u
          )
        );
        if ((currentUser?.id || currentUser?._id) === userId) {
          // User data will be refreshed via AuthContext
        }
      } else {
        console.error('Update failed:', data.error);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteUser = async (userOrId) => {
    const targetUser =
      typeof userOrId === 'string'
        ? users.find((u) => (u.id || u._id) === userOrId)
        : userOrId;
    const userId = targetUser?.id || targetUser?._id || userOrId;
    const deletedUser = targetUser || users.find((u) => (u.id || u._id) === userId);
    try {
      const response = await fetchWithAuth(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.filter((u) => (u.id || u._id) !== userId)
        );
        if (data.deletedItemId && deletedUser) {
          setUndoDelete({
            deletedItemId: data.deletedItemId,
            user: deletedUser,
            message: `Deleted "${deletedUser.name}"`
          });
        }
      } else {
        const message = data.error || `Delete failed (HTTP ${response.status})`;
        console.error('Delete failed:', message);
        showToast(message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await fetchWithAuth('/api/users', {
        method: 'POST',
        body: JSON.stringify({ userData })
      });

      const data = await response.json();
      if (data.success) {
        const createdUser = {
          ...data.user,
          id: data.user?.id || String(data.user?._id || '')
        };
        setUsers((prevUsers) => {
          const existingIndex = prevUsers.findIndex(
            (u) => (u.id || u._id) === (createdUser.id || createdUser._id)
          );
          if (existingIndex >= 0) {
            const updated = [...prevUsers];
            updated[existingIndex] = createdUser;
            return updated;
          }
          // Prepend so user is visible immediately, matching API sort (newest first).
          return [createdUser, ...prevUsers];
        });
        return { success: true, user: createdUser };
      } else {
        console.error('Create failed:', data.error);
        return { success: false, error: data.error || 'Create failed' };
      }
    } catch (error) {
      console.error('Create failed:', error);
      return { success: false, error: 'Create failed' };
    }
  };

  const handleChangePassword = async (userId, passwordData) => {
    try {
      const response = await fetchWithAuth(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          updates: {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          }
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Password update failed:', error);
      return { success: false, error: 'Failed to update password' };
    }
  };

  if (!currentUser) return null;

  return (
    <RoleGuard
      roles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}
      currentUser={currentUser}
    >
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-rose-400">{error}</div>
        </div>
      ) : (
        <UserManagement
          users={users}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onCreate={handleCreateUser}
          onChangePassword={handleChangePassword}
        />
      )}
      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={async () => {
          if (!undoDelete?.deletedItemId) return;
          try {
            const response = await fetchWithAuth('/api/recycle-bin', {
              method: 'POST',
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId, currentUser })
            });
            const data = await response.json();
            if (data.success) {
              setUsers(prev => [...prev, undoDelete.user]);
            }
          } catch (err) {
            console.error('Undo restore failed:', err);
          } finally {
            setUndoDelete(null);
          }
        }}
        onClose={() => setUndoDelete(null)}
      />
    </RoleGuard>
  );
}
