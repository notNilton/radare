import type { PendingConn } from '../types';

export function GhostWire({ conn }: { conn: PendingConn }) {
  const dx = conn.mx - conn.sx;
  const cx = dx / 2;
  const d = `M ${conn.sx} ${conn.sy} C ${conn.sx + Math.abs(cx)} ${conn.sy}, ${conn.mx - Math.abs(cx)} ${conn.my}, ${conn.mx} ${conn.my}`;
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
      <defs>
        <marker id="ghost-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="var(--accent)" opacity="0.7" />
        </marker>
      </defs>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" markerEnd="url(#ghost-arrow)" />
      <circle cx={conn.sx} cy={conn.sy} r="4" fill="var(--accent)" opacity="0.8" />
    </svg>
  );
}
