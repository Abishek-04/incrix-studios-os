'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderKanban, ListChecks, Calendar as CalendarIcon,
  CheckSquare, Users, Settings as SettingsIcon, Bell, LogOut,
  ChevronLeft, ChevronRight, TrendingUp, Palette, Code,
  Instagram, BarChart3, Trash2, GraduationCap, MoreHorizontal, X,
  MessageSquare, Briefcase, DollarSign, Radio, Menu, Sun, Moon,
  Mail as MailIcon
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';
import { UIProvider } from '@/contexts/UIContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { logout as apiLogout, fetchWithAuth } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
function urlB64(s) { const p = '='.repeat((4 - (s.length % 4)) % 4); const b = (s + p).replace(/-/g, '+').replace(/_/g, '/'); const r = atob(b); const o = new Uint8Array(r.length); for (let i = 0; i < r.length; ++i) o[i] = r.charCodeAt(i); return o; }
async function subPush(uid) { if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return; try { const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription(); if (!sub) { if ((await Notification.requestPermission()) !== 'granted') return; sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(VAPID_PUBLIC_KEY) }); } await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, subscription: sub.toJSON() }) }); } catch (_) {} }

const TEAMS = [
  { id: 'content', label: 'Content', emoji: '🎬', href: '/team-view/content', gradient: 'from-indigo-500 to-blue-500' },
  { id: 'editing', label: 'Editing', emoji: '✂️', href: '/team-view/editing', gradient: 'from-violet-500 to-purple-500' },
  { id: 'design', label: 'Design', emoji: '🎨', href: '/team-view/design', gradient: 'from-pink-500 to-rose-500' },
  { id: 'dev', label: 'Dev', emoji: '💻', href: '/team-view/dev', gradient: 'from-cyan-500 to-teal-500' },
  { id: 'marketing', label: 'Marketing', emoji: '📣', href: '/team-view/marketing', gradient: 'from-amber-500 to-orange-500' },
  { id: 'hardware', label: 'Hardware', emoji: '🔧', href: '/team-view/hardware', gradient: 'from-emerald-500 to-green-500' },
];

function ProtectedLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [mailUnread, setMailUnread] = useState(false);

  useEffect(() => { if (!loading && !currentUser) router.push('/'); }, [loading, currentUser, router]);
  useEffect(() => { setMobileMenu(false); }, [pathname]);

  const fetchNotif = useCallback(async (uid) => { try { const r = await fetchWithAuth(`/api/notifications?userId=${uid}&limit=50`); if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); } } catch (_) {} }, []);

  // Fetch unread chat + mail counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const [chatRes, mailRes] = await Promise.allSettled([
        fetchWithAuth('/api/chat/channels').then(r => r.json()),
        fetchWithAuth('/api/mail?folder=inbox&page=1').then(r => r.json()),
      ]);
      if (chatRes.status === 'fulfilled') {
        const channels = chatRes.value.channels || [];
        const dms = chatRes.value.dms || [];
        let unreadChats = 0;
        const allChats = [...channels, ...dms];
        for (const ch of allChats) {
          if (!ch.lastMessage || !ch.lastMessageAt) continue;
          if (ch.lastMessageBy === currentUser.name) continue;
          const lastRead = ch.lastReadBy?.[currentUser.id];
          if (!lastRead || new Date(lastRead) < new Date(ch.lastMessageAt)) {
            unreadChats++;
          }
        }
        setChatUnread(unreadChats);
      }
      if (mailRes.status === 'fulfilled') {
        setMailUnread((mailRes.value.unread || 0) > 0);
      }
    } catch (_) {}
  }, [currentUser?.id, currentUser?.name]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchNotif(currentUser.id);
    fetchUnreadCounts();
    const iv = setInterval(() => {
      fetch('/api/reminders/check').catch(() => {});
      fetchNotif(currentUser.id);
      fetchUnreadCounts();
    }, 30000);
    return () => clearInterval(iv);
  }, [currentUser?.id, fetchNotif, fetchUnreadCounts]);

  useEffect(() => { if (currentUser?.id) subPush(currentUser.id); }, [currentUser?.id]);

  if (loading || !currentUser) return <LoadingScreen />;

  const logout = async () => { await apiLogout(); router.push('/'); };
  const markAllRead = async () => { setNotifications(p => p.map(n => ({ ...n, read: true }))); try { await fetchWithAuth('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true, userId: currentUser.id }) }); } catch (_) {} };
  const markRead = async (id) => { setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); try { await fetchWithAuth('/api/notifications', { method: 'PATCH', body: JSON.stringify({ notificationIds: [id], userId: currentUser.id }) }); } catch (_) {} };

  const isActive = (p) => pathname === p;
  const isRoute = (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?');
  const roles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role].filter(Boolean);
  const hasRole = (r) => r.some(x => roles.includes(x));
  const isMgr = hasRole(['superadmin', 'manager']);
  const unread = notifications.filter(n => !n.read).length;

  const teamName = pathname.startsWith('/team-view/') ? pathname.split('/')[2] : null;
  const teamLabels = { content: 'Content Team', editing: 'Editing Team', design: 'Design Team', dev: 'Dev Team', marketing: 'Marketing', hardware: 'Hardware' };
  const titles = { '/dashboard': 'Home', '/projects': 'Projects', '/board': 'Board', '/calendar': 'Calendar', '/daily': 'My Tasks', '/performance': 'Overview', '/analytics': 'Analytics', '/design-projects': 'Design', '/dev-projects': 'Development', '/team': 'Team', '/channels': 'Channels', '/courses': 'Classory', '/instagram': 'Instagram', '/chat': 'Messages', '/mail': 'Mail', '/clients': 'Clients', '/revenue': 'Revenue', '/marketing': 'Marketing', '/settings/notifications': 'Settings', '/recycle-bin': 'Recycle Bin', '/admin/notifications': 'Notifications', ...(teamName ? { [pathname]: teamLabels[teamName] || teamName } : {}) };

  const isDark = theme === 'dark';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* SIDEBAR */}
      <aside className={`${collapsed ? 'w-[72px]' : 'w-[240px]'} hidden md:flex flex-col relative border-r`} style={{ transition: 'width 250ms cubic-bezier(0.23,1,0.32,1)' }}
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b shrink-0" style={{ borderColor: 'var(--border-light)' }}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-500/25">I</div>
            {!collapsed && <span className="ml-3 font-black text-lg" style={{ color: 'var(--text)' }}>Incrix</span>}
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-7 scrollbar-none">
            {/* MAIN */}
            <div className="space-y-1">
              {!collapsed && <SectionLabel>Main</SectionLabel>}
              <NavLink href="/dashboard" icon={LayoutDashboard} label="Home" active={isActive('/dashboard')} collapsed={collapsed} />
              <NavLink href="/projects" icon={ListChecks} label="Projects" active={isActive('/projects')} collapsed={collapsed} />
              <NavLink href="/board" icon={FolderKanban} label="Board" active={isActive('/board')} collapsed={collapsed} />
              <NavLink href="/calendar" icon={CalendarIcon} label="Calendar" active={isActive('/calendar')} collapsed={collapsed} />
              <NavLink href="/daily" icon={CheckSquare} label="My Tasks" active={isActive('/daily')} collapsed={collapsed} />
              <NavLink href="/chat" icon={MessageSquare} label="Messages" active={isRoute('/chat')} collapsed={collapsed} badge={chatUnread} />
              <NavLink href="/mail" icon={MailIcon} label="Mail" active={isRoute('/mail')} collapsed={collapsed} badgeDot={mailUnread} />
              <NavLink href="/performance" icon={TrendingUp} label="Overview" active={isActive('/performance')} collapsed={collapsed} />
            </div>

            {/* TEAMS */}
            <div className="space-y-1">
              {!collapsed && <SectionLabel>Teams</SectionLabel>}
              {TEAMS.filter(() => isMgr || hasRole(['creator', 'editor', 'designer', 'developer'])).map(t => (
                <Link key={t.id} href={t.href}>
                  <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-2xl text-[14px] font-semibold transition-all ${
                    isRoute(t.href.split('?')[0]) ? 'shadow-sm' : 'hover:opacity-80'
                  }`} style={{
                    background: isRoute(t.href.split('?')[0]) ? 'var(--primary-light)' : 'transparent',
                    color: isRoute(t.href.split('?')[0]) ? 'var(--primary)' : 'var(--text-secondary)'
                  }} title={collapsed ? t.label : undefined}>
                    <span className="text-xl leading-none">{t.emoji}</span>
                    {!collapsed && <span>{t.label}</span>}
                  </div>
                </Link>
              ))}
            </div>

            {/* BUSINESS */}
            {isMgr && (
              <div className="space-y-1">
                {!collapsed && <SectionLabel>Business</SectionLabel>}
                <NavLink href="/clients" icon={Briefcase} label="Clients" active={isRoute('/clients')} collapsed={collapsed} />
                <NavLink href="/revenue" icon={DollarSign} label="Revenue" active={isRoute('/revenue')} collapsed={collapsed} />
                <NavLink href="/courses" icon={GraduationCap} label="Classory" active={isRoute('/courses')} collapsed={collapsed} />
              </div>
            )}

            {/* ADMIN */}
            {isMgr && (
              <div className="space-y-1">
                {!collapsed && <SectionLabel>Admin</SectionLabel>}
                <NavLink href="/team" icon={Users} label="Team" active={isActive('/team')} collapsed={collapsed} />
                <NavLink href="/instagram" icon={Instagram} label="Instagram" active={isActive('/instagram')} collapsed={collapsed} />
                <NavLink href="/recycle-bin" icon={Trash2} label="Recycle Bin" active={isActive('/recycle-bin')} collapsed={collapsed} />
                <NavLink href="/settings/notifications" icon={SettingsIcon} label="Settings" active={isActive('/settings/notifications')} collapsed={collapsed} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="p-3 border-t shrink-0 space-y-2" style={{ borderColor: 'var(--border-light)' }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-3'} py-2.5 rounded-2xl text-[13px] font-medium transition-all`}
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {/* User */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <Av user={currentUser} />
              <button onClick={logout} className="p-1" style={{ color: 'var(--text-muted)' }}><LogOut size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl" style={{ background: 'var(--bg-input)' }}>
              <Av user={currentUser} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{currentUser.name}</div>
                <div className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{currentUser.role}</div>
              </div>
              <button onClick={logout} style={{ color: 'var(--text-muted)' }} className="hover:text-rose-500"><LogOut size={14} /></button>
            </div>
          )}
        </div>

        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-10 border shadow-sm transition-all hover:scale-110"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 backdrop-blur-xl border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-20"
          style={{ background: 'var(--bg-header)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden" style={{ color: 'var(--text-secondary)' }} onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{titles[pathname] || 'Incrix'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile theme toggle */}
            <button onClick={toggleTheme} className="md:hidden p-2 rounded-xl transition-all" style={{ color: 'var(--text-secondary)' }}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-xl transition-all relative" style={{ color: 'var(--text-secondary)' }}>
                <Bell size={19} />
                {unread > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2" style={{ borderColor: 'var(--bg-header)' }} />}
              </button>
              {showNotif && <NotificationPanel notifications={notifications} onClose={() => setShowNotif(false)} onMarkAllRead={markAllRead} onMarkAsRead={markRead} />}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl" style={{ background: 'var(--bg-header)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-5 py-1.5">
          {[{ href: '/dashboard', icon: LayoutDashboard, label: 'Home' }, { href: '/board', icon: FolderKanban, label: 'Board' }, { href: '/chat', icon: MessageSquare, label: 'Chat' }, { href: '/daily', icon: CheckSquare, label: 'Tasks' }].map(i => {
            const Icon = i.icon;
            return <Link key={i.href} href={i.href} className="flex flex-col items-center py-1"><div className={`flex flex-col items-center gap-0.5 ${isRoute(i.href) ? 'text-[var(--primary)]' : ''}`} style={{ color: isRoute(i.href) ? 'var(--primary)' : 'var(--text-muted)' }}><Icon size={20} /><span className="text-[9px] font-bold">{i.label}</span></div></Link>;
          })}
          <button onClick={() => setMobileMenu(true)} className="flex flex-col items-center py-1" style={{ color: 'var(--text-muted)' }}><MoreHorizontal size={20} /><span className="text-[9px] font-bold">More</span></button>
        </div>
      </div>

      {/* MOBILE SHEET */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[80vh] overflow-auto p-5" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><span className="font-bold text-lg" style={{ color: 'var(--text)' }}>Menu</span><button onClick={() => setMobileMenu(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button></div>
            <div className="grid grid-cols-3 gap-2.5">
              {[{ href: '/projects', icon: ListChecks, label: 'Projects' }, { href: '/calendar', icon: CalendarIcon, label: 'Calendar' }, { href: '/performance', icon: TrendingUp, label: 'Performance' },
                ...(isMgr ? [{ href: '/clients', icon: Briefcase, label: 'Clients' }, { href: '/revenue', icon: DollarSign, label: 'Revenue' }, { href: '/marketing', icon: BarChart3, label: 'Marketing' }] : []),
                { href: '/instagram', icon: Instagram, label: 'Instagram' },
                ...(isMgr ? [{ href: '/team', icon: Users, label: 'Team' }, { href: '/settings/notifications', icon: SettingsIcon, label: 'Settings' }] : [])
              ].map(i => { const Icon = i.icon; return <Link key={i.href} href={i.href} onClick={() => setMobileMenu(false)} className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl transition-all" style={{ background: isRoute(i.href) ? 'var(--primary-light)' : 'var(--bg-input)', color: isRoute(i.href) ? 'var(--primary)' : 'var(--text-secondary)' }}><Icon size={22} /><span className="text-[11px] font-bold">{i.label}</span></Link>; })}
            </div>
            <button onClick={logout} className="mt-4 w-full py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}><LogOut size={16} />Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="px-3 mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{children}</div>;
}

function NavLink({ href, icon: Icon, label, active, collapsed, badge, badgeDot }) {
  return (
    <Link href={href}>
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-2xl text-[14px] font-semibold transition-all relative`}
        style={{
          background: active ? 'var(--primary-light)' : 'transparent',
          color: active ? 'var(--primary)' : 'var(--text-secondary)'
        }} title={collapsed ? label : undefined}>
        <div className="relative shrink-0">
          <Icon size={20} />
          {collapsed && badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-1" style={{ background: 'var(--danger)' }}>{badge > 9 ? '9+' : badge}</span>
          )}
          {collapsed && badgeDot && !badge && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
          )}
        </div>
        {!collapsed && <span className="flex-1">{label}</span>}
        {!collapsed && badge > 0 && (
          <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5" style={{ background: 'var(--danger)' }}>{badge > 99 ? '99+' : badge}</span>
        )}
        {!collapsed && badgeDot && !badge && (
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
        )}
      </div>
    </Link>
  );
}

function Av({ user }) {
  if (user.profilePhoto) return <img src={user.profilePhoto} alt={user.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />;
  return <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm ${user.avatarColor || 'bg-indigo-500'}`}>{user.name?.charAt(0) || '?'}</div>;
}

export default function ProtectedLayout({ children }) {
  return <AuthProvider><ThemeProvider><UIProvider><ProtectedLayoutInner>{children}</ProtectedLayoutInner></UIProvider></ThemeProvider></AuthProvider>;
}
