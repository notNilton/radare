import { Trash2 } from 'lucide-react';
import type { Workspace } from '../../../types';
import type { WorkspaceDraft } from '../types';

export function WorkspaceSaveModal({ draft, isSaving, onCancel, onChange, onConfirm }: {
  draft: WorkspaceDraft;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (draft: WorkspaceDraft) => void;
  onConfirm: () => void;
}) {
  const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', fontSize: 12, background: 'var(--panel)', border: '1px solid var(--border-md)', borderRadius: 3, color: 'var(--tx-1)', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '20px 22px', width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{draft.id ? 'Atualizar Layout' : 'Salvar Novo Layout'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <span style={lbl}>Nome</span>
            <input style={inp} value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} autoFocus />
          </label>
          <label>
            <span style={lbl}>Descrição</span>
            <textarea style={{ ...inp, minHeight: 76, resize: 'vertical' }} value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={isSaving} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--accent-bd)', borderRadius: 3, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>{isSaving ? 'Salvando...' : draft.id ? 'Atualizar' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceLoadModal({ isDeleting, isLoading, onCancel, onDelete, onLoad, workspaces }: {
  isDeleting: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onDelete: (workspace: Workspace) => void;
  onLoad: (workspace: Workspace) => void;
  workspaces: Workspace[];
}) {
  const item: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel)' };
  const btn: React.CSSProperties = { padding: '5px 10px', fontSize: 11, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '20px 22px', width: 420, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carregar Layout</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {isLoading ? (
            <p style={{ color: 'var(--tx-3)', fontSize: 11 }}>Buscando workspaces...</p>
          ) : workspaces.length ? (
            workspaces.map((workspace) => (
              <div key={workspace.ID} style={item}>
                <button type="button" onClick={() => onLoad(workspace)} style={{ flex: 1, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ display: 'block', color: 'var(--tx-1)', fontSize: 12, fontWeight: 600 }}>{workspace.name}</span>
                  <span style={{ display: 'block', color: 'var(--tx-3)', fontSize: 10, marginTop: 3 }}>{workspace.description || 'Sem descrição'}</span>
                </button>
                <button type="button" onClick={() => onDelete(workspace)} disabled={isDeleting} style={{ ...btn, color: 'var(--danger)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--tx-3)', fontSize: 11 }}>Nenhum layout salvo ainda.</p>
          )}
        </div>
        <div style={{ display: 'flex', marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={btn}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
