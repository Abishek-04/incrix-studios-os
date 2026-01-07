import React, { useMemo, useState } from 'react';
import { Project, Stage, Channel, Priority, Platform, Vertical, Status } from '../types';
import { MoreHorizontal, Calendar, User, Clock, ChevronLeft, ChevronRight, Plus, Search, Filter } from 'lucide-react';

interface ProjectBoardProps {
    projects: Project[];
    channels: Channel[];
    onSelectProject: (project: Project) => void;
    onCreateProject: (project: Project) => void;
    onUpdateProject: (project: Project) => void;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projects, channels, onSelectProject, onCreateProject, onUpdateProject }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    // Define the columns based on the Stage enum order
    const columns = [
        Stage.Backlog,
        Stage.Scripting,
        Stage.Shooting,
        Stage.Editing,
        Stage.Review,
        Stage.Done
    ];

    // Extract unique months from projects for the dropdown
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        projects.forEach(p => {
            const date = new Date(p.dueDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(key);
        });
        return Array.from(months).sort().reverse();
    }, [projects]);

    const formatMonth = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const handleCreateNew = () => {
        // Create a blank project template
        const newProject: Project = {
            id: `PRJ-${Date.now().toString().slice(-4)}`,
            title: 'New Untitled Project',
            topic: 'To be decided',
            vertical: Vertical.Software, // Default
            platform: Platform.YouTube, // Default
            role: 'manager',
            creator: 'Unassigned',
            editor: 'Unassigned',
            stage: Stage.Backlog,
            status: Status.NotStarted,
            priority: Priority.Medium,
            lastUpdated: Date.now(),
            dueDate: Date.now() + 86400000 * 7, // 1 week
            durationMinutes: 0,
            script: '',
            tasks: [],
            technicalNotes: '',
            comments: [],
            hasMographNeeds: false,
            archived: false
        };
        onCreateProject(newProject);
        onSelectProject(newProject); // Open it immediately
    };

    const handleMoveProject = (e: React.MouseEvent, project: Project, direction: 'left' | 'right') => {
        e.stopPropagation();
        const currentIndex = columns.indexOf(project.stage);
        let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

        // Bounds check
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= columns.length) newIndex = columns.length - 1;

        if (newIndex !== currentIndex) {
            const newStage = columns[newIndex];
            onUpdateProject({ ...project, stage: newStage, lastUpdated: Date.now() });
        }
    };

    const getProjectsForStage = (stage: Stage) => {
        return projects.filter(p => {
            if (p.archived) return false;
            if (p.stage !== stage) return false;

            // Apply Filters
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!p.title.toLowerCase().includes(query) && !p.topic.toLowerCase().includes(query)) return false;
            }

            if (selectedMonth !== 'all') {
                const date = new Date(p.dueDate);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (key !== selectedMonth) return false;
            }

            return true;
        });
    };

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.High: return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case Priority.Medium: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case Priority.Low: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-[#252525]">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666]" />
                        <input
                            type="text"
                            placeholder="Filter cards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#1e1e1e] border border-[#2f2f2f] text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#444] placeholder-[#555] w-64 transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={14} className="text-[#666]" />
                        </div>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-[#1e1e1e] border border-[#2f2f2f] text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#444] appearance-none cursor-pointer hover:bg-[#252525] transition-colors"
                        >
                            <option value="all">All Dates</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{formatMonth(month)}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-3 h-3 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleCreateNew}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Plus size={16} />
                    <span>New Project</span>
                </button>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto p-8 space-x-6">
                <div className="inline-flex h-full space-x-6">
                    {columns.map((stage, colIndex) => {
                        const stageProjects = getProjectsForStage(stage);

                        return (
                            <div key={stage} className="w-80 flex flex-col h-full bg-[#181818] rounded-xl border border-[#252525] flex-shrink-0">
                                {/* Column Header */}
                                <div className="p-4 border-b border-[#252525] flex items-center justify-between sticky top-0 bg-[#181818] z-10 rounded-t-xl group">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-bold text-white text-sm">{stage}</h3>
                                        <div className="bg-[#252525] text-[#888] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                            {stageProjects.length}
                                        </div>
                                    </div>
                                    <button className="text-[#444] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>

                                {/* Cards Container */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                                    {stageProjects.map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => onSelectProject(project)}
                                            className="bg-[#1f1f1f] p-4 rounded-xl border border-[#2a2a2a] hover:border-[#444] hover:bg-[#222] transition-all cursor-pointer group shadow-sm hover:shadow-md relative"
                                        >
                                            {/* Hover Controls for Moving */}
                                            <div className="absolute top-1/2 -translate-y-1/2 -left-3 hidden group-hover:flex">
                                                {colIndex > 0 && (
                                                    <button
                                                        onClick={(e) => handleMoveProject(e, project, 'left')}
                                                        className="p-1 bg-[#252525] border border-[#333] rounded-full text-[#888] hover:text-white hover:bg-[#333] shadow-lg"
                                                        title="Move Back"
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="absolute top-1/2 -translate-y-1/2 -right-3 hidden group-hover:flex">
                                                {colIndex < columns.length - 1 && (
                                                    <button
                                                        onClick={(e) => handleMoveProject(e, project, 'right')}
                                                        className="p-1 bg-[#252525] border border-[#333] rounded-full text-[#888] hover:text-white hover:bg-[#333] shadow-lg"
                                                        title="Move Forward"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </div>


                                            {/* Project Meta */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriorityColor(project.priority)}`}>
                                                    {project.priority}
                                                </div>
                                                {project.hasMographNeeds && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Mograph Needed"></div>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                                                {project.title}
                                            </h4>
                                            <p className="text-xs text-[#666] mb-4 truncate">{project.topic}</p>

                                            {/* Footer Info */}
                                            <div className="pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
                                                {/* Avatar / Assignee */}
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-5 h-5 rounded-full bg-indigo-900 border border-[#2a2a2a] flex items-center justify-center text-[9px] text-white font-bold" title={project.creator}>
                                                        {project.creator.charAt(0)}
                                                    </div>
                                                    {project.editor !== 'Unassigned' && (
                                                        <div className="w-5 h-5 rounded-full bg-[#333] border border-[#2a2a2a] flex items-center justify-center text-[9px] text-white font-bold" title={project.editor}>
                                                            {project.editor.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Due Date */}
                                                <div className={`flex items-center space-x-1 text-[10px] ${new Date(project.dueDate) < new Date() && project.stage !== Stage.Done ? 'text-rose-400' : 'text-[#666]'}`}>
                                                    <Calendar size={10} />
                                                    <span>{new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {stageProjects.length === 0 && (
                                        <div className="py-8 text-center border-2 border-dashed border-[#252525] rounded-xl opacity-50">
                                            <p className="text-[10px] text-[#444] font-medium uppercase tracking-wider">Empty</p>
                                        </div>
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

export default ProjectBoard;
