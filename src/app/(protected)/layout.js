'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderKanban, ListChecks, Calendar as CalendarIcon,
  CheckSquare, Users, Settings as SettingsIcon, Bell, LogOut,
  ChevronLeft, ChevronRight, TrendingUp, Palette, Code,
  Instagram, BarChart3, Trash2, GraduationCap, MoreHorizontal, X,
  MessageSquare, Briefcase, DollarSign, Radio, Menu
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';
import { UIProvider } from '@/contexts/UIContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { logout as apiLogout, fetchWithAuth } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
function urlBase64ToUint8Array(base64String) { const padding = '='.repeat((4 - (base64String.length % 4)) % 4); const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/'); const rawData = atob(base64); const o = new Uint8Array(rawData.length); for (let i = 0; i < rawData.length; ++i) o[i] = rawData.charCodeAt(i); return o; }
async function subscribeToPush(userId) { if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return; try { const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription(); if (!sub) { if ((await Notification.requestPermission()) !== 'granted') return; sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }); } await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, subscription: sub.toJSON() }) }); } catch (_) {} }

const TEAM_NAV = [
  { id: 'content', label: 'Content', emoji: '🎬', color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/performance?team=content' },
  { id: 'editing', label: 'Editing', emoji: '✂️', color: 'text-violet-600', bg: 'bg-violet-50', href: '/performance?team=editing' },
  { id: 'design', label: 'Design', emoji: '🎨', color: 'text-pink-600', bg: 'bg-pink-50', href: '/design-projects' },
  { id: 'dev', label: 'Dev', emoji: '💻', color: 'text-cyan-600', bg: 'bg-cyan-50', href: '/dev-projects' },
  { id: 'marketing', label: 'Marketing', emoji: '📣', color: 'text-amber-600', bg: 'bg-amber-50', href: '/instagram' },
  { id: 'hardware', label: 'Hardware', emoji: '🔧', color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/clients?service=hardware' },
];

function ProtectedLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => { if (!loading && !currentUser) router.push('/'); }, [loading, currentUser, router]);
  useEffect(() => { setShowMobileMenu(false); }, [pathname]);

  const fetchNotifications = useCallback(async (userId) => {
    try { const res = await fetchWithAuth(`/api/notifications?userId=${userId}&limit=50`); if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); } } catch (_) {}
  }, []);

  useEffect(() => { if (!currentUser?.id) return; fetchNotifications(currentUser.id); const iv = setInterval(() => { fetch('/api/reminders/check').catch(() => {}); fetchNotifications(currentUser.id); }, 30000); fetch('/api/reminders/check').catch(() => {}); return () => clearInterval(iv); }, [currentUser?.id, fetchNotifications]);
  useEffect(() => { if (currentUser?.id) subscribeToPush(currentUser.id); }, [currentUser?.id]);

  if (loading || !currentUser) return <LoadingScreen />;

  const handleLogout = async () => { await apiLogout(); router.push('/'); };
  const handleMarkAllRead = async () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); try { await fetchWithAuth('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true, userId: currentUser.id }) }); } catch (_) {} };
  const handleMarkAsRead = async (id) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); try { await fetchWithAuth('/api/notifications', { method: 'PATCH', body: JSON.stringify({ notificationIds: [id], userId: currentUser.id }) }); } catch (_) {} };

  const active = (p) => pathname === p;
  const routeActive = (p) => pathname === p || pathname.startsWith(p + '/');
  const userRoles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role].filter(Boolean);
  const hasRole = (roles) => roles.some(r => userRoles.includes(r));
  const isManager = hasRole(['superadmin', 'manager']);
  const unread = notifications.filter(n => !n.read).length;

  const titles = { '/dashboard': 'Home', '/projects': 'Projects', '/board': 'Board', '/calendar': 'Calendar', '/daily': 'My Tasks', '/performance': 'Performance', '/analytics': 'Analytics', '/design-projects': 'Design', '/dev-projects': 'Development', '/team': 'Team', '/channels': 'Channels', '/courses': 'Classory', '/instagram': 'Instagram', '/chat': 'Messages', '/clients': 'Clients', '/revenue': 'Revenue', '/settings/notifications': 'Settings', '/recycle-bin': 'Recycle Bin', '/admin/notifications': 'Notifications' };

  return (
    <div className="flex h-screen bg-[#faf9f7] overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-stone-200/70 hidden md:flex flex-col transition-all duration-200 relative`}>
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-stone-100 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-200">I</div>
            {!collapsed && <span className="ml-2.5 font-extrabold text-[15px] text-stone-800">Incrix</span>}
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-6">
            {/* MAIN */}
            <div className="space-y-0.5">
              {!collapsed && <div className="px-3 mb-1 text-[9px] font-extrabold text-stone-300 uppercase tracking-[0.2em]">Main</div>}
              <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Home" active={active('/dashboard')} collapsed={collapsed} />
              <SidebarLink href="/projects" icon={ListChecks} label="Projects" active={active('/projects')} collapsed={collapsed} />
              <SidebarLink href="/board" icon={FolderKanban} label="Board" active={active('/board')} collapsed={collapsed} />
              <SidebarLink href="/calendar" icon={CalendarIcon} label="Calendar" active={active('/calendar')} collapsed={collapsed} />
              <SidebarLink href="/daily" icon={CheckSquare} label="My Tasks" active={active('/daily')} collapsed={collapsed} />
              <SidebarLink href="/chat" icon={MessageSquare} label="Messages" active={routeActive('/chat')} collapsed={collapsed} />
            </div>

            {/* TEAMS */}
            <div className="space-y-0.5">
              {!collapsed && <div className="px-3 mb-1 text-[9px] font-extrabold text-stone-300 uppercase tracking-[0.2em]">Teams</div>}
              {TEAM_NAV.filter(t => isManager || hasRole(['creator', 'editor', 'designer', 'developer'])).map(t => (
                <Link key={t.id} href={t.href}>
                  <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-xl text-[13px] font-medium transition-all ${
                    routeActive(t.href.split('?')[0]) ? `${t.bg} ${t.color} font-semibold` : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`} title={collapsed ? t.label : undefined}>
                    <span className="text-base leading-none">{t.emoji}</span>
                    {!collapsed && <span>{t.label}</span>}
                  </div>
                </Link>
              ))}
            </div>

            {/* BUSINESS */}
            {isManager && (
              <div className="space-y-0.5">
                {!collapsed && <div className="px-3 mb-1 text-[9px] font-extrabold text-stone-300 uppercase tracking-[0.2em]">Business</div>}
                <SidebarLink href="/clients" icon={Briefcase} label="Clients" active={routeActive('/clients')} collapsed={collapsed} accent="amber" />
                <SidebarLink href="/revenue" icon={DollarSign} label="Revenue" active={routeActive('/revenue')} collapsed={collapsed} accent="amber" />
                <SidebarLink href="/courses" icon={GraduationCap} label="Classory" active={routeActive('/courses')} collapsed={collapsed} accent="violet" />
              </div>
            )}

            {/* ADMIN */}
            {isManager && (
              <div className="space-y-0.5">
                {!collapsed && <div className="px-3 mb-1 text-[9px] font-extrabold text-stone-300 uppercase tracking-[0.2em]">Admin</div>}
                {hasRole(['superadmin']) && <SidebarLink href="/analytics" icon={BarChart3} label="Analytics" active={active('/analytics')} collapsed={collapsed} />}
                <SidebarLink href="/team" icon={Users} label="Team" active={active('/team')} collapsed={collapsed} />
                <SidebarLink href="/instagram" icon={Instagram} label="Instagram" active={active('/instagram')} collapsed={collapsed} />
                <SidebarLink href="/settings/notifications" icon={SettingsIcon} label="Settings" active={active('/settings/notifications')} collapsed={collapsed} />
              </div>
            )}
          </div>
        </div>

        {/* User */}
        <div className="p-2.5 border-t border-stone-100 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <Avatar user={currentUser} />
              <button onClick={handleLogout} className="text-stone-300 hover:text-rose-500 p-1"><LogOut size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-stone-50">
              <Avatar user={currentUser} />
              <div className="flex-1 min-w-0"><div className="text-[12px] font-semibold text-stone-700 truncate">{currentUser.name}</div><div className="text-[10px] text-stone-400 capitalize">{currentUser.role}</div></div>
              <button onClick={handleLogout} className="text-stone-300 hover:text-rose-500"><LogOut size={14} /></button>
            </div>
          )}
        </div>

        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-7 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-orange-600 hover:border-orange-300 transition-all z-10 shadow-sm">
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white/80 backdrop-blur-xl border-b border-stone-200/50 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
          <button className="md:hidden text-stone-500 mr-3" onClick={() => setShowMobileMenu(true)}><Menu size={20} /></button>
          <h2 className="text-sm font-bold text-stone-800">{titles[pathname] || 'Incrix'}</h2>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-stone-400 hover:text-orange-600 rounded-xl hover:bg-orange-50 relative">
                <Bell size={17} />
                {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
              </button>
              {showNotifications && <NotificationPanel notifications={notifications} onClose={() => setShowNotifications(false)} onMarkAllRead={handleMarkAllRead} onMarkAsRead={handleMarkAsRead} />}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 py-1">
          {[{ href: '/dashboard', icon: LayoutDashboard, label: 'Home' }, { href: '/board', icon: FolderKanban, label: 'Board' }, { href: '/chat', icon: MessageSquare, label: 'Chat' }, { href: '/daily', icon: CheckSquare, label: 'Tasks' }].map(i => {
            const Icon = i.icon;
            return <Link key={i.href} href={i.href} className="flex flex-col items-center py-1.5"><div className={`flex flex-col items-center gap-0.5 ${routeActive(i.href) ? 'text-orange-600' : 'text-stone-400'}`}><Icon size={17} /><span className="text-[9px] font-semibold">{i.label}</span></div></Link>;
          })}
          <button onClick={() => setShowMobileMenu(true)} className="flex flex-col items-center py-1.5 text-stone-400"><MoreHorizontal size={17} /><span className="text-[9px] font-semibold">More</span></button>
        </div>
      </div>

      {/* MOBILE SHEET */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><span className="font-bold text-stone-800">Menu</span><button onClick={() => setShowMobileMenu(false)} className="text-stone-400"><X size={18} /></button></div>
            <div className="grid grid-cols-3 gap-2">
              {[{ href: '/projects', icon: ListChecks, label: 'Projects' }, { href: '/calendar', icon: CalendarIcon, label: 'Calendar' }, { href: '/performance', icon: TrendingUp, label: 'Performance' },
                ...(isManager ? [{ href: '/clients', icon: Briefcase, label: 'Clients' }, { href: '/revenue', icon: DollarSign, label: 'Revenue' }, { href: '/courses', icon: GraduationCap, label: 'Classory' }] : []),
                { href: '/instagram', icon: Instagram, label: 'Instagram' },
                ...(isManager ? [{ href: '/team', icon: Users, label: 'Team' }, { href: '/settings/notifications', icon: SettingsIcon, label: 'Settings' }] : [])
              ].map(i => { const Icon = i.icon; return <Link key={i.href} href={i.href} onClick={() => setShowMobileMenu(false)} className={`flex flex-col items-center gap-1 p-3 rounded-2xl ${routeActive(i.href) ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}><Icon size={18} /><span className="text-[10px] font-semibold">{i.label}</span></Link>; })}
            </div>
            <button onClick={handleLogout} className="mt-4 w-full py-2.5 rounded-xl border border-rose-200 text-rose-500 text-sm font-medium flex items-center justify-center gap-2"><LogOut size={14} />Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label, active, collapsed, accent }) {
  const cls = active
    ? accent === 'amber' ? 'bg-amber-50 text-amber-700 font-semibold' : accent === 'violet' ? 'bg-violet-50 text-violet-700 font-semibold' : 'bg-orange-50 text-orange-700 font-semibold'
    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50';
  return (
    <Link href={href}>
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-xl text-[13px] font-medium transition-all ${cls}`} title={collapsed ? label : undefined}>
        <Icon size={16} className="shrink-0" />
        {!collapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}

function Avatar({ user }) {
  if (user.profilePhoto) return <img src={user.profilePhoto} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-[10px] ${user.avatarColor || 'bg-orange-500'}`}>{user.name?.charAt(0) || '?'}</div>;
}

export default function ProtectedLayout({ children }) {
  return <AuthProvider><UIProvider><ProtectedLayoutInner>{children}</ProtectedLayoutInner></UIProvider></AuthProvider>;
}
