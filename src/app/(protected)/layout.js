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
  Radio
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="w-64 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#1f1f1f]">
            <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg mr-3"></div>
            <span className="font-bold text-white tracking-tight">Incrix Studios</span>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <div className="text-xs font-bold text-[#999] uppercase tracking-wider mb-3 px-4">Menu</div>
            <nav className="space-y-1">
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={isActive('/dashboard')} />
              <NavItem href="/projects" icon={ListChecks} label="Projects" isActive={isActive('/projects')} />
              <NavItem href="/board" icon={FolderKanban} label="Board" isActive={isActive('/board')} />
              <NavItem href="/calendar" icon={CalendarIcon} label="Calendar" isActive={isActive('/calendar')} />
              <NavItem href="/daily" icon={CheckSquare} label="Daily Tasks" isActive={isActive('/daily')} />

              {currentUser.role === 'manager' && (
                <>
                  <div className="text-xs font-bold text-[#999] uppercase tracking-wider mt-6 mb-3 px-4">Admin</div>
                  <NavItem href="/team" icon={Users} label="Team" isActive={isActive('/team')} />
                  <NavItem href="/channels" icon={Radio} label="Channels" isActive={isActive('/channels')} />
                </>
              )}
            </nav>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#1f1f1f]">
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
            {pathname === '/team' && 'Team Management'}
            {pathname === '/channels' && 'Channel Credentials'}
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
    </div>
  );
}

function NavItem({ href, icon: Icon, label, isActive }) {
  return (
    <Link href={href}>
      <div className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-[#1e1e1e] text-white shadow-lg shadow-black/20'
          : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
      }`}>
        <Icon size={18} className={isActive ? 'text-indigo-400' : ''} />
        <span>{label}</span>
      </div>
    </Link>
  );
}
