import { useState } from 'react';
import type { Edge } from 'reactflow';
import type { ReconcileResult } from '../../../types';
import type { FlowEdgeData } from '../types';

export function ReconciliationSidebar({ edges, matrix, summaryVisible, reconcileResult }: {
  edges: Edge<FlowEdgeData>[];
  matrix: number[][];
  summaryVisible: boolean;
  reconcileResult: ReconcileResult | null;
}) {
  const [matrixCopied, setMatrixCopied] = useState(false);
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
      <div style={sec}>
        <p style={lbl}>Correntes</p>
        {edges.map((e) => (
          <div key={e.id} style={card}>
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
      {summaryVisible && <ReconciliationSummary />}
    </aside>
  );
}

function ReconciliationSummary() {
  const latest = (() => {
    try { return JSON.parse(localStorage.getItem('reconciliationData') || '[]')[0] as { tagreconciled?: string[]; tagcorrection?: string[] } | undefined; }
    catch { return undefined; }
  })();
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
