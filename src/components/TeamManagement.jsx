import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Shield, Mail, Target, Phone, MessageCircle, Bell } from 'lucide-react';
import ConfirmationModal from './ui/ConfirmationModal';
import Toast, { ToastType } from './ui/Toast';

    users: User[];
    projects: Project[];

const TeamManagement = ({ users, projects, onUpdateUsers }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Alert State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Feedback State
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'success'
    });

    // Form State
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        role: 'creator',
        email: '',
        phoneNumber: '',
        notifyViaWhatsapp: false,
        notifyViaEmail: false,
        niche: '',
        quota: { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0, period: 'weekly' }
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ visible: true, message, type });
    };

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (editingId) {
            // Update existing
            const updated = users.map(u => u.id === editingId ? { ...u, ...formData } as User : u);
            onUpdateUsers(updated);
            setEditingId(null);
            showToast('Team member updated successfully.');
        } else {
            // Create new
            const newUser: User = {
                id: `USR-${Date.now()}`,
                name: formData.name,
                role: formData.role as Role,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                notifyViaWhatsapp: formData.notifyViaWhatsapp,
                notifyViaEmail: formData.notifyViaEmail,
                avatarColor: `bg-${['indigo', 'purple', 'emerald', 'amber', 'rose'][Math.floor(Math.random() * 5)]}-500`,
                niche: formData.niche,
                active: true,
                quota: formData.quota || { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0, period: 'weekly' }
            };
            onUpdateUsers([...users, newUser]);
            setIsAdding(false);
            showToast('New team member added successfully.');
        }
        setFormData({ name: '', role: 'creator', email: '', phoneNumber: '', notifyViaWhatsapp: false, notifyViaEmail: false, niche: '', quota: { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0, period: 'weekly' } });
    };

    const startEdit = (user: User) => {
        setEditingId(user.id);
        const defaultQuota = { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0, period: 'weekly' as const };

        // Migrate old data on the fly if needed, or just default to 0
        const currentQuota = user.quota ? {
            youtubeLong: user.quota.youtubeLong || 0,
            youtubeShort: user.quota.youtubeShort || 0,
            instagramReel: user.quota.instagramReel || 0,
            course: user.quota.course || 0,
            period: user.quota.period || 'weekly'
        } : defaultQuota;

        setFormData({
            ...user,
            phoneNumber: user.phoneNumber || '',
            notifyViaWhatsapp: user.notifyViaWhatsapp || false,
            notifyViaEmail: user.notifyViaEmail || false,
            quota: currentQuota
        });
        setIsAdding(true);
    };

    const confirmDelete = (id: string) => {
        setUserToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (userToDelete) {
            onUpdateUsers(users.filter(u => u.id !== userToDelete));
            showToast('User removed from team.');
            setDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    // Calculate metrics for table
    const getMetrics = (userId: string) => {
        // Filter projects assigned to this user that are 'Done'
        // Assuming projects have an 'assignedTo' field or similar. 
        // Based on Dashboard logic it seems calculating based on ALL projects or handling filtering outside?
        // Wait, Dashboard logic filters by `p.channelId`? No, let's look at `Dashboard.tsx` again or `types.ts`.
        // `Project` has `channelId`. Channels have `members`. 
        // However, usually projects are assigned to people. `Project` has `assignedTo` array usually?
        // Let's check `types.ts` again. It has `assignedTo?: string[]`.

        const userProjects = projects.filter(p => p.stage === Stage.Done && (p.assignedTo?.includes(userId)));

        return {
            ytLong: userProjects.filter(p => p.platform === Platform.YouTube && (p.contentFormat === 'LongForm' || !p.contentFormat)).length,
            ytShort: userProjects.filter(p => p.platform === Platform.YouTube && p.contentFormat === 'ShortForm').length,
            igReel: userProjects.filter(p => p.platform === Platform.Instagram).length,
            course: userProjects.filter(p => p.platform === Platform.Course).length
        };
    };

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                title="Remove Team Member"
                message="Are you sure you want to remove this user? This action cannot be undone and they will lose access immediately."
                onConfirm={handleDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
                    <p className="text-[#666]">Manage access, roles, and profiles for your creative team.</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setFormData({
                            name: '',
                            role: 'creator',
                            email: '',
                            phoneNumber: '',
                            notifyViaWhatsapp: false,
                            notifyViaEmail: false,
                            niche: '',
                            quota: { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0, period: 'weekly' }
                        });
                    }}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20">
                    <Plus size={16} /> <span>Add Member</span>
                </button>
            </div>

            {isAdding && (
                <div className="mb-8 bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-xl relative overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-white font-medium mb-4">{editingId ? 'Edit User' : 'New User Details'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#666] uppercase tracking-wider border-b border-[#333] pb-2">Profile</h4>
                            <div className="space-y-1">
                                <label className="text-xs text-[#666]">Full Name</label>
                                <input
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Abishek"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[#666]">Email (Login ID)</label>
                                <input
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@incrix.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[#666]">Phone Number (WhatsApp)</label>
                                <div className="flex items-center bg-[#151515] border border-[#333] rounded-lg px-2 focus-within:border-indigo-500 transition-colors">
                                    <Phone size={14} className="text-[#666]" />
                                    <input
                                        className="w-full bg-transparent border-none p-2 text-sm text-white focus:outline-none"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 pt-2">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.notifyViaWhatsapp}
                                        onChange={e => setFormData({ ...formData, notifyViaWhatsapp: e.target.checked })}
                                        className="w-4 h-4 rounded bg-[#333] border-[#444] text-indigo-500 focus:ring-offset-0 focus:ring-0"
                                    />
                                    <span className="text-xs text-[#ccc] group-hover:text-white transition-colors flex items-center gap-1"><MessageCircle size={12} /> WhatsApp Alerts</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.notifyViaEmail}
                                        onChange={e => setFormData({ ...formData, notifyViaEmail: e.target.checked })}
                                        className="w-4 h-4 rounded bg-[#333] border-[#444] text-indigo-500 focus:ring-offset-0 focus:ring-0"
                                    />
                                    <span className="text-xs text-[#ccc] group-hover:text-white transition-colors flex items-center gap-1"><Mail size={12} /> Email Reports</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-[#666]">Role</label>
                                    <select
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                                    >
                                        <option value="manager">Manager</option>
                                        <option value="creator">Creator</option>
                                        <option value="editor">Editor</option>
                                        <option value="mograph">MoGraph</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#666]">Niche</label>
                                    <input
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        value={formData.niche || ''}
                                        onChange={e => setFormData({ ...formData, niche: e.target.value })}
                                        placeholder="Tech"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quota Settings */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#666] uppercase tracking-wider border-b border-[#333] pb-2 flex items-center"><Target size={12} className="mr-1" /> Output Targets</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-[#666]">YT Long</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        value={formData.quota?.youtubeLong || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, youtubeLong: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#666]">YT Shorts</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        value={formData.quota?.youtubeShort || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, youtubeShort: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#666]">IG Reels</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        value={formData.quota?.instagramReel || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, instagramReel: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#666]">Course</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        value={formData.quota?.course || 0}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quota: { ...formData.quota!, course: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[#666]">Frequency</label>
                                <select
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
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
                    <div className="flex space-x-3 pt-2 border-t border-[#2f2f2f]">
                        <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20">
                            <Save size={14} /> <span>Save Profile</span>
                        </button>
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-[#252525] text-[#ccc] text-sm rounded-lg hover:bg-[#333] transition-colors border border-[#333]">Cancel</button>
                    </div>
                </div>
            )}

            <div className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#191919] border-b border-[#2f2f2f]">
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider">User</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider">Contact</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider text-center">YT Long</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider text-center">YT Shorts</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider text-center">IG Reels</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider text-center">Course</th>
                            <th className="p-4 text-xs font-bold text-[#666] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2f2f2f]">
                        {users.map(user => {
                            const metrics = getMetrics(user.id);
                            const q = user.quota || { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0 };

                            return (
                                <tr key={user.id} className="group hover:bg-[#252525] transition-colors duration-150">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.avatarColor} shadow-md`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-[#666]">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            {user.notifyViaWhatsapp && (
                                                <div className="text-emerald-500 bg-emerald-500/10 p-1 rounded border border-emerald-500/20" title={user.phoneNumber}>
                                                    <MessageCircle size={14} />
                                                </div>
                                            )}
                                            {user.notifyViaEmail && (
                                                <div className="text-indigo-500 bg-indigo-500/10 p-1 rounded border border-indigo-500/20">
                                                    <Mail size={14} />
                                                </div>
                                            )}
                                            {!user.notifyViaEmail && !user.notifyViaWhatsapp && (
                                                <span className="text-[#999] text-xs italic">No alerts</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize border
                                        ${user.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                user.role === 'creator' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    user.role === 'editor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
                                            {user.role}
                                        </span>
                                    </td>

                                    {/* Metrics Columns */}
                                    <td className="p-4 text-center">
                                        <div className="text-xs font-mono">
                                            <span className={metrics.ytLong >= (q.youtubeLong || 0) && (q.youtubeLong || 0) > 0 ? "text-emerald-400" : "text-white"}>{metrics.ytLong}</span>
                                            <span className="text-[#999]">/{q.youtubeLong || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-xs font-mono">
                                            <span className={metrics.ytShort >= (q.youtubeShort || 0) && (q.youtubeShort || 0) > 0 ? "text-emerald-400" : "text-white"}>{metrics.ytShort}</span>
                                            <span className="text-[#999]">/{q.youtubeShort || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-xs font-mono">
                                            <span className={metrics.igReel >= (q.instagramReel || 0) && (q.instagramReel || 0) > 0 ? "text-emerald-400" : "text-white"}>{metrics.igReel}</span>
                                            <span className="text-[#999]">/{q.instagramReel || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-xs font-mono">
                                            <span className={metrics.course >= (q.course || 0) && (q.course || 0) > 0 ? "text-emerald-400" : "text-white"}>{metrics.course}</span>
                                            <span className="text-[#999]">/{q.course || 0}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(user)} className="p-1.5 text-[#666] hover:text-white bg-[#2a2a2a] hover:bg-[#333] rounded border border-transparent hover:border-[#444] transition-all">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => confirmDelete(user.id)} className="p-1.5 text-[#666] hover:text-rose-500 bg-[#2a2a2a] hover:bg-[#333] rounded border border-transparent hover:border-rose-900/30 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamManagement;