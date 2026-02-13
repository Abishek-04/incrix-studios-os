
import React, { useState } from 'react';
import { User, Role, Project, Channel } from '../types';
import { X, Save, Download, User as UserIcon, Mail, Phone, Bell, Shield } from 'lucide-react';

interface SettingsModalProps {
    user: User;
    projects: Project[];
    channels: Channel[];
    users: User[];
    onClose: () => void;
    onUpdateUser: (updatedUser: User) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, projects, channels, users, onClose, onUpdateUser }) => {
    const [formData, setFormData] = useState<Partial<User>>({ ...user });

    const handleSave = () => {
        onUpdateUser({ ...user, ...formData } as User);
        onClose();
    };

    const handleExport = () => {
        const data = {
            timestamp: new Date().toISOString(),
            currentUser: user,
            studioStats: {
                totalProjects: projects.length,
                totalChannels: channels.length,
                totalUsers: users.length
            },
            projects: projects,
            channels: channels, // Exclude passwords in a real app, keeping for proto
            users: users
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incrix_studio_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#191919] border border-[#2f2f2f] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#2f2f2f] flex justify-between items-center bg-[#1e1e1e]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserIcon size={20} className="text-indigo-400" /> Settings & Profile
                    </h2>
                    <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Profile Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider border-b border-[#333] pb-2">My Profile</h3>
                        <div className="flex items-start gap-6">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${formData.avatarColor} shadow-lg shrink-0`}>
                                {formData.name?.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-[#888]">Display Name</label>
                                    <input
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[#888]">Email</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3 top-3 text-[#999]" />
                                            <input
                                                className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 pl-9 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[#888]">Phone</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-3 text-[#999]" />
                                            <input
                                                className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 pl-9 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                                value={formData.phoneNumber}
                                                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quota Settings (Only for Creators) */}
                    {(user.role === 'creator' || user.role === 'manager') && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider border-b border-[#333] pb-2">Target Quotas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-[#888]">YouTube Long Form</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.quota?.youtubeLong || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, youtubeLong: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#888]">YouTube Shorts</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.quota?.youtubeShort || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, youtubeShort: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#888]">Instagram Reels</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.quota?.instagramReel || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, instagramReel: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#888]">Course Lectures</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.quota?.course || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, course: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-[#888]">Period</label>
                                    <select
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.quota?.period || 'weekly'}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, period: e.target.value as 'weekly' | 'monthly' }
                                        })}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Notifications */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider border-b border-[#333] pb-2">Notifications</h3>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-[#222] border border-[#2f2f2f] cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.notifyViaWhatsapp}
                                    onChange={e => setFormData({ ...formData, notifyViaWhatsapp: e.target.checked })}
                                    className="w-5 h-5 rounded bg-[#1a1a1a] border-[#444] text-indigo-500 focus:ring-0"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white block">WhatsApp Alerts</span>
                                    <span className="text-xs text-[#666]">Receive urgent updates and approvals via WhatsApp.</span>
                                </div>
                            </label>
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-[#222] border border-[#2f2f2f] cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.notifyViaEmail}
                                    onChange={e => setFormData({ ...formData, notifyViaEmail: e.target.checked })}
                                    className="w-5 h-5 rounded bg-[#1a1a1a] border-[#444] text-indigo-500 focus:ring-0"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white block">Email Digests</span>
                                    <span className="text-xs text-[#666]">Receive weekly performance summaries and reports.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider border-b border-[#333] pb-2">Data & Privacy</h3>
                        <div className="flex items-center justify-between p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
                            <div>
                                <h4 className="text-indigo-400 font-medium text-sm mb-1">Export Studio Data</h4>
                                <p className="text-xs text-indigo-300/70">Download a full JSON backup of all projects, users, and settings.</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                            >
                                <Download size={16} /> <span>Export JSON</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#2f2f2f] bg-[#1e1e1e] flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-[#ccc] hover:text-white bg-[#252525] hover:bg-[#333] rounded-lg transition-colors border border-[#333]">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-900/20">
                        <Save size={16} /> <span>Save Changes</span>
                    </button>
                </div>
            </div >
        </div >
    );
};

export default SettingsModal;
