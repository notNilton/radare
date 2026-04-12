import type { Edge, Node, Viewport } from 'reactflow';
import type { WorkspaceFlowData } from '../../../types';
import type { FlowEdgeData, FlowNodeData } from './types';

export interface WorkspaceFlowSnapshot {
  edges: Edge<FlowEdgeData>[];
  nodes: Node<FlowNodeData>[];
  viewport?: Viewport;
}

function cloneWorkspaceFlow({
  edges,
  nodes,
  viewport,
}: WorkspaceFlowSnapshot): WorkspaceFlowData {
  return {
    edges: edges.map((edge) => ({
      ...edge,
      data: edge.data ? { ...edge.data } : edge.data,
      style: edge.style ? { ...edge.style } : edge.style,
    })),
    nodes: nodes.map((node) => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position },
    })),
    viewport: viewport ? { ...viewport } : undefined,
  };
}

export function createWorkspaceFlowData(snapshot: WorkspaceFlowSnapshot): WorkspaceFlowData {
  return cloneWorkspaceFlow(snapshot);
}

export function restoreWorkspaceFlowData(data: WorkspaceFlowData): WorkspaceFlowSnapshot {
  const cloned = cloneWorkspaceFlow({
    edges: (data.edges ?? []) as Edge<FlowEdgeData>[],
    nodes: (data.nodes ?? []) as Node<FlowNodeData>[],
    viewport: data.viewport,
  });

  return {
    edges: cloned.edges as Edge<FlowEdgeData>[],
    nodes: cloned.nodes as Node<FlowNodeData>[],
    viewport: cloned.viewport,
  };
}
