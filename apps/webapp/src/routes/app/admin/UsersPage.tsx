import { Shield } from 'lucide-react';
import { useAdminUsers, useUpdateUserRole } from '../../../hooks/useAdmin';
import type { AdminUser, UserRole } from '../../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  operador: 'Operador',
  auditor: 'Auditor',
};

const ROLE_COLORS: Record<UserRole, React.CSSProperties> = {
  admin: { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' },
  operador: { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' },
  auditor: { background: 'rgba(156,163,175,0.1)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.25)' },
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 3,
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      ...ROLE_COLORS[role],
    }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const updateRole = useUpdateUserRole();

  const thStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: 12,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  const selectStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 11,
    background: 'var(--panel)',
    border: '1px solid var(--border-md)',
    borderRadius: 4,
    color: 'var(--tx-1)',
    cursor: 'pointer',
  };

  return (
    <tr>
      <td style={{ ...thStyle, fontFamily: 'monospace', color: 'var(--tx-3)' }}>{user.id}</td>
      <td style={thStyle}>{user.username}</td>
      <td style={thStyle}>{user.name}</td>
      <td style={{ ...thStyle, fontSize: 11, color: 'var(--tx-2)' }}>{user.contact_email}</td>
      <td style={thStyle}><RoleBadge role={user.role} /></td>
      <td style={thStyle}>
        <select
          value={user.role}
          disabled={updateRole.isPending}
          onChange={(e) =>
            updateRole.mutate({ userId: user.id, role: e.target.value as UserRole })
          }
          style={selectStyle}
        >
          <option value="admin">Admin</option>
          <option value="operador">Operador</option>
          <option value="auditor">Auditor</option>
        </select>
      </td>
    </tr>
  );
}

export function UsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    padding: '12px 20px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    background: 'var(--surface)',
    zIndex: 10,
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden">
      <header className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} style={{ color: 'var(--accent)' }} />
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>
            GESTÃO DE USUÁRIOS
          </h1>
        </div>
        <p className="text-xs" style={{ color: 'var(--tx-2)' }}>
          Atribua perfis de acesso: Admin, Operador ou Auditor.
        </p>
      </header>

      <section
        className="flex-1 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', flexDirection: 'column' }}
      >
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Usuário</th>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>E-mail</th>
                <th style={thStyle}>Perfil Atual</th>
                <th style={thStyle}>Alterar Perfil</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', fontSize: 11, color: 'var(--tx-3)' }}>
                    Carregando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', fontSize: 11, color: 'var(--tx-3)' }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => <UserRow key={user.id} user={user} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
