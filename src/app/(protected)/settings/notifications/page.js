'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchWithAuth, logout as apiLogout } from '@/services/api';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  User, Sun, Moon, LogOut, Shield, Bell, Palette, Camera,
  Save, Check, ChevronRight, Lock, Mail, Globe
} from 'lucide-react';

const ease = [0.23, 1, 0.32, 1];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const fileRef = useRef(null);

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phoneNumber || '');
    setAvatarColor(user.avatarColor || 'bg-indigo-500');
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, phoneNumber: phone, avatarColor })
      });
      if (res.ok) {
        setSaved(true);
        refreshUser?.();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    setPassError('');
    setPassSuccess('');
    if (!currentPass || !newPass) { setPassError('Fill in all fields'); return; }
    if (newPass !== confirmPass) { setPassError('New passwords do not match'); return; }
    if (newPass.length < 8) { setPassError('Password must be at least 8 characters'); return; }

    try {
      const res = await fetchWithAuth(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      if (res.ok) {
        setPassSuccess('Password changed successfully');
        setCurrentPass(''); setNewPass(''); setConfirmPass('');
      } else {
        const data = await res.json();
        setPassError(data.error || 'Failed to change password');
      }
    } catch { setPassError('Failed to change password'); }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await apiLogout();
      router.push('/');
    }
  };

  const AVATAR_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-slate-500',
  ];

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: Lock },
  ];

  if (!user) return <LoadingScreen />;

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-[14px] font-medium outline-none transition-all";

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>Manage your profile, appearance, and account</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {sections.map(s => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all"
                  style={{ background: active ? 'var(--primary)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)' }}>
                  <Icon size={16} /> {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {/* ── PROFILE ──────────────────────────────────────────── */}
          {activeSection === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease }}
              className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>Profile</h2>

              {/* Avatar with photo upload */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl ${avatarColor}`}>
                      {name?.charAt(0) || '?'}
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Camera size={20} className="text-white" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
                    // Resize to 200x200 to keep base64 small
                    const img = new Image();
                    img.onload = async () => {
                      const canvas = document.createElement('canvas');
                      const size = 200;
                      canvas.width = size;
                      canvas.height = size;
                      const ctx = canvas.getContext('2d');
                      // Crop to square center
                      const minDim = Math.min(img.width, img.height);
                      const sx = (img.width - minDim) / 2;
                      const sy = (img.height - minDim) / 2;
                      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                      try {
                        const res = await fetchWithAuth(`/api/users/${user.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ updates: { profilePhoto: dataUrl } })
                        });
                        if (res.ok) { refreshUser?.(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
                        else { const d = await res.json(); alert(d.error || 'Failed to upload'); }
                      } catch (err) { console.error(err); alert('Failed to upload photo'); }
                    };
                    img.src = URL.createObjectURL(file);
                    e.target.value = '';
                  }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{name}</p>
                  <p className="text-[12px] capitalize" style={{ color: 'var(--text-muted)' }}>{user.role}</p>
                  <button onClick={() => fileRef.current?.click()} className="text-[11px] font-medium mt-1" style={{ color: 'var(--primary)' }}>
                    Change photo
                  </button>
                </div>
              </div>

              {/* Avatar color picker */}
              <div>
                <label className="text-[12px] font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)}
                      className={`w-8 h-8 rounded-lg ${c} transition-all ${avatarColor === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                      style={{ ringColor: 'var(--primary)', ringOffsetColor: 'var(--bg-card)' }} />
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inputCls}
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`}
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Contact admin to change email</p>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls}
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              </div>

              {/* Save */}
              <button onClick={handleSaveProfile} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all"
                style={{ background: saved ? 'var(--success)' : 'var(--primary)' }}>
                {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> {loading ? 'Saving...' : 'Save Changes'}</>}
              </button>
            </motion.div>
          )}

          {/* ── APPEARANCE ────────────────────────────────────────── */}
          {activeSection === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease }}
              className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>Appearance</h2>

              {/* Theme toggle */}
              <div>
                <label className="text-[12px] font-semibold block mb-3" style={{ color: 'var(--text-secondary)' }}>Theme</label>
                <div className="flex gap-3">
                  <button onClick={() => { if (theme === 'dark') toggleTheme(); }}
                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                    style={{ borderColor: theme === 'light' ? 'var(--primary)' : 'var(--border)', background: theme === 'light' ? 'var(--primary-light)' : 'var(--bg-input)' }}>
                    <Sun size={24} style={{ color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span className="text-[13px] font-semibold" style={{ color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)' }}>Light</span>
                  </button>
                  <button onClick={() => { if (theme === 'light') toggleTheme(); }}
                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                    style={{ borderColor: theme === 'dark' ? 'var(--primary)' : 'var(--border)', background: theme === 'dark' ? 'var(--primary-light)' : 'var(--bg-input)' }}>
                    <Moon size={24} style={{ color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span className="text-[13px] font-semibold" style={{ color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)' }}>Dark</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Theme preference is saved locally and persists across sessions.</p>
              </div>
            </motion.div>
          )}

          {/* ── SECURITY ──────────────────────────────────────────── */}
          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease }}
              className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>Change Password</h2>

              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
                <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} className={inputCls}
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputCls}
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls}
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              </div>

              {passError && <p className="text-[12px] font-medium" style={{ color: 'var(--danger)' }}>{passError}</p>}
              {passSuccess && <p className="text-[12px] font-medium" style={{ color: 'var(--success)' }}>{passSuccess}</p>}

              <button onClick={handleChangePassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white"
                style={{ background: 'var(--primary)' }}>
                <Shield size={15} /> Update Password
              </button>
            </motion.div>
          )}

          {/* ── ACCOUNT ───────────────────────────────────────────── */}
          {activeSection === 'account' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease }}
              className="space-y-4">
              {/* Account info */}
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text)' }}>Account Info</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Name</span>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{user.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Email</span>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Role</span>
                    <span className="text-[13px] font-semibold capitalize" style={{ color: 'var(--text)' }}>{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Member Since</span>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign out */}
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text)' }}>Sign Out</h2>
                <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>Sign out of your account on this device.</p>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                  style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)30' }}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
