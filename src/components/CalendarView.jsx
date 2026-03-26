'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STAGE_COLORS = {
  Backlog: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  Scripting: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  Shooting: { bg: '#f5f3ff', text: '#7c3aed', dot: '#8b5cf6' },
  Editing: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  Review: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  Publishing: { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' },
  Done: { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
};

export default function CalendarView({ projects = [], onSelectProject }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(new Date().toDateString()); };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push({ date: new Date(year, month, -startDay + i + 1), inMonth: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), inMonth: true });
    while (days.length < 42) days.push({ date: new Date(year, month + 1, days.length - daysInMonth - startDay + 1), inMonth: false });
    return days;
  }, [year, month]);

  const projectsByDate = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      if (!p.dueDate) return;
      const key = new Date(p.dueDate).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [projects]);

  const todayStr = new Date().toDateString();
  const selectedProjects = selectedDay ? (projectsByDate[selectedDay] || []) : [];

  // Stats
  const totalThisMonth = useMemo(() => {
    return projects.filter(p => {
      if (!p.dueDate) return false;
      const d = new Date(p.dueDate);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [projects, year, month]);

  const overdueThisMonth = useMemo(() => {
    const now = new Date();
    return projects.filter(p => {
      if (!p.dueDate) return false;
      const d = new Date(p.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d < now && p.stage !== 'Done';
    }).length;
  }, [projects, year, month]);

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--text)' }}>Calendar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {totalThisMonth} deliverables this month{overdueThisMonth > 0 ? ` · ${overdueThisMonth} overdue` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday}
            className="px-4 py-2 text-[13px] font-semibold rounded-xl border transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Today
          </button>
          <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={prev} className="px-3 py-2 transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-[15px] font-bold min-w-[170px] text-center" style={{ color: 'var(--text)' }}>{monthLabel}</span>
            <button onClick={next} className="px-3 py-2 transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-5">
        {/* Calendar Grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          className="flex-1 rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-light)' }}>
            {DAYS.map(d => (
              <div key={d} className="px-2 py-3 text-center text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const key = day.date.toDateString();
              const dayProjects = projectsByDate[key] || [];
              const isToday = key === todayStr;
              const isSelected = key === selectedDay;
              const hasProjects = dayProjects.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  className="min-h-[100px] md:min-h-[120px] border-b border-r p-2 cursor-pointer transition-all"
                  style={{
                    borderColor: 'var(--border-light)',
                    background: isSelected ? 'var(--primary-light)' : !day.inMonth ? 'var(--bg-card-hover)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = !day.inMonth ? 'var(--bg-card-hover)' : 'transparent'; }}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold transition-all ${
                      isToday ? 'text-white' : ''
                    }`} style={{
                      background: isToday ? 'var(--primary)' : 'transparent',
                      color: isToday ? 'white' : day.inMonth ? 'var(--text)' : 'var(--text-muted)',
                      boxShadow: isToday ? '0 2px 8px var(--primary)40' : 'none'
                    }}>
                      {day.date.getDate()}
                    </div>
                    {hasProjects && (
                      <span className="text-[10px] font-bold rounded-md px-1.5 py-0.5" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        {dayProjects.length}
                      </span>
                    )}
                  </div>

                  {/* Project dots/chips */}
                  <div className="space-y-1">
                    {dayProjects.slice(0, 3).map(p => {
                      const overdue = new Date(p.dueDate) < new Date() && p.stage !== 'Done';
                      const sc = STAGE_COLORS[p.stage] || STAGE_COLORS.Backlog;
                      return (
                        <div key={p.id}
                          onClick={e => { e.stopPropagation(); onSelectProject?.(p); }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg truncate cursor-pointer transition-all hover:scale-[1.02]"
                          style={{
                            background: overdue ? '#fef2f2' : sc.bg,
                            color: overdue ? '#dc2626' : sc.text,
                            borderLeft: `3px solid ${overdue ? '#ef4444' : sc.dot}`,
                          }}>
                          {p.title}
                        </div>
                      );
                    })}
                    {dayProjects.length > 3 && (
                      <span className="text-[9px] font-medium px-2" style={{ color: 'var(--text-muted)' }}>+{dayProjects.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Side Panel — selected day detail */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="hidden lg:block shrink-0 overflow-hidden"
            >
              <div className="w-[320px] rounded-2xl border h-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                      {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedProjects.length} deliverable{selectedProjects.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <X size={16} />
                  </button>
                </div>

                <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {selectedProjects.length > 0 ? selectedProjects.map((p, i) => {
                    const sc = STAGE_COLORS[p.stage] || STAGE_COLORS.Backlog;
                    const overdue = new Date(p.dueDate) < new Date() && p.stage !== 'Done';
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        onClick={() => onSelectProject?.(p)}
                        className="rounded-xl border p-4 cursor-pointer transition-all"
                        style={{ borderColor: 'var(--border)', borderLeft: `4px solid ${overdue ? '#ef4444' : sc.dot}` }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-[13px] font-bold leading-snug" style={{ color: p.stage === 'Done' ? 'var(--success)' : 'var(--text)' }}>
                            {p.title}
                          </h4>
                          {overdue && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 shrink-0">Late</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: sc.bg, color: sc.text }}>
                            {p.stage}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.creator}</span>
                          {p.platform && (
                            <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                              {p.platform === 'youtube' ? '▶ YT' : p.platform === 'instagram' ? '◉ IG' : p.platform}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="py-10 text-center">
                      <Calendar size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>No deliverables on this day</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
