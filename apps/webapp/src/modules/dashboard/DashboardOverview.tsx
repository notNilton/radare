import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, DatabaseZap, Tags } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';
import { API_URL } from '../../config/env';

interface DashboardStats {
  total_reconciliations: number;
  consistent_percentage: number;
  total_tags: number;
}

interface LiveValues {
  value1: number;
  value2: number;
}

export function DashboardOverview() {
  const [liveValues, setLiveValues] = useState<LiveValues | null>(null);
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => apiClient.get<DashboardStats>('/dashboard/stats'),
  });

  const socketUrl = useMemo(
    () => API_URL.replace(/^http/, 'ws').replace(/\/api$/, '/api/ws'),
    [],
  );

  useEffect(() => {
    const socket = new WebSocket(socketUrl);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LiveValues;
        setLiveValues(payload);
      } catch {
        // Ignore malformed messages from the dev backend.
      }
    };

    return () => {
      socket.close();
    };
  }, [socketUrl]);

  const cards = [
    {
      label: 'Reconciliações',
      value: isLoading ? '...' : String(stats?.total_reconciliations ?? 0),
      icon: DatabaseZap,
      tone: 'text-cyan-200',
    },
    {
      label: 'Consistência',
      value: isLoading
        ? '...'
        : `${(stats?.consistent_percentage ?? 0).toFixed(1)}%`,
      icon: BarChart3,
      tone: 'text-emerald-200',
    },
    {
      label: 'Tags',
      value: isLoading ? '...' : String(stats?.total_tags ?? 0),
      icon: Tags,
      tone: 'text-amber-200',
    },
    {
      label: 'Processo ao vivo',
      value: liveValues ? `${liveValues.value1} / ${liveValues.value2}` : '-- / --',
      icon: Activity,
      tone: 'text-fuchsia-200',
    },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Dashboard de operação</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Visão consolidada da saúde do processo, total de reconciliações executadas e dados em tempo real.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur"
          >
            <div className={`inline-flex rounded-2xl bg-white/5 p-3 ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
