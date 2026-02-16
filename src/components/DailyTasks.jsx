'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, CheckCircle, Circle, Calendar as CalendarIcon,
  Clock, Filter, SortAsc, LayoutGrid, List, CalendarDays,
  GripVertical, Flag, User, Tag, ChevronDown, MoreHorizontal,
  Edit2, Copy, Archive
} from 'lucide-react';

const STATUSES = {
  TODO: { id: 'todo', label: 'To Do', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20' },
  IN_PROGRESS: { id: 'in-progress', label: 'In Progress', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  REVIEW: { id: 'review', label: 'Review', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  DONE: { id: 'done', label: 'Done', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' }
};

const PRIORITIES = {
  LOW: { id: 'low', label: 'Low', color: 'text-gray-400', icon: '○' },
  MEDIUM: { id: 'medium', label: 'Medium', color: 'text-blue-400', icon: '◐' },
  HIGH: { id: 'high', label: 'High', color: 'text-amber-400', icon: '◑' },
  URGENT: { id: 'urgent', label: 'Urgent', color: 'text-rose-400', icon: '●' }
};

const VIEW_MODES = {
  BOARD: 'board',
  LIST: 'list',
  CALENDAR: 'calendar'
};

const DailyTasks = ({ tasks = [], users = [], currentUser, onUpdateTasks }) => {
  const [viewMode, setViewMode] = useState(VIEW_MODES.BOARD);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);

  // New task form
  const [showNewTaskForm, setShowNewTaskForm] = useState(null); // null or status id
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigneeId: currentUser?.id || users[0]?.id,
    dueDate: filterDate,
    tags: [],
    status: 'todo'
  });

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Ensure task has required fields
      if (!task) return false;

      // Date filter
      if (task.dueDate && filterDate !== 'all') {
        if (task.dueDate !== filterDate) return false;
      }

      // Assignee filter
      if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default: // createdAt
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    return filtered;
  }, [tasks, filterDate, filterAssignee, filterPriority, sortBy]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    Object.keys(STATUSES).forEach(key => {
      grouped[STATUSES[key].id] = filteredTasks.filter(t => t.status === STATUSES[key].id);
    });
    return grouped;
  }, [filteredTasks]);

  const handleAddTask = (status) => {
    if (!newTask.title.trim()) return;

    const task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      status: status || newTask.status,
      priority: newTask.priority,
      assigneeId: newTask.assigneeId,
      dueDate: newTask.dueDate,
      tags: newTask.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      done: false
    };

    onUpdateTasks([...tasks, task]);

    // Reset form
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      assigneeId: currentUser?.id || users[0]?.id,
      dueDate: filterDate,
      tags: [],
      status: 'todo'
    });
    setShowNewTaskForm(null);
  };

  const handleUpdateTask = (taskId, updates) => {
    onUpdateTasks(tasks.map(t =>
      t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
    ));
  };

  const handleDeleteTask = (taskId) => {
    onUpdateTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      handleUpdateTask(draggedTask.id, { status: newStatus });
    }
    setDraggedTask(null);
  };

  const getAssigneeById = (id) => users.find(u => u.id === id);

  const getUserAvatarColor = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.avatarColor || 'bg-gray-600';
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1f1f1f] bg-[#151515]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Daily Tasks</h1>
              <p className="text-sm text-[#999]">Manage your agile workflow</p>
            </div>

            {/* View Mode Toggles */}
            <div className="flex items-center gap-3">
              <div className="flex bg-[#1a1a1a] rounded-lg border border-[#2f2f2f] p-1">
                <button
                  onClick={() => setViewMode(VIEW_MODES.BOARD)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === VIEW_MODES.BOARD ? 'bg-indigo-600 text-white' : 'text-[#999] hover:text-white'
                  }`}
                >
                  <LayoutGrid size={14} />
                  Board
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === VIEW_MODES.LIST ? 'bg-indigo-600 text-white' : 'text-[#999] hover:text-white'
                  }`}
                >
                  <List size={14} />
                  List
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.CALENDAR)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === VIEW_MODES.CALENDAR ? 'bg-indigo-600 text-white' : 'text-[#999] hover:text-white'
                  }`}
                >
                  <CalendarDays size={14} />
                  Calendar
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                  showFilters
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-[#1a1a1a] text-[#999] hover:text-white border-[#2f2f2f]'
                }`}
              >
                <Filter size={14} />
                Filters
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 pb-4">
                  {/* Date Filter */}
                  <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg border border-[#2f2f2f] px-3 py-2">
                    <CalendarIcon size={14} className="text-[#666]" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-transparent text-white text-xs border-none outline-none"
                    />
                  </div>

                  {/* Assignee Filter */}
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="bg-[#1a1a1a] text-white text-xs border border-[#2f2f2f] rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Assignees</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-[#1a1a1a] text-white text-xs border border-[#2f2f2f] rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Priorities</option>
                    {Object.values(PRIORITIES).map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>

                  {/* Sort By */}
                  <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg border border-[#2f2f2f] px-3 py-2 ml-auto">
                    <SortAsc size={14} className="text-[#666]" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-white text-xs border-none outline-none"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === VIEW_MODES.BOARD && (
          <BoardView
            tasksByStatus={tasksByStatus}
            users={users}
            showNewTaskForm={showNewTaskForm}
            setShowNewTaskForm={setShowNewTaskForm}
            newTask={newTask}
            setNewTask={setNewTask}
            handleAddTask={handleAddTask}
            handleUpdateTask={handleUpdateTask}
            handleDeleteTask={handleDeleteTask}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            draggedTask={draggedTask}
            getUserAvatarColor={getUserAvatarColor}
            getAssigneeById={getAssigneeById}
          />
        )}

        {viewMode === VIEW_MODES.LIST && (
          <ListView
            tasks={filteredTasks}
            users={users}
            handleUpdateTask={handleUpdateTask}
            handleDeleteTask={handleDeleteTask}
            getUserAvatarColor={getUserAvatarColor}
            getAssigneeById={getAssigneeById}
          />
        )}

        {viewMode === VIEW_MODES.CALENDAR && (
          <CalendarView
            tasks={filteredTasks}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
          />
        )}
      </div>
    </div>
  );
};

// Board View Component
const BoardView = ({
  tasksByStatus, users, showNewTaskForm, setShowNewTaskForm,
  newTask, setNewTask, handleAddTask, handleUpdateTask, handleDeleteTask,
  handleDragStart, handleDragOver, handleDrop, draggedTask,
  getUserAvatarColor, getAssigneeById
}) => {
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 p-6 h-full">
        {Object.values(STATUSES).map((status) => (
          <div
            key={status.id}
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.bgColor} ${status.borderColor} border`}></div>
                <h3 className={`font-semibold text-sm ${status.color}`}>{status.label}</h3>
                <span className="text-xs text-[#666] font-mono bg-[#1a1a1a] px-2 py-0.5 rounded">
                  {tasksByStatus[status.id]?.length || 0}
                </span>
              </div>
              <button
                onClick={() => setShowNewTaskForm(status.id)}
                className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
              >
                <Plus size={16} className="text-[#999]" />
              </button>
            </div>

            {/* New Task Form */}
            <AnimatePresence>
              {showNewTaskForm === status.id && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-3"
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(status.id);
                      if (e.key === 'Escape') setShowNewTaskForm(null);
                    }}
                    className="w-full bg-transparent text-white text-sm border-none outline-none mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newTask.assigneeId}
                      onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                      className="flex-1 bg-[#0d0d0d] text-white text-xs border border-[#333] rounded px-2 py-1 outline-none"
                    >
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="bg-[#0d0d0d] text-white text-xs border border-[#333] rounded px-2 py-1 outline-none"
                    >
                      {Object.values(PRIORITIES).map(p => (
                        <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleAddTask(status.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 rounded transition-colors"
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => setShowNewTaskForm(null)}
                      className="px-3 bg-[#0d0d0d] hover:bg-[#222] text-[#999] text-xs py-1.5 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tasks Column */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <AnimatePresence>
                {tasksByStatus[status.id]?.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onDragStart={handleDragStart}
                    isDragging={draggedTask?.id === task.id}
                    getUserAvatarColor={getUserAvatarColor}
                    getAssigneeById={getAssigneeById}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = ({
  task, users, onUpdate, onDelete, onDragStart, isDragging,
  getUserAvatarColor, getAssigneeById
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const assignee = getAssigneeById(task.assigneeId);
  const priority = PRIORITIES[task.priority?.toUpperCase()] || PRIORITIES.MEDIUM;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={() => onDragStart(task)}
      className={`group bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#444] transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={() => onUpdate(task.id, { done: !task.done })}
          className="mt-0.5"
        >
          {task.done ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : (
            <Circle size={16} className="text-[#666] group-hover:text-[#999]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium text-white mb-1 ${task.done ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-[#999] mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority */}
            <span className={`text-xs ${priority.color} flex items-center gap-1`}>
              <Flag size={12} />
              {priority.label}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className="text-xs text-[#666] flex items-center gap-1">
                <Clock size={12} />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Assignee */}
            {assignee && (
              <div className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-full ${getUserAvatarColor(assignee.id)} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-[#252525] rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={14} className="text-[#999]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-lg z-10 min-w-[150px]">
              <button
                onClick={() => {
                  // Edit functionality
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-[#252525] transition-colors"
              >
                <Edit2 size={12} />
                Edit
              </button>
              <button
                onClick={() => {
                  // Duplicate functionality
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-[#252525] transition-colors"
              >
                <Copy size={12} />
                Duplicate
              </button>
              <button
                onClick={() => {
                  onDelete(task.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-[#252525] transition-colors border-t border-[#333]"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mt-2">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Drag Handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab">
        <GripVertical size={14} className="text-[#999]" />
      </div>
    </motion.div>
  );
};

// List View Component
const ListView = ({ tasks, users, handleUpdateTask, handleDeleteTask, getUserAvatarColor, getAssigneeById }) => {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-[#1a1a1a] border-b border-[#2f2f2f] text-xs font-medium text-[#999] uppercase tracking-wide">
            <div className="col-span-1"></div>
            <div className="col-span-4">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-1">Due</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#1f1f1f]">
            {tasks.length === 0 ? (
              <div className="p-12 text-center text-[#666]">
                No tasks found. Create one to get started!
              </div>
            ) : (
              tasks.map((task) => {
                const assignee = getAssigneeById(task.assigneeId);
                const status = STATUSES[task.status?.toUpperCase().replace('-', '_')] || STATUSES.TODO;
                const priority = PRIORITIES[task.priority?.toUpperCase()] || PRIORITIES.MEDIUM;

                return (
                  <div key={task.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-[#1a1a1a] transition-colors group">
                    <div className="col-span-1 flex items-center">
                      <button onClick={() => handleUpdateTask(task.id, { done: !task.done })}>
                        {task.done ? (
                          <CheckCircle size={18} className="text-emerald-500" />
                        ) : (
                          <Circle size={18} className="text-[#666] group-hover:text-[#999]" />
                        )}
                      </button>
                    </div>

                    <div className="col-span-4 flex items-center">
                      <span className={`text-sm text-white ${task.done ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <span className={`text-xs px-2 py-1 rounded ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <span className={`text-xs flex items-center gap-1 ${priority.color}`}>
                        <Flag size={12} />
                        {priority.label}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      {assignee && (
                        <>
                          <div className={`w-6 h-6 rounded-full ${getUserAvatarColor(assignee.id)} flex items-center justify-center text-white text-xs font-bold`}>
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-[#999]">{assignee.name}</span>
                        </>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center justify-between">
                      {task.dueDate && (
                        <span className="text-xs text-[#666]">
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#252525] rounded transition-all"
                      >
                        <Trash2 size={14} className="text-[#999] hover:text-rose-500" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Calendar View Component
const CalendarView = ({ tasks, filterDate, setFilterDate }) => {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
          <div className="text-center text-[#999] py-12">
            <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Calendar view coming soon...</p>
            <p className="text-xs mt-2 text-[#666]">Visualize tasks on a calendar grid</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTasks;
