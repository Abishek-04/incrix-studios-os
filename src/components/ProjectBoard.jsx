import React, { useMemo, useState } from 'react';
import { Stage, Status, Priority, Platform, Vertical } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Status, Priority, Platform, Vertical } from '@/types';
import { MoreHorizontal, Calendar, User, Clock, ChevronLeft, ChevronRight, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { Stage, Status, Priority, Platform, Vertical } from '@/types';
import ConfirmationModal from './ui/ConfirmationModal';
import { Stage, Status, Priority, Platform, Vertical } from '@/types';

    channels: Channel[];
    searchQuery: string;

const ProjectBoard = ({ projects, channels, onSelectProject, onCreateProject, onUpdateProject, searchQuery, onDeleteProject }) => {
    // Local search state removed in favor of global props
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [projectToDelete, setProjectToDelete] = useState(null);

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
    const availableMonths = useMemo() => {
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

    const handleMoveProject = (e) => {
        e.stopPropagation();
        const currentIndex = columns.indexOf(project.stage);
        let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

        // Bounds check
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= columns.length) newIndex = columns.length - 1;

        if (newIndex !== currentIndex) => {
            const newStage = columns[newIndex];
            onUpdateProject({ ...project, stage: newStage, lastUpdated: Date.now() });
        }
    };

    // Memoize filtered projects for performance
    const getProjectsForStage = useMemo() => {
        return (stage: Stage) => {
            return projects.filter(p => {
                if (p.archived) return false;
                if (p.stage !== stage) return false;

                // Apply Filters
                if (searchQuery) => {
                    const query = searchQuery.toLowerCase();
                    if (!p.title.toLowerCase().includes(query) && !p.topic.toLowerCase().includes(query) return false;
                }

                if (selectedMonth !== 'all') => {
                    const date = new Date(p.dueDate);
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (key !== selectedMonth) return false;
                }

                return true;
            });
        };
    }, [projects, searchQuery, selectedMonth]);

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.High:
                return 'bg-rose-500/30 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/10';
            case Priority.Medium:
                return 'bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10';
            case Priority.Low:
                return 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-[#252525]">
                <div className="flex items-center space-x-4">
                    {/* Global search is used instead of local search now */}

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
                            )}
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
            <div className="flex-1 overflow-x-auto p-4 sm:p-8">
                {projects.length === 0 && !searchQuery ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full border-2 border-dashed border-[#222] rounded-2xl bg-[#111]">
                        <div className="w-16 h-16 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6 shadow-xl">
                            <Plus size={32} className="text-indigo-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Start Your First Project</h2>
                        <p className="text-[#999] text-base max-w-md text-center mb-8">
                            Your board is empty. Create a new project to start tracking your video production workflow from concept to completion.
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center space-x-2"
                        >
                            <Plus size={20} />
                            <span>Create Project</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-row h-full gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent -mx-4 px-4 sm:mx-0 sm:px-0">
                        {columns.map(stage, colIndex) => {
                            const stageProjects = getProjectsForStage(stage);

                            return (
                                <motion.div
                                    key={stage}
                                    className="min-w-[85vw] w-[85vw] sm:min-w-[320px] sm:w-80 flex flex-col h-full snap-center snap-always flex-shrink-0 bg-[#161616] rounded-xl border border-[#333]"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: colIndex * 0.1,
                                        ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                >
                                    {/* Column Header */}
                                    <div className="p-5 border-b-2 border-[#333] flex items-center justify-between sticky top-0 bg-gradient-to-b from-[#1a1a1a] to-[#161616] z-10 rounded-t-xl group backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-white text-lg tracking-tight">{stage}</h3>
                                            <motion.div
                                                className="bg-[#252525] text-[#aaa] text-[11px] font-semibold px-2 py-1 rounded-lg min-w-[28px] text-center border border-[#333]"
                                                key={stageProjects.length}
                                                initial={{ scale: 1.2 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                            >
                                                {stageProjects.length}
                                            </motion.div>
                                        </div>
                                        <button
                                            className="text-[#999] hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 p-2 hover:bg-[#252525] rounded-lg active:scale-95"
                                            aria-label="Column Options"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>

                                    {/* Cards Container */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                                        <AnimatePresence mode="popLayout">
                                            {stageProjects.map(project, index) => (
                                                <motion.div
                                                    key={project.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        delay: index * 0.05,
                                                        ease: [0.25, 0.1, 0.25, 1]
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => onSelectProject(project)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') => {
                                                            e.preventDefault();
                                                            onSelectProject(project);
                                                        }
                                                    }}
                                                    aria-label={`${project.title}, ${project.stage}, Priority: ${project.priority}`}
                                                    className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] hover:border-indigo-500/50 hover:bg-[#1f1f1f] transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl hover:shadow-indigo-900/20 relative transform focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#121212]"
                                                >
                                                    {/* Hover Controls for Moving - Desktop Only */}
                                                    <div className="absolute top-1/2 -translate-y-1/2 -left-3 hidden sm:group-hover:flex">
                                                        {colIndex > 0 && (
                                                            <button
                                                                onClick={(e) => handleMoveProject(e, project, 'left')}
                                                                className="p-2.5 bg-[#1e1e1e] border-2 border-[#333] rounded-full text-[#999] hover:text-white hover:bg-indigo-600 hover:border-indigo-500 shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                                                                title="Move to Previous Stage"
                                                                aria-label="Move to Previous Stage"
                                                            >
                                                                <ChevronLeft size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="absolute top-1/2 -translate-y-1/2 -right-3 hidden sm:group-hover:flex">
                                                        {colIndex < columns.length - 1 && (
                                                            <button
                                                                onClick={(e) => handleMoveProject(e, project, 'right')}
                                                                className="p-2.5 bg-[#1e1e1e] border-2 border-[#333] rounded-full text-[#999] hover:text-white hover:bg-indigo-600 hover:border-indigo-500 shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                                                                title="Move to Next Stage"
                                                                aria-label="Move to Next Stage"
                                                            >
                                                                <ChevronRight size={18} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Delete Button (Top Right) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProjectToDelete(project);
                                                        }}
                                                        className="absolute top-3 right-3 text-[#999] hover:text-rose-400 bg-[#111]/80 hover:bg-rose-500/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg border border-transparent hover:border-rose-500/50 min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
                                                        title="Delete Project"
                                                        aria-label="Delete Project"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    {/* Project Meta */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border backdrop-blur-sm ${getPriorityColor(project.priority)}`}>
                                                            {project.priority}
                                                        </div>
                                                        {project.hasMographNeeds && (
                                                            <div className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm" title="Motion Graphics Required">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                                                                <span>MG</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h4 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                                                        {project.title}
                                                    </h4>
                                                    <p className="text-sm text-[#888] mb-5 truncate">{project.topic}</p>

                                                    {/* Footer Info */}
                                                    <div className="pt-4 border-t border-[#333] flex items-center justify-between">
                                                        {/* Avatar / Assignee */}
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-900 border border-[#333] flex items-center justify-center text-[11px] text-white font-bold" title={project.creator}>
                                                                {project.creator.charAt(0)}
                                                            </div>
                                                            {project.editor !== 'Unassigned' && (
                                                                <div className="w-6 h-6 rounded-full bg-[#333] border border-[#444] flex items-center justify-center text-[11px] text-white font-bold" title={project.editor}>
                                                                    {project.editor.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Due Date */}
                                                        <div className={`flex items-center space-x-1 text-xs font-medium ${new Date(project.dueDate) < new Date() && project.stage !== Stage.Done ? 'text-rose-400' : 'text-[#999]'}`}>
                                                            <Calendar size={12} />
                                                            <span>{new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    </div>

                                                    {/* Mobile Touch Controls */}
                                                    <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                                                        {colIndex > 0 && (
                                                            <button
                                                                onClick={(e) => handleMoveProject(e, project, 'left')}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#252525] hover:bg-[#2a2a2a] active:bg-[#333] text-[#999] rounded-lg transition-colors text-xs font-medium active:scale-95 transform"
                                                            >
                                                                <ChevronLeft size={14} />
                                                                <span>Back</span>
                                                            </button>
                                                        )}
                                                        {colIndex < columns.length - 1 && (
                                                            <button
                                                                onClick={(e) => handleMoveProject(e, project, 'right')}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium active:scale-95 transform"
                                                            >
                                                                <span>Next</span>
                                                                <ChevronRight size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {stageProjects.length === 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                                className="py-12 text-center border-2 border-dashed border-[#2a2a2a] rounded-xl bg-[#111]/50 backdrop-blur-sm"
                                            >
                                                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center">
                                                    <Clock size={20} className="text-[#666]" />
                                                </div>
                                                <p className="text-xs text-[#999] font-medium mb-1">
                                                    No projects yet
                                                </p>
                                                <p className="text-xs text-[#666]">
                                                    Drag cards here or create new
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={!!projectToDelete}
                title="Delete Project?"
                message={`Are you sure you want to delete "${projectToDelete?.title}"? This action cannot be undone.`}
                onConfirm={() => {
                    if (projectToDelete) => {
                        onDeleteProject(projectToDelete.id);
                        setProjectToDelete(null);
                    }
                }}
                onCancel={() => setProjectToDelete(null)}
            />
        </div >
    );

export default ProjectBoard;
