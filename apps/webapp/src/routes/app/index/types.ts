import type { Connection, Edge, Node } from '@xyflow/react';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
}

export interface FlowEdgeData extends Record<string, unknown> {
  name: string;
  value: number;
  tolerance: number;
  correction?: number;
  correctionPercent?: number;
  isOutlier?: boolean;
}

export interface PendingConn {
  sourceId: string;
  sx: number;
  sy: number;
  mx: number;
  my: number;
}

export interface EdgeModalState {
  params: Edge | Connection;
  name: string;
  value: string;
  tolerance: string;
}

export interface WorkspaceDraft {
  description: string;
  id?: number;
  name: string;
}

export interface CanvasPreset {
  id: string;
  name: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
}
