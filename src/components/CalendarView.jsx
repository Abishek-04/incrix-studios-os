'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Neon palette: Purple #7C00FE, Yellow #F9E400, Amber #FFAF00
// Light theme
const STAGE_LIGHT = {
  Backlog:    { bg: 'rgba(124,0,254,0.06)',  text: '#7C00FE', dot: '#7C00FE', glow: '0 0 12px rgba(124,0,254,0.2), 0 0 4px rgba(124,0,254,0.1)' },
  Scripting:  { bg: 'rgba(124,0,254,0.06)',  text: '#7C00FE', dot: '#7C00FE', glow: '0 0 12px rgba(124,0,254,0.2), 0 0 4px rgba(124,0,254,0.1)' },
  Shooting:   { bg: 'rgba(255,175,0,0.08)',  text: '#cc8c00', dot: '#FFAF00', glow: '0 0 12px rgba(255,175,0,0.25), 0 0 4px rgba(255,175,0,0.1)' },
  Editing:    { bg: 'rgba(249,228,0,0.08)',  text: '#b8a600', dot: '#F9E400', glow: '0 0 12px rgba(249,228,0,0.25), 0 0 4px rgba(249,228,0,0.1)' },
  Review:     { bg: 'rgba(255,175,0,0.08)',  text: '#cc8c00', dot: '#FFAF00', glow: '0 0 12px rgba(255,175,0,0.25), 0 0 4px rgba(255,175,0,0.1)' },
  Publishing: { bg: 'rgba(124,0,254,0.06)',  text: '#7C00FE', dot: '#7C00FE', glow: '0 0 12px rgba(124,0,254,0.2), 0 0 4px rgba(124,0,254,0.1)' },
  Done:       { bg: 'rgba(124,0,254,0.08)',  text: '#6a00d9', dot: '#7C00FE', glow: '0 0 14px rgba(124,0,254,0.25), 0 0 5px rgba(124,0,254,0.15)' },
};

// Dark theme — neon glow cranked up
const STAGE_DARK = {
  Backlog:    { bg: 'rgba(124,0,254,0.1)',   text: '#a855f7', dot: '#a855f7', glow: '0 0 16px rgba(124,0,254,0.4), 0 0 6px rgba(124,0,254,0.2)' },
  Scripting:  { bg: 'rgba(124,0,254,0.1)',   text: '#a855f7', dot: '#a855f7', glow: '0 0 16px rgba(124,0,254,0.4), 0 0 6px rgba(124,0,254,0.2)' },
  Shooting:   { bg: 'rgba(255,175,0,0.1)',   text: '#FFAF00', dot: '#FFAF00', glow: '0 0 16px rgba(255,175,0,0.4), 0 0 6px rgba(255,175,0,0.2)' },
  Editing:    { bg: 'rgba(249,228,0,0.1)',   text: '#F9E400', dot: '#F9E400', glow: '0 0 16px rgba(249,228,0,0.4), 0 0 6px rgba(249,228,0,0.2)' },
  Review:     { bg: 'rgba(255,175,0,0.1)',   text: '#FFAF00', dot: '#FFAF00', glow: '0 0 16px rgba(255,175,0,0.4), 0 0 6px rgba(255,175,0,0.2)' },
  Publishing: { bg: 'rgba(124,0,254,0.1)',   text: '#a855f7', dot: '#a855f7', glow: '0 0 16px rgba(124,0,254,0.4), 0 0 6px rgba(124,0,254,0.2)' },
  Done:       { bg: 'rgba(124,0,254,0.12)',  text: '#c084fc', dot: '#c084fc', glow: '0 0 20px rgba(124,0,254,0.45), 0 0 8px rgba(124,0,254,0.25)' },
};

export default function CalendarView({ projects = [], onSelectProject }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const STAGE_COLORS = isDark ? STAGE_DARK : STAGE_LIGHT;
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
                      background: isToday ? '#7C00FE' : 'transparent',
                      color: isToday ? 'white' : day.inMonth ? 'var(--text)' : 'var(--text-muted)',
                      boxShadow: isToday ? '0 0 16px rgba(124,0,254,0.5), 0 0 6px rgba(124,0,254,0.3)' : 'none'
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
                          className="text-[10px] font-semibold px-2 py-1.5 rounded-lg truncate cursor-pointer transition-all hover:scale-[1.02]"
                          style={{
                            background: overdue ? (isDark ? 'rgba(255,50,80,0.1)' : 'rgba(255,50,80,0.07)') : sc.bg,
                            color: overdue ? (isDark ? '#ff6b8a' : '#e6003a') : sc.text,
                            borderLeft: `3px solid ${overdue ? (isDark ? '#ff6b8a' : '#e6003a') : sc.dot}`,
                            boxShadow: overdue ? `0 0 14px rgba(255,50,80,${isDark ? '0.4' : '0.2'}), 0 0 5px rgba(255,50,80,0.15)` : sc.glow,
                            backdropFilter: 'blur(4px)',
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
                        style={{ borderColor: 'var(--border)', borderLeft: `4px solid ${overdue ? (isDark ? '#ff6b8a' : '#e6003a') : sc.dot}`, boxShadow: sc.glow }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.boxShadow = (sc.glow || '').replace('10px', '18px').replace('8px', '16px'); }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = sc.glow; }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-[13px] font-bold leading-snug" style={{ color: p.stage === 'Done' ? 'var(--success)' : 'var(--text)' }}>
                            {p.title}
                          </h4>
                          {overdue && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 shrink-0">Late</span>}
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
