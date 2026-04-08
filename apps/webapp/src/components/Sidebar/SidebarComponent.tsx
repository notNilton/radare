import React, { useState, useEffect, useCallback } from "react";
import "./SidebarComponent.scss";

interface CorrectionEntry {
  id: number;
  values: string[];
}

const SidebarComponent: React.FC = () => {
  const [visibleSidebarContent, setVisibleSidebarContent] = useState<{
    [key: string]: boolean;
  }>({
    "tags-existentes": true,
    "tags-selecionadas": true,
    matriz: true,
    reconciled: true,
  });

  const [correctionValues, setCorrectionValues] = useState<CorrectionEntry[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [matrixData, setMatrixData] = useState<number[][]>([]);

  const loadAllCorrectionValues = (): CorrectionEntry[] => {
    const storedData = JSON.parse(localStorage.getItem("reconciliationData") || "[]");
    if (Array.isArray(storedData)) {
      return storedData.map((entry: { id: number; tagcorrection: string[] }) => ({
        id: entry.id,
        values: entry.tagcorrection || [],
      }));
    }
    return [];
  };

  const loadLastEntryData = () => {
    const storedData = JSON.parse(localStorage.getItem("reconciliationData") || "[]");
    if (Array.isArray(storedData) && storedData.length > 0) {
      const lastEntry = storedData[storedData.length - 1];
      
      if (lastEntry.tagname) {
        setExistingTags(lastEntry.tagname);
      }
      
      if (lastEntry.tagmatrix) {
        setMatrixData(lastEntry.tagmatrix);
      }
    }
  };

  const updateDataFromLocalStorage = useCallback(() => {
    setCorrectionValues(loadAllCorrectionValues());
    loadLastEntryData();
  }, []);

  useEffect(() => {
    updateDataFromLocalStorage();

    const handleStorageUpdate = () => {
      updateDataFromLocalStorage();
    };

    window.addEventListener("localStorageUpdated", handleStorageUpdate);

    return () => {
      window.removeEventListener("localStorageUpdated", handleStorageUpdate);
    };
  }, [updateDataFromLocalStorage]);

  const toggleSidebarContent = (key: string) => {
    setVisibleSidebarContent((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  return (
    <>
      <div className="sidebar-title" onClick={() => toggleSidebarContent("tags-existentes")}>
        Tags Existentes
      </div>
      <div className="sidebar-content">
        <div className="tag-container">
          {existingTags.map((tag, index) => (
            <div key={index} className="tag-item">{tag}</div>
          ))}
        </div>
      </div>

      <div className="sidebar-title matrix" onClick={() => toggleSidebarContent("matriz")}>
        Matriz de Incidência
      </div>
      <div className={`sidebar-content matrix${visibleSidebarContent["matriz"] ? " visible" : ""}`}>
        <div className="matrix-container">
          <table>
            <tbody>
              {matrixData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sidebar-title correction-values" onClick={() => toggleSidebarContent("reconciled")}>
        Valores de Correção
      </div>
      <div className={`sidebar-content correction-values-content${visibleSidebarContent["reconciled"] ? " visible" : ""}`}>
        <table className="correction-values-table">
          <thead>
            <tr>
              <th>ID</th>
              {correctionValues.length > 0 && correctionValues[0].values.map((_, index) => (
                <th key={index}>Valor {index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correctionValues.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                {entry.values.map((value, index) => (
                  <td key={index}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SidebarComponent;
