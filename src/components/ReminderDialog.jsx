'use client';

import { useState } from 'react';
import { X, Bell } from 'lucide-react';

export default function ReminderDialog({ users, currentUser, onClose, onSubmit, defaultDate }) {
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'superadmin';

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [targetUserId, setTargetUserId] = useState(currentUser?.id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    setSubmitting(true);
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    await onSubmit({
      title: title.trim(),
      message: message.trim(),
      scheduledAt,
      userId: targetUserId || currentUser?.id,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Bell size={18} className="text-amber-400" />
            Set Reminder
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-muted)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              placeholder="e.g., Review project deliverables"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-muted)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              placeholder="Additional details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
                required
              />
            </div>
          </div>

          {isManager && (
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Remind</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              >
                <option value={currentUser?.id}>Myself</option>
                {users
                  .filter((u) => (u.id || u._id) !== currentUser?.id)
                  .map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={!title.trim() || !date || !time || submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text)] font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Bell size={14} />
            {submitting ? 'Setting...' : 'Set Reminder'}
          </button>
        </form>
      </div>
    </div>
  );
}
