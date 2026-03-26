'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DollarSign, Briefcase, CheckCircle, AlertTriangle, Plus, X, Zap, ChevronRight, ArrowUpRight } from 'lucide-react';
import { fetchWithAuth } from '@/services/api';

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const TEAMS = {
  content: { label: 'Content', emoji: '🎬', color: '#4f46e5', bg: '#eef2ff', href: '/performance?team=content', ring: 'stroke-indigo-500', track: 'stroke-indigo-100' },
  editing: { label: 'Editing', emoji: '✂️', color: '#7c3aed', bg: '#f5f3ff', href: '/performance?team=editing', ring: 'stroke-violet-500', track: 'stroke-violet-100' },
  design: { label: 'Design', emoji: '🎨', color: '#db2777', bg: '#fdf2f8', href: '/design-projects', ring: 'stroke-pink-500', track: 'stroke-pink-100' },
  dev: { label: 'Dev', emoji: '💻', color: '#0891b2', bg: '#ecfeff', href: '/dev-projects', ring: 'stroke-cyan-500', track: 'stroke-cyan-100' },
  marketing: { label: 'Marketing', emoji: '📣', color: '#d97706', bg: '#fffbeb', href: '/instagram', ring: 'stroke-amber-500', track: 'stroke-amber-100' },
  hardware: { label: 'Hardware', emoji: '🔧', color: '#059669', bg: '#ecfdf5', href: '/clients?service=hardware', ring: 'stroke-emerald-500', track: 'stroke-emerald-100' },
};

function TeamRing({ teamKey, active, done, total, onClick }) {
  const t = TEAMS[teamKey];
  if (!t) return null;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 38, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;

  return (
    <motion.div variants={fade} whileHover={{ scale: 1.03 }} onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer group">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={r} fill="none" className={t.track} strokeWidth="6" />
          <motion.circle cx="42" cy="42" r={r} fill="none" className={t.ring} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">{t.emoji}</span>
          <span className="text-[11px] font-extrabold text-stone-700">{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[13px] font-bold text-stone-800 group-hover:text-orange-600 transition-colors">{t.label}</div>
        <div className="text-[10px] text-stone-400">{active} active · {done} done</div>
      </div>
    </motion.div>
  );
}

function ProjectRow({ project, onClick }) {
  const stages = ['Backlog', 'Scripting', 'Shooting', 'Editing', 'Review', 'Publishing', 'Done'];
  const idx = stages.indexOf(project.stage);
  const pct = idx >= 0 ? Math.round(((idx) / (stages.length - 1)) * 100) : 0;
  const overdue = project.dueDate && new Date(project.dueDate) < new Date() && project.stage !== 'Done';
  const done = project.stage === 'Done';

  return (
    <motion.div variants={fade} onClick={() => onClick?.(project)}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50/50 cursor-pointer transition-all group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[11px] font-bold shrink-0">
        {project.creator?.charAt(0) || '?'}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-stone-800 truncate group-hover:text-orange-700">{project.title || 'Untitled'}</div>
        <div className="text-[10px] text-stone-400">{project.creator} · {project.stage}</div>
      </div>
      {/* Progress bar */}
      <div className="w-20 shrink-0 hidden sm:block">
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : overdue ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {/* Due */}
      {project.dueDate ? (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
          done ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-500'
        }`}>{formatDue(project.dueDate)}</span>
      ) : <span className="w-14" />}
      <ChevronRight size={14} className="text-stone-200 group-hover:text-orange-400 shrink-0" />
    </motion.div>
  );
}

function KPI({ label, value, icon: Icon, color, sub }) {
  const c = { amber: 'bg-amber-50 text-amber-600 border-amber-200/50', cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200/50', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/50', rose: 'bg-rose-50 text-rose-600 border-rose-200/50' };
  const s = c[color] || c.cyan;
  return (
    <motion.div variants={fade} className={`rounded-2xl border p-4 ${s}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
        <Icon size={16} className="opacity-50" />
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard({ projects = [], users = [], currentUser, clients = [], revenue = [] }) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const revMTD = revenue.filter(r => r.month === month).reduce((s, r) => s + (r.amount || 0), 0);
    const activeClients = clients.filter(c => c.status === 'active').length;
    const leads = clients.filter(c => c.status === 'lead' || c.status === 'prospect').length;
    const contentP = projects.filter(p => !p.projectType || p.projectType === 'content');
    const designP = projects.filter(p => p.projectType === 'design');
    const devP = projects.filter(p => p.projectType === 'dev');
    const isActive = p => p.stage !== 'Done' && p.stage !== 'Backlog';
    const isDone = p => p.stage === 'Done';

    const teamData = {
      content: { active: contentP.filter(isActive).length, done: contentP.filter(isDone).length, total: contentP.length },
      editing: { active: contentP.filter(p => p.stage === 'Editing' || p.stage === 'Review').length, done: contentP.filter(p => p.stage === 'Done' || p.stage === 'Publishing').length, total: contentP.filter(p => ['Editing', 'Review', 'Done', 'Publishing'].includes(p.stage)).length || 1 },
      design: { active: designP.filter(isActive).length, done: designP.filter(isDone).length, total: designP.length },
      dev: { active: devP.filter(isActive).length, done: devP.filter(isDone).length, total: devP.length },
      marketing: { active: 0, done: 0, total: 0 },
      hardware: { active: clients.filter(c => c.service === 'hardware' && c.status === 'active').length, done: clients.filter(c => c.service === 'hardware' && c.status === 'completed').length, total: clients.filter(c => c.service === 'hardware').length },
    };

    const topProjects = [...projects].filter(isActive).sort((a, b) => {
      const aOverdue = a.dueDate && new Date(a.dueDate) < now ? -1 : 0;
      const bOverdue = b.dueDate && new Date(b.dueDate) < now ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return (b.lastUpdated || 0) - (a.lastUpdated || 0);
    }).slice(0, 8);

    const overdueCount = projects.filter(p => p.dueDate && new Date(p.dueDate) < now && p.stage !== 'Done').length;
    const blockedCount = projects.filter(p => p.status === 'Blocked').length;
    const attentionCount = overdueCount + blockedCount + clients.filter(c => c.status === 'lead' && c.requirements).length;

    return { revMTD, activeClients, leads, teamData, topProjects, attentionCount, overdueCount, blockedCount };
  }, [projects, users, clients, revenue, now]);

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-full bg-[#faf9f7] p-4 md:p-6 lg:p-8 space-y-7">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-800">{greeting}, {currentUser?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-stone-400 mt-0.5">Here's your organization at a glance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddClient(true)} className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-600 hover:border-orange-300 hover:text-orange-600 transition-colors"><Plus size={12} className="inline mr-1" />Client</button>
          <button onClick={() => setShowAddRevenue(true)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-full text-xs font-bold text-white transition-colors"><Plus size={12} className="inline mr-1" />Revenue</button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Revenue MTD" value={`₹${data.revMTD.toLocaleString()}`} icon={DollarSign} color="amber" sub="Manual entry" />
        <KPI label="Active Clients" value={data.activeClients} icon={Briefcase} color="cyan" sub={`${data.leads} leads`} />
        <KPI label="In Progress" value={data.topProjects.length} icon={CheckCircle} color="emerald" sub={`${projects.filter(p => p.stage === 'Done').length} completed`} />
        <KPI label="Attention" value={data.attentionCount} icon={AlertTriangle} color={data.attentionCount > 2 ? 'rose' : 'amber'} sub={`${data.overdueCount} overdue · ${data.blockedCount} stuck`} />
      </motion.div>

      {/* Team Performance Rings */}
      <motion.div variants={fade} initial="hidden" animate="show" className="bg-white rounded-2xl border border-stone-200/70 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-extrabold text-stone-800">Team Performance</h2>
          <Link href="/performance" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">View All <ArrowUpRight size={12} /></Link>
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {Object.entries(data.teamData).map(([key, d]) => (
            <Link key={key} href={TEAMS[key]?.href || '/dashboard'}>
              <TeamRing teamKey={key} active={d.active} done={d.done} total={d.total || 1} />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Active Projects */}
      <motion.div variants={fade} initial="hidden" animate="show" className="bg-white rounded-2xl border border-stone-200/70">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-[15px] font-extrabold text-stone-800">Active Projects</h2>
          <Link href="/projects" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">See All <ArrowUpRight size={12} /></Link>
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show" className="py-1">
          {data.topProjects.length > 0 ? data.topProjects.map(p => (
            <Link key={p.id} href={`/board`}>
              <ProjectRow project={p} />
            </Link>
          )) : (
            <div className="py-10 text-center text-sm text-stone-400">No active projects</div>
          )}
        </motion.div>
      </motion.div>

      {/* Quick modals */}
      {showAddClient && <Modal title="Add Client" onClose={() => setShowAddClient(false)}><ClientForm onSave={() => { setShowAddClient(false); window.location.reload(); }} /></Modal>}
      {showAddRevenue && <Modal title="Add Revenue" onClose={() => setShowAddRevenue(false)}><RevenueForm onSave={() => { setShowAddRevenue(false); window.location.reload(); }} /></Modal>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-stone-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="text-lg font-bold text-stone-800">{title}</h3><button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={18} /></button></div>
        {children}
      </motion.div>
    </div>
  );
}

function ClientForm({ onSave }) {
  const [f, setF] = useState({ companyName: '', contactName: '', status: 'lead', source: 'direct', service: 'other', budget: '' });
  const [saving, setSaving] = useState(false);
  const cls = "border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400";
  return (
    <form onSubmit={async e => { e.preventDefault(); if (!f.companyName.trim()) return; setSaving(true); try { const r = await fetchWithAuth('/api/clients', { method: 'POST', body: JSON.stringify(f) }); if (r.ok) onSave(); } catch (_) {} setSaving(false); }} className="space-y-3">
      <input placeholder="Company Name *" value={f.companyName} onChange={e => setF(p => ({ ...p, companyName: e.target.value }))} className={`w-full ${cls}`} required autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Contact" value={f.contactName} onChange={e => setF(p => ({ ...p, contactName: e.target.value }))} className={cls} />
        <input placeholder="Budget" value={f.budget} onChange={e => setF(p => ({ ...p, budget: e.target.value }))} className={cls} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} className={`${cls} text-stone-600`}><option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option></select>
        <select value={f.source} onChange={e => setF(p => ({ ...p, source: e.target.value }))} className={`${cls} text-stone-600`}><option value="direct">Direct</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option></select>
        <select value={f.service} onChange={e => setF(p => ({ ...p, service: e.target.value }))} className={`${cls} text-stone-600`}><option value="other">Service</option><option value="content">Content</option><option value="design">Design</option><option value="development">Dev</option><option value="hardware">Hardware</option></select>
      </div>
      <button type="submit" disabled={saving} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl text-sm font-bold text-white">{saving ? 'Saving...' : 'Add Client'}</button>
    </form>
  );
}

function RevenueForm({ onSave }) {
  const now = new Date();
  const [f, setF] = useState({ stream: 'content_monetization', amount: '', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, description: '' });
  const [saving, setSaving] = useState(false);
  const cls = "border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400";
  return (
    <form onSubmit={async e => { e.preventDefault(); if (!f.amount) return; setSaving(true); try { const r = await fetchWithAuth('/api/revenue', { method: 'POST', body: JSON.stringify(f) }); if (r.ok) onSave(); } catch (_) {} setSaving(false); }} className="space-y-3">
      <select value={f.stream} onChange={e => setF(p => ({ ...p, stream: e.target.value }))} className={`w-full ${cls} text-stone-600`}>
        <option value="content_monetization">🎬 Content</option><option value="client_services">💼 Client Services</option><option value="courses">🎓 Courses</option><option value="hardware">🔧 Hardware</option><option value="classory_saas">🖥️ Classory SaaS</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Amount (₹)" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} className={cls} required min="0" autoFocus />
        <input type="month" value={f.month} onChange={e => setF(p => ({ ...p, month: e.target.value }))} className={`${cls} text-stone-600`} />
      </div>
      <button type="submit" disabled={saving} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl text-sm font-bold text-white">{saving ? 'Saving...' : 'Add Revenue'}</button>
    </form>
  );
}

function formatDue(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d late`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}
