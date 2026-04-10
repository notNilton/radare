import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';

interface Tag {
  ID: number;
  name: string;
  description: string;
  unit: string;
}

interface TagDraft {
  name: string;
  description: string;
  unit: string;
}

const emptyDraft: TagDraft = {
  name: '',
  description: '',
  unit: '',
};

export function TagsManager() {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<TagDraft>(emptyDraft);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: () => apiClient.get<Tag[]>('/tags'),
  });

  const createTagMutation = useMutation({
    mutationFn: (nextDraft: TagDraft) => apiClient.post('/tags/create', nextDraft),
    onSuccess: async () => {
      setDraft(emptyDraft);
      setModalOpen(false);
      setMessage('Tag criada com sucesso.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.list() });
    },
    onError: (error) => {
      setMessage(getErrorMessage(error, 'Não foi possível criar a tag.'));
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/tags/delete?id=${id}`),
    onSuccess: async () => {
      setMessage('Tag excluída.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.list() });
    },
    onError: (error) => {
      setMessage(getErrorMessage(error, 'Não foi possível excluir a tag.'));
    },
  });

  async function createTag() {
    if (!draft.name) {
      setMessage('Nome da tag é obrigatório.');
      return;
    }
    await createTagMutation.mutateAsync(draft);
  }

  async function deleteTag(id: number) {
    if (!window.confirm('Deseja realmente excluir esta tag?')) {
      return;
    }
    await deleteTagMutation.mutateAsync(id);
  }

  // ─── Styles ───────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 500,
    border: '1px solid var(--border-md)',
    borderRadius: 3,
    background: 'transparent',
    color: 'var(--tx-2)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: '1px solid var(--accent-bd)',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    fontWeight: 600,
  };

  const btnDanger: React.CSSProperties = {
    ...btnBase,
    border: '1px solid var(--danger-bg)',
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    padding: '4px 10px',
  };

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--tx-3)',
    padding: '12px 20px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: 12,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>GESTÃO DE TAGS</h1>
          <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
            Cadastro e configuração das variáveis de processo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={btnPrimary}
        >
          <Plus size={14} />
          Nova Tag
        </button>
      </header>

      {message && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-bd)',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--accent)'
        }}>
          {message}
        </div>
      )}

      <section style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Unidade</th>
                <th style={thStyle}>Descrição</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td style={tdStyle} colSpan={4}>Carregando tags...</td>
                </tr>
              ) : tags.length ? (
                tags.map((tag) => (
                  <tr key={tag.ID}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{tag.name}</td>
                    <td style={tdStyle}>{tag.unit || '--'}</td>
                    <td style={{ ...tdStyle, color: 'var(--tx-2)' }}>{tag.description || '--'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => void deleteTag(tag.ID)}
                        style={btnDanger}
                      >
                        <Trash2 size={12} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={tdStyle} colSpan={4}>Nenhuma tag cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setModalOpen(false)}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-md)',
            borderRadius: 6,
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
            margin: '0 20px'
          }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Adicionar Tag</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--tx-3)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field
                label="Nome"
                value={draft.name}
                onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
              />
              <Field
                label="Unidade"
                value={draft.unit}
                onChange={(value) => setDraft((current) => ({ ...current, unit: value }))}
              />
              <Field
                label="Descrição"
                value={draft.description}
                onChange={(value) => setDraft((current) => ({ ...current, description: value }))}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={btnBase}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void createTag()}
                disabled={createTagMutation.isPending}
                style={btnPrimary}
              >
                {createTagMutation.isPending ? 'Salvando...' : 'Salvar Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tx-3)', marginBottom: 6, display: 'block' }}>{label}</span>
      <input
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
