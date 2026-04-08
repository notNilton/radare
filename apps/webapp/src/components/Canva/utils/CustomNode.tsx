import React, { memo } from "react";
import { Handle, Position } from "reactflow";

const CustomNode = ({ data }) => {
  const { label, isConnectable, maxConnections } = data;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "black" }}
        isConnectable={isConnectable}
      ></Handle>

      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={{ top: 20, background: "#784be8" }}
        isConnectable={isConnectable}
        maxConnections={maxConnections}
      ></Handle>

      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ top: 75, background: "#784be8" }}
        isConnectable={isConnectable}
      ></Handle>

      <div>{`${label}`}</div>
    </>
  );
};

export default memo(CustomNode);
