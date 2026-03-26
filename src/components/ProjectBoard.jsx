'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, ArrowLeft, ArrowRight, Calendar, Clock, User } from 'lucide-react';

const STAGES = [
  { key: 'Backlog', label: 'Ideas', emoji: '💡', color: '#78716c', bg: '#f5f5f4' },
  { key: 'Scripting', label: 'Planning', emoji: '📝', color: '#6366f1', bg: '#eef2ff' },
  { key: 'Shooting', label: 'Creating', emoji: '🎬', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'Editing', label: 'Editing', emoji: '✂️', color: '#a855f7', bg: '#faf5ff' },
  { key: 'Review', label: 'Review', emoji: '👀', color: '#d97706', bg: '#fffbeb' },
  { key: 'Publishing', label: 'Publishing', emoji: '🚀', color: '#0891b2', bg: '#ecfeff' },
  { key: 'Done', label: 'Done', emoji: '✅', color: '#059669', bg: '#ecfdf5' },
];

const STAGE_KEYS = STAGES.map(s => s.key);
const MAX_DONE = 6;

function fmtDate(ts) {
  if (!ts) return null;
  const d = new Date(typeof ts === 'number' ? ts : ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDue(ts) {
  if (!ts) return null;
  const days = Math.ceil((new Date(ts) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'var(--danger)' };
  if (days === 0) return { text: 'Due today', color: 'var(--warning)' };
  if (days <= 3) return { text: `${days}d left`, color: 'var(--warning)' };
  return { text: `${days}d left`, color: 'var(--text-muted)' };
}

function getAvatar(project, channels) {
  if (!channels?.length) return null;
  const ch = channels.find(c => (project.channelId && c.id === project.channelId) || (c.platform === project.platform && (c.avatar || c.avatarUrl)));
  return ch?.avatar || ch?.avatarUrl || ch?.profilePhoto || null;
}

function BoardCard({ project, onSelect, onDragStart, stageColor, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight, channels }) {
  const due = fmtDue(project.dueDate);
  const avatar = getAvatar(project, channels);
  const isDone = project.stage === 'Done';
  const platform = project.platform;
  const topic = project.topic && project.topic !== 'To be decided' ? project.topic : null;
  const createdDate = fmtDate(project.createdAt || project.lastUpdated);
  const publishDate = fmtDate(project.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      draggable
      onDragStart={e => onDragStart(e, project)}
      onClick={() => onSelect?.(project)}
      className="rounded-xl cursor-pointer group relative border transition-colors"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="p-4 space-y-3">
        {/* Row 1: Platform + Priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {platform && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                style={{
                  borderColor: 'var(--border)',
                  color: platform === 'youtube' ? '#dc2626' : platform === 'instagram' ? '#c026d3' : 'var(--primary)',
                  background: platform === 'youtube' ? '#fef2f2' : platform === 'instagram' ? '#fdf4ff' : 'var(--primary-light)'
                }}>
                {platform === 'youtube' ? '▶ YouTube' : platform === 'instagram' ? '◉ Instagram' : platform === 'course' ? '🎓 Course' : platform}
              </span>
            )}
            {project.priority === 'High' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>Urgent</span>
            )}
          </div>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{project.contentFormat === 'ShortForm' ? 'Short' : project.contentFormat === 'LongForm' ? 'Long' : ''}</span>
        </div>

        {/* Row 2: Title */}
        <h4 className="text-[15px] font-bold leading-snug line-clamp-2" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>
          {project.title || 'Untitled'}
        </h4>

        {/* Row 3: Topic / Description */}
        {topic && (
          <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {topic}
          </p>
        )}

        {/* Row 4: Dates */}
        <div className="flex items-center gap-3 flex-wrap">
          {createdDate && (
            <div className="flex items-center gap-1">
              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Created {createdDate}</span>
            </div>
          )}
          {publishDate && (
            <div className="flex items-center gap-1">
              <Calendar size={11} style={{ color: due?.color || 'var(--text-muted)' }} />
              <span className="text-[10px] font-medium" style={{ color: due?.color || 'var(--text-muted)' }}>Publish {publishDate}</span>
            </div>
          )}
        </div>

        {/* Row 5: Assignee + Status */}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex items-center gap-2">
            {avatar ? (
              <img src={avatar} alt="" className="w-7 h-7 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: stageColor }}>
                {project.creator?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <span className="text-[11px] font-semibold block" style={{ color: 'var(--text)' }}>{project.creator || 'Unassigned'}</span>
              {project.editors?.length > 0 && (
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Editor: {project.editors[0]}</span>
              )}
            </div>
          </div>
          {due && (
            <span className="text-[10px] font-semibold" style={{ color: due.color }}>{due.text}</span>
          )}
        </div>
      </div>

      {/* Move arrows on hover */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {canMoveLeft ? (
          <button onClick={e => { e.stopPropagation(); onMoveLeft(); }}
            className="pointer-events-auto -ml-3 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
            style={{ background: stageColor }}>
            <ArrowLeft size={11} />
          </button>
        ) : <div />}
        {canMoveRight ? (
          <button onClick={e => { e.stopPropagation(); onMoveRight(); }}
            className="pointer-events-auto -mr-3 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
            style={{ background: stageColor }}>
            <ArrowRight size={11} />
          </button>
        ) : <div />}
      </div>
    </motion.div>
  );
}

function BoardColumn({ stage, stageIndex, projects, onSelect, onDragStart, onDrop, onMoveProject, isDone, channels }) {
  const [dragOver, setDragOver] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visible = isDone && !showAll ? projects.slice(0, MAX_DONE) : projects;

  return (
    <div
      className={`flex flex-col min-w-[300px] w-[300px] shrink-0 lg:min-w-0 lg:w-auto lg:shrink rounded-xl border transition-all ${dragOver ? 'ring-2' : ''}`}
      style={{ background: 'var(--bg-card)', borderColor: dragOver ? stage.color : 'var(--border)', '--tw-ring-color': stage.color }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, stage.key); }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: stage.bg, color: stage.color }}>
          {stage.emoji}
        </span>
        <span className="text-[13px] font-bold flex-1" style={{ color: 'var(--text)' }}>{stage.label}</span>
        <span className="text-[12px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{projects.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {visible.map(p => (
          <BoardCard
            key={p.id} project={p} onSelect={() => onSelect?.(p)} onDragStart={onDragStart} stageColor={stage.color} channels={channels}
            canMoveLeft={stageIndex > 0} canMoveRight={stageIndex < STAGES.length - 1}
            onMoveLeft={() => onMoveProject(p, STAGE_KEYS[stageIndex - 1])} onMoveRight={() => onMoveProject(p, STAGE_KEYS[stageIndex + 1])}
          />
        ))}

        {isDone && projects.length > MAX_DONE && !showAll && (
          <button onClick={() => setShowAll(true)} className="w-full py-2.5 rounded-lg border border-dashed text-[11px] font-semibold flex items-center justify-center gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Eye size={12} /> +{projects.length - MAX_DONE} more
          </button>
        )}

        {projects.length === 0 && (
          <div className="border border-dashed rounded-lg p-6 text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Drop here</p>
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
  const columns = useMemo(() => STAGES.map(s => ({ ...s, projects: filtered.filter(p => p.stage === s.key).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)) })), [filtered]);

  const moveProject = (project, toStage) => {
    if (project.stage !== toStage) onUpdateProject?.({ ...project, stage: toStage });
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <select value={filterCreator} onChange={e => setFilterCreator(e.target.value)}
          className="rounded-lg px-3 py-2 text-[13px] font-medium outline-none border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <option value="all">Everyone</option>
          {creators.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} projects</span>
        {onCreateProject && (
          <button onClick={onCreateProject} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--primary)' }}>
            <Plus size={15} /> New
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex lg:grid lg:grid-cols-7 gap-3 h-full">
          {columns.map((col, i) => (
            <BoardColumn key={col.key} stage={col} stageIndex={i} projects={col.projects} isDone={col.key === 'Done'} channels={channels}
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
