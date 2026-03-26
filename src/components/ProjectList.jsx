'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, ChevronDown } from 'lucide-react';

const STATUS_PILLS = {
  'Not Started': { label: 'Not Started', cls: 'bg-stone-100 text-stone-500' },
  'In Progress': { label: 'Working', cls: 'bg-blue-50 text-blue-600' },
  'Done': { label: 'Done', cls: 'bg-emerald-50 text-emerald-600' },
  'Blocked': { label: 'Stuck', cls: 'bg-rose-50 text-rose-600' },
};

const STAGE_PILLS = {
  'Backlog': '💡', 'Scripting': '📝', 'Shooting': '🎬', 'Editing': '✂️',
  'Review': '👀', 'Publishing': '🚀', 'Done': '✅',
  'Briefing': '📋', 'Concept': '💭', 'Design': '🎨', 'Approved': '👍', 'Delivered': '📦',
  'Planning': '📐', 'Development': '💻', 'Testing': '🧪', 'Code Review': '🔍', 'QA': '✔️', 'Deployed': '🚀',
};

function formatDue(dueDate) {
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d late`, cls: 'text-rose-600' };
  if (days === 0) return { text: 'Today', cls: 'text-amber-600' };
  if (days <= 3) return { text: `${days}d left`, cls: 'text-amber-600' };
  return { text: `${days}d left`, cls: 'text-stone-400' };
}

export default function ProjectList({ projects = [], onSelectProject, onCreateProject }) {
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.creator?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStage !== 'all' && p.stage !== filterStage) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterType !== 'all' && (p.projectType || 'content') !== filterType) return false;
      return true;
    }).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  }, [projects, search, filterStage, filterStatus, filterType]);

  const stages = useMemo(() => Array.from(new Set(projects.map(p => p.stage).filter(Boolean))).sort(), [projects]);
  const types = useMemo(() => {
    const set = new Set(projects.map(p => p.projectType || 'content'));
    return Array.from(set);
  }, [projects]);

  return (
    <div className="min-h-full bg-[#f5f3ef] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-800">Projects</h1>
          <p className="text-sm text-stone-400">{filtered.length} of {projects.length} projects</p>
        </div>
        {onCreateProject && (
          <button onClick={onCreateProject} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-colors">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center bg-white border border-stone-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search size={14} className="text-stone-400" />
          <input type="text" placeholder="Search projects or people..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-stone-800 outline-none ml-2 w-full placeholder-stone-400" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 outline-none">
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t === 'content' ? '🎬 Content' : t === 'design' ? '🎨 Design' : t === 'dev' ? '💻 Dev' : t}</option>)}
        </select>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 outline-none">
          <option value="all">All Stages</option>
          {stages.map(s => <option key={s} value={s}>{STAGE_PILLS[s] || ''} {s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 outline-none">
          <option value="all">All Status</option>
          {Object.entries(STATUS_PILLS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Project</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden md:table-cell">Person</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Stage</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Due</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden xl:table-cell">Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const due = formatDue(p.dueDate);
              const statusPill = STATUS_PILLS[p.status] || STATUS_PILLS['Not Started'];
              const type = p.projectType || 'content';
              const typeEmoji = type === 'content' ? '🎬' : type === 'design' ? '🎨' : '💻';
              return (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => onSelectProject?.(p)} className="border-b border-stone-100/60 hover:bg-orange-50/30 cursor-pointer transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold text-stone-800 line-clamp-1">{p.title || 'Untitled'}</div>
                    {p.topic && <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{p.topic}</div>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {p.creator ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">{p.creator.charAt(0)}</div>
                        <span className="text-xs text-stone-600">{p.creator}</span>
                      </div>
                    ) : <span className="text-xs text-stone-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium text-stone-600">{STAGE_PILLS[p.stage] || ''} {p.stage}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${statusPill.cls}`}>{statusPill.label}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {due ? <span className={`text-xs font-medium ${due.cls}`}>{due.text}</span> : <span className="text-xs text-stone-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell">
                    <span className="text-xs text-stone-500">{typeEmoji} {type}</span>
                  </td>
                </motion.tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-16 text-sm text-stone-400">No projects match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
