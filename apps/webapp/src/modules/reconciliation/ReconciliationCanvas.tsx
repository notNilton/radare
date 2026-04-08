import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
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
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Eye, GitBranchPlus, Play, Rows3, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { saveReconciliationEntry } from '../../lib/reconciliation-storage';

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

function formatEdgeLabel(data: FlowEdgeData) {
  return `${data.name} • ${data.value} ± ${data.tolerance}`;
}

function generateEdgeName() {
  const names = ['Orion', 'Sigma', 'Phoenix', 'Delta', 'Atlas', 'Vega'];
  return names[Math.floor(Math.random() * names.length)];
}

function createNode(id: string, variant: FlowNodeVariant, x: number, y: number): Node<FlowNodeData> {
  return {
    id,
    type: 'process-node',
    position: { x, y },
    data: {
      label:
        variant === 'source'
          ? 'Input'
          : variant === 'sink'
            ? 'Output'
            : variant === 'split'
              ? 'Split'
              : variant === 'merge'
                ? 'Merge'
                : 'Processo',
      variant,
      processNode: variant === 'process' || variant === 'split' || variant === 'merge',
    },
  };
}

const initialNodes: Node<FlowNodeData>[] = [
  createNode('source-1', 'source', 80, 120),
  createNode('process-1', 'process', 360, 120),
  createNode('sink-1', 'sink', 680, 120),
];

const initialEdges: Edge<FlowEdgeData>[] = [
  {
    id: 'edge-1',
    source: 'source-1',
    target: 'process-1',
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
    data: { name: 'Alucard', value: 161, tolerance: 0.05 },
    label: 'Alucard • 161 ± 0.05',
  },
  {
    id: 'edge-2',
    source: 'process-1',
    target: 'sink-1',
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
    data: { name: 'Laravel', value: 79, tolerance: 0.01 },
    label: 'Laravel • 79 ± 0.01',
  },
];

function FlowProcessNode({ data }: NodeProps<FlowNodeData>) {
  const base = 'rounded-3xl border px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] shadow-lg backdrop-blur';
  const tone =
    data.variant === 'source'
      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
      : data.variant === 'sink'
        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
        : data.variant === 'split'
          ? 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100'
          : data.variant === 'merge'
            ? 'border-amber-400/40 bg-amber-400/10 text-amber-100'
            : 'border-white/15 bg-white/5 text-white';

  return (
    <div className={`${base} ${tone} min-w-[152px]`}>
      {(data.variant === 'process' || data.variant === 'split' || data.variant === 'merge' || data.variant === 'sink') ? (
        <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-slate-100" />
      ) : null}
      {(data.variant === 'merge') ? (
        <Handle type="target" id="upper-in" position={Position.Top} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-slate-100" />
      ) : null}

      <div className="text-[0.65rem] text-slate-300">{data.variant}</div>
      <div className="mt-2 text-sm tracking-normal text-white">{data.label}</div>

      {(data.variant === 'source' || data.variant === 'process' || data.variant === 'merge' || data.variant === 'sink') ? (
        <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-300" />
      ) : null}
      {(data.variant === 'split') ? (
        <>
          <Handle type="source" id="upper-out" position={Position.Top} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-300" />
          <Handle type="source" id="lower-out" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-cyan-300" />
        </>
      ) : null}
    </div>
  );
}

const nodeTypes = {
  'process-node': FlowProcessNode,
};

export function ReconciliationCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus] = useState('Monte o fluxo e execute a reconciliação.');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const edgeNames = useMemo(
    () => edges.map((edge) => edge.data?.name ?? edge.id),
    [edges],
  );

  const createAdjacencyMatrix = useCallback(() => {
    const processNodes = nodes.filter((node) => node.data.processNode);
    const matrix = Array.from({ length: processNodes.length }, () =>
      Array(edges.length).fill(0),
    );

    edges.forEach((edge, edgeIndex) => {
      const sourceIndex = processNodes.findIndex((node) => node.id === edge.source);
      const targetIndex = processNodes.findIndex((node) => node.id === edge.target);

      if (sourceIndex !== -1) {
        matrix[sourceIndex][edgeIndex] = -1;
      }
      if (targetIndex !== -1) {
        matrix[targetIndex][edgeIndex] = 1;
      }
    });

    return matrix;
  }, [edges, nodes]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const data: FlowEdgeData = {
        name: generateEdgeName(),
        value: 100,
        tolerance: 0.05,
      };

      setEdges((currentEdges) =>
        addEdge(
          {
            ...params,
            id: `edge-${Date.now()}`,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            data,
            label: formatEdgeLabel(data),
          },
          currentEdges,
        ),
      );
    },
    [setEdges],
  );

  const addNode = useCallback(
    (variant: FlowNodeVariant) => {
      const id = `${variant}-${Date.now()}`;
      setNodes((currentNodes) => [
        ...currentNodes,
        createNode(
          id,
          variant,
          180 + currentNodes.length * 80,
          180 + (currentNodes.length % 3) * 110,
        ),
      ]);
    },
    [setNodes],
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      const nextLabel = window.prompt('Novo nome para o nó:', node.data.label);
      if (!nextLabel) {
        return;
      }

      setNodes((currentNodes) =>
        currentNodes.map((entry) =>
          entry.id === node.id
            ? { ...entry, data: { ...entry.data, label: nextLabel } }
            : entry,
        ),
      );
    },
    [setNodes],
  );

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge<FlowEdgeData>) => {
      const name = window.prompt('Nome da conexão:', edge.data?.name ?? '');
      const value = window.prompt('Valor da corrente:', String(edge.data?.value ?? 0));
      const tolerance = window.prompt(
        'Tolerância da corrente:',
        String(edge.data?.tolerance ?? 0),
      );

      if (!name || !value || !tolerance) {
        return;
      }

      const nextData: FlowEdgeData = {
        name,
        value: Number(value),
        tolerance: Number(tolerance),
      };

      if (Number.isNaN(nextData.value) || Number.isNaN(nextData.tolerance)) {
        return;
      }

      setEdges((currentEdges) =>
        currentEdges.map((entry) =>
          entry.id === edge.id
            ? { ...entry, data: nextData, label: formatEdgeLabel(nextData) }
            : entry,
        ),
      );
    },
    [setEdges],
  );

  async function reconcile(jsonFile?: File) {
    try {
      setStatus('Enviando fluxo para o backend...');

      let measurements = edges.map((edge) => edge.data?.value ?? 0);
      let tolerances = edges.map((edge) => edge.data?.tolerance ?? 0);

      if (jsonFile) {
        const text = await jsonFile.text();
        const payload = JSON.parse(text) as {
          measurements?: number[];
          tolerances?: number[];
        };
        measurements = payload.measurements ?? measurements;
        tolerances = payload.tolerances ?? tolerances;
      }

      const constraints = createAdjacencyMatrix();
      const response = await api.post('/reconcile', {
        measurements,
        tolerances,
        constraints,
      });

      const result = response.data as {
        reconciled_values: number[];
        corrections: number[];
        consistency_status: string;
      };

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

      setStatus(`Reconciliação concluída: ${result.consistency_status}`);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error && 'response' in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Erro durante a reconciliação.')
          : 'Erro durante a reconciliação.';
      setStatus(message);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      await reconcile(file);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Fluxo de reconciliação</h3>
              <p className="text-sm text-slate-400">
                Duplo clique em nós e conexões para editar seus parâmetros.
              </p>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
              {status}
            </div>
          </div>
        </div>

        <div className="h-[620px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            fitView
            className="bg-slate-950"
          >
            <Panel position="top-left">
              <div className="flex max-w-[360px] flex-wrap gap-2 rounded-3xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950"
                  onClick={() => addNode('source')}
                >
                  <Rows3 className="h-4 w-4" />
                  Input
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => addNode('process')}
                >
                  <GitBranchPlus className="h-4 w-4" />
                  Processo
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => addNode('split')}
                >
                  <Sparkles className="h-4 w-4" />
                  Split
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => addNode('merge')}
                >
                  <Rows3 className="h-4 w-4" />
                  Merge
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => addNode('sink')}
                >
                  <Eye className="h-4 w-4" />
                  Output
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950"
                  onClick={() => void reconcile()}
                  data-testid="reconcile-button"
                >
                  <Play className="h-4 w-4" />
                  Reconciliar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => fileRef.current?.click()}
                >
                  <Download className="h-4 w-4" />
                  Upload JSON
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => setSidebarVisible((current) => !current)}
                >
                  <Rows3 className="h-4 w-4" />
                  {sidebarVisible ? 'Ocultar painel' : 'Mostrar painel'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => setSummaryVisible((current) => !current)}
                >
                  <Sparkles className="h-4 w-4" />
                  {summaryVisible ? 'Ocultar resumo' : 'Mostrar resumo'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </Panel>
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>

      {sidebarVisible ? (
        <ReconciliationSidebar
          edges={edges}
          createAdjacencyMatrix={createAdjacencyMatrix}
          summaryVisible={summaryVisible}
        />
      ) : null}
    </div>
  );
}

function ReconciliationSidebar({
  edges,
  createAdjacencyMatrix,
  summaryVisible,
}: {
  edges: Edge<FlowEdgeData>[];
  createAdjacencyMatrix: () => number[][];
  summaryVisible: boolean;
}) {
  const latestMatrix = createAdjacencyMatrix();

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
        <h3 className="text-lg font-semibold text-white">Correntes configuradas</h3>
        <div className="mt-4 space-y-3">
          {edges.map((edge) => (
            <div
              key={edge.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="text-sm font-semibold text-white">{edge.data?.name}</div>
              <div className="mt-1 text-xs text-slate-400">
                Valor: {edge.data?.value ?? 0} • Tolerância: {edge.data?.tolerance ?? 0}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
        <h3 className="text-lg font-semibold text-white">Matriz de incidência</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300">
            <tbody>
              {latestMatrix.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-white/5 last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {summaryVisible ? <ReconciliationSummary /> : null}
    </div>
  );
}

function ReconciliationSummary() {
  const latest = (() => {
    try {
      return JSON.parse(localStorage.getItem('reconciliationData') || '[]')[0] as
        | {
            tagreconciled?: string[];
            tagcorrection?: string[];
          }
        | undefined;
    } catch {
      return undefined;
    }
  })();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
      <h3 className="text-lg font-semibold text-white">Valores de Correção</h3>
      <div className="mt-4 space-y-3">
        {latest?.tagcorrection?.length ? (
          latest.tagcorrection.map((value, index) => (
            <div key={`${value}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Correção {index + 1}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{value}</div>
              <div className="text-xs text-cyan-200">
                Reconciliado: {latest.tagreconciled?.[index] ?? '--'}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">
            Execute a reconciliação para preencher este painel.
          </p>
        )}
      </div>
    </section>
  );
}
