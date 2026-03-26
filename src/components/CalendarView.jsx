'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView({ projects = [], onSelectProject }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, -startDay + i + 1);
      days.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), inMonth: true });
    }
    // Fill to 42
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - daysInMonth - startDay + 1);
      days.push({ date: d, inMonth: false });
    }
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

  return (
    <div className="min-h-full bg-[#f5f3ef] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-stone-800">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50">Today</button>
          <button onClick={prev} className="p-2 text-stone-400 hover:text-stone-800 hover:bg-white rounded-xl transition-colors"><ChevronLeft size={18} /></button>
          <span className="text-[15px] font-bold text-stone-800 min-w-[160px] text-center">{monthLabel}</span>
          <button onClick={next} className="p-2 text-stone-400 hover:text-stone-800 hover:bg-white rounded-xl transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {DAYS.map(d => (
            <div key={d} className="px-3 py-2.5 text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const key = day.date.toDateString();
            const dayProjects = projectsByDate[key] || [];
            const isToday = key === todayStr;

            return (
              <div key={i} className={`min-h-[90px] md:min-h-[110px] border-b border-r border-stone-100/80 p-1.5 transition-colors ${
                !day.inMonth ? 'bg-stone-50/50' : 'hover:bg-orange-50/20'
              }`}>
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-orange-500 text-white font-bold' : day.inMonth ? 'text-stone-700' : 'text-stone-300'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayProjects.slice(0, 3).map(p => {
                    const overdue = new Date(p.dueDate) < new Date() && p.stage !== 'Done';
                    return (
                      <div key={p.id} onClick={() => onSelectProject?.(p)}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate cursor-pointer transition-colors ${
                          p.stage === 'Done' ? 'bg-emerald-50 text-emerald-600' :
                          overdue ? 'bg-rose-50 text-rose-600' :
                          'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}>
                        {p.title}
                      </div>
                    );
                  })}
                  {dayProjects.length > 3 && (
                    <span className="text-[9px] text-stone-400 px-1">+{dayProjects.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
