'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Calendar, Check, Circle, Trash2, ChevronLeft, ChevronRight,
  Sun, Moon, ClipboardList, Users, User, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MANAGER_ROLES = ['manager', 'superadmin'];

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function toDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NotionDailyTasks({
  tasks = [],
  users = [],
  currentUser,
  onAddTask,
  onToggleTask,
  onUpdateTaskText,
  onDeleteTask,
}) {
  const todayStr = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || '');
  const [viewMode, setViewMode] = useState('personal'); // 'personal' | 'team'
  const activeRole = (currentUser?.role || '').trim().toLowerCase();
  const canViewAllUsers = MANAGER_ROLES.includes(activeRole);

  useEffect(() => {
    if (currentUser?.id && !selectedUserId) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser?.id, selectedUserId]);

  const navigateDate = (direction) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + direction);
    setSelectedDate(toDateString(d));
  };

  // ── Handlers shared across views ──

  const handleAddTask = (userId, userName, timeSlot, taskText) => {
    if (!taskText.trim()) return;
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: selectedDate,
      timeSlot,
      userId,
      userName,
      task: taskText.trim(),
      done: false,
    };
    onAddTask(newTask);
  };

  const handleToggleTask = (taskId) => {
    onToggleTask(taskId);
  };

  const handleUpdateTaskText = (taskId, newText) => {
    onUpdateTaskText(taskId, newText);
  };

  const handleDeleteTaskItem = (taskId) => {
    onDeleteTask(taskId);
  };

  return (
    <div className={`mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 ${viewMode === 'team' ? 'max-w-7xl' : 'max-w-4xl'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Tasks</h1>
          <p className="text-sm text-[#666] mt-1">
            {viewMode === 'team' ? 'Team overview' : (users.find((u) => u.id === selectedUserId)?.name || currentUser?.name || 'Track daily work') + "'s tasks"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle — managers only */}
          {canViewAllUsers && (
            <div className="flex bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-1">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'personal' ? 'bg-indigo-600 text-white' : 'text-[#999] hover:text-white'
                }`}
              >
                <User size={13} />
                Personal
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'team' ? 'bg-indigo-600 text-white' : 'text-[#999] hover:text-white'
                }`}
              >
                <LayoutGrid size={13} />
                Team
              </button>
            </div>
          )}

          {/* User Selector — personal view only */}
          {canViewAllUsers && viewMode === 'personal' && users.length > 1 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users size={14} className="text-[#666]" />
              </div>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-[#1e1e1e] border border-[#2a2a2a] text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:border-[#333] transition-colors"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-3 h-3 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-[#999] hover:text-white hover:border-[#333] transition-colors"
          title="Previous day"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <Calendar size={16} className="text-[#666]" />
          <span className="text-white font-semibold text-lg">{formatDateLabel(selectedDate)}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="bg-transparent text-[#666] text-xs border-none outline-none cursor-pointer w-5 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Pick a date"
          />
        </div>
        <button
          onClick={() => navigateDate(1)}
          className="p-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-[#999] hover:text-white hover:border-[#333] transition-colors"
          title="Next day"
        >
          <ChevronRight size={16} />
        </button>
        {selectedDate !== todayStr && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* ────── TEAM DASHBOARD VIEW ────── */}
      {viewMode === 'team' && canViewAllUsers ? (
        <TeamDashboard
          tasks={tasks}
          users={users}
          selectedDate={selectedDate}
          onAdd={handleAddTask}
          onToggle={handleToggleTask}
          onUpdate={handleUpdateTaskText}
          onDelete={handleDeleteTaskItem}
        />
      ) : (
        /* ────── PERSONAL VIEW ────── */
        <PersonalView
          tasks={tasks}
          users={users}
          currentUser={currentUser}
          selectedDate={selectedDate}
          selectedUserId={selectedUserId}
          onAdd={handleAddTask}
          onToggle={handleToggleTask}
          onUpdate={handleUpdateTaskText}
          onDelete={handleDeleteTaskItem}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PERSONAL VIEW (single user — AM/PM)
   ═══════════════════════════════════════════════ */

function PersonalView({ tasks, users, currentUser, selectedDate, selectedUserId, onAdd, onToggle, onUpdate, onDelete }) {
  const selectedUser = users.find((u) => u.id === selectedUserId) || currentUser;
  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === selectedDate && t.userId === selectedUserId),
    [tasks, selectedDate, selectedUserId]
  );
  const amTasks = useMemo(() => dayTasks.filter((t) => t.timeSlot === 'AM'), [dayTasks]);
  const pmTasks = useMemo(() => dayTasks.filter((t) => t.timeSlot === 'PM'), [dayTasks]);
  const stats = useMemo(() => ({
    total: dayTasks.length,
    completed: dayTasks.filter((t) => t.done).length,
    pending: dayTasks.filter((t) => !t.done).length,
  }), [dayTasks]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.total} label="Total" color="text-white" />
        <StatCard value={stats.completed} label="Done" color="text-emerald-400" />
        <StatCard value={stats.pending} label="Pending" color="text-amber-400" />
      </div>

      <TaskSection
        label="Morning"
        icon={<Sun size={16} className="text-amber-400" />}
        timeSlot="AM"
        tasks={amTasks}
        onAdd={(text) => onAdd(selectedUserId, selectedUser?.name || '', 'AM', text)}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
        users={users}
      />
      <TaskSection
        label="Afternoon"
        icon={<Moon size={16} className="text-indigo-400" />}
        timeSlot="PM"
        tasks={pmTasks}
        onAdd={(text) => onAdd(selectedUserId, selectedUser?.name || '', 'PM', text)}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
        users={users}
      />

      {dayTasks.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
            <ClipboardList size={28} className="text-[#444]" />
          </div>
          <h3 className="text-base font-semibold text-[#999] mb-1">No tasks for this day</h3>
          <p className="text-sm text-[#555]">Add tasks using the Morning or Afternoon sections above</p>
        </motion.div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════
   TEAM DASHBOARD VIEW (all users at a glance)
   ═══════════════════════════════════════════════ */

function TeamDashboard({ tasks, users, selectedDate, onAdd, onToggle, onUpdate, onDelete }) {
  // Compute per-user data for selected date
  const dateTasks = useMemo(() => tasks.filter((t) => t.date === selectedDate), [tasks, selectedDate]);

  const teamStats = useMemo(() => {
    const total = dateTasks.length;
    const done = dateTasks.filter((t) => t.done).length;
    return { total, done, pending: total - done, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [dateTasks]);

  const userCards = useMemo(() => {
    return users.map((user) => {
      const userTasks = dateTasks.filter((t) => t.userId === user.id);
      const am = userTasks.filter((t) => t.timeSlot === 'AM');
      const pm = userTasks.filter((t) => t.timeSlot === 'PM');
      const done = userTasks.filter((t) => t.done).length;
      const total = userTasks.length;
      return { user, userTasks, am, pm, done, total, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }, [users, dateTasks]);

  return (
    <>
      {/* Team-wide Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={users.length} label="Team Members" color="text-white" />
        <StatCard value={teamStats.total} label="Total Tasks" color="text-indigo-400" />
        <StatCard value={teamStats.done} label="Completed" color="text-emerald-400" />
        <StatCard value={`${teamStats.rate}%`} label="Completion Rate" color="text-amber-400" />
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {userCards.map(({ user, am, pm, done, total, rate }) => (
          <UserCard
            key={user.id}
            user={user}
            users={users}
            amTasks={am}
            pmTasks={pm}
            done={done}
            total={total}
            rate={rate}
            selectedDate={selectedDate}
            onAdd={onAdd}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16">
          <Users size={32} className="mx-auto mb-3 text-[#444]" />
          <p className="text-[#666] text-sm">No team members found</p>
        </div>
      )}
    </>
  );
}

/* ───────── User Card (inside team dashboard) ───────── */

function UserCard({ user, users, amTasks, pmTasks, done, total, rate, selectedDate, onAdd, onToggle, onUpdate, onDelete }) {
  const [expandedSlot, setExpandedSlot] = useState(null); // 'AM' | 'PM' | null
  const hasAny = total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#161616] border border-[#222] rounded-xl overflow-hidden flex flex-col"
    >
      {/* User Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222] bg-[#1a1a1a]">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: user.avatarColor || '#444', color: '#fff' }}
        >
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{user.name}</div>
          <div className="text-[10px] text-[#666] capitalize">{user.role}</div>
        </div>
        {/* Progress Ring */}
        <div className="flex items-center gap-2">
          {hasAny && (
            <span className={`text-xs font-semibold ${rate === 100 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-[#666]'}`}>
              {done}/{total}
            </span>
          )}
          <ProgressRing percent={rate} size={28} />
        </div>
      </div>

      {/* AM / PM Sections */}
      <div className="flex-1 divide-y divide-[#1f1f1f]">
        <CompactSlot
          label="AM"
          icon={<Sun size={12} className="text-amber-400" />}
          tasks={amTasks}
          isExpanded={expandedSlot === 'AM'}
          onToggleExpand={() => setExpandedSlot(expandedSlot === 'AM' ? null : 'AM')}
          onAddTask={(text) => onAdd(user.id, user.name, 'AM', text)}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          users={users}
        />
        <CompactSlot
          label="PM"
          icon={<Moon size={12} className="text-indigo-400" />}
          tasks={pmTasks}
          isExpanded={expandedSlot === 'PM'}
          onToggleExpand={() => setExpandedSlot(expandedSlot === 'PM' ? null : 'PM')}
          onAddTask={(text) => onAdd(user.id, user.name, 'PM', text)}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          users={users}
        />
      </div>

      {/* Empty state */}
      {!hasAny && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-[#555]">No tasks assigned</p>
        </div>
      )}
    </motion.div>
  );
}

/* ───────── Compact Slot (AM/PM inside user card) ───────── */

function CompactSlot({ label, icon, tasks, isExpanded, onToggleExpand, onAddTask, onToggle, onUpdate, onDelete, users }) {
  const [newText, setNewText] = useState('');
  const inputRef = useRef(null);
  const doneCount = tasks.filter((t) => t.done).length;

  const handleSubmit = () => {
    if (!newText.trim()) return;
    onAddTask(newText);
    setNewText('');
    inputRef.current?.focus();
  };

  return (
    <div>
      {/* Slot Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-[#999]">{label}</span>
          <span className="text-[10px] text-[#555] bg-[#252525] px-1.5 py-0.5 rounded font-mono">
            {tasks.length}
          </span>
        </div>
        {tasks.length > 0 && (
          <span className="text-[10px] text-emerald-400/60">{doneCount}/{tasks.length}</span>
        )}
      </button>

      {/* Expanded Tasks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-0.5">
              {tasks.map((task) => (
                <CompactTaskRow
                  key={task.id}
                  task={task}
                  users={users}
                  onToggle={() => onToggle(task.id)}
                  onUpdate={(text) => onUpdate(task.id, text)}
                  onDelete={() => onDelete(task.id)}
                />
              ))}

              {/* Inline Add */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Plus size={12} className="text-[#555] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                  }}
                  placeholder="Add task..."
                  className="flex-1 bg-transparent text-white text-xs placeholder-[#444] focus:outline-none"
                />
                {newText.trim() && (
                  <button onClick={handleSubmit} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium">
                    Add
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── Compact Task Row (inside user card) ───────── */

function CompactTaskRow({ task, users, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.task);
  const editRef = useRef(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.task) onUpdate(trimmed);
    else setEditText(task.task);
    setIsEditing(false);
  };

  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1e1e1e] transition-colors">
      <button onClick={onToggle} className="flex-shrink-0" aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}>
        {task.done ? (
          <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
            <Check size={10} className="text-white" strokeWidth={3} />
          </div>
        ) : (
          <Circle size={16} className="text-[#444] group-hover:text-[#666] transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') { setEditText(task.task); setIsEditing(false); }
            }}
            className="w-full bg-transparent text-white text-xs focus:outline-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`text-xs cursor-text block truncate ${task.done ? 'text-[#555] line-through' : 'text-[#ccc]'}`}
          >
            {task.task}
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 transition-all"
      >
        <Trash2 size={11} className="text-rose-400" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════ */

/* ───────── Stat Card ───────── */

function StatCard({ value, label, color }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 text-center hover:border-[#333] transition-colors">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-[#666] mt-1">{label}</div>
    </div>
  );
}

/* ───────── Progress Ring ───────── */

function ProgressRing({ percent, size = 28 }) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent === 100 ? '#34d399' : percent >= 50 ? '#fbbf24' : '#4f46e5';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#252525" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

/* ───────── Task Section (AM or PM — used in personal view) ───────── */

function TaskSection({ label, icon, timeSlot, tasks, onAdd, onToggle, onUpdate, onDelete, users }) {
  const [newText, setNewText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (!newText.trim()) return;
    onAdd(newText);
    setNewText('');
    inputRef.current?.focus();
  };

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div className="bg-[#161616] border border-[#222] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#222] bg-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-sm font-semibold text-white">{label}</h2>
          <span className="text-xs text-[#666] bg-[#252525] px-2 py-0.5 rounded-md font-mono">{tasks.length}</span>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs text-emerald-400/70">{completedCount}/{tasks.length} done</span>
        )}
      </div>

      <div className="divide-y divide-[#1f1f1f]">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              users={users}
              onToggle={() => onToggle(task.id)}
              onUpdate={(text) => onUpdate(task.id, text)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 px-5 py-3 border-t border-[#222] bg-[#141414]">
        <Plus size={16} className="text-[#555] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
          }}
          placeholder={`Add ${label.toLowerCase()} task...`}
          className="flex-1 bg-transparent text-white text-sm placeholder-[#555] focus:outline-none"
        />
        {newText.trim() && (
          <button onClick={handleSubmit} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors">
            Add
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────── Task Row (used in personal view) ───────── */

function TaskRow({ task, users, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.task);
  const editRef = useRef(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.task) onUpdate(trimmed);
    else setEditText(task.task);
    setIsEditing(false);
  };

  const assignee = users.find((u) => u.id === task.userId);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="group flex items-center gap-3 px-5 py-3 hover:bg-[#1a1a1a] transition-colors"
    >
      <button onClick={onToggle} className="flex-shrink-0" aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}>
        {task.done ? (
          <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        ) : (
          <Circle size={20} className="text-[#444] group-hover:text-[#666] transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') { setEditText(task.task); setIsEditing(false); }
            }}
            className="w-full bg-transparent text-white text-sm focus:outline-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`text-sm cursor-text block truncate transition-colors ${task.done ? 'text-[#555] line-through' : 'text-white'}`}
          >
            {task.task}
          </span>
        )}
      </div>

      {assignee && (
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: assignee.avatarColor || '#444', color: '#fff' }}
          title={assignee.name}
        >
          {assignee.name?.charAt(0).toUpperCase()}
        </div>
      )}

      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 transition-all"
        title="Delete task"
      >
        <Trash2 size={14} className="text-rose-400" />
      </button>
    </motion.div>
  );
}
