import type { CSSProperties } from 'react';
import { MarkerType, type Edge, type Node } from 'reactflow';
import type { FlowEdgeData, FlowNodeData } from './types';

let nodeSeq = 4;

export function nextNodeId() {
  return `node-${++nodeSeq}`;
}

export function syncNodeSeq(nextNodes: Node<FlowNodeData>[]) {
  const maxNodeId = nextNodes.reduce((max, node) => {
    const match = /^node-(\d+)$/.exec(node.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, nodeSeq);
  nodeSeq = Math.max(nodeSeq, maxNodeId);
}

export function formatEdgeLabel(d: FlowEdgeData) {
  const base = `${d.name} • ${d.value} ± ${d.tolerance}`;
  if (d.correctionPercent !== undefined && !isNaN(d.correctionPercent)) {
    const marker = d.isOutlier ? ' • outlier' : '';
    return `${base} (Δ ${d.correctionPercent.toFixed(1)}%)${marker}`;
  }
  return base;
}

export function getCorrectionHeatmapStyle(percent: number, isOutlier = false): CSSProperties {
  if (isOutlier) {
    return { stroke: 'var(--danger)', strokeWidth: 4, filter: 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.55))' };
  }

  if (percent >= 10) {
    return { stroke: 'var(--danger)', strokeWidth: 3.5 };
  }

  if (percent >= 5) {
    return { stroke: '#f59e0b', strokeWidth: 3 };
  }

  if (percent > 0) {
    return { stroke: 'var(--accent)', strokeWidth: 2.25 };
  }

  return { stroke: 'var(--tx-3)', strokeWidth: 2 };
}

export function generateEdgeName() {
  const names = ['Orion', 'Sigma', 'Phoenix', 'Delta', 'Atlas', 'Vega'];
  return names[Math.floor(Math.random() * names.length)];
}

export function makeNode(id: string, x: number, y: number, label?: string): Node<FlowNodeData> {
  return { id, type: 'node', position: { x, y }, data: { label: label ?? `Nó ${id.split('-')[1]}` } };
}

export function makeFlowEdge(
  id: string,
  source: string,
  target: string,
  name: string,
  value: number,
  tolerance: number,
  sourceHandle = 's-0',
  targetHandle = 't-0',
): Edge<FlowEdgeData> {
  const data = { name, value, tolerance };
  return {
    data,
    id,
    label: formatEdgeLabel(data),
    markerEnd: { type: MarkerType.ArrowClosed },
    source,
    sourceHandle,
    target,
    targetHandle,
    type: 'smoothstep',
  };
}
