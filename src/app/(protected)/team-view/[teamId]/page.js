'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchState } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ChevronDown, CheckCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const TEAM_CONFIG = {
  content: { label: 'Content Team', emoji: '🎬', ring: '#6366f1', roles: ['creator'], getProjects: (p) => p.filter(x => !x.projectType || x.projectType === 'content'), getMemberWork: (p, name) => p.filter(x => x.creator === name) },
  editing: { label: 'Editing Team', emoji: '✂️', ring: '#8b5cf6', roles: ['editor'], getProjects: (p) => p.filter(x => (!x.projectType || x.projectType === 'content') && ['Editing', 'Review', 'Done'].includes(x.stage)), getMemberWork: (p, name, user) => p.filter(x => (x.editors || []).includes(name) || x.creator === name) },
  design: { label: 'Design Team', emoji: '🎨', ring: '#ec4899', roles: ['designer'], getProjects: (p) => p.filter(x => x.projectType === 'design'), getMemberWork: (p, name) => p.filter(x => x.assignedDesigner === name || x.assignedTo === name || x.creator === name) },
  dev: { label: 'Dev Team', emoji: '💻', ring: '#06b6d4', roles: ['developer'], getProjects: (p) => p.filter(x => x.projectType === 'dev'), getMemberWork: (p, name) => p.filter(x => x.assignedDeveloper === name || x.assignedTo === name || x.creator === name) },
  marketing: { label: 'Marketing', emoji: '📣', ring: '#f59e0b', roles: [], getProjects: () => [], getMemberWork: () => [] },
  hardware: { label: 'Hardware', emoji: '🔧', ring: '#10b981', roles: [], getProjects: () => [], getMemberWork: () => [] },
};

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

export default function TeamViewPage() {
  const { teamId } = useParams();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState(null);

  const config = TEAM_CONFIG[teamId];

  useEffect(() => {
    if (!currentUser) return;
    fetchState().then(data => { setUsers(data.users || []); setProjects(data.projects || []); }).catch(console.error).finally(() => setLoading(false));
  }, [currentUser]);

  const teamData = useMemo(() => {
    if (!config) return { members: [], teamProjects: [], done: 0, total: 0 };

    const members = users.filter(u => {
      const roles = Array.isArray(u.roles) && u.roles.length ? u.roles : [u.role];
      return config.roles.some(r => roles.includes(r)) && !['superadmin', 'manager'].every(r => roles.includes(r));
    });

    const teamProjects = config.getProjects(projects);
    const done = teamProjects.filter(p => p.stage === 'Done').length;
    const total = teamProjects.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const memberData = members.map(m => {
      const work = config.getMemberWork(teamProjects, m.name, m);
      const memberDone = work.filter(p => p.stage === 'Done').length;
      const memberActive = work.filter(p => p.stage !== 'Done' && p.stage !== 'Backlog').length;
      const memberOverdue = work.filter(p => p.dueDate && new Date(p.dueDate) < new Date() && p.stage !== 'Done').length;
      const memberPct = work.length > 0 ? Math.round((memberDone / work.length) * 100) : 0;
      return { ...m, work, memberDone, memberActive, memberOverdue, memberPct, totalWork: work.length };
    });

    return { members: memberData, teamProjects, done, total, pct };
  }, [config, users, projects]);

  if (!config) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Team not found</div>;
  if (loading || !currentUser) return <LoadingScreen />;

  const r = 52, circ = 2 * Math.PI * r, offset = circ - (teamData.pct / 100) * circ;

  return (
    <div className="min-h-full p-5 md:p-8 space-y-8" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{config.emoji}</span>
          <div>
            <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>{config.label}</h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{teamData.members.length} members · {teamData.total} total projects</p>
          </div>
        </div>
        {/* Team Ring */}
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r={r} fill="none" stroke="var(--border-light)" strokeWidth="8" />
              <motion.circle cx="56" cy="56" r={r} fill="none" stroke={config.ring} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>{teamData.pct}%</span>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>done</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl font-black" style={{ color: 'var(--success)' }}>{teamData.done}</div>
            <div className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>Completed</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl font-black" style={{ color: 'var(--primary)' }}>{teamData.total - teamData.done}</div>
            <div className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>Remaining</div>
          </div>
        </div>
      </motion.div>

      {/* Members */}
      {teamData.members.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Team Members</h2>
          {teamData.members.map(member => (
            <MemberCard key={member.id} member={member} ringColor={config.ring} expanded={expandedMember === member.id} onToggle={() => setExpandedMember(expandedMember === member.id ? null : member.id)} />
          ))}
        </motion.div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed p-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <span className="text-5xl block mb-4">{config.emoji}</span>
          <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>No team members assigned yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Assign roles to users in Team Management to see them here</p>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, ringColor, expanded, onToggle }) {
  const r = 28, circ = 2 * Math.PI * r, offset = circ - (member.memberPct / 100) * circ;
  const status = member.memberOverdue > 0 ? 'overdue' : member.memberActive > 0 ? 'active' : member.memberDone > 0 ? 'done' : 'idle';
  const statusConfig = {
    overdue: { label: 'Behind', color: 'var(--danger)', bg: 'var(--danger-light)' },
    active: { label: 'Working', color: 'var(--primary)', bg: 'var(--primary-light)' },
    done: { label: 'All Done', color: 'var(--success)', bg: 'var(--success-light)' },
    idle: { label: 'No Work', color: 'var(--text-muted)', bg: 'var(--bg-input)' },
  };
  const st = statusConfig[status];

  return (
    <motion.div variants={fade} className="rounded-3xl border overflow-hidden transition-all" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header - clickable */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left transition-all hover:opacity-80">
        {/* Avatar + Ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-light)" strokeWidth="4" />
            <motion.circle cx="32" cy="32" r={r} fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, delay: 0.2 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {member.profilePhoto ? (
              <img src={member.profilePhoto} className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base ${member.avatarColor || 'bg-indigo-500'}`}>
                {member.name?.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-lg font-black" style={{ color: 'var(--text)' }}>{member.name}</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span>{member.totalWork} total</span>
            <span style={{ color: 'var(--success)' }}>{member.memberDone} done</span>
            <span style={{ color: 'var(--primary)' }}>{member.memberActive} active</span>
            {member.memberOverdue > 0 && <span style={{ color: 'var(--danger)' }}>{member.memberOverdue} overdue</span>}
          </div>
        </div>

        {/* Percentage + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>{member.memberPct}%</span>
          <ChevronDown size={20} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
        </div>
      </button>

      {/* Expanded: Work list */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <div className="pt-4 space-y-2">
                {member.work.length > 0 ? member.work.sort((a, b) => {
                  if (a.stage === 'Done' && b.stage !== 'Done') return 1;
                  if (a.stage !== 'Done' && b.stage === 'Done') return -1;
                  const aOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.stage !== 'Done' ? -1 : 0;
                  const bOverdue = b.dueDate && new Date(b.dueDate) < new Date() && b.stage !== 'Done' ? -1 : 0;
                  return aOverdue - bOverdue;
                }).map(work => (
                  <WorkItem key={work.id} work={work} />
                )) : (
                  <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No work assigned</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WorkItem({ work }) {
  const now = new Date();
  const isDone = work.stage === 'Done';
  const isOverdue = work.dueDate && new Date(work.dueDate) < now && !isDone;

  const stageEmoji = { Backlog: '💡', Scripting: '📝', Shooting: '🎬', Editing: '✂️', Review: '👀', Publishing: '🚀', Done: '✅',
    Briefing: '📋', Concept: '💭', Design: '🎨', Approved: '👍', Delivered: '📦',
    Planning: '📐', Development: '💻', Testing: '🧪', 'Code Review': '🔍', QA: '✔️', Deployed: '🚀' };

  return (
    <div className="flex items-center gap-4 p-3.5 rounded-2xl transition-all" style={{ background: isDone ? 'var(--success-light)' : isOverdue ? 'var(--danger-light)' : 'var(--bg-input)' }}>
      {/* Status icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--bg-card)' }}>
        {isDone ? '✅' : isOverdue ? '🔴' : '🟡'}
      </div>

      {/* Title + stage */}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold truncate" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>{work.title || 'Untitled'}</div>
        <div className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {stageEmoji[work.stage] || '📋'} {work.stage}
          {work.platform && ` · ${work.platform}`}
        </div>
      </div>

      {/* Due date */}
      {work.dueDate ? (
        <span className={`text-[12px] font-bold px-3 py-1.5 rounded-xl shrink-0 ${
          isDone ? '' : isOverdue ? '' : ''
        }`} style={{
          background: isDone ? 'var(--success-light)' : isOverdue ? 'var(--danger-light)' : 'var(--bg-card)',
          color: isDone ? 'var(--success)' : isOverdue ? 'var(--danger)' : 'var(--text-secondary)'
        }}>
          {formatDue(work.dueDate)}
        </span>
      ) : (
        <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>No due date</span>
      )}
    </div>
  );
}

function formatDue(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}
