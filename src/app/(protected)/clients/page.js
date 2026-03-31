'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import { Plus, Search, X, Edit3, User, MoreHorizontal, Download } from 'lucide-react';
import { exportToCsv } from '@/utils/exportCsv';

const STATUS = {
  lead: { label: 'Lead', cls: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' },
  prospect: { label: 'Prospect', cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-400' },
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', cls: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-400' },
  lost: { label: 'Lost', cls: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-400' },
};
const SERVICE = { content: '🎬 Content', design: '🎨 Design', development: '💻 Dev', hardware: '🔧 Hardware', classory: '🎓 Classory', other: '📋 Other' };
const SOURCE = { direct: 'Direct', referral: 'Referral', instagram: 'Instagram', linkedin: 'LinkedIn', other: 'Other' };

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('pipeline');

  useEffect(() => { fetchWithAuth('/api/clients').then(r => r.json()).then(d => setClients(d.clients || [])).catch(console.error).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => clients.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search) { const q = search.toLowerCase(); return c.companyName?.toLowerCase().includes(q) || c.contactName?.toLowerCase().includes(q); }
    return true;
  }), [clients, filterStatus, search]);

  const pipeline = useMemo(() => ({ lead: filtered.filter(c => c.status === 'lead'), prospect: filtered.filter(c => c.status === 'prospect'), active: filtered.filter(c => c.status === 'active'), completed: filtered.filter(c => c.status === 'completed'), lost: filtered.filter(c => c.status === 'lost') }), [filtered]);

  const handleStatusChange = async (id, status) => {
    try { const res = await fetchWithAuth(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); if (res.ok) setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c)); } catch (_) {}
  };

  return (
    <div className="min-h-full bg-[var(--bg)] p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Clients & Leads</h1>
          <p className="text-sm text-[var(--text-muted)]">{clients.length} total · {clients.filter(c => c.status === 'lead').length} leads · {clients.filter(c => c.status === 'active').length} active</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-0.5">
            <button onClick={() => setView('pipeline')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'pipeline' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)]'}`}>Pipeline</button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'list' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)]'}`}>List</button>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'superadmin' && (
              <button onClick={() => exportToCsv(clients.map(c => ({
                company: c.companyName, contact: c.contactName, email: c.email, phone: c.phone,
                status: c.status, service: c.service, value: c.dealValue || '',
              })), 'clients', [
                { key: 'company', label: 'Company' }, { key: 'contact', label: 'Contact' }, { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' }, { key: 'status', label: 'Status' }, { key: 'service', label: 'Service' },
                { key: 'value', label: 'Deal Value' },
              ])} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}><Download size={13} /> Export</button>
            )}
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl text-sm font-semibold text-white"><Plus size={16} /> Add</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search size={14} className="text-[var(--text-muted)]" />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm text-[var(--text)] outline-none ml-2 w-full placeholder-stone-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-secondary)] outline-none">
          <option value="all">All Status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
      : view === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(pipeline).map(([status, items]) => {
            const cfg = STATUS[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{cfg.label}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {items.map(c => (
                    <div key={c.id} onClick={() => { setEditing(c); setShowModal(true); }} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)]/80 p-4 cursor-pointer hover:shadow-md hover:border-[var(--border)] transition-all">
                      <h3 className="text-sm font-semibold text-[var(--text)] truncate mb-1">{c.companyName}</h3>
                      {c.contactName && <div className="flex items-center gap-1.5 mb-1"><User size={11} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{c.contactName}</span></div>}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-muted)]">{SERVICE[c.service] || c.service}</span>
                        {c.budget && <span className="text-[11px] font-medium text-emerald-600">{c.budget}</span>}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center"><p className="text-xs text-[var(--text-muted)]">Empty</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]/80 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border-light)] bg-[var(--bg-card-hover)]">
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase">Company</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase hidden md:table-cell">Contact</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase hidden lg:table-cell">Service</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase hidden lg:table-cell">Budget</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-[var(--border-light)]/60 hover:bg-[var(--primary-light)]/30 cursor-pointer" onClick={() => { setEditing(c); setShowModal(true); }}>
                  <td className="px-5 py-3.5"><div className="text-[13px] font-semibold text-[var(--text)]">{c.companyName}</div></td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><span className="text-xs text-[var(--text-secondary)]">{c.contactName || '—'}</span></td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-medium px-2 py-1 rounded-full border ${STATUS[c.status]?.cls}`}>{STATUS[c.status]?.label}</span></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-xs text-[var(--text-secondary)]">{SERVICE[c.service]}</span></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-xs text-[var(--text-secondary)]">{c.budget || '—'}</span></td>
                  <td className="px-5 py-3.5"><Edit3 size={14} className="text-[var(--text-muted)] hover:text-[var(--primary)]" /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm text-[var(--text-muted)]">No clients found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg p-6 border border-[var(--border)]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-5"><h3 className="text-lg font-bold text-[var(--text)]">{editing ? 'Edit Client' : 'Add Client'}</h3><button onClick={() => { setShowModal(false); setEditing(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><X size={18} /></button></div>
              <ClientForm client={editing} onSave={saved => { if (editing) setClients(prev => prev.map(c => c.id === saved.id ? saved : c)); else setClients(prev => [saved, ...prev]); setShowModal(false); setEditing(null); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientForm({ client, onSave }) {
  const [f, setF] = useState({ companyName: client?.companyName || '', contactName: client?.contactName || '', contactEmail: client?.contactEmail || '', contactPhone: client?.contactPhone || '', status: client?.status || 'lead', source: client?.source || 'direct', service: client?.service || 'other', budget: client?.budget || '', requirements: client?.requirements || '', notes: client?.notes || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); if (!f.companyName.trim()) return; setSaving(true);
    try { const res = await fetchWithAuth(client ? `/api/clients/${client.id}` : '/api/clients', { method: client ? 'PATCH' : 'POST', body: JSON.stringify(f) }); if (res.ok) { const d = await res.json(); onSave(d.client); } } catch (_) {} finally { setSaving(false); }
  };
  const cls = "border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Company Name *" value={f.companyName} onChange={e => setF(p => ({ ...p, companyName: e.target.value }))} className={`w-full ${cls}`} required autoFocus />
      <div className="grid grid-cols-2 gap-3"><input placeholder="Contact Person" value={f.contactName} onChange={e => setF(p => ({ ...p, contactName: e.target.value }))} className={cls} /><input placeholder="Email" value={f.contactEmail} onChange={e => setF(p => ({ ...p, contactEmail: e.target.value }))} className={cls} /></div>
      <div className="grid grid-cols-2 gap-3"><input placeholder="Phone" value={f.contactPhone} onChange={e => setF(p => ({ ...p, contactPhone: e.target.value }))} className={cls} /><input placeholder="Budget" value={f.budget} onChange={e => setF(p => ({ ...p, budget: e.target.value }))} className={cls} /></div>
      <div className="grid grid-cols-3 gap-3">
        <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} className={`${cls} text-[var(--text-secondary)]`}><option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option><option value="completed">Completed</option><option value="lost">Lost</option></select>
        <select value={f.source} onChange={e => setF(p => ({ ...p, source: e.target.value }))} className={`${cls} text-[var(--text-secondary)]`}><option value="direct">Direct</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option></select>
        <select value={f.service} onChange={e => setF(p => ({ ...p, service: e.target.value }))} className={`${cls} text-[var(--text-secondary)]`}><option value="other">Service</option><option value="content">Content</option><option value="design">Design</option><option value="development">Dev</option><option value="hardware">Hardware</option><option value="classory">Classory</option></select>
      </div>
      <textarea placeholder="Requirements" value={f.requirements} onChange={e => setF(p => ({ ...p, requirements: e.target.value }))} rows={2} className={`w-full ${cls} resize-none`} />
      <button type="submit" disabled={saving || !f.companyName.trim()} className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-40 rounded-xl text-sm font-bold text-white">{saving ? 'Saving...' : client ? 'Update' : 'Add Client'}</button>
    </form>
  );
}
