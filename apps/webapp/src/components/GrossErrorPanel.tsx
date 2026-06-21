import type { ReconcileResult } from '../types';

interface TagRow {
  name: string;
  measured: number;
  reconciled: number;
  adjustment: number;
  adjustmentPercent: number;
  chiContribution: number;
  index: number;
}

interface GrossErrorPanelProps {
  result: ReconcileResult;
  tagNames: string[];
  measurements: number[];
}

function rowBg(chiContrib: number): React.CSSProperties {
  if (chiContrib > 3.84) {
    return { background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)' };
  }
  if (chiContrib > 2.0) {
    return { background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.25)' };
  }
  return {};
}

function chiColor(chiContrib: number): string {
  if (chiContrib > 3.84) return '#f87171';
  if (chiContrib > 2.0) return '#fbbf24';
  return 'var(--tx-3)';
}

export function GrossErrorPanel({ result, tagNames, measurements }: GrossErrorPanelProps) {
  const isValid = result.statistical_validity !== false;
  const chiSquare = result.chi_square ?? 0;
  const criticalValue = result.critical_value ?? 3.84;
  const dof = Math.max(1, result.reconciled_values.length - 1);

  const rows: TagRow[] = result.reconciled_values.map((reconciled, i) => {
    const measured = measurements[i] ?? 0;
    const correction = result.corrections[i] ?? 0;
    const adjustment = Math.abs(correction);
    const adjustmentPercent =
      measured !== 0 && !isNaN(correction)
        ? (Math.abs(correction) / Math.abs(measured)) * 100
        : 0;

    // Estimate chi contribution per tag proportionally from overall chi_square
    // If outlier_contribution is available for the outlier tag, use it; otherwise distribute evenly
    let chiContribution = 0;
    if (result.outlier_index === i && result.outlier_contribution !== undefined) {
      chiContribution = result.outlier_contribution;
    } else if (measured !== 0) {
      chiContribution = (adjustment / (measurements[i] ?? 1)) * chiSquare;
    }

    return {
      name: tagNames[i] ?? `Tag ${i + 1}`,
      measured,
      reconciled,
      adjustment,
      adjustmentPercent,
      chiContribution,
      index: i,
    };
  });

  // Sort descending by chi contribution
  const sorted = [...rows].sort((a, b) => b.chiContribution - a.chiContribution);

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    padding: '10px 12px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    background: 'var(--surface)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '9px 12px',
    fontSize: 11,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          background: isValid ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isValid ? '#10b981' : '#f87171',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {isValid ? 'Balanco Aprovado' : 'Balanco Reprovado'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--tx-3)' }}>
          h = {chiSquare.toFixed(3)} / crítico = {criticalValue.toFixed(3)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--tx-3)' }}>GL = {dof}</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Tag</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Medido</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Reconciliado</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Ajuste</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Ajuste %</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Contrib. h</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const bg = rowBg(row.chiContribution);
              return (
                <tr key={row.index} style={bg}>
                  <td style={{ ...tdStyle, ...bg, fontWeight: 600, color: 'var(--tx-1)' }}>
                    {row.name}
                    {result.outlier_index === row.index && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: '1px 5px',
                          borderRadius: 2,
                          fontSize: 9,
                          fontWeight: 700,
                          background: 'rgba(248,113,113,0.15)',
                          color: '#f87171',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        outlier
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, ...bg, textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>
                    {row.measured.toFixed(4)}
                  </td>
                  <td style={{ ...tdStyle, ...bg, textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>
                    {row.reconciled.toFixed(4)}
                  </td>
                  <td style={{ ...tdStyle, ...bg, textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>
                    {row.adjustment.toFixed(4)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      ...bg,
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: row.adjustmentPercent > 10 ? '#f87171' : row.adjustmentPercent > 5 ? '#fbbf24' : 'var(--tx-2)',
                      fontWeight: row.adjustmentPercent > 5 ? 700 : 400,
                    }}
                  >
                    {row.adjustmentPercent.toFixed(2)}%
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      ...bg,
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: chiColor(row.chiContribution),
                      fontWeight: row.chiContribution > 2.0 ? 700 : 400,
                    }}
                  >
                    {row.chiContribution.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
