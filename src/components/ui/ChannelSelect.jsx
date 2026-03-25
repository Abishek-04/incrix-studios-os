'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Youtube, GraduationCap } from 'lucide-react';

const platformIcons = {
  youtube: Youtube,
  instagram: null, // uses Instagram SVG below
  course: GraduationCap,
};

function InstagramIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function ChannelAvatar({ channel, size = 20 }) {
  const avatarUrl = channel.avatarUrl || channel.profilePictureUrl;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={channel.name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }

  const platform = (channel.platform || '').toLowerCase();
  const Icon = platformIcons[platform];

  if (platform === 'instagram') {
    return (
      <div className="flex-shrink-0 text-pink-400">
        <InstagramIcon size={size - 4} />
      </div>
    );
  }

  if (Icon) {
    return (
      <div className="flex-shrink-0 text-[#888]">
        <Icon size={size - 4} />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 text-[#888]">
      <Globe size={size - 4} />
    </div>
  );
}

export default function ChannelSelect({ channels, value, onChange, placeholder = 'Select Channel', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = channels.find(c => {
    const cVal = c.id || c._id || '';
    return String(cVal) === String(value || '');
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative min-w-[160px] sm:min-w-[200px] ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-[#252525] border border-[#333] text-white text-xs font-medium rounded-lg px-3 py-2 hover:bg-[#2a2a2a] transition-colors uppercase tracking-wide"
      >
        {selected ? (
          <>
            <ChannelAvatar channel={selected} size={18} />
            <span className="truncate flex-1 text-left">{selected.name} ({selected.platform})</span>
          </>
        ) : (
          <>
            <Globe size={14} className="text-[#999] flex-shrink-0" />
            <span className="truncate flex-1 text-left text-[#999]">{placeholder}</span>
          </>
        )}
        <ChevronDown size={14} className={`text-[#999] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-60 overflow-y-auto py-1">
            {/* Empty option */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#888] hover:bg-[#2a2a2a] transition-colors"
            >
              <Globe size={14} className="flex-shrink-0" />
              <span>{placeholder}</span>
            </button>

            {channels.map((channel) => {
              const cVal = channel.id || channel._id || '';
              const isSelected = String(cVal) === String(value || '');
              return (
                <button
                  key={cVal}
                  type="button"
                  onClick={() => { onChange(cVal); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${isSelected ? 'bg-indigo-500/15 text-indigo-300' : 'text-white hover:bg-[#2a2a2a]'}`}
                >
                  <ChannelAvatar channel={channel} size={20} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate font-medium">{channel.name}</div>
                    <div className="text-[10px] text-[#666] capitalize">{channel.platform}</div>
                  </div>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { ChannelAvatar };
