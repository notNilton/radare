import { useEffect, useState } from 'react';
import { BarChart3, Eraser, History } from 'lucide-react';
import {
  clearReconciliationHistory,
  getLatestReconciliation,
  type ReconciliationEntry,
} from '../../lib/reconciliation-storage';
import { ReconciliationCanvas } from './ReconciliationCanvas';

export function ReconciliationWorkspace() {
  const [latestEntry, setLatestEntry] = useState<ReconciliationEntry | null>(
    getLatestReconciliation(),
  );

  useEffect(() => {
    const sync = () => setLatestEntry(getLatestReconciliation());
    window.addEventListener('localStorageUpdated', sync);
    return () => window.removeEventListener('localStorageUpdated', sync);
  }, []);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 text-cyan-300">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em]">Status</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">
            {latestEntry?.status ?? 'Pronto para operar'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            O canvas principal agora concentra fluxo, parâmetros e persistência local.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 text-cyan-300">
            <History className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em]">Última execução</span>
          </div>
          <p className="mt-4 text-lg font-semibold text-white">
            {latestEntry ? new Date(latestEntry.time).toLocaleString() : 'Ainda sem histórico'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Tags processadas: {latestEntry?.tagname.length ?? 0}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 text-cyan-300">
            <Eraser className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em]">Manutenção</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearReconciliationHistory();
              setLatestEntry(null);
            }}
            className="mt-4 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/15"
          >
            Limpar histórico local
          </button>
        </div>
      </section>

      <ReconciliationCanvas />
    </div>
  );
}
