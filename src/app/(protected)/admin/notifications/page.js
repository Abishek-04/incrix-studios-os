'use client';

import { useEffect, useState } from 'react';
import { Bell, Send, CheckCircle, XCircle, Clock, Users, Filter } from 'lucide-react';
import { fetchState } from '@/services/api';

export default function AdminNotificationsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  // Broadcast message form
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await fetchState();
      const storedUser = localStorage.getItem('auth_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (user && !['superadmin', 'manager'].includes(user.role)) {
        showMessage('Access denied', 'error');
        return;
      }

      setCurrentUser(user);
      setUsers(data.users || []);

      // Fetch notification logs (we'll need to create this API endpoint)
      // For now, we'll just show user WhatsApp statuses
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBroadcast() {
    if (!broadcastMessage.trim()) {
      showMessage('Please enter a message', 'error');
      return;
    }

    setSending(true);
    try {
      // Filter users based on role selection
      let targetUsers = users.filter(
        (u) => u.notificationPreferences?.whatsapp?.enabled && u.whatsappNumber
      );

      if (selectedRole !== 'all') {
        targetUsers = targetUsers.filter((u) => u.role === selectedRole);
      }

      if (targetUsers.length === 0) {
        showMessage('No users match the selected criteria', 'error');
        setSending(false);
        return;
      }

      // Send broadcast via batch endpoint
      const response = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: targetUsers.map((u) => u.id),
          message: broadcastMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send broadcast');
      }

      const result = await response.json();
      showMessage(
        `Broadcast queued for ${result.queuedCount || targetUsers.length} users!`,
        'success'
      );
      setBroadcastMessage('');
    } catch (error) {
      console.error('Broadcast failed:', error);
      showMessage('Failed to send broadcast', 'error');
    } finally {
      setSending(false);
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  const whatsappEnabledUsers = users.filter(
    (u) => u.notificationPreferences?.whatsapp?.enabled
  );
  const usersWithNumber = users.filter((u) => u.whatsappNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentUser || !['superadmin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-[#999]">Only admins can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Management</h1>
          <p className="text-[#999] text-sm">Manage WhatsApp notifications and broadcast messages</p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <Users className="w-8 h-8 text-blue-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{whatsappEnabledUsers.length}</h3>
          <p className="text-[#999] text-sm">WhatsApp Enabled</p>
        </div>
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{usersWithNumber.length}</h3>
          <p className="text-[#999] text-sm">Phone Numbers Added</p>
        </div>
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <Clock className="w-8 h-8 text-amber-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{users.length}</h3>
          <p className="text-[#999] text-sm">Total Users</p>
        </div>
      </div>

      {/* Broadcast Message */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Broadcast Message
        </h2>

        <div className="space-y-4">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">
              Send to:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All users (with WhatsApp enabled)</option>
              <option value="superadmin">Super Admins</option>
              <option value="manager">Managers</option>
              <option value="creator">Creators</option>
              <option value="editor">Editors</option>
              <option value="designer">Designers</option>
              <option value="developer">Developers</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">
              Message:
            </label>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter your broadcast message..."
              rows={4}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[#666] text-xs mt-1">
              Will be sent to{' '}
              {
                users.filter(
                  (u) =>
                    u.notificationPreferences?.whatsapp?.enabled &&
                    u.whatsappNumber &&
                    (selectedRole === 'all' || u.role === selectedRole)
                ).length
              }{' '}
              users
            </p>
          </div>

          {/* Send Button */}
          <button
            onClick={handleBroadcast}
            disabled={sending || !broadcastMessage.trim()}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
        </div>
      </div>

      {/* User WhatsApp Status Table */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">User WhatsApp Status</h2>

        {/* Filter */}
        <div className="mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Users</option>
            <option value="enabled">WhatsApp Enabled</option>
            <option value="disabled">WhatsApp Disabled</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="text-left text-[#999] font-medium py-3 px-4">Name</th>
                <th className="text-left text-[#999] font-medium py-3 px-4">Role</th>
                <th className="text-left text-[#999] font-medium py-3 px-4">Phone Number</th>
                <th className="text-left text-[#999] font-medium py-3 px-4">WhatsApp</th>
                <th className="text-left text-[#999] font-medium py-3 px-4">Preferences</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => {
                  if (filterStatus === 'enabled')
                    return u.notificationPreferences?.whatsapp?.enabled;
                  if (filterStatus === 'disabled')
                    return !u.notificationPreferences?.whatsapp?.enabled;
                  return true;
                })
                .map((user) => (
                  <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            user.avatarColor || 'bg-indigo-600'
                          }`}
                        >
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#999] capitalize">{user.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-mono text-sm">
                        {user.whatsappNumber || user.phoneNumber || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.notificationPreferences?.whatsapp?.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
                          <CheckCircle size={12} />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2a2a2a] text-[#666] rounded text-xs">
                          <XCircle size={12} />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-[#999]">
                        {user.notificationPreferences?.whatsapp?.enabled ? (
                          <>
                            {Object.entries(user.notificationPreferences.whatsapp)
                              .filter(([key, value]) => key !== 'enabled' && value === true)
                              .length}{' '}
                            active
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
