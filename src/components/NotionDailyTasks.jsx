'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, User, Check, Circle, Trash2, GripVertical, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotionDailyTasks({ tasks = [], users = [], currentUser, onUpdateTasks }) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, pending, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Group tasks
  const getGroupedTasks = () => {
    let filtered = localTasks;

    // Apply filters
    if (filter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(t => new Date(t.createdAt).toDateString() === today);
    } else if (filter === 'pending') {
      filtered = filtered.filter(t => !t.done);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.done);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Group by date
    const groups = {};
    filtered.forEach(task => {
      const date = new Date(task.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
    });

    return groups;
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      done: false,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...localTasks, newTask];
    setLocalTasks(updated);
    onUpdateTasks(updated);
    setNewTaskText('');
  };

  const handleToggleTask = (taskId) => {
    const updated = localTasks.map(t =>
      t.id === taskId ? { ...t, done: !t.done, updatedAt: new Date().toISOString() } : t
    );
    setLocalTasks(updated);
    onUpdateTasks(updated);
  };

  const handleUpdateTaskText = (taskId, newText) => {
    const updated = localTasks.map(t =>
      t.id === taskId ? { ...t, text: newText, updatedAt: new Date().toISOString() } : t
    );
    setLocalTasks(updated);
    onUpdateTasks(updated);
  };

  const handleDeleteTask = (taskId) => {
    const updated = localTasks.filter(t => t.id !== taskId);
    setLocalTasks(updated);
    onUpdateTasks(updated);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const groupedTasks = getGroupedTasks();
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(b) - new Date(a));

  const stats = {
    total: localTasks.length,
    completed: localTasks.filter(t => t.done).length,
    pending: localTasks.filter(t => !t.done).length,
    today: localTasks.filter(t =>
      new Date(t.createdAt).toDateString() === new Date().toDateString()
    ).length
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
        <p className="text-[#999] text-sm">Manage your daily tasks with ease</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#333] transition-colors">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-[#999] mt-1">Total Tasks</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#333] transition-colors">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-[#999] mt-1">Completed</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#333] transition-colors">
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-xs text-[#999] mt-1">Pending</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#333] transition-colors">
          <div className="text-2xl font-bold text-indigo-400">{stats.today}</div>
          <div className="text-xs text-[#999] mt-1">Today</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1e1e1e] text-[#999] border border-[#2a2a2a] hover:border-[#333] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#333] transition-colors">
        <div className="flex items-center gap-3">
          <Plus className="w-5 h-5 text-[#666]" />
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task... (Press Enter to add)"
            className="flex-1 bg-transparent text-white placeholder-[#666] focus:outline-none"
          />
          {newTaskText && (
            <button
              onClick={handleAddTask}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-8">
        <AnimatePresence>
          {sortedDates.map(date => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-[#666]" />
                <h3 className="text-sm font-semibold text-[#999]">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <div className="flex-1 h-px bg-[#2a2a2a]"></div>
              </div>

              {/* Tasks for this date */}
              <div className="space-y-1">
                {groupedTasks[date].map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    currentUser={currentUser}
                    isFocused={focusedTaskId === task.id}
                    onToggle={() => handleToggleTask(task.id)}
                    onUpdate={(newText) => handleUpdateTaskText(task.id, newText)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onFocus={() => setFocusedTaskId(task.id)}
                    onBlur={() => setFocusedTaskId(null)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {sortedDates.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
              <Check className="w-8 h-8 text-[#666]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-[#999] text-sm">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Add your first task to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, users, currentUser, isFocused, onToggle, onUpdate, onDelete, onFocus, onBlur }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  const assignee = users.find(u => u.id === task.userId) || currentUser;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() && editText !== task.text) {
      onUpdate(editText);
    } else {
      setEditText(task.text);
    }
    setIsEditing(false);
    onBlur();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
      onBlur();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isFocused
          ? 'bg-[#1e1e1e] border border-indigo-500/50'
          : 'bg-[#1a1a1a] border border-transparent hover:bg-[#1e1e1e] hover:border-[#2a2a2a]'
      }`}
    >
      {/* Drag Handle (on hover) */}
      <div className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <GripVertical className="w-4 h-4 text-[#666] cursor-grab" />
      </div>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex-shrink-0"
      >
        {task.done ? (
          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        ) : (
          <Circle className="w-5 h-5 text-[#666] hover:text-white transition-colors" />
        )}
      </button>

      {/* Task Text */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyPress}
            onFocus={onFocus}
            className="w-full bg-transparent text-white focus:outline-none"
          />
        ) : (
          <div
            onClick={() => {
              setIsEditing(true);
              onFocus();
            }}
            className={`cursor-text ${
              task.done
                ? 'text-[#666] line-through'
                : 'text-white'
            }`}
          >
            {task.text}
          </div>
        )}
      </div>

      {/* Assignee Avatar */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ backgroundColor: assignee.avatarColor || '#666', color: '#fff' }}
        title={assignee.name}
      >
        {assignee.name?.charAt(0).toUpperCase()}
      </div>

      {/* Actions (on hover) */}
      <div className={`flex items-center gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-500/20 rounded transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}
