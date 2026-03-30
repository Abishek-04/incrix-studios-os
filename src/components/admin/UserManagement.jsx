'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Edit2, Trash2, Shield,
  Mail, Phone, Lock, UserPlus, Check, X,
  ChevronDown, Eye, EyeOff, Upload, Camera
} from 'lucide-react';
import { ROLES, getRoleInfo } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getUserRoles = (user) => {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return Array.from(new Set(user.roles.filter(Boolean)));
  }
  return user?.role ? [user.role] : [];
};

const ALL_ROLES = Object.values(ROLES);

const avatarColors = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
  'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500',
  'bg-cyan-500', 'bg-blue-500',
];

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

const AvatarPreview = ({ user, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };
  const cls = sizes[size] || sizes.md;

  if (user?.profilePhoto) {
    return (
      <img
        src={user.profilePhoto}
        alt={user.name || 'User avatar'}
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${cls} ${user?.avatarColor || 'bg-indigo-500'} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {user?.name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)]',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    danger: 'bg-[var(--danger-light)] text-[var(--danger)] border-transparent',
    muted: 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-light)]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Modal Shell                                                        */
/* ------------------------------------------------------------------ */

const ModalShell = ({ children, onClose, title, subtitle }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <motion.div
      initial={{ scale: 0.97, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.97, opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-lg shadow-2xl my-auto max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[var(--border-light)] flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-input)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Form Field                                                         */
/* ------------------------------------------------------------------ */

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
      {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full bg-[var(--bg-input)] text-[var(--text)] text-sm border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]';
const selectCls = inputCls + ' appearance-none cursor-pointer';

/* ------------------------------------------------------------------ */
/*  Photo Upload Section                                               */
/* ------------------------------------------------------------------ */

const PhotoUploadSection = ({ formData, setFormData }) => (
  <Field label="Profile Photo">
    <div className="flex items-center gap-4">
      {formData.profilePhoto ? (
        <div className="relative group">
          <img
            src={formData.profilePhoto}
            alt="Preview"
            className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border)]"
          />
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, profilePhoto: '' }))}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--danger)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
          <Camera size={20} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] cursor-pointer hover:underline">
          <Upload size={13} />
          Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const dataUrl = await readFileAsDataUrl(file);
                setFormData((p) => ({ ...p, profilePhoto: dataUrl }));
              } catch (err) {
                console.error('Failed to read image:', err);
              }
            }}
          />
        </label>
        <input
          type="url"
          value={formData.profilePhoto}
          onChange={(e) => setFormData((p) => ({ ...p, profilePhoto: e.target.value }))}
          className="text-xs bg-transparent text-[var(--text-muted)] border-none outline-none placeholder:text-[var(--text-muted)]"
          placeholder="or paste URL..."
        />
      </div>
    </div>
  </Field>
);

/* ------------------------------------------------------------------ */
/*  Roles Selection Section                                            */
/* ------------------------------------------------------------------ */

const RolesSection = ({ formData, setFormData }) => (
  <>
    <Field label="Primary Role" required>
      <select
        value={formData.role}
        onChange={(e) => {
          const nextRole = e.target.value;
          setFormData((p) => ({
            ...p,
            role: nextRole,
            roles: Array.from(new Set([nextRole, ...p.roles])),
          }));
        }}
        className={selectCls}
      >
        {ALL_ROLES.map((role) => {
          const info = getRoleInfo(role);
          return <option key={role} value={role}>{info.label} - {info.description}</option>;
        })}
      </select>
    </Field>
    <Field label="Additional Roles">
      <div className="grid grid-cols-2 gap-1.5">
        {ALL_ROLES.map((role) => {
          const info = getRoleInfo(role);
          const checked = formData.roles.includes(role);
          return (
            <label
              key={role}
              className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 cursor-pointer border transition-colors ${
                checked
                  ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--text)]'
                  : 'bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--border)]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? Array.from(new Set([formData.role, ...formData.roles, role]))
                    : formData.roles.filter((r) => r !== role);
                  setFormData((prev) => ({
                    ...prev,
                    roles: next,
                    role: next.includes(prev.role) ? prev.role : (next[0] || prev.role),
                  }));
                }}
                className="sr-only"
              />
              {checked && <Check size={13} className="text-[var(--primary)] flex-shrink-0" />}
              <span className={info.color}>{info.label}</span>
            </label>
          );
        })}
      </div>
    </Field>
  </>
);

/* ------------------------------------------------------------------ */
/*  New User Modal                                                     */
/* ------------------------------------------------------------------ */

const NewUserModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', phoneNumber: '', password: '',
    role: ROLES.DEVELOPER, roles: [ROLES.DEVELOPER],
    isActive: true, avatarColor: 'bg-indigo-500', profilePhoto: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (formData.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (formData.password !== confirmPassword) { setFormError('Passwords do not match.'); return; }
    if (!formData.roles.length) { setFormError('Select at least one role.'); return; }

    const result = await onCreate({
      ...formData,
      role: formData.roles[0],
      id: `user-${Date.now()}`,
      createdAt: Date.now(),
    });
    if (!result?.success) setFormError(result?.error || 'Failed to create user.');
  };

  return (
    <ModalShell onClose={onClose} title="Add New User" subtitle="Create a new team member account">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="John Doe" />
          </Field>
          <Field label="Email" required>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="john@example.com" />
          </Field>
        </div>

        <Field label="Phone Number">
          <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className={inputCls} placeholder="+1 234 567 8900" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password" required>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required minLength={8} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputCls + ' pr-9'} placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password" required>
            <input type={showPw ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Re-enter password" />
          </Field>
        </div>

        <RolesSection formData={formData} setFormData={setFormData} />

        <Field label="Avatar Color">
          <div className="flex flex-wrap gap-2">
            {avatarColors.map((c) => (
              <button key={c} type="button" onClick={() => setFormData({ ...formData, avatarColor: c })}
                className={`w-7 h-7 rounded-full ${c} transition-all ${formData.avatarColor === c ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-card)] scale-110' : 'hover:scale-105'}`}
              />
            ))}
          </div>
        </Field>

        <PhotoUploadSection formData={formData} setFormData={setFormData} />

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text-secondary)]">Set as active user</span>
          <ToggleSwitch checked={formData.isActive} onChange={(v) => setFormData({ ...formData, isActive: v })} />
        </div>

        {formError && (
          <div className="text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-lg px-3 py-2">
            {formError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity">
            Create User
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] text-sm font-medium rounded-lg transition-colors border border-[var(--border)]">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Edit User Modal                                                    */
/* ------------------------------------------------------------------ */

const EditUserModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name, email: user.email || '', phoneNumber: user.phoneNumber || '',
    role: user.role, roles: getUserRoles(user),
    isActive: user.isActive !== false, avatarColor: user.avatarColor || 'bg-indigo-500',
    profilePhoto: user.profilePhoto || '',
  });
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.roles.length) { setFormError('Select at least one role.'); return; }
    setFormError('');
    onUpdate(formData);
  };

  return (
    <ModalShell onClose={onClose} title="Edit User" subtitle={`Update information for ${user.name}`}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Email" required>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <Field label="Phone Number">
          <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className={inputCls} />
        </Field>

        <RolesSection formData={formData} setFormData={setFormData} />

        <Field label="Avatar Color">
          <div className="flex flex-wrap gap-2">
            {avatarColors.map((c) => (
              <button key={c} type="button" onClick={() => setFormData({ ...formData, avatarColor: c })}
                className={`w-7 h-7 rounded-full ${c} transition-all ${formData.avatarColor === c ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-card)] scale-110' : 'hover:scale-105'}`}
              />
            ))}
          </div>
        </Field>

        <PhotoUploadSection formData={formData} setFormData={setFormData} />

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--text-secondary)]">Active user</span>
          <ToggleSwitch checked={formData.isActive} onChange={(v) => setFormData({ ...formData, isActive: v })} />
        </div>

        {formError && (
          <div className="text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-lg px-3 py-2">
            {formError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity">
            Save Changes
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] text-sm font-medium rounded-lg transition-colors border border-[var(--border)]">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Change Password Modal                                              */
/* ------------------------------------------------------------------ */

const ChangePasswordModal = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { user: currentUser } = useAuth();
  const isSelf = (currentUser?.id || currentUser?._id) === (user?.id || user?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSelf && !formData.currentPassword) { setError('Current password is required'); return; }
    if (formData.newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (formData.newPassword !== formData.confirmPassword) { setError('Passwords do not match'); return; }

    setSaving(true);
    const result = await onSubmit({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
    setSaving(false);
    if (!result?.success) setError(result?.error || 'Failed to change password');
  };

  return (
    <ModalShell onClose={onClose} title="Change Password" subtitle={`Update password for ${user.name}`}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {isSelf && (
          <Field label="Current Password">
            <input type="password" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} className={inputCls} placeholder="Enter current password" />
          </Field>
        )}
        <Field label="New Password">
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className={inputCls + ' pr-9'} placeholder="Minimum 8 characters" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password">
          <input type={showPw ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={inputCls} placeholder="Re-enter new password" />
        </Field>

        {error && (
          <div className="text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-opacity">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] text-sm font-medium rounded-lg transition-colors border border-[var(--border)]">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  User Row                                                           */
/* ------------------------------------------------------------------ */

const UserRow = ({ user, isSelected, onSelect, onEdit, onChangePassword, onChangeRole, onToggleActive, onDelete }) => {
  const isActive = user.isActive !== false;
  const userRoles = getUserRoles(user);
  const primaryRoleInfo = getRoleInfo(user.role);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className={`group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
          : 'border-transparent hover:border-[var(--border-light)] hover:bg-[var(--bg-card)]'
      } ${!isActive ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <label className="flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-[var(--primary)] border-[var(--primary)]'
            : 'border-[var(--border)] peer-hover:border-[var(--text-muted)]'
        }`}>
          {isSelected && <Check size={12} className="text-white" />}
        </div>
      </label>

      {/* Avatar */}
      <AvatarPreview user={user} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--text)] truncate">{user.name}</span>
          <Badge className={`${primaryRoleInfo.bgColor} ${primaryRoleInfo.color} border-none`}>
            {primaryRoleInfo.label}
          </Badge>
          {userRoles.length > 1 && userRoles.filter((r) => r !== user.role).map((r) => {
            const info = getRoleInfo(r);
            return (
              <Badge key={r} className={`${info.bgColor} ${info.color} border-none`}>
                {info.label}
              </Badge>
            );
          })}
          {!isActive && <Badge variant="muted">Inactive</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          {user.email && (
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate">
              <Mail size={11} className="flex-shrink-0" />{user.email}
            </span>
          )}
          {user.phoneNumber && (
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Phone size={11} className="flex-shrink-0" />{user.phoneNumber}
            </span>
          )}
        </div>
      </div>

      {/* Inline role change */}
      <div className="hidden sm:block flex-shrink-0">
        <select
          value={user.role}
          onChange={(e) => onChangeRole(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-xs bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-light)] rounded-md px-2 py-1.5 outline-none focus:border-[var(--primary)] cursor-pointer appearance-none"
        >
          {ALL_ROLES.map((role) => {
            const info = getRoleInfo(role);
            return <option key={role} value={role}>{info.label}</option>;
          })}
        </select>
      </div>

      {/* Toggle active */}
      <div className="hidden sm:block flex-shrink-0">
        <ToggleSwitch checked={isActive} onChange={(val) => onToggleActive(val)} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-input)] transition-colors" title="Edit">
          <Edit2 size={15} />
        </button>
        <button onClick={onChangePassword} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors" title="Change Password">
          <Lock size={15} />
        </button>
        <button
          onClick={() => { if (confirm(`Delete "${user.name}"? This moves them to the recycle bin.`)) onDelete(); }}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const UserManagement = ({ users = [], onUpdateUser, onDeleteUser, onCreate, onChangePassword }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const userRoles = getUserRoles(user);
    const matchesRole = filterRole === 'all' || userRoles.includes(filterRole);
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive !== false) ||
      (filterStatus === 'inactive' && user.isActive === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role statistics
  const roleStats = Object.values(ROLES).map((role) => ({
    role,
    count: users.filter((u) => getUserRoles(u).includes(role)).length,
    ...getRoleInfo(role),
  }));

  const handleChangeRole = useCallback((user, newRole) => {
    onUpdateUser(user.id || user._id, { role: newRole, roles: [newRole] });
  }, [onUpdateUser]);

  const handleToggleActive = useCallback((user, isActive) => {
    onUpdateUser(user.id || user._id, { isActive });
  }, [onUpdateUser]);

  const handleBulkAction = async (action) => {
    if (action === 'delete') {
      if (!confirm(`Delete ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}? This action moves them to the recycle bin.`)) return;
    } else if (action === 'deactivate') {
      if (!confirm(`Deactivate ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}?`)) return;
    }
    for (const userId of selectedUsers) {
      if (action === 'activate') await onUpdateUser(userId, { isActive: true });
      else if (action === 'deactivate') await onUpdateUser(userId, { isActive: false });
      else if (action === 'delete') await onDeleteUser(userId);
    }
    setSelectedUsers([]);
  };

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUsers.includes(u.id || u._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id || u._id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-[var(--border-light)] bg-[var(--bg-card)] px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[var(--text)] flex items-center gap-2">
              <Users size={20} className="text-[var(--primary)]" />
              User Management
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {users.length} member{users.length !== 1 ? 's' : ''} &middot; {users.filter((u) => u.isActive !== false).length} active
            </p>
          </div>
          <button
            onClick={() => setShowNewUserModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputCls + ' pl-9'}
            />
          </div>
          <div className="flex gap-2">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectCls + ' w-full sm:w-auto'}>
              <option value="all">All Roles</option>
              {ALL_ROLES.map((role) => <option key={role} value={role}>{getRoleInfo(role).label}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls + ' w-full sm:w-auto'}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Bulk actions bar */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap items-center gap-2 bg-[var(--primary-light)] border border-[var(--primary)] rounded-lg px-3 py-2.5">
                <span className="text-xs font-medium text-[var(--text)]">
                  {selectedUsers.length} selected
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button onClick={() => handleBulkAction('activate')} className="px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--success)] text-white hover:opacity-90 transition-opacity">
                    Activate
                  </button>
                  <button onClick={() => handleBulkAction('deactivate')} className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500 text-white hover:opacity-90 transition-opacity">
                    Deactivate
                  </button>
                  <button onClick={() => handleBulkAction('delete')} className="px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--danger)] text-white hover:opacity-90 transition-opacity">
                    Delete
                  </button>
                  <button onClick={() => setSelectedUsers([])} className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Role stats sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-[var(--border-light)] bg-[var(--bg-card)] p-4 overflow-y-auto gap-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Roles</h3>
          <div className="space-y-1.5">
            {roleStats.map((stat) => (
              <button
                key={stat.role}
                onClick={() => setFilterRole(filterRole === stat.role ? 'all' : stat.role)}
                className={`w-full text-left p-2.5 rounded-lg transition-all ${
                  filterRole === stat.role
                    ? 'bg-[var(--primary-light)] border border-[var(--primary)]'
                    : 'hover:bg-[var(--bg-input)] border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${stat.color}`}>{stat.label}</span>
                  <span className="text-sm font-semibold text-[var(--text)]">{stat.count}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">{stat.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-[var(--border-light)]">
            <div className="text-xs text-[var(--text-muted)] mb-1">Total Members</div>
            <div className="text-2xl font-bold text-[var(--primary)]">{users.length}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {users.filter((u) => u.isActive !== false).length} active &middot; {users.filter((u) => u.isActive === false).length} inactive
            </div>
          </div>
        </aside>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            {/* Select all header */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2 mb-1">
                <label className="flex items-center cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="sr-only peer" />
                  <div className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all ${
                    allSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)] peer-hover:border-[var(--text-muted)]'
                  }`}>
                    {allSelected && <Check size={12} className="text-white" />}
                  </div>
                </label>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  {searchQuery || filterRole !== 'all' || filterStatus !== 'all' ? ' (filtered)' : ''}
                </span>
              </div>
            )}

            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={40} className="text-[var(--text-muted)] mb-3 opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">No users found matching your filters</p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterRole('all'); setFilterStatus('all'); }}
                  className="mt-2 text-xs text-[var(--primary)] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                <AnimatePresence>
                  {filteredUsers.map((user) => {
                    const userId = user.id || user._id;
                    return (
                      <UserRow
                        key={userId}
                        user={user}
                        isSelected={selectedUsers.includes(userId)}
                        onSelect={(selected) => {
                          if (selected) setSelectedUsers([...selectedUsers, userId]);
                          else setSelectedUsers(selectedUsers.filter((id) => id !== userId));
                        }}
                        onEdit={() => setEditingUser(user)}
                        onChangePassword={() => setPasswordUser(user)}
                        onChangeRole={(newRole) => handleChangeRole(user, newRole)}
                        onToggleActive={(isActive) => handleToggleActive(user, isActive)}
                        onDelete={() => onDeleteUser(user)}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewUserModal && (
          <NewUserModal
            onClose={() => setShowNewUserModal(false)}
            onCreate={async (userData) => {
              const result = await onCreate(userData);
              if (result?.success) setShowNewUserModal(false);
              return result;
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUpdate={(updates) => {
              onUpdateUser(editingUser.id || editingUser._id, updates);
              setEditingUser(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {passwordUser && (
          <ChangePasswordModal
            user={passwordUser}
            onClose={() => setPasswordUser(null)}
            onSubmit={async (passwordData) => {
              const response = await onChangePassword?.(passwordUser.id || passwordUser._id, passwordData);
              if (response?.success) setPasswordUser(null);
              return response || { success: false, error: 'Password update failed' };
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
