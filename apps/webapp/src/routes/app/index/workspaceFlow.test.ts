import { describe, expect, it } from 'vitest';
import { createWorkspaceFlowData, restoreWorkspaceFlowData } from './workspaceFlow';
import type { FlowEdgeData, FlowNodeData } from './types';
import type { Edge, Node } from 'reactflow';

describe('workspace flow serialization', () => {
  it('preserva grafos complexos ao salvar e restaurar', () => {
    const nodes: Node<FlowNodeData>[] = [
      {
        id: 'node-source',
        type: 'node',
        position: { x: -120.5, y: 32.25 },
        data: { label: 'Fonte' },
      },
      {
        id: 'node-process',
        type: 'node',
        position: { x: 240, y: 80 },
        data: { label: 'Misturador' },
      },
      {
        id: 'node-output',
        type: 'node',
        position: { x: 560, y: 16 },
        data: { label: 'Produto' },
      },
    ];
    const edges: Edge<FlowEdgeData>[] = [
      {
        id: 'edge-feed',
        source: 'node-source',
        target: 'node-process',
        sourceHandle: 's-0',
        targetHandle: 't-0',
        type: 'smoothstep',
        label: 'F1 • 120 ± 0.02',
        data: {
          correction: -0.42,
          correctionPercent: 0.35,
          isOutlier: false,
          name: 'F1',
          tolerance: 0.02,
          value: 120,
        },
        style: { stroke: 'var(--accent)', strokeWidth: 2.25 },
      },
      {
        id: 'edge-output',
        source: 'node-process',
        target: 'node-output',
        sourceHandle: 's-1',
        targetHandle: 't-0',
        type: 'smoothstep',
        label: 'F2 • 119.5 ± 0.01',
        data: {
          correction: 0.5,
          correctionPercent: 0.42,
          isOutlier: true,
          name: 'F2',
          tolerance: 0.01,
          value: 119.5,
        },
        style: { filter: 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.55))', stroke: 'var(--danger)', strokeWidth: 4 },
      },
    ];
    const viewport = { x: 42, y: -18, zoom: 0.85 };

    const saved = createWorkspaceFlowData({ edges, nodes, viewport });
    const restored = restoreWorkspaceFlowData(JSON.parse(JSON.stringify(saved)));

    expect(restored.nodes).toEqual(nodes);
    expect(restored.edges).toEqual(edges);
    expect(restored.viewport).toEqual(viewport);
  });
});
