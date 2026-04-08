// src/api/TagApi.ts

export const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:5000/reconciled-data');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao carregar nomes das tags do backend:', error);
      throw error;
    }
  };
  