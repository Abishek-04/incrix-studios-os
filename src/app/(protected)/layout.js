'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Calendar as CalendarIcon,
  CheckSquare,
  Users,
  Settings as SettingsIcon,
  Bell,
  Clock,
  LogOut,
  Search,
  Radio,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Palette,
  Code,
  Instagram,
  BarChart3
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';
import AccountSwitcher from '@/components/dev/AccountSwitcher';

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check authentication
  useEffect(() => {
    const user = localStorage.getItem('auth_user');
    if (!user) {
      router.push('/');
    } else {
      setCurrentUser(JSON.parse(user));
    }
  }, [router]);

  if (!currentUser) return null;

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('activeView');
    router.push('/');
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const isActive = (path) => pathname === path;

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col justify-between hidden md:flex transition-all duration-300`}>
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#1f1f1f] relative">
            {!sidebarCollapsed && (
              <>
                <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg mr-3"></div>
                <span className="font-bold text-white tracking-tight">Incrix Studios</span>
              </>
            )}
            {sidebarCollapsed && (
              <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg mx-auto"></div>
            )}
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#1e1e1e] border border-[#333] rounded-full flex items-center justify-center text-[#999] hover:text-white hover:bg-[#252525] transition-colors z-10"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation */}
          <div className="p-4">
            {!sidebarCollapsed && <div className="text-xs font-bold text-[#999] uppercase tracking-wider mb-3 px-4">Menu</div>}
            <nav className="space-y-1">
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={isActive('/dashboard')} collapsed={sidebarCollapsed} />
              <NavItem href="/projects" icon={ListChecks} label="Projects" isActive={isActive('/projects')} collapsed={sidebarCollapsed} />
              <NavItem href="/board" icon={FolderKanban} label="Board" isActive={isActive('/board')} collapsed={sidebarCollapsed} />
              <NavItem href="/calendar" icon={CalendarIcon} label="Calendar" isActive={isActive('/calendar')} collapsed={sidebarCollapsed} />
              <NavItem href="/daily" icon={CheckSquare} label="Daily Tasks" isActive={isActive('/daily')} collapsed={sidebarCollapsed} />
              <NavItem href="/settings/notifications" icon={SettingsIcon} label="Settings" isActive={isActive('/settings/notifications')} collapsed={sidebarCollapsed} />

              {['manager', 'creator', 'editor'].includes(currentUser.role) && (
                <NavItem href="/performance" icon={TrendingUp} label="Performance" isActive={isActive('/performance')} collapsed={sidebarCollapsed} />
              )}

              {['manager', 'designer'].includes(currentUser.role) && (
                <NavItem href="/design-projects" icon={Palette} label="Design Projects" isActive={isActive('/design-projects')} collapsed={sidebarCollapsed} />
              )}

              {['manager', 'developer'].includes(currentUser.role) && (
                <NavItem href="/dev-projects" icon={Code} label="Dev Projects" isActive={isActive('/dev-projects')} collapsed={sidebarCollapsed} />
              )}

              {(currentUser.role === 'superadmin' || currentUser.role === 'manager') && (
                <>
                  {!sidebarCollapsed && <div className="text-xs font-bold text-[#999] uppercase tracking-wider mt-6 mb-3 px-4">Admin</div>}
                  {currentUser.role === 'superadmin' && (
                    <NavItem href="/analytics" icon={BarChart3} label="Analytics" isActive={isActive('/analytics')} collapsed={sidebarCollapsed} />
                  )}
                  <NavItem href="/team" icon={Users} label="Users" isActive={isActive('/team')} collapsed={sidebarCollapsed} />
                  <NavItem href="/channels" icon={Radio} label="Channels" isActive={isActive('/channels')} collapsed={sidebarCollapsed} />
                  <NavItem href="/instagram" icon={Instagram} label="Instagram" isActive={isActive('/instagram')} collapsed={sidebarCollapsed} />
                  <NavItem href="/admin/notifications" icon={Bell} label="Notifications" isActive={isActive('/admin/notifications')} collapsed={sidebarCollapsed} />
                </>
              )}
            </nav>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#1f1f1f]">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentUser.avatarColor || 'bg-indigo-600'} cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all`} title={currentUser.name}>
                {currentUser.name?.charAt(0) || '?'}
              </div>
              <button onClick={handleLogout} className="text-[#666] hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-[#1a1a1a]" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#151515] hover:bg-[#1a1a1a] transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentUser.avatarColor || 'bg-indigo-600'}`}>
                {currentUser.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
                <div className="text-xs text-[#666] capitalize">{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} className="text-[#666] hover:text-rose-500 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-bold text-white truncate">
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/projects' && 'Projects Registry'}
            {pathname === '/board' && 'Production Board'}
            {pathname === '/calendar' && 'Content Calendar'}
            {pathname === '/daily' && 'Daily Tasks'}
            {pathname === '/performance' && 'Team Performance'}
            {pathname === '/analytics' && 'Platform Analytics'}
            {pathname === '/design-projects' && 'Design Projects'}
            {pathname === '/dev-projects' && 'Development Projects'}
            {pathname === '/team' && 'User Management'}
            {pathname === '/channels' && 'Channel Credentials'}
            {pathname === '/instagram' && 'Instagram DM Automation'}
            {pathname === '/settings/notifications' && 'Notification Settings'}
            {pathname === '/admin/notifications' && 'Notification Management'}
          </h2>

          {/* Search */}
          <div className="hidden lg:flex items-center bg-[#151515] border border-[#222] rounded-xl px-3 py-1.5 w-64 mx-8">
            <Search size={14} className="text-[#999]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-[#999]"
            />
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-[#666] hover:text-white rounded-lg hover:bg-[#1f1f1f] transition-colors">
              <SettingsIcon size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#666] hover:text-white rounded-lg hover:bg-[#1f1f1f] transition-colors relative"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Development Account Switcher */}
      <AccountSwitcher />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, isActive, collapsed }) {
  return (
    <Link href={href}>
      <div
        className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
          isActive
            ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20'
            : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
        }`}
        title={collapsed ? label : undefined}
      >
        <Icon size={18} className={isActive ? 'text-indigo-400' : ''} />
        {!collapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}
