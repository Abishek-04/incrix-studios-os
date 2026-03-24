'use client';

import { useEffect, useState, useCallback } from 'react';
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
  BarChart3,
  Trash2,
  GraduationCap,
  MoreHorizontal,
  X
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';
// import AccountSwitcher from '@/components/dev/AccountSwitcher';
import { UIProvider } from '@/contexts/UIContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { logout as apiLogout, fetchWithAuth } from '@/services/api';

import LoadingScreen from '@/components/ui/LoadingScreen';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(userId) {
  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription: subscription.toJSON() })
    });
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}

function ProtectedLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
    }
  }, [loading, currentUser, router]);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Fetch notifications from DB
  const fetchNotifications = useCallback(async (userId) => {
    try {
      const res = await fetchWithAuth(`/api/notifications?userId=${userId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchNotifications(currentUser.id);
    const interval = setInterval(() => fetchNotifications(currentUser.id), 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchNotifications]);

  // Subscribe to push notifications after login
  useEffect(() => {
    if (currentUser?.id) {
      subscribeToPush(currentUser.id);
    }
  }, [currentUser?.id]);

  if (loading || !currentUser) return <LoadingScreen />;

  const handleLogout = async () => {
    await apiLogout();
    router.push('/');
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetchWithAuth('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true, userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      await fetchWithAuth('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationIds: [notifId], userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const isActive = (path) => pathname === path;
  const isRouteActive = (path) => pathname === path || pathname.startsWith(`${path}/`);
  const userRoles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0
    ? currentUser.roles
    : [currentUser.role].filter(Boolean);
  const hasAnyRole = (roles) => roles.some((role) => userRoles.includes(role));
  const roleLabel = userRoles.length > 1 ? `${currentUser.role} +${userRoles.length - 1}` : currentUser.role;
  const headerTitleMap = {
    '/dashboard': 'Dashboard',
    '/projects': 'Projects Registry',
    '/board': 'Production Board',
    '/calendar': 'Content Calendar',
    '/daily': 'Daily Tasks',
    '/performance': 'Team Performance',
    '/analytics': 'Platform Analytics',
    '/design-projects': 'Design Projects',
    '/dev-projects': 'Development Projects',
    '/team': 'User Management',
    '/channels': 'Channel Credentials',
    '/courses': 'Course Dashboard',
    '/instagram': 'Instagram DM Automation',
    '/settings/notifications': 'Notification Settings',
    '/recycle-bin': 'Recycle Bin',
    '/admin/notifications': 'Notification Management'
  };
  const pageTitle = headerTitleMap[pathname] || '#teamincrix';
  const mobileQuickNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/projects', icon: ListChecks, label: 'Projects' },
    { href: '/board', icon: FolderKanban, label: 'Board' },
    { href: '/daily', icon: CheckSquare, label: 'Tasks' }
  ];

  const mobileMenuSections = [
    {
      title: 'Planning',
      items: [
        { href: '/calendar', icon: CalendarIcon, label: 'Calendar' },
        { href: '/settings/notifications', icon: SettingsIcon, label: 'Settings' }
      ]
    },
    {
      title: 'Production',
      items: [
        ...(hasAnyRole(['manager', 'creator', 'editor']) ? [{ href: '/performance', icon: TrendingUp, label: 'Performance' }] : []),
        ...(hasAnyRole(['manager', 'designer']) ? [{ href: '/design-projects', icon: Palette, label: 'Design Projects' }] : []),
        ...(hasAnyRole(['manager', 'developer']) ? [{ href: '/dev-projects', icon: Code, label: 'Dev Projects' }] : [])
      ]
    },
    {
      title: 'Admin',
      items: [
        ...(hasAnyRole(['superadmin']) ? [{ href: '/analytics', icon: BarChart3, label: 'Analytics' }] : []),
        { href: '/courses', icon: GraduationCap, label: 'Courses' },
        { href: '/instagram', icon: Instagram, label: 'Instagram' },
        ...(hasAnyRole(['superadmin', 'manager']) ? [
          { href: '/team', icon: Users, label: 'Users' },
          { href: '/channels', icon: Radio, label: 'Channels' },
          { href: '/admin/notifications', icon: Bell, label: 'Notifications' }
        ] : []),
        { href: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' }
      ]
    }
  ].filter((section) => section.items.length > 0);

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col justify-between hidden md:flex transition-all duration-300`}>
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo */}
          <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-[#1f1f1f] relative">
            {!sidebarCollapsed && (
              <>
                <img src="/icons/icon-192.png" alt="#teamincrix" className="w-7 h-7 rounded-lg mr-3" />
                <span className="font-smooch text-2xl text-white">#teamincrix</span>
              </>
            )}
            {sidebarCollapsed && (
              <img src="/icons/icon-192.png" alt="#teamincrix" className="w-7 h-7 rounded-lg mx-auto" />
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
          <div className="p-4 flex-1 overflow-y-auto">
            {!sidebarCollapsed && <div className="text-xs font-bold text-[#999] uppercase tracking-wider mb-3 px-4">Menu</div>}
            <nav className="space-y-1">
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={isActive('/dashboard')} collapsed={sidebarCollapsed} />
              <NavItem href="/projects" icon={ListChecks} label="Projects" isActive={isActive('/projects')} collapsed={sidebarCollapsed} />
              <NavItem href="/board" icon={FolderKanban} label="Board" isActive={isActive('/board')} collapsed={sidebarCollapsed} />
              <NavItem href="/calendar" icon={CalendarIcon} label="Calendar" isActive={isActive('/calendar')} collapsed={sidebarCollapsed} />
              <NavItem href="/daily" icon={CheckSquare} label="Daily Tasks" isActive={isActive('/daily')} collapsed={sidebarCollapsed} />
              <NavItem href="/settings/notifications" icon={SettingsIcon} label="Settings" isActive={isActive('/settings/notifications')} collapsed={sidebarCollapsed} />
              <NavItem href="/recycle-bin" icon={Trash2} label="Recycle Bin" isActive={isActive('/recycle-bin')} collapsed={sidebarCollapsed} />

              {hasAnyRole(['manager', 'creator', 'editor']) && (
                <NavItem href="/performance" icon={TrendingUp} label="Performance" isActive={isActive('/performance')} collapsed={sidebarCollapsed} />
              )}

              {hasAnyRole(['manager', 'designer']) && (
                <NavItem href="/design-projects" icon={Palette} label="Design Projects" isActive={isActive('/design-projects')} collapsed={sidebarCollapsed} />
              )}

              {hasAnyRole(['manager', 'developer']) && (
                <NavItem href="/dev-projects" icon={Code} label="Dev Projects" isActive={isActive('/dev-projects')} collapsed={sidebarCollapsed} />
              )}

              <NavItem href="/courses" icon={GraduationCap} label="Courses" isActive={isActive('/courses')} collapsed={sidebarCollapsed} />
              <NavItem href="/instagram" icon={Instagram} label="Instagram" isActive={isActive('/instagram')} collapsed={sidebarCollapsed} />

              {hasAnyRole(['superadmin', 'manager']) && (
                <>
                  {!sidebarCollapsed && <div className="text-xs font-bold text-[#999] uppercase tracking-wider mt-6 mb-3 px-4">Admin</div>}
                  {hasAnyRole(['superadmin']) && (
                    <NavItem href="/analytics" icon={BarChart3} label="Analytics" isActive={isActive('/analytics')} collapsed={sidebarCollapsed} />
                  )}
                  <NavItem href="/team" icon={Users} label="Users" isActive={isActive('/team')} collapsed={sidebarCollapsed} />
                  <NavItem href="/channels" icon={Radio} label="Channels" isActive={isActive('/channels')} collapsed={sidebarCollapsed} />
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
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.name || 'User profile'}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all"
                  title={currentUser.name}
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentUser.avatarColor || 'bg-indigo-600'} cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all`} title={currentUser.name}>
                  {currentUser.name?.charAt(0) || '?'}
                </div>
              )}
              <button onClick={handleLogout} className="text-[#666] hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-[#1a1a1a]" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#151515] hover:bg-[#1a1a1a] transition-colors">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.name || 'User profile'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentUser.avatarColor || 'bg-indigo-600'}`}>
                  {currentUser.name?.charAt(0) || '?'}
                </div>
              )}
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
        <header className="h-16 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between px-4 sm:px-6 md:px-8 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-white truncate">{pageTitle}</h2>
            <div className="md:hidden text-[11px] text-[#666] capitalize truncate">{roleLabel}</div>
          </div>

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
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            <button className="hidden md:inline-flex p-2 text-[#666] hover:text-white rounded-lg hover:bg-[#1f1f1f] transition-colors">
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
                  onMarkAsRead={handleMarkAsRead}
                />
              )}
            </div>

            <div className="hidden md:block h-4 w-[1px] bg-[#333]"></div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-[#666]">
              <Clock size={14} />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-[88px] md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#2a2a2a] bg-[#0e0e0e]/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-2 py-2">
          {mobileQuickNav.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center">
                <div className={`w-full max-w-[72px] rounded-xl py-1.5 flex flex-col items-center gap-1 transition-colors ${
                  active ? 'bg-indigo-500/15 text-indigo-300' : 'text-[#888] hover:text-white'
                }`}>
                  <Icon size={17} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMobileMenu((prev) => !prev)}
            className="flex flex-col items-center justify-center"
            aria-label="Open more navigation options"
          >
            <div className={`w-full max-w-[72px] rounded-xl py-1.5 flex flex-col items-center gap-1 transition-colors ${
              showMobileMenu ? 'bg-indigo-500/15 text-indigo-300' : 'text-[#888] hover:text-white'
            }`}>
              <MoreHorizontal size={17} />
              <span className="text-[10px] font-medium">More</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Grouped Menu Sheet */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#121212] border-t border-[#2a2a2a] rounded-t-2xl max-h-[78vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Quick Menu</h3>
                <p className="text-xs text-[#777]">Paired sections for mobile navigation</p>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#222]"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {mobileMenuSections.map((section) => (
                <div key={section.title}>
                  <div className="text-[11px] font-semibold text-[#777] uppercase tracking-wider mb-2">{section.title}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isRouteActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                            active
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                              : 'bg-[#181818] border-[#2a2a2a] text-[#bbb] hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                          <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-300 py-2.5 text-sm font-medium"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Development Account Switcher (disabled — uses cookie-based auth now) */}
    </div>
  );
}

export default function ProtectedLayout({ children }) {
  return (
    <AuthProvider>
      <UIProvider>
        <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
      </UIProvider>
    </AuthProvider>
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
