'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, Check, X, Users, RefreshCw } from 'lucide-react';
import { ROLES, getRoleInfo } from '@/config/permissions';

/**
 * Development Account Switcher
 * Quick toggle between user roles for testing
 * Only visible in development mode
 */

// Predefined test accounts for each role
const TEST_ACCOUNTS = [
  {
    id: 'user-superadmin-1',
    name: 'Alex Rodriguez',
    email: 'alex@incrixstudios.com',
    role: ROLES.SUPER_ADMIN,
    avatarColor: 'bg-purple-500',
    phoneNumber: '+1 234 567 8901',
    isActive: true,
    notifyViaWhatsapp: true,
    createdAt: Date.now() - 86400000 * 365 // 1 year ago
  },
  {
    id: 'user-manager-1',
    name: 'Sarah Johnson',
    email: 'sarah@incrixstudios.com',
    role: ROLES.MANAGER,
    avatarColor: 'bg-indigo-500',
    phoneNumber: '+1 234 567 8902',
    isActive: true,
    notifyViaWhatsapp: true,
    createdAt: Date.now() - 86400000 * 180 // 6 months ago
  },
  {
    id: 'user-creator-1',
    name: 'Mike Chen',
    email: 'mike@incrixstudios.com',
    role: ROLES.CREATOR,
    avatarColor: 'bg-emerald-500',
    phoneNumber: '+1 234 567 8903',
    isActive: true,
    notifyViaWhatsapp: false,
    createdAt: Date.now() - 86400000 * 90 // 3 months ago
  },
  {
    id: 'user-editor-1',
    name: 'Emma Wilson',
    email: 'emma@incrixstudios.com',
    role: ROLES.EDITOR,
    avatarColor: 'bg-amber-500',
    phoneNumber: '+1 234 567 8904',
    isActive: true,
    notifyViaWhatsapp: true,
    createdAt: Date.now() - 86400000 * 60 // 2 months ago
  },
  {
    id: 'user-designer-1',
    name: 'David Kim',
    email: 'david@incrixstudios.com',
    role: ROLES.DESIGNER,
    avatarColor: 'bg-pink-500',
    phoneNumber: '+1 234 567 8905',
    isActive: true,
    notifyViaWhatsapp: false,
    createdAt: Date.now() - 86400000 * 45 // 1.5 months ago
  },
  {
    id: 'user-developer-1',
    name: 'Lisa Patel',
    email: 'lisa@incrixstudios.com',
    role: ROLES.DEVELOPER,
    avatarColor: 'bg-cyan-500',
    phoneNumber: '+1 234 567 8906',
    isActive: true,
    notifyViaWhatsapp: true,
    createdAt: Date.now() - 86400000 * 30 // 1 month ago
  }
];

const AccountSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                        process.env.NEXT_PUBLIC_ENV === 'development';

  useEffect(() => {
    // Load current user from localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    } else {
      // Default to Super Admin for testing
      switchToAccount(TEST_ACCOUNTS[0]);
    }
  }, []);

  const switchToAccount = (account) => {
    // Save to localStorage
    localStorage.setItem('auth_user', JSON.stringify(account));
    setCurrentUser(account);
    setIsOpen(false);

    // Trigger a page reload to apply new permissions
    window.location.reload();
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isDevelopment || !isVisible) {
    // Show a small toggle button to bring it back if hidden
    if (!isDevelopment) return null;

    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg transition-all"
        title="Show Account Switcher"
      >
        <Users size={20} />
      </button>
    );
  }

  const roleInfo = currentUser ? getRoleInfo(currentUser.role) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 transition-all ${
          roleInfo
            ? `${roleInfo.bgColor} ${roleInfo.borderColor} ${roleInfo.color}`
            : 'bg-gray-800 border-gray-600 text-white'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor} flex items-center justify-center text-white text-sm font-bold`}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold">DEV MODE</div>
            <div className="text-xs opacity-80">
              {currentUser ? currentUser.name : 'Select Account'}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 w-80 bg-[#1a1a1a] border-2 border-purple-500/50 rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-white" />
                <div>
                  <div className="text-white font-bold">Account Switcher</div>
                  <div className="text-xs text-purple-200">Development Only</div>
                </div>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Hide (click users icon to show again)"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Current Account */}
            {currentUser && (
              <div className="p-4 bg-[#151515] border-b border-[#2f2f2f]">
                <div className="text-xs text-[#666] mb-2">Currently logged in as:</div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${currentUser.avatarColor} flex items-center justify-center text-white font-bold`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{currentUser.name}</div>
                    <div className="text-xs text-[#999]">{currentUser.email}</div>
                    <div className={`text-xs px-2 py-0.5 rounded ${roleInfo.bgColor} ${roleInfo.color} inline-block mt-1`}>
                      {roleInfo.label}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account List */}
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs text-[#666] px-2 py-1 mb-1">Switch to:</div>
                {TEST_ACCOUNTS.map((account) => {
                  const accountRoleInfo = getRoleInfo(account.role);
                  const isCurrent = currentUser?.id === account.id;

                  return (
                    <button
                      key={account.id}
                      onClick={() => switchToAccount(account)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isCurrent
                          ? `${accountRoleInfo.bgColor} ${accountRoleInfo.borderColor} border`
                          : 'hover:bg-[#252525]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${account.avatarColor} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-white font-medium text-sm flex items-center gap-2">
                          {account.name}
                          {isCurrent && <Check size={14} className={accountRoleInfo.color} />}
                        </div>
                        <div className="text-xs text-[#999] truncate">{account.email}</div>
                        <div className={`text-xs px-2 py-0.5 rounded ${accountRoleInfo.bgColor} ${accountRoleInfo.color} inline-block mt-1`}>
                          {accountRoleInfo.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#151515] border-t border-[#2f2f2f] flex items-center justify-between">
              <div className="text-xs text-[#666]">
                💡 Page will reload on switch
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-1.5 hover:bg-[#252525] rounded transition-colors"
                title="Refresh page"
              >
                <RefreshCw size={14} className="text-[#999]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountSwitcher;

// Export test accounts for use in other dev tools
export { TEST_ACCOUNTS };
