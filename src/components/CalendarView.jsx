import React, { useMemo, useState } from 'react';
import { Stage } from '@/types';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Filter } from 'lucide-react';

const CHANNEL_BADGE_STYLES = [
    'bg-sky-500/12 border-sky-500/30 text-sky-300',
    'bg-emerald-500/12 border-emerald-500/30 text-emerald-300',
    'bg-amber-500/12 border-amber-500/30 text-amber-300',
    'bg-rose-500/12 border-rose-500/30 text-rose-300',
    'bg-violet-500/12 border-violet-500/30 text-violet-300',
    'bg-cyan-500/12 border-cyan-500/30 text-cyan-300'
];

const getChannelStyle = (channelId = '') => {
    let hash = 0;
    for (let i = 0; i < channelId.length; i++) {
        hash = (hash << 5) - hash + channelId.charCodeAt(i);
        hash |= 0;
    }
    return CHANNEL_BADGE_STYLES[Math.abs(hash) % CHANNEL_BADGE_STYLES.length];
};

const dateToKey = (date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const CalendarView = ({ projects, channels = [], onSelectProject }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedChannelId, setSelectedChannelId] = useState('all');
    const [selectedDateKey, setSelectedDateKey] = useState(dateToKey(new Date()));

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const channelLookup = useMemo(() => {
        return channels.reduce((acc, channel) => {
            acc[channel.id] = channel;
            return acc;
        }, {});
    }, [channels]);

    const activeProjects = useMemo(() => {
        return projects.filter((project) => {
            if (project.archived) return false;
            if (selectedChannelId === 'all') return true;
            return project.channelId === selectedChannelId;
        });
    }, [projects, selectedChannelId]);

    const monthProjects = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return activeProjects.filter((project) => {
            const date = new Date(project.dueDate);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }, [activeProjects, currentDate]);

    const monthlyCountsByChannel = useMemo(() => {
        const counts = {};
        monthProjects.forEach((project) => {
            const key = project.channelId || 'unassigned';
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([channelId, count]) => {
                const channel = channelLookup[channelId];
                return {
                    channelId,
                    count,
                    label: channel?.name || 'Unassigned Account'
                };
            })
            .sort((a, b) => b.count - a.count);
    }, [monthProjects, channelLookup]);

    const selectedDateProjects = useMemo(() => {
        return monthProjects.filter((project) => {
            const date = new Date(project.dueDate);
            return dateToKey(date) === selectedDateKey;
        });
    }, [monthProjects, selectedDateKey]);

    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = daysInMonth(currentDate);
        const firstDay = firstDayOfMonth(currentDate);

        const grid = [];
        let dayCounter = 1;

        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    week.push(null);
                } else if (dayCounter > days) {
                    week.push(null);
                } else {
                    const dateTimestamp = new Date(year, month, dayCounter).setHours(0, 0, 0, 0);
                    const dayProjects = activeProjects.filter((project) => {
                        const d = new Date(project.dueDate);
                        return d.setHours(0, 0, 0, 0) === dateTimestamp;
                    });

                    week.push({
                        day: dayCounter,
                        key: dateToKey(new Date(year, month, dayCounter)),
                        projects: dayProjects
                    });
                    dayCounter++;
                }
            }
            grid.push(week);
            if (dayCounter > days) break;
        }
        return grid;
    }, [currentDate, activeProjects]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const today = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4 md:mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Editorial Calendar</h1>
                    <p className="text-sm md:text-base text-[#666]">Schedule and deadline visualization.</p>
                </div>

                <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                        <select
                            value={selectedChannelId}
                            onChange={(e) => setSelectedChannelId(e.target.value)}
                            className="w-full sm:min-w-[220px] appearance-none pl-9 pr-8 py-2.5 bg-[#1e1e1e] border border-[#2f2f2f] rounded-lg text-sm text-[#ddd] focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                            <option value="all">All Accounts</option>
                            {channels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-normal sm:space-x-4 bg-[#1e1e1e] border border-[#2f2f2f] rounded-lg p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-[#333] rounded-md text-[#888] hover:text-white transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-[150px] md:w-40 text-center font-bold text-sm md:text-base text-white select-none">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-[#333] rounded-md text-[#888] hover:text-white transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-4 p-3 bg-[#171717] border border-[#2a2a2a] rounded-xl">
                <div className="text-xs uppercase tracking-wider text-[#666] mb-2">
                    Account Volume In {currentDate.toLocaleString('default', { month: 'long' })}
                </div>
                <div className="flex flex-wrap gap-2">
                    {monthlyCountsByChannel.length === 0 && (
                        <span className="text-sm text-[#777]">No content found for this month.</span>
                    )}
                    {monthlyCountsByChannel.map((entry) => (
                        <span
                            key={entry.channelId}
                            className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getChannelStyle(entry.channelId)}`}
                        >
                            {entry.label} • {entry.count}
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl">
                <div className="w-full">
                <div className="grid grid-cols-7 border-b border-[#2f2f2f] bg-[#191919]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-[#666] uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid auto-rows-[minmax(90px,auto)] md:auto-rows-[minmax(100px,auto)]">
                    {monthData.map((week, wIdx) => (
                        <div key={wIdx} className="grid grid-cols-7 border-b border-[#2f2f2f] last:border-0">
                            {week.map((cell, dIdx) => (
                                <div
                                    key={dIdx}
                                    className={`relative border-r border-[#2f2f2f] last:border-0 p-1.5 md:p-2 min-h-[90px] md:min-h-[100px] transition-colors ${!cell ? 'bg-[#151515]' : 'hover:bg-[#252525]'} ${cell && isCurrentMonth && cell.day === today ? 'bg-[#1a1a1a]' : ''} ${cell && selectedDateKey === cell.key ? 'ring-1 ring-sky-500/40 ring-inset' : ''}`}
                                    onClick={() => cell && setSelectedDateKey(cell.key)}
                                >
                                    {cell && (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xs font-mono font-bold block ${isCurrentMonth && cell.day === today ? 'text-indigo-400' : 'text-[#999]'}`}>
                                                    {cell.day}
                                                </span>
                                                {cell.projects.length > 0 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#2b2b2b] text-[#9ca3af] border border-[#3a3a3a]">
                                                        {cell.projects.length}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1 pr-1">
                                                {cell.projects.map((project) => (
                                                    <div
                                                        key={project.id}
                                                        onClick={() => onSelectProject(project)}
                                                        className={`text-[10px] p-1.5 rounded border truncate cursor-pointer transition-all hover:scale-[1.02] ${project.stage === Stage.Done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : project.priority === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-[#2a2a2a] border-[#333] text-[#ccc]'}`}
                                                    >
                                                        <div className="truncate">
                                                            {project.stage === Stage.Done && <CheckCircle size={8} className="inline mr-1" />}
                                                            {project.stage !== Stage.Done && <Clock size={8} className="inline mr-1" />}
                                                            {project.title}
                                                        </div>
                                                        <div className="mt-1">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] leading-none ${getChannelStyle(project.channelId || 'unassigned')}`}>
                                                                {channelLookup[project.channelId]?.name || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                </div>
            </div>

            <div className="mt-4 p-3 md:p-4 bg-[#1b1b1b] border border-[#2f2f2f] rounded-xl">
                <div className="text-sm text-white font-semibold mb-1">
                    {selectedDateKey} • {selectedDateProjects.length} item{selectedDateProjects.length === 1 ? '' : 's'}
                </div>
                <div className="text-xs text-[#777] mb-3">
                    Showing content for selected date in current month {selectedChannelId === 'all' ? '(all accounts)' : '(filtered account)'}.
                </div>
                <div className="space-y-2 pr-1">
                    {selectedDateProjects.length === 0 && (
                        <div className="text-sm text-[#777]">No content scheduled for this date.</div>
                    )}
                    {selectedDateProjects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className="w-full text-left p-2.5 rounded-lg border border-[#333] bg-[#212121] hover:bg-[#262626] transition-colors"
                        >
                            <div className="text-sm text-[#ddd] truncate">{project.title}</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getChannelStyle(project.channelId || 'unassigned')}`}>
                                    {channelLookup[project.channelId]?.name || 'Unassigned'}
                                </span>
                                <span className="text-[10px] text-[#888]">{project.stage}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
