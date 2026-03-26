'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, User, AlertTriangle } from 'lucide-react';

const STAGES = [
  { key: 'Backlog', label: 'Ideas', emoji: '💡', color: 'bg-stone-100 text-stone-500', dot: 'bg-stone-400' },
  { key: 'Scripting', label: 'Planning', emoji: '📝', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
  { key: 'Shooting', label: 'Creating', emoji: '🎬', color: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-400' },
  { key: 'Editing', label: 'Editing', emoji: '✂️', color: 'bg-violet-50 text-violet-600', dot: 'bg-violet-400' },
  { key: 'Review', label: 'Review', emoji: '👀', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' },
  { key: 'Publishing', label: 'Publishing', emoji: '🚀', color: 'bg-cyan-50 text-cyan-600', dot: 'bg-cyan-400' },
  { key: 'Done', label: 'Done', emoji: '✅', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
];

const PRIORITY_STYLES = {
  High: 'bg-rose-50 text-rose-600 border-rose-200',
  Medium: 'bg-amber-50 text-amber-600 border-amber-200',
  Low: 'bg-stone-50 text-stone-500 border-stone-200',
};

function formatDue(dueDate) {
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d late`, cls: 'text-rose-600 bg-rose-50' };
  if (days === 0) return { text: 'Today', cls: 'text-amber-600 bg-amber-50' };
  if (days <= 3) return { text: `${days}d left`, cls: 'text-amber-600 bg-amber-50' };
  return { text: `${days}d`, cls: 'text-stone-400 bg-stone-50' };
}

function BoardCard({ project, onSelect, onDragStart }) {
  const due = formatDue(project.dueDate);

  return (
    <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      draggable onDragStart={e => onDragStart(e, project)} onClick={() => onSelect?.(project)}
      className="bg-white rounded-xl border border-stone-200/80 p-3.5 cursor-pointer hover:shadow-md hover:border-stone-300 transition-all active:scale-[0.98]">
      <h4 className="text-[13px] font-semibold text-stone-800 leading-snug mb-2 line-clamp-2">{project.title || 'Untitled'}</h4>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {project.priority === 'High' && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${PRIORITY_STYLES.High}`}>🔥 Urgent</span>}
        {project.platform && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-50 text-stone-500 border border-stone-100">
            {project.platform === 'youtube' ? '▶ YouTube' : project.platform === 'instagram' ? '📸 Insta' : project.platform}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {project.creator ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[9px] font-bold">{project.creator.charAt(0)}</div>
            <span className="text-[11px] text-stone-500">{project.creator.split(' ')[0]}</span>
          </div>
        ) : <div />}
        {due && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${due.cls}`}>{due.text}</span>}
      </div>
    </motion.div>
  );
}

function BoardColumn({ stage, projects, onSelect, onDragStart, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div className={`flex flex-col min-w-[250px] w-[250px] shrink-0 lg:min-w-0 lg:w-auto lg:shrink rounded-2xl transition-colors ${over ? 'bg-orange-50/50 ring-2 ring-orange-200' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); onDrop(e, stage.key); }}>
      <div className="flex items-center gap-2 px-2 py-2 mb-2">
        <span className="text-base">{stage.emoji}</span>
        <span className="text-[13px] font-bold text-stone-700">{stage.label}</span>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${stage.color}`}>{projects.length}</span>
      </div>
      <div className="flex-1 space-y-2 px-1 pb-2 min-h-[100px]">
        {projects.map(p => <BoardCard key={p.id} project={p} onSelect={onSelect} onDragStart={onDragStart} />)}
        {projects.length === 0 && <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center"><p className="text-xs text-stone-300">Empty</p></div>}
      </div>
    </div>
  );
}

export default function ProjectBoard({ projects = [], onSelectProject, onUpdateProject, onCreateProject, filterType }) {
  const [draggedProject, setDraggedProject] = useState(null);
  const [filterCreator, setFilterCreator] = useState('all');

  const filtered = useMemo(() => {
    let list = projects;
    if (filterType === 'design') list = list.filter(p => p.projectType === 'design');
    else if (filterType === 'dev') list = list.filter(p => p.projectType === 'dev');
    else list = list.filter(p => !p.projectType || p.projectType === 'content');
    if (filterCreator !== 'all') list = list.filter(p => p.creator === filterCreator);
    return list;
  }, [projects, filterType, filterCreator]);

  const creators = useMemo(() => Array.from(new Set(projects.map(p => p.creator).filter(Boolean))).sort(), [projects]);
  const columns = useMemo(() => STAGES.map(s => ({ ...s, projects: filtered.filter(p => p.stage === s.key).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)) })), [filtered]);

  return (
    <div className="h-full flex flex-col bg-[#f5f3ef]">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-stone-200/60 bg-white/60 backdrop-blur-sm shrink-0">
        <select value={filterCreator} onChange={e => setFilterCreator(e.target.value)} className="border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-600 outline-none bg-white">
          <option value="all">👥 Everyone</option>
          {creators.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-stone-400">{filtered.length} projects</span>
        {onCreateProject && <button onClick={onCreateProject} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-semibold text-white"><Plus size={14} /> New</button>}
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6">
        <div className="flex lg:grid lg:grid-cols-7 gap-3 min-h-full">
          {columns.map(col => <BoardColumn key={col.key} stage={col} projects={col.projects} onSelect={onSelectProject} onDragStart={(e, p) => { setDraggedProject(p); e.dataTransfer.effectAllowed = 'move'; }} onDrop={(e, stage) => { e.preventDefault(); if (draggedProject && draggedProject.stage !== stage) onUpdateProject?.({ ...draggedProject, stage }); setDraggedProject(null); }} />)}
        </div>
      </div>
    </div>
  );
}
