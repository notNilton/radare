import { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '../../../lib/api-client';
import { useCreateTag, useDeleteTag, useTags } from '../../../hooks/useTags';
import type { TagDraft, Tag } from '../../../types';

const emptyDraft: TagDraft = {
  name: '',
  description: '',
  unit: '',
};

const ITEMS_PER_PAGE = 50;

// Componente memoizado para evitar re-renderizações em massa
const TagRow = memo(({ tag, onDelete, tdStyle, btnDanger }: {
  tag: Tag;
  onDelete: (id: number) => void;
  tdStyle: React.CSSProperties;
  btnDanger: React.CSSProperties;
}) => (
  <tr>
    <td style={{ ...tdStyle, fontWeight: 600 }}>{tag.name}</td>
    <td style={tdStyle}>{tag.unit || '--'}</td>
    <td style={{ ...tdStyle, color: 'var(--tx-2)' }}>{tag.description || '--'}</td>
    <td style={{ ...tdStyle, textAlign: 'right' }}>
      <button
        type="button"
        onClick={() => onDelete(tag.ID)}
        style={btnDanger}
      >
        <Trash2 size={12} />
        Excluir
      </button>
    </td>
  </tr>
));

export function TagsManager() {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<TagDraft>(emptyDraft);
  const [message, setMessage] = useState<string | null>(null);

  // Virtual pagination state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const observerRef = useRef<HTMLTableRowElement>(null);

  const { data: allTags = [], isLoading } = useTags();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();

  // Chunks of data for infinite scroll
  const visibleTags = useMemo(() => {
    return allTags.slice(0, visibleCount);
  }, [allTags, visibleCount]);

  const hasMore = visibleCount < allTags.length;

  // Infinite Scroll Logic (Frontend side)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore]);

  const createTag = async () => {
    if (!draft.name) {
      setMessage('Nome da tag é obrigatório.');
      return;
    }
    try {
      await createTagMutation.mutateAsync(draft);
      setDraft(emptyDraft);
      setModalOpen(false);
      setMessage('Tag criada com sucesso.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível criar a tag.'));
    }
  };

  const deleteTag = useCallback(async (id: number) => {
    if (!window.confirm('Deseja realmente excluir esta tag?')) {
      return;
    }
    try {
      await deleteTagMutation.mutateAsync(id);
      setMessage('Tag excluída.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível excluir a tag.'));
    }
  }, [deleteTagMutation]);

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
    position: 'sticky',
    top: 0,
    background: 'var(--surface)',
    zIndex: 10
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: 12,
    color: 'var(--tx-1)',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>GESTÃO DE TAGS</h1>
          <p className="text-xs" style={{ color: 'var(--tx-2)', marginTop: 4 }}>
            Visualização de instrumentos com carregamento sob demanda.
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
        <div className="shrink-0" style={{
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

      <section className="flex-1 overflow-hidden" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
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
              ) : visibleTags.length ? (
                <>
                  {visibleTags.map((tag) => (
                    <TagRow
                      key={tag.ID}
                      tag={tag}
                      onDelete={deleteTag}
                      tdStyle={tdStyle}
                      btnDanger={btnDanger}
                    />
                  ))}

                  {/* Observer Trigger */}
                  <tr ref={observerRef}>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>
                      {hasMore ? (
                        <span style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carregando mais...</span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fim da lista • {allTags.length} tags</span>
                      )}
                    </td>
                  </tr>
                </>
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
