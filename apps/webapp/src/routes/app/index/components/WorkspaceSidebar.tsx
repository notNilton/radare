import { useEffect, useMemo, useState } from 'react';
import type { Edge } from 'reactflow';
import { getReconciliationHistory } from '../../../../lib/reconciliation-storage';
import type { ReconciliationEntry, ReconcileResult } from '../../../../types';
import type { FlowEdgeData } from '../types';

export function WorkspaceSidebar({ edges, matrix, selectedEdgeId, status, summaryVisible, reconcileResult }: {
  edges: Edge<FlowEdgeData>[];
  matrix: number[][];
  selectedEdgeId: string | null;
  status: string | null;
  summaryVisible: boolean;
  reconcileResult: ReconcileResult | null;
}) {
  const [matrixCopied, setMatrixCopied] = useState(false);
  const [history, setHistory] = useState<ReconciliationEntry[]>(() => getReconciliationHistory());
  const sec: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--border)' };
  const lbl: React.CSSProperties = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 8 };
  const card: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 4, background: 'var(--panel)' };
  const matrixText = matrix.map((row) => row.join('\t')).join('\n');
  const pValue = reconcileResult?.confidence_score;
  const isSuspect = reconcileResult?.statistical_validity === false;
  const outlierName = reconcileResult?.outlier_tag || (
    reconcileResult?.outlier_index !== undefined && reconcileResult.outlier_index >= 0
      ? edges[reconcileResult.outlier_index]?.data?.name
      : undefined
  );
  const selectedEdge = selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) : undefined;
  const selectedEdgeIndex = selectedEdge ? edges.findIndex((edge) => edge.id === selectedEdge.id) : -1;
  const trendPoints = useMemo(() => {
    if (!selectedEdge) return [];

    return history.slice(0, 20).map((entry) => {
      const byName = entry.tagname.findIndex((name) => name === selectedEdge.data?.name);
      const index = byName >= 0 ? byName : selectedEdgeIndex;
      if (index < 0) return null;

      const reconciled = Number(entry.tagreconciled[index]);
      const correction = Number(entry.tagcorrection[index] ?? 0);
      const measured = entry.tagmeasured?.[index] !== undefined
        ? Number(entry.tagmeasured[index])
        : reconciled - correction;

      if (!Number.isFinite(measured) || !Number.isFinite(reconciled)) return null;
      return { measured, reconciled };
    }).filter((point): point is { measured: number; reconciled: number } => Boolean(point)).reverse();
  }, [history, selectedEdge, selectedEdgeIndex]);

  useEffect(() => {
    const refreshHistory = () => setHistory(getReconciliationHistory());
    window.addEventListener('localStorageUpdated', refreshHistory);
    window.addEventListener('storage', refreshHistory);
    return () => {
      window.removeEventListener('localStorageUpdated', refreshHistory);
      window.removeEventListener('storage', refreshHistory);
    };
  }, []);

  async function copyMatrix() {
    if (!matrixText) return;

    try {
      await navigator.clipboard.writeText(matrixText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = matrixText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setMatrixCopied(true);
    window.setTimeout(() => setMatrixCopied(false), 1400);
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
      {pValue !== undefined && (
        <div style={{ ...sec, background: isSuspect ? 'var(--danger-bg)' : 'var(--accent-bg)', borderBottom: `1px solid ${isSuspect ? 'var(--danger)' : 'var(--accent-bd)'}` }}>
          <p style={lbl}>P-valor do teste global</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: isSuspect ? 'var(--danger)' : 'var(--accent)', margin: 0 }}>{(pValue * 100).toFixed(1)}%</p>
          <p style={{ fontSize: 9, color: 'var(--tx-3)', marginTop: 4, textTransform: 'uppercase' }}>
            {isSuspect ? 'Suspeito a 95%' : 'Válido a 95%'}
          </p>
          {outlierName && (
            <p style={{ fontSize: 10, color: 'var(--tx-2)', margin: '6px 0 0' }}>
              Maior contribuição: <strong>{outlierName}</strong>
            </p>
          )}
          {reconcileResult?.chi_square !== undefined && reconcileResult?.critical_value !== undefined && (
            <p style={{ fontSize: 10, color: 'var(--tx-3)', margin: '4px 0 0' }}>
              h={reconcileResult.chi_square.toFixed(2)} / crítico={reconcileResult.critical_value.toFixed(2)}
            </p>
          )}
        </div>
      )}
      {status && (
        <div style={sec}>
          <p style={lbl}>Estado</p>
          <p style={{ color: status === 'Processando...' ? 'var(--accent)' : 'var(--tx-2)', fontSize: 11, fontWeight: 700, margin: 0 }}>
            {status}
          </p>
        </div>
      )}
      <div style={sec}>
        <p style={lbl}>Correntes</p>
        {edges.map((e) => (
          <div
            key={e.id}
            style={{
              ...card,
              borderColor: e.id === selectedEdgeId ? 'var(--accent)' : e.data?.isOutlier ? 'var(--danger)' : 'var(--border)',
              background: e.id === selectedEdgeId ? 'var(--accent-bg)' : e.data?.isOutlier ? 'var(--danger-bg)' : 'var(--panel)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-1)', margin: 0 }}>{e.data?.name}</p>
            <p style={{ fontSize: 10, color: 'var(--tx-3)', margin: '2px 0 0' }}>{e.data?.value ?? 0} ± {e.data?.tolerance ?? 0}</p>
            {e.data?.correctionPercent !== undefined && !isNaN(e.data.correctionPercent) && (
              <p style={{ fontSize: 9, color: e.data.correctionPercent > 5 ? 'var(--danger)' : 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                Ajuste: {e.data.correctionPercent.toFixed(2)}%
              </p>
            )}
          </div>
        ))}
      </div>
      <TrendPanel edgeName={selectedEdge?.data?.name} points={trendPoints} />
      <div style={sec}>
        <button
          type="button"
          onClick={() => void copyMatrix()}
          disabled={!matrixText}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: matrixText ? 'var(--tx-2)' : 'var(--tx-3)', cursor: matrixText ? 'pointer' : 'not-allowed', fontSize: 11, fontWeight: 600 }}
        >
          {matrixCopied ? 'Matriz copiada' : 'Copiar matriz de incidência'}
        </button>
      </div>
      {summaryVisible && <WorkspaceSummary />}
    </aside>
  );
}

function TrendPanel({ edgeName, points }: {
  edgeName?: string;
  points: { measured: number; reconciled: number }[];
}) {
  const sec: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--border)' };
  const lbl: React.CSSProperties = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 8 };

  return (
    <div style={sec}>
      <p style={lbl}>Tendência</p>
      {edgeName ? (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-1)', margin: '0 0 8px' }}>{edgeName}</p>
          {points.length >= 2 ? (
            <>
              <Sparkline points={points} />
              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 9, color: 'var(--tx-3)' }}>
                <span>Medido</span>
                <span style={{ color: 'var(--accent)' }}>Reconciliado</span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--tx-3)', margin: 0 }}>Execute mais reconciliações para desenhar o histórico.</p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--tx-3)', margin: 0 }}>Selecione uma corrente para ver medido vs reconciliado.</p>
      )}
    </div>
  );
}

function Sparkline({ points }: { points: { measured: number; reconciled: number }[] }) {
  const width = 210;
  const height = 70;
  const padding = 6;
  const values = points.flatMap((point) => [point.measured, point.reconciled]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  function makePath(key: 'measured' | 'reconciled') {
    return points.map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point[key] - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
  }

  const latest = points[points.length - 1];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 6, background: 'var(--panel)' }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendência medido vs reconciliado" style={{ display: 'block', width: '100%', height }}>
        <path d={makePath('measured')} fill="none" stroke="var(--tx-3)" strokeWidth="2" />
        <path d={makePath('reconciled')} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      </svg>
      <p style={{ color: 'var(--tx-3)', fontSize: 9, margin: '4px 0 0' }}>
        Atual: {latest.measured.toFixed(2)} -&gt; {latest.reconciled.toFixed(2)}
      </p>
    </div>
  );
}

function WorkspaceSummary() {
  const [latest, setLatest] = useState<{ tagreconciled?: string[]; tagcorrection?: string[] } | undefined>();

  useEffect(() => {
    const read = () => {
      try {
        const data = JSON.parse(localStorage.getItem('reconciliationData') || '[]');
        setLatest(data[0]);
      } catch {
        setLatest(undefined);
      }
    };
    read();
    window.addEventListener('localStorageUpdated', read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('localStorageUpdated', read);
      window.removeEventListener('storage', read);
    };
  }, []);

  const sec: React.CSSProperties = { padding: '12px 14px' };
  const lbl: React.CSSProperties = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 8 };
  const card: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 4, background: 'var(--panel)' };
  return (
    <div style={sec}>
      <p style={lbl}>Correções</p>
      {latest?.tagcorrection?.length
        ? latest.tagcorrection.map((v, i) => (
            <div key={`${v}-${i}`} style={card}>
              <p style={{ fontSize: 9, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Corrente {i + 1}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', margin: '2px 0 0' }}>{v}</p>
              <p style={{ fontSize: 10, color: 'var(--tx-3)', margin: '1px 0 0' }}>Rec: {latest.tagreconciled?.[i] ?? '--'}</p>
            </div>
          ))
        : <p style={{ fontSize: 11, color: 'var(--tx-3)' }}>Execute a reconciliação.</p>}
    </div>
  );
}
