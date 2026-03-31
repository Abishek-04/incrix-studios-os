'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import { Plus, X, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { exportToCsv } from '@/utils/exportCsv';

const STREAMS = {
  content_monetization: { label: 'Content', emoji: '🎬', bar: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  client_services: { label: 'Client Services', emoji: '💼', bar: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
  courses: { label: 'Courses', emoji: '🎓', bar: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  hardware: { label: 'Hardware', emoji: '🔧', bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  classory_saas: { label: 'Classory SaaS', emoji: '🖥️', bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

export default function RevenuePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  useEffect(() => { fetchWithAuth('/api/revenue').then(r => r.json()).then(d => setEntries(d.entries || [])).catch(console.error).finally(() => setLoading(false)); }, []);

  const changeMonth = (dir) => { const d = new Date(month + '-01'); d.setMonth(d.getMonth() + dir); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthEntries = useMemo(() => entries.filter(e => e.month === month), [entries, month]);
  const monthTotal = useMemo(() => monthEntries.reduce((s, e) => s + (e.amount || 0), 0), [monthEntries]);
  const prevMonth = useMemo(() => { const d = new Date(month + '-01'); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }, [month]);
  const prevTotal = useMemo(() => entries.filter(e => e.month === prevMonth).reduce((s, e) => s + (e.amount || 0), 0), [entries, prevMonth]);
  const change = prevTotal > 0 ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100) : 0;
  const allTime = useMemo(() => entries.reduce((s, e) => s + (e.amount || 0), 0), [entries]);
  const streamTotals = useMemo(() => { const t = {}; Object.keys(STREAMS).forEach(k => t[k] = 0); monthEntries.forEach(e => t[e.stream] = (t[e.stream] || 0) + e.amount); return t; }, [monthEntries]);
  const maxStream = Math.max(...Object.values(streamTotals), 1);

  return (
    <div className="min-h-full bg-[var(--bg)] p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-extrabold text-[var(--text)]">Revenue</h1><p className="text-sm text-[var(--text-muted)]">Track income across all streams</p></div>
        <div className="flex items-center gap-2">
          {user?.role === 'superadmin' && (
            <button onClick={() => exportToCsv(entries.map(e => ({
              month: e.month, stream: STREAMS[e.stream]?.label || e.stream, amount: e.amount, description: e.description || '',
            })), 'revenue', [
              { key: 'month', label: 'Month' }, { key: 'stream', label: 'Stream' },
              { key: 'amount', label: 'Amount (₹)' }, { key: 'description', label: 'Description' },
            ])} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}><Download size={13} /> Export</button>
          )}
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl text-sm font-semibold text-white"><Plus size={16} /> Add Entry</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] rounded-xl"><ChevronLeft size={18} /></button>
        <span className="text-[15px] font-bold text-[var(--text)] min-w-[160px] text-center">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] rounded-xl"><ChevronRight size={18} /></button>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          {/* KPIs */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <motion.div variants={fade} className="bg-[var(--bg-card)] rounded-2xl border border-amber-200/60 p-5">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">This Month</span>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[var(--text)]">₹{monthTotal.toLocaleString()}</span>
                {change !== 0 && <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(change)}%</span>}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">vs ₹{prevTotal.toLocaleString()} last month</p>
            </motion.div>
            <motion.div variants={fade} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]/80 p-5">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Entries</span>
              <div className="text-3xl font-extrabold text-[var(--text)] mt-2">{monthEntries.length}</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{Object.values(streamTotals).filter(v => v > 0).length} active streams</p>
            </motion.div>
            <motion.div variants={fade} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]/80 p-5">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">All-Time</span>
              <div className="text-3xl font-extrabold text-[var(--text)] mt-2">₹{allTime.toLocaleString()}</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{entries.length} total entries</p>
            </motion.div>
          </motion.div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <motion.div variants={fade} initial="hidden" animate="show" className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]/80 p-5">
              <h3 className="text-sm font-bold text-[var(--text)] mb-5">Revenue by Stream</h3>
              <div className="space-y-4">
                {Object.entries(STREAMS).map(([key, cfg]) => {
                  const val = streamTotals[key] || 0;
                  const pct = (val / maxStream) * 100;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{cfg.emoji}</span>
                      <span className="text-xs text-[var(--text-secondary)] w-28 truncate">{cfg.label}</span>
                      <div className="flex-1 h-3 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${cfg.bar}`} />
                      </div>
                      <span className={`text-sm font-bold w-24 text-right ${val > 0 ? cfg.text : 'text-[var(--text-muted)]'}`}>₹{val.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(STREAMS).map(([key, cfg]) => (
                <div key={key} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2"><span>{cfg.emoji}</span><span className="text-xs font-semibold text-[var(--text-secondary)]">{cfg.label}</span></div>
                  <span className={`text-xl font-extrabold ${streamTotals[key] > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>₹{(streamTotals[key] || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Entry list */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]/80 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-[var(--border-light)]"><h3 className="text-sm font-bold text-[var(--text)]">Entries — {monthLabel}</h3></div>
            {monthEntries.length > 0 ? (
              <div className="divide-y divide-[var(--border-light)]">
                {monthEntries.map(e => { const cfg = STREAMS[e.stream] || {}; return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--primary-light)]/30">
                    <span className="text-lg">{cfg.emoji || '📋'}</span>
                    <div className="flex-1 min-w-0"><span className="text-sm font-medium text-[var(--text)]">{cfg.label || e.stream}</span>{e.description && <p className="text-[11px] text-[var(--text-muted)] truncate">{e.description}</p>}</div>
                    <span className={`text-sm font-bold ${cfg.text || 'text-[var(--text)]'}`}>₹{(e.amount || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                ); })}
              </div>
            ) : <div className="py-12 text-center text-sm text-[var(--text-muted)]">No entries for {monthLabel}</div>}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md p-6 border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-5"><h3 className="text-lg font-bold text-[var(--text)]">Add Revenue</h3><button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><X size={18} /></button></div>
            <RevenueForm onSave={entry => { setEntries(prev => [entry, ...prev]); setShowModal(false); }} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function RevenueForm({ onSave }) {
  const now = new Date();
  const [f, setF] = useState({ stream: 'content_monetization', amount: '', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, description: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); if (!f.amount) return; setSaving(true);
    try { const res = await fetchWithAuth('/api/revenue', { method: 'POST', body: JSON.stringify(f) }); if (res.ok) { const d = await res.json(); onSave(d.entry); } } catch (_) {} finally { setSaving(false); }
  };
  const cls = "border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
  return (
    <form onSubmit={submit} className="space-y-3">
      <select value={f.stream} onChange={e => setF(p => ({ ...p, stream: e.target.value }))} className={`w-full ${cls} text-[var(--text-secondary)]`}>
        {Object.entries(STREAMS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Amount (₹)" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} className={cls} required min="0" autoFocus />
        <input type="month" value={f.month} onChange={e => setF(p => ({ ...p, month: e.target.value }))} className={`${cls} text-[var(--text-secondary)]`} />
      </div>
      <input placeholder="Description" value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} className={`w-full ${cls}`} />
      <button type="submit" disabled={saving || !f.amount} className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-40 rounded-xl text-sm font-bold text-white">{saving ? 'Saving...' : 'Add Revenue'}</button>
    </form>
  );
}
