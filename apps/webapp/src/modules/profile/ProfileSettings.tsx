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
      setMessage('Perfil atualizado.');
      setProfileError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    },
    onError: (error) => {
      setProfileError(getErrorMessage(error, 'Nao foi possivel atualizar o perfil.'));
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
      setProfileError(getErrorMessage(error, 'Nao foi possivel alterar a senha.'));
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
      setMessage('As senhas não coincidem.');
      return;
    }

    setMessage(null);
    setProfileError(null);
    await updatePasswordMutation.mutateAsync({
      current_password: passwords.current,
      new_password: passwords.next,
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Meu perfil</h1>
        <p className="mt-2 text-sm text-slate-400">
          Dados pessoais e segurança em uma interface mais direta e modular.
        </p>
      </section>

      {message ? (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {message}
        </div>
      ) : null}

      {profileError ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {profileError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Dados pessoais</h2>
          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
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

            <button
              type="submit"
              disabled={isLoading || updateProfileMutation.isPending}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Segurança</h2>
          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
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

            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100"
            >
              {updatePasswordMutation.isPending ? 'Alterando...' : 'Alterar senha'}
            </button>
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
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}
