'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Instagram, Plus, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock, Zap, MessageCircle, Send, Edit2, ToggleLeft, ToggleRight, Image, Film, ChevronDown, ArrowLeft, X, LogOut } from 'lucide-react';
import { fetchWithAuth } from '@/services/api';
import { useConfirm } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/ui/LoadingScreen';

// ─── Media Card ───
function MediaCard({ item, automated, onSelect }) {
  const image = item.thumbnail_url || item.media_url;
  const isReel = item.media_type === 'VIDEO';

  return (
    <div
      onClick={() => onSelect(item)}
      className="bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden cursor-pointer hover:border-[#555] hover:-translate-y-0.5 transition-all group relative"
    >
      {automated && (
        <div className="absolute top-2 right-2 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
            <Zap size={10} /> Active
          </span>
        </div>
      )}
      {image ? (
        <div className="aspect-square overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
      ) : (
        <div className="aspect-square bg-[#151515] flex items-center justify-center">
          <Image size={32} className="text-[#444]" />
        </div>
      )}
      <div className="p-3">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${isReel ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
          {isReel ? 'Reel' : 'Post'}
        </span>
        <p className="mt-1.5 text-[#999] text-xs line-clamp-2 leading-relaxed">
          {item.caption || 'No caption'}
        </p>
      </div>
    </div>
  );
}

// ─── Automation Builder Modal ───
function AutomationBuilder({ media, accountId, existingAutomation, onSave, onClose }) {
  // Parse existing keywords from comma-separated string
  const initialKeywords = (existingAutomation?.triggerKeyword || '').split(',').map(k => k.trim()).filter(Boolean);
  const [keywords, setKeywords] = useState(initialKeywords.length > 0 ? initialKeywords : []);
  const [keywordInput, setKeywordInput] = useState('');
  const [matchType, setMatchType] = useState(existingAutomation?.matchType || 'contains');
  const [replyType, setReplyType] = useState(existingAutomation?.replyType || 'both');
  const [commentReplyMessage, setCommentReplyMessage] = useState(existingAutomation?.commentReplyMessage ?? existingAutomation?.replyMessage ?? '');
  const [dmReplyMessage, setDmReplyMessage] = useState(existingAutomation?.dmReplyMessage ?? '');
  const [productLink, setProductLink] = useState(existingAutomation?.productLink || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const needsComment = replyType === 'comment' || replyType === 'both';
  const needsDm = replyType === 'dm' || replyType === 'both';

  function addKeyword(value) {
    const word = value.trim().toLowerCase();
    if (word && !keywords.includes(word)) {
      setKeywords(prev => [...prev, word]);
    }
    setKeywordInput('');
  }

  function removeKeyword(word) {
    setKeywords(prev => prev.filter(k => k !== word));
  }

  function handleKeywordKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(keywordInput);
    } else if (e.key === 'Backspace' && !keywordInput && keywords.length > 0) {
      setKeywords(prev => prev.slice(0, -1));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (keywords.length === 0) {
      setError('At least one trigger keyword is required');
      return;
    }
    if (needsComment && !commentReplyMessage.trim()) {
      setError('Comment reply message is required');
      return;
    }
    if (needsDm && !dmReplyMessage.trim()) {
      setError('DM reply message is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        accountId,
        triggerKeyword: keywords.join(','),
        matchType,
        replyType,
        commentReplyMessage: commentReplyMessage.trim(),
        dmReplyMessage: dmReplyMessage.trim(),
        replyMessage: dmReplyMessage.trim() || commentReplyMessage.trim(), // legacy fallback (prefer DM)
        productLink: productLink.trim(),
        targetMediaId: media?.id || 'any',
        targetMediaCaption: media?.caption || '',
        targetMediaUrl: media?.media_url || media?.thumbnail_url || '',
        targetMediaType: media?.media_type || '',
      };

      let response;
      if (existingAutomation) {
        response = await fetchWithAuth(`/api/instagram/automations/${existingAutomation.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetchWithAuth('/api/instagram/automations', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed');

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const image = media?.thumbnail_url || media?.media_url;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1e1e1e] border border-[#333] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-white">
            {existingAutomation ? 'Edit Automation' : 'Create Automation'}
          </h2>
          <button onClick={onClose} className="text-[#999] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Media Preview */}
          {image && (
            <div className="md:w-64 flex-shrink-0 p-4">
              <img src={image} alt="" className="w-full aspect-square object-cover rounded-lg" />
              {media?.caption && (
                <p className="mt-2 text-xs text-[#999] line-clamp-3">{media.caption}</p>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm text-[#999] mb-1">Trigger Keywords</label>
              <div className="flex flex-wrap items-center gap-1.5 w-full px-2.5 py-2 bg-[#151515] border border-[#333] rounded-lg focus-within:border-indigo-500 transition-colors min-h-[42px]">
                {keywords.map(word => (
                  <span key={word} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                    {word}
                    <button type="button" onClick={() => removeKeyword(word)} className="hover:text-white transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={() => { if (keywordInput.trim()) addKeyword(keywordInput); }}
                  placeholder={keywords.length === 0 ? 'Type keyword and press Enter' : 'Add more...'}
                  className="flex-1 min-w-[80px] bg-transparent text-white placeholder-[#666] outline-none text-sm"
                />
              </div>
              <p className="text-[10px] text-[#666] mt-1">Press Enter or comma to add. Any keyword match triggers the reply.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#999] mb-1">Match Type</label>
                <select
                  value={matchType}
                  onChange={e => setMatchType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151515] border border-[#333] rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#999] mb-1">Reply Type</label>
                <select
                  value={replyType}
                  onChange={e => setReplyType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151515] border border-[#333] rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="both">Comment + DM</option>
                  <option value="comment">Comment Only</option>
                  <option value="dm">DM Only</option>
                </select>
              </div>
            </div>

            {needsComment && (
              <div>
                <label className="block text-sm text-[#999] mb-1">Comment Reply</label>
                <textarea
                  value={commentReplyMessage}
                  onChange={e => setCommentReplyMessage(e.target.value)}
                  placeholder="Reply posted as a comment..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#151515] border border-[#333] rounded-lg text-white placeholder-[#666] focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
            )}

            {needsDm && (
              <div>
                <label className="block text-sm text-[#999] mb-1">DM Reply</label>
                <textarea
                  value={dmReplyMessage}
                  onChange={e => setDmReplyMessage(e.target.value)}
                  placeholder="Message sent as a DM..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#151515] border border-[#333] rounded-lg text-white placeholder-[#666] focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-[#999] mb-1">Product Link (optional)</label>
              <input
                type="url"
                value={productLink}
                onChange={e => setProductLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#151515] border border-[#333] rounded-lg text-white placeholder-[#666] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : existingAutomation ? 'Update Automation' : 'Create Automation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Automation Card ───
function AutomationCard({ automation, onToggle, onEdit, onDelete }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {automation.targetMediaUrl && (
          <div className="md:w-48 flex-shrink-0 bg-[#111]">
            <img
              src={automation.targetMediaUrl}
              alt=""
              className="w-full h-full object-cover md:aspect-[4/5] aspect-video"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="flex-1 p-4">
          {/* Caption */}
          {automation.targetMediaCaption && (
            <p className="text-xs text-[#888] mb-2 line-clamp-2 italic">{automation.targetMediaCaption}</p>
          )}
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {automation.triggerKeyword.split(',').map(k => k.trim()).filter(Boolean).map(word => (
                  <span key={word} className="px-2 py-0.5 rounded-md text-sm font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                    {word}
                  </span>
                ))}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${automation.active ? 'bg-green-500/10 text-green-400' : 'bg-[#333] text-[#999]'}`}>
                  {automation.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] border border-[#444] text-[#999]">{automation.matchType}</span>
                <span className="px-2 py-0.5 rounded text-[10px] border border-[#444] text-[#999]">{automation.replyType}</span>
              </div>
            </div>
            <button
              onClick={() => onToggle(automation)}
              className="text-[#999] hover:text-white transition-colors"
            >
              {automation.active ? <ToggleRight size={24} className="text-green-400" /> : <ToggleLeft size={24} />}
            </button>
          </div>

          {/* Reply Messages */}
          <div className="mb-3 space-y-2">
            {(automation.commentReplyMessage || automation.replyMessage) && (
              <div className="p-3 rounded-lg bg-[#151515] border border-[#252525]">
                <div className="text-[10px] uppercase tracking-wider text-[#666] font-semibold mb-1">Comment Reply</div>
                <p className="text-sm text-[#ccc] leading-relaxed">{automation.commentReplyMessage || automation.replyMessage}</p>
              </div>
            )}
            {automation.dmReplyMessage && (
              <div className="p-3 rounded-lg bg-[#151515] border border-[#252525]">
                <div className="text-[10px] uppercase tracking-wider text-[#666] font-semibold mb-1">DM Reply</div>
                <p className="text-sm text-[#ccc] leading-relaxed">{automation.dmReplyMessage}</p>
              </div>
            )}
            {automation.productLink && (
              <p className="text-xs text-indigo-400 break-all px-1">{automation.productLink}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-3">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <MessageCircle size={14} className="text-blue-400" />
                <span className="text-white font-semibold">{automation.commentReplies || 0}</span>
              </div>
              <div className="text-[10px] text-[#999]">Comments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Send size={14} className="text-pink-400" />
                <span className="text-white font-semibold">{automation.dmReplies || 0}</span>
              </div>
              <div className="text-[10px] text-[#999]">DMs sent</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[#999]">
                {automation.createdAt ? new Date(automation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
              </div>
              <div className="text-[10px] text-[#999]">Created</div>
            </div>
          </div>

          <div className="border-t border-[#333] pt-3 flex gap-2">
            <button
              onClick={() => onEdit(automation)}
              className="px-3 py-1.5 bg-[#2a2a2a] text-white rounded-lg text-xs font-medium hover:bg-[#333] transition-colors flex items-center gap-1"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={() => onDelete(automation)}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function InstagramPage() {
  const { user: currentUser } = useAuth();
  const confirmAction = useConfirm();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [media, setMedia] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [message, setMessage] = useState(null);

  // Automation builder
  const [builderMedia, setBuilderMedia] = useState(null);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'superadmin' ||
    (Array.isArray(currentUser?.roles) && (currentUser.roles.includes('manager') || currentUser.roles.includes('superadmin')));

  // Load accounts
  useEffect(() => {
    loadAccounts();

    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      showMsg(`Connected @${params.get('connected') || 'account'}!`, 'success');
      window.history.replaceState({}, '', '/instagram');
    } else if (params.get('error')) {
      showMsg(`Connection failed: ${params.get('error')}`, 'error');
      window.history.replaceState({}, '', '/instagram');
    }
  }, []);

  // Load media + automations when account selected
  useEffect(() => {
    if (selectedAccount) {
      loadMediaAndAutomations(selectedAccount.id);
    }
  }, [selectedAccount]);

  async function loadAccounts() {
    try {
      const res = await fetchWithAuth('/api/instagram/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        // Auto-select only for normal users with exactly 1 account
        // Managers always see the accounts dashboard first
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMediaAndAutomations(accountId) {
    setMediaLoading(true);
    try {
      const [mediaRes, autoRes] = await Promise.all([
        fetchWithAuth(`/api/instagram/media?accountId=${accountId}`),
        fetchWithAuth(`/api/instagram/automations?accountId=${accountId}`),
      ]);
      const mediaData = await mediaRes.json();
      const autoData = await autoRes.json();

      setMedia(mediaData.success ? mediaData.media : []);
      setAutomations(autoData.success ? autoData.automations : []);
    } catch (err) {
      console.error('Failed to load media:', err);
      showMsg('Failed to load Instagram data', 'error');
    } finally {
      setMediaLoading(false);
    }
  }

  function showMsg(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleConnect() {
    if (!currentUser) return;
    try {
      const res = await fetchWithAuth('/api/instagram/auth');
      // The API returns a redirect — follow the redirect URL
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.json();
        if (data.error) showMsg(data.error, 'error');
      }
    } catch {
      showMsg('Failed to start Instagram connection', 'error');
    }
  }

  async function handleDisconnect(accountId) {
    const confirmed = await confirmAction('Disconnect Account?', 'This will remove this Instagram account and all its automations.');
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/api/instagram/accounts?accountId=${accountId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
        if (selectedAccount?.id === accountId) {
          setSelectedAccount(null);
          setMedia([]);
          setAutomations([]);
        }
        showMsg('Account disconnected', 'success');
      }
    } catch (err) {
      showMsg('Failed to disconnect', 'error');
    }
  }

  async function handleToggle(automation) {
    try {
      const res = await fetchWithAuth(`/api/instagram/automations/${automation.id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ accountId: selectedAccount.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAutomations(prev => prev.map(a => a.id === automation.id ? data.automation : a));
      }
    } catch (err) {
      showMsg('Failed to toggle', 'error');
    }
  }

  async function handleDeleteAutomation(automation) {
    const confirmed = await confirmAction('Delete Automation?', `Delete automation for "${automation.triggerKeyword}"?`);
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/api/instagram/automations/${automation.id}?accountId=${selectedAccount.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAutomations(prev => prev.filter(a => a.id !== automation.id));
        showMsg('Automation deleted', 'success');
      }
    } catch (err) {
      showMsg('Failed to delete', 'error');
    }
  }

  function handleMediaSelect(item) {
    const existing = automations.find(a => a.targetMediaId === item.id);
    if (existing) {
      setEditingAutomation(existing);
    } else {
      setEditingAutomation(null);
    }
    setBuilderMedia(item);
    setShowBuilder(true);
  }

  function handleBuilderSave() {
    setShowBuilder(false);
    setBuilderMedia(null);
    setEditingAutomation(null);
    if (selectedAccount) loadMediaAndAutomations(selectedAccount.id);
    showMsg('Automation saved!', 'success');
  }

  const automationByMediaId = useMemo(
    () => new Map(automations.map(a => [a.targetMediaId, a])),
    [automations]
  );

  const filteredMedia = useMemo(() => {
    if (mediaFilter === 'posts') return media.filter(m => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM');
    if (mediaFilter === 'reels') return media.filter(m => m.media_type === 'VIDEO');
    return media;
  }, [media, mediaFilter]);

  const posts = media.filter(m => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM');
  const reels = media.filter(m => m.media_type === 'VIDEO');

  if (loading) return <LoadingScreen />;

  // ─── Normal user with no accounts → connect screen ───
  if (accounts.length === 0 && !isManager) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
            <Instagram size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Connect Your Instagram</h1>
          <p className="text-[#999] mb-8 max-w-md mx-auto">
            Connect your Instagram Business or Creator account to start automating comment replies and DMs.
          </p>
          <button
            onClick={handleConnect}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all text-lg"
          >
            Connect via Instagram
          </button>
        </div>
      </div>
    );
  }

  // ─── Accounts dashboard (manager always sees this, normal user sees if multiple accounts) ───
  if (!selectedAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Instagram className="w-8 h-8 text-pink-400" />
            <h1 className="text-2xl font-bold text-white">Instagram Accounts</h1>
          </div>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Account
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center mx-auto mb-4">
              <Instagram size={28} className="text-[#666]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No accounts connected yet</h2>
            <p className="text-[#999] text-sm mb-6">Click &quot;Add Account&quot; to connect an Instagram Business or Creator account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => (
              <div
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className="bg-[#1e1e1e] border border-[#333] rounded-lg p-5 hover:border-indigo-500/50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  {account.profilePictureUrl ? (
                    <img src={account.profilePictureUrl} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram size={20} className="text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-semibold">@{account.username}</h3>
                    <p className="text-[#999] text-xs capitalize">{account.accountType || 'Business'}</p>
                  </div>
                </div>
                {isManager && account.connectedBy && (
                  <p className="text-[#666] text-xs mb-2">Connected by: {account.connectedBy}</p>
                )}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle size={12} /> Connected
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDisconnect(account.id); }}
                    className="text-[#666] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Sync profile from Instagram ───
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetchWithAuth(`/api/instagram/accounts/${selectedAccount._id || selectedAccount.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.profile) {
        setSelectedAccount(prev => ({ ...prev, ...data.profile }));
        // Also update in accounts list
        setAccounts(prev => prev.map(a => (a._id || a.id) === (selectedAccount._id || selectedAccount.id) ? { ...a, ...data.profile } : a));
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch { setMessage({ type: 'error', text: 'Sync failed' }); }
    finally { setSyncing(false); }
  };

  // ─── Main Dashboard (account selected) ───
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      {/* Back + Add Account row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {accounts.length > 1 && (
            <button onClick={() => { setSelectedAccount(null); setMedia([]); setAutomations([]); }} className="text-[#999] hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-xl font-bold text-white">Instagram</h1>
        </div>
        <button onClick={() => handleDisconnect(selectedAccount._id || selectedAccount.id)}
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2">
          <LogOut size={14} /> Disconnect Account
        </button>
      </div>

      {/* ─── Profile Card (Instagram-style) ─── */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
              {selectedAccount.profilePictureUrl ? (
                <img src={selectedAccount.profilePictureUrl} alt="" className="w-full h-full rounded-full object-cover border-[3px] border-[#1e1e1e]" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#1e1e1e] border-[3px] border-[#1e1e1e] flex items-center justify-center">
                  <Instagram size={32} className="text-[#666]" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Username + sync */}
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white">@{selectedAccount.username}</h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#333] text-[#999] capitalize">{selectedAccount.accountType || 'Business'}</span>
              <button onClick={handleSync} disabled={syncing}
                className="text-[#666] hover:text-white transition-colors ml-1" title="Sync from Instagram">
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Name */}
            {selectedAccount.name && (
              <p className="text-sm font-semibold text-white mb-1">{selectedAccount.name}</p>
            )}

            {/* Bio */}
            {selectedAccount.biography && (
              <p className="text-[13px] text-[#ccc] mb-2 whitespace-pre-line leading-relaxed max-w-lg">{selectedAccount.biography}</p>
            )}

            {/* Website */}
            {selectedAccount.website && (
              <a href={selectedAccount.website} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-400 hover:underline mb-3 block">{selectedAccount.website}</a>
            )}

            {/* Stats */}
            <div className="flex items-center gap-8 mt-2">
              <div className="text-center">
                <span className="text-lg font-bold text-white block">{(selectedAccount.mediaCount || 0).toLocaleString()}</span>
                <span className="text-[11px] text-[#999]">Posts</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-white block">{(selectedAccount.followerCount || 0).toLocaleString()}</span>
                <span className="text-[11px] text-[#999]">Followers</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-white block">{(selectedAccount.followsCount || 0).toLocaleString()}</span>
                <span className="text-[11px] text-[#999]">Following</span>
              </div>
            </div>

            {/* Last synced */}
            {selectedAccount.lastSynced && (
              <p className="text-[10px] text-[#555] mt-3">Last synced: {new Date(selectedAccount.lastSynced).toLocaleString()}</p>
            )}
          </div>

          {/* Connected by (manager view) */}
          {isManager && selectedAccount.connectedBy && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-[#666]">Connected by</p>
              <p className="text-xs text-[#999]">{selectedAccount.connectedBy}</p>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-4">
          <div className="text-[#999] text-xs mb-1">Active Automations</div>
          <div className="text-2xl font-bold text-white">{automations.filter(a => a.active).length}</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-4">
          <div className="text-[#999] text-xs mb-1">Total Replies</div>
          <div className="text-2xl font-bold text-white">
            {automations.reduce((sum, a) => sum + (a.commentReplies || 0) + (a.dmReplies || 0), 0)}
          </div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-4">
          <div className="text-[#999] text-xs mb-1">Media</div>
          <div className="text-2xl font-bold text-white">{media.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#333]">
        <nav className="flex gap-6">
          {[
            { id: 'create', label: 'Create Rule' },
            { id: 'automations', label: `Automations (${automations.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-1 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab.id ? 'text-indigo-400 border-indigo-400' : 'text-[#999] border-transparent hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'create' && (
        <>
          {mediaLoading ? (
            <div className="text-center py-12">
              <RefreshCw size={24} className="animate-spin text-[#999] mx-auto mb-2" />
              <p className="text-[#999] text-sm">Loading media...</p>
            </div>
          ) : (
            <>
              {/* Media Filter */}
              <div className="flex gap-2">
                {[
                  { id: 'all', label: `All (${media.length})` },
                  { id: 'posts', label: `Posts (${posts.length})` },
                  { id: 'reels', label: `Reels (${reels.length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setMediaFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${mediaFilter === f.id ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-transparent text-[#999] border-[#333] hover:border-[#555]'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Media Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMedia.map(item => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    automated={automationByMediaId.has(item.id)}
                    onSelect={handleMediaSelect}
                  />
                ))}
              </div>

              {filteredMedia.length === 0 && (
                <div className="text-center py-12">
                  <Image size={48} className="text-[#444] mx-auto mb-3" />
                  <p className="text-[#999]">No media found</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'automations' && (
        <div className="space-y-3">
          {automations.length === 0 ? (
            <div className="text-center py-12">
              <Zap size={48} className="text-[#444] mx-auto mb-3" />
              <p className="text-[#999]">No automations yet. Select a post or reel to create one.</p>
            </div>
          ) : (
            automations.map(automation => {
              // Look up fresh media URL from loaded media (stored URLs expire)
              const freshMedia = media.find(m => m.id === automation.targetMediaId);
              const enrichedAutomation = {
                ...automation,
                targetMediaUrl: freshMedia?.thumbnail_url || freshMedia?.media_url || automation.targetMediaUrl,
                targetMediaCaption: automation.targetMediaCaption || freshMedia?.caption || '',
              };
              return (
              <AutomationCard
                key={automation.id}
                automation={enrichedAutomation}
                onToggle={handleToggle}
                onEdit={(a) => {
                  setEditingAutomation(a);
                  setBuilderMedia({
                    id: a.targetMediaId,
                    media_url: freshMedia?.media_url || a.targetMediaUrl,
                    caption: a.targetMediaCaption,
                    media_type: a.targetMediaType,
                  });
                  setShowBuilder(true);
                }}
                onDelete={handleDeleteAutomation}
              />
              );
            })
          )}
        </div>
      )}

      {/* Automation Builder Modal */}
      {showBuilder && (
        <AutomationBuilder
          media={builderMedia}
          accountId={selectedAccount.id}
          existingAutomation={editingAutomation}
          onSave={handleBuilderSave}
          onClose={() => { setShowBuilder(false); setBuilderMedia(null); setEditingAutomation(null); }}
        />
      )}
    </div>
  );
}
