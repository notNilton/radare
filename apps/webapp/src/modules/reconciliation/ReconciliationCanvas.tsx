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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Play } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { saveReconciliationEntry } from '../../lib/reconciliation-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowNodeVariant = 'source' | 'process' | 'split' | 'merge' | 'sink';

interface FlowNodeData {
  label: string;
  variant: FlowNodeVariant;
  processNode: boolean;
}

interface FlowEdgeData {
  name: string;
  value: number;
  tolerance: number;
}

interface PendingConn {
  sourceId: string;
  sx: number; // screen x of source node center
  sy: number; // screen y of source node center
  mx: number; // current mouse x
  my: number; // current mouse y
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEdgeLabel(d: FlowEdgeData) {
  return `${d.name} • ${d.value} ± ${d.tolerance}`;
}

function generateEdgeName() {
  const names = ['Orion', 'Sigma', 'Phoenix', 'Delta', 'Atlas', 'Vega'];
  return names[Math.floor(Math.random() * names.length)];
}

function createNode(id: string, variant: FlowNodeVariant, x: number, y: number): Node<FlowNodeData> {
  return {
    id, type: 'process-node', position: { x, y },
    data: {
      label:
        variant === 'source' ? 'Input'
        : variant === 'sink'  ? 'Output'
        : variant === 'split' ? 'Split'
        : variant === 'merge' ? 'Merge'
        : 'Processo',
      variant,
      processNode: variant === 'process' || variant === 'split' || variant === 'merge',
    },
  };
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialNodes: Node<FlowNodeData>[] = [
  createNode('source-1', 'source', 80, 120),
  createNode('process-1', 'process', 360, 120),
  createNode('sink-1', 'sink', 680, 120),
];

const initialEdges: Edge<FlowEdgeData>[] = [
  { id: 'edge-1', source: 'source-1', target: 'process-1', markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep', data: { name: 'Alucard', value: 161, tolerance: 0.05 }, label: 'Alucard • 161 ± 0.05' },
  { id: 'edge-2', source: 'process-1', target: 'sink-1',   markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep', data: { name: 'Laravel', value: 79,  tolerance: 0.01 }, label: 'Laravel • 79 ± 0.01'   },
];

const NODE_COLORS: Record<FlowNodeVariant, { bg: string; border: string }> = {
  source:  { bg: 'var(--node-src)', border: 'var(--node-src-b)' },
  sink:    { bg: 'var(--node-snk)', border: 'var(--node-snk-b)' },
  split:   { bg: 'var(--node-spl)', border: 'var(--node-spl-b)' },
  merge:   { bg: 'var(--node-mrg)', border: 'var(--node-mrg-b)' },
  process: { bg: 'var(--node-prc)', border: 'var(--node-prc-b)' },
};

// ─── Node component ───────────────────────────────────────────────────────────

function FlowProcessNode({ data }: NodeProps<FlowNodeData>) {
  const c = NODE_COLORS[data.variant];
  const dot = (type: 'source' | 'target', pos: Position, id?: string) => (
    <Handle type={type} position={pos} id={id}
      style={{ width: 7, height: 7, background: type === 'source' ? 'var(--accent)' : 'var(--tx-3)', border: '1px solid var(--border-md)' }} />
  );
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, color: 'var(--tx-1)', minWidth: 120, borderRadius: 4, padding: '10px 14px', textAlign: 'center' }}>
      {data.variant !== 'source'                       && dot('target', Position.Left)}
      {data.variant === 'merge'                        && dot('target', Position.Top, 'upper-in')}
      <div style={{ fontSize: 9, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{data.variant}</div>
      <div style={{ fontSize: 11, marginTop: 3, color: 'var(--tx-1)' }}>{data.label}</div>
      {data.variant !== 'split' && data.variant !== 'sink' && dot('source', Position.Right)}
      {data.variant === 'split' && <>{dot('source', Position.Top, 'upper-out')}{dot('source', Position.Bottom, 'lower-out')}</>}
    </div>
  );
}

const nodeTypes = { 'process-node': FlowProcessNode };

// ─── Context menu (pane right-click) ─────────────────────────────────────────

interface CtxMenu { x: number; y: number; flowX: number; flowY: number }

const NODE_VARIANTS: { variant: FlowNodeVariant; label: string; hint: string }[] = [
  { variant: 'source',  label: 'Input',    hint: 'Entrada de corrente' },
  { variant: 'process', label: 'Processo', hint: 'Nó de processo'      },
  { variant: 'split',   label: 'Split',    hint: 'Divisão de corrente' },
  { variant: 'merge',   label: 'Merge',    hint: 'Junção de correntes' },
  { variant: 'sink',    label: 'Output',   hint: 'Saída de corrente'   },
];

function ContextMenu({ x, y, onSelect, onClose }: { x: number; y: number; onSelect: (v: FlowNodeVariant) => void; onClose: () => void }) {
  useEffect(() => {
    const click = () => onClose();
    const key   = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', click);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('click', click); window.removeEventListener('keydown', key); };
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', top: y, left: x, zIndex: 1000, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 4, padding: 4, minWidth: 148, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ fontSize: 9, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '4px 8px 6px' }}>Adicionar nó</div>
      {NODE_VARIANTS.map(({ variant, label, hint }) => (
        <button key={variant} type="button"
          onClick={() => { onSelect(variant); onClose(); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '6px 8px', background: 'transparent', border: 'none', borderRadius: 3, cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-1)' }}>{label}</span>
          <span style={{ fontSize: 10, color: 'var(--tx-3)' }}>{hint}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Edge modal ───────────────────────────────────────────────────────────────

interface EdgeModalState { params: Edge | Connection; name: string; value: string; tolerance: string }

function EdgeModal({ state, onChange, onConfirm, onCancel }: {
  state: EdgeModalState;
  onChange: (p: Partial<Pick<EdgeModalState, 'name' | 'value' | 'tolerance'>>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: 12, background: 'var(--panel)', border: '1px solid var(--border-md)', borderRadius: 3, color: 'var(--tx-1)', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 };

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onConfirm, onCancel]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '20px 22px', width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nova corrente</p>
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

// ─── Ghost wire (pending connection line) ────────────────────────────────────

function GhostWire({ conn }: { conn: PendingConn }) {
  const dx = conn.mx - conn.sx;
  const cx = dx / 2;
  // cubic bezier: from source going right, to mouse going left
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

// ─── Main canvas ──────────────────────────────────────────────────────────────

export function ReconciliationCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus]               = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [ctxMenu, setCtxMenu]               = useState<CtxMenu | null>(null);
  const [edgeModal, setEdgeModal]           = useState<EdgeModalState | null>(null);
  const [pendingConn, setPendingConn]       = useState<PendingConn | null>(null);
  const fileRef    = useRef<HTMLInputElement | null>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // ref to track which node the mouse is currently hovering
  const hoveredNodeId = useRef<string | null>(null);
  // ref to suppress the contextmenu event that fires after right-click mouseup
  const suppressNextCtx = useRef(false);

  // track mouse while a pending connection is active
  useEffect(() => {
    if (!pendingConn) return;
    const move = (e: MouseEvent) => {
      setPendingConn((p) => p ? { ...p, mx: e.clientX, my: e.clientY } : null);
    };
    // right-click release → complete or cancel
    const up = (e: MouseEvent) => {
      if (e.button !== 2) return;
      suppressNextCtx.current = true; // suppress the contextmenu event that follows
      const targetId = hoveredNodeId.current;
      if (targetId && targetId !== pendingConn.sourceId) {
        const params: Connection = { source: pendingConn.sourceId, target: targetId, sourceHandle: null, targetHandle: null };
        setEdgeModal({ params, name: generateEdgeName(), value: '100', tolerance: '0.05' });
      }
      setPendingConn(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [pendingConn]);

  // Escape cancels pending connection
  useEffect(() => {
    if (!pendingConn) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPendingConn(null); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [pendingConn]);

  const reconcileMutation = useMutation({
    mutationFn: (payload: { constraints: number[][]; measurements: number[]; tolerances: number[] }) =>
      apiClient.post<{ reconciled_values: number[]; corrections: number[]; consistency_status: string }>('/reconcile', payload),
  });

  const edgeNames = useMemo(() => edges.map((e) => e.data?.name ?? e.id), [edges]);

  const createAdjacencyMatrix = useCallback(() => {
    const pnodes = nodes.filter((n) => n.data.processNode);
    const matrix = Array.from({ length: pnodes.length }, () => Array(edges.length).fill(0));
    edges.forEach((edge, ei) => {
      const si = pnodes.findIndex((n) => n.id === edge.source);
      const ti = pnodes.findIndex((n) => n.id === edge.target);
      if (si !== -1) matrix[si][ei] = -1;
      if (ti !== -1) matrix[ti][ei] = 1;
    });
    return matrix;
  }, [edges, nodes]);

  // normal handle-drag connection → modal
  const onConnect = useCallback((params: Edge | Connection) => {
    setEdgeModal({ params, name: generateEdgeName(), value: '100', tolerance: '0.05' });
  }, []);

  // native mousedown on the wrapper — intercepts right-click on any ReactFlow node
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
      const rfNode = rfInstance.current.getNode(nodeId);
      if (!rfNode) return;
      const screenPos = rfInstance.current.flowToScreenPosition({
        x: rfNode.position.x + 60,
        y: rfNode.position.y + 22,
      });
      setPendingConn({ sourceId: nodeId, sx: screenPos.x, sy: screenPos.y, mx: e.clientX, my: e.clientY });
    };
    el.addEventListener('mousedown', down);
    return () => el.removeEventListener('mousedown', down);
  }, []);

  // suppress the contextmenu event that fires after right-click mouseup on a node
  const onNodeContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (suppressNextCtx.current) {
      suppressNextCtx.current = false;
    }
  }, []);

  // track which node the mouse is over (used to complete drag connection on mouseup)
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    hoveredNodeId.current = node.id;
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    hoveredNodeId.current = null;
  }, []);

  // click on node while pending (click-mode fallback) → complete connection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    if (!pendingConn || node.id === pendingConn.sourceId) return;
    const params: Connection = { source: pendingConn.sourceId, target: node.id, sourceHandle: null, targetHandle: null };
    setEdgeModal({ params, name: generateEdgeName(), value: '100', tolerance: '0.05' });
    setPendingConn(null);
  }, [pendingConn]);

  // click on canvas while pending → cancel
  const onPaneClick = useCallback(() => {
    if (pendingConn) { setPendingConn(null); return; }
  }, [pendingConn]);

  // right-click on canvas (no pending) → context menu
  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    if (pendingConn) { setPendingConn(null); return; }
    e.preventDefault();
    if (!rfInstance.current || !wrapperRef.current) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const flowPos = rfInstance.current.screenToFlowPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    setCtxMenu({ x: e.clientX, y: e.clientY, flowX: flowPos.x, flowY: flowPos.y });
  }, [pendingConn]);

  const addNodeAtPosition = useCallback((variant: FlowNodeVariant) => {
    if (!ctxMenu) return;
    setNodes((cur) => [...cur, createNode(`${variant}-${Date.now()}`, variant, ctxMenu.flowX, ctxMenu.flowY)]);
  }, [ctxMenu, setNodes]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    const next = window.prompt('Nome do nó:', node.data.label);
    if (!next) return;
    setNodes((cur) => cur.map((n) => n.id === node.id ? { ...n, data: { ...n.data, label: next } } : n));
  }, [setNodes]);

  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge<FlowEdgeData>) => {
    setEdgeModal({ params: edge, name: edge.data?.name ?? '', value: String(edge.data?.value ?? 0), tolerance: String(edge.data?.tolerance ?? 0) });
  }, []);

  const confirmEdge = useCallback(() => {
    if (!edgeModal) return;
    const data: FlowEdgeData = { name: edgeModal.name || generateEdgeName(), value: Number(edgeModal.value) || 0, tolerance: Number(edgeModal.tolerance) || 0 };
    const isEdit = 'id' in edgeModal.params && edges.some((e) => e.id === (edgeModal.params as Edge).id);
    if (isEdit) {
      setEdges((cur) => cur.map((e) => e.id === (edgeModal.params as Edge).id ? { ...e, data, label: formatEdgeLabel(data) } : e));
    } else {
      setEdges((cur) => addEdge({ ...edgeModal.params, id: `edge-${Date.now()}`, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, data, label: formatEdgeLabel(data) }, cur));
    }
    setEdgeModal(null);
  }, [edgeModal, edges, setEdges]);

  async function reconcile(jsonFile?: File) {
    try {
      setStatus('Processando...');
      let measurements = edges.map((e) => e.data?.value ?? 0);
      let tolerances   = edges.map((e) => e.data?.tolerance ?? 0);
      if (jsonFile) {
        const text = await jsonFile.text();
        const payload = JSON.parse(text) as { measurements?: number[]; tolerances?: number[] };
        measurements = payload.measurements ?? measurements;
        tolerances   = payload.tolerances   ?? tolerances;
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

  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: 11, fontWeight: 500, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer', whiteSpace: 'nowrap' };
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

      {sidebarVisible && <ReconciliationSidebar edges={edges} createAdjacencyMatrix={createAdjacencyMatrix} summaryVisible={summaryVisible} />}

      {pendingConn && <GhostWire conn={pendingConn} />}

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} onSelect={addNodeAtPosition} onClose={() => setCtxMenu(null)} />}

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

function ReconciliationSidebar({ edges, createAdjacencyMatrix, summaryVisible }: { edges: Edge<FlowEdgeData>[]; createAdjacencyMatrix: () => number[][]; summaryVisible: boolean }) {
  const matrix = createAdjacencyMatrix();
  const sec: React.CSSProperties  = { padding: '12px 14px', borderBottom: '1px solid var(--border)' };
  const lbl: React.CSSProperties  = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 8 };
  const card: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 4, background: 'var(--panel)' };

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={sec}>
        <p style={lbl}>Correntes</p>
        {edges.map((edge) => (
          <div key={edge.id} style={card}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-1)', margin: 0 }}>{edge.data?.name}</p>
            <p style={{ fontSize: 10, color: 'var(--tx-3)', margin: '2px 0 0' }}>{edge.data?.value ?? 0} ± {edge.data?.tolerance ?? 0}</p>
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
