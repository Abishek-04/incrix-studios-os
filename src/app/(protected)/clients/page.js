'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import {
  Plus, Search, Filter, X, Briefcase, Mail, Phone, DollarSign,
  ChevronDown, MoreHorizontal, ArrowUpRight, User, Calendar,
  Target, CheckCircle, XCircle, Clock, ExternalLink, Edit3, Trash2
} from 'lucide-react';

const STATUS_CONFIG = {
  lead: { label: 'Lead', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
  prospect: { label: 'Prospect', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30', dot: 'bg-violet-400' },
  lost: { label: 'Lost', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dot: 'bg-rose-400' },
};

const SERVICE_CONFIG = {
  content: { label: 'Content', emoji: '🎬' },
  design: { label: 'Design', emoji: '🎨' },
  development: { label: 'Development', emoji: '💻' },
  hardware: { label: 'Hardware', emoji: '🔧' },
  classory: { label: 'Classory', emoji: '🎓' },
  other: { label: 'Other', emoji: '📋' },
};

const SOURCE_LABELS = {
  direct: 'Direct', referral: 'Referral', instagram: 'Instagram',
  linkedin: 'LinkedIn', classory: 'Classory', hardware: 'Hardware', other: 'Other',
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' or 'list'

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetchWithAuth('/api/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterService !== 'all' && c.service !== filterService) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (c.companyName?.toLowerCase().includes(q) || c.contactName?.toLowerCase().includes(q) || c.contactEmail?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [clients, filterStatus, filterService, searchQuery]);

  // Pipeline view data
  const pipeline = useMemo(() => ({
    lead: filteredClients.filter(c => c.status === 'lead'),
    prospect: filteredClients.filter(c => c.status === 'prospect'),
    active: filteredClients.filter(c => c.status === 'active'),
    completed: filteredClients.filter(c => c.status === 'completed'),
    lost: filteredClients.filter(c => c.status === 'lost'),
  }), [filteredClients]);

  const handleDelete = async (clientId) => {
    if (!confirm('Delete this client?')) return;
    try {
      await fetchWithAuth(`/api/clients/${clientId}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
      }
    } catch (err) { console.error(err); }
  };

  // Stats
  const stats = useMemo(() => ({
    total: clients.length,
    leads: clients.filter(c => c.status === 'lead').length,
    active: clients.filter(c => c.status === 'active').length,
    totalBudget: clients.filter(c => c.budget).length,
  }), [clients]);

  return (
    <div className="min-h-full bg-[#07080e] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clients & Leads</h1>
          <p className="text-sm text-[#3d4270] mt-0.5">
            {stats.total} total · {stats.leads} leads · {stats.active} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[#0d0f1c] border border-[#1e2345] rounded-lg p-0.5">
            <button onClick={() => setViewMode('pipeline')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-[#4a5090] hover:text-white'}`}>
              Pipeline
            </button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-[#4a5090] hover:text-white'}`}>
              List
            </button>
          </div>
          <button onClick={() => { setEditingClient(null); setShowAddModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors">
            <Plus size={16} /> Add Client
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center bg-[#0d0f1c] border border-[#1e2345] rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search size={14} className="text-[#3d4270]" />
          <input type="text" placeholder="Search clients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white outline-none ml-2 w-full placeholder-[#3d4270]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-[#0d0f1c] border border-[#1e2345] rounded-xl px-3 py-2 text-sm text-[#8890c0] outline-none">
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterService} onChange={e => setFilterService(e.target.value)}
          className="bg-[#0d0f1c] border border-[#1e2345] rounded-xl px-3 py-2 text-sm text-[#8890c0] outline-none">
          <option value="all">All Services</option>
          {Object.entries(SERVICE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'pipeline' ? (
        /* ── Pipeline View ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(pipeline).map(([status, items]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-bold text-[#6b7199] uppercase tracking-wider">{cfg.label}</span>
                  <span className="text-xs text-[#2e3258] ml-auto">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {items.map(client => (
                    <ClientCard key={client.id} client={client} onEdit={() => { setEditingClient(client); setShowAddModal(true); }} onStatusChange={handleStatusChange} />
                  ))}
                  {items.length === 0 && (
                    <div className="border border-dashed border-[#1e2345] rounded-xl p-6 text-center">
                      <p className="text-xs text-[#2e3258]">No {cfg.label.toLowerCase()}s</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ─────────────────────────────────────────────────── */
        <div className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2345]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#3d4270] uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#3d4270] uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#3d4270] uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#3d4270] uppercase tracking-wider hidden lg:table-cell">Service</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#3d4270] uppercase tracking-wider hidden lg:table-cell">Budget</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#3d4270] uppercase tracking-wider hidden lg:table-cell">Source</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="border-b border-[#151830] hover:bg-[#0f1128] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold text-white">{client.companyName}</div>
                    {client.requirements && <div className="text-[11px] text-[#3d4270] truncate max-w-[200px] mt-0.5">{client.requirements}</div>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="text-sm text-[#8890c0]">{client.contactName || '—'}</div>
                    <div className="text-[11px] text-[#3d4270]">{client.contactEmail || ''}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_CONFIG[client.status]?.color || ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[client.status]?.dot}`} />
                      {STATUS_CONFIG[client.status]?.label || client.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-[#6b7199]">{SERVICE_CONFIG[client.service]?.emoji} {SERVICE_CONFIG[client.service]?.label || client.service}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-[#6b7199]">{client.budget || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-[#3d4270]">{SOURCE_LABELS[client.source] || client.source}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => { setEditingClient(client); setShowAddModal(true); }} className="text-[#3d4270] hover:text-indigo-400 transition-colors p-1">
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-[#2e3258]">No clients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <ClientFormModal
            client={editingClient}
            onClose={() => { setShowAddModal(false); setEditingClient(null); }}
            onSave={(saved) => {
              if (editingClient) {
                setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
              } else {
                setClients(prev => [saved, ...prev]);
              }
              setShowAddModal(false);
              setEditingClient(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Client Card (Pipeline View) ──────────────────────────────────────────────
function ClientCard({ client, onEdit, onStatusChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const svc = SERVICE_CONFIG[client.service] || SERVICE_CONFIG.other;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show"
      className="bg-[#0d0f1c] border border-[#1e2345] rounded-xl p-4 hover:border-[#2a3060] transition-all cursor-pointer group"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-white truncate flex-1">{client.companyName}</h3>
        <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#3d4270] hover:text-white p-0.5">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-4 mt-1 bg-[#151830] border border-[#252b50] rounded-lg shadow-xl z-10 py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <button key={status} onClick={() => { onStatusChange(client.id, status); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#8890c0] hover:bg-[#1e2345] flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> Move to {cfg.label}
            </button>
          ))}
        </div>
      )}

      {client.contactName && (
        <div className="flex items-center gap-1.5 mb-2">
          <User size={11} className="text-[#3d4270]" />
          <span className="text-xs text-[#6b7199]">{client.contactName}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#3d4270]">{svc.emoji} {svc.label}</span>
        {client.budget && <span className="text-[11px] text-emerald-400/80 font-medium">{client.budget}</span>}
      </div>

      {client.requirements && (
        <p className="text-[11px] text-[#2e3258] mt-2 line-clamp-2">{client.requirements}</p>
      )}
    </motion.div>
  );
}

// ─── Client Form Modal ────────────────────────────────────────────────────────
function ClientFormModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({
    companyName: client?.companyName || '',
    contactName: client?.contactName || '',
    contactEmail: client?.contactEmail || '',
    contactPhone: client?.contactPhone || '',
    status: client?.status || 'lead',
    source: client?.source || 'direct',
    service: client?.service || 'other',
    budget: client?.budget || '',
    requirements: client?.requirements || '',
    notes: client?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setSaving(true);
    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients';
      const method = client ? 'PATCH' : 'POST';
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(form) });
      if (res.ok) {
        const data = await res.json();
        onSave(data.client);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d0f1c] border border-[#1e2345] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{client ? 'Edit Client' : 'Add Client / Lead'}</h3>
          <button onClick={onClose} className="text-[#3d4270] hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Company / Client Name *" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
            className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" required autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Contact Person" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
            <input placeholder="Email" type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
            <input placeholder="Budget (e.g. ₹50k)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
              <option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option><option value="completed">Completed</option><option value="lost">Lost</option>
            </select>
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
              <option value="direct">Direct</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option><option value="other">Other</option>
            </select>
            <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
              className="bg-[#080a18] border border-[#1e2345] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50">
              <option value="other">Service Type</option><option value="content">Content</option><option value="design">Design</option><option value="development">Development</option><option value="hardware">Hardware</option><option value="classory">Classory</option>
            </select>
          </div>
          <textarea placeholder="Requirements" value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={2}
            className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50 resize-none" />
          <textarea placeholder="Internal notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="w-full bg-[#080a18] border border-[#1e2345] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3d4270] outline-none focus:border-indigo-500/50 resize-none" />
          <button type="submit" disabled={saving || !form.companyName.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors">
            {saving ? 'Saving...' : (client ? 'Update Client' : 'Add Client')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
