// src/hooks/ReconciledDataHook.ts

import { useState, useEffect } from 'react';
import { fetchReconciledData } from '../api/ReconciledDataApi';

interface ReconciledRowData {
  id: string;
  [key: `V${number}`]: number; // Chaves dinâmicas para valores numéricos com prefixo `V`
}

const ReconciledDataHook = () => {
  const [reconciledData, setReconciledData] = useState<ReconciledRowData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchReconciledData();

        if (data.length > 0) {
          const formattedData = data.map((valueSet: any[], index: number) =>
            createRowData(valueSet[1], index) // valueSet[1] contém os valores reconciliados
          );
          setReconciledData(formattedData);
        }
      } catch (error) {
        setError('Erro ao carregar dados reconciliados do backend');
      }
    };

    fetchData();

    return () => {
      // Limpeza, se necessário
    };
  }, []);

  const createRowData = (data: string[], index: number): ReconciledRowData => {
    const rowData: ReconciledRowData = {
      id: `${index + 1}`, // Identificador da linha
    };

    data.forEach((value, idx) => {
      rowData[`V${idx + 1}`] = parseFloat(value); // Associa cada valor a uma chave genérica como `V1`, `V2`, etc.
    });

    return rowData;
  };

  return { reconciledData, error };
};

export default ReconciledDataHook;
