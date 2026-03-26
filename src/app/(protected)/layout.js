'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderKanban, ListChecks, Calendar as CalendarIcon,
  CheckSquare, Users, Settings as SettingsIcon, Bell, Clock, LogOut,
  Search, Radio, ChevronLeft, ChevronRight, ChevronDown, TrendingUp,
  Palette, Code, Instagram, BarChart3, Trash2, GraduationCap,
  MoreHorizontal, X, MessageSquare, Briefcase, DollarSign, BookOpen,
  Cpu, Megaphone, Scissors, Film, PanelLeftClose, PanelLeft
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';
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
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
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

// ─── Team Config ──────────────────────────────────────────────────────────────
const TEAMS = [
  {
    id: 'content', label: 'Content', emoji: '🎬', color: '#818cf8',
    dotClass: 'bg-indigo-400', borderClass: 'border-l-indigo-400',
    roles: ['creator', 'editor', 'manager', 'superadmin'],
    sub: [
      { href: '/projects', label: 'Productions', icon: ListChecks },
      { href: '/board', label: 'Kanban Board', icon: FolderKanban },
      { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
      { href: '/performance', label: 'Performance', icon: TrendingUp },
    ]
  },
  {
    id: 'editing', label: 'Editing', emoji: '✂️', color: '#a78bfa',
    dotClass: 'bg-violet-400', borderClass: 'border-l-violet-400',
    roles: ['editor', 'manager', 'superadmin'],
    sub: [
      { href: '/board', label: 'Edit Queue', icon: FolderKanban },
    ]
  },
  {
    id: 'design', label: 'Design', emoji: '🎨', color: '#f472b6',
    dotClass: 'bg-pink-400', borderClass: 'border-l-pink-400',
    roles: ['designer', 'manager', 'superadmin'],
    sub: [
      { href: '/design-projects', label: 'Projects', icon: Palette },
    ]
  },
  {
    id: 'dev', label: 'Development', emoji: '💻', color: '#38bdf8',
    dotClass: 'bg-sky-400', borderClass: 'border-l-sky-400',
    roles: ['developer', 'manager', 'superadmin'],
    sub: [
      { href: '/dev-projects', label: 'Projects', icon: Code },
    ]
  },
  {
    id: 'marketing', label: 'Marketing', emoji: '📈', color: '#fbbf24',
    dotClass: 'bg-amber-400', borderClass: 'border-l-amber-400',
    roles: ['manager', 'superadmin'],
    sub: [
      { href: '/instagram', label: 'Instagram', icon: Instagram },
      { href: '/channels', label: 'Channels', icon: Radio },
    ]
  },
  {
    id: 'hardware', label: 'Hardware', emoji: '🔧', color: '#34d399',
    dotClass: 'bg-emerald-400', borderClass: 'border-l-emerald-400',
    roles: ['manager', 'superadmin'],
    sub: []
  },
];

// ─── Layout Inner ─────────────────────────────────────────────────────────────
function ProtectedLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => {
    if (!loading && !currentUser) router.push('/');
  }, [loading, currentUser, router]);

  useEffect(() => { setShowMobileMenu(false); }, [pathname]);

  // Auto-expand the team whose sub-page we're currently on
  useEffect(() => {
    TEAMS.forEach(team => {
      if (team.sub.some(s => pathname === s.href || pathname.startsWith(s.href + '/'))) {
        setExpandedTeams(prev => ({ ...prev, [team.id]: true }));
      }
    });
  }, [pathname]);

  const fetchNotifications = useCallback(async (userId) => {
    try {
      const res = await fetchWithAuth(`/api/notifications?userId=${userId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) { console.error('Failed to fetch notifications:', err); }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchNotifications(currentUser.id);
    const checkRemindersAndNotifications = async () => {
      try { await fetch('/api/reminders/check'); } catch (_) {}
      fetchNotifications(currentUser.id);
    };
    const interval = setInterval(checkRemindersAndNotifications, 30000);
    fetch('/api/reminders/check').catch(() => {});
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchNotifications]);

  useEffect(() => {
    if (currentUser?.id) subscribeToPush(currentUser.id);
  }, [currentUser?.id]);

  if (loading || !currentUser) return <LoadingScreen />;

  const handleLogout = async () => { await apiLogout(); router.push('/'); };
  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await fetchWithAuth('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true, userId: currentUser.id }) }); } catch (_) {}
  };
  const handleMarkAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try { await fetchWithAuth('/api/notifications', { method: 'PATCH', body: JSON.stringify({ notificationIds: [notifId], userId: currentUser.id }) }); } catch (_) {}
  };

  const isActive = (path) => pathname === path;
  const isRouteActive = (path) => pathname === path || pathname.startsWith(`${path}/`);
  const userRoles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role].filter(Boolean);
  const hasAnyRole = (roles) => roles.some((role) => userRoles.includes(role));
  const isManager = hasAnyRole(['superadmin', 'manager']);
  const unreadCount = notifications.filter(n => !n.read).length;

  const headerTitleMap = {
    '/dashboard': 'Command Center',
    '/projects': 'Productions',
    '/board': 'Kanban Board',
    '/calendar': 'Content Calendar',
    '/daily': 'My Workspace',
    '/performance': 'Team Performance',
    '/analytics': 'Platform Analytics',
    '/design-projects': 'Design Projects',
    '/dev-projects': 'Development Projects',
    '/team': 'User Management',
    '/channels': 'Channel Credentials',
    '/courses': 'Classory',
    '/instagram': 'Instagram Automation',
    '/chat': 'Team Chat',
    '/clients': 'Clients & Leads',
    '/revenue': 'Revenue',
    '/settings/notifications': 'Settings',
    '/recycle-bin': 'Recycle Bin',
    '/admin/notifications': 'Notifications'
  };
  const pageTitle = headerTitleMap[pathname] || 'Incrix OS';

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  // ── Mobile nav ──────────────────────────────────────────────────────────────
  const mobileQuickNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/board', icon: FolderKanban, label: 'Board' },
    { href: '/daily', icon: CheckSquare, label: 'Tasks' },
  ];

  const mobileMenuSections = [
    {
      title: 'Business',
      show: isManager,
      items: [
        { href: '/clients', icon: Briefcase, label: 'Clients & Leads' },
        { href: '/revenue', icon: DollarSign, label: 'Revenue' },
        { href: '/courses', icon: GraduationCap, label: 'Classory' },
      ]
    },
    {
      title: 'Production',
      show: true,
      items: [
        { href: '/projects', icon: ListChecks, label: 'Projects' },
        { href: '/calendar', icon: CalendarIcon, label: 'Calendar' },
        ...(hasAnyRole(['manager', 'creator', 'editor']) ? [{ href: '/performance', icon: TrendingUp, label: 'Performance' }] : []),
        ...(hasAnyRole(['manager', 'designer']) ? [{ href: '/design-projects', icon: Palette, label: 'Design' }] : []),
        ...(hasAnyRole(['manager', 'developer']) ? [{ href: '/dev-projects', icon: Code, label: 'Dev' }] : []),
      ]
    },
    {
      title: 'Tools',
      show: true,
      items: [
        { href: '/instagram', icon: Instagram, label: 'Instagram' },
        { href: '/channels', icon: Radio, label: 'Channels' },
      ]
    },
    {
      title: 'Admin',
      show: isManager,
      items: [
        ...(hasAnyRole(['superadmin']) ? [{ href: '/analytics', icon: BarChart3, label: 'Analytics' }] : []),
        { href: '/team', icon: Users, label: 'Users' },
        { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { href: '/settings/notifications', icon: SettingsIcon, label: 'Settings' },
        { href: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' },
      ]
    }
  ].filter(s => s.show && s.items.length > 0);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#07080e] text-white overflow-hidden">
      {/* ─── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[250px]'} bg-[#0a0b16] border-r border-[#151a30] flex-col justify-between hidden md:flex transition-all duration-300 relative`}>
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-[#151a30] flex-shrink-0">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">I</div>
                <span className="font-bold text-[15px] tracking-tight bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Incrix OS</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-lg shadow-indigo-500/20">I</div>
            )}
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-none">
            {/* COMMAND */}
            <SidebarSection label="COMMAND" collapsed={sidebarCollapsed}>
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Command Center" active={isActive('/dashboard')} collapsed={sidebarCollapsed} accentColor="indigo" />
              <NavItem href="/daily" icon={CheckSquare} label="My Workspace" active={isActive('/daily')} collapsed={sidebarCollapsed} />
              <NavItem href="/chat" icon={MessageSquare} label="Team Chat" active={isRouteActive('/chat')} collapsed={sidebarCollapsed} badge={null} />
            </SidebarSection>

            {/* BUSINESS - managers only */}
            {isManager && (
              <SidebarSection label="BUSINESS" collapsed={sidebarCollapsed}>
                <NavItem href="/clients" icon={Briefcase} label="Clients & Leads" active={isRouteActive('/clients')} collapsed={sidebarCollapsed} accentColor="cyan" />
                <NavItem href="/revenue" icon={DollarSign} label="Revenue" active={isRouteActive('/revenue')} collapsed={sidebarCollapsed} accentColor="amber" />
                <NavItem href="/courses" icon={GraduationCap} label="Classory" active={isRouteActive('/courses')} collapsed={sidebarCollapsed} accentColor="violet" />
              </SidebarSection>
            )}

            {/* TEAMS */}
            <SidebarSection label="TEAMS" collapsed={sidebarCollapsed}>
              {TEAMS.filter(team => hasAnyRole(team.roles)).map(team => (
                <TeamNavItem
                  key={team.id}
                  team={team}
                  expanded={expandedTeams[team.id]}
                  onToggle={() => toggleTeam(team.id)}
                  pathname={pathname}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </SidebarSection>

            {/* ADMIN */}
            {isManager && (
              <SidebarSection label="ADMIN" collapsed={sidebarCollapsed}>
                {hasAnyRole(['superadmin']) && (
                  <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={isActive('/analytics')} collapsed={sidebarCollapsed} />
                )}
                <NavItem href="/team" icon={Users} label="Users" active={isActive('/team')} collapsed={sidebarCollapsed} />
                <NavItem href="/admin/notifications" icon={Bell} label="Notifications" active={isActive('/admin/notifications')} collapsed={sidebarCollapsed} />
                <NavItem href="/settings/notifications" icon={SettingsIcon} label="Settings" active={isActive('/settings/notifications')} collapsed={sidebarCollapsed} />
                <NavItem href="/recycle-bin" icon={Trash2} label="Recycle Bin" active={isActive('/recycle-bin')} collapsed={sidebarCollapsed} />
              </SidebarSection>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-[#151a30] flex-shrink-0">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <UserAvatar user={currentUser} size="sm" />
              <button onClick={handleLogout} className="text-[#3d4270] hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10" title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e1025] border border-[#1a1f3a] hover:border-[#252b50] transition-colors">
              <UserAvatar user={currentUser} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#c8cce0] truncate">{currentUser.name}</div>
                <div className="text-[11px] text-[#3d4270] capitalize">{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} className="text-[#3d4270] hover:text-rose-400 transition-colors" title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-7 w-6 h-6 bg-[#12142a] border border-[#1e2345] rounded-full flex items-center justify-center text-[#4a5090] hover:text-white hover:bg-[#1c1f42] hover:border-indigo-500/40 transition-all z-10 shadow-lg"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#07080e]/80 backdrop-blur-xl border-b border-[#151a30] flex items-center justify-between px-4 sm:px-6 md:px-8 flex-shrink-0 z-20">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#c8cce0] truncate">{pageTitle}</h2>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-xs text-[#3d4270] mr-2">
              <Clock size={13} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#3d4270] hover:text-[#818cf8] rounded-lg hover:bg-[#0e1025] transition-all relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></span>
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-[72px] md:pb-0">
          {children}
        </main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#151a30] bg-[#0a0b16]/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {mobileQuickNav.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center">
                <div className={`w-full max-w-[64px] rounded-xl py-1.5 flex flex-col items-center gap-0.5 transition-all ${
                  active ? 'bg-indigo-500/10 text-indigo-400' : 'text-[#3d4270] hover:text-white'
                }`}>
                  <Icon size={17} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="flex flex-col items-center justify-center">
            <div className={`w-full max-w-[64px] rounded-xl py-1.5 flex flex-col items-center gap-0.5 transition-all ${
              showMobileMenu ? 'bg-indigo-500/10 text-indigo-400' : 'text-[#3d4270] hover:text-white'
            }`}>
              <MoreHorizontal size={17} />
              <span className="text-[10px] font-medium">More</span>
            </div>
          </button>
        </div>
      </div>

      {/* ─── MOBILE MENU SHEET ─────────────────────────────────────────────── */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#0a0b16] border-t border-[#1a1f3a] rounded-t-2xl max-h-[80vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">I</div>
                <span className="font-semibold text-sm text-[#c8cce0]">Incrix OS</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-lg text-[#3d4270] hover:text-white hover:bg-[#151a30]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {mobileMenuSections.map(section => (
                <div key={section.title}>
                  <div className="text-[10px] font-bold text-[#2e3258] uppercase tracking-widest mb-2 px-1">{section.title}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const active = isRouteActive(item.href);
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ${
                            active
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                              : 'bg-[#0e1025] border-[#1a1f3a] text-[#6b7199] hover:text-white hover:border-[#252b50]'
                          }`}>
                          <Icon size={15} />
                          <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleLogout} className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-400 py-2.5 text-sm font-medium hover:bg-rose-500/10 transition-colors">
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarSection({ label, collapsed, children }) {
  return (
    <div>
      {!collapsed && (
        <div className="px-3 mb-1.5 text-[10px] font-bold text-[#2a2e52] uppercase tracking-[0.15em]">{label}</div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, collapsed, accentColor, badge }) {
  const colorMap = {
    indigo: 'border-l-indigo-400 bg-indigo-500/8 text-indigo-300',
    cyan: 'border-l-sky-400 bg-sky-500/8 text-sky-300',
    amber: 'border-l-amber-400 bg-amber-500/8 text-amber-300',
    violet: 'border-l-violet-400 bg-violet-500/8 text-violet-300',
  };
  const activeClass = accentColor && colorMap[accentColor]
    ? `border-l-2 ${colorMap[accentColor]}`
    : 'border-l-2 border-l-indigo-400 bg-indigo-500/8 text-indigo-300';

  return (
    <Link href={href}>
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
        active ? activeClass : 'text-[#4a5090] hover:text-[#b0b8e0] hover:bg-[#0e1025]'
      }`} title={collapsed ? label : undefined}>
        <Icon size={17} className="flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
        {!collapsed && badge !== undefined && badge !== null && (
          <span className="ml-auto bg-indigo-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>
        )}
      </div>
    </Link>
  );
}

function TeamNavItem({ team, expanded, onToggle, pathname, collapsed }) {
  const hasActiveSub = team.sub.some(s => pathname === s.href || pathname.startsWith(s.href + '/'));

  if (collapsed) {
    const primaryHref = team.sub[0]?.href || '/dashboard';
    return (
      <Link href={primaryHref}>
        <div className={`flex justify-center py-2 px-2 rounded-lg text-lg cursor-pointer transition-all ${
          hasActiveSub ? 'bg-[#111330]' : 'hover:bg-[#0e1025]'
        }`} title={team.label}>
          {team.emoji}
        </div>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
          hasActiveSub || expanded ? 'text-white bg-[#0e1025]' : 'text-[#4a5090] hover:text-[#b0b8e0] hover:bg-[#0e1025]'
        }`}
      >
        <span className="text-base leading-none">{team.emoji}</span>
        <span className="flex-1 text-left">{team.label}</span>
        <ChevronDown size={13} className={`text-[#3d4270] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Accordion */}
      <div className={`overflow-hidden transition-all duration-250 ease-in-out ${expanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-3 pl-3 mt-0.5 space-y-0.5 border-l border-[#1a1f3a]">
          {team.sub.map(sub => {
            const SubIcon = sub.icon;
            const subActive = pathname === sub.href;
            return (
              <Link key={sub.href} href={sub.href}>
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                  subActive
                    ? `text-white ${team.borderClass} border-l-2 -ml-[1px] bg-white/[0.03]`
                    : 'text-[#4a5090] hover:text-[#b0b8e0] hover:bg-white/[0.02]'
                }`}>
                  <SubIcon size={13} className="flex-shrink-0" />
                  <span>{sub.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ user, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (user.profilePhoto) {
    return <img src={user.profilePhoto} alt={user.name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${user.avatarColor || 'bg-indigo-600'}`}>
      {user.name?.charAt(0) || '?'}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ProtectedLayout({ children }) {
  return (
    <AuthProvider>
      <UIProvider>
        <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
      </UIProvider>
    </AuthProvider>
  );
}
