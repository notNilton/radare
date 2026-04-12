INSERT INTO workspaces (
    name,
    description,
    owner_id,
    tenant_id,
    data
)
SELECT
    'Exemplo 2 - balanço simples',
    'Topologia com uma entrada e duas saídas: M1 - M2 - M3 = 0.',
    users.id,
    users.tenant_id,
    '{
      "nodes": [
        {"id": "node-1", "type": "node", "position": {"x": 80, "y": 160}, "data": {"label": "Entrada"}},
        {"id": "node-2", "type": "node", "position": {"x": 360, "y": 160}, "data": {"label": "Processo"}},
        {"id": "node-3", "type": "node", "position": {"x": 680, "y": 100}, "data": {"label": "Saída M2"}},
        {"id": "node-4", "type": "node", "position": {"x": 680, "y": 220}, "data": {"label": "Saída M3"}}
      ],
      "edges": [
        {"id": "edge-1", "source": "node-1", "target": "node-2", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "M1", "value": 161, "tolerance": 0.05}, "label": "M1 • 161 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-2", "source": "node-2", "target": "node-3", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "M2", "value": 79, "tolerance": 0.01}, "label": "M2 • 79 ± 0.01", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-3", "source": "node-2", "target": "node-4", "sourceHandle": "s-1", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "M3", "value": 80, "tolerance": 0.01}, "label": "M3 • 80 ± 0.01", "markerEnd": {"type": "arrowclosed"}}
      ],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }'::jsonb
FROM users
WHERE users.username = 'nilton.naab@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM workspaces
      WHERE workspaces.owner_id = users.id
        AND workspaces.name = 'Exemplo 2 - balanço simples'
  );

INSERT INTO workspaces (
    name,
    description,
    owner_id,
    tenant_id,
    data
)
SELECT
    'Exemplo 4 - Sigmafine',
    'Topologia comercial com 13 correntes e 8 nodos de balanço.',
    users.id,
    users.tenant_id,
    '{
      "nodes": [
        {"id": "node-1", "type": "node", "position": {"x": 360, "y": 120}, "data": {"label": "Nodo 1"}},
        {"id": "node-2", "type": "node", "position": {"x": 120, "y": 30}, "data": {"label": "Nodo 2"}},
        {"id": "node-3", "type": "node", "position": {"x": 120, "y": 120}, "data": {"label": "Nodo 3"}},
        {"id": "node-4", "type": "node", "position": {"x": 120, "y": 210}, "data": {"label": "Nodo 4"}},
        {"id": "node-5", "type": "node", "position": {"x": 120, "y": 320}, "data": {"label": "Nodo 5"}},
        {"id": "node-6", "type": "node", "position": {"x": -120, "y": 170}, "data": {"label": "Nodo 6"}},
        {"id": "node-7", "type": "node", "position": {"x": -120, "y": 280}, "data": {"label": "Nodo 7"}},
        {"id": "node-8", "type": "node", "position": {"x": -360, "y": 150}, "data": {"label": "Nodo 8"}},
        {"id": "node-9", "type": "node", "position": {"x": 620, "y": 120}, "data": {"label": "Destino A1"}},
        {"id": "node-10", "type": "node", "position": {"x": -120, "y": 420}, "data": {"label": "Fonte A12"}},
        {"id": "node-11", "type": "node", "position": {"x": -620, "y": 150}, "data": {"label": "Fonte A13"}}
      ],
      "edges": [
        {"id": "edge-1", "source": "node-1", "target": "node-9", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A1", "value": 101, "tolerance": 0.01}, "label": "A1 • 101 ± 0.01", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-2", "source": "node-2", "target": "node-1", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A2", "value": 11, "tolerance": 0.05}, "label": "A2 • 11 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-3", "source": "node-3", "target": "node-1", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A3", "value": 19, "tolerance": 0.05}, "label": "A3 • 19 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-4", "source": "node-4", "target": "node-1", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A4", "value": 32, "tolerance": 0.05}, "label": "A4 • 32 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-5", "source": "node-5", "target": "node-1", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A5", "value": 41, "tolerance": 0.05}, "label": "A5 • 41 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-6", "source": "node-6", "target": "node-4", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A6", "value": 14, "tolerance": 0.05}, "label": "A6 • 14 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-7", "source": "node-7", "target": "node-4", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A7", "value": 15, "tolerance": 0.05}, "label": "A7 • 15 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-8", "source": "node-8", "target": "node-2", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A8", "value": 10, "tolerance": 0.05}, "label": "A8 • 10 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-9", "source": "node-8", "target": "node-3", "sourceHandle": "s-1", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A9", "value": 21, "tolerance": 0.05}, "label": "A9 • 21 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-10", "source": "node-8", "target": "node-6", "sourceHandle": "s-2", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A10", "value": 16, "tolerance": 0.05}, "label": "A10 • 16 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-11", "source": "node-5", "target": "node-7", "sourceHandle": "s-1", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A11", "value": 15, "tolerance": 0.05}, "label": "A11 • 15 ± 0.05", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-12", "source": "node-10", "target": "node-5", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A12", "value": 54, "tolerance": 0.01}, "label": "A12 • 54 ± 0.01", "markerEnd": {"type": "arrowclosed"}},
        {"id": "edge-13", "source": "node-11", "target": "node-8", "sourceHandle": "s-0", "targetHandle": "t-0", "type": "smoothstep", "data": {"name": "A13", "value": 48, "tolerance": 0.01}, "label": "A13 • 48 ± 0.01", "markerEnd": {"type": "arrowclosed"}}
      ],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }'::jsonb
FROM users
WHERE users.username = 'nilton.naab@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM workspaces
      WHERE workspaces.owner_id = users.id
        AND workspaces.name = 'Exemplo 4 - Sigmafine'
  );
