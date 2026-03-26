'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  DollarSign, Users, Briefcase, AlertTriangle, ArrowUpRight,
  Plus, X, ChevronRight, Clock, CheckCircle, XCircle, Zap
} from 'lucide-react';
import { fetchWithAuth } from '@/services/api';

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const TEAM_MAP = {
  content: { label: 'Content Team', emoji: '🎬', color: '#4f46e5', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', ring: 'ring-indigo-100', pill: 'bg-indigo-100 text-indigo-700' },
  editing: { label: 'Editing Team', emoji: '✂️', color: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-100', pill: 'bg-violet-100 text-violet-700' },
  design: { label: 'Design Team', emoji: '🎨', color: '#db2777', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', ring: 'ring-pink-100', pill: 'bg-pink-100 text-pink-700' },
  dev: { label: 'Dev Team', emoji: '💻', color: '#0891b2', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', ring: 'ring-cyan-100', pill: 'bg-cyan-100 text-cyan-700' },
  marketing: { label: 'Marketing', emoji: '📣', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-100', pill: 'bg-amber-100 text-amber-700' },
  hardware: { label: 'Hardware', emoji: '🔧', color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-100', pill: 'bg-emerald-100 text-emerald-700' },
};

function StatusDot({ status }) {
  if (status === 'good') return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />;
  if (status === 'warning') return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />;
  if (status === 'bad') return <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-pulse" />;
  return <span className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />;
}

function PersonCard({ person, projects, now }) {
  const activeProjects = projects.filter(p => p.stage !== 'Done' && p.stage !== 'Backlog');
  const overdueProjects = activeProjects.filter(p => p.dueDate && new Date(p.dueDate) < now);
  const currentProject = activeProjects[0];
  const status = overdueProjects.length > 0 ? 'bad' : activeProjects.length > 0 ? 'good' : 'idle';

  return (
    <motion.div variants={fade} className="bg-white rounded-2xl border border-stone-200/80 p-4 hover:shadow-md hover:border-stone-300 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${person.avatarColor || 'bg-orange-500'}`}>
          {person.profilePhoto ? <img src={person.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : person.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-800 truncate">{person.name}</span>
            <StatusDot status={status} />
          </div>
          <span className="text-[11px] text-stone-400 capitalize">{person.role}</span>
        </div>
      </div>

      {activeProjects.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-800">{activeProjects.length} active</span>
            {overdueProjects.length > 0 && (
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">{overdueProjects.length} overdue</span>
            )}
          </div>
          {currentProject && (
            <div className="bg-stone-50 rounded-xl p-2.5">
              <p className="text-[12px] font-medium text-stone-700 truncate">📌 {currentProject.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-stone-400">{currentProject.stage}</span>
                {currentProject.dueDate && (
                  <span className={`text-[10px] font-medium ${new Date(currentProject.dueDate) < now ? 'text-rose-500' : 'text-stone-400'}`}>
                    {formatDue(currentProject.dueDate, now)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-stone-300 italic">No active work</p>
      )}
    </motion.div>
  );
}

function TeamSection({ teamKey, members, projects, now }) {
  const cfg = TEAM_MAP[teamKey];
  if (!cfg) return null;
  const activeCount = projects.filter(p => p.stage !== 'Done' && p.stage !== 'Backlog').length;
  const overdueCount = projects.filter(p => p.dueDate && new Date(p.dueDate) < now && p.stage !== 'Done').length;

  return (
    <motion.div variants={fade} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{cfg.emoji}</span>
          <h3 className="text-[15px] font-bold text-stone-800">{cfg.label}</h3>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.pill}`}>{activeCount} active</span>
          {overdueCount > 0 && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">{overdueCount} late</span>}
        </div>
      </div>

      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {members.map(member => (
            <PersonCard key={member.id} person={member} projects={projects.filter(p => p.creator === member.name || p.assignedTo === member.id || p.assignedDesigner === member.name || p.assignedDeveloper === member.name)} now={now} />
          ))}
        </div>
      ) : (
        <div className={`rounded-2xl border-2 border-dashed ${cfg.border} p-6 text-center`}>
          <p className="text-sm text-stone-400">No team members assigned yet</p>
        </div>
      )}
    </motion.div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, subtitle, onClick }) {
  const colors = {
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200/60' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200/60' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200/60' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200/60' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200/60' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <motion.div variants={fade} whileHover={{ y: -2 }}
      className={`bg-white rounded-2xl border ${c.border} p-5 cursor-default hover:shadow-md transition-all`}
      onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-stone-800">{value}</p>
      {subtitle && <p className="text-[11px] text-stone-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

function AttentionItem({ text, type }) {
  const styles = {
    overdue: 'bg-rose-50 border-rose-200/60 text-rose-700',
    stuck: 'bg-amber-50 border-amber-200/60 text-amber-700',
    client: 'bg-indigo-50 border-indigo-200/60 text-indigo-700',
  };
  const icons = { overdue: '🔴', stuck: '🟡', client: '🔵' };
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${styles[type] || styles.stuck}`}>
      <span className="text-sm">{icons[type] || '⚠️'}</span>
      <span className="text-[13px] font-medium">{text}</span>
    </div>
  );
}

function QuotaRing({ label, actual, target, color }) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  const colors = { indigo: '#4f46e5', rose: '#e11d48', pink: '#db2777', violet: '#7c3aed' };
  const strokeColor = colors[color] || '#4f46e5';
  const done = actual >= target && target > 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#f0ede8" strokeWidth="4" />
          <motion.circle cx="32" cy="32" r="28" fill="none" stroke={done ? '#059669' : strokeColor} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${done ? 'text-emerald-600' : 'text-stone-700'}`}>{actual}/{target}</span>
        </div>
      </div>
      <span className="text-[11px] font-medium text-stone-500">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ projects = [], users = [], currentUser, clients = [], revenue = [], activity = [] }) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const revenueMTD = revenue.filter(r => r.month === currentMonth).reduce((s, r) => s + (r.amount || 0), 0);
    const activeClients = clients.filter(c => c.status === 'active').length;
    const openLeads = clients.filter(c => c.status === 'lead' || c.status === 'prospect').length;

    const allActive = projects.filter(p => p.stage !== 'Done' && p.stage !== 'Backlog');
    const allOverdue = projects.filter(p => p.dueDate && new Date(p.dueDate) < now && p.stage !== 'Done');
    const allBlocked = projects.filter(p => p.status === 'Blocked');
    const stuckProjects = projects.filter(p => {
      if (!p.lastUpdated || p.stage === 'Done' || p.stage === 'Backlog') return false;
      return (now - new Date(p.lastUpdated)) / 3600000 > 48;
    });

    // Team grouping
    const roleToTeam = { creator: 'content', editor: 'editing', designer: 'design', developer: 'dev' };
    const teamMembers = { content: [], editing: [], design: [], dev: [], marketing: [], hardware: [] };
    users.forEach(u => {
      const roles = Array.isArray(u.roles) && u.roles.length ? u.roles : [u.role];
      const placed = new Set();
      roles.forEach(r => {
        const team = roleToTeam[r];
        if (team && !placed.has(team)) { teamMembers[team].push(u); placed.add(team); }
      });
    });

    const contentProjects = projects.filter(p => !p.projectType || p.projectType === 'content');
    const designProjects = projects.filter(p => p.projectType === 'design');
    const devProjects = projects.filter(p => p.projectType === 'dev');

    const teamProjects = {
      content: contentProjects,
      editing: contentProjects.filter(p => p.stage === 'Editing' || p.stage === 'Review'),
      design: designProjects,
      dev: devProjects,
      marketing: [],
      hardware: [],
    };

    // Attention items
    const attentionItems = [];
    allOverdue.slice(0, 3).forEach(p => attentionItems.push({ text: `"${p.title}" is overdue${p.creator ? ` — ${p.creator}` : ''}`, type: 'overdue' }));
    stuckProjects.slice(0, 2).forEach(p => attentionItems.push({ text: `"${p.title}" has had no updates for 2+ days`, type: 'stuck' }));
    clients.filter(c => c.status === 'lead' && c.requirements).slice(0, 2).forEach(c => attentionItems.push({ text: `New request from ${c.companyName}`, type: 'client' }));

    // Content quota
    let totalTarget = { ytLong: 0, ytShort: 0, igReels: 0, courses: 0 };
    let totalActual = { ytLong: 0, ytShort: 0, igReels: 0, courses: 0 };
    users.filter(u => u.quota).forEach(u => {
      let start = new Date();
      if (u.quota.period === 'monthly') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
      else { const d = start.getDay(); start.setDate(start.getDate() - d + (d === 0 ? -6 : 1)); start.setHours(0, 0, 0, 0); }
      const done = contentProjects.filter(p => p.creator === u.name && p.stage === 'Done' && p.lastUpdated >= start.getTime());
      totalTarget.ytLong += (u.quota.youtubeLong || 0);
      totalTarget.ytShort += (u.quota.youtubeShort || 0);
      totalTarget.igReels += (u.quota.instagramReel || 0);
      totalTarget.courses += (u.quota.course || 0);
      totalActual.ytLong += done.filter(p => p.platform === 'youtube' && (p.contentFormat === 'LongForm' || !p.contentFormat)).length;
      totalActual.ytShort += done.filter(p => p.platform === 'youtube' && p.contentFormat === 'ShortForm').length;
      totalActual.igReels += done.filter(p => p.platform === 'instagram').length;
      totalActual.courses += done.filter(p => p.platform === 'course').length;
    });

    return { revenueMTD, activeClients, openLeads, allActive, allOverdue, allBlocked, stuckProjects, teamMembers, teamProjects, attentionItems, totalTarget, totalActual };
  }, [projects, users, clients, revenue, now]);

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-full bg-[#f5f3ef] p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-800">
            {greeting}, {currentUser?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">{dateStr} — here's what's happening at Incrix</p>
        </div>
        <div className="flex gap-2">
          {data.attentionItems.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full">
              <Zap size={13} className="text-rose-500" />
              <span className="text-xs font-semibold text-rose-600">{data.attentionItems.length} needs attention</span>
            </div>
          )}
          <button onClick={() => setShowAddClient(true)} className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors">
            <Plus size={13} className="inline mr-1" />Client
          </button>
          <button onClick={() => setShowAddRevenue(true)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-full text-xs font-semibold text-white transition-colors">
            <Plus size={13} className="inline mr-1" />Revenue
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Revenue This Month" value={`₹${data.revenueMTD.toLocaleString()}`} icon={DollarSign} color="amber" subtitle="Manual entry" />
        <SummaryCard label="Active Clients" value={data.activeClients} icon={Briefcase} color="cyan" subtitle={`${data.openLeads} leads waiting`} />
        <SummaryCard label="Work In Progress" value={data.allActive.length} icon={CheckCircle} color="emerald" subtitle={`${projects.filter(p => p.stage === 'Done').length} completed`} />
        <SummaryCard label="Needs Attention" value={data.attentionItems.length} icon={AlertTriangle} color={data.attentionItems.length > 2 ? 'rose' : 'amber'} subtitle="Overdue, stuck, or waiting" />
      </motion.div>

      {/* Team Sections */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {Object.entries(data.teamMembers).map(([teamKey, members]) => {
          if (members.length === 0 && (data.teamProjects[teamKey] || []).length === 0) return null;
          return <TeamSection key={teamKey} teamKey={teamKey} members={members} projects={data.teamProjects[teamKey] || []} now={now} />;
        })}
      </motion.div>

      {/* Attention */}
      {data.attentionItems.length > 0 && (
        <motion.div variants={fade} initial="hidden" animate="show" className="space-y-3">
          <h2 className="text-[15px] font-bold text-stone-800 flex items-center gap-2">⚡ Needs Your Attention</h2>
          <div className="space-y-2">
            {data.attentionItems.map((item, i) => <AttentionItem key={i} text={item.text} type={item.type} />)}
          </div>
        </motion.div>
      )}

      {/* Content Output */}
      {(data.totalTarget.ytLong > 0 || data.totalTarget.ytShort > 0 || data.totalTarget.igReels > 0 || data.totalTarget.courses > 0) && (
        <motion.div variants={fade} initial="hidden" animate="show" className="bg-white rounded-2xl border border-stone-200/80 p-5">
          <h2 className="text-[15px] font-bold text-stone-800 mb-4">📊 Content Output This Period</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <QuotaRing label="YT Long" actual={data.totalActual.ytLong} target={data.totalTarget.ytLong} color="indigo" />
            <QuotaRing label="YT Shorts" actual={data.totalActual.ytShort} target={data.totalTarget.ytShort} color="rose" />
            <QuotaRing label="IG Reels" actual={data.totalActual.igReels} target={data.totalTarget.igReels} color="pink" />
            <QuotaRing label="Courses" actual={data.totalActual.courses} target={data.totalTarget.courses} color="violet" />
          </div>
        </motion.div>
      )}

      {/* Quick-add modals */}
      {showAddClient && <QuickModal title="Add Client" onClose={() => setShowAddClient(false)}>
        <ClientForm onSave={() => { setShowAddClient(false); window.location.reload(); }} />
      </QuickModal>}
      {showAddRevenue && <QuickModal title="Add Revenue" onClose={() => setShowAddRevenue(false)}>
        <RevenueForm onSave={() => { setShowAddRevenue(false); window.location.reload(); }} />
      </QuickModal>}
    </div>
  );
}

// ─── Modals / Forms ───────────────────────────────────────────────────────────
function QuickModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-stone-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-stone-800">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ClientForm({ onSave }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', status: 'lead', source: 'direct', service: 'other', budget: '', requirements: '' });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setSaving(true);
    try { const res = await fetchWithAuth('/api/clients', { method: 'POST', body: JSON.stringify(form) }); if (res.ok) onSave(); } catch (_) {}
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input placeholder="Company Name *" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
        className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" required autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Contact Person" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400" />
        <input placeholder="Budget" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-600 outline-none">
          <option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option>
        </select>
        <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-600 outline-none">
          <option value="direct">Direct</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option>
        </select>
        <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-600 outline-none">
          <option value="other">Service</option><option value="content">Content</option><option value="design">Design</option><option value="development">Dev</option><option value="hardware">Hardware</option>
        </select>
      </div>
      <textarea placeholder="Requirements" value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={2}
        className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400 resize-none" />
      <button type="submit" disabled={saving || !form.companyName.trim()} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-colors">
        {saving ? 'Saving...' : 'Add Client'}
      </button>
    </form>
  );
}

function RevenueForm({ onSave }) {
  const now = new Date();
  const [form, setForm] = useState({ stream: 'content_monetization', amount: '', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, description: '' });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    try { const res = await fetchWithAuth('/api/revenue', { method: 'POST', body: JSON.stringify(form) }); if (res.ok) onSave(); } catch (_) {}
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select value={form.stream} onChange={e => setForm(f => ({ ...f, stream: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-600 outline-none focus:border-orange-400">
        <option value="content_monetization">🎬 Content Monetization</option>
        <option value="client_services">💼 Client Services</option>
        <option value="courses">🎓 Course Sales</option>
        <option value="hardware">🔧 Hardware Sales</option>
        <option value="classory_saas">🖥️ Classory SaaS</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400" required min="0" autoFocus />
        <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-600 outline-none focus:border-orange-400" />
      </div>
      <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400" />
      <button type="submit" disabled={saving || !form.amount} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-colors">
        {saving ? 'Saving...' : 'Add Revenue'}
      </button>
    </form>
  );
}

function formatDue(dueDate, now) {
  const due = new Date(dueDate);
  const diff = due - now;
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days}d left`;
}
