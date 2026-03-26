'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

function QuotaRing({ label, actual, target, color }) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const colors = { indigo: '#4f46e5', rose: '#e11d48', pink: '#db2777', violet: '#7c3aed' };
  const stroke = actual >= target && target > 0 ? '#059669' : (colors[color] || '#4f46e5');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#f0ede8" strokeWidth="4" />
          <motion.circle cx="28" cy="28" r={r} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-[var(--text)]">{actual}/{target}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

function CreatorCard({ user, projects, now }) {
  const q = user.quota || {};
  let startDate = new Date(now);
  if (q.period === 'monthly') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
  else { const d = startDate.getDay(); startDate.setDate(startDate.getDate() - d + (d === 0 ? -6 : 1)); startDate.setHours(0, 0, 0, 0); }

  const done = projects.filter(p => p.creator === user.name && p.stage === 'Done' && p.lastUpdated >= startDate.getTime());
  const active = projects.filter(p => p.creator === user.name && p.stage !== 'Done' && p.stage !== 'Backlog');

  const ytLong = done.filter(p => p.platform === 'youtube' && (p.contentFormat === 'LongForm' || !p.contentFormat)).length;
  const ytShort = done.filter(p => p.platform === 'youtube' && p.contentFormat === 'ShortForm').length;
  const igReels = done.filter(p => p.platform === 'instagram').length;
  const courses = done.filter(p => p.platform === 'course').length;

  const totalTarget = (q.youtubeLong || 0) + (q.youtubeShort || 0) + (q.instagramReel || 0) + (q.course || 0);
  const totalActual = ytLong + ytShort + igReels + courses;
  const allDone = totalActual >= totalTarget && totalTarget > 0;

  const endDate = new Date(now);
  if (q.period === 'monthly') { endDate.setMonth(endDate.getMonth() + 1, 0); }
  else { const dayOfWeek = endDate.getDay(); endDate.setDate(endDate.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek)); }
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / 86400000));

  return (
    <motion.div variants={fade} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.avatarColor || 'bg-[var(--primary)]'}`}>
          {user.profilePhoto ? <img src={user.profilePhoto} className="w-11 h-11 rounded-full object-cover" /> : user.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text)] truncate">{user.name}</span>
            {allDone && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✅ Done</span>}
            {!allDone && totalTarget > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">⏳ Behind</span>}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">{q.period === 'monthly' ? 'Monthly' : 'Weekly'} · {daysLeft}d left</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-[var(--text)]">{active.length}</div>
          <div className="text-[10px] text-[var(--text-muted)]">active</div>
        </div>
      </div>

      {/* Quota rings */}
      <div className="flex justify-center gap-5">
        {(q.youtubeLong || 0) > 0 && <QuotaRing label="YT Long" actual={ytLong} target={q.youtubeLong} color="indigo" />}
        {(q.youtubeShort || 0) > 0 && <QuotaRing label="YT Short" actual={ytShort} target={q.youtubeShort} color="rose" />}
        {(q.instagramReel || 0) > 0 && <QuotaRing label="IG Reel" actual={igReels} target={q.instagramReel} color="pink" />}
        {(q.course || 0) > 0 && <QuotaRing label="Course" actual={courses} target={q.course} color="violet" />}
      </div>
    </motion.div>
  );
}

export default function PerformanceView({ projects = [], users = [] }) {
  const now = useMemo(() => new Date(), []);

  const quotaUsers = useMemo(() => {
    return users.filter(u => {
      const q = u.quota;
      return q && ((q.youtubeLong || 0) + (q.youtubeShort || 0) + (q.instagramReel || 0) + (q.course || 0) > 0);
    });
  }, [users]);

  // Team-wide totals
  const totals = useMemo(() => {
    let target = 0, actual = 0;
    quotaUsers.forEach(u => {
      const q = u.quota || {};
      target += (q.youtubeLong || 0) + (q.youtubeShort || 0) + (q.instagramReel || 0) + (q.course || 0);
      let startDate = new Date(now);
      if (q.period === 'monthly') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
      else { const d = startDate.getDay(); startDate.setDate(startDate.getDate() - d + (d === 0 ? -6 : 1)); startDate.setHours(0, 0, 0, 0); }
      actual += projects.filter(p => p.creator === u.name && p.stage === 'Done' && p.lastUpdated >= startDate.getTime()).length;
    });
    const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
    return { target, actual, pct };
  }, [quotaUsers, projects, now]);

  return (
    <div className="min-h-full bg-[var(--bg)] p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Team Performance</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Track each creator's progress toward their goals</p>
      </div>

      {/* Summary bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1">
          <span className="text-sm font-bold text-[var(--text)]">Overall Completion</span>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-3 bg-[var(--bg-input)] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${totals.pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${totals.pct >= 100 ? 'bg-emerald-500' : totals.pct >= 50 ? 'bg-[var(--primary)]' : 'bg-rose-500'}`} />
            </div>
            <span className={`text-lg font-extrabold ${totals.pct >= 100 ? 'text-emerald-600' : 'text-[var(--text)]'}`}>{totals.pct}%</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{totals.actual} of {totals.target} deliverables completed this period</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-extrabold text-[var(--text)]">{quotaUsers.length}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">Creators</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600">{totals.actual}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">Done</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600">{totals.target - totals.actual}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">Remaining</div>
          </div>
        </div>
      </motion.div>

      {/* Creator Cards */}
      {quotaUsers.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quotaUsers.map(u => <CreatorCard key={u.id} user={u} projects={projects} now={now} />)}
        </motion.div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-12 text-center">
          <p className="text-[var(--text-muted)]">No creators with quotas set up. Go to Team → edit a user to add quotas.</p>
        </div>
      )}
    </div>
  );
}
