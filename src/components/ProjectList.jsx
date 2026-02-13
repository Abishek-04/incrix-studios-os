import React, { useMemo, useState, useEffect } from 'react';
import { Stage, Status, Priority, Platform, Vertical } from '@/types';
import { Filter, CheckCircle, Clock, AlertTriangle, Calendar, Archive, ExternalLink, Globe, Trash2, Film, LayoutGrid, List } from 'lucide-react';
import { Stage, Status, Priority, Platform, Vertical } from '@/types';

    channels: Channel[];
    searchQuery: string;

const ProjectList = ({ projects, channels, onSelectProject, searchQuery, onDeleteProject }) => {
    const [filter, setFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [sortBy, setSortBy] = useState('lastUpdated');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState() =>
        typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
    );

    // Auto-switch to cards on resize
    useEffect() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setViewMode('cards');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Extract unique months from projects for the dropdown
    const availableMonths = useMemo() => {
        const months = new Set<string>();
        projects.forEach(p => {
            const date = new Date(p.dueDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(key);
        });
        return Array.from(months).sort().reverse(); // Newest first
    }, [projects]);

    const formatMonth = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const getChannelName = (project) => {
        if (project.channelId) {
            const channel = channels.find(c => c.id === project.channelId);
            if (channel) return channel.name;
        }
        return project.platform; // Fallback
    };

    const sortedProjects = useMemo(() => {
        // First, filter the projects
        const filtered = projects.filter(p => {
            // Search Query Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = p.title.toLowerCase().includes(query) ||
                    p.topic.toLowerCase().includes(query) ||
                    p.creator.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Status/Archive Filter
            let matchesStatus = true;
            if (filter === 'archived') {
                matchesStatus = p.archived;
            } else {
                if (p.archived) return false; // Hide archived for other views
                if (filter === 'completed') matchesStatus = p.stage === Stage.Done;
                if (filter === 'pending') matchesStatus = p.stage !== Stage.Done;
            }

            // Date Filter
            let matchesDate = true;
            if (selectedMonth !== 'all') {
                const date = new Date(p.dueDate);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                matchesDate = key === selectedMonth;
            }

            return matchesStatus && matchesDate;
        });

        // Then, sort the filtered results
        return filtered.sort(a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'creator':
                    comparison = a.creator.localeCompare(b.creator);
                    break;
                case 'dueDate':
                    comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    break;
                case 'priority':
                    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                    comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                    break;
                case 'lastUpdated':
                    comparison = b.lastUpdated - a.lastUpdated;
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [projects, filter, selectedMonth, searchQuery, sortBy, sortOrder]);

    return (
        <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {filter === 'archived' ? 'Archived Content' : 'Content Registry'}
                    </h1>
                    <p className="text-[#666]">
                        {filter === 'archived' ? 'Recover or review past projects.' : 'Master list of all production assets and assignments.'}
                    </p>
                </div>

                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    {/* Month Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={14} className="text-[#999]" />
                        </div>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            aria-label="Filter by month"
                            className="bg-[#1e1e1e] border border-[#2f2f2f] text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-[#252525] transition-colors"
                        >
                            <option value="all">All Dates</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{formatMonth(month)}</option>
                            )}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-3 h-3 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            aria-label="Sort by"
                            className="bg-[#1e1e1e] border border-[#2f2f2f] text-sm text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-[#252525] transition-colors"
                        >
                            <option value="lastUpdated">Last Updated</option>
                            <option value="creator">Creator</option>
                            <option value="dueDate">Due Date</option>
                            <option value="priority">Priority</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-3 h-3 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Sort Order Toggle */}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-2 bg-[#1e1e1e] border border-[#2f2f2f] rounded-lg text-[#999] hover:text-white hover:bg-[#252525] transition-colors"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        aria-label={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>

                    {/* Status Filter */}
                    <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#2f2f2f]">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-[#333] text-white shadow-sm' : 'text-[#999] hover:text-white'}`}>
                            All
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${filter === 'pending' ? 'bg-[#333] text-white shadow-sm' : 'text-[#999] hover:text-white'}`}>
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${filter === 'completed' ? 'bg-[#333] text-white shadow-sm' : 'text-[#999] hover:text-white'}`}>
                            Done
                        </button>
                        <button
                            onClick={() => setFilter('archived')}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${filter === 'archived' ? 'bg-[#333] text-white shadow-sm' : 'text-[#999] hover:text-white'}`}>
                            Archived
                        </button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#2f2f2f]">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#333] text-white' : 'text-[#999] hover:text-white'}`}
                            aria-label="Table view"
                            title="Table view"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-[#333] text-white' : 'text-[#999] hover:text-white'}`}
                            aria-label="Card view"
                            title="Card view"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl overflow-hidden overflow-y-auto">
                {/* Table View */}
                {viewMode === 'table' && (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#191919] z-10 shadow-sm">
                            <tr className="border-b border-[#2f2f2f]">
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider w-24 hidden lg:table-cell">ID</th>
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider hidden sm:table-cell">Date</th>
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider">Title & Topic</th>
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider hidden md:table-cell">Channel</th>
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider hidden lg:table-cell">Team</th>
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider">Stage</th>
                                <th className="p-4 text-xs font-medium text-[#999] uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2f2f2f]">
                            {sortedProjects.map(project => (
                                <tr
                                    key={project.id}
                                    onClick={() => onSelectProject(project)}
                                    className={`group hover:bg-[#252525] transition-colors cursor-pointer ${project.archived ? 'opacity-60 bg-[#1a1a1a]' : ''}`}
                                >
                                    <td className="p-4 text-xs text-[#999] font-mono hidden lg:table-cell">{project.id}</td>
                                    <td className="p-4 text-xs text-[#999] font-mono hidden sm:table-cell">
                                        {new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-white text-sm flex items-center">
                                            {project.title}
                                            {project.archived && <Archive size={12} className="ml-2 text-[#999]" />}
                                        </div>
                                        <div className="text-xs text-[#999] flex items-center space-x-2">
                                            <span className="truncate max-w-[200px]">{project.topic}</span>
                                            {project.publishedLink && (
                                                <a href={project.publishedLink} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 ml-2 flex-shrink-0">
                                                    <ExternalLink size={10} /> <span className="underline">Published</span>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Globe size={12} className="text-[#999]" />
                                            <span className="text-xs text-white font-medium">{getChannelName(project)}</span>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded border border-[#333] text-[#999] capitalize">{project.vertical}</span>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-900 border border-[#1e1e1e] flex items-center justify-center text-[10px] text-indigo-300 font-bold" title={`Creator: ${project.creator}`}>
                                                {project.creator.charAt(0)}
                                            </div>
                                            {project.editor !== 'Unassigned' && (
                                                <div className="w-6 h-6 rounded-full bg-[#333] border border-[#1e1e1e] flex items-center justify-center text-[10px] text-[#999] font-bold" title={`Editor: ${project.editor}`}>
                                                    {project.editor.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-[#999] mt-1">{project.creator} &bull; {project.editor}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 sm:w-24 h-1.5 bg-[#333] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${project.stage === Stage.Done ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${(Object.values(Stage).indexOf(project.stage) / 5) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-[#ccc]">{project.stage}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-between">
                                            {project.stage === Stage.Done ? (
                                                <span className="flex items-center text-xs text-emerald-500 font-medium">
                                                    <CheckCircle size={12} className="mr-1.5" /> Published
                                                </span>
                                            ) : project.status === Status.Blocked ? (
                                                <span className="flex items-center text-xs text-rose-500 font-medium">
                                                    <AlertTriangle size={12} className="mr-1.5" /> Blocked
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-xs text-indigo-400 font-medium">
                                                    <Clock size={12} className="mr-1.5" /> Active
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteProject(project.id);
                                                }}
                                                className="ml-4 p-1.5 text-[#999] hover:text-rose-500 hover:bg-[#2a2a2a] rounded opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete Project"
                                                aria-label={`Delete ${project.title}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Card View (mobile-friendly) */}
                {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                        {sortedProjects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onSelectProject(project)}
                                className={`bg-[#191919] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#444] hover:bg-[#222] transition-all cursor-pointer group ${project.archived ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <Globe size={12} className="text-[#999]" />
                                        <span className="text-[10px] text-[#999] font-medium uppercase">{getChannelName(project)}</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                        project.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
                                        project.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                        {project.priority}
                                    </div>
                                </div>

                                <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                                    {project.title}
                                    {project.archived && <Archive size={12} className="inline ml-2 text-[#999]" />}
                                </h4>
                                <p className="text-xs text-[#999] mb-3 truncate">{project.topic}</p>

                                {/* Stage Progress */}
                                <div className="flex items-center space-x-2 mb-3">
                                    <div className="flex-1 h-1.5 bg-[#333] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${project.stage === Stage.Done ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${(Object.values(Stage).indexOf(project.stage) / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-[#ccc] w-16 text-right">{project.stage}</span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex -space-x-1.5">
                                            <div className="w-5 h-5 rounded-full bg-indigo-900 border border-[#191919] flex items-center justify-center text-[9px] text-white font-bold" title={project.creator}>
                                                {project.creator.charAt(0)}
                                            </div>
                                            {project.editor !== 'Unassigned' && (
                                                <div className="w-5 h-5 rounded-full bg-[#333] border border-[#191919] flex items-center justify-center text-[9px] text-white font-bold" title={project.editor}>
                                                    {project.editor.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-[#999]">{project.creator}</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {project.stage === Stage.Done ? (
                                            <span className="flex items-center text-[10px] text-emerald-500 font-medium">
                                                <CheckCircle size={10} className="mr-1" /> Done
                                            </span>
                                        ) : project.status === Status.Blocked ? (
                                            <span className="flex items-center text-[10px] text-rose-500 font-medium">
                                                <AlertTriangle size={10} className="mr-1" /> Blocked
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-[#999]">
                                                {new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteProject(project.id);
                                            }}
                                            className="p-1 text-[#999] hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete"
                                            aria-label={`Delete ${project.title}`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {sortedProjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-[#999]">
                        <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
                            <Film size={32} />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-1">No projects found</h3>
                        <p className="text-sm max-w-sm mx-auto mb-6">
                            {filter !== 'all' || searchQuery
                                ? "Try adjusting your filters or search terms."
                                : "It looks like you haven't created any projects yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;