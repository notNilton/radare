// src/hooks/GraphHook.ts

import { useState, useEffect } from 'react';
import { fetchGraphData } from '../api/GraphApi';

const GraphHook = () => {
  const [lineChartData, setLineChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchGraphData();
        console.log('Dados recebidos do backend:', data);

        if (data.length > 0) {
          const labels = data[0][0];
          const datasets = labels.map((label: string, index: number) => ({
            label: label,
            data: data.map((iteration: any) => parseFloat(iteration[1][index])),
            fill: false,
            borderColor: `hsl(${index * 72}, 70%, 50%)`,
          }));

          const chartData = {
            labels: data.map((_: any, index: number) => `Medida ${index + 1}`),
            datasets: datasets,
          };

          setLineChartData(chartData);
        } else {
          setLineChartData(null);
        }
      } catch (error) {
        setError('Erro ao carregar dados do backend');
      }
    };

    fetchData();

    return () => {
      window.removeEventListener('storage', fetchData);
    };
  }, []);

  return { lineChartData, error };
};

export default GraphHook;
