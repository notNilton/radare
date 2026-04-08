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
      setMessage(getErrorMessage(error, 'Nao foi possivel criar a tag.'));
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/tags/delete?id=${id}`),
    onSuccess: async () => {
      setMessage('Tag excluida.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.list() });
    },
    onError: (error) => {
      setMessage(getErrorMessage(error, 'Nao foi possivel excluir a tag.'));
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

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
        <div>
          <h1 className="text-2xl font-semibold text-white">Gestão de tags</h1>
          <p className="mt-2 text-sm text-slate-400">
            Cadastro limpo e rápido das variáveis usadas no processo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          <Plus className="h-4 w-4" />
          Nova tag
        </button>
      </section>

      {message ? (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Unidade</th>
                <th className="px-5 py-4">Descrição</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-5 py-8 text-slate-400" colSpan={4}>
                    Carregando tags...
                  </td>
                </tr>
              ) : tags.length ? (
                tags.map((tag) => (
                  <tr key={tag.ID} className="border-b border-white/5 last:border-b-0">
                    <td className="px-5 py-4 font-medium text-white">{tag.name}</td>
                    <td className="px-5 py-4">{tag.unit || '--'}</td>
                    <td className="px-5 py-4 text-slate-400">{tag.description || '--'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteTag(tag.ID)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-slate-400" colSpan={4}>
                    Nenhuma tag cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Adicionar tag</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 p-2 text-slate-300"
              >
                <X className="h-4 w-4" />
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
                onChange={(value) =>
                  setDraft((current) => ({ ...current, description: value }))
                }
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void createTag()}
                disabled={createTagMutation.isPending}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                {createTagMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}
