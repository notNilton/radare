import React, { useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  MarkerType,
} from "reactflow";

import cnOneThree from "./customNodeOneThree";
import cnOneOne from "./customNodeOneOne";
import cnTwoTwo from "./customNodeTwoTwo";
import cnTwoOne from "./customNodeOneTwo";
import cnOneTwo from "./customNodeOneTwo";

const nodeTypes = {
  cnOneThree: cnOneThree,
  cnOneOne: cnOneOne,
  cnTwoTwo: cnTwoTwo,
  cnTwoOne: cnTwoOne,
  cnOneTwo: cnOneTwo,
};

const initialNodes = [
  {
    id: "Node",
    type: "cnOneTwo",
    data: { label: "Node", isConnectable: true },
    style: {
      background: "white",
      border: "2px solid black",
      padding: "3px",
      width: "100px",
    },
    position: { x: 100, y: 350 },
  },
  {
    id: "Input",
    type: "input",
    data: { label: "Input", isConnectable: true },
    style: {
      background: "white",
      border: "2px solid black",
      padding: "3px",
      width: "100px",
    },
    position: { x: 100, y: 150 },
  },
  {
    id: "Output1",
    type: "output",
    data: { label: " ", isConnectable: true },
    style: {
      background: "white",
      border: "2px solid black",
      padding: "3px",
      width: "50px",
      height: "50px",
    },
    position: { x: -100, y: 450 },
  },
  {
    id: "Output2",
    type: "output",
    data: { label: " ", isConnectable: true },
    style: {
      background: "white",
      border: "2px solid black",
      padding: "3px",
      width: "50px",
      height: "50px",
    },
    position: { x: 350, y: 450 },
  },
];

const initialEdges = [
  {
    id: "ei-1",
    type: "step",
    source: "Input",
    target: "Node",
    value: 161,
    tolerance: 0.05,
    label: `Valor: 161, Tolerância: 0.05`,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "ei-2",
    type: "step",
    source: "Node",
    target: "Output1",
    value: 79,
    tolerance: 0.01,
    label: `Valor: 79, Tolerância: 0.01`,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "ei-3",
    type: "step",
    source: "Node",
    sourceHandle: "b",
    target: "Output2",
    value: 80,
    tolerance: 0.01,
    label: `Valor: 80, Tolerância: 0.01`,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];

export { initialNodes, initialEdges, nodeTypes };
