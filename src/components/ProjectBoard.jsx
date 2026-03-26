'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'Backlog',    label: 'Ideas',      icon: '💡', color: '#64748b', glow: 'rgba(100,116,139,0.15)' },
  { key: 'Scripting',  label: 'Planning',   icon: '📋', color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  { key: 'Shooting',   label: 'Creating',   icon: '🎬', color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  { key: 'Editing',    label: 'Editing',     icon: '✂️', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  { key: 'Review',     label: 'Review',      icon: '👁', color: '#f97316', glow: 'rgba(249,115,22,0.15)' },
  { key: 'Publishing', label: 'Publish',     icon: '🚀', color: '#06b6d4', glow: 'rgba(6,182,212,0.15)' },
  { key: 'Done',       label: 'Done',        icon: '✓',  color: '#22c55e', glow: 'rgba(34,197,94,0.15)' },
];
const STAGE_KEYS = STAGES.map(s => s.key);
const MAX_DONE = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeDate(ts) {
  if (!ts) return null;
  const d = Math.ceil((new Date(ts) - new Date()) / 86400000);
  if (d < -7) return { t: `${Math.abs(d)}d late`, c: '#ef4444', urgent: true };
  if (d < 0)  return { t: `${Math.abs(d)}d late`, c: '#f87171', urgent: true };
  if (d === 0) return { t: 'Today', c: '#f59e0b', urgent: false };
  if (d <= 3)  return { t: `${d}d`, c: '#fbbf24', urgent: false };
  return { t: `${d}d`, c: 'var(--text-muted)', urgent: false };
}

function channelAvatar(p, channels) {
  if (!channels?.length) return null;
  const ch = channels.find(c => (p.channelId && c.id === p.channelId) || (c.platform === p.platform && (c.avatar || c.avatarUrl)));
  return ch?.avatar || ch?.avatarUrl || ch?.profilePhoto || null;
}

// ─── Pipeline Flow Bar ────────────────────────────────────────────────────────
// A horizontal segmented bar showing work distribution across stages
function PipelineBar({ columns, total }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-[2px] h-2 rounded-full overflow-hidden mx-1" style={{ background: 'var(--border-light)' }}>
      {columns.map(col => {
        const pct = (col.projects.length / total) * 100;
        if (pct === 0) return null;
        return (
          <motion.div
            key={col.key}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: col.color, minWidth: pct > 0 ? '4px' : 0 }}
            title={`${col.label}: ${col.projects.length}`}
          />
        );
      })}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ project, stage, onSelect, onDragStart, onMoveLeft, onMoveRight, canLeft, canRight, channels, index }) {
  const due = relativeDate(project.dueDate);
  const avatar = channelAvatar(project, channels);
  const isDone = project.stage === 'Done';
  const plat = project.platform;
  const topic = project.topic && project.topic !== 'To be decided' ? project.topic : null;

  const platLabel = plat === 'youtube' ? 'YT' : plat === 'instagram' ? 'IG' : plat === 'course' ? 'Course' : null;
  const platColor = plat === 'youtube' ? '#ef4444' : plat === 'instagram' ? '#d946ef' : plat === 'course' ? '#8b5cf6' : stage.color;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: index * 0.03 }}
      draggable
      onDragStart={e => onDragStart(e, project)}
      onClick={() => onSelect?.(project)}
      className="group relative cursor-pointer"
    >
      <div
        className="rounded-2xl overflow-hidden transition-shadow duration-200"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${stage.glow}, var(--shadow-md)`; e.currentTarget.style.borderColor = stage.color + '40'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        {/* Color accent — left strip */}
        <div className="flex">
          <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: stage.color }} />

          <div className="flex-1 p-4 space-y-2.5">
            {/* Top: Platform + Due */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {platLabel && (
                  <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-[2px] rounded"
                    style={{ color: platColor, background: platColor + '12' }}>
                    {platLabel}
                  </span>
                )}
                {project.priority === 'High' && (
                  <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-[2px] rounded"
                    style={{ color: '#ef4444', background: '#ef444415' }}>
                    !!
                  </span>
                )}
                {project.contentFormat && (
                  <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {project.contentFormat === 'ShortForm' ? 'Short' : project.contentFormat === 'LongForm' ? 'Long' : ''}
                  </span>
                )}
              </div>
              {due && (
                <span className="text-[10px] font-bold tabular-nums" style={{ color: due.c }}>
                  {due.urgent && '● '}{due.t}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-[14px] font-semibold leading-[1.35] line-clamp-2 tracking-[-0.01em]"
              style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>
              {project.title || 'Untitled'}
            </h3>

            {/* Topic */}
            {topic && (
              <p className="text-[11px] leading-relaxed line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                {topic}
              </p>
            )}

            {/* Assignee row */}
            <div className="flex items-center gap-2 pt-1">
              {avatar ? (
                <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-[var(--border)]" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: stage.color }}>
                  {project.creator?.charAt(0) || '?'}
                </div>
              )}
              <span className="text-[11px] font-medium flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {project.creator || 'Unassigned'}
              </span>
              {project.editors?.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
                  +{project.editors.length} editor{project.editors.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Move arrows — float outside card on hover */}
      <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100"
        style={{ transition: 'opacity 150ms cubic-bezier(0.23,1,0.32,1)' }}>
        {canLeft ? (
          <button onClick={e => { e.stopPropagation(); onMoveLeft(); }}
            className="pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center text-white/90 shadow-lg backdrop-blur-sm"
            style={{ background: stage.color + 'dd', transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
        ) : <div />}
        {canRight ? (
          <button onClick={e => { e.stopPropagation(); onMoveRight(); }}
            className="pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center text-white/90 shadow-lg backdrop-blur-sm"
            style={{ background: stage.color + 'dd', transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        ) : <div />}
      </div>
    </motion.div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function Column({ stage, idx, projects, onSelect, onDragStart, onDrop, onMove, isDone, channels }) {
  const [over, setOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const visible = isDone && !expanded ? projects.slice(0, MAX_DONE) : projects;
  const remaining = isDone ? Math.max(0, projects.length - MAX_DONE) : 0;

  return (
    <div
      className="flex flex-col min-w-[280px] shrink-0 lg:min-w-0 lg:shrink rounded-2xl overflow-hidden"
      style={{
        background: over ? stage.glow : 'var(--bg-card)',
        border: `1px solid ${over ? stage.color + '60' : 'var(--border)'}`,
        transition: 'background 200ms, border-color 200ms',
      }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); onDrop(e, stage.key); }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
          style={{ background: stage.glow }}>
          {stage.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold tracking-[-0.01em]" style={{ color: 'var(--text)' }}>{stage.label}</div>
        </div>
        <div className="text-[20px] font-black tabular-nums" style={{ color: stage.color }}>
          {projects.length}
        </div>
      </div>

      {/* Thin accent line */}
      <div className="h-[2px] mx-3" style={{ background: `linear-gradient(90deg, ${stage.color}, transparent)`, opacity: 0.3 }} />

      {/* Cards */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <Card
              key={p.id} project={p} stage={stage} index={i} channels={channels}
              onSelect={() => onSelect?.(p)} onDragStart={onDragStart}
              canLeft={idx > 0} canRight={idx < STAGES.length - 1}
              onMoveLeft={() => onMove(p, STAGE_KEYS[idx - 1])}
              onMoveRight={() => onMove(p, STAGE_KEYS[idx + 1])}
            />
          ))}
        </AnimatePresence>

        {isDone && remaining > 0 && !expanded && (
          <button onClick={() => setExpanded(true)}
            className="w-full py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5"
            style={{ color: stage.color, background: stage.glow, transition: 'opacity 160ms' }}>
            <Eye size={12} /> {remaining} more completed
          </button>
        )}

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-2xl mb-2 opacity-40">{stage.icon}</span>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {over ? 'Drop to move here' : 'Empty'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function ProjectBoard({ projects = [], channels = [], onSelectProject, onUpdateProject, onCreateProject, filterType }) {
  const [dragged, setDragged] = useState(null);
  const [creator, setCreator] = useState('all');

  const filtered = useMemo(() => {
    let list = projects;
    if (filterType === 'design') list = list.filter(p => p.projectType === 'design');
    else if (filterType === 'dev') list = list.filter(p => p.projectType === 'dev');
    else list = list.filter(p => !p.projectType || p.projectType === 'content');
    if (creator !== 'all') list = list.filter(p => p.creator === creator);
    return list;
  }, [projects, filterType, creator]);

  const creators = useMemo(() => [...new Set(projects.map(p => p.creator).filter(Boolean))].sort(), [projects]);

  const columns = useMemo(() => STAGES.map(s => ({
    ...s,
    projects: filtered.filter(p => p.stage === s.key).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  })), [filtered]);

  const move = useCallback((project, toStage) => {
    if (project.stage !== toStage) onUpdateProject?.({ ...project, stage: toStage });
  }, [onUpdateProject]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <Filter size={13} style={{ color: 'var(--text-muted)' }} />
          <select value={creator} onChange={e => setCreator(e.target.value)}
            className="bg-transparent text-[13px] font-medium outline-none pr-4"
            style={{ color: 'var(--text-secondary)' }}>
            <option value="all">Everyone</option>
            {creators.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Pipeline distribution bar */}
        <div className="flex-1 max-w-lg hidden md:block">
          <PipelineBar columns={columns} total={filtered.length} />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} projects
          </span>
          {onCreateProject && (
            <button onClick={onCreateProject}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white"
              style={{ background: 'var(--primary)', transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Plus size={15} /> New
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 md:p-4">
        <div className="flex lg:grid lg:grid-cols-7 gap-2.5 h-full">
          {columns.map((col, i) => (
            <Column
              key={col.key} stage={col} idx={i} projects={col.projects} isDone={col.key === 'Done'} channels={channels}
              onSelect={onSelectProject}
              onDragStart={(e, p) => { setDragged(p); e.dataTransfer.effectAllowed = 'move'; }}
              onDrop={(e, stage) => { e.preventDefault(); if (dragged && dragged.stage !== stage) onUpdateProject?.({ ...dragged, stage }); setDragged(null); }}
              onMove={move}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
