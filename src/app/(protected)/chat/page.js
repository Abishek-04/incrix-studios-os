'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import Pusher from 'pusher-js';
import {
  Hash, Lock, MessageSquare, Search, Send, Smile, Paperclip,
  ChevronDown, Users, Plus, ArrowLeft, Reply, X, MoreHorizontal,
  Circle
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Avatar({ user, size = 8 }) {
  const s = `w-${size} h-${size}`;
  if (user?.profilePhoto) {
    return <img src={user.profilePhoto} alt={user.name} className={`${s} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${s} rounded-full flex-shrink-0 flex items-center justify-center text-[var(--text)] font-bold text-xs ${user?.senderColor || user?.avatarColor || 'bg-indigo-600'}`}>
      {(user?.senderName || user?.name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '✅', '🎉'];

// ─── Components ──────────────────────────────────────────────────────────────

function ChannelItem({ channel, isActive, onClick, unreadCount, currentUserId }) {
  const isDM = channel.type === 'dm';
  const dmUser = channel.dmUser;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isActive ? 'bg-[var(--primary-light)]' : 'hover:bg-[var(--bg-card-hover)]'
      }`}
    >
      {isDM ? (
        <div className="relative flex-shrink-0">
          {dmUser?.profilePhoto ? (
            <img src={dmUser.profilePhoto} alt={dmUser.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${dmUser?.avatarColor || 'bg-indigo-600'}`}>
              {dmUser?.name?.charAt(0) || '?'}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2" style={{ borderColor: 'var(--bg-sidebar)' }}></span>
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'var(--bg-input)' }}>
          {channel.emoji || '#'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold truncate" style={{ color: isActive ? 'var(--primary)' : 'var(--text)' }}>
            {isDM ? (dmUser?.name || channel.name) : channel.name}
          </span>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-1" style={{ background: 'var(--primary)', color: 'white' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {channel.lastMessage && (
          <span className="text-[11px] truncate block" style={{ color: 'var(--text-muted)' }}>
            {channel.lastMessageBy ? `${channel.lastMessageBy}: ` : ''}{channel.lastMessage}
          </span>
        )}
        {isDM && !channel.lastMessage && (
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {dmUser?.role || 'Start chatting'}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ msg, isOwn, onReply, onReact, showAvatar }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);

  if (msg.isDeleted) {
    return (
      <div className="px-4 py-1">
        <span className="text-xs text-[var(--text-muted)] italic">This message was deleted</span>
      </div>
    );
  }

  return (
    <div
      className={`group flex gap-3 px-4 py-1 hover:bg-[var(--bg-card)] relative ${showActions ? 'bg-[var(--bg-card)]' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar */}
      <div className="w-9 flex-shrink-0 flex items-start pt-0.5">
        {showAvatar && (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[var(--text)] font-bold text-sm ${msg.senderColor || 'bg-indigo-600'}`}>
            {msg.senderName?.charAt(0) || '?'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold text-[var(--text)]">{msg.senderName}</span>
            <span className="text-[11px] text-[var(--text-muted)]">{formatTime(msg.createdAt)}</span>
            {msg.editedAt && <span className="text-[10px] text-[var(--text-muted)] italic">(edited)</span>}
          </div>
        )}

        {/* Reply context */}
        {msg.replyToId && (
          <div className="flex items-center gap-2 mb-1 pl-3 border-l-2 border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] truncate">
              <span className="text-[var(--text-muted)] font-medium">{msg.replyToSender}</span>: {msg.replyToContent}
            </span>
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap break-words">
          {msg.content}
        </p>

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => onReact(msg.id, r.emoji)}
                className="flex items-center gap-1 bg-[var(--bg-input)] hover:bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-2 py-0.5 text-xs transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-[var(--text-muted)]">{r.userIds?.length || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      {showActions && (
        <div className="absolute right-4 top-0 -translate-y-1/2 flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-1.5 py-1 shadow-xl">
          {/* Quick emoji reactions */}
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(msg.id, emoji)}
              className="text-sm hover:scale-125 transition-transform px-0.5"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
          <button
            onClick={() => onReply(msg)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded"
            title="Reply"
          >
            <Reply size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator({ typingUsers }) {
  if (!typingUsers.length) return null;
  const names = typingUsers.map(u => u.userName).join(', ');
  return (
    <div className="px-4 py-1 flex items-center gap-2">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-muted)]">
        {names} {typingUsers.length === 1 ? 'is' : 'are'} typing…
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [dms, setDms] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showDMSearch, setShowDMSearch] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showSidebar, setShowSidebar] = useState(true); // mobile toggle

  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // ── Pusher setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    pusherRef.current = pusher;
    return () => pusher.disconnect();
  }, [user]);

  // ── Subscribe to active channel ───────────────────────────────────────────
  useEffect(() => {
    if (!pusherRef.current || !activeChannel) return;

    // Unsubscribe from previous channel
    if (channelRef.current) {
      channelRef.current.unbind_all();
      pusherRef.current.unsubscribe(channelRef.current.name);
    }

    // Subscribe to new channel
    const ch = pusherRef.current.subscribe(`chat-${activeChannel.id}`);
    channelRef.current = ch;

    ch.bind('new-message', (msg) => {
      // Don't add our own messages (already added optimistically or via API response)
      if (msg.senderId === user.id) return;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    ch.bind('typing', ({ userId, userName, typing }) => {
      if (userId === user.id) return;
      setTypingUsers(prev => {
        if (typing) {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        }
        return prev.filter(u => u.userId !== userId);
      });
    });

    return () => {
      ch.unbind_all();
      pusherRef.current?.unsubscribe(`chat-${activeChannel.id}`);
    };
  }, [activeChannel?.id, user?.id]);

  // ── Fetch channels ──────────────────────────────────────────────────────────
  const refreshChannels = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth('/api/chat/channels');
      const data = await res.json();
      const ch = data.channels || [];
      const d = data.dms || [];
      setChannels(ch);
      setDms(d);
      // Auto-select general channel on first load
      if (ch.length && !activeChannel) {
        const general = ch.find(c => c.slug === 'general');
        if (general) selectChannel(general);
        else selectChannel(ch[0]);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshChannels();
    fetchWithAuth('/api/users')
      .then(r => r.json())
      .then(data => setAllUsers(data.users || data || []))
      .catch(() => {});
  }, [user]);

  // ── Select channel ──────────────────────────────────────────────────────────
  const selectChannel = useCallback((channel) => {
    if (!channel) return;

    setActiveChannel(channel);
    setMessages([]);
    setHasMore(false);
    setOldestCursor(null);
    setTypingUsers([]);
    setReplyTo(null);
    setShowSidebar(false);

    // Load messages
    loadMessages(channel.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  const loadMessages = useCallback(async (channelId, cursor = null) => {
    setLoadingMessages(true);
    try {
      const url = `/api/chat/channels/${channelId}/messages${cursor ? `?before=${encodeURIComponent(cursor)}` : ''}`;
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (cursor) {
        setMessages(prev => [...(data.messages || []), ...prev]);
      } else {
        setMessages(data.messages || []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      }
      setHasMore(data.hasMore || false);
      setOldestCursor(data.cursor || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeChannel || sending) return;

    const content = input.trim();
    setInput('');
    setReplyTo(null);
    setSending(true);

    // Stop typing indicator
    

    try {
      await fetchWithAuth(`/api/chat/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          replyToId: replyTo?.id || null
        })
      });
    } catch (err) {
      console.error(err);
      setInput(content); // restore on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, activeChannel, sending, replyTo]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Typing indicator ────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeChannel) return;

    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      
    }, 2000);
  };

  // ── React to message ────────────────────────────────────────────────────────
  const handleReact = useCallback(async (messageId, emoji) => {
    if (!activeChannel) return;
    
    try {
      await fetchWithAuth(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
    } catch (_) {}
  }, [activeChannel]);

  // ── Start DM ────────────────────────────────────────────────────────────────
  const startDM = async (targetUser) => {
    setShowDMSearch(false);
    setDmSearchQuery('');
    try {
      const res = await fetchWithAuth(`/api/chat/dm?userId=${targetUser.id}`);
      const { channel } = await res.json();
      // Add to DM list if not already there
      if (!dms.find(d => d.id === channel.id)) {
        setDms(prev => [channel, ...prev]);
      }
      selectChannel(channel);
      // Refresh channels so the DM persists in sidebar
      setTimeout(() => refreshChannels(), 500);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Load more (scroll to top) ────────────────────────────────────────────────
  const handleScroll = (e) => {
    if (e.target.scrollTop < 80 && hasMore && !loadingMessages && oldestCursor) {
      loadMessages(activeChannel.id, oldestCursor);
    }
  };

  // ── Render grouped messages ──────────────────────────────────────────────────
  const groupedMessages = messages.reduce((groups, msg, i) => {
    const prev = messages[i - 1];
    const showAvatar = !prev || prev.senderId !== msg.senderId ||
      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000;

    const msgDate = new Date(msg.createdAt).toDateString();
    const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
    const showDateDivider = msgDate !== prevDate;

    groups.push({ msg, showAvatar, showDateDivider });
    return groups;
  }, []);

  const filteredDMUsers = allUsers.filter(u =>
    u.id !== user?.id &&
    (u.name?.toLowerCase().includes(dmSearchQuery.toLowerCase()) ||
     u.role?.toLowerCase().includes(dmSearchQuery.toLowerCase()))
  );

  const isDMChannel = activeChannel?.type === 'dm';
  const dmUser = activeChannel?.dmUser;

  return (
    <div className="flex h-full bg-[var(--bg)]">
      {/* ── Chat Sidebar ─────────────────────────────────────────────────── */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 border-r border-[var(--border-light)] bg-[var(--bg)] flex-shrink-0`}>
        <div className="p-4 border-b border-[var(--border-light)] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl px-3 py-2">
            <Search size={13} className="text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search channels..."
              className="bg-transparent text-sm text-[var(--text)] outline-none w-full placeholder-[var(--text-muted)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Channels</span>
            </div>
            <div className="space-y-0.5">
              {channels.map(ch => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={activeChannel?.id === ch.id}
                  onClick={() => selectChannel(ch)}
                  unreadCount={unreadCounts[ch.id] || 0}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Direct Messages</span>
              <button
                onClick={() => setShowDMSearch(!showDMSearch)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                title="New DM"
              >
                <Plus size={14} />
              </button>
            </div>

            {showDMSearch && (
              <div className="mb-2 px-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search people..."
                  value={dmSearchQuery}
                  onChange={e => setDmSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)]"
                />
                {dmSearchQuery && (
                  <div className="mt-1 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg overflow-hidden">
                    {filteredDMUsers.slice(0, 6).map(u => (
                      <button
                        key={u.id}
                        onClick={() => startDM(u)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg-input)] transition-colors text-left"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[var(--text)] text-xs font-bold ${u.avatarColor || 'bg-indigo-600'}`}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm text-[var(--text)]">{u.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] capitalize">{u.role}</div>
                        </div>
                      </button>
                    ))}
                    {filteredDMUsers.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[var(--text-muted)]">No users found</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-0.5">
              {dms.map(dm => (
                <ChannelItem
                  key={dm.id}
                  channel={dm}
                  isActive={activeChannel?.id === dm.id}
                  onClick={() => selectChannel(dm)}
                  unreadCount={unreadCounts[dm.id] || 0}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Message Area ─────────────────────────────────────────────────── */}
      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}>
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-2">Welcome to Incrix Chat</h2>
              <p className="text-[var(--text-muted)] text-sm max-w-sm">
                Select a channel from the sidebar to start chatting with your team. All conversations are organized by team and project.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Channel Header */}
            <div className="h-14 border-b border-[var(--border-light)] flex items-center justify-between px-4 flex-shrink-0 bg-[var(--bg)]">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  className="md:hidden text-[var(--text-muted)] hover:text-[var(--text)]"
                  onClick={() => setShowSidebar(true)}
                >
                  <ArrowLeft size={18} />
                </button>

                {isDMChannel ? (
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--text)] font-bold text-sm ${dmUser?.avatarColor || 'bg-indigo-600'}`}>
                      {dmUser?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{dmUser?.name || activeChannel.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] capitalize">{dmUser?.role}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{activeChannel.emoji || '#'}</span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{activeChannel.name}</div>
                      {activeChannel.description && (
                        <div className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">{activeChannel.description}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-input)] transition-colors">
                  <Users size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto py-4"
              onScroll={handleScroll}
            >
              {loadingMessages && !messages.length && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={() => loadMessages(activeChannel.id, oldestCursor)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-4 py-1.5 rounded-lg bg-[var(--bg-input)] hover:bg-[#222] transition-colors"
                    disabled={loadingMessages}
                  >
                    {loadingMessages ? 'Loading…' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 && !loadingMessages && (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="text-4xl mb-4">{activeChannel.emoji || (isDMChannel ? '👤' : '#')}</div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                    {isDMChannel ? `Start a conversation with ${dmUser?.name}` : `Welcome to ${activeChannel.name}`}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {activeChannel.description || 'This is the beginning of this conversation.'}
                  </p>
                </div>
              )}

              {groupedMessages.map(({ msg, showAvatar, showDateDivider }, i) => (
                <div key={msg.id}>
                  {showDateDivider && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 h-px bg-[#222]" />
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">{formatDateDivider(msg.createdAt)}</span>
                      <div className="flex-1 h-px bg-[#222]" />
                    </div>
                  )}
                  <MessageBubble
                    msg={msg}
                    isOwn={msg.senderId === user?.id}
                    showAvatar={showAvatar}
                    onReply={setReplyTo}
                    onReact={handleReact}
                  />
                </div>
              ))}

              <TypingIndicator typingUsers={typingUsers} />
              <div ref={bottomRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div className="mx-4 mb-0 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply size={13} className="text-indigo-400 flex-shrink-0" />
                  <span className="text-xs text-[var(--text-muted)]">Replying to <span className="text-white font-medium">{replyTo.senderName}</span></span>
                  <span className="text-xs text-[var(--text-muted)] truncate ml-1">— {replyTo.content}</span>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] ml-2 flex-shrink-0">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className={`px-4 pb-4 flex-shrink-0 ${replyTo ? 'pt-0' : 'pt-2'}`}>
              <div className={`flex items-end gap-2 bg-[var(--bg-card)] border border-[var(--border)] ${replyTo ? 'rounded-b-xl rounded-t-none' : 'rounded-xl'} px-3 py-2.5 focus-within:border-indigo-500/40 transition-colors`}>
                {activeChannel.isReadOnly ? (
                  <p className="flex-1 text-sm text-[var(--text-muted)] py-1 text-center">
                    <Lock size={13} className="inline mr-1" />
                    This channel is read-only
                  </p>
                ) : (
                  <>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${isDMChannel ? dmUser?.name : '#' + activeChannel.slug}…`}
                      rows={1}
                      className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none resize-none max-h-32 leading-relaxed"
                      style={{ minHeight: '24px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                        input.trim() && !sending
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-[var(--text)]'
                          : 'text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                    >
                      <Send size={15} />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-1 text-[10px] text-[var(--text-muted)] text-right pr-1">
                Enter to send · Shift+Enter for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
