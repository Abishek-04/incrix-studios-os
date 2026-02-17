'use client';

import { useEffect, useState } from 'react';
import { Instagram, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { fetchState } from '@/services/api';
import MediaBrowser from '@/components/instagram/MediaBrowser';
import AutomationBuilder from '@/components/instagram/AutomationBuilder';
import AnalyticsDashboard from '@/components/instagram/AnalyticsDashboard';
import InstagramOnboarding from '@/components/instagram/InstagramOnboarding';
import ManyChatStyleBuilder from '@/components/instagram/ManyChatStyleBuilder';

export default function InstagramPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('automation');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    loadData();

    // Check for OAuth callback messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      const connected = params.get('connected');
      showMessage(`Successfully connected ${connected} Instagram account(s)!`, 'success');
      // Clean URL
      window.history.replaceState({}, '', '/instagram');
    } else if (params.get('error')) {
      const errorCode = params.get('error');
      const errorMessages = {
        'access_denied': 'You denied access. Please try again and accept all permissions.',
        'user_denied': 'You denied access. Please try again and accept all permissions.',
        'missing_parameters': 'OAuth callback was missing required data. Please try again.',
        'invalid_state': 'Security check failed. Please try again.',
        'no_pages_found': 'No Facebook Pages found. Please create a Facebook Page and link your Instagram Professional Account to it.',
        'no_instagram_account': 'No Instagram Professional Account found linked to your Facebook Pages. Please link your Instagram Business/Creator account to a Facebook Page first.',
        'token_expired': 'Your session expired. Please try connecting again.',
        'permissions_error': 'Insufficient permissions. Please grant all requested permissions during login.',
        'invalid_parameter': 'Invalid configuration. Please contact support.',
        'connection_failed': 'Connection failed. Please check your Instagram account setup and try again.',
      };
      const friendlyMessage = errorMessages[errorCode] || `Error: ${errorCode}`;
      showMessage(friendlyMessage, 'error');
      window.history.replaceState({}, '', '/instagram');
    }
  }, []);

  async function loadData() {
    try {
      const data = await fetchState();
      const storedUser = localStorage.getItem('auth_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      setCurrentUser(user);

      // Filter Instagram channels
      const instagramChannels = (data.channels || []).filter(c => c.platform === 'instagram');
      setChannels(instagramChannels);
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('Failed to load Instagram accounts', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!currentUser) return;

    // Redirect to OAuth flow
    window.location.href = `/api/instagram/auth?userId=${currentUser.id}`;
  }

  async function handleSync(channelId) {
    setSyncing(prev => ({ ...prev, [channelId]: true }));

    try {
      const response = await fetch('/api/instagram/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync');
      }

      showMessage('Sync job queued! This may take a few minutes.', 'success');

      // Reload data after a delay
      setTimeout(() => loadData(), 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      showMessage('Failed to sync account', 'error');
    } finally {
      setSyncing(prev => ({ ...prev, [channelId]: false }));
    }
  }

  async function handleDisconnect(channelId) {
    if (!confirm('Are you sure you want to disconnect this Instagram account?')) {
      return;
    }

    try {
      // Remove channel from state
      const updatedChannels = channels.filter(c => c.id !== channelId);

      const response = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: updatedChannels,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setChannels(updatedChannels);
      showMessage('Instagram account disconnected', 'success');
    } catch (error) {
      console.error('Disconnect failed:', error);
      showMessage('Failed to disconnect account', 'error');
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  function getStatusBadge(status) {
    const badges = {
      connected: { icon: CheckCircle, color: 'green', label: 'Connected' },
      token_expiring: { icon: Clock, color: 'amber', label: 'Token Expiring' },
      token_expired: { icon: AlertCircle, color: 'red', label: 'Token Expired' },
      requires_reconnect: { icon: AlertCircle, color: 'amber', label: 'Reconnect Required' },
      error: { icon: AlertCircle, color: 'red', label: 'Error' },
    };

    const badge = badges[status] || badges.connected;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-${badge.color}-500/10 text-${badge.color}-400 border border-${badge.color}-500/20`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show onboarding wizard if no Instagram accounts connected
  if (channels.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <InstagramOnboarding
          currentUser={currentUser}
          onComplete={() => {
            loadData(); // Reload to show connected accounts
            showMessage('Instagram account connected successfully!', 'success');
          }}
        />
      </div>
    );
  }

  // Show ManyChat-style automation builder when accounts are connected
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Instagram className="w-8 h-8 text-pink-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Instagram Automation</h1>
            <p className="text-[#999] text-sm">
              Professional DM automation for your Instagram accounts
            </p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
        >
          <Instagram size={16} />
          Add Another Account
        </button>
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

      {/* Connected Accounts Summary */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[#999]">Connected Accounts:</div>
            <div className="flex gap-2">
              {channels.map(channel => (
                <div
                  key={channel.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded-lg"
                >
                  {channel.igProfilePicUrl ? (
                    <img
                      src={channel.igProfilePicUrl}
                      alt={channel.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-white">@{channel.igUsername}</span>
                  {getStatusBadge(channel.connectionStatus)}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('accounts')}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Manage Accounts →
          </button>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <div className="border-b border-[#333]">
        <nav className="flex gap-6">
          {[
            { id: 'automation', label: 'Automation' },
            { id: 'content', label: 'Content' },
            { id: 'accounts', label: 'Accounts' },
            { id: 'analytics', label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-[#999] border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'automation' && (
        <ManyChatStyleBuilder
          channels={channels}
          currentUser={currentUser}
          onSync={handleSync}
          syncing={syncing}
        />
      )}

      {activeTab === 'accounts' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => (
              <div
                key={channel.id}
                className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6 hover:border-[#444] transition-colors"
              >
                {/* Profile */}
                <div className="flex items-start gap-3 mb-4">
                  {channel.igProfilePicUrl ? (
                    <img
                      src={channel.igProfilePicUrl}
                      alt={channel.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{channel.name}</h3>
                    <p className="text-[#999] text-sm">@{channel.igUsername}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#151515] rounded-lg">
                  <div>
                    <div className="text-[#999] text-xs">Followers</div>
                    <div className="text-white font-semibold">
                      {(channel.followerCount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#999] text-xs">Posts</div>
                    <div className="text-white font-semibold">
                      {(channel.mediaCount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  {getStatusBadge(channel.connectionStatus)}
                </div>

                {/* Last Synced */}
                {channel.lastSynced && (
                  <div className="text-xs text-[#666] mb-4">
                    Last synced: {new Date(channel.lastSynced).toLocaleString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(channel.id)}
                    disabled={syncing[channel.id]}
                    className="flex-1 px-3 py-2 bg-[#2a2a2a] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} className={syncing[channel.id] ? 'animate-spin' : ''} />
                    {syncing[channel.id] ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(channel.id)}
                    className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    title="Disconnect"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <>
          {channels.length > 0 && !selectedChannel && (
            <div className="text-center py-12">
              <p className="text-[#999] mb-4">Select an account to view content</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {channels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
                  >
                    @{ch.igUsername}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedChannel && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  @{selectedChannel.igUsername} - Content
                </h3>
                <button
                  onClick={() => setSelectedChannel(null)}
                  className="text-sm text-[#999] hover:text-white"
                >
                  ← Back to accounts
                </button>
              </div>
              <MediaBrowser
                channel={selectedChannel}
                onSelectMedia={(media) => {
                  setSelectedMedia(media);
                  setActiveTab('automation');
                }}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <>
          {channels.length > 0 && !selectedChannel && (
            <div className="text-center py-12">
              <p className="text-[#999] mb-4">Select an account to view analytics</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {channels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
                  >
                    @{ch.igUsername}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedChannel && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  @{selectedChannel.igUsername} - Analytics
                </h3>
                <button
                  onClick={() => setSelectedChannel(null)}
                  className="text-sm text-[#999] hover:text-white"
                >
                  ← Back to accounts
                </button>
              </div>
              <AnalyticsDashboard channel={selectedChannel} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
