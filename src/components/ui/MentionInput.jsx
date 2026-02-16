import React, { useState, useRef, useEffect } from 'react';

export const MentionInput = ({
  value,
  onChange,
  onSubmit,
  users,
  placeholder = 'Type a message...',
  className = ''
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef(null);
  const mentionDropdownRef = useRef(null);

  // Filter users based on mention search
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(mentionSearch.toLowerCase()) && u.active
  );

  // Handle input change and detect @mentions
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Detect @ symbol
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Show mentions if no space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
  };

  // Handle mention selection
  const selectMention = (user) => {
    if (!inputRef.current) return;

    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const newValue =
      textBeforeCursor.slice(0, lastAtIndex) +
      `@${user.name} ` +
      textAfterCursor;

    onChange(newValue);
    setShowMentions(false);

    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = lastAtIndex + user.name.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectMention(filteredUsers[selectedMentionIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Click outside to close mention dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className={`${className} resize-none`}
        style={{ minHeight: '40px', maxHeight: '120px' }}
      />

      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionDropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-[#2a2a2a] rounded-lg shadow-xl border border-[#3f3f3f] max-h-48 overflow-y-auto z-50"
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => selectMention(user)}
              className={`w-full text-left px-3 py-2 flex items-center space-x-3 transition-colors ${
                index === selectedMentionIndex
                  ? 'bg-[#3a3a3a]'
                  : 'hover:bg-[#333]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${user.avatarColor}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.name}
                </div>
                <div className="text-xs text-[#888] capitalize">{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
