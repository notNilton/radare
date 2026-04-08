import React, { memo } from "react";
import { Handle, Position } from "reactflow";

const customNodeOneThree = ({ data }) => {
  const { label, isConnectable } = data;

  return (
    <>
      <Handle
        type="target"
        id="a"
        position={Position.Top}
        style={{ background: "black" }}
        isConnectable={isConnectable}
      ></Handle>

      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ background: "black" }}
        isConnectable={isConnectable}
      ></Handle>

      <Handle
        type="source"
        position={Position.Right}
        id="c"
        style={{ background: "#784be8" }}
        isConnectable={isConnectable}
      ></Handle>

      <Handle
        type="source"
        position={Position.Bottom}
        id="d"
        style={{ background: "#784be8" }}
        isConnectable={isConnectable}
      ></Handle>

      <div>{`${label}`}</div>
    </>
  );
};

export default memo(customNodeOneThree);
