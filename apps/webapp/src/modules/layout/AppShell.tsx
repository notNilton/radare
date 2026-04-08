import { PropsWithChildren, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  CircleHelp,
  Gauge,
  History,
  LogOut,
  PanelLeft,
  Tags,
  UserCog,
  Workflow,
} from 'lucide-react';
import { useAuthStore } from '../../store/AuthStore';
import AboutModal from '../../components/About/AboutModal';

const navigation = [
  { to: '/', label: 'Workspace', icon: Workflow },
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/history', label: 'Histórico', icon: History },
  { to: '/tags', label: 'Tags', icon: Tags },
  { to: '/profile', label: 'Perfil', icon: UserCog },
] as const;

function navClass(isActive: boolean) {
  return [
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
    isActive
      ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
      : 'text-slate-300 hover:bg-white/5 hover:text-white',
  ].join(' ');
}

export function AppShell({ children }: PropsWithChildren) {
  const [showAbout, setShowAbout] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const location = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.16),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a_45%,_#111827)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-80 shrink-0 flex-col rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur lg:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
              <PanelLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Mirante Style</p>
              <h1 className="text-2xl font-semibold text-white">RADARE</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={navClass(location === item.to)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/60 hover:text-white"
            >
              <CircleHelp className="h-4 w-4" />
              Sobre o projeto
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/15"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-4">
          <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Monorepo Webapp</p>
                <h2 className="text-xl font-semibold text-white">Operação e reconciliação</h2>
              </div>
              <div className="flex flex-wrap gap-2 lg:hidden">
                {navigation.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={navClass(location === item.to)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAbout(true)}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300"
                >
                  Sobre
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <AboutModal
        showAbout={showAbout}
        toggleAboutPopup={() => setShowAbout((current) => !current)}
      />
    </div>
  );
}
