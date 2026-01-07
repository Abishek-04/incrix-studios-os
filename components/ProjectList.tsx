import React, { useMemo, useState } from 'react';
import { Project, Stage, Status, Channel } from '../types';
import { Filter, CheckCircle, Clock, AlertTriangle, Calendar, Archive, ExternalLink, Globe } from 'lucide-react';

interface ProjectListProps {
    projects: Project[];
    channels: Channel[];
    onSelectProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, channels, onSelectProject }) => {
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'archived'>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    // Extract unique months from projects for the dropdown
    const availableMonths = useMemo(() => {
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

    const getChannelName = (project: Project) => {
        if (project.channelId) {
            const channel = channels.find(c => c.id === project.channelId);
            if (channel) return channel.name;
        }
        return project.platform; // Fallback
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
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
    }, [projects, filter, selectedMonth]);

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
                
                <div className="flex items-center space-x-3">
                    {/* Month Filter */}
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

                    {/* Status Filter */}
                    <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#2f2f2f]">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-[#333] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}>
                            All
                        </button>
                        <button 
                             onClick={() => setFilter('pending')}
                             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'pending' ? 'bg-[#333] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}>
                            Pending
                        </button>
                        <button 
                             onClick={() => setFilter('completed')}
                             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'completed' ? 'bg-[#333] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}>
                            Completed
                        </button>
                         <button 
                             onClick={() => setFilter('archived')}
                             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center space-x-2 ${filter === 'archived' ? 'bg-[#333] text-white shadow-sm' : 'text-[#666] hover:text-[#999]'}`}>
                            <span>Archived</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl overflow-hidden overflow-y-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#191919] z-10 shadow-sm">
                        <tr className="border-b border-[#2f2f2f]">
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider w-24">ID</th>
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider">Date</th>
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider">Title & Topic</th>
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider">Channel & Vertical</th>
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider">Assigned Team</th>
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider">Stage</th>
                            <th className="p-4 text-xs font-medium text-[#666] uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                     <tbody className="divide-y divide-[#2f2f2f]">
                        {filteredProjects.map(project => (
                             <tr 
                                key={project.id} 
                                onClick={() => onSelectProject(project)}
                                className={`group hover:bg-[#252525] transition-colors cursor-pointer ${project.archived ? 'opacity-60 bg-[#1a1a1a]' : ''}`}
                             >
                                <td className="p-4 text-xs text-[#555] font-mono">{project.id}</td>
                                <td className="p-4 text-xs text-[#888] font-mono">
                                    {new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-white text-sm flex items-center">
                                        {project.title}
                                        {project.archived && <Archive size={12} className="ml-2 text-[#666]" />}
                                    </div>
                                    <div className="text-xs text-[#666] flex items-center space-x-2">
                                        <span>{project.topic}</span>
                                        {project.publishedLink && (
                                            <a href={project.publishedLink} target="_blank" rel="noopener noreferrer" 
                                               onClick={(e) => e.stopPropagation()}
                                               className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 ml-2">
                                                <ExternalLink size={10} /> <span className="underline">Published</span>
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                     <div className="flex items-center space-x-2 mb-1">
                                        <Globe size={12} className="text-[#666]" />
                                        <span className="text-xs text-white font-medium">{getChannelName(project)}</span>
                                     </div>
                                     <span className="text-xs px-2 py-0.5 rounded border border-[#333] text-[#888] capitalize">{project.vertical}</span>
                                </td>
                                <td className="p-4">
                                     <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-900 border border-[#1e1e1e] flex items-center justify-center text-[10px] text-indigo-300 font-bold" title={`Creator: ${project.creator}`}>
                                            {project.creator.charAt(0)}
                                        </div>
                                        {project.editor !== 'Unassigned' && (
                                            <div className="w-6 h-6 rounded-full bg-[#333] border border-[#1e1e1e] flex items-center justify-center text-[10px] text-[#888] font-bold" title={`Editor: ${project.editor}`}>
                                                {project.editor.charAt(0)}
                                            </div>
                                        )}
                                     </div>
                                     <div className="text-[10px] text-[#555] mt-1">{project.creator} &bull; {project.editor}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-24 h-1.5 bg-[#333] rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${project.stage === Stage.Done ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                style={{ width: `${(Object.values(Stage).indexOf(project.stage) / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-[#ccc]">{project.stage}</span>
                                    </div>
                                </td>
                                <td className="p-4">
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
                                            <Clock size={12} className="mr-1.5" /> In Progress
                                        </span>
                                    )}
                                </td>
                             </tr>
                        ))}
                     </tbody>
                 </table>
                 {filteredProjects.length === 0 && (
                     <div className="p-12 text-center text-[#444]">
                         No projects found matching this filter.
                     </div>
                 )}
            </div>
        </div>
    );
};

export default ProjectList;