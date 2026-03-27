'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Send, Star, Search, Plus, ArrowLeft, Reply, Trash2,
  Paperclip, X, Mail, StarOff, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';

// ─── Animation ────────────────────────────────────────────────────────────────

const ease = [0.23, 1, 0.32, 1];
const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, avatar, color, size = 36 }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, background: 'var(--primary-light)' }}
      className={`rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${color || ''}`}
    >
      <span style={{ color: 'var(--primary)' }}>
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Folder Tabs ──────────────────────────────────────────────────────────────

const FOLDERS = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'starred', label: 'Starred', icon: Star },
];

function FolderTabs({ active, onChange, unreadCount }) {
  return (
    <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
      {FOLDERS.map(f => {
        const Icon = f.icon;
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            <Icon size={16} />
            {f.label}
            {f.key === 'inbox' && unreadCount > 0 && (
              <span
                className="text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-1"
                style={{ background: 'var(--danger)', color: '#fff' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Mail List Item ───────────────────────────────────────────────────────────

function MailListItem({ mail, userId, onClick, onToggleStar }) {
  const isRead = mail.isRead?.[userId];
  const isStarred = mail.isStarred?.[userId];

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group"
      style={{
        background: isRead ? 'transparent' : 'var(--primary-light)',
        borderBottom: '1px solid var(--border-light)',
      }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = isRead ? 'transparent' : 'var(--primary-light)'}
    >
      {!isRead && (
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
      )}
      {isRead && <div className="w-2 flex-shrink-0" />}

      <Avatar name={mail.fromName} avatar={mail.fromAvatar} color={mail.fromColor} size={34} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm truncate"
            style={{ color: 'var(--text)', fontWeight: isRead ? 400 : 600 }}
          >
            {mail.fromName}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {formatDate(mail.createdAt)}
          </span>
        </div>
        <div
          className="text-sm truncate"
          style={{ color: 'var(--text)', fontWeight: isRead ? 400 : 600 }}
        >
          {mail.subject}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {mail.body?.slice(0, 100)}
        </div>
      </div>

      <button
        className="flex-shrink-0 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        style={{ color: isStarred ? 'var(--warning)' : 'var(--text-muted)' }}
        onClick={e => { e.stopPropagation(); onToggleStar(mail); }}
        title={isStarred ? 'Unstar' : 'Star'}
      >
        {isStarred ? <Star size={16} fill="currentColor" /> : <Star size={16} />}
      </button>
    </motion.div>
  );
}

// ─── Mail Detail ──────────────────────────────────────────────────────────────

function MailDetail({ mail, thread, userId, onBack, onReply, onDelete, onToggleStar }) {
  const isStarred = mail.isStarred?.[userId];
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div {...fadeSlide} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="flex-1 text-base font-semibold truncate" style={{ color: 'var(--text)' }}>
          {mail.subject}
        </h2>
        <button
          onClick={() => onToggleStar(mail)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: isStarred ? 'var(--warning)' : 'var(--text-muted)' }}
          title={isStarred ? 'Unstar' : 'Star'}
        >
          {isStarred ? <Star size={18} fill="currentColor" /> : <Star size={18} />}
        </button>
        <button
          onClick={() => onReply(mail)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Reply"
        >
          <Reply size={18} />
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        ) : (
          <button
            onClick={() => { onDelete(mail.id); setConfirmDelete(false); }}
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            Confirm Delete
          </button>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {(thread || [mail]).map((msg, i) => (
          <div key={msg.id || i} className="space-y-2">
            <div className="flex items-start gap-3">
              <Avatar name={msg.fromName} avatar={msg.fromAvatar} color={msg.fromColor} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {msg.fromName}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatFullDate(msg.createdAt)}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  To: {msg.toNames?.join(', ') || 'Unknown'}
                </div>
              </div>
            </div>
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap pl-[50px]"
              style={{ color: 'var(--text)' }}
            >
              {msg.body}
            </div>
            {msg.attachments?.length > 0 && (
              <div className="pl-[50px] flex flex-wrap gap-2 mt-2">
                {msg.attachments.map((att, j) => (
                  <a
                    key={j}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ background: 'var(--bg-input)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                  >
                    <Paperclip size={12} />
                    {att.name}
                  </a>
                ))}
              </div>
            )}
            {i < (thread || [mail]).length - 1 && (
              <div className="ml-[50px]" style={{ borderBottom: '1px solid var(--border-light)' }} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({ onClose, onSend, replyTo }) {
  const [to, setTo] = useState(replyTo ? replyTo.recipients : []);
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}` : '');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const searchTimeout = useRef(null);

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) { setUserResults([]); return; }
    setSearching(true);
    try {
      const res = await fetchWithAuth('/api/users');
      const data = await res.json();
      const filtered = (data.users || []).filter(u =>
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      ).filter(u => !to.some(r => r.id === u.id));
      setUserResults(filtered.slice(0, 8));
    } catch { setUserResults([]); }
    setSearching(false);
  }, [to]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (userSearch.trim()) {
      searchTimeout.current = setTimeout(() => searchUsers(userSearch), 300);
    } else {
      setUserResults([]);
    }
    return () => clearTimeout(searchTimeout.current);
  }, [userSearch, searchUsers]);

  const addRecipient = (user) => {
    setTo(prev => [...prev, { id: user.id, name: user.name }]);
    setUserSearch('');
    setUserResults([]);
  };

  const removeRecipient = (userId) => {
    setTo(prev => prev.filter(r => r.id !== userId));
  };

  const fileInputRef = useRef(null);

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const sizeKB = Math.round(file.size / 1024);
      const size = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      const type = file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'document' : 'file';
      setAttachments(prev => [...prev, { name: file.name, url, type, size, file }]);
    });
    e.target.value = '';
  };

  const removeAttachment = (i) => {
    setAttachments(prev => prev.filter((_, j) => j !== i));
  };

  const handleSend = async () => {
    if (!to.length || !subject.trim()) return;
    setSending(true);
    const validAttachments = attachments.filter(a => a.name && a.url);
    await onSend({
      to: to.map(r => r.id),
      subject: subject.trim(),
      body,
      attachments: validAttachments,
      replyToId: replyTo?.mailId || null,
    });
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease } }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-xl flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {replyTo ? 'Reply' : 'New Mail'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Recipients */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>To</label>
            <div
              className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg min-h-[38px]"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
            >
              {to.map(r => (
                <span
                  key={r.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                >
                  {r.name}
                  <button onClick={() => removeRecipient(r.id)} className="ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={userSearch}
                onChange={e => {
                  let val = e.target.value;
                  if (val.startsWith('@')) val = val.slice(1);
                  setUserSearch(val);
                }}
                placeholder={to.length ? '@ to add more...' : 'Type @ or name to search...'}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
                style={{ color: 'var(--text)' }}
              />
            </div>
            {userResults.length > 0 && (
              <div
                className="mt-1 rounded-lg overflow-hidden shadow-lg max-h-40 overflow-y-auto"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {userResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => addRecipient(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                    style={{ color: 'var(--text)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar name={u.name} avatar={u.profilePhoto} color={u.avatarColor} size={24} />
                    <span>{u.name}</span>
                    {u.email && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</span>}
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 size={12} className="animate-spin" /> Searching...
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Attachments — file picker */}
          <div>
            <input type="file" ref={fileInputRef} multiple onChange={handleFilePick} className="hidden" accept="*/*" />
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Attachments</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}
              >
                <Paperclip size={13} /> Pick Files
              </button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{
                      background: att.type === 'image' ? 'var(--success-light)' : att.type === 'document' ? 'var(--warning-light)' : 'var(--primary-light)',
                      color: att.type === 'image' ? 'var(--success)' : att.type === 'document' ? 'var(--warning)' : 'var(--primary)'
                    }}>
                      {att.type === 'image' ? '🖼' : att.type === 'document' ? '📄' : '📎'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{att.name}</div>
                      {att.size && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{att.size}</div>}
                    </div>
                    <button onClick={() => removeAttachment(i)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !to.length || !subject.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {sending && <Loader2 size={14} className="animate-spin" />}
            Send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MailPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [folder, setFolder] = useState('inbox');
  const [mails, setMails] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Views: 'list' | 'detail'
  const [view, setView] = useState('list');
  const [selectedMail, setSelectedMail] = useState(null);
  const [thread, setThread] = useState([]);

  // Compose
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // ── Fetch mails ─────────────────────────────────────────────────────────
  const fetchMails = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/mail?folder=${folder}&page=${page}`);
      const data = await res.json();
      setMails(data.mails || []);
      setTotalPages(data.pages || 1);
      setUnread(data.unread || 0);
    } catch (err) {
      console.error('Failed to fetch mails:', err);
    }
    setLoading(false);
  }, [folder, page, userId]);

  useEffect(() => { fetchMails(); }, [fetchMails]);

  // ── Open mail ───────────────────────────────────────────────────────────
  const openMail = async (mail) => {
    try {
      const res = await fetchWithAuth(`/api/mail/${mail.id}`);
      const data = await res.json();
      setSelectedMail(data.mail);
      setThread(data.thread || []);
      setView('detail');
      // Update local read state
      setMails(prev => prev.map(m => m.id === mail.id ? { ...m, isRead: { ...m.isRead, [userId]: true } } : m));
      if (!mail.isRead?.[userId]) setUnread(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to open mail:', err);
    }
  };

  // ── Toggle star ─────────────────────────────────────────────────────────
  const toggleStar = async (mail) => {
    const newVal = !mail.isStarred?.[userId];
    // Optimistic update
    const updater = m => m.id === mail.id ? { ...m, isStarred: { ...m.isStarred, [userId]: newVal } } : m;
    setMails(prev => prev.map(updater));
    if (selectedMail?.id === mail.id) {
      setSelectedMail(prev => ({ ...prev, isStarred: { ...prev.isStarred, [userId]: newVal } }));
    }
    try {
      await fetchWithAuth(`/api/mail/${mail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isStarred: newVal }),
      });
    } catch (err) {
      console.error('Failed to toggle star:', err);
      // Revert
      setMails(prev => prev.map(m => m.id === mail.id ? { ...m, isStarred: { ...m.isStarred, [userId]: !newVal } } : m));
    }
  };

  // ── Delete mail ─────────────────────────────────────────────────────────
  const deleteMail = async (mailId) => {
    setMails(prev => prev.filter(m => m.id !== mailId));
    setView('list');
    setSelectedMail(null);
    try {
      await fetchWithAuth(`/api/mail/${mailId}`, { method: 'DELETE' });
      fetchMails();
    } catch (err) {
      console.error('Failed to delete mail:', err);
      fetchMails();
    }
  };

  // ── Send mail ───────────────────────────────────────────────────────────
  const sendMail = async (payload) => {
    try {
      await fetchWithAuth('/api/mail', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setShowCompose(false);
      setReplyTo(null);
      fetchMails();
    } catch (err) {
      console.error('Failed to send mail:', err);
    }
  };

  // ── Reply ───────────────────────────────────────────────────────────────
  const handleReply = (mail) => {
    setReplyTo({
      mailId: mail.id,
      subject: mail.subject,
      recipients: [{ id: mail.from, name: mail.fromName }],
    });
    setShowCompose(true);
  };

  // ── Filter by search ───────────────────────────────────────────────────
  const filtered = search.trim()
    ? mails.filter(m =>
        m.subject?.toLowerCase().includes(search.toLowerCase()) ||
        m.fromName?.toLowerCase().includes(search.toLowerCase()) ||
        m.body?.toLowerCase().includes(search.toLowerCase())
      )
    : mails;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <Mail size={20} style={{ color: 'var(--primary)' }} />
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text)' }}>Mail</h1>

        {view === 'list' && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search mail..."
              className="bg-transparent outline-none text-sm w-48"
              style={{ color: 'var(--text)' }}
            />
          </div>
        )}

        <button
          onClick={() => { setReplyTo(null); setShowCompose(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          <Plus size={14} />
          Compose
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)' }}>
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div key="list" {...fadeSlide} className="flex flex-col flex-1 overflow-hidden">
              <FolderTabs active={folder} onChange={f => { setFolder(f); setPage(1); }} unreadCount={unread} />

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Mail size={40} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {search ? 'No mails match your search' : `No mails in ${folder}`}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filtered.map(mail => (
                      <MailListItem
                        key={mail.id}
                        mail={mail}
                        userId={userId}
                        onClick={() => openMail(mail)}
                        onToggleStar={toggleStar}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-center gap-3 py-3"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <MailDetail
              key="detail"
              mail={selectedMail}
              thread={thread}
              userId={userId}
              onBack={() => { setView('list'); setSelectedMail(null); }}
              onReply={handleReply}
              onDelete={deleteMail}
              onToggleStar={toggleStar}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <ComposeModal
            onClose={() => { setShowCompose(false); setReplyTo(null); }}
            onSend={sendMail}
            replyTo={replyTo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
