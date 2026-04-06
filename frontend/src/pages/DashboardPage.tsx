import React, { useState, useEffect } from "react";
import NavbarComponent from "../components/Navbar/NavbarComponent";
import api from "../api/axios";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import "./HomePage.scss";

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const pieData = {
    labels: ['Consistente', 'Inconsistente'],
    datasets: [
      {
        data: stats ? [stats.consistent_percentage, 100 - stats.consistent_percentage] : [0, 0],
        backgroundColor: ['#4CAF50', '#F44336'],
        hoverBackgroundColor: ['#66BB6A', '#EF5350']
      }
    ]
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="home">
      <div className="navbar-container">
        <NavbarComponent version={""} />
      </div>
      <div className="content-container p-4" style={{ marginTop: "60px", padding: "2rem" }}>
        <h1 className="text-2xl font-bold mb-6">Dashboard de Reconciliação</h1>

        {loading ? (
          <div>Carregando estatísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Total de Reconciliações" className="shadow-md">
              <div className="text-4xl font-bold text-blue-600">{stats?.total_reconciliations}</div>
            </Card>

            <Card title="Taxa de Consistência" className="shadow-md">
              <div className="text-4xl font-bold text-green-600">{stats?.consistent_percentage.toFixed(1)}%</div>
            </Card>

            <Card title="Tags Cadastradas" className="shadow-md">
              <div className="text-4xl font-bold text-orange-600">{stats?.total_tags}</div>
            </Card>

            <div className="col-span-1 md:col-span-2 mt-6">
              <Card title="Distribuição de Consistência" className="shadow-md">
                <div className="flex justify-center">
                  <Chart type="pie" data={pieData} options={pieOptions} style={{ width: '40%' }} />
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
