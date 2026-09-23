import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { cn } from '../lib/utils';
import NotificationBell from '../components/notifications/NotificationBell';
import GlobalSearch from '../components/common/GlobalSearch';
import { MediQIcon } from '../components/common/MediQIcon';

const baseNavigation = [
  { name: 'Overview', to: '/dashboard/overview', icon: 'overview' as const },
  { name: 'Patients', to: '/dashboard/patients', icon: 'patients' as const },
  { name: 'Observations', to: '/dashboard/observations', icon: 'observations' as const },
  { name: 'Handovers', to: '/dashboard/handovers', icon: 'handovers' as const },
  { name: 'Guidance', to: '/dashboard/guidance', icon: 'guidance' as const },
  { name: 'Caregiver Support', to: '/dashboard/support', icon: 'support' as const },
  { name: 'Notifications', to: '/dashboard/notifications', icon: 'notifications' as const },
  { name: 'Settings', to: '/dashboard/settings', icon: 'settings' as const },
];

export default function DashboardLayout() {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const role = user?.user_metadata?.system_role || 'caregiver';
  const navigation = role === 'patient' ? [
    { name: 'My space', to: '/dashboard/patient', icon: 'overview' as const },
    { name: 'My reports', to: '/dashboard/reports', icon: 'reports' as const },
    { name: 'Notifications', to: '/dashboard/notifications', icon: 'notifications' as const },
    { name: 'Settings', to: '/dashboard/settings', icon: 'settings' as const },
  ] : baseNavigation;

  return (
    <div className="mediq-dashboard-shell min-h-screen bg-transparent text-white md:flex">
      <aside className={cn('w-72 shrink-0 border-r border-white/20 bg-[#0a67d2]/40 backdrop-blur-[18px] md:sticky md:top-0 md:h-screen', mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden md:flex', 'flex-col')}>
        <div className="px-6 pt-7 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A5CFF] flex items-center justify-center font-heading font-bold tracking-tight">MQ</div>
              <div><p className="font-heading text-xl font-bold">MediQ</p><p className="text-[11px] text-white/45 uppercase tracking-[0.18em] mt-0.5">Care intelligence</p></div>
            </div>
            <button className="md:hidden text-white/60" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><MediQIcon name="close" /></button>
          </div>
        </div>

        <div className="px-5 pt-6 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Workspace</div>
        <nav className="px-3 space-y-1.5 overflow-y-auto flex-1">
          {navigation.map((item) => (
            <NavLink key={item.name} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => cn('group flex items-center gap-3 px-3.5 py-3 rounded-[12px] text-sm font-medium transition-all duration-300', isActive ? 'bg-white text-[#16345f] shadow-sm' : 'text-white/90 hover:text-white hover:bg-white/10')}>
              {({ isActive }) => (
                <>
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors', isActive ? 'text-[#16345f]' : 'text-white/90 group-hover:text-white')}><MediQIcon name={item.icon} size={18} /></span>
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-5 border-t border-white/10">
          <div className="rounded-[16px] border border-white/30 bg-white/15 p-4 mb-3 backdrop-blur-[14px]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/75">Signed in as</p>
            <p className="text-sm font-semibold mt-1 truncate text-white">{user?.user_metadata?.full_name || user?.email || 'MediQ user'}</p>
            <p className="text-xs text-white/75 mt-1 capitalize">{String(role).replace(/_/g, ' ')}</p>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-medium text-white hover:bg-white/10 transition-colors"><MediQIcon name="logout" size={18} className="text-white" />Sign out</button>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-[#061024]/75 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <main className="min-w-0 flex-1 bg-transparent">
        <header className="h-[72px] border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 bg-transparent backdrop-blur-sm">
          <div className="flex items-center gap-3"><button className="md:hidden text-white/70" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><MediQIcon name="menu" /></button><div><p className="text-[10px] uppercase tracking-[0.18em] text-white/35">MediQ workspace</p><p className="font-heading text-sm font-semibold text-white/85">{navigation.find(n => location.pathname.startsWith(n.to))?.name || 'Workspace'}</p></div></div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationBell />
          </div>
        </header>
        <div className="relative min-h-[calc(100vh-72px)] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-[#1A5CFF]/[0.035]" />
          <div className="relative max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10"><Outlet /></div>
        </div>
      </main>
    </div>
  );
}
