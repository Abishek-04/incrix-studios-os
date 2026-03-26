'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Eye, ArrowLeft, ArrowRight } from 'lucide-react';

const STAGES = [
  { key: 'Backlog', label: 'Ideas', emoji: '💡', gradient: 'from-zinc-400 to-zinc-500', accent: '#71717a' },
  { key: 'Scripting', label: 'Planning', emoji: '📝', gradient: 'from-blue-500 to-indigo-500', accent: '#6366f1' },
  { key: 'Shooting', label: 'Creating', emoji: '🎬', gradient: 'from-indigo-500 to-violet-500', accent: '#7c3aed' },
  { key: 'Editing', label: 'Editing', emoji: '✂️', gradient: 'from-violet-500 to-purple-500', accent: '#9333ea' },
  { key: 'Review', label: 'Review', emoji: '👀', gradient: 'from-amber-500 to-orange-500', accent: '#f59e0b' },
  { key: 'Publishing', label: 'Publishing', emoji: '🚀', gradient: 'from-cyan-500 to-teal-500', accent: '#06b6d4' },
  { key: 'Done', label: 'Done', emoji: '✅', gradient: 'from-emerald-500 to-green-500', accent: '#10b981' },
];

const STAGE_KEYS = STAGES.map(s => s.key);
const MAX_DONE = 6;

const PLATFORM_STYLE = {
  youtube: { label: 'YouTube', color: '#ff0000', bg: '#fef2f2', icon: '▶️' },
  instagram: { label: 'Instagram', color: '#e1306c', bg: '#fdf2f8', icon: '📷' },
  course: { label: 'Course', color: '#7c3aed', bg: '#f5f3ff', icon: '🎓' },
};

function formatDue(d) {
  if (!d) return null;
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < -7) return { text: `${Math.abs(days)}d late`, cls: 'bg-rose-500 text-white', urgent: true };
  if (days < 0) return { text: `${Math.abs(days)}d late`, cls: 'bg-rose-100 text-rose-700', urgent: true };
  if (days === 0) return { text: 'Today', cls: 'bg-amber-100 text-amber-800', urgent: false };
  if (days <= 3) return { text: `${days}d left`, cls: 'bg-amber-50 text-amber-700', urgent: false };
  return { text: `${days}d`, cls: 'text-[var(--text-muted)]', urgent: false };
}

// Find channel avatar for a project
function getChannelAvatar(project, channels) {
  if (!channels?.length || !project) return null;
  // Match by channel name or platform
  const ch = channels.find(c =>
    (project.channelId && c.id === project.channelId) ||
    (project.channel && c.name === project.channel) ||
    (c.platform === project.platform && c.avatar)
  );
  return ch?.avatar || ch?.avatarUrl || ch?.profilePhoto || null;
}

function BoardCard({ project, onSelect, onDragStart, stageAccent, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight, channels }) {
  const due = formatDue(project.dueDate);
  const platform = PLATFORM_STYLE[project.platform];
  const isUrgent = project.priority === 'High';
  const isDone = project.stage === 'Done';
  const channelAvatar = getChannelAvatar(project, channels);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={e => onDragStart(e, project)}
      className="rounded-2xl cursor-pointer transition-all group relative"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Left accent border */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: stageAccent, opacity: 0.6 }} />

      <div className="p-4 pl-5">
        {/* Platform + Priority row */}
        <div className="flex items-center gap-1.5 mb-2.5">
          {platform && (
            <span className="text-[10px] font-bold px-2 py-[3px] rounded-md border" style={{ background: platform.bg, color: platform.color, borderColor: `${platform.color}20` }}>
              {platform.icon} {platform.label}
            </span>
          )}
          {isUrgent && (
            <span className="text-[10px] font-bold px-2 py-[3px] rounded-md bg-rose-500 text-white">🔥 Urgent</span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-[14px] font-bold leading-snug mb-3 line-clamp-2 transition-colors" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>
          {project.title || 'Untitled'}
        </h4>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          {/* Avatar */}
          <div className="flex items-center gap-2">
            {channelAvatar ? (
              <img src={channelAvatar} alt="" className="w-7 h-7 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: stageAccent }}>
                {project.creator?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{project.creator?.split(' ')[0] || '—'}</span>
          </div>

          {due && (
            <span className={`text-[10px] font-bold px-2 py-[3px] rounded-lg ${due.cls}`}>{due.text}</span>
          )}
        </div>
      </div>

      {/* Move arrows — appear on hover */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {canMoveLeft ? (
          <button onClick={e => { e.stopPropagation(); onMoveLeft(); }}
            className="pointer-events-auto -ml-3 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
            style={{ background: stageAccent }} title="Move left">
            <ArrowLeft size={12} />
          </button>
        ) : <div className="w-6" />}
        {canMoveRight ? (
          <button onClick={e => { e.stopPropagation(); onMoveRight(); }}
            className="pointer-events-auto -mr-3 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
            style={{ background: stageAccent }} title="Move right">
            <ArrowRight size={12} />
          </button>
        ) : <div className="w-6" />}
      </div>
    </motion.div>
  );
}

function BoardColumn({ stage, stageIndex, projects, onSelect, onDragStart, onDrop, onMoveProject, isDone, channels }) {
  const [dragOver, setDragOver] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleProjects = isDone && !showAll ? projects.slice(0, MAX_DONE) : projects;
  const hiddenCount = isDone ? Math.max(0, projects.length - MAX_DONE) : 0;

  return (
    <div
      className={`flex flex-col min-w-[260px] w-[260px] shrink-0 lg:min-w-0 lg:w-auto lg:shrink rounded-2xl border transition-all ${dragOver ? 'ring-2 ring-[var(--primary)]' : ''}`}
      style={{ background: dragOver ? stage.accent + '08' : 'var(--bg-card)', borderColor: 'var(--border)' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, stage.key); }}
    >
      {/* Column header with gradient strip */}
      <div className={`bg-gradient-to-r ${stage.gradient} rounded-t-2xl px-4 py-3 flex items-center gap-2.5`}>
        <span className="text-lg">{stage.emoji}</span>
        <span className="text-[13px] font-bold text-white">{stage.label}</span>
        <span className="text-[12px] font-black text-white/60 bg-white/20 px-2 py-0.5 rounded-md ml-auto">{projects.length}</span>
      </div>

      {/* Cards area */}
      <div className="flex-1 space-y-2.5 p-3 min-h-[100px]">
        {visibleProjects.map(p => (
          <BoardCard
            key={p.id}
            project={p}
            onSelect={() => onSelect?.(p)}
            onDragStart={onDragStart}
            stageAccent={stage.accent}
            channels={channels}
            canMoveLeft={stageIndex > 0}
            canMoveRight={stageIndex < STAGES.length - 1}
            onMoveLeft={() => onMoveProject(p, STAGE_KEYS[stageIndex - 1])}
            onMoveRight={() => onMoveProject(p, STAGE_KEYS[stageIndex + 1])}
          />
        ))}

        {isDone && hiddenCount > 0 && !showAll && (
          <button onClick={() => setShowAll(true)}
            className="w-full py-2.5 rounded-xl border border-dashed text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all hover:border-solid"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Eye size={13} /> +{hiddenCount} more
          </button>
        )}

        {projects.length === 0 && (
          <div className="border border-dashed rounded-xl p-6 text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectBoard({ projects = [], channels = [], onSelectProject, onUpdateProject, onCreateProject, filterType }) {
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

  const moveProject = (project, toStage) => {
    if (project.stage !== toStage) {
      onUpdateProject?.({ ...project, stage: toStage });
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 md:px-6 py-3 border-b shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <select value={filterCreator} onChange={e => setFilterCreator(e.target.value)}
          className="rounded-xl px-3 py-2 text-[13px] font-semibold outline-none border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <option value="all">👥 Everyone</option>
          {creators.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} projects</span>
        {onCreateProject && (
          <button onClick={onCreateProject} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-md shadow-violet-500/20 hover:shadow-lg hover:scale-[1.03] transition-all">
            <Plus size={15} /> New
          </button>
        )}
      </div>

      {/* Board grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-5">
        <div className="flex lg:grid lg:grid-cols-7 gap-3 min-h-full">
          {columns.map((col, i) => (
            <BoardColumn
              key={col.key}
              stage={col}
              stageIndex={i}
              projects={col.projects}
              isDone={col.key === 'Done'}
              channels={channels}
              onSelect={onSelectProject}
              onDragStart={(e, p) => { setDraggedProject(p); e.dataTransfer.effectAllowed = 'move'; }}
              onDrop={(e, stage) => { e.preventDefault(); if (draggedProject && draggedProject.stage !== stage) onUpdateProject?.({ ...draggedProject, stage }); setDraggedProject(null); }}
              onMoveProject={moveProject}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
