import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MarkerType,
  Node,
  ReactFlow,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getErrorMessage } from '../../lib/api-client';
import { saveReconciliationEntry } from '../../lib/reconciliation-storage';
import { useReconcile } from '../../hooks/useReconcile';
import { useDeleteWorkspace, useSaveWorkspace, useWorkspaces } from '../../hooks/useWorkspaces';
import type { ReconcileResult, Workspace } from '../../types';
import { EdgeModal } from './components/EdgeModal';
import { FlowNode, nodeTypes } from './components/FlowNode';
import { GhostWire } from './components/GhostWire';
import { NodeMenu, PaneMenu } from './components/ContextMenus';
import { ReconciliationSidebar } from './components/ReconciliationSidebar';
import { ReconciliationToolbar } from './components/ReconciliationToolbar';
import { WorkspaceLoadModal, WorkspaceSaveModal } from './components/WorkspaceModals';
import { formatEdgeLabel, generateEdgeName, makeNode, nextNodeId, syncNodeSeq } from './flowUtils';
import { canvasPresets, initialEdges, initialNodes } from './presets';
import type { CanvasPreset, EdgeModalState, FlowEdgeData, FlowNodeData, PendingConn, WorkspaceDraft } from './types';

export { FlowNode };

function useAdjacencyMatrix(nodes: Node<FlowNodeData>[], edges: Edge<FlowEdgeData>[]) {
  return useMemo(() => {
    const processNodes = nodes.filter((node) => {
      const inCount = edges.filter((edge) => edge.target === node.id).length;
      const outCount = edges.filter((edge) => edge.source === node.id).length;
      return inCount > 0 && outCount > 0;
    });

    const matrix = Array.from({ length: processNodes.length }, () => Array(edges.length).fill(0));
    edges.forEach((edge, edgeIndex) => {
      const sourceIndex = processNodes.findIndex((node) => node.id === edge.source);
      const targetIndex = processNodes.findIndex((node) => node.id === edge.target);
      if (sourceIndex !== -1) matrix[sourceIndex][edgeIndex] = -1;
      if (targetIndex !== -1) matrix[targetIndex][edgeIndex] = 1;
    });
    return matrix;
  }, [edges, nodes]);
}

export function ReconciliationCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus] = useState<string | null>(null);
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [edgeModal, setEdgeModal] = useState<EdgeModalState | null>(null);
  const [pendingConn, setPendingConn] = useState<PendingConn | null>(null);
  const [paneMenu, setPaneMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceDraft>({ description: '', name: '' });
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceDraft | null>(null);

  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hoveredNodeId = useRef<string | null>(null);
  const suppressNextCtx = useRef(false);

  const reconcileMutation = useReconcile();
  const { data: workspaces = [], isLoading: workspacesLoading } = useWorkspaces();
  const saveWorkspaceMutation = useSaveWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();

  const edgeNames = useMemo(() => edges.map((edge) => edge.data?.name ?? edge.id), [edges]);
  const adjacencyMatrix = useAdjacencyMatrix(nodes, edges);

  const openEdgeModal = useCallback((params: Edge | Connection) => {
    const existing = 'id' in params ? edges.find((edge) => edge.id === (params as Edge).id) : undefined;
    setEdgeModal({
      params,
      name: existing?.data?.name ?? generateEdgeName(),
      value: String(existing?.data?.value ?? 100),
      tolerance: String(existing?.data?.tolerance ?? 0.05),
    });
  }, [edges]);

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

      const sourceHandles = Array.from(nodeEl.querySelectorAll<HTMLElement>('.react-flow__handle-source'));
      let sx: number;
      let sy: number;
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
        sy = r.top + r.height / 2;
      } else {
        const r = nodeEl.getBoundingClientRect();
        sx = r.right;
        sy = r.top + r.height / 2;
      }

      setPendingConn({ sourceId: nodeId, sx, sy, mx: e.clientX, my: e.clientY });
    };

    el.addEventListener('mousedown', down);
    return () => el.removeEventListener('mousedown', down);
  }, []);

  useEffect(() => {
    if (!pendingConn) return;
    const move = (e: MouseEvent) => setPendingConn((p) => p ? { ...p, mx: e.clientX, my: e.clientY } : null);
    const up = (e: MouseEvent) => {
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
  }, [openEdgeModal, pendingConn]);

  useEffect(() => {
    if (!pendingConn) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setPendingConn(null); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [pendingConn]);

  const confirmEdge = useCallback(() => {
    if (!edgeModal) return;
    const data: FlowEdgeData = {
      name: edgeModal.name || generateEdgeName(),
      value: Number(edgeModal.value) || 0,
      tolerance: Number(edgeModal.tolerance) || 0,
    };

    const isEdit = 'id' in edgeModal.params && edges.some((edge) => edge.id === (edgeModal.params as Edge).id);
    if (isEdit) {
      setEdges((cur) => cur.map((edge) =>
        edge.id === (edgeModal.params as Edge).id ? { ...edge, data, label: formatEdgeLabel(data) } : edge,
      ));
    } else {
      const params = edgeModal.params as Connection;
      const outIdx = edges.filter((edge) => edge.source === params.source).length;
      const inIdx = edges.filter((edge) => edge.target === params.target).length;
      setEdges((cur) =>
        addEdge({
          ...params,
          id: `edge-${Date.now()}`,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          sourceHandle: params.sourceHandle ?? `s-${outIdx}`,
          targetHandle: params.targetHandle ?? `t-${inIdx}`,
          data,
          label: formatEdgeLabel(data),
        }, cur),
      );
    }
    setEdgeModal(null);
  }, [edgeModal, edges, setEdges]);

  const onConnect = useCallback((params: Edge | Connection) => openEdgeModal(params), [openEdgeModal]);
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    hoveredNodeId.current = node.id;
  }, []);
  const onNodeMouseLeave = useCallback(() => { hoveredNodeId.current = null; }, []);
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    if (!pendingConn || node.id === pendingConn.sourceId) return;
    openEdgeModal({ source: pendingConn.sourceId, target: node.id, sourceHandle: null, targetHandle: null });
    setPendingConn(null);
  }, [openEdgeModal, pendingConn]);
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
  }, [openEdgeModal]);
  const onPaneClick = useCallback(() => {
    if (pendingConn) setPendingConn(null);
  }, [pendingConn]);
  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    if (pendingConn) { setPendingConn(null); return; }
    if (suppressNextCtx.current) { suppressNextCtx.current = false; return; }
    e.preventDefault();
    if (!rfInstance.current || !wrapperRef.current) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
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
    setNodes((cur) => cur.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, label: next } } : node));
  }, [nodes, setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((cur) => cur.filter((node) => node.id !== nodeId));
    setEdges((cur) => cur.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  function openSaveWorkspaceModal(mode: 'create' | 'update' = 'create') {
    const isUpdate = mode === 'update' && activeWorkspace;
    setWorkspaceDraft({
      description: isUpdate ? activeWorkspace.description : '',
      id: isUpdate ? activeWorkspace.id : undefined,
      name: isUpdate ? activeWorkspace.name : `Layout operacional ${workspaces.length + 1}`,
    });
    setSaveModalOpen(true);
  }

  async function saveWorkspace() {
    if (!rfInstance.current) {
      setStatus('Canvas ainda não está pronto.');
      return;
    }
    if (!workspaceDraft.name.trim()) {
      setStatus('Nome do layout é obrigatório.');
      return;
    }

    try {
      const saved = await saveWorkspaceMutation.mutateAsync({
        id: workspaceDraft.id,
        name: workspaceDraft.name.trim(),
        description: workspaceDraft.description.trim(),
        data: rfInstance.current.toObject(),
      });
      setWorkspaceDraft({ description: saved.description, id: saved.ID, name: saved.name });
      setActiveWorkspace({ description: saved.description, id: saved.ID, name: saved.name });
      setSaveModalOpen(false);
      setStatus(`Layout "${saved.name}" salvo.`);
    } catch (error) {
      setStatus(getErrorMessage(error, 'Não foi possível salvar o layout.'));
    }
  }

  function loadWorkspace(workspace: Workspace) {
    const nextNodes = (workspace.data.nodes ?? []) as Node<FlowNodeData>[];
    const nextEdges = (workspace.data.edges ?? []) as Edge<FlowEdgeData>[];
    setNodes(nextNodes);
    setEdges(nextEdges);
    syncNodeSeq(nextNodes);
    setActiveWorkspace({ description: workspace.description, id: workspace.ID, name: workspace.name });
    setWorkspaceDraft({ description: workspace.description, id: workspace.ID, name: workspace.name });
    setLoadModalOpen(false);
    setStatus(`Layout "${workspace.name}" carregado.`);

    if (workspace.data.viewport) {
      window.requestAnimationFrame(() => {
        void rfInstance.current?.setViewport(workspace.data.viewport!);
      });
    }
  }

  function loadCanvasPreset(preset: CanvasPreset) {
    const nextNodes = preset.nodes.map((node) => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position },
    }));
    const nextEdges = preset.edges.map((edge) => ({
      ...edge,
      data: edge.data ? { ...edge.data } : edge.data,
    }));

    setNodes(nextNodes);
    setEdges(nextEdges);
    syncNodeSeq(nextNodes);
    setActiveWorkspace(null);
    setWorkspaceDraft({ description: '', name: '' });
    setReconcileResult(null);
    setStatus(`${preset.name} carregado.`);
    window.requestAnimationFrame(() => {
      rfInstance.current?.fitView({ padding: 0.16 });
    });
  }

  async function deleteWorkspace(workspace: Workspace) {
    if (!window.confirm(`Excluir o layout "${workspace.name}"?`)) return;

    try {
      await deleteWorkspaceMutation.mutateAsync(workspace.ID);
      setStatus(`Layout "${workspace.name}" excluído.`);
      if (workspaceDraft.id === workspace.ID) setWorkspaceDraft({ description: '', name: '' });
      if (activeWorkspace?.id === workspace.ID) setActiveWorkspace(null);
    } catch (error) {
      setStatus(getErrorMessage(error, 'Não foi possível excluir o layout.'));
    }
  }

  async function reconcile(jsonFile?: File) {
    try {
      setStatus('Processando...');
      let measurements = edges.map((edge) => edge.data?.value ?? 0);
      let tolerances = edges.map((edge) => edge.data?.tolerance ?? 0);
      if (jsonFile) {
        const text = await jsonFile.text();
        const payload = JSON.parse(text) as { measurements?: number[]; tolerances?: number[] };
        measurements = payload.measurements ?? measurements;
        tolerances = payload.tolerances ?? tolerances;
      }

      const constraints = adjacencyMatrix;
      const result = await reconcileMutation.mutateAsync({ measurements, tolerances, constraints });
      setReconcileResult(result);
      applyReconciliationToEdges(result, measurements);
      saveReconciliationEntry({
        id: Date.now(),
        user: 'Usuário Atual',
        time: new Date().toISOString(),
        tagname: edgeNames,
        tagreconciled: result.reconciled_values.map((value) => value.toFixed(2)),
        tagcorrection: result.corrections.map((value) => value.toFixed(2)),
        tagmatrix: constraints,
        status: result.consistency_status,
      });
      setStatus(result.consistency_status);
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, 'Erro.'));
    }
  }

  function applyReconciliationToEdges(result: ReconcileResult, measurements: number[]) {
    setEdges((cur) => cur.map((edge, index) => {
      const correction = result.corrections[index] ?? 0;
      const measurement = measurements[index] ?? 0;
      const percent = (measurement !== 0 && !isNaN(correction)) ? (Math.abs(correction) / Math.abs(measurement)) * 100 : 0;
      const data: FlowEdgeData = { ...edge.data!, correction, correctionPercent: percent };

      return {
        ...edge,
        data,
        label: formatEdgeLabel(data),
        style: {
          ...edge.style,
          stroke: percent > 10 ? 'var(--danger)' : percent > 5 ? '#f59e0b' : 'var(--accent)',
          strokeWidth: percent > 5 ? 3 : 2,
        },
      };
    }));
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await reconcile(file);
  }

  return (
    <div className="flex h-full overflow-hidden" style={pendingConn ? { cursor: 'crosshair' } : undefined}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ReconciliationToolbar
          activeWorkspace={Boolean(activeWorkspace)}
          onFileUpload={handleFileUpload}
          onLoadLayouts={() => setLoadModalOpen(true)}
          onLoadPreset={loadCanvasPreset}
          onReconcile={() => void reconcile()}
          onSaveNew={() => openSaveWorkspaceModal('create')}
          onToggleSidebar={() => setSidebarVisible((visible) => !visible)}
          onToggleSummary={() => setSummaryVisible((visible) => !visible)}
          onUpdateLayout={() => openSaveWorkspaceModal('update')}
          pendingConnection={Boolean(pendingConn)}
          presets={canvasPresets}
          reconcileResult={reconcileResult}
          sidebarVisible={sidebarVisible}
          status={status}
          summaryVisible={summaryVisible}
        />

        <div ref={wrapperRef} className="flex-1 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onInit={(instance) => { rfInstance.current = instance; }}
            fitView
            style={{ background: 'var(--canvas-bg)' }}
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--canvas-dot)" />
          </ReactFlow>
        </div>
      </div>

      {sidebarVisible && (
        <ReconciliationSidebar
          edges={edges}
          matrix={adjacencyMatrix}
          summaryVisible={summaryVisible}
          reconcileResult={reconcileResult}
        />
      )}

      {pendingConn && <GhostWire conn={pendingConn} />}

      {paneMenu && (
        <PaneMenu
          x={paneMenu.x}
          y={paneMenu.y}
          onAdd={addNodeAtPaneMenu}
          onClose={() => setPaneMenu(null)}
        />
      )}

      {nodeMenu && (
        <NodeMenu
          x={nodeMenu.x}
          y={nodeMenu.y}
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

      {saveModalOpen && (
        <WorkspaceSaveModal
          draft={workspaceDraft}
          isSaving={saveWorkspaceMutation.isPending}
          onCancel={() => setSaveModalOpen(false)}
          onChange={setWorkspaceDraft}
          onConfirm={() => void saveWorkspace()}
        />
      )}

      {loadModalOpen && (
        <WorkspaceLoadModal
          isDeleting={deleteWorkspaceMutation.isPending}
          isLoading={workspacesLoading}
          onCancel={() => setLoadModalOpen(false)}
          onDelete={(workspace) => void deleteWorkspace(workspace)}
          onLoad={loadWorkspace}
          workspaces={workspaces}
        />
      )}
    </div>
  );
}
