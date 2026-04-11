import type { Connection, Edge } from 'reactflow';

export interface FlowNodeData {
  label: string;
}

export interface FlowEdgeData {
  name: string;
  value: number;
  tolerance: number;
  correction?: number;
  correctionPercent?: number;
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
  nodes: import('reactflow').Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
}
