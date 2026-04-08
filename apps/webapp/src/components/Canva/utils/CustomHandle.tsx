import React, { useCallback } from "react";
import {
  getConnectedEdges,
  Handle,
  useNodeId,
  useStore,
  NodeInternals,
  HandleProps,
  Position,
  Edge,
  Node,
} from "reactflow";

// Define the StoreState interface manually if it's not exported by reactflow
interface StoreState {
  nodeInternals: NodeInternals;
  edges: Edge[];
}

const selector =
  (nodeId: string, isConnectable = true, maxConnections = Infinity) =>
  (s: StoreState) => {
    if (!isConnectable) return false;

    const node = s.nodeInternals.get(nodeId);
    if (!node) return false; // Ensure node is not undefined

    const connectedEdges = getConnectedEdges([node], s.edges);
    return connectedEdges.length < maxConnections;
  };

interface CustomHandleProps extends HandleProps {
  maxConnections: number;
}

const CustomHandle: React.FC<CustomHandleProps> = ({
  maxConnections,
  ...props
}) => {
  const nodeId = useNodeId();
  if (!nodeId) return null;

  const isConnectable = useStore(
    useCallback(selector(nodeId, props.isConnectable, maxConnections), [
      nodeId,
      props.isConnectable,
      maxConnections,
    ])
  );

  return (
    <Handle
      {...props}
      type="target"
      isConnectable={isConnectable}
      position={props.position || Position.Right}
    />
  );
};

export default CustomHandle;
