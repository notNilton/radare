import { useEffect, useMemo, useState, useRef } from 'react';
import { Download, SlidersHorizontal, X } from 'lucide-react';
import { useExportHistory, useInfiniteHistory } from '../../hooks/useHistory';

export function HistoryTable() {
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const observerRef = useRef<HTMLTableRowElement>(null);

  const filters = useMemo(
    () => ({ endDate, startDate, status }),
    [endDate, startDate, status],
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteHistory(filters);

  const exportHistoryMutation = useExportHistory();

  const items = useMemo(() => data?.pages.flatMap((page) => page.data ?? []) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  // Infinite Scroll Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  async function exportCsv() {
    setExporting(true);
    try {
      const file = await exportHistoryMutation.mutateAsync();
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reconciliations.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // ─── Styles ───────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 500,
    border: '1px solid var(--border-md)',
    borderRadius: 3,
    background: 'transparent',
    color: 'var(--tx-2)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: '1px solid var(--accent-bd)',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    fontWeight: 600,
  };

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    padding: '12px 20px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    background: 'var(--surface)',
    zIndex: 10
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: 12,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    background: 'var(--panel)',
    border: '1px solid var(--border-md)',
    borderRadius: 4,
    color: 'var(--tx-1)',
    outline: 'none'
  };

  const lblStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>HISTÓRICO</h1>
          <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
            Log de auditoria industrial com rolagem infinita.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting || exportHistoryMutation.isPending}
          style={{ ...btnPrimary, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <Download size={14} />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </header>

      <section className="shrink-0" style={{
        padding: '20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
      }}>
        <label>
          <span style={lblStyle}><SlidersHorizontal size={12} /> Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={inputStyle}
          >
            <option value="">Todos</option>
            <option value="Consistente">Consistente</option>
            <option value="Inconsistente">Inconsistente</option>
          </select>
        </label>

        <label>
          <span style={lblStyle}>Data inicial</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          <span style={lblStyle}>Data final</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            style={inputStyle}
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setStartDate('');
              setEndDate('');
            }}
            style={{ ...btnBase, width: '100%', justifyContent: 'center', height: '36px' }}
          >
            <X size={14} />
            Limpar Filtros
          </button>
        </div>
      </section>

      <section className="flex-1 overflow-hidden" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Data / Hora</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Medições</th>
                <th style={thStyle}>Reconciliados</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.ID}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{item.ID}</td>
                  <td style={tdStyle}>
                    {item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : '--'}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: item.consistency_status === 'Consistente' ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                      color: item.consistency_status === 'Consistente' ? '#10b981' : '#f87171',
                      border: `1px solid ${item.consistency_status === 'Consistente' ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)'}`
                    }}>
                      {item.consistency_status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 10, color: 'var(--tx-2)', fontFamily: 'monospace' }}>
                    {JSON.stringify(item.Measurements ?? [])}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 10, color: 'var(--tx-2)', fontFamily: 'monospace' }}>
                    {JSON.stringify(item.ReconciledValues ?? [])}
                  </td>
                </tr>
              ))}

              {/* Observer Trigger */}
              <tr ref={observerRef}>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>
                  {isFetchingNextPage ? (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carregando mais...</span>
                  ) : hasNextPage ? (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', opacity: 0 }}>Trigger</span>
                  ) : items.length > 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fim do histórico • {total} registros</span>
                  ) : !isLoading && (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Nenhum registro encontrado.</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
