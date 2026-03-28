'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, ChevronLeft, ChevronRight, Check, ChevronDown, Users, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'Backlog',    label: 'Ideas',    icon: '💡', hue: 220, rgb: '100,116,139' },
  { key: 'Shooting',   label: 'Creating', icon: '🎬', hue: 265, rgb: '139,92,246' },
  { key: 'Editing',    label: 'Editing',  icon: '✂️', hue: 35,  rgb: '245,158,11' },
  { key: 'Review',     label: 'Review',   icon: '👁', hue: 25,  rgb: '249,115,22' },
  { key: 'Publishing', label: 'Publish',  icon: '🚀', hue: 190, rgb: '6,182,212' },
  { key: 'Done',       label: 'Done',     icon: '✓',  hue: 145, rgb: '34,197,94' },
];
const STAGE_KEYS = STAGES.map(s => s.key);
const MAX_DONE = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relDate(ts) {
  if (!ts) return null;
  const d = Math.ceil((new Date(ts) - new Date()) / 86400000);
  if (d < -7) return { t: `${Math.abs(d)}d`, urgent: true };
  if (d < 0) return { t: `${Math.abs(d)}d`, urgent: true };
  if (d === 0) return { t: 'Today', urgent: false };
  if (d <= 3) return { t: `${d}d`, urgent: false };
  return { t: `${d}d`, urgent: false };
}

function chAvatar(p, channels) {
  if (!channels?.length) return null;
  const ch = channels.find(c => (p.channelId && c.id === p.channelId) || (c.platform === p.platform && (c.avatar || c.avatarUrl)));
  return ch?.avatar || ch?.avatarUrl || ch?.profilePhoto || null;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ project, stage, onSelect, onDragStart, onMoveLeft, onMoveRight, canLeft, canRight, channels, index, onDelete }) {
  const due = relDate(project.dueDate);
  const avatar = chAvatar(project, channels);
  const isDone = project.stage === 'Done';
  const plat = project.platform;
  const topic = project.topic && project.topic !== 'To be decided' ? project.topic : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: index * 0.03 }}
      draggable
      onDragStart={e => onDragStart(e, project)}
      onClick={() => onSelect?.(project)}
      className="group relative cursor-pointer"
    >
      <div className="rounded-2xl overflow-hidden relative" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: `0 2px 12px rgba(${stage.rgb}, 0.06), var(--shadow-sm)`,
        transition: 'box-shadow 250ms cubic-bezier(0.23,1,0.32,1), border-color 250ms',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 8px 32px rgba(${stage.rgb}, 0.15), 0 0 0 1px rgba(${stage.rgb}, 0.2)`;
          e.currentTarget.style.borderColor = `rgba(${stage.rgb}, 0.3)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = `0 2px 12px rgba(${stage.rgb}, 0.06), var(--shadow-sm)`;
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {/* Glow bar at top */}
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, rgba(${stage.rgb}, 0.7), rgba(${stage.rgb}, 0.2))` }} />

        <div className="p-4 space-y-2.5">
          {/* Platform + Due */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {plat && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-[2px] rounded-md"
                  style={{ color: `rgba(${stage.rgb}, 1)`, background: `rgba(${stage.rgb}, 0.1)` }}>
                  {plat === 'youtube' ? 'YT' : plat === 'instagram' ? 'IG' : plat === 'course' ? 'Course' : plat}
                </span>
              )}
              {project.priority === 'High' && (
                <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-md" style={{ color: 'var(--danger)', background: 'var(--danger-light)' }}>!!</span>
              )}
            </div>
            {due && (
              <span className="text-[10px] font-bold tabular-nums" style={{ color: due.urgent ? 'var(--danger)' : 'var(--text-muted)' }}>
                {due.urgent && '● '}{due.t}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[14px] font-bold leading-snug line-clamp-2" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>
            {project.title || 'Untitled'}
          </h3>

          {/* Topic */}
          {topic && <p className="text-[11px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>{topic}</p>}

          {/* Assignee */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {avatar ? (
                <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-[var(--border)]" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: `rgba(${stage.rgb}, 0.8)` }}>
                  {project.creator?.charAt(0) || '?'}
                </div>
              )}
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{project.creator || '—'}</span>
            </div>
            {project.editors?.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
                +{project.editors.length}
              </span>
            )}
          </div>

          {/* Actions — always visible */}
          <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
            {canLeft && (
              <button onClick={e => { e.stopPropagation(); onMoveLeft(); }}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{ background: `rgba(${stage.rgb}, 0.08)`, color: `rgba(${stage.rgb}, 0.7)` }}
                onMouseEnter={e => { e.currentTarget.style.background = `rgba(${stage.rgb}, 0.2)`; e.currentTarget.style.color = `rgba(${stage.rgb}, 1)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `rgba(${stage.rgb}, 0.08)`; e.currentTarget.style.color = `rgba(${stage.rgb}, 0.7)`; }}
                title="Move to previous stage">
                <ArrowLeft size={13} />
              </button>
            )}
            {canRight && (
              <button onClick={e => { e.stopPropagation(); onMoveRight(); }}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{ background: `rgba(${stage.rgb}, 0.12)`, color: `rgba(${stage.rgb}, 0.8)` }}
                onMouseEnter={e => { e.currentTarget.style.background = `rgba(${stage.rgb}, 0.25)`; e.currentTarget.style.color = `rgba(${stage.rgb}, 1)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `rgba(${stage.rgb}, 0.12)`; e.currentTarget.style.color = `rgba(${stage.rgb}, 0.8)`; }}
                title="Move to next stage">
                <ArrowRight size={13} />
              </button>
            )}
            <div className="flex-1" />
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${project.title}"?`)) onDelete(project.id); }}
                className="flex items-center justify-center w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                title="Delete project">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function Column({ stage, idx, projects, onSelect, onDragStart, onDrop, onMove, isDone, channels, onDelete }) {
  const [over, setOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const visible = isDone && !expanded ? projects.slice(0, MAX_DONE) : projects;
  const remaining = isDone ? Math.max(0, projects.length - MAX_DONE) : 0;

  return (
    <div
      className="flex flex-col min-w-[280px] shrink-0 lg:min-w-0 lg:shrink rounded-2xl relative overflow-hidden"
      style={{
        background: over ? `rgba(${stage.rgb}, 0.04)` : 'var(--bg-card)',
        border: `1px solid ${over ? `rgba(${stage.rgb}, 0.3)` : 'var(--border)'}`,
        boxShadow: over ? `0 0 24px rgba(${stage.rgb}, 0.08)` : 'none',
        transition: 'all 200ms cubic-bezier(0.23,1,0.32,1)',
      }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); onDrop(e, stage.key); }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `rgba(${stage.rgb}, 0.1)` }}>
          {stage.icon}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{stage.label}</div>
        </div>
        <div className="text-[22px] font-black tabular-nums" style={{ color: `rgba(${stage.rgb}, 0.8)` }}>
          {projects.length}
        </div>
      </div>

      {/* Gradient line */}
      <div className="h-[2px] mx-4" style={{ background: `linear-gradient(90deg, rgba(${stage.rgb}, 0.4), transparent)` }} />

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <Card
              key={p.id} project={p} stage={stage} index={i} channels={channels}
              onSelect={() => onSelect?.(p)} onDragStart={onDragStart} onDelete={onDelete}
              canLeft={idx > 0} canRight={idx < STAGES.length - 1}
              onMoveLeft={() => onMove(p, STAGE_KEYS[idx - 1])} onMoveRight={() => onMove(p, STAGE_KEYS[idx + 1])}
            />
          ))}
        </AnimatePresence>

        {isDone && remaining > 0 && !expanded && (
          <button onClick={() => setExpanded(true)}
            className="w-full py-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5"
            style={{ color: `rgba(${stage.rgb}, 0.8)`, background: `rgba(${stage.rgb}, 0.06)` }}>
            <Eye size={12} /> {remaining} more
          </button>
        )}

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-3xl mb-2 opacity-30">{stage.icon}</span>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {over ? 'Drop here' : 'Empty'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function CreatorFilter({ value, onChange, creators }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-semibold"
        style={{ background: 'var(--bg-input)', borderColor: open ? 'var(--primary)' : 'var(--border)', color: 'var(--text-secondary)' }}>
        <Users size={14} style={{ color: value === 'all' ? 'var(--text-muted)' : 'var(--primary)' }} />
        <span className="max-w-[100px] truncate">{value === 'all' ? 'Everyone' : value}</span>
        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 mt-1.5 min-w-[180px] rounded-xl border overflow-hidden z-50"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div className="p-1.5">
              <button onClick={() => { onChange('all'); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors"
                style={{ background: value === 'all' ? 'var(--primary-light)' : 'transparent', color: value === 'all' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                <Users size={14} /> Everyone {value === 'all' && <Check size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />}
              </button>
              {creators.length > 0 && <div className="h-px my-1" style={{ background: 'var(--border-light)' }} />}
              {creators.map(c => (
                <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors"
                  style={{ background: value === c ? 'var(--primary-light)' : 'transparent', color: value === c ? 'var(--primary)' : 'var(--text-secondary)' }}
                  onMouseEnter={e => { if (value !== c) e.currentTarget.style.background = 'var(--bg-input)'; }}
                  onMouseLeave={e => { if (value !== c) e.currentTarget.style.background = 'transparent'; }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'var(--primary)' }}>{c.charAt(0)}</div>
                  {c} {value === c && <Check size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pipeline Bar ─────────────────────────────────────────────────────────────
function PipelineBar({ columns, total }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-[2px] h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
      {columns.map(col => {
        const pct = (col.projects.length / total) * 100;
        if (pct === 0) return null;
        return (
          <motion.div key={col.key}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: `rgba(${col.rgb}, 0.7)`, minWidth: pct > 0 ? '4px' : 0 }}
            title={`${col.label}: ${col.projects.length}`}
          />
        );
      })}
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function ProjectBoard({ projects = [], channels = [], onSelectProject, onUpdateProject, onCreateProject, onDeleteProject, filterType }) {
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
    projects: filtered.filter(p => p.stage === s.key || (s.key === 'Backlog' && p.stage === 'Scripting')).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  })), [filtered]);

  const move = useCallback((project, toStage) => {
    if (project.stage !== toStage) onUpdateProject?.({ ...project, stage: toStage });
  }, [onUpdateProject]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <CreatorFilter value={creator} onChange={setCreator} creators={creators} />

        <div className="flex-1 max-w-md hidden md:block">
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
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-5">
        <div className="flex lg:grid lg:grid-cols-6 gap-4 h-full">
          {columns.map((col, i) => (
            <Column
              key={col.key} stage={col} idx={i} projects={col.projects} isDone={col.key === 'Done'} channels={channels}
              onSelect={onSelectProject} onDelete={onDeleteProject}
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
