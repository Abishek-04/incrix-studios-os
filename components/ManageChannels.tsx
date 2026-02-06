import React, { useState } from 'react';
import { Channel, Platform, User } from '../types';
import { Plus, Trash2, Tv, Eye, EyeOff, Save, X, Globe, Share2, Link as LinkIcon, Loader2, CheckCircle2, MessageCircle, Mail, User as UserIcon } from 'lucide-react';

interface ManageChannelsProps {
    channels: Channel[];
    users: User[];
    onUpdateChannels: (channels: Channel[]) => void;
}

const ManageChannels: React.FC<ManageChannelsProps> = ({ channels, users, onUpdateChannels }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

    const [urlInput, setUrlInput] = useState('');
    const [detectedInfo, setDetectedInfo] = useState<{ platform: Platform; name: string } | null>(null);

    const [formData, setFormData] = useState<{ email: string; credentials: string; memberId: string }>({
        email: '',
        credentials: '',
        memberId: '' // Default to unassigned
    });

    const resetForm = () => {
        setIsAdding(false);
        setDetectedInfo(null);
        setUrlInput('');
        setFormData({ email: '', credentials: '', memberId: '' });
        setIsDetecting(false);
    };

    const analyzeLink = (url: string) => {
        setUrlInput(url);
        if (!url) {
            setDetectedInfo(null);
            return;
        }

        setIsDetecting(true);

        // Simulate network delay for "fetching" look and feel
        setTimeout(() => {
            let platform: Platform | null = null;
            let name = 'Unknown Channel';
            const cleanUrl = url.toLowerCase();

            // Regex Detectors
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
                // Heuristic for Email input
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
        }, 800);
    };

    const handleSave = () => {
        if (!detectedInfo) return;

        const newChannel: Channel = {
            id: `CH-${Date.now()}`,
            platform: detectedInfo.platform,
            name: detectedInfo.name,
            link: urlInput,
            email: formData.email,
            credentials: formData.credentials,
            memberId: formData.memberId || undefined
        };

        onUpdateChannels([...channels, newChannel]);
        resetForm();
    };

    const handleUpdateChannelMember = (channelId: string, memberId: string) => {
        const updatedChannels = channels.map(c =>
            c.id === channelId ? { ...c, memberId: memberId || undefined } : c
        );
        onUpdateChannels(updatedChannels);
    };

    const deleteChannel = (id: string) => {
        if (confirm('Delete this channel?')) {
            onUpdateChannels(channels.filter(c => c.id !== id));
        }
    };

    const toggleCredentials = (id: string) => {
        setShowCredentials(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getPlatformIcon = (platform: Platform) => {
        switch (platform) {
            case Platform.WhatsApp: return <MessageCircle size={18} />;
            case Platform.Email: return <Mail size={18} />;
            default: return <Globe size={18} />;
        }
    };

    const getPlatformColor = (platform: Platform) => {
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
                    <h1 className="text-3xl font-bold text-white mb-2">Channel & Integrations</h1>
                    <p className="text-[#666]">Manage social accounts and notification gateways.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20">
                    <Plus size={16} /> <span>Add Connection</span>
                </button>
            </div>

            {isAdding && (
                <div className="mb-8 bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-xl animate-in zoom-in-95 duration-200 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                                <LinkIcon size={20} />
                            </div>
                            <h3 className="text-white font-medium text-lg">Add New Connection</h3>
                        </div>
                        <button onClick={resetForm} className="text-[#666] hover:text-white transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-6">
                        {/* 1. Link Input */}
                        <div className="relative">
                            <input
                                className="w-full bg-[#151515] border border-[#333] rounded-xl p-4 pl-12 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder-[#555]"
                                value={urlInput}
                                onChange={e => analyzeLink(e.target.value)}
                                placeholder="Paste URL (Social Profile, WhatsApp Group Link) or Email Address"
                                autoFocus
                            />
                            <div className="absolute left-4 top-4 text-[#555]">
                                {isDetecting ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Globe size={18} />}
                            </div>
                        </div>

                        {/* 2. Detected Card Preview */}
                        {detectedInfo && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-[#252525] border border-[#333] rounded-xl p-4 flex items-center space-x-4 mb-6">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-inner ${getPlatformColor(detectedInfo.platform)}`}>
                                        {getPlatformIcon(detectedInfo.platform)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-white font-bold text-lg">{detectedInfo.name}</h3>
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <p className="text-xs text-[#888] capitalize">{detectedInfo.platform} &bull; Ready to connect</p>
                                    </div>
                                </div>

                                {/* 3. Credentials Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#151515] rounded-xl border border-[#2a2a2a]">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#888] uppercase tracking-wide">
                                            {detectedInfo.platform === Platform.WhatsApp ? 'Phone Number ID / Bot Name' : 'Login Email / ID'}
                                        </label>
                                        <input
                                            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder={detectedInfo.platform === Platform.WhatsApp ? "Incrix Bot 01" : "admin@brand.com"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#888] uppercase tracking-wide">
                                            {detectedInfo.platform === Platform.WhatsApp ? 'API Key / Access Token' : 'Password / Token'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                value={formData.credentials}
                                                onChange={e => setFormData({ ...formData, credentials: e.target.value })}
                                                placeholder="••••••••••••"
                                            />
                                        </div>
                                    </div>

                                    {/* 4. Assign Team Member Header */}
                                    <div className="space-y-2 md:col-span-2 pt-2 border-t border-[#2a2a2a]">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <UserIcon size={14} className="text-[#888]" />
                                            <label className="text-xs font-medium text-[#888] uppercase tracking-wide">
                                                Assign Ownership (Optional)
                                            </label>
                                        </div>
                                        <select
                                            value={formData.memberId}
                                            onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                                            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="">No specific owner</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={!formData.email && detectedInfo.platform !== Platform.WhatsApp}
                                        className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-105">
                                        Save & Connect
                                    </button>
                                </div>
                            </div>
                        )}

                        {!detectedInfo && urlInput && !isDetecting && (
                            <div className="text-center py-4 text-[#666] text-sm animate-in fade-in">
                                Could not auto-detect platform. Ensure the link is valid (e.g., chat.whatsapp.com/...)
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map(channel => (
                    <div key={channel.id} className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-xl p-5 hover:border-[#444] transition-all group hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                                {/* Simulated Avatar based on name initial */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg ${getPlatformColor(channel.platform)}`}>
                                    {channel.platform === Platform.WhatsApp || channel.platform === Platform.Email ?
                                        getPlatformIcon(channel.platform) :
                                        channel.name.charAt(0).toUpperCase()
                                    }
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-white font-bold text-base truncate pr-2">{channel.name}</h3>
                                    <div className="text-xs text-[#666] capitalize flex items-center gap-1 hover:text-indigo-400 transition-colors truncate">
                                        {channel.platform}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteChannel(channel.id)} className="text-[#444] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 bg-[#252525] p-2 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg border border-[#2a2a2a] group/item hover:border-[#333] transition-colors">
                                <span className="text-xs font-medium text-[#666]">{channel.platform === Platform.WhatsApp ? 'Bot Name' : 'ID'}</span>
                                <span className="text-xs text-[#ccc] font-mono select-all hover:text-white transition-colors cursor-copy truncate max-w-[120px]">{channel.email}</span>
                            </div>

                            {channel.credentials && (
                                <div className="p-3 bg-[#151515] rounded-lg border border-[#2a2a2a] relative hover:border-[#333] transition-colors">
                                    <div className="flex items-center justify-between mb-2 border-b border-[#222] pb-2">
                                        <span className="text-xs font-medium text-[#666]">{channel.platform === Platform.WhatsApp ? 'API Token' : 'Password'}</span>
                                        <button onClick={() => toggleCredentials(channel.id)} className="text-[#555] hover:text-indigo-400 transition-colors">
                                            {showCredentials[channel.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    <div className={`text-xs text-[#ccc] font-mono break-all ${showCredentials[channel.id] ? '' : 'blur-[6px] select-none opacity-60'}`}>
                                        {channel.credentials}
                                    </div>
                                </div>
                            )}

                            {/* Assigned Member Display/Edit */}
                            <div className="pt-2 border-t border-[#2a2a2a]">
                                <div className="flex items-center space-x-2 mb-1">
                                    <UserIcon size={12} className="text-[#555]" />
                                    <span className="text-[10px] text-[#666] uppercase tracking-wide">Owner</span>
                                </div>
                                <select
                                    className="w-full bg-[#151515] text-[#ccc] text-xs border border-[#2a2a2a] rounded p-1.5 focus:border-[#444] outline-none"
                                    value={channel.memberId || ''}
                                    onChange={(e) => handleUpdateChannelMember(channel.id, e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ManageChannels;