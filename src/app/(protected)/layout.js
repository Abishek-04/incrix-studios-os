'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderKanban, ListChecks, Calendar as CalendarIcon,
  CheckSquare, Users, Settings as SettingsIcon, Bell, LogOut,
  ChevronDown, ChevronLeft, ChevronRight, TrendingUp, Palette, Code,
  Instagram, BarChart3, Trash2, GraduationCap, MoreHorizontal, X,
  MessageSquare, Briefcase, DollarSign, Radio, Menu
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
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    }
    await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, subscription: subscription.toJSON() }) });
  } catch (error) { console.error('Push subscription failed:', error); }
}

const TEAMS = [
  { id: 'content', label: 'Content', emoji: '🎬', color: '#4f46e5', bg: 'bg-indigo-50', activeBg: 'bg-indigo-50', activeText: 'text-indigo-700', activeBorder: 'border-l-indigo-500', roles: ['creator', 'editor', 'manager', 'superadmin'],
    sub: [
      { href: '/projects', label: 'Projects', icon: ListChecks },
      { href: '/board', label: 'Board', icon: FolderKanban },
      { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
      { href: '/performance', label: 'Performance', icon: TrendingUp },
    ]
  },
  { id: 'editing', label: 'Editing', emoji: '✂️', color: '#7c3aed', bg: 'bg-violet-50', activeBg: 'bg-violet-50', activeText: 'text-violet-700', activeBorder: 'border-l-violet-500', roles: ['editor', 'manager', 'superadmin'],
    sub: [{ href: '/board', label: 'Edit Queue', icon: FolderKanban }]
  },
  { id: 'design', label: 'Design', emoji: '🎨', color: '#db2777', bg: 'bg-pink-50', activeBg: 'bg-pink-50', activeText: 'text-pink-700', activeBorder: 'border-l-pink-500', roles: ['designer', 'manager', 'superadmin'],
    sub: [{ href: '/design-projects', label: 'Projects', icon: Palette }]
  },
  { id: 'dev', label: 'Development', emoji: '💻', color: '#0891b2', bg: 'bg-cyan-50', activeBg: 'bg-cyan-50', activeText: 'text-cyan-700', activeBorder: 'border-l-cyan-500', roles: ['developer', 'manager', 'superadmin'],
    sub: [{ href: '/dev-projects', label: 'Projects', icon: Code }]
  },
  { id: 'marketing', label: 'Marketing', emoji: '📣', color: '#d97706', bg: 'bg-amber-50', activeBg: 'bg-amber-50', activeText: 'text-amber-700', activeBorder: 'border-l-amber-500', roles: ['manager', 'superadmin'],
    sub: [
      { href: '/instagram', label: 'Instagram', icon: Instagram },
      { href: '/channels', label: 'Channels', icon: Radio },
    ]
  },
  { id: 'hardware', label: 'Hardware', emoji: '🔧', color: '#059669', bg: 'bg-emerald-50', activeBg: 'bg-emerald-50', activeText: 'text-emerald-700', activeBorder: 'border-l-emerald-500', roles: ['manager', 'superadmin'],
    sub: []
  },
];

function ProtectedLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => { if (!loading && !currentUser) router.push('/'); }, [loading, currentUser, router]);
  useEffect(() => { setShowMobileMenu(false); }, [pathname]);
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
      if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchNotifications(currentUser.id);
    const interval = setInterval(() => {
      fetch('/api/reminders/check').catch(() => {});
      fetchNotifications(currentUser.id);
    }, 30000);
    fetch('/api/reminders/check').catch(() => {});
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchNotifications]);

  useEffect(() => { if (currentUser?.id) subscribeToPush(currentUser.id); }, [currentUser?.id]);

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
  const hasAnyRole = (roles) => roles.some(r => userRoles.includes(r));
  const isManager = hasAnyRole(['superadmin', 'manager']);
  const unreadCount = notifications.filter(n => !n.read).length;

  const titles = {
    '/dashboard': 'Home', '/projects': 'Projects', '/board': 'Board', '/calendar': 'Calendar',
    '/daily': 'My Tasks', '/performance': 'Performance', '/analytics': 'Analytics',
    '/design-projects': 'Design Projects', '/dev-projects': 'Dev Projects', '/team': 'Team',
    '/channels': 'Channels', '/courses': 'Classory', '/instagram': 'Instagram',
    '/chat': 'Messages', '/clients': 'Clients', '/revenue': 'Revenue',
    '/settings/notifications': 'Settings', '/recycle-bin': 'Recycle Bin', '/admin/notifications': 'Notifications'
  };

  return (
    <div className="flex h-screen bg-[#f5f3ef] overflow-hidden">
      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`${sidebarCollapsed ? 'w-[64px]' : 'w-[240px]'} bg-white border-r border-stone-200/80 hidden md:flex flex-col transition-all duration-300 relative`}>
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-stone-100 shrink-0">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20">I</div>
                <span className="font-extrabold text-[15px] text-stone-800 tracking-tight">Incrix</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm mx-auto shadow-md shadow-orange-500/20">I</div>
            )}
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
            {/* HOME */}
            <NavSection label="HOME" collapsed={sidebarCollapsed}>
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Home" active={isActive('/dashboard')} collapsed={sidebarCollapsed} />
              <NavItem href="/daily" icon={CheckSquare} label="My Tasks" active={isActive('/daily')} collapsed={sidebarCollapsed} />
              <NavItem href="/chat" icon={MessageSquare} label="Messages" active={isRouteActive('/chat')} collapsed={sidebarCollapsed} />
            </NavSection>

            {isManager && (
              <NavSection label="BUSINESS" collapsed={sidebarCollapsed}>
                <NavItem href="/clients" icon={Briefcase} label="Clients" active={isRouteActive('/clients')} collapsed={sidebarCollapsed} accent="amber" />
                <NavItem href="/revenue" icon={DollarSign} label="Revenue" active={isRouteActive('/revenue')} collapsed={sidebarCollapsed} accent="amber" />
                <NavItem href="/courses" icon={GraduationCap} label="Classory" active={isRouteActive('/courses')} collapsed={sidebarCollapsed} accent="violet" />
              </NavSection>
            )}

            <NavSection label="TEAMS" collapsed={sidebarCollapsed}>
              {TEAMS.filter(t => hasAnyRole(t.roles)).map(team => (
                <TeamItem key={team.id} team={team} expanded={expandedTeams[team.id]} onToggle={() => setExpandedTeams(p => ({ ...p, [team.id]: !p[team.id] }))} pathname={pathname} collapsed={sidebarCollapsed} />
              ))}
            </NavSection>

            {isManager && (
              <NavSection label="ADMIN" collapsed={sidebarCollapsed}>
                {hasAnyRole(['superadmin']) && <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={isActive('/analytics')} collapsed={sidebarCollapsed} />}
                <NavItem href="/team" icon={Users} label="Team" active={isActive('/team')} collapsed={sidebarCollapsed} />
                <NavItem href="/admin/notifications" icon={Bell} label="Notifications" active={isActive('/admin/notifications')} collapsed={sidebarCollapsed} />
                <NavItem href="/settings/notifications" icon={SettingsIcon} label="Settings" active={isActive('/settings/notifications')} collapsed={sidebarCollapsed} />
                <NavItem href="/recycle-bin" icon={Trash2} label="Recycle Bin" active={isActive('/recycle-bin')} collapsed={sidebarCollapsed} />
              </NavSection>
            )}
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-stone-100 shrink-0">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <UserAvatar user={currentUser} />
              <button onClick={handleLogout} className="text-stone-400 hover:text-rose-500 p-1"><LogOut size={15} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-50 transition-colors">
              <UserAvatar user={currentUser} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-stone-800 truncate">{currentUser.name}</div>
                <div className="text-[11px] text-stone-400 capitalize">{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} className="text-stone-300 hover:text-rose-500 transition-colors"><LogOut size={15} /></button>
            </div>
          )}
        </div>

        {/* Collapse btn */}
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-7 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-orange-600 hover:border-orange-300 transition-all z-10 shadow-sm">
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
          {/* Mobile menu btn */}
          <button className="md:hidden text-stone-500 hover:text-stone-800 mr-3" onClick={() => setShowMobileMenu(true)}>
            <Menu size={20} />
          </button>
          <h2 className="text-[15px] font-bold text-stone-800">{titles[pathname] || 'Incrix'}</h2>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-stone-400 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-all relative">
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
              </button>
              {showNotifications && <NotificationPanel notifications={notifications} onClose={() => setShowNotifications(false)} onMarkAllRead={handleMarkAllRead} onMarkAsRead={handleMarkAsRead} />}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto pb-[72px] md:pb-0">{children}</main>
      </div>

      {/* ── MOBILE NAV ───────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {[
            { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
            { href: '/board', icon: FolderKanban, label: 'Board' },
            { href: '/chat', icon: MessageSquare, label: 'Chat' },
            { href: '/daily', icon: CheckSquare, label: 'Tasks' },
          ].map(item => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center py-1.5">
                <div className={`flex flex-col items-center gap-0.5 ${active ? 'text-orange-600' : 'text-stone-400'}`}>
                  <Icon size={18} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
          <button onClick={() => setShowMobileMenu(true)} className="flex flex-col items-center py-1.5 text-stone-400">
            <MoreHorizontal size={18} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Mobile menu sheet */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-stone-800">Menu</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-1 text-stone-400"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { href: '/projects', icon: ListChecks, label: 'Projects' },
                { href: '/calendar', icon: CalendarIcon, label: 'Calendar' },
                { href: '/performance', icon: TrendingUp, label: 'Performance' },
                ...(isManager ? [
                  { href: '/clients', icon: Briefcase, label: 'Clients' },
                  { href: '/revenue', icon: DollarSign, label: 'Revenue' },
                  { href: '/courses', icon: GraduationCap, label: 'Classory' },
                ] : []),
                { href: '/design-projects', icon: Palette, label: 'Design' },
                { href: '/dev-projects', icon: Code, label: 'Dev' },
                { href: '/instagram', icon: Instagram, label: 'Instagram' },
                ...(isManager ? [
                  { href: '/team', icon: Users, label: 'Team' },
                  { href: '/settings/notifications', icon: SettingsIcon, label: 'Settings' },
                ] : []),
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${isRouteActive(item.href) ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <Icon size={20} />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <button onClick={handleLogout} className="mt-4 w-full py-2.5 rounded-xl border border-rose-200 text-rose-500 text-sm font-medium hover:bg-rose-50 flex items-center justify-center gap-2">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavSection({ label, collapsed, children }) {
  return (
    <div>
      {!collapsed && <div className="px-3 mb-1 text-[10px] font-bold text-stone-300 uppercase tracking-[0.15em]">{label}</div>}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, collapsed, accent }) {
  const activeStyles = accent === 'amber'
    ? 'bg-amber-50 text-amber-700 border-l-2 border-l-amber-500 font-semibold'
    : accent === 'violet'
    ? 'bg-violet-50 text-violet-700 border-l-2 border-l-violet-500 font-semibold'
    : 'bg-orange-50 text-orange-700 border-l-2 border-l-orange-500 font-semibold';
  return (
    <Link href={href}>
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg text-[13px] transition-all ${
        active ? activeStyles : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
      }`} title={collapsed ? label : undefined}>
        <Icon size={17} className="shrink-0" />
        {!collapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}

function TeamItem({ team, expanded, onToggle, pathname, collapsed }) {
  const active = team.sub.some(s => pathname === s.href);
  if (collapsed) {
    return (
      <Link href={team.sub[0]?.href || '/dashboard'}>
        <div className={`flex justify-center py-2 px-2 rounded-lg text-lg cursor-pointer transition-all ${active ? 'bg-stone-100' : 'hover:bg-stone-50'}`} title={team.label}>
          {team.emoji}
        </div>
      </Link>
    );
  }
  return (
    <div>
      <button onClick={onToggle} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
        active || expanded ? 'text-stone-800 bg-stone-50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
      }`}>
        <span className="text-base leading-none">{team.emoji}</span>
        <span className="flex-1 text-left">{team.label}</span>
        <ChevronDown size={13} className={`text-stone-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-5 pl-3 mt-0.5 space-y-0.5 border-l border-stone-150">
          {team.sub.map(sub => {
            const SubIcon = sub.icon;
            const subActive = pathname === sub.href;
            return (
              <Link key={sub.href} href={sub.href}>
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all ${
                  subActive ? `font-semibold ${team.activeText} ${team.activeBg}` : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                }`}>
                  <SubIcon size={13} />
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

function UserAvatar({ user }) {
  if (user.profilePhoto) return <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  return (
    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs ${user.avatarColor || 'bg-orange-500'}`}>
      {user.name?.charAt(0) || '?'}
    </div>
  );
}

export default function ProtectedLayout({ children }) {
  return <AuthProvider><UIProvider><ProtectedLayoutInner>{children}</ProtectedLayoutInner></UIProvider></AuthProvider>;
}
