import { useCallback } from 'react';
import { Handle, Position, useStore, type NodeProps } from 'reactflow';
import type { FlowNodeData } from '../types';

function calcHandleTop(i: number, total: number): string {
  return `${((i + 1) / (total + 1)) * 100}%`;
}

export function FlowNode({ id, data }: NodeProps<FlowNodeData>) {
  const inEdges = useStore(useCallback((s) => s.edges.filter((e) => e.target === id), [id]));
  const outEdges = useStore(useCallback((s) => s.edges.filter((e) => e.source === id), [id]));

  const inCount = inEdges.length;
  const outCount = outEdges.length;

  const role =
    inCount === 0 && outCount === 0 ? 'isolado'
    : inCount === 0                 ? 'entrada'
    : outCount === 0                ? 'saída'
    :                                 'processo';

  const color = {
    isolado:  { bg: 'var(--node-prc)', border: 'var(--node-prc-b)' },
    entrada:  { bg: 'var(--node-src)', border: 'var(--node-src-b)' },
    saída:    { bg: 'var(--node-snk)', border: 'var(--node-snk-b)' },
    processo: { bg: 'var(--node-mrg)', border: 'var(--node-mrg-b)' },
  }[role];

  const dotStyle: React.CSSProperties = {
    width: 7, height: 7,
    border: '1px solid var(--border-md)',
    borderRadius: '50%',
  };

  const inSlots = Math.max(1, inCount);
  const outSlots = Math.max(1, outCount);

  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 4,
        minWidth: 120,
        padding: '10px 14px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {Array.from({ length: inSlots }, (_, i) => {
        const edgeForSlot = inEdges[i];
        return (
          <Handle
            key={`t-${i}`}
            id={edgeForSlot?.targetHandle ?? `t-${i}`}
            type="target"
            position={Position.Left}
            style={{
              ...dotStyle,
              top: calcHandleTop(i, inSlots),
              background: inCount > 0 ? 'var(--tx-3)' : 'transparent',
              borderStyle: inCount === 0 ? 'dashed' : 'solid',
            }}
          />
        );
      })}

      <div style={{ fontSize: 9, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {role}
      </div>
      <div style={{ fontSize: 11, marginTop: 3, color: 'var(--tx-1)' }}>{data.label}</div>

      {Array.from({ length: outSlots }, (_, i) => {
        const edgeForSlot = outEdges[i];
        return (
          <Handle
            key={`s-${i}`}
            id={edgeForSlot?.sourceHandle ?? `s-${i}`}
            type="source"
            position={Position.Right}
            style={{
              ...dotStyle,
              top: calcHandleTop(i, outSlots),
              background: outCount > 0 ? 'var(--accent)' : 'transparent',
              borderStyle: outCount === 0 ? 'dashed' : 'solid',
              borderColor: outCount === 0 ? 'var(--accent)' : 'var(--border-md)',
            }}
          />
        );
      })}
    </div>
  );
}

export const nodeTypes = { node: FlowNode };
