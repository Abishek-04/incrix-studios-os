'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/admin/UserManagement';
import { RoleGuard } from '@/components/common/PermissionGuard';
import { ROLES } from '@/config/permissions';
import UndoToast from '@/components/ui/UndoToast';

export default function UserManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);

  // Load current user from localStorage
  useEffect(() => {
    const user = localStorage.getItem('auth_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
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
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser, updates })
      });

      const data = await response.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? data.user : u));
        if (currentUser?.id === userId) {
          setCurrentUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        }
      } else {
        console.error('Update failed:', data.error);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    const deletedUser = users.find(u => u.id === userId);
    try {
      const response = await fetch(`/api/users/${userId}?role=${currentUser.role}`, {
        method: 'DELETE'
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        if (data.deletedItemId && deletedUser) {
          setUndoDelete({
            deletedItemId: data.deletedItemId,
            user: deletedUser,
            message: `Deleted "${deletedUser.name}"`
          });
        }
      } else {
        console.error('Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser, userData })
      });

      const data = await response.json();
      if (data.success) {
        setUsers([...users, data.user]);
      } else {
        console.error('Create failed:', data.error);
      }
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleChangePassword = async (userId, passwordData) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUser,
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
        <div className="flex items-center justify-center h-full">
          <div className="text-white">Loading users...</div>
        </div>
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
            const response = await fetch('/api/recycle-bin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId })
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
