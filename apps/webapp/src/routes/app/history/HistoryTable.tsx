import { useEffect, useMemo, useState, useRef } from 'react';
import { Download, FileText, Loader, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useExportHistory, useExportHistoryPdf, useInfiniteHistory } from '../../../hooks/useHistory';
import { apiClient, getErrorMessage } from '../../../lib/api-client';
import { useNotificationStore } from '../../../store/NotificationStore';
import type { HistoryItem } from '../../../types';
import type { HistorySearch } from '../history';

function useRowExport() {
  const push = useNotificationStore((s) => s.push);
  const [loadingRows, setLoadingRows] = useState<Record<string, Record<string, boolean>>>({});

  async function exportRow(id: number | string, format: 'csv' | 'excel') {
    const key = String(id);
    setLoadingRows((prev) => ({ ...prev, [key]: { ...prev[key], [format]: true } }));
    try {
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const endpoint = `/reconciliations/${key}/export/${format === 'csv' ? 'csv' : 'excel'}`;
      const blob = await apiClient.getBlob(endpoint);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reconciliation-${key}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      push({
        level: 'error',
        title: 'Erro ao exportar',
        message: getErrorMessage(err, 'Nao foi possivel exportar o registro.'),
      });
    } finally {
      setLoadingRows((prev) => ({ ...prev, [key]: { ...prev[key], [format]: false } }));
    }
  }

  return { exportRow, loadingRows };
}

function RowExportButtons({ item, exportRow, loadingRows }: {
  item: HistoryItem;
  exportRow: (id: number | string, format: 'csv' | 'excel') => Promise<void>;
  loadingRows: Record<string, Record<string, boolean>>;
}) {
  const key = String(item.ID);
  const loadingCsv = loadingRows[key]?.csv;
  const loadingXlsx = loadingRows[key]?.excel;

  const btnSmall: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 7px',
    fontSize: 10,
    fontWeight: 500,
    border: '1px solid var(--border-md)',
    borderRadius: 3,
    background: 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        disabled={!!loadingCsv}
        onClick={() => void exportRow(item.ID, 'csv')}
        style={{ ...btnSmall, color: '#10b981' }}
        title="Exportar CSV"
      >
        {loadingCsv ? <Loader size={10} className="animate-spin" /> : <Download size={10} />}
        CSV
      </button>
      <button
        type="button"
        disabled={!!loadingXlsx}
        onClick={() => void exportRow(item.ID, 'excel')}
        style={{ ...btnSmall, color: '#0ea5e9' }}
        title="Exportar Excel"
      >
        {loadingXlsx ? <Loader size={10} className="animate-spin" /> : <FileText size={10} />}
        Excel
      </button>
    </div>
  );
}

export function HistoryTable() {
  // Feature 6: Filters stored in URL search params via TanStack Router
  const search = useSearch({ from: '/app-layout/history' }) as HistorySearch;
  const navigate = useNavigate({ from: '/history' });

  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Local filter state, initialized from URL
  const [status, setStatus] = useState(search.status ?? '');
  const [startDate, setStartDate] = useState(search.startDate ?? '');
  const [endDate, setEndDate] = useState(search.endDate ?? '');

  const observerRef = useRef<HTMLTableRowElement>(null);

  const filters = useMemo(
    () => ({ endDate, startDate, status }),
    [endDate, startDate, status],
  );

  // Sync local state to URL search params when filters change
  useEffect(() => {
    void navigate({
      search: {
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      replace: true,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startDate, endDate]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteHistory(filters);

  const exportHistoryMutation = useExportHistory();
  const exportHistoryPdfMutation = useExportHistoryPdf();
  const { exportRow, loadingRows } = useRowExport();

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

  async function exportPdf() {
    setExportingPdf(true);
    try {
      const file = await exportHistoryPdfMutation.mutateAsync();
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reconciliations.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  }

  function clearFilters() {
    setStatus('');
    setStartDate('');
    setEndDate('');
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
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>HISTORICO</h1>
          <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
            Log de auditoria industrial com rolagem infinita.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting || exportHistoryMutation.isPending}
            style={{ ...btnPrimary, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <Download size={14} />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            type="button"
            onClick={() => void exportPdf()}
            disabled={exportingPdf || exportHistoryPdfMutation.isPending}
            style={{ ...btnPrimary, color: '#0ea5e9', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.35)' }}
          >
            <FileText size={14} />
            {exportingPdf ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </header>

      {/* Feature 6: Filter bar with URL search param sync */}
      <section className="shrink-0" style={{
        padding: '20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
      }}>
        <div className="flex flex-col md:flex-row gap-4">
          <label style={{ flex: 1 }}>
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

          <label style={{ flex: 1 }}>
            <span style={lblStyle}>Data inicial</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ flex: 1 }}>
            <span style={lblStyle}>Data final</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={clearFilters}
              style={{ ...btnBase, height: '36px', paddingLeft: 10, paddingRight: 10 }}
              title="Limpar filtros"
            >
              <X size={14} />
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="flex-1 overflow-hidden" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Feature 5: overflow-x-auto wrapper to support mobile horizontal scroll */}
        <div className="overflow-y-auto flex-1 custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Data / Hora</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Medicoes</th>
                <th style={thStyle}>Reconciliados</th>
                <th style={thStyle}>Exportar</th>
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
                  <td style={{ ...tdStyle, padding: '8px 12px' }}>
                    <RowExportButtons
                      item={item}
                      exportRow={exportRow}
                      loadingRows={loadingRows}
                    />
                  </td>
                </tr>
              ))}

              {/* Observer Trigger */}
              <tr ref={observerRef}>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>
                  {isFetchingNextPage ? (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carregando mais...</span>
                  ) : hasNextPage ? (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', opacity: 0 }}>Trigger</span>
                  ) : items.length > 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fim do historico • {total} registros</span>
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
