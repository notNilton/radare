import api from '../../../api/axios';

export const createAdjacencyMatrix = (nodes: any[], edges: any[]) => {
  // Filter nodes that represent a node in the process (where mass balance must be zero)
  const processNodes = nodes.filter((node) => 
    ["cnOneThree", "cnOneOne", "cnTwoTwo", "cnTwoOne", "cnOneTwo"].includes(node.type)
  );
  
  const incidencematrix = Array.from({ length: processNodes.length }, () =>
    Array(edges.length).fill(0)
  );

  edges.forEach((edge, edgeIndex) => {
    const sourceIndex = processNodes.findIndex(
      (node) => node.id === edge.source
    );
    const targetIndex = processNodes.findIndex(
      (node) => node.id === edge.target
    );

    // If a process node is the source, it's an output (-1)
    if (sourceIndex !== -1) incidencematrix[sourceIndex][edgeIndex] = -1;
    // If a process node is the target, it's an input (+1)
    if (targetIndex !== -1) incidencematrix[targetIndex][edgeIndex] = 1;
  });

  return incidencematrix;
};

export const calcularReconciliacao = (
  nodes: any[],
  edges: any[],
  reconciliarApi: (
    incidenceMatrix: number[][],
    values: number[],
    tolerances: number[],
    names: string[],
    atualizarProgresso: (message: string) => void
  ) => Promise<void>,
  atualizarProgresso: (message: string) => void,
  edgeNames: string[]
) => {
  const values = edges.map((edge) => edge.value || 0);
  const tolerances = edges.map((edge) => edge.tolerance || 0);
  const incidenceMatrix = createAdjacencyMatrix(nodes, edges);

  atualizarProgresso("Chamando API de reconciliação...");
  reconciliarApi(incidenceMatrix, values, tolerances, edgeNames, atualizarProgresso);
};

export const reconciliarApi = async (
  incidence_matrix: number[][],
  values: number[],
  tolerances: number[],
  names: string[],
  atualizarProgresso: (message: string) => void,
  jsonFile?: File
) => {
  try {
    atualizarProgresso("Enviando dados para o servidor...");

    let finalValues = values;
    let finalTolerances = tolerances;

    if (jsonFile) {
      const fileContent = await jsonFile.text();
      const jsonData = JSON.parse(fileContent);
      // If using file, we might need to map it correctly. 
      // Assuming the file has { measurements: [], tolerances: [] } for now based on backend
      if (jsonData.measurements) finalValues = jsonData.measurements;
      if (jsonData.tolerances) finalTolerances = jsonData.tolerances;
    }

    const payload = {
      measurements: finalValues,
      tolerances: finalTolerances,
      constraints: incidence_matrix,
    };

    console.log("Payload a ser enviado:", payload);

    const response = await api.post("/reconcile", payload);

    if (response.status === 200) {
      atualizarProgresso("Reconciliação bem-sucedida.");
      const result = response.data;
      console.log("Resultado da reconciliação:", result);

      // Save to localStorage for historical display (compatible with current components)
      const timestamp = new Date().toISOString();
      const currentDataStr = localStorage.getItem("reconciliationData");
      const currentData = currentDataStr ? JSON.parse(currentDataStr) : [];

      const newEntry = {
        id: Date.now(),
        user: "Usuário Atual",
        time: timestamp,
        tagname: names,
        tagreconciled: result.reconciled_values.map((v: number) => v.toFixed(2)),
        tagcorrection: result.corrections.map((v: number) => v.toFixed(2)),
        tagmatrix: incidence_matrix,
        status: result.consistency_status
      };

      localStorage.setItem("reconciliationData", JSON.stringify([newEntry, ...currentData]));
      
      // Notify other components
      window.dispatchEvent(new CustomEvent("localStorageUpdated"));
    } else {
      atualizarProgresso("Falha na reconciliação.");
    }
  } catch (error: any) {
    console.error("Erro ao reconciliar dados:", error);
    const errorMsg = error.response?.data?.message || "Erro durante a reconciliação.";
    atualizarProgresso(errorMsg);
  }
};
