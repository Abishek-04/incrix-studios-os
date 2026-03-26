import React, { useState } from 'react';
import { Platform } from '@/types';
import { Plus, Trash2, Eye, EyeOff, X, Globe, Link as LinkIcon, Loader2, CheckCircle2, MessageCircle, Mail, User as UserIcon } from 'lucide-react';
import { useConfirm } from '@/contexts/UIContext';

const ManageChannels = ({ channels, users, onCreateChannel, onUpdateChannelMember, onDeleteChannel }) => {
    const confirmAction = useConfirm();
    const [showDialog, setShowDialog] = useState(false);
    const [showCredentials, setShowCredentials] = useState({});
    const [isDetecting, setIsDetecting] = useState(false);

    const [urlInput, setUrlInput] = useState('');
    const [detectedInfo, setDetectedInfo] = useState(null);
    const [formData, setFormData] = useState({ email: '', credentials: '', memberId: '' });

    const resetForm = () => {
        setShowDialog(false);
        setDetectedInfo(null);
        setUrlInput('');
        setFormData({ email: '', credentials: '', memberId: '' });
        setIsDetecting(false);
    };

    const analyzeLink = (url) => {
        setUrlInput(url);
        if (!url) { setDetectedInfo(null); return; }
        setIsDetecting(true);

        setTimeout(() => {
            let platform = null;
            let name = 'Unknown Channel';
            const cleanUrl = url.toLowerCase();

            if (cleanUrl.includes('instagram.com')) {
                platform = Platform.Instagram;
                const match = url.match(/instagram\.com\/([^/?]+)/);
                if (match) name = match[1];
            } else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
                platform = Platform.YouTube;
                const match = url.match(/(?:youtube\.com\/@|youtube\.com\/c\/|youtube\.com\/channel\/|youtube\.com\/user\/)([^/?]+)/) || url.match(/youtube\.com\/([^/?]+)/);
                if (match) name = match[1];
            } else if (cleanUrl.includes('tiktok.com')) {
                platform = Platform.TikTok;
                const match = url.match(/tiktok\.com\/@([^/?]+)/);
                if (match) name = match[1];
            } else if (cleanUrl.includes('linkedin.com')) {
                platform = Platform.LinkedIn;
                const match = url.match(/linkedin\.com\/(?:in|company|school)\/([^/?]+)/);
                if (match) name = match[1];
            } else if (cleanUrl.includes('chat.whatsapp.com') || cleanUrl.includes('wa.me')) {
                platform = Platform.WhatsApp;
                name = "Team WhatsApp Group";
            } else if (cleanUrl.includes('@') && !cleanUrl.includes('/')) {
                platform = Platform.Email;
                name = "Email Notification List";
            }

            if (platform) {
                try { name = decodeURIComponent(name); } catch (e) { }
                setDetectedInfo({ platform, name });
            } else {
                setDetectedInfo(null);
            }
            setIsDetecting(false);
        }, 600);
    };

    const handleSave = () => {
        if (!detectedInfo) return;
        const newChannel = {
            id: `CH-${Date.now()}`,
            platform: detectedInfo.platform,
            name: detectedInfo.name,
            link: urlInput,
            email: formData.email,
            credentials: formData.credentials,
            memberId: formData.memberId || undefined
        };
        onCreateChannel(newChannel);
        resetForm();
    };

    const deleteChannel = async (id) => {
        const confirmed = await confirmAction('Delete Channel?', 'Are you sure you want to delete this channel?');
        if (confirmed) onDeleteChannel(id);
    };

    const toggleCredentials = (id) => {
        setShowCredentials(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getOwnerName = (channel) => {
        if (!channel.memberId) return null;
        const user = users.find(u => (u.id || u._id) === channel.memberId);
        return user?.name || null;
    };

    const isAutoConnected = (channel) => {
        return channel.id?.startsWith('IG-') || (channel.platform === 'instagram' && channel.igUserId);
    };

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case Platform.WhatsApp: return <MessageCircle size={18} />;
            case Platform.Email: return <Mail size={18} />;
            default: return <Globe size={18} />;
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform) {
            case Platform.WhatsApp: return 'bg-emerald-600';
            case Platform.Email: return 'bg-blue-500';
            case Platform.YouTube: return 'bg-red-600';
            case Platform.Instagram: return 'bg-pink-600';
            case Platform.TikTok: return 'bg-black';
            case Platform.LinkedIn: return 'bg-blue-700';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Channels & Integrations</h1>
                    <p className="text-[var(--text-muted)]">Manage social accounts and notification gateways.</p>
                </div>
                <button
                    onClick={() => setShowDialog(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text)] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Plus size={16} /> <span>Add Channel</span>
                </button>
            </div>

            {/* ── Add Channel Dialog ── */}
            {showDialog && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={resetForm}>
                    <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                                    <LinkIcon size={20} />
                                </div>
                                <h3 className="text-white font-semibold text-lg">Add New Channel</h3>
                            </div>
                            <button onClick={resetForm} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Dialog Body */}
                        <div className="p-5 space-y-5">
                            {/* URL Input */}
                            <div>
                                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2 block">Channel URL</label>
                                <div className="relative">
                                    <input
                                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3.5 pl-11 text-sm text-[var(--text)] focus:border-indigo-500 outline-none transition-all placeholder-[var(--text-muted)]"
                                        value={urlInput}
                                        onChange={e => analyzeLink(e.target.value)}
                                        placeholder="Paste social media URL or email..."
                                        autoFocus
                                    />
                                    <div className="absolute left-3.5 top-3.5 text-[var(--text-muted)]">
                                        {isDetecting ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Globe size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Detected Platform */}
                            {detectedInfo && (
                                <div className="animate-in fade-in duration-200 space-y-4">
                                    <div className="bg-[#222] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[var(--text)] shadow-inner ${getPlatformColor(detectedInfo.platform)}`}>
                                            {getPlatformIcon(detectedInfo.platform)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-semibold">{detectedInfo.name}</h4>
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] capitalize">{detectedInfo.platform}</p>
                                        </div>
                                    </div>

                                    {/* Credentials */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">
                                                {detectedInfo.platform === Platform.WhatsApp ? 'Bot Name' : 'Login Email / ID'}
                                            </label>
                                            <input
                                                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text)] focus:border-indigo-500 outline-none"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder={detectedInfo.platform === Platform.WhatsApp ? "Bot Name" : "email@example.com"}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">
                                                {detectedInfo.platform === Platform.WhatsApp ? 'API Token' : 'Password'}
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text)] focus:border-indigo-500 outline-none"
                                                value={formData.credentials}
                                                onChange={e => setFormData({ ...formData, credentials: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    {/* Owner */}
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                            <UserIcon size={12} /> Assign Owner (Optional)
                                        </label>
                                        <select
                                            value={formData.memberId}
                                            onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text)] focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="">No specific owner</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {!detectedInfo && urlInput && !isDetecting && (
                                <p className="text-center text-[var(--text-muted)] text-sm py-2">Could not detect platform. Check the URL.</p>
                            )}
                        </div>

                        {/* Dialog Footer */}
                        <div className="flex justify-end gap-3 p-5 border-t border-[var(--border)]">
                            <button onClick={resetForm} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!detectedInfo}
                                className="px-5 py-2 bg-indigo-600 text-[var(--text)] text-sm font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Add Channel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Channel Cards ── */}
            {channels.length === 0 && (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <Globe size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium text-[var(--text-muted)]">No channels yet</p>
                    <p className="text-sm mt-1">Add a channel or connect an Instagram account to get started.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {channels.map((channel) => {
                    const ownerName = getOwnerName(channel);
                    const autoConnected = isAutoConnected(channel);

                    return (
                        <div key={channel.id} className="bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border)] transition-all group">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {channel.avatarUrl ? (
                                        <img src={channel.avatarUrl} alt="" className="w-11 h-11 rounded-xl object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[var(--text)] text-lg font-bold ${getPlatformColor(channel.platform)}`}>
                                            {channel.platform === Platform.WhatsApp || channel.platform === Platform.Email
                                                ? getPlatformIcon(channel.platform)
                                                : channel.name?.charAt(0).toUpperCase()
                                            }
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-white font-semibold text-sm truncate">{channel.name}</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] capitalize">{channel.platform}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteChannel(channel.id)}
                                    className="text-[var(--text-muted)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Info rows */}
                            <div className="space-y-2">
                                {channel.email && (
                                    <div className="flex items-center justify-between p-2.5 bg-[var(--bg-card)] rounded-lg text-xs">
                                        <span className="text-[var(--text-muted)]">ID</span>
                                        <span className="text-[var(--text-secondary)] font-mono truncate max-w-[160px]">{channel.email}</span>
                                    </div>
                                )}

                                {channel.credentials && (
                                    <div className="p-2.5 bg-[var(--bg-card)] rounded-lg text-xs">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[var(--text-muted)]">{channel.platform === Platform.WhatsApp ? 'API Token' : 'Password'}</span>
                                            <button onClick={() => toggleCredentials(channel.id)} className="text-[var(--text-muted)] hover:text-indigo-400 transition-colors">
                                                {showCredentials[channel.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                            </button>
                                        </div>
                                        <div className={`text-[var(--text-secondary)] font-mono break-all ${showCredentials[channel.id] ? '' : 'blur-[6px] select-none opacity-50'}`}>
                                            {channel.credentials}
                                        </div>
                                    </div>
                                )}

                                {/* Owner — read-only for auto-connected, hidden if no owner */}
                                {ownerName && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-light)]">
                                        <UserIcon size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Owner</span>
                                        <span className="text-xs text-[var(--text-secondary)] ml-auto">{ownerName}</span>
                                    </div>
                                )}

                                {/* Connection status for Instagram */}
                                {autoConnected && channel.connectionStatus && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-light)]">
                                        <div className={`w-1.5 h-1.5 rounded-full ${channel.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className="text-[10px] text-[var(--text-muted)] capitalize">{channel.connectionStatus.replace(/_/g, ' ')}</span>
                                        <span className="text-[10px] text-[var(--text-muted)] ml-auto">via Instagram OAuth</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ManageChannels;
