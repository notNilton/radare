import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, LockKeyhole, User } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../store/AuthStore';

export function LoginForm() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (credentials: { password: string; username: string }) =>
      apiClient.post<{ token?: string }>('/login', credentials, {
        authRedirect: false,
      }),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await loginMutation.mutateAsync({ username, password });
      const token = response?.token;

      if (!token) {
        throw new Error('Resposta de login sem token.');
      }

      setToken(token);
      await navigate({ to: '/' });
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, 'Erro ao realizar login. Verifique suas credenciais.'),
      );
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_28%),linear-gradient(180deg,_#020617,_#0f172a_55%,_#111827)] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8">
          <span className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            RADARE
          </span>
          <h1 className="text-3xl font-semibold text-white">
            Acesse o workspace
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Entre para gerenciar reconciliações, histórico e configuração do processo.
          </p>
        </div>

        <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Usuário</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-400/70">
              <User className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="operator"
                disabled={loginMutation.isPending}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Senha</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-400/70">
              <LockKeyhole className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loginMutation.isPending}
                required
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
