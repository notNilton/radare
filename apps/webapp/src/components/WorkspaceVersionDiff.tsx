import type { WorkspaceVersion } from '../hooks/useWorkspaceVersions';
import type { Node, Edge } from 'reactflow';

interface FlowNodeData { label: string; }
interface FlowEdgeData { name?: string; value?: number; tolerance?: number; }

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

interface NodeDiffRow {
  id: string;
  labelA?: string;
  labelB?: string;
  posA?: { x: number; y: number };
  posB?: { x: number; y: number };
  status: DiffStatus;
}

interface EdgeDiffRow {
  id: string;
  nameA?: string;
  nameB?: string;
  valueA?: number;
  valueB?: number;
  toleranceA?: number;
  toleranceB?: number;
  status: DiffStatus;
}

function extractNodes(version: WorkspaceVersion): Node<FlowNodeData>[] {
  const raw = version.data?.nodes;
  if (!Array.isArray(raw)) return [];
  return raw as Node<FlowNodeData>[];
}

function extractEdges(version: WorkspaceVersion): Edge<FlowEdgeData>[] {
  const raw = version.data?.edges;
  if (!Array.isArray(raw)) return [];
  return raw as Edge<FlowEdgeData>[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function diffNodes(nodesA: Node<FlowNodeData>[], nodesB: Node<FlowNodeData>[]): NodeDiffRow[] {
  const mapA = new Map(nodesA.map((n) => [n.id, n]));
  const mapB = new Map(nodesB.map((n) => [n.id, n]));
  const allIds = new Set([...mapA.keys(), ...mapB.keys()]);
  const rows: NodeDiffRow[] = [];

  for (const id of allIds) {
    const a = mapA.get(id);
    const b = mapB.get(id);
    let status: DiffStatus;
    if (!a) status = 'added';
    else if (!b) status = 'removed';
    else if (a.data?.label !== b.data?.label || a.position.x !== b.position.x || a.position.y !== b.position.y) status = 'changed';
    else status = 'unchanged';

    rows.push({
      id,
      labelA: a?.data?.label,
      labelB: b?.data?.label,
      posA: a?.position,
      posB: b?.position,
      status,
    });
  }

  return rows.sort((a, b) => {
    const order: Record<DiffStatus, number> = { added: 0, removed: 1, changed: 2, unchanged: 3 };
    return order[a.status] - order[b.status];
  });
}

function diffEdges(edgesA: Edge<FlowEdgeData>[], edgesB: Edge<FlowEdgeData>[]): EdgeDiffRow[] {
  const mapA = new Map(edgesA.map((e) => [e.id, e]));
  const mapB = new Map(edgesB.map((e) => [e.id, e]));
  const allIds = new Set([...mapA.keys(), ...mapB.keys()]);
  const rows: EdgeDiffRow[] = [];

  for (const id of allIds) {
    const a = mapA.get(id);
    const b = mapB.get(id);
    let status: DiffStatus;
    if (!a) status = 'added';
    else if (!b) status = 'removed';
    else if (
      a.data?.name !== b.data?.name ||
      a.data?.value !== b.data?.value ||
      a.data?.tolerance !== b.data?.tolerance
    ) status = 'changed';
    else status = 'unchanged';

    rows.push({
      id,
      nameA: a?.data?.name,
      nameB: b?.data?.name,
      valueA: a?.data?.value,
      valueB: b?.data?.value,
      toleranceA: a?.data?.tolerance,
      toleranceB: b?.data?.tolerance,
      status,
    });
  }

  return rows.sort((a, b) => {
    const order: Record<DiffStatus, number> = { added: 0, removed: 1, changed: 2, unchanged: 3 };
    return order[a.status] - order[b.status];
  });
}

function statusStyle(status: DiffStatus): React.CSSProperties {
  switch (status) {
    case 'added':     return { background: 'rgba(16,185,129,0.10)', borderLeft: '3px solid #10b981' };
    case 'removed':   return { background: 'rgba(248,113,113,0.10)', borderLeft: '3px solid #f87171' };
    case 'changed':   return { background: 'rgba(251,191,36,0.10)', borderLeft: '3px solid #fbbf24' };
    default:          return {};
  }
}

function statusBadge(status: DiffStatus) {
  const colors: Record<DiffStatus, { bg: string; color: string; label: string }> = {
    added:     { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: '+ adicionado' },
    removed:   { bg: 'rgba(248,113,113,0.15)', color: '#f87171', label: '- removido' },
    changed:   { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: '~ alterado' },
    unchanged: { bg: 'transparent', color: 'var(--tx-3)', label: '= igual' },
  };
  const cfg = colors[status];
  return (
    <span style={{
      padding: '1px 5px',
      borderRadius: 2,
      fontSize: 9,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.color,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

interface WorkspaceVersionDiffProps {
  versionA: WorkspaceVersion;
  versionB: WorkspaceVersion;
}

export function WorkspaceVersionDiff({ versionA, versionB }: WorkspaceVersionDiffProps) {
  const nodesA = extractNodes(versionA);
  const nodesB = extractNodes(versionB);
  const edgesA = extractEdges(versionA);
  const edgesB = extractEdges(versionB);

  const nodeDiffs = diffNodes(nodesA, nodesB);
  const edgeDiffs = diffEdges(edgesA, edgesB);

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    padding: '9px 12px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    background: 'var(--surface)',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: 11,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    padding: '8px 12px',
    background: 'var(--panel)',
    borderBottom: '1px solid var(--border)',
    fontWeight: 700,
  };

  const dateA = formatDate(versionA.created_at);
  const dateB = formatDate(versionB.created_at);

  const changedNodes = nodeDiffs.filter((r) => r.status !== 'unchanged').length;
  const changedEdges = edgeDiffs.filter((r) => r.status !== 'unchanged').length;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
      {/* Legend */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-1)' }}>Comparacao de Versoes</span>
        <span style={{ fontSize: 10, color: 'var(--tx-3)' }}>{changedNodes} nos alterados · {changedEdges} correntes alteradas</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['added', 'removed', 'changed', 'unchanged'] as DiffStatus[]).map((s) => (
            <span key={s}>{statusBadge(s)}</span>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {/* Nodes section */}
        <div style={sectionLabel}>Nos</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Versao A — {dateA}</th>
              <th style={thStyle}>Versao B — {dateB}</th>
              <th style={thStyle}>Situacao</th>
            </tr>
          </thead>
          <tbody>
            {nodeDiffs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, color: 'var(--tx-3)', textAlign: 'center' }}>Nenhum no encontrado.</td>
              </tr>
            )}
            {nodeDiffs.map((row) => (
              <tr key={row.id} style={statusStyle(row.status)}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10, color: 'var(--tx-3)' }}>{row.id}</td>
                <td style={tdStyle}>
                  {row.labelA
                    ? <span style={{ fontWeight: 600 }}>{row.labelA}</span>
                    : <span style={{ color: 'var(--tx-3)' }}>—</span>}
                  {row.posA && (
                    <span style={{ fontSize: 9, color: 'var(--tx-3)', marginLeft: 6 }}>
                      ({row.posA.x.toFixed(0)}, {row.posA.y.toFixed(0)})
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {row.labelB
                    ? <span style={{ fontWeight: 600 }}>{row.labelB}</span>
                    : <span style={{ color: 'var(--tx-3)' }}>—</span>}
                  {row.posB && (
                    <span style={{ fontSize: 9, color: 'var(--tx-3)', marginLeft: 6 }}>
                      ({row.posB.x.toFixed(0)}, {row.posB.y.toFixed(0)})
                    </span>
                  )}
                </td>
                <td style={tdStyle}>{statusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Edges section */}
        <div style={sectionLabel}>Correntes (Edges)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Versao A — {dateA}</th>
              <th style={thStyle}>Versao B — {dateB}</th>
              <th style={thStyle}>Situacao</th>
            </tr>
          </thead>
          <tbody>
            {edgeDiffs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, color: 'var(--tx-3)', textAlign: 'center' }}>Nenhuma corrente encontrada.</td>
              </tr>
            )}
            {edgeDiffs.map((row) => (
              <tr key={row.id} style={statusStyle(row.status)}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10, color: 'var(--tx-3)' }}>{row.id}</td>
                <td style={tdStyle}>
                  {row.nameA !== undefined
                    ? (
                      <>
                        <span style={{ fontWeight: 600 }}>{row.nameA ?? '—'}</span>
                        {row.valueA !== undefined && (
                          <span style={{ fontSize: 10, color: 'var(--tx-3)', marginLeft: 6 }}>
                            {row.valueA} ± {row.toleranceA}
                          </span>
                        )}
                      </>
                    )
                    : <span style={{ color: 'var(--tx-3)' }}>—</span>}
                </td>
                <td style={tdStyle}>
                  {row.nameB !== undefined
                    ? (
                      <>
                        <span style={{ fontWeight: 600 }}>{row.nameB ?? '—'}</span>
                        {row.valueB !== undefined && (
                          <span style={{ fontSize: 10, color: 'var(--tx-3)', marginLeft: 6 }}>
                            {row.valueB} ± {row.toleranceB}
                          </span>
                        )}
                      </>
                    )
                    : <span style={{ color: 'var(--tx-3)' }}>—</span>}
                </td>
                <td style={tdStyle}>{statusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
