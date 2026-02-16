'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function TypingIndicator({ typingUsers, blockId }) {
  // Filter users typing in this specific block
  const usersTypingHere = Object.entries(typingUsers)
    .filter(([_, data]) => data.blockId === blockId)
    .map(([userId, data]) => data.userName);

  if (usersTypingHere.length === 0) return null;

  const displayText = usersTypingHere.length === 1
    ? `${usersTypingHere[0]} is typing...`
    : usersTypingHere.length === 2
    ? `${usersTypingHere[0]} and ${usersTypingHere[1]} are typing...`
    : `${usersTypingHere[0]} and ${usersTypingHere.length - 1} others are typing...`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-xs text-indigo-400 mt-2"
      >
        <div className="flex gap-1">
          <motion.div
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          />
        </div>
        <span>{displayText}</span>
      </motion.div>
    </AnimatePresence>
  );
}
