import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

const cnOneTwo = ({ data }: NodeProps) => {
  const { label, isConnectable } = data;

  return (
    <div className="custom-node cn-one-two">
      <Handle
        type="target"
        position={Position.Top}
        id="in-1"
        style={{ background: "#784be8" }}
        isConnectable={isConnectable}
      />
      
      <div className="node-label">{label}</div>

      <Handle
        type="source"
        position={Position.Left}
        id="out-1"
        style={{ background: "black" }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="out-2"
        style={{ background: "black" }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(cnOneTwo);
