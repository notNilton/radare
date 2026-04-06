import React, { useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, {
  Controls,
  Panel,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import "./Node.scss";

import {
  initialNodes,
  initialEdges,
  nodeTypes,
} from "./utils/initialCanvaDataIII";
import { calcularReconciliacao, reconciliarApi, createAdjacencyMatrix } from "./utils/Reconciliacao";
import SidebarComponent from "../Sidebar/SidebarComponent";
import GraphComponent from "../Graph/GraphComponent";
import PanelButtons from "./PanelButtons"; // Importando o novo componente

const generateRandomName = () => {
  const names = ["Laravel", "Alucard", "Sigma", "Delta", "Orion", "Phoenix"];
  return names[Math.floor(Math.random() * names.length)];
};

const getNodeId = () => `randomnode_${+new Date()}`;

const Node: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map((edge) => ({
      ...edge,
      nome: edge.nome || generateRandomName(),
      label: `Nome: ${edge.nome || generateRandomName()}, Valor: ${
        edge.value
      }, Tolerância: ${edge.tolerance}`,
      type: "step",
    }))
  );

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isGraphVisible, setIsGraphVisible] = useState(true);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const newEdge = {
        ...params,
        nome: generateRandomName(), // Adiciona um nome aleatório
        label: `Nome: ${generateRandomName()}, Valor: ${
          params.label || ""
        }, Tolerância: ${params.tolerance || ""}`,
        type: "step", // Definindo o tipo da aresta como 'step'
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onEdgeDoubleClick = (edgeId: string) => {
    const labelValue = window.prompt(
      "Digite um valor para o rótulo da aresta:"
    );
    const toleranceValue = window.prompt("Digite um valor para a tolerância:");

    if (
      labelValue &&
      toleranceValue &&
      !isNaN(Number(labelValue)) &&
      !isNaN(Number(toleranceValue))
    ) {
      const numericLabel = parseFloat(labelValue);
      const numericTolerance = parseFloat(toleranceValue);

      setEdges((prevEdges) =>
        prevEdges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                value: numericLabel,
                tolerance: numericTolerance,
                label: `Nome: ${edge.nome}, Valor: ${numericLabel}, Tolerância: ${numericTolerance}`,
              }
            : edge
        )
      );
    }
  };

  const addNode = useCallback(
    (nodeType: string) => {
      const newNode = {
        id: getNodeId(),
        type: nodeType,
        data: { label: "Simples", isConnectable: true },
        style: {
          background: "white",
          border: "2px solid black",
          padding: "3px",
          width: "100px",
        },
        position: {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Gera a matriz de adjacência e os nomes das arestas, necessários para a reconciliação
      const edgeNames = edges.map((edge) => edge.nome);
      const incidenceMatrix = createAdjacencyMatrix(nodes, edges); // Cria a matriz de incidência
  
      // Agora usando a função reconciliarApi para processar o arquivo JSON
      reconciliarApi(
        incidenceMatrix, // Passa a matriz de incidência gerada
        [], // Placeholder para values, que será sobrescrito pelo JSON
        [], // Placeholder para tolerances, que será sobrescrito pelo JSON
        edgeNames, // Passa os nomes das arestas
        (message) => console.log(message),
        file // Passa o arquivo JSON
      );
    }
  };
  

  const handleReconcile = () => {
    const edgeNames = edges.map((edge) => edge.nome);
    calcularReconciliacao(
      nodes,
      edges,
      reconciliarApi,
      (message) => {
        console.log(message);
      },
      edgeNames
    ); // Passando edgeNames para a função
  };
  

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const toggleGraph = () => {
    setIsGraphVisible(!isGraphVisible);
  };

  const showNodesAndEdges = () => {
    console.log("Nodes:", nodesRef.current);
    console.log("Edges:", edgesRef.current);
    alert(
      `Nodes: ${JSON.stringify(
        nodesRef.current,
        null,
        2
      )}\nEdges: ${JSON.stringify(edgesRef.current, null, 2)}`
    );
  };

  const onNodeDoubleClick = (event: React.MouseEvent, node: any) => {
    const newLabel = window.prompt("Digite um novo nome para o nó:", node.data.label);
    if (newLabel !== null) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, label: newLabel } }
            : n
        )
      );
    }
  };

  const edgeNames = edges.map((edge) => edge.nome);

  return (
    <div
      className={`node-container ${isSidebarVisible ? "" : "sidebar-hidden"}`}
    >
      <div className="reactflow-component">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} // Use o seu onConnect personalizado aqui
          nodeTypes={nodeTypes}
          fitView
          onEdgeDoubleClick={(event, edge) => onEdgeDoubleClick(edge.id)}
          onNodeDoubleClick={onNodeDoubleClick}
        >
          <Panel position="top-left" className="top-left-panel custom-panel">
            <PanelButtons
              addNode={addNode}
              showNodesAndEdges={showNodesAndEdges}
              toggleSidebar={toggleSidebar}
              toggleGraph={toggleGraph}
              handleReconcile={handleReconcile}
              handleFileUpload={handleFileUpload}
              isSidebarVisible={isSidebarVisible}
              isGraphVisible={isGraphVisible}
            />
          </Panel>
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {isSidebarVisible && (
          <div className="sidebar-component">
            <SidebarComponent
              nodes={nodes}
              edges={edges}
              edgeNames={edgeNames}
            />
          </div>
        )}
      </div>

      {isGraphVisible && (
        <div className="graph-component">
          <GraphComponent />
        </div>
      )}
    </div>
  );
};

export default Node;
