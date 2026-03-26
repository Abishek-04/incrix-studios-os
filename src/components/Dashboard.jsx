'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, Target, Inbox, AlertTriangle, ArrowUpRight,
  ArrowDownRight, TrendingUp, Clock, CheckCircle, XCircle, Flame,
  Plus, X, ChevronRight, Activity, Zap, BarChart3, ExternalLink
} from 'lucide-react';
import { fetchWithAuth } from '@/services/api';

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};
const stagger = { show: { transition: { staggerChildren: 0.07 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35 } }
};

// ─── Count-up Hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    ref.current = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(ref.current); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(ref.current);
  }, [target, duration]);
  return count;
}

// ─── Team Config ──────────────────────────────────────────────────────────────
const TEAM_CONFIG = {
  content: { label: 'Content', emoji: '🎬', gradient: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/30', dot: 'bg-indigo-400', text: 'text-indigo-300', ring: 'ring-indigo-500/20' },
  editing: { label: 'Editing', emoji: '✂️', gradient: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/30', dot: 'bg-violet-400', text: 'text-violet-300', ring: 'ring-violet-500/20' },
  design: { label: 'Design', emoji: '🎨', gradient: 'from-pink-500/20 to-pink-600/5', border: 'border-pink-500/30', dot: 'bg-pink-400', text: 'text-pink-300', ring: 'ring-pink-500/20' },
  dev: { label: 'Development', emoji: '💻', gradient: 'from-sky-500/20 to-sky-600/5', border: 'border-sky-500/30', dot: 'bg-sky-400', text: 'text-sky-300', ring: 'ring-sky-500/20' },
  marketing: { label: 'Marketing', emoji: '📈', gradient: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30', dot: 'bg-amber-400', text: 'text-amber-300', ring: 'ring-amber-500/20' },
  hardware: { label: 'Hardware', emoji: '🔧', gradient: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-500/20' },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ title, value, icon: Icon, color, suffix = '', prefix = '', trend, subtitle }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);
  const displayValue = typeof value === 'number' ? animatedValue : value;

  const colorMap = {
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/5' },
    cyan: { bg: 'bg-sky-500/10', icon: 'text-sky-400', border: 'border-sky-500/20', glow: 'shadow-sky-500/5' },
    indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/5' },
    violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20', glow: 'shadow-violet-500/5' },
    rose: { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/5' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative bg-[#0d0f1c] border ${c.border} rounded-2xl p-5 overflow-hidden group cursor-default hover:shadow-xl ${c.glow} transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-[#4a5090] uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">{prefix}{displayValue}{suffix}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-[#3d4270] mt-1">{subtitle}</p>}
      {/* Glow effect */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 ${c.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </motion.div>
  );
}

// ─── Team Status Row ──────────────────────────────────────────────────────────
function TeamStatusRow({ teamKey, activeCount, overdueCount, blockedCount, doneCount, members }) {
  const cfg = TEAM_CONFIG[teamKey];
  if (!cfg) return null;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 2, transition: { duration: 0.15 } }}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gradient-to-r ${cfg.gradient} border ${cfg.border} hover:border-opacity-60 transition-all cursor-default group`}
    >
      <span className="text-xl">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
          {members > 0 && <span className="text-[10px] text-[#3d4270]">{members} members</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            <span className="text-[#8890c0] font-medium">{activeCount} active</span>
          </div>
        )}
        {overdueCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="text-amber-400 font-medium">{overdueCount}</span>
          </div>
        )}
        {blockedCount > 0 && (
          <div className="flex items-center gap-1">
            <XCircle size={12} className="text-rose-400" />
            <span className="text-rose-400 font-medium">{blockedCount}</span>
          </div>
        )}
        {doneCount > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-400" />
            <span className="text-emerald-400 font-medium">{doneCount}</span>
          </div>
        )}
        {activeCount === 0 && overdueCount === 0 && blockedCount === 0 && doneCount === 0 && (
          <span className="text-[#2a2e52] text-xs">No activity</span>
        )}
      </div>
      <ChevronRight size={14} className="text-[#2a2e52] group-hover:text-[#4a5090] transition-colors" />
    </motion.div>
  );
}

// ─── Pipeline Card ────────────────────────────────────────────────────────────
function PipelineCard({ title, emoji, stages, color }) {
  const colorMap = {
    cyan: { border: 'border-sky-500/20', bg: 'bg-sky-500/5', text: 'text-sky-300', bar: 'bg-sky-500' },
    violet: { border: 'border-violet-500/20', bg: 'bg-violet-500/5', text: 'text-violet-300', bar: 'bg-violet-500' },
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-300', bar: 'bg-emerald-500' },
  };
  const c = colorMap[color] || colorMap.cyan;
  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <motion.div variants={fadeUp} className={`bg-[#0d0f1c] border ${c.border} rounded-2xl p-5 hover:shadow-lg transition-shadow`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className={`ml-auto text-lg font-bold ${c.text}`}>{total}</span>
      </div>
      <div className="space-y-2.5">
        {stages.map((st, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] text-[#4a5090] w-20 truncate">{st.label}</span>
            <div className="flex-1 h-1.5 bg-[#151830] rounded-full overflow-hidden">
              <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: total > 0 ? `${(st.count / Math.max(total, 1)) * 100}%` : '0%' }} />
            </div>
            <span className={`text-xs font-medium ${c.text} w-5 text-right`}>{st.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Content Quota Bar ────────────────────────────────────────────────────────
function QuotaBar({ label, actual, target, color }) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const colorMap = {
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    pink: 'bg-pink-500',
    violet: 'bg-violet-500',
  };
  const barColor = colorMap[color] || 'bg-indigo-500';
  const isComplete = actual >= target && target > 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#4a5090] w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#151830] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : barColor}`}
        />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${isComplete ? 'text-emerald-400' : 'text-[#6b7199]'}`}>{actual}/{target}</span>
    </div>
  );
}

// ─── Urgent Item ──────────────────────────────────────────────────────────────
function UrgentItem({ icon: Icon, text, type, color }) {
  const colorMap = {
    red: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };
  const c = colorMap[color] || colorMap.red;

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${c} text-xs font-medium`}>
      <Icon size={13} />
      <span className="truncate">{text}</span>
    </div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────
function ActivityItem({ user, action, time, color }) {
  return (
    <div className="flex items-start gap-2.5 py-2 px-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${color || 'bg-indigo-600'}`}>
        {user?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#8890c0]">
          <span className="text-white font-medium">{user}</span>{' '}{action}
        </p>
        <span className="text-[10px] text-[#2e3258]">{time}</span>
      </div>
    </div>
  );
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────
function AddClientModal({ show, onClose, onSave }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', status: 'lead', source: 'direct', service: 'other', budget: '', requirements: '' });
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/clients', { method: 'POST', body: JSON.stringify(form) });
      if (res.ok) {
        const { client } = await res.json();
        onSave(client);
        setForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', status: 'lead', source: 'direct', service: 'other', budget: '', requirements: '' });
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Add Client / Lead</h3>
          <button onClick={onClose} className="text-[#3d4270] hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Company / Client Name *" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" required />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Contact Person" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
            <input placeholder="Email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
            <input placeholder="Budget (e.g. ₹50k)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
              <option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option><option value="completed">Completed</option>
            </select>
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
              <option value="direct">Direct</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option><option value="other">Other</option>
            </select>
            <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
              <option value="other">Service</option><option value="content">Content</option><option value="design">Design</option><option value="development">Dev</option><option value="hardware">Hardware</option><option value="classory">Classory</option>
            </select>
          </div>
          <textarea placeholder="Requirements / Notes" value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={2} className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50 resize-none" />
          <button type="submit" disabled={saving || !form.companyName.trim()} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors">
            {saving ? 'Saving...' : 'Add Client'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Add Revenue Modal ────────────────────────────────────────────────────────
function AddRevenueModal({ show, onClose, onSave }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [form, setForm] = useState({ stream: 'content_monetization', amount: '', month: currentMonth, description: '' });
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.stream) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/revenue', { method: 'POST', body: JSON.stringify(form) });
      if (res.ok) {
        const { entry } = await res.json();
        onSave(entry);
        setForm({ stream: 'content_monetization', amount: '', month: currentMonth, description: '' });
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Add Revenue Entry</h3>
          <button onClick={onClose} className="text-[#3d4270] hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select value={form.stream} onChange={e => setForm(f => ({ ...f, stream: e.target.value }))} className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
            <option value="content_monetization">Content Monetization</option>
            <option value="client_services">Client Services</option>
            <option value="courses">Course Sales</option>
            <option value="hardware">Hardware Sales</option>
            <option value="classory_saas">Classory SaaS</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" required min="0" />
            <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50" />
          </div>
          <input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
          <button type="submit" disabled={saving || !form.amount} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors">
            {saving ? 'Saving...' : 'Add Revenue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ projects = [], users = [], currentUser, clients = [], revenue = [], activity = [] }) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [localClients, setLocalClients] = useState(clients);
  const [localRevenue, setLocalRevenue] = useState(revenue);

  useEffect(() => { setLocalClients(clients); }, [clients]);
  useEffect(() => { setLocalRevenue(revenue); }, [revenue]);

  // ── Computed metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Revenue MTD
    const revenueMTD = localRevenue
      .filter(r => r.month === currentMonth)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    // Clients
    const activeClients = localClients.filter(c => c.status === 'active').length;
    const openLeads = localClients.filter(c => c.status === 'lead' || c.status === 'prospect').length;

    // Projects
    const allProjects = projects || [];
    const contentProjects = allProjects.filter(p => !p.projectType || p.projectType === 'content');
    const designProjects = allProjects.filter(p => p.projectType === 'design');
    const devProjects = allProjects.filter(p => p.projectType === 'dev');

    const isOverdue = (p) => p.dueDate && new Date(p.dueDate) < now && p.stage !== 'Done';
    const isBlocked = (p) => p.status === 'Blocked';
    const isActive = (p) => p.status === 'In Progress' || (p.stage && p.stage !== 'Done' && p.stage !== 'Backlog');
    const isDone = (p) => p.stage === 'Done';

    const blockedCount = allProjects.filter(isBlocked).length;
    const overdueCount = allProjects.filter(isOverdue).length;
    const stuckProjects = allProjects.filter(p => {
      if (!p.lastUpdated) return false;
      const hoursSinceUpdate = (now - new Date(p.lastUpdated)) / (1000 * 60 * 60);
      return hoursSinceUpdate > 48 && p.stage !== 'Done' && p.stage !== 'Backlog';
    });

    // Teams
    const teamStats = {
      content: { active: contentProjects.filter(isActive).length, overdue: contentProjects.filter(isOverdue).length, blocked: contentProjects.filter(isBlocked).length, done: contentProjects.filter(isDone).length, members: users.filter(u => { const roles = u.roles || [u.role]; return roles.includes('creator'); }).length },
      editing: { active: contentProjects.filter(p => p.stage === 'Editing' || p.stage === 'Review').length, overdue: 0, blocked: 0, done: 0, members: users.filter(u => { const roles = u.roles || [u.role]; return roles.includes('editor'); }).length },
      design: { active: designProjects.filter(isActive).length, overdue: designProjects.filter(isOverdue).length, blocked: designProjects.filter(isBlocked).length, done: designProjects.filter(isDone).length, members: users.filter(u => { const roles = u.roles || [u.role]; return roles.includes('designer'); }).length },
      dev: { active: devProjects.filter(isActive).length, overdue: devProjects.filter(isOverdue).length, blocked: devProjects.filter(isBlocked).length, done: devProjects.filter(isDone).length, members: users.filter(u => { const roles = u.roles || [u.role]; return roles.includes('developer'); }).length },
      marketing: { active: 0, overdue: 0, blocked: 0, done: 0, members: 0 },
      hardware: { active: localClients.filter(c => c.service === 'hardware' && c.status !== 'completed' && c.status !== 'lost').length, overdue: 0, blocked: 0, done: 0, members: 0 },
    };

    // Content quota (aggregate all creators)
    const quotaUsers = users.filter(u => u.quota && (u.quota.youtubeLong > 0 || u.quota.youtubeShort > 0 || u.quota.instagramReel > 0 || u.quota.course > 0));

    // Week start for quota
    let startDate = new Date();
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);

    let totalTarget = { ytLong: 0, ytShort: 0, igReels: 0, courses: 0 };
    let totalActual = { ytLong: 0, ytShort: 0, igReels: 0, courses: 0 };

    quotaUsers.forEach(u => {
      let qStart = new Date(startDate);
      if (u.quota.period === 'monthly') {
        qStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const userDone = contentProjects.filter(p =>
        p.creator === u.name && p.stage === 'Done' && p.lastUpdated >= qStart.getTime()
      );
      totalTarget.ytLong += (u.quota.youtubeLong || 0);
      totalTarget.ytShort += (u.quota.youtubeShort || 0);
      totalTarget.igReels += (u.quota.instagramReel || 0);
      totalTarget.courses += (u.quota.course || 0);
      totalActual.ytLong += userDone.filter(p => p.platform === 'youtube' && (p.contentFormat === 'LongForm' || !p.contentFormat)).length;
      totalActual.ytShort += userDone.filter(p => p.platform === 'youtube' && p.contentFormat === 'ShortForm').length;
      totalActual.igReels += userDone.filter(p => p.platform === 'instagram').length;
      totalActual.courses += userDone.filter(p => p.platform === 'course').length;
    });

    // Urgent items
    const urgentItems = [];
    if (blockedCount > 0) urgentItems.push({ icon: XCircle, text: `${blockedCount} project${blockedCount > 1 ? 's' : ''} blocked`, color: 'red' });
    if (overdueCount > 0) urgentItems.push({ icon: AlertTriangle, text: `${overdueCount} project${overdueCount > 1 ? 's' : ''} overdue`, color: 'amber' });
    if (stuckProjects.length > 0) urgentItems.push({ icon: Clock, text: `${stuckProjects.length} stuck >48h without update`, color: 'amber' });
    const pendingRequests = localClients.filter(c => c.status === 'lead' && c.requirements).length;
    if (pendingRequests > 0) urgentItems.push({ icon: Inbox, text: `${pendingRequests} client request${pendingRequests > 1 ? 's' : ''} pending`, color: 'indigo' });

    // Client pipeline
    const clientPipeline = [
      { label: 'Leads', count: localClients.filter(c => c.status === 'lead').length },
      { label: 'Prospects', count: localClients.filter(c => c.status === 'prospect').length },
      { label: 'Active', count: activeClients },
      { label: 'Completed', count: localClients.filter(c => c.status === 'completed').length },
    ];

    return { revenueMTD, activeClients, openLeads, pendingRequests, blockedCount, overdueCount, teamStats, totalTarget, totalActual, urgentItems, clientPipeline };
  }, [projects, users, localClients, localRevenue]);

  // ── Greeting ────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ── Recent activity (derived from projects) ─────────────────────────────────
  const recentActivity = useMemo(() => {
    if (activity.length > 0) return activity.slice(0, 8);
    // Fallback: derive from projects
    const recent = [...projects]
      .filter(p => p.lastUpdated)
      .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
      .slice(0, 8)
      .map(p => {
        const user = users.find(u => u.name === p.creator || u.id === p.assignedTo);
        const ago = formatTimeAgo(p.lastUpdated);
        return {
          user: p.creator || p.assignedTo || 'Unknown',
          action: `updated "${p.title}" → ${p.stage}`,
          time: ago,
          color: user?.avatarColor || 'bg-indigo-600'
        };
      });
    return recent;
  }, [projects, users, activity]);

  return (
    <div className="min-h-full bg-[#07080e] p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Welcome Bar ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-[#3d4270] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {(metrics.blockedCount > 0 || metrics.overdueCount > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
              <Zap size={13} className="text-rose-400" />
              <span className="text-xs font-semibold text-rose-300">{metrics.blockedCount + metrics.overdueCount} needs attention</span>
            </div>
          )}
          <button onClick={() => setShowAddClient(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300 transition-colors">
            <Plus size={13} /> Client
          </button>
          <button onClick={() => setShowAddRevenue(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-full text-xs font-medium text-amber-300 transition-colors">
            <Plus size={13} /> Revenue
          </button>
        </div>
      </motion.div>

      {/* ── P1: Business Pulse ─────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard title="Revenue MTD" value={metrics.revenueMTD} icon={DollarSign} color="amber" prefix="₹" subtitle="Manual entry" />
        <KPICard title="Active Clients" value={metrics.activeClients} icon={Users} color="cyan" subtitle={`${metrics.openLeads} leads in pipeline`} />
        <KPICard title="Open Leads" value={metrics.openLeads} icon={Target} color="indigo" subtitle="Awaiting conversion" />
        <KPICard title="Pending Requests" value={metrics.urgentItems.length} icon={Inbox} color={metrics.urgentItems.length > 2 ? 'rose' : 'violet'} subtitle="Items needing attention" />
      </motion.div>

      {/* ── P2+P3: Teams + Urgent/Activity ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 md:gap-5">
        {/* Team Status */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-indigo-400" />
            <h2 className="text-sm font-bold text-[#8890c0] uppercase tracking-wider">Team Status</h2>
          </div>
          {Object.entries(metrics.teamStats).map(([key, stats]) => (
            <TeamStatusRow key={key} teamKey={key} activeCount={stats.active} overdueCount={stats.overdue} blockedCount={stats.blocked} doneCount={stats.done} members={stats.members} />
          ))}
        </motion.div>

        {/* Right Panel */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {/* Urgent Panel */}
          {metrics.urgentItems.length > 0 && (
            <motion.div variants={fadeUp} className="bg-[#0d0f1c] border border-rose-500/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-rose-400" />
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Needs Attention</h3>
              </div>
              <div className="space-y-2">
                {metrics.urgentItems.map((item, i) => (
                  <UrgentItem key={i} icon={item.icon} text={item.text} color={item.color} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Activity Feed */}
          <motion.div variants={fadeUp} className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-indigo-400" />
              <h3 className="text-xs font-bold text-[#4a5090] uppercase tracking-wider">Live Activity</h3>
            </div>
            <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-none">
              {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                <ActivityItem key={i} user={item.user} action={item.action} time={item.time} color={item.color} />
              )) : (
                <p className="text-xs text-[#2a2e52] text-center py-6">No recent activity</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── P4: Pipelines ──────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PipelineCard
          title="Client Pipeline"
          emoji="💼"
          color="cyan"
          stages={metrics.clientPipeline}
        />
        <PipelineCard
          title="Classory"
          emoji="🎓"
          color="violet"
          stages={[
            { label: 'Courses', count: projects.filter(p => p.platform === 'course').length },
            { label: 'In Production', count: projects.filter(p => p.platform === 'course' && p.stage !== 'Done').length },
            { label: 'Published', count: projects.filter(p => p.platform === 'course' && p.stage === 'Done').length },
          ]}
        />
        <PipelineCard
          title="Hardware Pipeline"
          emoji="🔧"
          color="emerald"
          stages={[
            { label: 'Leads', count: localClients.filter(c => c.service === 'hardware' && c.status === 'lead').length },
            { label: 'Active', count: localClients.filter(c => c.service === 'hardware' && c.status === 'active').length },
            { label: 'Completed', count: localClients.filter(c => c.service === 'hardware' && c.status === 'completed').length },
          ]}
        />
      </motion.div>

      {/* ── P5: Content Output ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-[#8890c0] uppercase tracking-wider">Content Output This Period</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuotaBar label="YT Long" actual={metrics.totalActual.ytLong} target={metrics.totalTarget.ytLong} color="indigo" />
          <QuotaBar label="YT Shorts" actual={metrics.totalActual.ytShort} target={metrics.totalTarget.ytShort} color="rose" />
          <QuotaBar label="IG Reels" actual={metrics.totalActual.igReels} target={metrics.totalTarget.igReels} color="pink" />
          <QuotaBar label="Courses" actual={metrics.totalActual.courses} target={metrics.totalTarget.courses} color="violet" />
        </div>
      </motion.div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AddClientModal show={showAddClient} onClose={() => setShowAddClient(false)} onSave={(c) => { setLocalClients(prev => [c, ...prev]); setShowAddClient(false); }} />
      <AddRevenueModal show={showAddRevenue} onClose={() => setShowAddRevenue(false)} onSave={(e) => { setLocalRevenue(prev => [e, ...prev]); setShowAddRevenue(false); }} />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
