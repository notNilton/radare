import React, { useState, useEffect } from "react";
import NavbarComponent from "../components/Navbar/NavbarComponent";
import api from "../api/axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import "./HomePage.scss"; 

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [status, setStatus] = useState(null);
  const [dates, setDates] = useState<any>(null);

  const fetchHistory = async (pageNumber: number) => {
    setLoading(true);
    try {
      let url = `/reconcile/history?page=${pageNumber + 1}`;
      if (status) url += `&status=${status}`;
      if (dates && dates[0]) url += `&start_date=${dates[0].toISOString()}`;
      if (dates && dates[1]) url += `&end_date=${dates[1].toISOString()}`;

      const response = await api.get(url);
      setHistory(response.data.data);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page, status, dates]);

  const onPageChange = (event: any) => {
    setPage(event.page);
  };
// ... (rest of the templates)

  const exportCSV = async () => {
    try {
      const response = await api.get("/reconcile/export", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reconciliations.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
    }
  };

  const statusBodyTemplate = (rowData: any) => {
    const isConsistent = rowData.consistency_status === "Consistente";
    return (
      <span className={`status-badge ${isConsistent ? "status-success" : "status-danger"}`}>
        {rowData.consistency_status}
      </span>
    );
  };

  const dateBodyTemplate = (rowData: any) => {
    return new Date(rowData.CreatedAt).toLocaleString();
  };

  return (
    <div className="home">
      <div className="navbar-container">
        <NavbarComponent version={""} />
      </div>
      <div className="content-container p-4" style={{ marginTop: "60px", padding: "2rem" }}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Histórico de Reconciliações</h1>
          <Button label="Exportar CSV" icon="pi pi-file-excel" onClick={exportCSV} className="p-button-success" />
        </div>

        {/* Barra de Filtros */}
        <div className="card shadow-sm bg-gray-50 p-4 mb-4 rounded-lg flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">Status</label>
            <Dropdown 
              value={status} 
              options={[
                {label: 'Todos', value: null},
                {label: 'Consistente', value: 'Consistente'},
                {label: 'Inconsistente', value: 'Inconsistente'}
              ]} 
              onChange={(e) => setStatus(e.value)} 
              placeholder="Filtrar por Status"
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">Intervalo de Datas</label>
            <Calendar 
              value={dates} 
              onChange={(e) => setDates(e.value)} 
              selectionMode="range" 
              readOnlyInput 
              placeholder="Selecionar Datas"
              showIcon
              className="w-64"
            />
          </div>
          <Button 
            icon="pi pi-times" 
            className="p-button-rounded p-button-secondary p-button-text" 
            onClick={() => { setStatus(null); setDates(null); }} 
            tooltip="Limpar Filtros"
          />
        </div>

        <div className="card shadow-md bg-white rounded-lg overflow-hidden">
          <DataTable value={history} loading={loading} responsiveLayout="stack" breakpoint="960px">
            <Column field="ID" header="ID" sortable />
            <Column body={dateBodyTemplate} header="Data/Hora" sortable />
            <Column body={statusBodyTemplate} header="Status" sortable />
            <Column field="Measurements" header="Medições" body={(row) => JSON.stringify(row.Measurements)} />
            <Column field="ReconciledValues" header="Reconciliados" body={(row) => JSON.stringify(row.ReconciledValues)} />
          </DataTable>
          <Paginator first={page * 10} rows={10} totalRecords={totalRecords} onPageChange={onPageChange} />
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
