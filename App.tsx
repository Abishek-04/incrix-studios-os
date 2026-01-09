import React, { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, Settings, Film, Users, Video, BarChart2, Radio, Smartphone, Type, MessageSquare, Bell, FileText, CheckSquare, Clock, LogOut, Search } from 'lucide-react';
import NotificationPanel from './components/NotificationPanel';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import CalendarView from './components/CalendarView';
import ManageChannels from './components/ManageChannels';
import TeamManagement from './components/TeamManagement';
import ProjectBoard from './components/ProjectBoard';
import Login from './components/Login';
import ProjectModal from './components/ProjectModal';
import { Project, User, Channel, Role, Platform, Vertical, Stage, Status, Priority, Notification } from './types';
import { fetchState, saveState } from './services/api';

// Initial data (keep as fallback)
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
        id: 'PRJ-TEST-1',
        title: 'Incrix OS Demo Video',
        topic: 'Showcase features',
        vertical: Vertical.Software,
        platform: Platform.YouTube,
        role: 'manager',
        creator: 'Abishek',
        editor: 'Mike T.',
        stage: Stage.Scripting,
        status: Status.InProgress,
        priority: Priority.High,
        lastUpdated: Date.now(),
        dueDate: Date.now() + 86400000 * 7,
        durationMinutes: 15,
        script: '',
        tasks: [],
        technicalNotes: '',
        comments: [],
        hasMographNeeds: false,
        archived: false
    }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
    { id: 'n1', title: 'Welcome to Incrix OS', message: 'System updated successfully to version 2.0', type: 'success', timestamp: Date.now() - 100000, read: false },
    { id: 'n2', title: 'Pending Review', message: 'Project "Incrix Tech" needs approval', type: 'warning', timestamp: Date.now() - 3600000, read: false }
];

function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);

    // Notification State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
    const [currentRole, setCurrentRole] = useState<Role>('manager'); // Default fallback

    // Modal State
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        const loadState = async () => {
            const backendState = await fetchState();
            if (backendState) {
                if (backendState.users && backendState.users.length > 0) setUsers(backendState.users);
                if (backendState.channels && backendState.channels.length > 0) setChannels(backendState.channels);
                if (backendState.projects && backendState.projects.length > 0) setProjects(backendState.projects);

                if ((!backendState.projects || backendState.projects.length === 0) && INITIAL_PROJECTS.length > 0) {
                    await saveState({
                        users: INITIAL_USERS,
                        channels: INITIAL_CHANNELS,
                        projects: INITIAL_PROJECTS
                    });
                }
            }
        };
        if (isAuthenticated) {
            loadState();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && (projects.length > 0 || users.length > 0)) {
            saveState({ projects, users, channels });
        }
    }, [projects, users, channels, isAuthenticated]);

    useEffect(() => {
        if (currentUser) {
            setCurrentRole(currentUser.role);
            if (currentUser.role === 'editor') setActiveView('projects');
        }
    }, [currentUser]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(undefined);
    };

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleCreateProject = (newProject: Project) => {
        setProjects([newProject, ...projects]);
    };

    const handleUpdateProject = (updatedProject: Project) => {
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        // Update selected project as well if it's the one being edited
        if (selectedProject && selectedProject.id === updatedProject.id) {
            setSelectedProject(updatedProject);
        }
    };

    const handleUpdateUsers = (updatedUsers: User[]) => {
        setUsers(updatedUsers);
    };

    const handleUpdateChannels = (updatedChannels: Channel[]) => {
        setChannels(updatedChannels);
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-[#121212] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col justify-between hidden md:flex">
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-[#1f1f1f]">
                        <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg mr-3"></div>
                        <span className="font-bold text-white tracking-tight">Incrix Studios</span>
                    </div>

                    <div className="p-4">
                        <div className="text-xs font-bold text-[#444] uppercase tracking-wider mb-3 px-4">Menu</div>
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveView('dashboard')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'dashboard' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                            >
                                <LayoutDashboard size={18} className={activeView === 'dashboard' ? 'text-indigo-400' : ''} />
                                <span>Dashboard</span>
                            </button>
                            <button
                                onClick={() => setActiveView('projects')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'projects' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                            >
                                <Film size={18} className={activeView === 'projects' ? 'text-indigo-400' : ''} />
                                <span>Projects</span>
                                {projects.filter(p => p.status === 'In Progress').length > 0 && (
                                    <span className="ml-auto text-[10px] font-bold bg-[#252525] text-[#ccc] py-0.5 px-2 rounded-full">{projects.filter(p => p.status === 'In Progress').length}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveView('board')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'board' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                            >
                                <CheckSquare size={18} className={activeView === 'board' ? 'text-indigo-400' : ''} />
                                <span>Board</span>
                            </button>
                            <button
                                onClick={() => setActiveView('calendar')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'calendar' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                            >
                                <Calendar size={18} className={activeView === 'calendar' ? 'text-indigo-400' : ''} />
                                <span>Calendar</span>
                            </button>

                            {currentRole === 'manager' && (
                                <>
                                    <div className="text-xs font-bold text-[#444] uppercase tracking-wider mt-6 mb-3 px-4">Admin</div>
                                    <button
                                        onClick={() => setActiveView('team')}
                                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'team' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                                    >
                                        <Users size={18} className={activeView === 'team' ? 'text-indigo-400' : ''} />
                                        <span>Team</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveView('channels')}
                                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'channels' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                                    >
                                        <Radio size={18} className={activeView === 'channels' ? 'text-indigo-400' : ''} />
                                        <span>Channels</span>
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                </div>

                <div className="p-4 border-t border-[#1f1f1f]">
                    <div className="flex items-center p-2 rounded-xl bg-[#151515] border border-[#222]">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${currentUser?.avatarColor || 'bg-gray-600'} text-white`}>
                            {currentUser?.name.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">{currentUser?.name || 'User'}</div>
                            <div className="text-xs text-[#666] capitalize">{currentUser?.role || 'Guest'}</div>
                        </div>
                        <div className="flex items-center ml-auto space-x-1">
                            <button className="p-1.5 text-[#666] hover:text-white rounded-lg hover:bg-[#252525]">
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-[#666] hover:text-rose-500 rounded-lg hover:bg-[#252525/50]"
                                title="Logout"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
                <header className="h-16 flex items-center justify-between px-8 border-b border-[#1f1f1f] bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#888]">
                        {activeView === 'dashboard' && 'Dashboard'}
                        {activeView === 'projects' && 'Projects'}
                        {activeView === 'board' && 'Board View'}
                        {activeView === 'calendar' && 'Content Calendar'}
                        {activeView === 'team' && 'Team Management'}
                        {activeView === 'channels' && 'Channel Credentials'}
                    </h2>

                    {/* Search Bar */}
                    <div className="hidden lg:flex items-center bg-[#151515] border border-[#222] rounded-xl px-3 py-1.5 w-64 mx-8 focus-within:border-[#333] transition-colors">
                        <Search size={14} className="text-[#555]" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-[#555]"
                        />
                    </div>


                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 transition-colors relative ${showNotifications ? 'text-white bg-[#1f1f1f] rounded-lg' : 'text-[#666] hover:text-white'}`}
                            >
                                <Bell size={20} />
                                {notifications.some(n => !n.read) && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0d0d0d]"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <NotificationPanel
                                    notifications={notifications}
                                    onClose={() => setShowNotifications(false)}
                                    onMarkAllRead={handleMarkAllRead}
                                />
                            )}
                        </div>
                        <div className="h-4 w-[1px] bg-[#333]"></div>
                        <div className="flex items-center space-x-2 text-sm text-[#666]">
                            <Clock size={14} />
                            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    {activeView === 'dashboard' && <Dashboard projects={projects} currentUser={currentUser || INITIAL_USERS[0]} users={users} />}
                    {activeView === 'projects' && (
                        <ProjectList
                            projects={projects}
                            channels={channels}
                            onSelectProject={handleSelectProject}
                        />
                    )}
                    {activeView === 'board' && (
                        <ProjectBoard
                            projects={projects}
                            channels={channels}
                            onSelectProject={handleSelectProject}
                            onCreateProject={handleCreateProject}
                            onUpdateProject={handleUpdateProject}
                        />
                    )}
                    {activeView === 'calendar' && (
                        <CalendarView
                            projects={projects}
                            onSelectProject={handleSelectProject}
                        />
                    )}
                    {activeView === 'team' && <TeamManagement users={users} onUpdateUsers={handleUpdateUsers} />}
                    {activeView === 'channels' && <ManageChannels channels={channels} onUpdateChannels={handleUpdateChannels} />}
                </main>
            </div>

            {/* Project Detail Modal */}
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
}

export default App;