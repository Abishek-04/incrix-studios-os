'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import {
  Plus, X, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Film, Briefcase, GraduationCap, Cpu, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';

const STREAMS = {
  content_monetization: { label: 'Content', emoji: '🎬', icon: Film, color: 'indigo', gradient: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/25', text: 'text-indigo-300', bar: 'bg-indigo-500' },
  client_services: { label: 'Client Services', emoji: '💼', icon: Briefcase, color: 'sky', gradient: 'from-sky-500/20 to-sky-600/5', border: 'border-sky-500/25', text: 'text-sky-300', bar: 'bg-sky-500' },
  courses: { label: 'Course Sales', emoji: '🎓', icon: GraduationCap, color: 'violet', gradient: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/25', text: 'text-violet-300', bar: 'bg-violet-500' },
  hardware: { label: 'Hardware', emoji: '🔧', icon: Cpu, color: 'emerald', gradient: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/25', text: 'text-emerald-300', bar: 'bg-emerald-500' },
  classory_saas: { label: 'Classory SaaS', emoji: '🖥️', icon: Monitor, color: 'amber', gradient: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/25', text: 'text-amber-300', bar: 'bg-amber-500' },
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export default function RevenuePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try {
      const res = await fetchWithAuth('/api/revenue');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Navigate months
  const changeMonth = (dir) => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + dir);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Monthly data
  const monthEntries = useMemo(() => entries.filter(e => e.month === selectedMonth), [entries, selectedMonth]);
  const monthTotal = useMemo(() => monthEntries.reduce((s, e) => s + (e.amount || 0), 0), [monthEntries]);

  const streamTotals = useMemo(() => {
    const totals = {};
    Object.keys(STREAMS).forEach(k => { totals[k] = 0; });
    monthEntries.forEach(e => { totals[e.stream] = (totals[e.stream] || 0) + e.amount; });
    return totals;
  }, [monthEntries]);

  // All-time total
  const allTimeTotal = useMemo(() => entries.reduce((s, e) => s + (e.amount || 0), 0), [entries]);

  // Previous month comparison
  const prevMonthStr = useMemo(() => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);
  const prevMonthTotal = useMemo(() => entries.filter(e => e.month === prevMonthStr).reduce((s, e) => s + (e.amount || 0), 0), [entries, prevMonthStr]);
  const monthChange = prevMonthTotal > 0 ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100) : 0;

  const maxStreamValue = Math.max(...Object.values(streamTotals), 1);

  return (
    <div className="min-h-full bg-[#07080e] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue</h1>
          <p className="text-sm text-[#3d4270] mt-0.5">Track income across all revenue streams</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-semibold text-white transition-colors">
          <Plus size={16} /> Add Entry
        </button>
      </motion.div>

      {/* Month Picker */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 text-[#3d4270] hover:text-white hover:bg-[#0e1025] rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-semibold text-white min-w-[180px] text-center">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="p-2 text-[#3d4270] hover:text-white hover:bg-[#0e1025] rounded-lg transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <motion.div variants={fadeUp} className="bg-[#0d0f1c] border border-amber-500/20 rounded-2xl p-5">
              <span className="text-[11px] font-bold text-[#4a5090] uppercase tracking-wider">This Month</span>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-white">₹{monthTotal.toLocaleString()}</span>
                {monthChange !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${monthChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {monthChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {Math.abs(monthChange)}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#3d4270] mt-1">vs ₹{prevMonthTotal.toLocaleString()} last month</p>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl p-5">
              <span className="text-[11px] font-bold text-[#4a5090] uppercase tracking-wider">Entries This Month</span>
              <div className="text-3xl font-bold text-white mt-2">{monthEntries.length}</div>
              <p className="text-[11px] text-[#3d4270] mt-1">across {Object.values(streamTotals).filter(v => v > 0).length} streams</p>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl p-5">
              <span className="text-[11px] font-bold text-[#4a5090] uppercase tracking-wider">All-Time Total</span>
              <div className="text-3xl font-bold text-white mt-2">₹{allTimeTotal.toLocaleString()}</div>
              <p className="text-[11px] text-[#3d4270] mt-1">{entries.length} entries total</p>
            </motion.div>
          </motion.div>

          {/* Stream Breakdown */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Bar chart */}
            <motion.div variants={fadeUp} className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#8890c0] uppercase tracking-wider mb-5">Revenue by Stream</h3>
              <div className="space-y-4">
                {Object.entries(STREAMS).map(([key, cfg]) => {
                  const val = streamTotals[key] || 0;
                  const pct = maxStreamValue > 0 ? (val / maxStreamValue) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{cfg.emoji}</span>
                      <span className="text-xs text-[#6b7199] w-28 truncate">{cfg.label}</span>
                      <div className="flex-1 h-3 bg-[#151830] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${cfg.bar}`} />
                      </div>
                      <span className={`text-sm font-bold ${val > 0 ? cfg.text : 'text-[#2e3258]'} w-24 text-right`}>₹{val.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Stream cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(STREAMS).map(([key, cfg]) => {
                const val = streamTotals[key] || 0;
                const Icon = cfg.icon;
                return (
                  <motion.div key={key} variants={fadeUp} className={`bg-gradient-to-br ${cfg.gradient} border ${cfg.border} rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{cfg.emoji}</span>
                      <span className="text-xs font-semibold text-[#8890c0]">{cfg.label}</span>
                    </div>
                    <span className={`text-xl font-bold ${val > 0 ? 'text-white' : 'text-[#2e3258]'}`}>₹{val.toLocaleString()}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Entry list */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1e2345] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#8890c0]">Entries — {monthLabel}</h3>
            </div>
            {monthEntries.length > 0 ? (
              <div className="divide-y divide-[#151830]">
                {monthEntries.map(entry => {
                  const cfg = STREAMS[entry.stream] || {};
                  return (
                    <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#0f1128] transition-colors">
                      <span className="text-lg">{cfg.emoji || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white">{cfg.label || entry.stream}</span>
                        {entry.description && <p className="text-[11px] text-[#3d4270] truncate">{entry.description}</p>}
                      </div>
                      <span className={`text-sm font-bold ${cfg.text || 'text-white'}`}>₹{(entry.amount || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-[#2e3258]">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[#2e3258]">
                No revenue entries for {monthLabel}. Click "Add Entry" to record income.
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Add Revenue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Revenue Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#3d4270] hover:text-white"><X size={18} /></button>
            </div>
            <RevenueForm onSave={(entry) => { setEntries(prev => [entry, ...prev]); setShowAddModal(false); }} />
          </motion.div>
        </div>
      )}
    </div>
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
    try {
      const res = await fetchWithAuth('/api/revenue', { method: 'POST', body: JSON.stringify(form) });
      if (res.ok) {
        const { entry } = await res.json();
        onSave(entry);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select value={form.stream} onChange={e => setForm(f => ({ ...f, stream: e.target.value }))}
        className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50">
        {Object.entries(STREAMS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-amber-500/50" required min="0" autoFocus />
        <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
          className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" />
      </div>
      <input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-amber-500/50" />
      <button type="submit" disabled={saving || !form.amount}
        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors">
        {saving ? 'Saving...' : 'Add Revenue'}
      </button>
    </form>
  );
}
