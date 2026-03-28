'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DollarSign, Briefcase, CheckCircle, AlertTriangle, Plus, X, ArrowUpRight, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '@/services/api';

// Emil Kowalski: ease-out for entering, keep under 300ms, stagger 40-60ms
const fade = { hidden: { opacity: 0, transform: 'translateY(8px)' }, show: { opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

const TEAMS = {
  content: { label: 'Content', emoji: '🎬', href: '/team-view/content', ring: '#6366f1', track: 'var(--border-light)', gradient: 'from-indigo-500 to-blue-500' },
  editing: { label: 'Editing', emoji: '✂️', href: '/team-view/editing', ring: '#8b5cf6', track: 'var(--border-light)', gradient: 'from-violet-500 to-purple-500' },
  design: { label: 'Design', emoji: '🎨', href: '/team-view/design', ring: '#ec4899', track: 'var(--border-light)', gradient: 'from-pink-500 to-rose-500' },
  dev: { label: 'Dev', emoji: '💻', href: '/team-view/dev', ring: '#06b6d4', track: 'var(--border-light)', gradient: 'from-cyan-500 to-teal-500' },
  marketing: { label: 'Marketing', emoji: '📣', href: '/team-view/marketing', ring: '#f59e0b', track: 'var(--border-light)', gradient: 'from-amber-500 to-yellow-500' },
  hardware: { label: 'Hardware', emoji: '🔧', href: '/team-view/hardware', ring: '#10b981', track: 'var(--border-light)', gradient: 'from-emerald-500 to-green-500' },
};

function TeamRing({ teamKey, active, done, total }) {
  const t = TEAMS[teamKey];
  if (!t) return null;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 44, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;

  return (
    <Link href={t.href}>
      <motion.div variants={fade} whileHover={{ transform: 'scale(1.04) translateY(-3px)' }} transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }} className="flex flex-col items-center gap-3 cursor-pointer group">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border-light)" strokeWidth="7" />
            <motion.circle cx="48" cy="48" r={r} fill="none" stroke={t.ring} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl">{t.emoji}</span>
            <span className="text-sm font-black" style={{ color: 'var(--text)' }}>{pct}%</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[15px] font-bold group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text)' }}>{t.label}</div>
          <div className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{active} active · {done} done</div>
        </div>
      </motion.div>
    </Link>
  );
}

function ProjectRow({ project }) {
  const stages = ['Backlog', 'Scripting', 'Shooting', 'Editing', 'Review', 'Publishing', 'Done'];
  const idx = stages.indexOf(project.stage);
  const pct = idx >= 0 ? Math.round((idx / (stages.length - 1)) * 100) : 0;
  const overdue = project.dueDate && new Date(project.dueDate) < new Date() && project.stage !== 'Done';
  const done = project.stage === 'Done';

  return (
    <motion.div variants={fade} className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group cursor-pointer" style={{ ':hover': { background: 'var(--bg-card-hover)' } }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md shadow-violet-500/15">
        {project.creator?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold truncate" style={{ color: 'var(--text)' }}>{project.title || 'Untitled'}</div>
        <div className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{project.creator} · {project.stage}</div>
      </div>
      <div className="w-24 shrink-0 hidden sm:block">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
          <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : overdue ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] font-bold text-right mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct}%</div>
      </div>
      {project.dueDate && (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 ${
          done ? 'bg-emerald-500/10 text-emerald-600' : overdue ? 'bg-rose-500/10 text-rose-600' : 'text-[var(--text-muted)]'
        }`} style={!done && !overdue ? { background: 'var(--bg-input)' } : {}}>
          {formatDue(project.dueDate)}
        </span>
      )}
      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0 group-hover:translate-x-1 transition-transform" />
    </motion.div>
  );
}

function KPI({ label, value, icon: Icon, gradient, sub }) {
  return (
    <motion.div variants={fade} whileHover={{ transform: 'translateY(-2px)' }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} className="rounded-3xl p-5 border cursor-default card-hover" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{value}</p>
      {sub && <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard({ projects = [], users = [], currentUser, clients = [], revenue = [] }) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const now = useMemo(() => new Date(), []);

  const userRoles = currentUser ? (Array.isArray(currentUser.roles) && currentUser.roles.length ? currentUser.roles : [currentUser.role]) : [];
  const isMgr = userRoles.some(r => ['superadmin', 'manager'].includes(r));

  // For non-managers, filter to only their assigned projects
  const visibleProjects = useMemo(() => {
    if (isMgr) return projects;
    return projects.filter(p =>
      p.creator === currentUser?.name ||
      (p.editors || []).includes(currentUser?.name) ||
      p.editor === currentUser?.name ||
      p.assignedTo === currentUser?.id ||
      p.assignedDesigner === currentUser?.name ||
      p.assignedDeveloper === currentUser?.name
    );
  }, [projects, currentUser, isMgr]);

  const data = useMemo(() => {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const revMTD = revenue.filter(r => r.month === month).reduce((s, r) => s + (r.amount || 0), 0);
    const activeClients = clients.filter(c => c.status === 'active').length;
    const leads = clients.filter(c => c.status === 'lead' || c.status === 'prospect').length;
    const contentP = visibleProjects.filter(p => !p.projectType || p.projectType === 'content');
    const designP = visibleProjects.filter(p => p.projectType === 'design');
    const devP = visibleProjects.filter(p => p.projectType === 'dev');
    const isAct = p => p.stage !== 'Done' && p.stage !== 'Backlog';
    const isDone = p => p.stage === 'Done';

    const teamData = {
      content: { active: contentP.filter(isAct).length, done: contentP.filter(isDone).length, total: contentP.length || 1 },
      editing: { active: contentP.filter(p => p.stage === 'Editing' || p.stage === 'Review').length, done: contentP.filter(isDone).length, total: Math.max(contentP.length, 1) },
      design: { active: designP.filter(isAct).length, done: designP.filter(isDone).length, total: designP.length || 1 },
      dev: { active: devP.filter(isAct).length, done: devP.filter(isDone).length, total: devP.length || 1 },
      marketing: { active: 0, done: 0, total: 1 },
      hardware: { active: clients.filter(c => c.service === 'hardware' && c.status === 'active').length, done: clients.filter(c => c.service === 'hardware' && c.status === 'completed').length, total: clients.filter(c => c.service === 'hardware').length || 1 },
    };

    const topProjects = [...visibleProjects].filter(isAct).sort((a, b) => {
      const aO = a.dueDate && new Date(a.dueDate) < now ? -1 : 0;
      const bO = b.dueDate && new Date(b.dueDate) < now ? -1 : 0;
      return aO !== bO ? aO - bO : (b.lastUpdated || 0) - (a.lastUpdated || 0);
    }).slice(0, 6);

    const overdue = visibleProjects.filter(p => p.dueDate && new Date(p.dueDate) < now && p.stage !== 'Done').length;
    const blocked = visibleProjects.filter(p => p.status === 'Blocked').length;

    return { revMTD, activeClients, leads, teamData, topProjects, overdue, blocked, attention: overdue + blocked };
  }, [visibleProjects, users, clients, revenue, now]);

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-full p-5 md:p-8 space-y-8" style={{ background: 'var(--bg)' }}>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text)' }}>{greeting}, {currentUser?.name?.split(' ')[0]} 👋</h1>
          <p className="text-base mt-1" style={{ color: 'var(--text-secondary)' }}>{isMgr ? "Here's your organization at a glance" : "Here's your work at a glance"}</p>
        </div>
        {isMgr && (
          <div className="flex gap-2.5">
            <button onClick={() => setShowAddClient(true)} className="px-4 py-2 rounded-2xl border text-sm font-bold transition-all hover:scale-105" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Plus size={14} className="inline mr-1" />Client
            </button>
            <button onClick={() => setShowAddRevenue(true)} className="px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/20">
              <Plus size={14} className="inline mr-1" />Revenue
            </button>
          </div>
        )}
      </motion.div>

      {/* KPIs */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isMgr ? (
          <>
            <KPI label="Revenue" value={`₹${data.revMTD.toLocaleString()}`} icon={DollarSign} gradient="from-amber-500 to-yellow-500" sub="This month" />
            <KPI label="Clients" value={data.activeClients} icon={Briefcase} gradient="from-cyan-500 to-teal-500" sub={`${data.leads} leads`} />
          </>
        ) : (
          <>
            <KPI label="My Active" value={data.topProjects.length} icon={CheckCircle} gradient="from-indigo-500 to-violet-500" sub="Assigned to me" />
            <KPI label="Done" value={visibleProjects.filter(p => p.stage === 'Done').length} icon={CheckCircle} gradient="from-emerald-500 to-green-500" sub="Completed" />
          </>
        )}
        <KPI label="In Progress" value={data.topProjects.length} icon={CheckCircle} gradient="from-emerald-500 to-green-500" sub={`${visibleProjects.filter(p => p.stage === 'Done').length} done`} />
        <KPI label="Attention" value={data.attention} icon={AlertTriangle} gradient={data.attention > 2 ? 'from-rose-500 to-pink-500' : 'from-amber-500 to-yellow-500'} sub={`${data.overdue} overdue`} />
      </motion.div>

      {/* Team Performance — managers only */}
      {isMgr && (
        <motion.div variants={fade} initial="hidden" animate="show" className="rounded-3xl border p-7" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Team Performance</h2>
            <Link href="/performance" className="text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--primary)' }}>View All <ArrowUpRight size={14} /></Link>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-wrap justify-center gap-10 md:gap-14">
            {Object.entries(data.teamData).map(([key, d]) => (
              <TeamRing key={key} teamKey={key} active={d.active} done={d.done} total={d.total} />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Active Projects */}
      <motion.div variants={fade} initial="hidden" animate="show" className="rounded-3xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>{isMgr ? 'Active Projects' : 'My Projects'}</h2>
          <Link href="/projects" className="text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--primary)' }}>See All <ArrowUpRight size={14} /></Link>
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show" className="py-2">
          {data.topProjects.length > 0 ? data.topProjects.map(p => (
            <Link key={p.id} href="/board"><ProjectRow project={p} /></Link>
          )) : (
            <div className="py-14 text-center text-base" style={{ color: 'var(--text-muted)' }}>No active projects right now</div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      {isMgr && showAddClient && <Modal title="Add Client" onClose={() => setShowAddClient(false)}><ClientForm onSave={() => { setShowAddClient(false); window.location.reload(); }} /></Modal>}
      {isMgr && showAddRevenue && <Modal title="Add Revenue" onClose={() => setShowAddRevenue(false)}><RevenueForm onSave={() => { setShowAddRevenue(false); window.location.reload(); }} /></Modal>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl shadow-2xl w-full max-w-md p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-5"><h3 className="text-xl font-black" style={{ color: 'var(--text)' }}>{title}</h3><button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button></div>
        {children}
      </motion.div>
    </div>
  );
}

function ClientForm({ onSave }) {
  const [f, setF] = useState({ companyName: '', contactName: '', status: 'lead', source: 'direct', service: 'other', budget: '' });
  const [saving, setSaving] = useState(false);
  const inputCls = "w-full rounded-2xl px-4 py-3 text-[15px] font-medium outline-none transition-all border";
  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' };
  return (
    <form onSubmit={async e => { e.preventDefault(); if (!f.companyName.trim()) return; setSaving(true); try { const r = await fetchWithAuth('/api/clients', { method: 'POST', body: JSON.stringify(f) }); if (r.ok) onSave(); } catch (_) {} setSaving(false); }} className="space-y-3">
      <input placeholder="Company Name *" value={f.companyName} onChange={e => setF(p => ({ ...p, companyName: e.target.value }))} className={inputCls} style={inputStyle} required autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Contact" value={f.contactName} onChange={e => setF(p => ({ ...p, contactName: e.target.value }))} className={inputCls} style={inputStyle} />
        <input placeholder="Budget" value={f.budget} onChange={e => setF(p => ({ ...p, budget: e.target.value }))} className={inputCls} style={inputStyle} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} className={inputCls} style={inputStyle}><option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option></select>
        <select value={f.source} onChange={e => setF(p => ({ ...p, source: e.target.value }))} className={inputCls} style={inputStyle}><option value="direct">Direct</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option></select>
        <select value={f.service} onChange={e => setF(p => ({ ...p, service: e.target.value }))} className={inputCls} style={inputStyle}><option value="other">Service</option><option value="content">Content</option><option value="design">Design</option><option value="development">Dev</option><option value="hardware">Hardware</option></select>
      </div>
      <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-40 shadow-lg shadow-violet-500/20 transition-all">{saving ? 'Saving...' : 'Add Client'}</button>
    </form>
  );
}

function RevenueForm({ onSave }) {
  const now = new Date();
  const [f, setF] = useState({ stream: 'content_monetization', amount: '', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, description: '' });
  const [saving, setSaving] = useState(false);
  const inputCls = "w-full rounded-2xl px-4 py-3 text-[15px] font-medium outline-none transition-all border";
  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' };
  return (
    <form onSubmit={async e => { e.preventDefault(); if (!f.amount) return; setSaving(true); try { const r = await fetchWithAuth('/api/revenue', { method: 'POST', body: JSON.stringify(f) }); if (r.ok) onSave(); } catch (_) {} setSaving(false); }} className="space-y-3">
      <select value={f.stream} onChange={e => setF(p => ({ ...p, stream: e.target.value }))} className={inputCls} style={inputStyle}>
        <option value="content_monetization">🎬 Content</option><option value="client_services">💼 Client Services</option><option value="courses">🎓 Courses</option><option value="hardware">🔧 Hardware</option><option value="classory_saas">🖥️ Classory SaaS</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Amount (₹)" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} className={inputCls} style={inputStyle} required min="0" autoFocus />
        <input type="month" value={f.month} onChange={e => setF(p => ({ ...p, month: e.target.value }))} className={inputCls} style={inputStyle} />
      </div>
      <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 shadow-lg shadow-amber-500/20 transition-all">{saving ? 'Saving...' : 'Add Revenue'}</button>
    </form>
  );
}

function formatDue(d) { const days = Math.ceil((new Date(d) - new Date()) / 86400000); if (days < 0) return `${Math.abs(days)}d late`; if (days === 0) return 'Today'; if (days === 1) return 'Tomorrow'; return `${days}d left`; }
