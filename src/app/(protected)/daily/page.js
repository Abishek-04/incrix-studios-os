'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/UIContext';
import { fetchState, createDailyTask, updateDailyTask, deleteDailyTask, fetchWithAuth } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import UndoToast from '@/components/ui/UndoToast';
import {
  CheckCircle, Circle, ChevronRight, Clock, AlertTriangle, Calendar,
  Plus, Trash2, Sun, Moon as MoonIcon, ArrowRight, RotateCcw, Filter,
  Briefcase, ListChecks, History, X
} from 'lucide-react';

const ease = [0.23, 1, 0.32, 1];
const fade = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } };
const stagger = { show: { transition: { staggerChildren: 0.04 } } };

// Content project stage pipeline
const STAGE_ORDER = ['Backlog', 'Scripting', 'Shooting', 'Editing', 'Review', 'Publishing', 'Done'];
const STAGE_EMOJI = { Backlog: '💡', Scripting: '📝', Shooting: '🎬', Editing: '✂️', Review: '👀', Publishing: '🚀', Done: '✅' };
const STAGE_COLOR = { Backlog: '#64748b', Scripting: '#3b82f6', Shooting: '#8b5cf6', Editing: '#f59e0b', Review: '#f97316', Publishing: '#06b6d4', Done: '#22c55e' };

function nextStage(current) {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

function formatDue(ts) {
  if (!ts) return null;
  const days = Math.ceil((new Date(ts) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'var(--danger)', urgent: true };
  if (days === 0) return { text: 'Today', color: 'var(--warning)', urgent: false };
  if (days === 1) return { text: 'Tomorrow', color: 'var(--text-secondary)', urgent: false };
  return { text: `${days}d left`, color: 'var(--text-muted)', urgent: false };
}

function toDateStr(d) { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }

// ─── Project Task Card ────────────────────────────────────────────────────────
function ProjectTaskCard({ project, onMoveForward, onReverse, isCompleted }) {
  const due = formatDue(project.dueDate);
  const next = nextStage(project.stage);
  const isDone = project.stage === 'Done';
  const stageColor = STAGE_COLOR[project.stage] || 'var(--text-muted)';

  return (
    <motion.div variants={fade} className="rounded-xl border p-4 transition-all"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', opacity: isCompleted ? 0.6 : 1 }}>
      <div className="flex items-start gap-3">
        {/* Stage indicator */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: stageColor + '15' }}>
          {STAGE_EMOJI[project.stage] || '📋'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-bold truncate" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>
              {project.title}
            </h3>
            {project.platform && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{ color: project.platform === 'youtube' ? '#ef4444' : project.platform === 'instagram' ? '#d946ef' : 'var(--primary)', background: 'var(--bg-input)' }}>
                {project.platform === 'youtube' ? 'YT' : project.platform === 'instagram' ? 'IG' : project.platform}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <span style={{ color: stageColor }}>{STAGE_EMOJI[project.stage]}</span> {project.stage}
            </span>
            {project.creator && <span>by {project.creator}</span>}
            {due && <span style={{ color: due.color }}>{due.urgent && '● '}{due.text}</span>}
          </div>

          {project.topic && project.topic !== 'To be decided' && (
            <p className="text-[11px] line-clamp-1 mb-2" style={{ color: 'var(--text-muted)' }}>{project.topic}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isCompleted && next && (
              <button onClick={() => onMoveForward(project)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--primary)' }}>
                Complete & Move to {next} <ArrowRight size={13} />
              </button>
            )}
            {isCompleted && onReverse && (
              <button onClick={() => onReverse(project)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <RotateCcw size={12} /> Revise (Move Back)
              </button>
            )}
            {isDone && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--success)' }}>
                <CheckCircle size={13} /> Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Personal Task Item ───────────────────────────────────────────────────────
function PersonalTaskItem({ task, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.task);

  return (
    <motion.div variants={fade} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <button onClick={() => onToggle(task.id)} className="shrink-0">
        {task.done ? <CheckCircle size={20} style={{ color: 'var(--success)' }} /> : <Circle size={20} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {editing ? (
        <input autoFocus value={text} onChange={e => setText(e.target.value)}
          onBlur={() => { setEditing(false); if (text.trim() && text !== task.task) onUpdate(task.id, text); }}
          onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (text.trim()) onUpdate(task.id, text); } }}
          className="flex-1 bg-transparent outline-none text-[13px] font-medium" style={{ color: 'var(--text)' }} />
      ) : (
        <span onClick={() => setEditing(true)} className="flex-1 text-[13px] font-medium cursor-text"
          style={{ color: task.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.task}
        </span>
      )}
      <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{task.timeSlot}</span>
      <button onClick={() => onDelete(task.id)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

// ─── Add Task Input ───────────────────────────────────────────────────────────
function AddTaskInput({ onAdd, slot }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), slot);
    setText('');
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
      <Plus size={16} style={{ color: 'var(--text-muted)' }} />
      <input value={text} onChange={e => setText(e.target.value)} placeholder={`Add ${slot === 'AM' ? 'morning' : 'afternoon'} task...`}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: 'var(--text)' }} />
      {text.trim() && (
        <button onClick={handleSubmit} className="text-[12px] font-semibold px-2 py-1 rounded-lg" style={{ color: 'var(--primary)' }}>Add</button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const [projects, setProjects] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('projects'); // projects | personal | completed
  const [filter, setFilter] = useState('all'); // all | overdue | inprogress
  const [undoDelete, setUndoDelete] = useState(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState([]); // last 5 moved forward

  const today = toDateStr(new Date());

  useEffect(() => {
    if (!user) return;
    fetchState().then(data => {
      setProjects(data.projects || []);
      setDailyTasks(data.dailyTasks || []);
      setUsers(data.users || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  // ── My assigned projects ──────────────────────────────────────────────────
  const myProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter(p => {
      const isCreator = p.creator === user.name;
      const isEditor = (p.editors || []).includes(user.name) || p.editor === user.name;
      const isAssigned = p.assignedTo === user.id || p.assignedDesigner === user.name || p.assignedDeveloper === user.name;
      return isCreator || isEditor || isAssigned;
    });
  }, [projects, user]);

  const activeProjects = useMemo(() => {
    let list = myProjects.filter(p => p.stage !== 'Done');
    if (filter === 'overdue') list = list.filter(p => p.dueDate && new Date(p.dueDate) < new Date());
    if (filter === 'inprogress') list = list.filter(p => p.stage !== 'Backlog');
    return list.sort((a, b) => {
      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date() ? -1 : 0;
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date() ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return (a.dueDate || Infinity) - (b.dueDate || Infinity);
    });
  }, [myProjects, filter]);

  const completedProjects = useMemo(() => myProjects.filter(p => p.stage === 'Done'), [myProjects]);

  // Stats
  const overdueCount = myProjects.filter(p => p.dueDate && new Date(p.dueDate) < new Date() && p.stage !== 'Done').length;
  const doneThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return myProjects.filter(p => p.stage === 'Done' && p.lastUpdated && new Date(p.lastUpdated) > weekAgo).length;
  }, [myProjects]);

  // ── Move project forward ──────────────────────────────────────────────────
  const moveForward = async (project) => {
    const next = nextStage(project.stage);
    if (!next) return;

    // Optimistic update
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, stage: next, lastUpdated: Date.now() } : p));
    setRecentlyCompleted(prev => [{ ...project, movedFrom: project.stage, movedTo: next }, ...prev].slice(0, 5));

    try {
      const res = await fetchWithAuth(`/api/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: next, lastUpdated: Date.now() })
      });
      if (!res.ok) {
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, stage: project.stage } : p));
        showToast('Failed to update project');
      }
    } catch {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, stage: project.stage } : p));
      showToast('Failed to update project');
    }
  };

  // ── Reverse project (move back) ───────────────────────────────────────────
  const reverseProject = async (project) => {
    const idx = STAGE_ORDER.indexOf(project.stage);
    if (idx <= 0) return;
    const prev = STAGE_ORDER[idx - 1];

    setProjects(p => p.map(pr => pr.id === project.id ? { ...pr, stage: prev, lastUpdated: Date.now() } : pr));

    try {
      const res = await fetchWithAuth(`/api/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: prev, lastUpdated: Date.now() })
      });
      if (!res.ok) {
        setProjects(p => p.map(pr => pr.id === project.id ? { ...pr, stage: project.stage } : pr));
        showToast('Failed to revert project');
      }
    } catch {
      setProjects(p => p.map(pr => pr.id === project.id ? { ...pr, stage: project.stage } : pr));
    }
  };

  // ── Daily task handlers ───────────────────────────────────────────────────
  const handleAddTask = async (text, slot) => {
    const newTask = { id: `DT-${Date.now()}`, date: today, timeSlot: slot, userId: user.id, userName: user.name, task: text, done: false };
    setDailyTasks(prev => [...prev, newTask]);
    try {
      const res = await createDailyTask(newTask);
      if (!res?.success) setDailyTasks(prev => prev.filter(t => t.id !== newTask.id));
    } catch { setDailyTasks(prev => prev.filter(t => t.id !== newTask.id)); }
  };

  const handleToggle = async (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    try { await updateDailyTask(taskId, { done: !task.done }); } catch { setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: task.done } : t)); }
  };

  const handleUpdateText = async (taskId, text) => {
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: text } : t));
    try { await updateDailyTask(taskId, { task: text }); } catch {}
  };

  const handleDeleteTask = async (taskId) => {
    const deleted = dailyTasks.find(t => t.id === taskId);
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      const res = await deleteDailyTask(taskId);
      if (res?.success) setUndoDelete({ deletedItemId: res.deletedItemId, task: deleted, message: `Deleted "${deleted?.task}"` });
    } catch { if (deleted) setDailyTasks(prev => [...prev, deleted]); }
  };

  const todayTasks = useMemo(() => dailyTasks.filter(t => t.date === today && t.userId === user?.id), [dailyTasks, today, user]);
  const amTasks = todayTasks.filter(t => t.timeSlot === 'AM');
  const pmTasks = todayTasks.filter(t => t.timeSlot === 'PM');

  if (loading || !user) return <LoadingScreen />;

  const tabs = [
    { id: 'projects', label: 'Project Work', icon: Briefcase, count: activeProjects.length },
    { id: 'personal', label: 'Personal Tasks', icon: ListChecks, count: todayTasks.length },
    { id: 'completed', label: 'Completed', icon: History, count: completedProjects.length },
  ];

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      {/* Header + Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>My Tasks</h1>
        <div className="flex items-center gap-4 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
          <span>📋 {activeProjects.length} assigned</span>
          {overdueCount > 0 && <span style={{ color: 'var(--danger)' }}>⚠ {overdueCount} overdue</span>}
          <span style={{ color: 'var(--success)' }}>✅ {doneThisWeek} done this week</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
              style={{ background: active ? 'var(--primary)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)' }}>
              <Icon size={15} />
              {t.label}
              {t.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)', color: active ? 'white' : 'var(--text-muted)' }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TAB 1: Project Work ──────────────────────────────────────────── */}
        {tab === 'projects' && (
          <motion.div key="projects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease }}>
            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-4">
              {['all', 'overdue', 'inprogress'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{ background: filter === f ? 'var(--primary-light)' : 'var(--bg-input)', color: filter === f ? 'var(--primary)' : 'var(--text-muted)', border: `1px solid ${filter === f ? 'var(--primary)' + '40' : 'var(--border)'}` }}>
                  {f === 'all' ? 'All' : f === 'overdue' ? '⚠ Overdue' : '🔄 In Progress'}
                </button>
              ))}
            </div>

            {/* Active projects */}
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {activeProjects.length > 0 ? activeProjects.map(p => (
                <ProjectTaskCard key={p.id} project={p} onMoveForward={moveForward} />
              )) : (
                <div className="py-12 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <CheckCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--success)' }} />
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>All caught up!</p>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No pending projects assigned to you</p>
                </div>
              )}
            </motion.div>

            {/* Recently completed (last 5) */}
            {recentlyCompleted.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-muted)' }}>Recently Moved Forward</h3>
                <div className="space-y-2">
                  {recentlyCompleted.map((p, i) => (
                    <div key={p.id + '-' + i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'var(--success-light)', border: '1px solid var(--border)' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span className="text-[12px] font-medium flex-1 truncate" style={{ color: 'var(--text)' }}>{p.title}</span>
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>{p.movedFrom} → {p.movedTo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: Personal Tasks ────────────────────────────────────────── */}
        {tab === 'personal' && (
          <motion.div key="personal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease }}>
            {/* Morning */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sun size={16} style={{ color: '#f59e0b' }} />
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Morning</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{amTasks.length}</span>
              </div>
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2 mb-2">
                {amTasks.map(t => (
                  <PersonalTaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDeleteTask} onUpdate={handleUpdateText} />
                ))}
              </motion.div>
              <AddTaskInput onAdd={handleAddTask} slot="AM" />
            </div>

            {/* Afternoon */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MoonIcon size={16} style={{ color: '#8b5cf6' }} />
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Afternoon</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{pmTasks.length}</span>
              </div>
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2 mb-2">
                {pmTasks.map(t => (
                  <PersonalTaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDeleteTask} onUpdate={handleUpdateText} />
                ))}
              </motion.div>
              <AddTaskInput onAdd={handleAddTask} slot="PM" />
            </div>
          </motion.div>
        )}

        {/* ── TAB 3: Completed ─────────────────────────────────────────────── */}
        {tab === 'completed' && (
          <motion.div key="completed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease }}>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {completedProjects.length > 0 ? completedProjects.map(p => (
                <ProjectTaskCard key={p.id} project={p} isCompleted onReverse={reverseProject} />
              )) : (
                <div className="py-12 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <History size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>No completed projects yet</p>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Projects you move forward will appear here</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UndoToast isVisible={!!undoDelete} message={undoDelete?.message || ''} onUndo={async () => {
        if (!undoDelete?.deletedItemId) return;
        try { const res = await fetchWithAuth('/api/recycle-bin', { method: 'POST', body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId }) });
          const data = await res.json(); if (data.success && undoDelete.task) setDailyTasks(prev => prev.some(t => t.id === undoDelete.task.id) ? prev : [...prev, undoDelete.task]);
        } catch {} finally { setUndoDelete(null); }
      }} onClose={() => setUndoDelete(null)} />
    </div>
  );
}
