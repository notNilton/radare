import React, { useState, useEffect } from "react";
import NavbarComponent from "../components/Navbar/NavbarComponent";
import api from "../api/axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import "./HomePage.scss";

const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTag, setNewTag] = useState({ name: "", description: "", unit: "" });
  const toast = useRef<Toast>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await api.get("/tags");
      setTags(response.data);
    } catch (error) {
      console.error("Erro ao buscar tags:", error);
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar tags' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTag.name) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Nome da tag é obrigatório' });
      return;
    }

    try {
      await api.post("/tags/create", newTag);
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Tag criada com sucesso' });
      setShowModal(false);
      setNewTag({ name: "", description: "", unit: "" });
      fetchTags();
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar tag' });
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta tag?")) return;

    try {
      await api.delete(`/tags/delete?id=${id}`);
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Tag excluída' });
      fetchTags();
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir tag' });
    }
  };

  const actionTemplate = (rowData: any) => {
    return (
      <Button 
        icon="pi pi-trash" 
        className="p-button-rounded p-button-danger p-button-text" 
        onClick={() => handleDeleteTag(rowData.ID)} 
      />
    );
  };

  return (
    <div className="home">
      <Toast ref={toast} />
      <div className="navbar-container">
        <NavbarComponent version={""} />
      </div>
      
      <div className="content-container p-4" style={{ marginTop: "60px", padding: "2rem" }}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Gestão de Tags</h1>
          <Button label="Nova Tag" icon="pi pi-plus" onClick={() => setShowModal(true)} />
        </div>

        <div className="card shadow-md bg-white rounded-lg">
          <DataTable value={tags} loading={loading} responsiveLayout="stack" breakpoint="960px">
            <Column field="name" header="Nome" sortable />
            <Column field="unit" header="Unidade" sortable />
            <Column field="description" header="Descrição" />
            <Column body={actionTemplate} header="Ações" style={{ width: '5rem' }} />
          </DataTable>
        </div>
      </div>

      <Dialog header="Adicionar Nova Tag" visible={showModal} style={{ width: '400px' }} onHide={() => setShowModal(false)}>
        <div className="flex flex-col gap-4">
          <div className="field">
            <label htmlFor="name" className="block font-bold mb-1">Nome</label>
            <InputText id="name" value={newTag.name} onChange={(e) => setNewTag({...newTag, name: e.target.value})} className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="unit" className="block font-bold mb-1">Unidade</label>
            <InputText id="unit" value={newTag.unit} onChange={(e) => setNewTag({...newTag, unit: e.target.value})} className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="description" className="block font-bold mb-1">Descrição</label>
            <InputText id="description" value={newTag.description} onChange={(e) => setNewTag({...newTag, description: e.target.value})} className="w-full" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button label="Cancelar" className="p-button-text" onClick={() => setShowModal(false)} />
            <Button label="Salvar" onClick={handleCreateTag} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TagsPage;
