'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function PresenceAvatars({ activeUsers, currentUser }) {
  if (!activeUsers || activeUsers.length === 0) return null;

  // Generate avatar color based on user ID
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-rose-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-lime-500',
      'bg-emerald-500',
      'bg-cyan-500',
      'bg-blue-500'
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="popLayout">
        {activeUsers.map((user, index) => (
          <motion.div
            key={user.userId}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`relative ${index > 0 ? '-ml-2' : ''}`}
            style={{ zIndex: activeUsers.length - index }}
          >
            <div
              className={`w-8 h-8 rounded-full ${getAvatarColor(user.userId)} border-2 border-[#0d0d0d] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform`}
              title={user.userName || 'Anonymous'}
            >
              {(user.userName || '?').charAt(0).toUpperCase()}
            </div>

            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0d0d0d] rounded-full"></div>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeUsers.length > 0 && (
        <span className="text-xs text-[#999] ml-1">
          {activeUsers.length} online
        </span>
      )}
    </div>
  );
}
