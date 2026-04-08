import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, SlidersHorizontal } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
        <div>
          <h1 className="text-2xl font-semibold text-white">Histórico de reconciliações</h1>
          <p className="mt-2 text-sm text-slate-400">
            Filtros por status e janela temporal para auditoria operacional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur lg:grid-cols-4">
        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">Todos</option>
            <option value="Consistente">Consistente</option>
            <option value="Inconsistente">Inconsistente</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Data inicial</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Data final</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setStatus('');
            setStartDate('');
            setEndDate('');
            setPage(0);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          <Search className="h-4 w-4" />
          Limpar filtros
        </button>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Medições</th>
                <th className="px-5 py-4">Reconciliados</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-5 py-8 text-slate-400" colSpan={5}>
                    Carregando histórico...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.ID} className="border-b border-white/5 last:border-b-0">
                    <td className="px-5 py-4">{item.ID}</td>
                    <td className="px-5 py-4">
                      {item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : '--'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                        {item.consistency_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {JSON.stringify(item.Measurements ?? [])}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {JSON.stringify(item.ReconciledValues ?? [])}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-slate-400" colSpan={5}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-slate-400">
          <span>Total estimado: {total}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              className="rounded-full border border-white/10 px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full border border-white/10 px-4 py-2"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
