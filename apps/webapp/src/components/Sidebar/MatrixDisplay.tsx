// MatrixDisplay.tsx
import React from "react";

interface MatrixDisplayProps {
  matrix: number[][];
}

const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ matrix }) => {
  return (
    <>
      <table>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default MatrixDisplay;
