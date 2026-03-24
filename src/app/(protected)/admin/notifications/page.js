'use client';

import { useEffect, useState } from 'react';
import { Bell, Send, CheckCircle, XCircle, Clock, Users, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, fetchWithAuth } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminNotificationsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // In-app notification form
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushType, setPushType] = useState('info');
  const [pushTarget, setPushTarget] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [pushSending, setPushSending] = useState(false);

  // WhatsApp broadcast form
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await fetchState();

      if (currentUser && !['superadmin', 'manager'].includes(currentUser.role)) {
        showMsg('Access denied', 'error');
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showMsg('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Push in-app notification
  async function handlePushNotification() {
    if (!pushTitle.trim() || !pushMessage.trim()) {
      showMsg('Title and message are required', 'error');
      return;
    }

    setPushSending(true);
    try {
      const body = {
        title: pushTitle.trim(),
        message: pushMessage.trim(),
        type: pushType,
        senderId: currentUser.id,
      };

      if (pushTarget === 'all') {
        body.targetRole = 'all';
      } else if (pushTarget === 'role') {
        // Nothing extra — targetRole handled below
      } else if (pushTarget === 'specific') {
        if (selectedUserIds.length === 0) {
          showMsg('Select at least one user', 'error');
          setPushSending(false);
          return;
        }
        body.targetUserIds = selectedUserIds;
      }

      // If targeting a role (not 'all' and not 'specific'), use the pushTarget value as role
      if (!['all', 'specific'].includes(pushTarget)) {
        body.targetRole = pushTarget;
      }

      const res = await fetchWithAuth('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send');
      }

      const result = await res.json();
      showMsg(`Notification sent to ${result.count} user${result.count !== 1 ? 's' : ''}!`, 'success');
      setPushTitle('');
      setPushMessage('');
      setPushType('info');
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Push notification failed:', error);
      showMsg(error.message || 'Failed to send notification', 'error');
    } finally {
      setPushSending(false);
    }
  }

  // WhatsApp broadcast
  async function handleBroadcast() {
    if (!broadcastMessage.trim()) {
      showMsg('Please enter a message', 'error');
      return;
    }

    setBroadcastSending(true);
    try {
      let targetUsers = users.filter(
        (u) => u.notificationPreferences?.whatsapp?.enabled && u.whatsappNumber
      );

      if (selectedRole !== 'all') {
        targetUsers = targetUsers.filter((u) => u.role === selectedRole);
      }

      if (targetUsers.length === 0) {
        showMsg('No users match the selected criteria', 'error');
        setBroadcastSending(false);
        return;
      }

      const response = await fetchWithAuth('/api/whatsapp/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          userIds: targetUsers.map((u) => u.id),
          message: broadcastMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send broadcast');

      const result = await response.json();
      showMsg(`Broadcast queued for ${result.queuedCount || targetUsers.length} users!`, 'success');
      setBroadcastMessage('');
    } catch (error) {
      console.error('Broadcast failed:', error);
      showMsg('Failed to send broadcast', 'error');
    } finally {
      setBroadcastSending(false);
    }
  }

  function showMsg(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  function toggleUser(userId) {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  const getTargetCount = () => {
    if (pushTarget === 'all') return users.filter(u => u.isActive !== false).length;
    if (pushTarget === 'specific') return selectedUserIds.length;
    return users.filter(u => u.role === pushTarget && u.isActive !== false).length;
  };

  const whatsappEnabledUsers = users.filter(
    (u) => u.notificationPreferences?.whatsapp?.enabled
  );
  const usersWithNumber = users.filter((u) => u.whatsappNumber);

  if (loading) {
    return <LoadingScreen />;
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
          <p className="text-[#999] text-sm">Push in-app notifications and manage broadcasts</p>
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
          <h3 className="text-2xl font-bold text-white">{users.filter(u => u.isActive !== false).length}</h3>
          <p className="text-[#999] text-sm">Active Users</p>
        </div>
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{whatsappEnabledUsers.length}</h3>
          <p className="text-[#999] text-sm">WhatsApp Enabled</p>
        </div>
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <Clock className="w-8 h-8 text-amber-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{users.length}</h3>
          <p className="text-[#999] text-sm">Total Users</p>
        </div>
      </div>

      {/* Push In-App Notification */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          Push In-App Notification
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">Title</label>
            <input
              type="text"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="Notification title..."
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">Message</label>
            <textarea
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              placeholder="Enter notification message..."
              rows={3}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Type & Target Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[#999] mb-2">Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'info', icon: Info, label: 'Info', active: 'bg-blue-500/15 border-blue-500/40 text-blue-400' },
                  { value: 'success', icon: CheckCircle, label: 'Success', active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' },
                  { value: 'warning', icon: AlertTriangle, label: 'Warning', active: 'bg-amber-500/15 border-amber-500/40 text-amber-400' },
                  { value: 'error', icon: AlertCircle, label: 'Error', active: 'bg-rose-500/15 border-rose-500/40 text-rose-400' },
                ].map(({ value, icon: Icon, label, active }) => (
                  <button
                    key={value}
                    onClick={() => setPushType(value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                      pushType === value
                        ? active
                        : 'bg-[#0a0a0a] border-[#333] text-[#999] hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-[#999] mb-2">Send to</label>
              <select
                value={pushTarget}
                onChange={(e) => {
                  setPushTarget(e.target.value);
                  setSelectedUserIds([]);
                }}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="superadmin">Super Admins</option>
                <option value="manager">Managers</option>
                <option value="creator">Creators</option>
                <option value="editor">Editors</option>
                <option value="designer">Designers</option>
                <option value="developer">Developers</option>
                <option value="specific">Specific Users...</option>
              </select>
            </div>
          </div>

          {/* Specific User Picker */}
          {pushTarget === 'specific' && (
            <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-4">
              <p className="text-xs text-[#999] mb-3">Select users to notify:</p>
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUserIds.map(uid => {
                    const u = users.find(x => x.id === uid);
                    return u ? (
                      <span key={uid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full text-xs">
                        {u.name}
                        <button onClick={() => toggleUser(uid)} className="hover:text-white">
                          <X size={12} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {users.filter(u => u.isActive !== false).map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedUserIds.includes(user.id)
                        ? 'bg-indigo-500/10 border border-indigo-500/30'
                        : 'hover:bg-[#1a1a1a] border border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${user.avatarColor || 'bg-indigo-600'}`}>
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-[#666] capitalize">{user.role}</p>
                    </div>
                    {selectedUserIds.includes(user.id) && (
                      <CheckCircle size={16} className="text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target count & Send Button */}
          <div className="flex items-center justify-between">
            <p className="text-[#666] text-xs">
              Will notify {getTargetCount()} user{getTargetCount() !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handlePushNotification}
              disabled={pushSending || !pushTitle.trim() || !pushMessage.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={16} />
              {pushSending ? 'Sending...' : 'Push Notification'}
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Broadcast */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-400" />
          WhatsApp Broadcast
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">Send to:</label>
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

          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">Message:</label>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter your broadcast message..."
              rows={4}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[#666] text-xs mt-1">
              Will be sent to{' '}
              {users.filter(
                (u) =>
                  u.notificationPreferences?.whatsapp?.enabled &&
                  u.whatsappNumber &&
                  (selectedRole === 'all' || u.role === selectedRole)
              ).length}{' '}
              users
            </p>
          </div>

          <button
            onClick={handleBroadcast}
            disabled={broadcastSending || !broadcastMessage.trim()}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {broadcastSending ? 'Sending...' : 'Send WhatsApp Broadcast'}
          </button>
        </div>
      </div>

      {/* User Status Table */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">User Status</h2>

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
