import React, { useEffect, useState, useCallback } from 'react';
import { Chart } from 'primereact/chart';
import './GraphComponent.scss';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    tension: number;
  }[];
}

const GraphComponent: React.FC = () => {
  const [lineChartData, setLineChartData] = useState<ChartData | null>(null);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const updateChartData = useCallback(() => {
    const storedData = JSON.parse(localStorage.getItem("reconciliationData") || "[]");

    if (Array.isArray(storedData) && storedData.length > 0) {
      // Verifica se todas as entradas possuem tagreconciled
      const hasTagReconciled = storedData.every(entry => Array.isArray(entry.tagreconciled));

      if (hasTagReconciled) {
        const numValues = storedData[0].tagreconciled.length; // Número de valores em cada iteração
        
        const datasets = Array.from({ length: numValues }).map((_, valueIndex) => ({
          label: `Valor ${valueIndex + 1}`,
          data: storedData.map(entry => parseFloat(entry.tagreconciled[valueIndex]) || 0),
          fill: false,
          borderColor: `hsl(${(valueIndex * 60) % 360}, 70%, 50%)`,
          tension: 0.1,
        }));

        const labels = storedData.map((_, index) => `Iteração ${index + 1}`);

        const chartData: ChartData = {
          labels,
          datasets,
        };

        setLineChartData(chartData);
      } else {
        console.warn("Alguma entrada não possui a propriedade 'tagreconciled'.");
        setLineChartData(null);
      }
    } else {
      setLineChartData(null);
    }
  }, []);

  useEffect(() => {
    updateChartData();

    const handleStorageUpdate = () => {
      updateChartData();
    };

    window.addEventListener("localStorageUpdated", handleStorageUpdate);

    return () => {
      window.removeEventListener("localStorageUpdated", handleStorageUpdate);
    };
  }, [updateChartData]);

  return (
    <div className="graph-component">
      <div className="graph-bar-title">Análise Resumida</div>
      <div className="graph-bar-content">
        {lineChartData ? (
          <Chart type="line" data={lineChartData} options={lineChartOptions} />
        ) : (
          <div>Nenhum dado disponível para exibição no gráfico</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(GraphComponent);
