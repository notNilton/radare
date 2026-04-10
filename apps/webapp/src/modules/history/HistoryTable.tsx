import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, SlidersHorizontal, X } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';

interface HistoryItem {
  ID: number | string;
  CreatedAt?: string;
  consistency_status: string;
  Measurements?: number[];
  ReconciledValues?: number[];
}

export function HistoryTable() {
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const filters = useMemo(
    () => ({ endDate, page, startDate, status }),
    [endDate, page, startDate, status],
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.history.list(filters),
    queryFn: async () => {
      const searchParams = new URLSearchParams({ page: String(page + 1) });
      if (status) {
        searchParams.set('status', status);
      }
      if (startDate) {
        searchParams.set('start_date', new Date(startDate).toISOString());
      }
      if (endDate) {
        searchParams.set('end_date', new Date(endDate).toISOString());
      }

      return apiClient.get<{ data?: HistoryItem[]; total?: number }>(
        `/reconcile/history?${searchParams.toString()}`,
      );
    },
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  async function exportCsv() {
    setExporting(true);
    try {
      const file = await apiClient.getBlob('/reconcile/export');
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
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>HISTÓRICO</h1>
          <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
            Log de auditoria e exportação de resultados anteriores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting}
          style={{ ...btnPrimary, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <Download size={14} />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </header>

      <section style={{
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
              setPage(0);
            }}
            style={{ ...btnBase, width: '100%', justifyContent: 'center', height: '36px' }}
          >
            <X size={14} />
            Limpar Filtros
          </button>
        </div>
      </section>

      <section style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div className="overflow-x-auto">
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
              {isLoading ? (
                <tr>
                  <td style={tdStyle} colSpan={5}>Carregando histórico...</td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
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
                ))
              ) : (
                <tr>
                  <td style={tdStyle} colSpan={5}>Nenhum registro encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          fontSize: 11,
          color: 'var(--tx-3)'
        }}>
          <span className="flex-1">Total de registros: {total}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              style={{ ...btnBase, padding: '4px 10px', opacity: page === 0 ? 0.4 : 1 }}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              style={{ ...btnBase, padding: '4px 10px' }}
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
