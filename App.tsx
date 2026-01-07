import React, { useState, useEffect, useMemo } from 'react';
import { fetchState, saveState } from './services/api';
import { Project, Role, Stage, Status, Platform, Vertical, Priority, User, Channel } from './types';
import Dashboard from './components/Dashboard';
import ProjectModal from './components/ProjectModal';
import TeamManagement from './components/TeamManagement';
import ManageChannels from './components/ManageChannels';
import ProjectList from './components/ProjectList';
import CalendarView from './components/CalendarView';
import { LayoutGrid, ListTodo, Users, Plus, Search, PlayCircle, Lock, MonitorPlay, FileVideo, Settings, LogOut, ChevronDown, ChevronLeft, ChevronRight, Library, Tv, Calendar } from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_USERS: User[] = [
    { id: 'usr1', name: 'Alex D.', role: 'manager', email: 'alex@incrix.com', avatarColor: 'bg-indigo-600', active: true, phoneNumber: '+1234567890', notifyViaWhatsapp: true },
    { id: 'usr2', name: 'Abishek', role: 'creator', email: 'abishek@incrix.com', avatarColor: 'bg-purple-600', niche: 'Tech', active: true, quota: { longVideo: 2, shortVideo: 4, period: 'weekly' } },
    { id: 'usr3', name: 'Jegannath', role: 'creator', email: 'jegan@incrix.com', avatarColor: 'bg-emerald-600', niche: 'Coding', active: true, quota: { longVideo: 1, shortVideo: 3, period: 'weekly' } },
    { id: 'usr4', name: 'Johnson', role: 'creator', email: 'johnson@incrix.com', avatarColor: 'bg-amber-600', niche: 'Vlog', active: true, quota: { longVideo: 1, shortVideo: 5, period: 'weekly' } },
    { id: 'usr5', name: 'Manisha', role: 'creator', email: 'manisha@incrix.com', avatarColor: 'bg-pink-600', niche: 'Lifestyle', active: true, quota: { longVideo: 0, shortVideo: 7, period: 'weekly' } },
    { id: 'usr6', name: 'Mike T.', role: 'editor', email: 'mike@incrix.com', avatarColor: 'bg-blue-600', active: true },
];

const INITIAL_CHANNELS: Channel[] = [
    { id: 'ch1', platform: Platform.YouTube, name: 'Incrix Tech', link: 'https://youtube.com/@incrixtech', email: 'tech@incrix.com', credentials: 'Password123!' },
    { id: 'ch2', platform: Platform.Instagram, name: 'Incrix Life', link: 'https://instagram.com/incrixlife', email: 'social@incrix.com', credentials: 'SecurePassword!' },
    { id: 'ch3', platform: Platform.WhatsApp, name: 'Core Team', link: 'https://chat.whatsapp.com/invite/12345', email: 'Incrix Bot', credentials: 'API_KEY_123' }
];

const INITIAL_PROJECTS: Project[] = [
    {
        id: 'VID-001',
        title: 'Q3 Product Update',
        topic: 'New Features Walkthrough',
        vertical: Vertical.Software,
        platform: Platform.YouTube,
        channelId: 'ch1',
        role: 'creator',
        creator: 'Abishek',
        editor: 'Mike T.',
        stage: Stage.Scripting,
        status: Status.InProgress,
        priority: Priority.High,
        lastUpdated: Date.now(),
        dueDate: Date.now() + 86400000,
        durationMinutes: 0,
        script: '',
        tasks: [],
        technicalNotes: '',
        comments: [],
        hasMographNeeds: false,
        archived: false
    },
    {
        id: 'VID-002',
        title: 'Behind the Scenes',
        topic: 'Office Culture',
        vertical: Vertical.Branding,
        platform: Platform.Instagram,
        channelId: 'ch2',
        role: 'editor',
        creator: 'Manisha',
        editor: 'Mike T.',
        stage: Stage.Editing,
        status: Status.InProgress,
        priority: Priority.Medium,
        lastUpdated: Date.now() - (50 * 60 * 60 * 1000), // Stuck
        dueDate: Date.now() + 172800000,
        durationMinutes: 0,
        script: '',
        tasks: [],
        technicalNotes: '',
        comments: [],
        hasMographNeeds: true,
        archived: false
    }
];

type ViewState = 'dashboard' | 'kanban' | 'team' | 'content' | 'my-library' | 'manage-channels' | 'calendar';

const App = () => {
    // --- STATE ---
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

    // Context State (Simulating Login)
    const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default to Manager Alex
    const [currentRole, setCurrentRole] = useState<Role>('manager'); // Derived from user usually, but kept purely flexible for debug
    const [activeView, setActiveView] = useState<ViewState>('dashboard');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVertical, setSelectedVertical] = useState<Vertical | 'all'>('all');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // --- API INTEGRATION ---
    useEffect(() => {
        const loadState = async () => {
            const backendState = await fetchState();
            if (backendState) {
                // Unify logic: If DB is empty, seeding might happen on first save or explicit seed check
                // For now, if DB has data, use it. If not, we keep the INITIAL constants.
                if (backendState.users && backendState.users.length > 0) setUsers(backendState.users);
                if (backendState.channels && backendState.channels.length > 0) setChannels(backendState.channels);
                if (backendState.projects && backendState.projects.length > 0) setProjects(backendState.projects);

                // If empty (fresh DB), we could auto-save our INITIAL_MOCKS to seed it
                if ((!backendState.projects || backendState.projects.length === 0) && INITIAL_PROJECTS.length > 0) {
                    await saveState({
                        users: INITIAL_USERS,
                        channels: INITIAL_CHANNELS,
                        projects: INITIAL_PROJECTS
                    });
                }
            }
        };
        loadState();
    }, []);

    // Persistence: Save to Backend instead of LocalStorage
    // We debounce or save on critical changes. For simplicity in this OS, we iterate simple saves.
    useEffect(() => {
        // Avoid saving empty states if initial load hasn't happened or failure
        if (projects.length > 0 || users.length > 0) {
            saveState({ projects, users, channels });
        }
    }, [projects, users, channels]);

    // Sync Role when User Changes (Simulate Login)
    useEffect(() => {
        if (currentUser) {
            setCurrentRole(currentUser.role);
            setActiveView('dashboard'); // Reset view on user switch
        }
    }, [currentUser]);

    // --- ACTIONS ---
    const handleUpdateProject = (updated: Project) => {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        if (selectedProject?.id === updated.id) {
            setSelectedProject(updated);
        }
    };

    const advanceStage = (project: Project) => {
        const stages = Object.values(Stage);
        const currentIndex = stages.indexOf(project.stage);

        if (project.stage === Stage.Review && !project.reviewLink) {
            handleUpdateProject({ ...project, status: Status.Blocked, lastUpdated: Date.now() });
            alert("Cannot complete review without a final link.");
            return;
        }

        if (currentIndex < stages.length - 1) {
            const nextStage = stages[currentIndex + 1];
            handleUpdateProject({
                ...project,
                stage: nextStage,
                status: Status.InProgress,
                lastUpdated: Date.now(),
                durationMinutes: nextStage === Stage.Done ? 15 : project.durationMinutes
            });
        }
    };

    const regressStage = (project: Project) => {
        const stages = Object.values(Stage);
        const currentIndex = stages.indexOf(project.stage);

        if (currentIndex > 0) {
            const prevStage = stages[currentIndex - 1];
            handleUpdateProject({
                ...project,
                stage: prevStage,
                status: Status.InProgress,
                lastUpdated: Date.now()
            });
        }
    };

    const createNewProject = () => {
        // Exclude notification channels from being the "default content channel"
        const contentChannels = channels.filter(c => c.platform !== Platform.WhatsApp && c.platform !== Platform.Email);
        const defaultChannel = contentChannels.length > 0 ? contentChannels[0] : channels[0];

        const newProject: Project = {
            id: `VID-${Math.floor(Math.random() * 1000)}`,
            title: 'New Project',
            topic: '',
            vertical: Vertical.Software,
            platform: defaultChannel ? defaultChannel.platform : Platform.LinkedIn,
            channelId: defaultChannel ? defaultChannel.id : undefined,
            role: 'creator',
            creator: currentUser.role === 'creator' ? currentUser.name : 'Unassigned',
            editor: 'Unassigned',
            stage: Stage.Backlog,
            status: Status.NotStarted,
            priority: Priority.Medium,
            lastUpdated: Date.now(),
            dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
            durationMinutes: 0,
            script: '',
            tasks: [],
            technicalNotes: '',
            comments: [],
            hasMographNeeds: false,
            archived: false
        };
        setProjects([...projects, newProject]);
        setSelectedProject(newProject);
    };

    // --- FILTERING ---
    // This memo is primarily for the Kanban Board and Dashboard stats where archiving matters.
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            // Global Search
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.creator.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesVertical = selectedVertical === 'all' || p.vertical === selectedVertical;

            // Role-Based Visibility for Kanban
            let matchesRole = true;
            if (activeView === 'kanban') {
                if (currentRole === 'creator') matchesRole = p.creator === currentUser.name;
                if (currentRole === 'editor') matchesRole = p.editor === currentUser.name;
            }

            // Hide archived from Kanban
            const matchesArchive = activeView === 'kanban' ? !p.archived : true;

            return matchesSearch && matchesVertical && matchesRole && matchesArchive;
        });
    }, [projects, searchQuery, selectedVertical, currentRole, currentUser, activeView]);


    // --- RENDER HELPERS ---
    const renderKanbanColumn = (stage: Stage) => {
        const columnProjects = filteredProjects.filter(p => p.stage === stage);

        return (
            <div className="flex-shrink-0 w-80 bg-[#121212] flex flex-col h-full border-r border-[#1f1f1f]">
                <div className="p-4 flex items-center justify-between border-b border-[#1f1f1f] bg-[#161616]">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#888] uppercase tracking-wider">{stage}</span>
                        <span className="bg-[#222] text-[#666] text-[10px] px-1.5 py-0.5 rounded-md font-mono">{columnProjects.length}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {columnProjects.map(project => {
                        const isStuck = (Date.now() - project.lastUpdated) > (48 * 60 * 60 * 1000) && project.status !== Status.Done;
                        const isMoGraphHighlighted = currentRole === 'mograph' && project.hasMographNeeds;

                        return (
                            <div
                                key={project.id}
                                onClick={() => setSelectedProject(project)}
                                className={`group relative bg-[#1e1e1e] border rounded-xl p-4 cursor-pointer hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-lg
                  ${isStuck ? 'border-rose-500/40' : isMoGraphHighlighted ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-[#2f2f2f] hover:border-[#444]'}
                 `}
                            >
                                {isStuck && (
                                    <div className="absolute top-3 right-3 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide
                        ${project.priority === Priority.High ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' : 'bg-[#252525] text-[#666] border-transparent'}
                    `}>
                                        {project.priority}
                                    </span>
                                    <span className="text-[10px] text-[#444] font-mono">{project.id}</span>
                                </div>

                                <h4 className="text-sm font-medium text-white leading-tight mb-3">{project.title}</h4>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-900 border border-[#1e1e1e] flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                                            {project.creator.charAt(0)}
                                        </div>
                                        {project.editor !== 'Unassigned' && (
                                            <div className="w-6 h-6 rounded-full bg-[#333] border border-[#1e1e1e] flex items-center justify-center text-[10px] text-[#888] font-bold">
                                                {project.editor.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Move Back */}
                                        {Object.values(Stage).indexOf(project.stage) > 0 && project.status !== Status.Done && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); regressStage(project); }}
                                                className="p-1.5 bg-[#252525] hover:bg-[#333] rounded text-[#888] hover:text-white"
                                                title="Demote / Rework"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                        )}

                                        {/* Move Forward */}
                                        {project.status !== Status.Done && project.status !== Status.Blocked && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); advanceStage(project); }}
                                                className="p-1.5 bg-[#252525] hover:bg-[#333] rounded text-[#888] hover:text-emerald-400"
                                                title="Advance Stage"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        )}
                                        {project.status === Status.Blocked && <Lock size={14} className="text-rose-500" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#0d0d0d] text-slate-300 font-sans selection:bg-indigo-500/30">

            {/* --- SIDEBAR --- */}
            <aside className="w-64 border-r border-[#1f1f1f] bg-[#121212] flex flex-col justify-between hidden md:flex z-20">
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-[#1f1f1f]">
                        <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg mr-3"></div>
                        <span className="font-bold text-white tracking-tight">Incrix OS</span>
                    </div>

                    <div className="p-4">
                        <div className="text-xs font-mono text-[#555] uppercase tracking-wider mb-2 px-2">Menu</div>

                        {/* Manager Menus */}
                        {currentRole === 'manager' && (
                            <div className="space-y-1">
                                <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'dashboard' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <LayoutGrid size={16} /> <span>Overview</span>
                                </button>
                                <button onClick={() => setActiveView('content')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'content' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <FileVideo size={16} /> <span>All Content</span>
                                </button>
                                <button onClick={() => setActiveView('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'calendar' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <Calendar size={16} /> <span>Editorial Cal.</span>
                                </button>
                                <button onClick={() => setActiveView('team')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'team' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <Users size={16} /> <span>Team</span>
                                </button>
                                <button onClick={() => setActiveView('manage-channels')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'manage-channels' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <Tv size={16} /> <span>Channels</span>
                                </button>
                            </div>
                        )}

                        {/* Creator Menus */}
                        {currentRole === 'creator' && (
                            <div className="space-y-1">
                                <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'dashboard' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <LayoutGrid size={16} /> <span>My Dashboard</span>
                                </button>
                                <button onClick={() => setActiveView('kanban')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'kanban' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <ListTodo size={16} /> <span>My Board</span>
                                </button>
                                <button onClick={() => setActiveView('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'calendar' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <Calendar size={16} /> <span>Schedule</span>
                                </button>
                                <button onClick={() => setActiveView('my-library')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'my-library' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <Library size={16} /> <span>My Library</span>
                                </button>
                            </div>
                        )}

                        {/* Editor/MoGraph Menus */}
                        {(currentRole === 'editor' || currentRole === 'mograph') && (
                            <div className="space-y-1">
                                <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'dashboard' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <LayoutGrid size={16} /> <span>My Dashboard</span>
                                </button>
                                <button onClick={() => setActiveView('kanban')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'kanban' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <MonitorPlay size={16} /> <span>Work Queue</span>
                                </button>
                                <button onClick={() => setActiveView('my-library')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'my-library' ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-[#888]'}`}>
                                    <Library size={16} /> <span>My Library</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom User Card */}
                <div className="p-4 border-t border-[#1f1f1f]">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-[#191919] rounded-xl border border-[#2a2a2a]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${currentUser.avatarColor}`}>
                            {currentUser.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm text-white font-medium truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-[#666] capitalize truncate">{currentUser.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-w-0">

                {/* Top Bar with Debug Switcher */}
                <header className="h-16 border-b border-[#1f1f1f] bg-[#121212] flex items-center justify-between px-6 z-20">
                    <div className="flex items-center flex-1 space-x-4">
                        <div className="flex items-center w-full max-w-md bg-[#191919] border border-[#2f2f2f] rounded-lg px-3 py-1.5 focus-within:border-[#444] transition-colors">
                            <Search size={16} className="text-[#555]" />
                            <input
                                type="text"
                                placeholder="Search workspace..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm px-3 text-white placeholder-[#555]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 ml-4">
                        {/* DEBUG CONTEXT SWITCHER */}
                        <div className="flex items-center space-x-2 bg-[#191919] px-2 py-1 rounded-lg border border-[#2a2a2a]">
                            <span className="text-[10px] font-mono text-[#555] uppercase px-2">Simulate:</span>
                            <select
                                className="bg-transparent text-xs text-[#888] focus:outline-none cursor-pointer hover:text-white"
                                value={currentUser.id}
                                onChange={(e) => {
                                    const user = users.find(u => u.id === e.target.value);
                                    if (user) setCurrentUser(user);
                                }}
                            >
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-[#2f2f2f]"></div>

                        <select
                            className="bg-[#191919] border border-[#2f2f2f] text-sm text-[#888] rounded-lg px-3 py-1.5 focus:outline-none hover:border-[#444]"
                            value={selectedVertical}
                            onChange={(e) => setSelectedVertical(e.target.value as Vertical | 'all')}
                        >
                            <option value="all">All Verticals</option>
                            {Object.values(Vertical).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>

                        <button
                            onClick={createNewProject}
                            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20">
                            <Plus size={16} /> <span>New</span>
                        </button>
                    </div>
                </header>

                {/* Dynamic View Content */}
                <div className="flex-1 overflow-hidden relative bg-[#0d0d0d]">

                    {activeView === 'dashboard' && (
                        <div className="h-full overflow-y-auto">
                            <Dashboard projects={projects.filter(p => !p.archived)} currentUser={currentUser} users={users} />
                        </div>
                    )}

                    {activeView === 'content' && (
                        <ProjectList
                            projects={projects} // Manager sees all, including archived if filtered in component
                            channels={channels}
                            onSelectProject={setSelectedProject}
                        />
                    )}

                    {activeView === 'my-library' && (
                        <ProjectList
                            projects={projects.filter(p => p.creator === currentUser.name || p.editor === currentUser.name)}
                            channels={channels}
                            onSelectProject={setSelectedProject}
                        />
                    )}

                    {activeView === 'calendar' && (
                        <CalendarView
                            projects={filteredProjects}
                            onSelectProject={setSelectedProject}
                        />
                    )}

                    {activeView === 'team' && (
                        <div className="h-full overflow-y-auto">
                            <TeamManagement users={users} onUpdateUsers={setUsers} />
                        </div>
                    )}

                    {activeView === 'manage-channels' && (
                        <div className="h-full overflow-y-auto">
                            <ManageChannels channels={channels} onUpdateChannels={setChannels} />
                        </div>
                    )}

                    {activeView === 'kanban' && (
                        <div className="h-full overflow-x-auto flex divide-x divide-[#1f1f1f]">
                            {Object.values(Stage).map(stage => (
                                <div key={stage} className="h-full">
                                    {renderKanbanColumn(stage)}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </main>

            {/* Detail Modal */}
            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    currentUserRole={currentRole}
                    channels={channels}
                    onClose={() => setSelectedProject(null)}
                    onUpdate={handleUpdateProject}
                />
            )}

        </div>
    );
};

export default App;