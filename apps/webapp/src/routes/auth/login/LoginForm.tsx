import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, User } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { getErrorMessage } from '../../../lib/api-client';
import { useAuthStore } from '../../../store/AuthStore';
import { useLogin } from '../../../hooks/useLogin';

export function LoginForm() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin();

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

  // ─── Styles ───────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 13,
    background: 'var(--panel)',
    border: '1px solid var(--border-md)',
    borderRadius: 3,
    color: 'var(--tx-1)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const lblStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    marginBottom: 8,
    display: 'block'
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    fontSize: 12,
    fontWeight: 700,
    border: '1px solid var(--accent-bd)',
    borderRadius: 3,
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '10px'
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10" style={{ background: 'var(--bg)' }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <header className="mb-10 text-center">
          <div style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.4em',
            color: 'var(--accent)',
            border: '1px solid var(--accent-bd)',
            padding: '4px 12px',
            borderRadius: 2,
            marginBottom: '24px'
          }}>
            RADARE
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>ACESSAR SISTEMA</h1>
          <p className="mt-3 text-xs" style={{ color: 'var(--tx-2)' }}>
            Autenticação necessária para acesso operacional.
          </p>
        </header>

        <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-6">
          <label className="block">
            <span style={lblStyle}>Usuário</span>
            <div className="relative">
              <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
              <input
                style={{ ...inputStyle, paddingLeft: '36px' }}
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="operador"
                disabled={loginMutation.isPending}
                required
              />
            </div>
          </label>

          <label className="block">
            <span style={lblStyle}>Senha</span>
            <div className="relative">
              <LockKeyhole size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
              <input
                style={{ ...inputStyle, paddingLeft: '36px' }}
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

          {error && (
            <div style={{
              padding: '10px 14px',
              fontSize: 11,
              background: 'var(--danger-bg)',
              border: '1px solid var(--border-md)',
              borderRadius: 3,
              color: 'var(--danger)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={btnPrimary}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Validando...' : 'Autenticar'}
            <ArrowRight size={16} />
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p style={{ fontSize: 9, color: 'var(--tx-3)', letterSpacing: '0.05em' }}>
            &copy; {new Date().getFullYear()} NILBYTE STUDIOS • SISTEMA DE RECONCILIAÇÃO
          </p>
        </footer>
      </div>
    </div>
  );
}
