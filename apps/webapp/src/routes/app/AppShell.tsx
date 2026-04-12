import { PropsWithChildren, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Activity, CircleHelp, Gauge, History, LogOut, Moon, Shield, Sun, Tags, UserCog, Workflow } from 'lucide-react';
import { useAuthStore } from '../../store/AuthStore';
import { useThemeStore } from '../../store/ThemeStore';
import { getRoleFromToken } from '../../lib/jwt';
import AboutModal from '../../components/About/AboutModal';
import { Notifications } from '../../components/Common/Notifications';
import { useNotifications } from '../../hooks/useNotifications';

const navigation = [
  { to: '/', label: 'Workspace', icon: Workflow },
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/history', label: 'Histórico', icon: History },
  { to: '/tags', label: 'Tags', icon: Tags },
  { to: '/profile', label: 'Perfil', icon: UserCog },
] as const;

export function AppShell({ children }: PropsWithChildren) {
  const [showAbout, setShowAbout] = useState(false);
  useNotifications();
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const { theme, toggle } = useThemeStore();
  const location = useRouterState({ select: (s) => s.location.pathname });
  const role = getRoleFromToken(token);
  const isAdmin = role === 'admin';
  const canAccessConnectivity = role === 'admin' || role === 'operador';

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--tx-1)' }}
    >
      <aside
        className="flex w-48 shrink-0 flex-col"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
            Radare
          </p>
          <p className="text-xs font-semibold" style={{ color: 'var(--tx-1)' }}>
            Data Recon
          </p>
        </div>

        <nav className="flex flex-col gap-px p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = location === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 rounded px-3 py-2 text-xs font-medium transition"
                style={
                  active
                    ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)', borderRadius: '4px' }
                    : { color: 'var(--tx-2)' }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--tx-1)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--tx-2)';
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          {canAccessConnectivity && (() => {
            const active = location === '/connectivity';
            return (
              <Link
                to="/connectivity"
                className="flex items-center gap-2 rounded px-3 py-2 text-xs font-medium transition"
                style={
                  active
                    ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)', borderRadius: '4px' }
                    : { color: 'var(--tx-2)' }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--tx-1)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--tx-2)';
                }}
              >
                <Activity className="h-3.5 w-3.5 shrink-0" />
                Conectividade
              </Link>
            );
          })()}
          {isAdmin && (() => {
            const active = location === '/admin';
            return (
              <Link
                to="/admin"
                className="flex items-center gap-2 rounded px-3 py-2 text-xs font-medium transition"
                style={
                  active
                    ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)', borderRadius: '4px' }
                    : { color: 'var(--tx-2)' }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--tx-1)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--tx-2)';
                }}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                Admin
              </Link>
            );
          })()}
        </nav>

        <div
          className="mt-auto flex flex-col gap-px p-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2 rounded px-3 py-2 text-xs transition"
            style={{ color: 'var(--tx-2)' }}
          >
            {theme === 'light'
              ? <Moon className="h-3.5 w-3.5 shrink-0" />
              : <Sun className="h-3.5 w-3.5 shrink-0" />}
            Tema: {theme === 'industrial' ? 'Industrial' : theme === 'light' ? 'Light' : 'Dark'}
          </button>
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 rounded px-3 py-2 text-xs transition"
            style={{ color: 'var(--tx-2)' }}
          >
            <CircleHelp className="h-3.5 w-3.5 shrink-0" />
            Sobre
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded px-3 py-2 text-xs transition"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>

      <AboutModal
        showAbout={showAbout}
        toggleAboutPopup={() => setShowAbout((v) => !v)}
      />
      <Notifications />
    </div>
  );
}
