import { makeFlowEdge, makeNode } from './flowUtils';
import type { CanvasPreset } from './types';

export const canvasPresets: CanvasPreset[] = [
  {
    id: 'example-1',
    name: 'Exemplo 1',
    nodes: [
      makeNode('node-1', 80, 160, 'Entrada'),
      makeNode('node-2', 360, 160, 'Processo'),
      makeNode('node-3', 640, 160, 'Saída'),
    ],
    edges: [
      makeFlowEdge('edge-1', 'node-1', 'node-2', 'M1', 100, 0.02),
      makeFlowEdge('edge-2', 'node-2', 'node-3', 'M2', 98, 0.02),
    ],
  },
  {
    id: 'example-2',
    name: 'Exemplo 2',
    nodes: [
      makeNode('node-1', 80, 160, 'Entrada'),
      makeNode('node-2', 360, 160, 'Processo'),
      makeNode('node-3', 680, 100, 'Saída M2'),
      makeNode('node-4', 680, 220, 'Saída M3'),
    ],
    edges: [
      makeFlowEdge('edge-1', 'node-1', 'node-2', 'M1', 161, 0.05),
      makeFlowEdge('edge-2', 'node-2', 'node-3', 'M2', 79, 0.01),
      makeFlowEdge('edge-3', 'node-2', 'node-4', 'M3', 80, 0.01, 's-1'),
    ],
  },
  {
    id: 'example-3',
    name: 'Exemplo 3',
    nodes: [
      makeNode('node-1', 60, 180, 'Entrada'),
      makeNode('node-2', 300, 180, 'Nodo 1'),
      makeNode('node-3', 540, 180, 'Nodo 2'),
      makeNode('node-4', 540, 70, 'Saída M2'),
      makeNode('node-5', 780, 120, 'Saída M4'),
      makeNode('node-6', 780, 250, 'Saída M5'),
    ],
    edges: [
      makeFlowEdge('edge-1', 'node-1', 'node-2', 'M1', 161, 0.05),
      makeFlowEdge('edge-2', 'node-2', 'node-4', 'M2', 79, 0.01),
      makeFlowEdge('edge-3', 'node-2', 'node-3', 'M3', 80, 0.01, 's-1'),
      makeFlowEdge('edge-4', 'node-3', 'node-5', 'M4', 63, 0.10),
      makeFlowEdge('edge-5', 'node-3', 'node-6', 'M5', 20, 0.05, 's-1'),
    ],
  },
  {
    id: 'example-4',
    name: 'Exemplo 4',
    nodes: [
      makeNode('node-1', 360, 120, 'Nodo 1'),
      makeNode('node-2', 120, 30, 'Nodo 2'),
      makeNode('node-3', 120, 120, 'Nodo 3'),
      makeNode('node-4', 120, 210, 'Nodo 4'),
      makeNode('node-5', 120, 320, 'Nodo 5'),
      makeNode('node-6', -120, 170, 'Nodo 6'),
      makeNode('node-7', -120, 280, 'Nodo 7'),
      makeNode('node-8', -360, 150, 'Nodo 8'),
      makeNode('node-9', 620, 120, 'Destino A1'),
      makeNode('node-10', -120, 420, 'Fonte A12'),
      makeNode('node-11', -620, 150, 'Fonte A13'),
    ],
    edges: [
      makeFlowEdge('edge-1', 'node-1', 'node-9', 'A1', 101, 0.01),
      makeFlowEdge('edge-2', 'node-2', 'node-1', 'A2', 11, 0.05),
      makeFlowEdge('edge-3', 'node-3', 'node-1', 'A3', 19, 0.05),
      makeFlowEdge('edge-4', 'node-4', 'node-1', 'A4', 32, 0.05),
      makeFlowEdge('edge-5', 'node-5', 'node-1', 'A5', 41, 0.05),
      makeFlowEdge('edge-6', 'node-6', 'node-4', 'A6', 14, 0.05),
      makeFlowEdge('edge-7', 'node-7', 'node-4', 'A7', 15, 0.05),
      makeFlowEdge('edge-8', 'node-8', 'node-2', 'A8', 10, 0.05),
      makeFlowEdge('edge-9', 'node-8', 'node-3', 'A9', 21, 0.05, 's-1'),
      makeFlowEdge('edge-10', 'node-8', 'node-6', 'A10', 16, 0.05, 's-2'),
      makeFlowEdge('edge-11', 'node-5', 'node-7', 'A11', 15, 0.05, 's-1'),
      makeFlowEdge('edge-12', 'node-10', 'node-5', 'A12', 54, 0.01),
      makeFlowEdge('edge-13', 'node-11', 'node-8', 'A13', 48, 0.01),
    ],
  },
];

export const initialNodes = canvasPresets[1].nodes;
export const initialEdges = canvasPresets[1].edges;
