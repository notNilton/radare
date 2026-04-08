import React, { useState, useEffect, useRef } from "react";
import NavbarComponent from "../components/Navbar/NavbarComponent";
import api from "../api/axios";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import "./HomePage.scss";

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>({
    name: "",
    contact_email: "",
    address: { street: "", city: "", state: "", zip_code: "", country: "" },
    profile_icon: ""
  });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile");
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/profile/update", user);
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado' });
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'As senhas não coincidem' });
      return;
    }

    try {
      await api.post("/profile/password", {
        current_password: passwords.current,
        new_password: passwords.new
      });
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Senha alterada com sucesso' });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar senha' });
    }
  };

  return (
    <div className="home">
      <Toast ref={toast} />
      <div className="navbar-container">
        <NavbarComponent version={""} />
      </div>

      <div className="content-container p-4" style={{ marginTop: "60px", padding: "2rem" }}>
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dados Pessoais */}
          <Card title="Dados Pessoais" className="shadow-md">
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="field">
                <label className="block font-bold mb-1">Nome Completo</label>
                <InputText value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} className="w-full" />
              </div>
              <div className="field">
                <label className="block font-bold mb-1">Email de Contato</label>
                <InputText value={user.contact_email} onChange={(e) => setUser({...user, contact_email: e.target.value})} className="w-full" />
              </div>
              
              <h3 className="font-bold mt-4">Endereço</h3>
              <div className="field">
                <label className="block text-sm mb-1">Rua</label>
                <InputText value={user.address?.street} onChange={(e) => setUser({...user, address: {...user.address, street: e.target.value}})} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="block text-sm mb-1">Cidade</label>
                  <InputText value={user.address?.city} onChange={(e) => setUser({...user, address: {...user.address, city: e.target.value}})} className="w-full" />
                </div>
                <div className="field">
                  <label className="block text-sm mb-1">Estado</label>
                  <InputText value={user.address?.state} onChange={(e) => setUser({...user, address: {...user.address, state: e.target.value}})} className="w-full" />
                </div>
              </div>
              
              <Button label="Salvar Alterações" icon="pi pi-check" loading={loading} className="mt-4" />
            </form>
          </Card>

          {/* Alterar Senha */}
          <Card title="Segurança" className="shadow-md">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="field">
                <label className="block font-bold mb-1">Senha Atual</label>
                <InputText type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full" />
              </div>
              <hr className="my-2" />
              <div className="field">
                <label className="block font-bold mb-1">Nova Senha</label>
                <InputText type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full" />
              </div>
              <div className="field">
                <label className="block font-bold mb-1">Confirmar Nova Senha</label>
                <InputText type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full" />
              </div>
              <Button label="Alterar Senha" icon="pi pi-lock" className="p-button-warning mt-4" />
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
