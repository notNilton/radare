// src/hooks/TagHook.ts

import { useState, useEffect } from 'react';
import { fetchTags } from '../api/TagApi';

const TagHook = () => {
  const [edgeNames, setEdgeNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchTags();
        if (data.length > 0) {
          const names = data[0][0]; // Extrai os nomes das tags da resposta
          setEdgeNames(names);
        }
      } catch (error) {
        setError('Erro ao carregar nomes das tags do backend');
      }
    };

    fetchData();

    return () => {
      // Limpeza, se necessário
    };
  }, []);

  return { edgeNames, error };
};

export default TagHook;
