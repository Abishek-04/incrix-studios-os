'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Edit2, Trash2, Shield,
  Mail, Phone, Calendar, Activity, Check, X, MoreHorizontal,
  UserPlus, Lock, Unlock, Archive, RefreshCw
} from 'lucide-react';
import { ROLES, getRoleInfo } from '@/config/permissions';

const UserManagement = ({ users = [], onUpdateUser, onDeleteUser, onCreate}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive !== false) ||
      (filterStatus === 'inactive' && user.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get role statistics
  const roleStats = Object.values(ROLES).map(role => ({
    role,
    count: users.filter(u => u.role === role).length,
    ...getRoleInfo(role)
  }));

  const handleToggleUserStatus = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      onUpdateUser(userId, { isActive: !user.isActive });
    }
  };

  const handleChangeRole = (userId, newRole) => {
    onUpdateUser(userId, { role: newRole });
  };

  const handleBulkAction = (action) => {
    selectedUsers.forEach(userId => {
      if (action === 'activate') {
        onUpdateUser(userId, { isActive: true });
      } else if (action === 'deactivate') {
        onUpdateUser(userId, { isActive: false });
      } else if (action === 'delete') {
        onDeleteUser(userId);
      }
    });
    setSelectedUsers([]);
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1f1f1f] bg-[#151515] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Shield className="text-indigo-400" size={28} />
              User Management
            </h1>
            <p className="text-sm text-[#999]">Manage team members, roles & permissions</p>
          </div>

          <button
            onClick={() => setShowNewUserModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white text-sm border border-[#2f2f2f] rounded-lg pl-10 pr-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-[#1a1a1a] text-white text-sm border border-[#2f2f2f] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            {Object.values(ROLES).map(role => {
              const roleInfo = getRoleInfo(role);
              return <option key={role} value={role}>{roleInfo.label}</option>;
            })}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#1a1a1a] text-white text-sm border border-[#2f2f2f] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3"
          >
            <span className="text-sm text-white font-medium">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded transition-colors"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="ml-auto text-xs text-[#999] hover:text-white"
            >
              Clear selection
            </button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Role Stats Sidebar */}
        <div className="w-64 border-r border-[#1f1f1f] bg-[#151515] p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">Team by Role</h3>
          <div className="space-y-2">
            {roleStats.map(stat => (
              <div
                key={stat.role}
                className={`p-3 rounded-lg border ${stat.borderColor} ${stat.bgColor} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => setFilterRole(stat.role)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${stat.color}`}>{stat.label}</span>
                  <span className="text-lg font-bold text-white">{stat.count}</span>
                </div>
                <p className="text-xs text-[#999]">{stat.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg">
            <div className="text-sm text-white font-medium mb-1">Total Users</div>
            <div className="text-2xl font-bold text-indigo-400">{users.length}</div>
            <div className="text-xs text-[#999] mt-1">
              {users.filter(u => u.isActive !== false).length} active
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-[#666]">
                No users found matching your filters
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    onEdit={() => setEditingUser(user)}
                    onToggleStatus={() => handleToggleUserStatus(user.id)}
                    onChangeRole={(newRole) => handleChangeRole(user.id, newRole)}
                    onDelete={() => onDeleteUser(user.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New User Modal */}
      <AnimatePresence>
        {showNewUserModal && (
          <NewUserModal
            onClose={() => setShowNewUserModal(false)}
            onCreate={(userData) => {
              onCreate(userData);
              setShowNewUserModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUpdate={(updates) => {
              onUpdateUser(editingUser.id, updates);
              setEditingUser(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// User Card Component
const UserCard = ({ user, isSelected, onSelect, onEdit, onToggleStatus, onChangeRole, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const roleInfo = getRoleInfo(user.role);
  const isActive = user.isActive !== false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`bg-[#151515] border ${isSelected ? 'border-indigo-500' : 'border-[#1f1f1f]'} rounded-lg p-4 hover:border-[#2f2f2f] transition-all ${!isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 rounded bg-[#1a1a1a] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
        />

        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full ${user.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-white text-lg font-bold`}>
          {user.name?.charAt(0).toUpperCase() || '?'}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">{user.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded ${roleInfo.bgColor} ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
            {!isActive && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-[#999]">
            {user.email && (
              <div className="flex items-center gap-1">
                <Mail size={12} />
                {user.email}
              </div>
            )}
            {user.phoneNumber && (
              <div className="flex items-center gap-1">
                <Phone size={12} />
                {user.phoneNumber}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <select
            value={user.role}
            onChange={(e) => onChangeRole(e.target.value)}
            className="bg-[#1a1a1a] text-white text-xs border border-[#2f2f2f] rounded px-2 py-1 outline-none focus:border-indigo-500"
            onClick={(e) => e.stopPropagation()}
          >
            {Object.values(ROLES).map(role => {
              const info = getRoleInfo(role);
              return <option key={role} value={role}>{info.label}</option>;
            })}
          </select>

          <button
            onClick={onToggleStatus}
            className={`p-2 rounded transition-colors ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
            }`}
            title={isActive ? 'Deactivate User' : 'Activate User'}
          >
            {isActive ? <Unlock size={16} /> : <Lock size={16} />}
          </button>

          <button
            onClick={onEdit}
            className="p-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#999] hover:text-white rounded transition-colors"
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={onDelete}
            className="p-2 bg-[#1a1a1a] hover:bg-rose-500/20 text-[#999] hover:text-rose-400 rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// New User Modal Component
const NewUserModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: ROLES.DEVELOPER,
    isActive: true,
    avatarColor: 'bg-indigo-500'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      id: `user-${Date.now()}`,
      createdAt: Date.now()
    });
  };

  const avatarColors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500',
    'bg-cyan-500', 'bg-blue-500'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg w-full max-w-md"
      >
        <div className="p-6 border-b border-[#2f2f2f]">
          <h2 className="text-xl font-bold text-white">Add New User</h2>
          <p className="text-sm text-[#999] mt-1">Create a new team member account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            >
              {Object.values(ROLES).map(role => {
                const info = getRoleInfo(role);
                return (
                  <option key={role} value={role}>
                    {info.label} - {info.description}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Avatar Color</label>
            <div className="flex flex-wrap gap-2">
              {avatarColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarColor: color })}
                  className={`w-8 h-8 rounded-full ${color} ${
                    formData.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0d0d0d] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <label htmlFor="isActive" className="text-sm text-white">
              Set as active user
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Create User
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#252525] hover:bg-[#333] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Edit User Modal Component (similar to NewUserModal but for editing)
const EditUserModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    isActive: user.isActive !== false,
    avatarColor: user.avatarColor || 'bg-indigo-500'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const avatarColors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500',
    'bg-cyan-500', 'bg-blue-500'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg w-full max-w-md"
      >
        <div className="p-6 border-b border-[#2f2f2f]">
          <h2 className="text-xl font-bold text-white">Edit User</h2>
          <p className="text-sm text-[#999] mt-1">Update user information and permissions</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            >
              {Object.values(ROLES).map(role => {
                const info = getRoleInfo(role);
                return (
                  <option key={role} value={role}>
                    {info.label} - {info.description}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Avatar Color</label>
            <div className="flex flex-wrap gap-2">
              {avatarColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarColor: color })}
                  className={`w-8 h-8 rounded-full ${color} ${
                    formData.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0d0d0d] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <label htmlFor="isActive" className="text-sm text-white">
              Active user
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#252525] hover:bg-[#333] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UserManagement;
