import React, { useMemo, useState } from 'react';
import { Project, Stage, Status } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

interface CalendarViewProps {
    projects: Project[];
    onSelectProject: (project: Project) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ projects, onSelectProject }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = daysInMonth(currentDate);
        const firstDay = firstDayOfMonth(currentDate);

        const grid = [];
        let dayCounter = 1;

        // Create weeks
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    week.push(null); // Empty slot before 1st of month
                } else if (dayCounter > days) {
                    week.push(null); // Empty slot after last day
                } else {
                    const dateTimestamp = new Date(year, month, dayCounter).setHours(0,0,0,0);
                    // Find projects due on this day
                    const dayProjects = projects.filter(p => {
                        const d = new Date(p.dueDate);
                        return d.setHours(0,0,0,0) === dateTimestamp && !p.archived;
                    });
                    
                    week.push({ day: dayCounter, projects: dayProjects });
                    dayCounter++;
                }
            }
            grid.push(week);
            if (dayCounter > days) break;
        }
        return grid;
    }, [currentDate, projects]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const today = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

    return (
        <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Editorial Calendar</h1>
                    <p className="text-[#666]">Schedule and deadline visualization.</p>
                </div>
                <div className="flex items-center space-x-4 bg-[#1e1e1e] border border-[#2f2f2f] rounded-lg p-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-[#333] rounded-md text-[#888] hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="w-40 text-center font-bold text-white select-none">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-[#333] rounded-md text-[#888] hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl overflow-hidden flex flex-col">
                {/* Weekday Header */}
                <div className="grid grid-cols-7 border-b border-[#2f2f2f] bg-[#191919]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-[#666] uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-rows-5">
                    {monthData.map((week, wIdx) => (
                        <div key={wIdx} className="grid grid-cols-7 border-b border-[#2f2f2f] last:border-0">
                            {week.map((cell, dIdx) => (
                                <div 
                                    key={dIdx} 
                                    className={`relative border-r border-[#2f2f2f] last:border-0 p-2 min-h-[100px] transition-colors
                                    ${!cell ? 'bg-[#151515]' : 'hover:bg-[#252525]'}
                                    ${cell && isCurrentMonth && cell.day === today ? 'bg-[#1a1a1a]' : ''}`}
                                >
                                    {cell && (
                                        <>
                                            <span className={`text-xs font-mono font-bold mb-2 block
                                                ${isCurrentMonth && cell.day === today ? 'text-indigo-400' : 'text-[#444]'}`}>
                                                {cell.day}
                                            </span>
                                            
                                            <div className="space-y-1.5 overflow-y-auto max-h-[100px] pr-1 scrollbar-hide">
                                                {cell.projects.map(project => (
                                                    <div 
                                                        key={project.id}
                                                        onClick={() => onSelectProject(project)}
                                                        className={`text-[10px] p-1.5 rounded border truncate cursor-pointer transition-all hover:scale-[1.02]
                                                            ${project.stage === Stage.Done 
                                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                                : project.priority === 'High' 
                                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                                    : 'bg-[#2a2a2a] border-[#333] text-[#ccc]'
                                                            }`}
                                                    >
                                                        {project.stage === Stage.Done && <CheckCircle size={8} className="inline mr-1" />}
                                                        {project.stage !== Stage.Done && <Clock size={8} className="inline mr-1" />}
                                                        {project.title}
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
    );
};

export default CalendarView;