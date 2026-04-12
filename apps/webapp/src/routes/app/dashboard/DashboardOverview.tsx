import { BarChart3, DatabaseZap, Tags, Wifi } from 'lucide-react';
import { useDashboardStats } from '../../../hooks/useDashboardStats';

export function DashboardOverview() {
  const { data: stats, isLoading } = useDashboardStats();

  const cards = [
    {
      label: 'RECONCILIAÇÕES',
      value: isLoading ? '...' : String(stats?.total_reconciliations ?? 0),
      icon: DatabaseZap,
      tone: 'var(--accent)',
    },
    {
      label: 'CONSISTÊNCIA',
      value: isLoading
        ? '...'
        : `${(stats?.consistent_percentage ?? 0).toFixed(1)}%`,
      icon: BarChart3,
      tone: '#10b981',
    },
    {
      label: 'TAGS',
      value: isLoading ? '...' : String(stats?.total_tags ?? 0),
      icon: Tags,
      tone: '#f59e0b',
    },
    {
      label: 'BACKEND',
      value: 'Online',
      icon: Wifi,
      tone: '#d946ef',
    },
  ];

  const lblStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    marginBottom: 8
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>DASHBOARD DE OPERAÇÃO</h1>
        <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
          Monitoramento consolidado e métricas em tempo real do processo de reconciliação.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            style={{
              padding: '24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            <div style={lblStyle}>{card.label}</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--tx-1)' }}>{card.value}</span>
              <card.icon size={18} style={{ color: card.tone, opacity: 0.8 }} />
            </div>
          </article>
        ))}
      </section>

      <section style={{
        padding: '24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
      }}>
        <div style={lblStyle}>STATUS DO SISTEMA</div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--tx-2)' }}>
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
          <span>Backend operacional</span>
        </div>
      </section>
    </div>
  );
}
