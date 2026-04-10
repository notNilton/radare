import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';

interface UserProfile {
  name: string;
  contact_email: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
}

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile>({
    name: '',
    contact_email: '',
    address: {},
  });
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => apiClient.get<UserProfile>('/profile'),
  });

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (nextUser: UserProfile) => apiClient.put('/profile/update', nextUser),
    onSuccess: async () => {
      setMessage('Perfil atualizado com sucesso.');
      setProfileError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    },
    onError: (error) => {
      setProfileError(getErrorMessage(error, 'Não foi possível atualizar o perfil.'));
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      apiClient.post('/profile/password', payload),
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      setMessage('Senha alterada com sucesso.');
      setProfileError(null);
    },
    onError: (error) => {
      setProfileError(getErrorMessage(error, 'Não foi possível alterar a senha.'));
    },
  });

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setProfileError(null);
    await updateProfileMutation.mutateAsync(user);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setProfileError('As novas senhas não coincidem.');
      return;
    }

    setMessage(null);
    setProfileError(null);
    await updatePasswordMutation.mutateAsync({
      current_password: passwords.current,
      new_password: passwords.next,
    });
  }

  // ─── Styles ───────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid var(--border-md)',
    borderRadius: 3,
    background: 'transparent',
    color: 'var(--tx-2)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: '1px solid var(--accent-bd)',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
  };

  const btnWarning: React.CSSProperties = {
    ...btnBase,
    border: '1px solid rgba(245,158,11,0.3)',
    background: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 4,
  };

  const lblStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    marginBottom: 8,
    display: 'block'
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>MEU PERFIL</h1>
        <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
          Gerenciamento de credenciais e informações cadastrais.
        </p>
      </header>

      {message && (
        <div style={{ padding: '10px 16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 4, fontSize: 11, color: 'var(--accent)' }}>
          {message}
        </div>
      )}

      {profileError && (
        <div style={{ padding: '10px 16px', background: 'var(--danger-bg)', border: '1px solid var(--border-md)', borderRadius: 4, fontSize: 11, color: 'var(--danger)' }}>
          {profileError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Dados Pessoais</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <ProfileField
              label="Nome completo"
              value={user.name}
              onChange={(value) => setUser((current) => ({ ...current, name: value }))}
            />
            <ProfileField
              label="Email de contato"
              value={user.contact_email}
              onChange={(value) =>
                setUser((current) => ({ ...current, contact_email: value }))
              }
            />
            <ProfileField
              label="Rua"
              value={user.address?.street ?? ''}
              onChange={(value) =>
                setUser((current) => ({
                  ...current,
                  address: { ...current.address, street: value },
                }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileField
                label="Cidade"
                value={user.address?.city ?? ''}
                onChange={(value) =>
                  setUser((current) => ({
                    ...current,
                    address: { ...current.address, city: value },
                  }))
                }
              />
              <ProfileField
                label="Estado"
                value={user.address?.state ?? ''}
                onChange={(value) =>
                  setUser((current) => ({
                    ...current,
                    address: { ...current.address, state: value },
                  }))
                }
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || updateProfileMutation.isPending}
                style={btnPrimary}
              >
                {updateProfileMutation.isPending ? 'Processando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Segurança</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <ProfileField
              label="Senha atual"
              value={passwords.current}
              type="password"
              onChange={(value) =>
                setPasswords((current) => ({ ...current, current: value }))
              }
            />
            <ProfileField
              label="Nova senha"
              value={passwords.next}
              type="password"
              onChange={(value) =>
                setPasswords((current) => ({ ...current, next: value }))
              }
            />
            <ProfileField
              label="Confirmar nova senha"
              value={passwords.confirm}
              type="password"
              onChange={(value) =>
                setPasswords((current) => ({ ...current, confirm: value }))
              }
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                style={btnWarning}
              >
                {updatePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 6, display: 'block' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 13,
          background: 'var(--panel)',
          border: '1px solid var(--border-md)',
          borderRadius: 4,
          color: 'var(--tx-1)',
          outline: 'none'
        }}
      />
    </label>
  );
}
