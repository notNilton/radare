import { PropsWithChildren, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Activity, CircleHelp, Gauge, History, LogOut, Menu, Moon, Shield, Sun, Tags, UserCog, Workflow, X } from 'lucide-react';
import { useAuthStore } from '../../store/AuthStore';
import { useThemeStore } from '../../store/ThemeStore';
import { getRoleFromToken } from '../../lib/jwt';
import AboutModal from '../../components/About/AboutModal';
import { Notifications } from '../../components/Common/Notifications';
import { useNotifications } from '../../hooks/useNotifications';

const navigation = [
  { to: '/', label: 'Workspace', icon: Workflow },
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/history', label: 'Historico', icon: History },
  { to: '/tags', label: 'Tags', icon: Tags },
  { to: '/profile', label: 'Perfil', icon: UserCog },
] as const;

export function AppShell({ children }: PropsWithChildren) {
  const [showAbout, setShowAbout] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useNotifications();
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const { theme, toggle } = useThemeStore();
  const location = useRouterState({ select: (s) => s.location.pathname });
  const role = getRoleFromToken(token);
  const isAdmin = role === 'admin';
  const canAccessConnectivity = role === 'admin' || role === 'operador';

  function navLinkStyle(active: boolean): React.CSSProperties {
    return active
      ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)', borderRadius: '4px' }
      : { color: 'var(--tx-2)' };
  }

  function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
    return (
      <>
        <nav className="flex flex-col gap-px p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = location === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onLinkClick}
                className="flex items-center gap-2 rounded px-3 text-xs font-medium transition"
                style={{ ...navLinkStyle(active), minHeight: 44, alignItems: 'center' }}
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
                onClick={onLinkClick}
                className="flex items-center gap-2 rounded px-3 text-xs font-medium transition"
                style={{ ...navLinkStyle(active), minHeight: 44, alignItems: 'center' }}
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
                onClick={onLinkClick}
                className="flex items-center gap-2 rounded px-3 text-xs font-medium transition"
                style={{ ...navLinkStyle(active), minHeight: 44, alignItems: 'center' }}
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
            className="flex items-center gap-2 rounded px-3 text-xs transition"
            style={{ color: 'var(--tx-2)', minHeight: 44 }}
          >
            {theme === 'light'
              ? <Moon className="h-3.5 w-3.5 shrink-0" />
              : <Sun className="h-3.5 w-3.5 shrink-0" />}
            Tema: {theme === 'industrial' ? 'Industrial' : theme === 'light' ? 'Light' : 'Dark'}
          </button>
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 rounded px-3 text-xs transition"
            style={{ color: 'var(--tx-2)', minHeight: 44 }}
          >
            <CircleHelp className="h-3.5 w-3.5 shrink-0" />
            Sobre
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded px-3 text-xs transition"
            style={{ color: 'var(--danger)', minHeight: 44 }}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sair
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--tx-1)' }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-48 shrink-0 flex-col"
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
        <NavContent />
      </aside>

      {/* Mobile: top bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center px-3" style={{ height: 48, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center justify-center rounded"
          style={{ color: 'var(--tx-2)', minHeight: 44, minWidth: 44 }}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--tx-1)' }}>Radare</span>
      </div>

      {/* Mobile sidebar overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className="md:hidden fixed top-0 left-0 h-full z-50 flex flex-col w-64 transition-transform"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>Radare</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--tx-1)' }}>Data Recon</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center justify-center rounded"
            style={{ color: 'var(--tx-2)', minHeight: 44, minWidth: 44 }}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavContent onLinkClick={() => setMobileSidebarOpen(false)} />
      </aside>

      {/* Main content — push down on mobile for the top bar */}
      <main className="flex flex-1 flex-col overflow-hidden md:mt-0 mt-12 w-full">{children}</main>

      <AboutModal
        showAbout={showAbout}
        toggleAboutPopup={() => setShowAbout((v) => !v)}
      />
      <Notifications />
    </div>
  );
}
