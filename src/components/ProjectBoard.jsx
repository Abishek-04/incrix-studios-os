'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Eye } from 'lucide-react';

const STAGES = [
  { key: 'Backlog', label: 'Ideas', emoji: '💡', gradient: 'from-stone-400 to-stone-500', light: '#f5f5f4' },
  { key: 'Scripting', label: 'Planning', emoji: '📝', gradient: 'from-blue-500 to-indigo-500', light: '#eff6ff' },
  { key: 'Shooting', label: 'Creating', emoji: '🎬', gradient: 'from-indigo-500 to-violet-500', light: '#eef2ff' },
  { key: 'Editing', label: 'Editing', emoji: '✂️', gradient: 'from-violet-500 to-purple-500', light: '#f5f3ff' },
  { key: 'Review', label: 'Review', emoji: '👀', gradient: 'from-amber-500 to-orange-500', light: '#fffbeb' },
  { key: 'Publishing', label: 'Publishing', emoji: '🚀', gradient: 'from-cyan-500 to-teal-500', light: '#ecfeff' },
  { key: 'Done', label: 'Done', emoji: '✅', gradient: 'from-emerald-500 to-green-500', light: '#ecfdf5' },
];

const MAX_DONE = 6;

const PLATFORM_CHIPS = {
  youtube: { label: 'YouTube', bg: 'bg-red-50 text-red-600 border-red-200', icon: '▶' },
  instagram: { label: 'Insta', bg: 'bg-pink-50 text-pink-600 border-pink-200', icon: '📸' },
  course: { label: 'Course', bg: 'bg-violet-50 text-violet-600 border-violet-200', icon: '🎓' },
};

function formatDue(d) {
  if (!d) return null;
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d late`, cls: 'bg-rose-500 text-white' };
  if (days === 0) return { text: 'Today', cls: 'bg-amber-500 text-white' };
  if (days <= 3) return { text: `${days}d left`, cls: 'bg-amber-100 text-amber-700' };
  return { text: `${days}d`, cls: 'text-stone-400' };
}

function BoardCard({ project, onSelect, onDragStart, stageColor }) {
  const due = formatDue(project.dueDate);
  const platform = PLATFORM_CHIPS[project.platform];
  const isUrgent = project.priority === 'High';
  const isDone = project.stage === 'Done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={e => onDragStart(e, project)}
      onClick={() => onSelect?.(project)}
      className="rounded-2xl cursor-pointer transition-all group"
      style={{
        background: 'var(--bg-card)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03), 0 8px 20px rgba(0,0,0,0.06), 0 0 0 1px var(--border)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px var(--border)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03), 0 8px 20px rgba(0,0,0,0.06), 0 0 0 1px var(--border)'}
    >
      {/* Colored top strip */}
      <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${stageColor}`} />

      <div className="p-4">
        {/* Tags row */}
        <div className="flex items-center gap-2 mb-3">
          {isUrgent && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500 text-white shadow-sm shadow-rose-500/30">🔥 Urgent</span>
          )}
          {platform && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${platform.bg}`}>
              {platform.icon} {platform.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-[15px] font-bold leading-snug mb-3 line-clamp-2 group-hover:text-[var(--primary)] transition-colors" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>
          {project.title || 'Untitled'}
        </h4>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          {/* Creator */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {project.creator?.charAt(0) || '?'}
            </div>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{project.creator?.split(' ')[0] || 'Unassigned'}</span>
          </div>

          {/* Due badge */}
          {due && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${due.cls}`}>
              {due.text}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function BoardColumn({ stage, projects, onSelect, onDragStart, onDrop, isDone }) {
  const [dragOver, setDragOver] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleProjects = isDone && !showAll ? projects.slice(0, MAX_DONE) : projects;
  const hiddenCount = isDone ? projects.length - MAX_DONE : 0;

  return (
    <div
      className={`flex flex-col min-w-[280px] w-[280px] shrink-0 lg:min-w-0 lg:w-auto lg:shrink transition-all rounded-3xl ${dragOver ? 'ring-2 ring-[var(--primary)] ring-offset-2' : ''}`}
      style={{ background: dragOver ? stage.light : 'transparent' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, stage.key); }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-3">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center text-white text-sm shadow-md`}>
          {stage.emoji}
        </div>
        <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{stage.label}</span>
        <span className="text-[13px] font-black px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{projects.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 px-1 pb-3 min-h-[120px]">
        {visibleProjects.map(p => (
          <BoardCard key={p.id} project={p} onSelect={onSelect} onDragStart={onDragStart} stageColor={stage.gradient} />
        ))}

        {/* Show more for Done */}
        {isDone && hiddenCount > 0 && !showAll && (
          <button onClick={() => setShowAll(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed text-[13px] font-bold flex items-center justify-center gap-2 transition-all hover:border-solid"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Eye size={15} /> View all {projects.length} done
          </button>
        )}

        {projects.length === 0 && (
          <div className="border-2 border-dashed rounded-2xl p-8 text-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-2xl block mb-2">{stage.emoji}</span>
            <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>Drop here</p>
          </div>
        )}
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
  const columns = useMemo(() => STAGES.map(s => ({
    ...s,
    projects: filtered.filter(p => p.stage === s.key).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  })), [filtered]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 md:px-7 py-4 border-b shrink-0" style={{ background: 'var(--bg-header)', borderColor: 'var(--border)' }}>
        <select value={filterCreator} onChange={e => setFilterCreator(e.target.value)}
          className="rounded-2xl px-4 py-2.5 text-[13px] font-semibold outline-none border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <option value="all">👥 Everyone</option>
          {creators.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} projects</span>
        {onCreateProject && (
          <button onClick={onCreateProject} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-105 transition-all">
            <Plus size={16} /> New
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-5 md:p-7">
        <div className="flex lg:grid lg:grid-cols-7 gap-5 min-h-full">
          {columns.map(col => (
            <BoardColumn
              key={col.key}
              stage={col}
              projects={col.projects}
              isDone={col.key === 'Done'}
              onSelect={onSelectProject}
              onDragStart={(e, p) => { setDraggedProject(p); e.dataTransfer.effectAllowed = 'move'; }}
              onDrop={(e, stage) => { e.preventDefault(); if (draggedProject && draggedProject.stage !== stage) onUpdateProject?.({ ...draggedProject, stage }); setDraggedProject(null); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
