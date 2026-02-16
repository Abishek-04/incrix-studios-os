'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, X, Send } from 'lucide-react';
import { fetchState } from '@/services/api';

export default function NotificationSettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [preferences, setPreferences] = useState({
    whatsapp: {
      enabled: false,
      projectAssigned: true,
      projectStageChanged: true,
      taskAssigned: true,
      taskOverdue: true,
      deadlineApproaching: true,
      projectAtRisk: true,
      newComment: false,
      quotaMilestone: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const data = await fetchState();
      const storedUser = localStorage.getItem('auth_user');
      let user = null;

      if (storedUser) {
        user = JSON.parse(storedUser);
        // Find the full user data from the API
        const fullUser = data.users?.find((u) => u.id === user.id);
        if (fullUser) {
          user = fullUser;
        }
      }

      if (!user && data.users && data.users.length > 0) {
        user = data.users.find((u) => u.role === 'manager') || data.users[0];
      }

      if (user) {
        setCurrentUser(user);
        setWhatsappNumber(user.whatsappNumber || user.phoneNumber || '');

        // Load user's notification preferences
        if (user.notificationPreferences?.whatsapp) {
          setPreferences({
            whatsapp: {
              ...preferences.whatsapp,
              ...user.notificationPreferences.whatsapp,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      showMessage('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!currentUser) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUser,
          updates: {
            whatsappNumber,
            notificationPreferences: preferences,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Update localStorage
      const updatedUser = {
        ...currentUser,
        whatsappNumber,
        notificationPreferences: preferences,
      };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!whatsappNumber || !preferences.whatsapp.enabled) {
      showMessage('Please enable WhatsApp notifications and add a number first', 'error');
      return;
    }

    setTestingSend(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: whatsappNumber,
          message: `🔔 Test notification from Incrix Studios OS\n\nHello ${currentUser?.name}! Your WhatsApp notifications are working correctly. You will now receive updates about projects, tasks, and deadlines.`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test message');
      }

      showMessage('Test message sent! Check your WhatsApp.', 'success');
    } catch (error) {
      console.error('Failed to send test:', error);
      showMessage('Failed to send test message', 'error');
    } finally {
      setTestingSend(false);
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  function togglePreference(key) {
    setPreferences({
      ...preferences,
      whatsapp: {
        ...preferences.whatsapp,
        [key]: !preferences.whatsapp[key],
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
          <p className="text-[#999] text-sm">
            Manage how you receive notifications from Incrix Studios OS
          </p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4">
            <X size={16} />
          </button>
        </div>
      )}

      {/* WhatsApp Number */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">WhatsApp Number</h2>
        <input
          type="tel"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="+1234567890"
          className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[#999] text-sm mt-2">
          Use international format (e.g., +1 for US, +91 for India)
        </p>
      </div>

      {/* WhatsApp Notifications */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">WhatsApp Notifications</h2>
            <p className="text-[#999] text-sm">
              Receive updates via WhatsApp for important events
            </p>
          </div>
          <button
            onClick={() => togglePreference('enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.whatsapp.enabled ? 'bg-indigo-600' : 'bg-[#333]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.whatsapp.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          {[
            { key: 'projectAssigned', label: 'Project assigned to me' },
            { key: 'projectStageChanged', label: 'Project stage changed' },
            { key: 'taskAssigned', label: 'Task assigned to me' },
            { key: 'taskOverdue', label: 'Task overdue' },
            { key: 'deadlineApproaching', label: 'Deadline approaching (24h)' },
            { key: 'projectAtRisk', label: 'Project at risk' },
            { key: 'newComment', label: 'New comment/feedback' },
            { key: 'quotaMilestone', label: 'Quota milestone reached' },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <span className="text-white">{label}</span>
              <button
                onClick={() => togglePreference(key)}
                disabled={!preferences.whatsapp.enabled}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  preferences.whatsapp[key]
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-[#666] bg-transparent'
                } ${!preferences.whatsapp.enabled ? 'opacity-30' : ''}`}
              >
                {preferences.whatsapp[key] && <Check size={14} className="text-white" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleSendTest}
          disabled={testingSend || !preferences.whatsapp.enabled}
          className="px-6 py-3 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send size={16} />
          {testingSend ? 'Sending...' : 'Send Test'}
        </button>
      </div>
    </div>
  );
}
