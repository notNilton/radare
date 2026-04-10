import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
  useStore,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Play } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { saveReconciliationEntry } from '../../lib/reconciliation-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowNodeData {
  label: string;
}

interface FlowEdgeData {
  name: string;
  value: number;
  tolerance: number;
}

interface PendingConn {
  sourceId: string;
  sx: number;
  sy: number;
  mx: number;
  my: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEdgeLabel(d: FlowEdgeData) {
  return `${d.name} • ${d.value} ± ${d.tolerance}`;
}

function generateEdgeName() {
  const names = ['Orion', 'Sigma', 'Phoenix', 'Delta', 'Atlas', 'Vega'];
  return names[Math.floor(Math.random() * names.length)];
}

function calcHandleTop(i: number, total: number): string {
  return `${((i + 1) / (total + 1)) * 100}%`;
}

// ─── Node component ───────────────────────────────────────────────────────────
// Role and handle count are derived live from the edge store — no variant stored.

function FlowNode({ id, data }: NodeProps<FlowNodeData>) {
  const inEdges  = useStore(useCallback((s) => s.edges.filter((e) => e.target === id), [id]));
  const outEdges = useStore(useCallback((s) => s.edges.filter((e) => e.source === id), [id]));

  const inCount  = inEdges.length;
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

  // Determine how many handles to show each side.
  // Always at least 1 so the node is connectable via native ReactFlow drag.
  const inSlots  = Math.max(1, inCount);
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
      {/* Target handles — left side */}
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

      {/* Source handles — right side */}
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

const nodeTypes = { node: FlowNode };

// ─── Initial state ────────────────────────────────────────────────────────────

let _nodeSeq = 3;
function nextNodeId() { return `node-${++_nodeSeq}`; }

function makeNode(id: string, x: number, y: number, label?: string): Node<FlowNodeData> {
  return { id, type: 'node', position: { x, y }, data: { label: label ?? `Nó ${id.split('-')[1]}` } };
}

const initialNodes: Node<FlowNodeData>[] = [
  makeNode('node-1', 80,  120, 'Entrada'),
  makeNode('node-2', 360, 120, 'Processo'),
  makeNode('node-3', 680, 120, 'Saída'),
];

const initialEdges: Edge<FlowEdgeData>[] = [
  {
    id: 'edge-1', source: 'node-1', target: 'node-2',
    sourceHandle: 's-0', targetHandle: 't-0',
    markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep',
    data: { name: 'Alucard', value: 161, tolerance: 0.05 },
    label: 'Alucard • 161 ± 0.05',
  },
  {
    id: 'edge-2', source: 'node-2', target: 'node-3',
    sourceHandle: 's-0', targetHandle: 't-0',
    markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep',
    data: { name: 'Laravel', value: 79, tolerance: 0.01 },
    label: 'Laravel • 79 ± 0.01',
  },
];

// ─── Context menus ────────────────────────────────────────────────────────────

function PaneMenu({ x, y, onAdd, onClose }: { x: number; y: number; onAdd: () => void; onClose: () => void }) {
  useEffect(() => {
    const click = () => onClose();
    const key   = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', click);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('click', click); window.removeEventListener('keydown', key); };
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 4, padding: 4, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem label="Adicionar nó" onClick={() => { onAdd(); onClose(); }} />
    </div>
  );
}

function NodeMenu({ x, y, onRename, onDelete, onClose }: { x: number; y: number; onRename: () => void; onDelete: () => void; onClose: () => void }) {
  useEffect(() => {
    const click = () => onClose();
    const key   = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', click);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('click', click); window.removeEventListener('keydown', key); };
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 4, padding: 4, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem label="Renomear" onClick={() => { onRename(); onClose(); }} />
      <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
      <MenuItem label="Deletar" onClick={() => { onDelete(); onClose(); }} danger />
    </div>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', padding: '6px 10px', background: hovered ? 'var(--panel)' : 'transparent',
        border: 'none', borderRadius: 3, cursor: 'pointer', textAlign: 'left',
        fontSize: 11, fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--tx-1)',
      }}
    >
      {label}
    </button>
  );
}

// ─── Ghost wire ───────────────────────────────────────────────────────────────

function GhostWire({ conn }: { conn: PendingConn }) {
  const dx = conn.mx - conn.sx;
  const cx = dx / 2;
  const d  = `M ${conn.sx} ${conn.sy} C ${conn.sx + Math.abs(cx)} ${conn.sy}, ${conn.mx - Math.abs(cx)} ${conn.my}, ${conn.mx} ${conn.my}`;
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

// ─── Edge modal ───────────────────────────────────────────────────────────────

interface EdgeModalState {
  params: Edge | Connection;
  name: string;
  value: string;
  tolerance: string;
}

function EdgeModal({ state, onChange, onConfirm, onCancel }: {
  state: EdgeModalState;
  onChange: (p: Partial<Pick<EdgeModalState, 'name' | 'value' | 'tolerance'>>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onConfirm, onCancel]);

  const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: 12, background: 'var(--panel)', border: '1px solid var(--border-md)', borderRadius: 3, color: 'var(--tx-1)', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '20px 22px', width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Corrente</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label><span style={lbl}>Nome</span><input style={inp} value={state.name} onChange={(e) => onChange({ name: e.target.value })} autoFocus /></label>
          <label><span style={lbl}>Valor</span><input style={inp} type="number" value={state.value} onChange={(e) => onChange({ value: e.target.value })} /></label>
          <label><span style={lbl}>Tolerância</span><input style={inp} type="number" step="0.01" value={state.tolerance} onChange={(e) => onChange({ tolerance: e.target.value })} /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={onConfirm} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--accent-bd)', borderRadius: 3, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

export function ReconciliationCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus]               = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [edgeModal, setEdgeModal]           = useState<EdgeModalState | null>(null);
  const [pendingConn, setPendingConn]       = useState<PendingConn | null>(null);
  const [paneMenu, setPaneMenu]             = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
  const [nodeMenu, setNodeMenu]             = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const fileRef      = useRef<HTMLInputElement | null>(null);
  const rfInstance   = useRef<ReactFlowInstance | null>(null);
  const wrapperRef   = useRef<HTMLDivElement | null>(null);
  const hoveredNodeId   = useRef<string | null>(null);
  const suppressNextCtx = useRef(false);

  // ─── Right-click mousedown on node → always start connection ─────────────
  // Wire starts from the closest source handle (or right edge as fallback).
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const down = (e: MouseEvent) => {
      if (e.button !== 2) return;
      const nodeEl = (e.target as HTMLElement).closest<HTMLElement>('.react-flow__node');
      if (!nodeEl) return;
      const nodeId = nodeEl.dataset.id;
      if (!nodeId || !rfInstance.current) return;
      e.preventDefault();

      // Find the source handle closest to the mouse Y
      const sourceHandles = Array.from(nodeEl.querySelectorAll<HTMLElement>('.react-flow__handle-source'));
      let sx: number, sy: number;
      if (sourceHandles.length > 0) {
        const best = sourceHandles.reduce((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const ca = ra.top + ra.height / 2;
          const cb = rb.top + rb.height / 2;
          return Math.abs(ca - e.clientY) < Math.abs(cb - e.clientY) ? a : b;
        });
        const r = best.getBoundingClientRect();
        sx = r.left + r.width / 2;
        sy = r.top  + r.height / 2;
      } else {
        // fallback: right edge of node
        const r = nodeEl.getBoundingClientRect();
        sx = r.right;
        sy = r.top + r.height / 2;
      }

      setPendingConn({ sourceId: nodeId, sx, sy, mx: e.clientX, my: e.clientY });
    };
    el.addEventListener('mousedown', down);
    return () => el.removeEventListener('mousedown', down);
  }, []);

  // ─── Track mouse & complete/cancel on right-click release ─────────────────
  useEffect(() => {
    if (!pendingConn) return;
    const move = (e: MouseEvent) => setPendingConn((p) => p ? { ...p, mx: e.clientX, my: e.clientY } : null);
    const up   = (e: MouseEvent) => {
      if (e.button !== 2) return;
      suppressNextCtx.current = true;
      const targetId = hoveredNodeId.current;
      if (targetId && targetId !== pendingConn.sourceId) {
        openEdgeModal({ source: pendingConn.sourceId, target: targetId, sourceHandle: null, targetHandle: null });
      }
      setPendingConn(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [pendingConn]);

  useEffect(() => {
    if (!pendingConn) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setPendingConn(null); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [pendingConn]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const reconcileMutation = useMutation({
    mutationFn: (payload: { constraints: number[][]; measurements: number[]; tolerances: number[] }) =>
      apiClient.post<{ reconciled_values: number[]; corrections: number[]; consistency_status: string }>('/reconcile', payload),
  });

  const edgeNames = useMemo(() => edges.map((e) => e.data?.name ?? e.id), [edges]);

  const createAdjacencyMatrix = useCallback(() => {
    const pnodes = nodes.filter((n) => {
      const inC  = edges.filter((e) => e.target === n.id).length;
      const outC = edges.filter((e) => e.source === n.id).length;
      return inC > 0 && outC > 0; // only process nodes
    });
    const matrix = Array.from({ length: pnodes.length }, () => Array(edges.length).fill(0));
    edges.forEach((edge, ei) => {
      const si = pnodes.findIndex((n) => n.id === edge.source);
      const ti = pnodes.findIndex((n) => n.id === edge.target);
      if (si !== -1) matrix[si][ei] = -1;
      if (ti !== -1) matrix[ti][ei] = 1;
    });
    return matrix;
  }, [edges, nodes]);

  // ─── Edge modal helpers ────────────────────────────────────────────────────
  function openEdgeModal(params: Edge | Connection) {
    const existing = 'id' in params ? edges.find((e) => e.id === (params as Edge).id) : undefined;
    setEdgeModal({
      params,
      name:      existing?.data?.name      ?? generateEdgeName(),
      value:     String(existing?.data?.value     ?? 100),
      tolerance: String(existing?.data?.tolerance ?? 0.05),
    });
  }

  const confirmEdge = useCallback(() => {
    if (!edgeModal) return;
    const data: FlowEdgeData = {
      name:      edgeModal.name || generateEdgeName(),
      value:     Number(edgeModal.value)     || 0,
      tolerance: Number(edgeModal.tolerance) || 0,
    };

    const isEdit = 'id' in edgeModal.params && edges.some((e) => e.id === (edgeModal.params as Edge).id);

    if (isEdit) {
      setEdges((cur) => cur.map((e) =>
        e.id === (edgeModal.params as Edge).id ? { ...e, data, label: formatEdgeLabel(data) } : e,
      ));
    } else {
      const p = edgeModal.params as Connection;
      const edgeId = `edge-${Date.now()}`;
      // assign stable handle IDs based on current connection counts
      const outIdx = edges.filter((e) => e.source === p.source).length;
      const inIdx  = edges.filter((e) => e.target === p.target).length;
      setEdges((cur) =>
        addEdge({
          ...p,
          id: edgeId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          sourceHandle: p.sourceHandle ?? `s-${outIdx}`,
          targetHandle: p.targetHandle ?? `t-${inIdx}`,
          data,
          label: formatEdgeLabel(data),
        }, cur),
      );
    }
    setEdgeModal(null);
  }, [edgeModal, edges, setEdges]);

  // ─── ReactFlow handlers ────────────────────────────────────────────────────
  const onConnect = useCallback((params: Edge | Connection) => openEdgeModal(params), [edges]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    hoveredNodeId.current = node.id;
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    hoveredNodeId.current = null;
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    if (!pendingConn || node.id === pendingConn.sourceId) return;
    openEdgeModal({ source: pendingConn.sourceId, target: node.id, sourceHandle: null, targetHandle: null });
    setPendingConn(null);
  }, [pendingConn, edges]);

  const onNodeDoubleClick = useCallback((e: React.MouseEvent, node: Node<FlowNodeData>) => {
    e.preventDefault();
    setNodeMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  const onNodeContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    suppressNextCtx.current = false;
  }, []);

  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge<FlowEdgeData>) => {
    openEdgeModal(edge);
  }, [edges]);

  const onPaneClick = useCallback(() => {
    if (pendingConn) setPendingConn(null);
  }, [pendingConn]);

  // right-click on canvas → pane context menu
  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    if (pendingConn) { setPendingConn(null); return; }
    if (suppressNextCtx.current) { suppressNextCtx.current = false; return; }
    e.preventDefault();
    if (!rfInstance.current || !wrapperRef.current) return;
    const bounds  = wrapperRef.current.getBoundingClientRect();
    const flowPos = rfInstance.current.screenToFlowPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    setPaneMenu({ x: e.clientX, y: e.clientY, flowX: flowPos.x, flowY: flowPos.y });
  }, [pendingConn]);

  const addNodeAtPaneMenu = useCallback(() => {
    if (!paneMenu) return;
    const id = nextNodeId();
    setNodes((cur) => [...cur, makeNode(id, paneMenu.flowX, paneMenu.flowY)]);
  }, [paneMenu, setNodes]);

  const renameNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    const next = window.prompt('Nome do nó:', node?.data.label ?? '');
    if (!next) return;
    setNodes((cur) => cur.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, label: next } } : n));
  }, [nodes, setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((cur) => cur.filter((n) => n.id !== nodeId));
    setEdges((cur) => cur.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // ─── Reconcile ─────────────────────────────────────────────────────────────
  async function reconcile(jsonFile?: File) {
    try {
      setStatus('Processando...');
      let measurements = edges.map((e) => e.data?.value ?? 0);
      let tolerances   = edges.map((e) => e.data?.tolerance ?? 0);
      if (jsonFile) {
        const text    = await jsonFile.text();
        const payload = JSON.parse(text) as { measurements?: number[]; tolerances?: number[] };
        measurements  = payload.measurements ?? measurements;
        tolerances    = payload.tolerances   ?? tolerances;
      }
      const constraints = createAdjacencyMatrix();
      const result = await reconcileMutation.mutateAsync({ measurements, tolerances, constraints });
      saveReconciliationEntry({ id: Date.now(), user: 'Usuário Atual', time: new Date().toISOString(), tagname: edgeNames, tagreconciled: result.reconciled_values.map((v) => v.toFixed(2)), tagcorrection: result.corrections.map((v) => v.toFixed(2)), tagmatrix: constraints, status: result.consistency_status });
      setStatus(result.consistency_status);
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, 'Erro.'));
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await reconcile(file);
  }

  // ─── Toolbar styles ────────────────────────────────────────────────────────
  const btnBase: React.CSSProperties    = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: 11, fontWeight: 500, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer', whiteSpace: 'nowrap' };
  const btnPrimary: React.CSSProperties = { ...btnBase, border: '1px solid var(--accent-bd)', background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 };
  const sep = <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-md)', margin: '0 6px' }} />;
  const grp = (t: string) => <span style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'var(--tx-3)', paddingRight: 4, userSelect: 'none' as const }}>{t}</span>;

  return (
    <div className="flex h-full overflow-hidden" style={pendingConn ? { cursor: 'crosshair' } : undefined}>
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* toolbar */}
        <div className="flex shrink-0 items-center overflow-x-auto px-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', height: 38, gap: 0 }}>
          {grp('Exec')}
          <div style={{ display: 'flex', gap: 3 }}>
            <button type="button" style={btnPrimary} onClick={() => void reconcile()} data-testid="reconcile-button"><Play size={11} />Reconciliar</button>
            <button type="button" style={btnBase} onClick={() => fileRef.current?.click()}><Download size={11} />Importar JSON</button>
          </div>
          {sep}
          {grp('Vista')}
          <div style={{ display: 'flex', gap: 3 }}>
            <button type="button" style={btnBase} onClick={() => setSidebarVisible((v) => !v)}>{sidebarVisible ? 'Ocultar painel' : 'Exibir painel'}</button>
            <button type="button" style={btnBase} onClick={() => setSummaryVisible((v) => !v)}>{summaryVisible ? 'Ocultar resumo' : 'Exibir resumo'}</button>
          </div>
          {pendingConn && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', paddingLeft: 16 }}>Clique em um nó para conectar · Esc para cancelar</span>}
          {!pendingConn && status && <span style={{ marginLeft: 'auto', paddingLeft: 16, fontSize: 11, color: 'var(--tx-3)', whiteSpace: 'nowrap' }}>{status}</span>}
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </div>

        {/* canvas */}
        <div ref={wrapperRef} className="flex-1 overflow-hidden">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onInit={(i) => { rfInstance.current = i; }}
            fitView
            style={{ background: 'var(--canvas-bg)' }}
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--canvas-dot)" />
          </ReactFlow>
        </div>
      </div>

      {sidebarVisible && (
        <ReconciliationSidebar edges={edges} createAdjacencyMatrix={createAdjacencyMatrix} summaryVisible={summaryVisible} />
      )}

      {pendingConn && <GhostWire conn={pendingConn} />}

      {paneMenu && (
        <PaneMenu
          x={paneMenu.x} y={paneMenu.y}
          onAdd={addNodeAtPaneMenu}
          onClose={() => setPaneMenu(null)}
        />
      )}

      {nodeMenu && (
        <NodeMenu
          x={nodeMenu.x} y={nodeMenu.y}
          onRename={() => renameNode(nodeMenu.nodeId)}
          onDelete={() => deleteNode(nodeMenu.nodeId)}
          onClose={() => setNodeMenu(null)}
        />
      )}

      {edgeModal && (
        <EdgeModal
          state={edgeModal}
          onChange={(p) => setEdgeModal((prev) => prev ? { ...prev, ...p } : prev)}
          onConfirm={confirmEdge}
          onCancel={() => setEdgeModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ReconciliationSidebar({ edges, createAdjacencyMatrix, summaryVisible }: {
  edges: Edge<FlowEdgeData>[];
  createAdjacencyMatrix: () => number[][];
  summaryVisible: boolean;
}) {
  const matrix = createAdjacencyMatrix();
  const sec: React.CSSProperties  = { padding: '12px 14px', borderBottom: '1px solid var(--border)' };
  const lbl: React.CSSProperties  = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 8 };
  const card: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 4, background: 'var(--panel)' };

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={sec}>
        <p style={lbl}>Correntes</p>
        {edges.map((e) => (
          <div key={e.id} style={card}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-1)', margin: 0 }}>{e.data?.name}</p>
            <p style={{ fontSize: 10, color: 'var(--tx-3)', margin: '2px 0 0' }}>{e.data?.value ?? 0} ± {e.data?.tolerance ?? 0}</p>
          </div>
        ))}
      </div>
      <div style={sec}>
        <p style={lbl}>Matriz de incidência</p>
        <table style={{ fontSize: 11, color: 'var(--tx-2)', fontVariantNumeric: 'tabular-nums' }}>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '2px 8px 2px 0', fontFamily: 'monospace' }}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
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
  const sec: React.CSSProperties  = { padding: '12px 14px' };
  const lbl: React.CSSProperties  = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 8 };
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
