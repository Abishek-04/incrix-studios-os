import React, { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, Settings, Film, Users, Video, BarChart2, Radio, Smartphone, Type, MessageSquare, Bell, FileText, CheckSquare, Clock, LogOut, Search, MoreHorizontal } from 'lucide-react';
import NotificationPanel from './components/NotificationPanel';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import CalendarView from './components/CalendarView';
import ManageChannels from './components/ManageChannels';
import TeamManagement from './components/TeamManagement';
import ProjectBoard from './components/ProjectBoard';
import Login from './components/Login';
import ProjectModal from './components/ProjectModal';
import SettingsModal from './components/SettingsModal';
import DailyTasks from './components/DailyTasks';
import { Project, User, Channel, Role, Platform, Vertical, Stage, Status, Priority, Notification, DailyTask } from './types';
import { fetchState, saveState } from './services/api';

// Initial data (keep as fallback)
const INITIAL_USERS: User[] = [];
const INITIAL_CHANNELS: Channel[] = [];
const INITIAL_PROJECTS: Project[] = [];
const INITIAL_NOTIFICATIONS: Notification[] = [];

function App() {
    const [activeView, setActiveView] = useState(() => localStorage.getItem('activeView') || 'dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);

    // Notification State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('auth_user');
    });
    const [currentUser, setCurrentUser] = useState<User | undefined>(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            try {
                // Ensure parsed user has valid role/data structure if needed
                return JSON.parse(savedUser);
            } catch (e) {
                console.error("Failed to parse auth user", e);
                return undefined;
            }
        }
        return undefined;
    });
    const [currentRole, setCurrentRole] = useState<Role>('manager'); // Default fallback

    // Modal State
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Daily Tasks State
    const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Auth state initialized lazily to prevent flash

    useEffect(() => {
        const loadState = async () => {
            try {
                const backendState = await fetchState();
                if (backendState) {
                    // Only set state if we have valid arrays, otherwise default to empty
                    setUsers(backendState.users || []);
                    setChannels(backendState.channels || []);
                    setProjects(backendState.projects || []);
                    setDailyTasks(backendState.dailyTasks || []);
                }
            } catch (error) {
                console.error("Failed to load backend state", error);
            }
        };
        if (isAuthenticated) {
            loadState();
        }
    }, [isAuthenticated]);

    // Debounced Save State
    useEffect(() => {
        if (!isAuthenticated) return;
        // Optimization: Don't save if state is completely empty to avoid overwriting DB with initial empty state on first load
        // But do allow saving if we have at least user data (implying we are logged in and have fetched or created data)
        if (users.length === 0 && projects.length === 0 && channels.length === 0) return;

        const timeoutId = setTimeout(() => {
            saveState({ projects, users, channels, dailyTasks });
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [projects, users, channels, dailyTasks, isAuthenticated]);

    // Persist Active View
    useEffect(() => {
        if (activeView) {
            localStorage.setItem('activeView', activeView);
        }
    }, [activeView]);

    useEffect(() => {
        if (currentUser) {
            setCurrentRole(currentUser.role);
        }
    }, [currentUser]);

    const handleLogin = (user: User) => {
        localStorage.setItem('auth_user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        // Set default view based on role
        if (user.role === 'editor') {
            setActiveView('projects');
        } else {
            setActiveView('dashboard');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('activeView');
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

    const handleDeleteProject = (projectId: string) => {
        setProjects(projects.filter(p => p.id !== projectId));
        if (selectedProject && selectedProject.id === projectId) {
            setSelectedProject(null);
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

    // Filter projects for children that might not handle it themselves (or pass query down)
    // We pass the full list + query to children so they can filter themselves (better for boards/lists with internal filters too)

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
                            <button
                                onClick={() => setActiveView('daily')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === 'daily' ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                            >
                                <CheckSquare size={18} className={activeView === 'daily' ? 'text-indigo-400' : ''} />
                                <span>Daily Tasks</span>
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
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-1.5 text-[#666] hover:text-white rounded-lg hover:bg-[#252525]"
                                title="Settings"
                            >
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
                        {activeView === 'daily' && 'Daily Tasks'}
                    </h2>

                    {/* Search Bar */}
                    <div className="hidden lg:flex items-center bg-[#151515] border border-[#222] rounded-xl px-3 py-1.5 w-64 mx-8 focus-within:border-[#333] transition-colors">
                        <Search size={14} className="text-[#555]" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-[#555]"
                        />
                    </div>


                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-[#666] hover:text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
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

                <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
                    {activeView === 'dashboard' && <Dashboard projects={projects} currentUser={currentUser || INITIAL_USERS[0]} users={users} onSelectProject={handleSelectProject} />}
                    {activeView === 'projects' && (
                        <ProjectList
                            projects={projects}
                            channels={channels}
                            onSelectProject={handleSelectProject}
                            searchQuery={searchQuery}
                            onDeleteProject={handleDeleteProject}
                        />
                    )}
                    {activeView === 'board' && (
                        <ProjectBoard
                            projects={projects}
                            channels={channels}
                            onSelectProject={handleSelectProject}
                            onCreateProject={handleCreateProject}
                            onUpdateProject={handleUpdateProject}
                            searchQuery={searchQuery}
                            onDeleteProject={handleDeleteProject}
                        />
                    )}
                    {activeView === 'calendar' && (
                        <CalendarView
                            projects={projects}
                            onSelectProject={handleSelectProject}
                        />
                    )}
                    {activeView === 'daily' && (
                        <DailyTasks
                            tasks={dailyTasks}
                            users={users}
                            currentUser={currentUser!}
                            onUpdateTasks={setDailyTasks}
                        />
                    )}
                    {activeView === 'team' && <TeamManagement users={users} projects={projects} onUpdateUsers={handleUpdateUsers} />}
                    {activeView === 'channels' && <ManageChannels channels={channels} users={users} onUpdateChannels={handleUpdateChannels} />}
                </main>
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    currentUserRole={currentRole}
                    channels={channels}
                    users={users} // Pass users for assignment features later
                    onClose={() => setSelectedProject(null)}
                    onUpdate={handleUpdateProject}
                    onCreate={handleCreateProject}
                    onDelete={handleDeleteProject}
                />
            )}

            {isSettingsOpen && currentUser && (
                <SettingsModal
                    user={currentUser}
                    projects={projects}
                    channels={channels}
                    users={users}
                    onClose={() => setIsSettingsOpen(false)}
                    onUpdateUser={(updatedUser) => {
                        handleUpdateUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                        setCurrentUser(updatedUser);
                    }}
                />
            )}

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-[#1f1f1f] md:hidden z-50 flex items-center justify-around px-2 pb-safe">
                <button
                    onClick={() => setActiveView('dashboard')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'dashboard' ? 'text-indigo-400' : 'text-[#666]'}`}
                >
                    <LayoutDashboard size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>
                <button
                    onClick={() => setActiveView('projects')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'projects' ? 'text-indigo-400' : 'text-[#666]'}`}
                >
                    <Film size={20} />
                    <span className="text-[10px] font-medium">Projects</span>
                </button>
                <button
                    onClick={() => setActiveView('board')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'board' ? 'text-indigo-400' : 'text-[#666]'}`}
                >
                    <CheckSquare size={20} />
                    <span className="text-[10px] font-medium">Board</span>
                </button>
                <button
                    onClick={() => setActiveView('calendar')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'calendar' ? 'text-indigo-400' : 'text-[#666]'}`}
                >
                    <Calendar size={20} />
                    <span className="text-[10px] font-medium">Calendar</span>
                </button>
                {currentRole === 'manager' && (
                    <button
                        onClick={() => setActiveView('team')} // Simplified for mobile, defaulting to Team
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${['team', 'channels'].includes(activeView) ? 'text-indigo-400' : 'text-[#666]'}`}
                    >
                        <MoreHorizontal size={20} />
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;