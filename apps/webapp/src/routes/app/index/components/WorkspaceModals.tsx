import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Workspace } from '../../../../types';
import type { WorkspaceDraft } from '../types';
import { useWorkspaceVersions } from '../../../../hooks/useWorkspaceVersions';
import type { WorkspaceVersion } from '../../../../hooks/useWorkspaceVersions';
import { WorkspaceVersionDiff } from '../../../../components/WorkspaceVersionDiff';

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
                  <span style={{ display: 'block', color: 'var(--tx-3)', fontSize: 10, marginTop: 3 }}>{workspace.description || 'Sem descricao'}</span>
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

export function WorkspaceVersionDiffModal({ workspaceId, onCancel }: {
  workspaceId: number;
  onCancel: () => void;
}) {
  const { data: versions = [], isLoading } = useWorkspaceVersions(workspaceId);
  const [idxA, setIdxA] = useState<number>(0);
  const [idxB, setIdxB] = useState<number>(1);

  const btn: React.CSSProperties = { padding: '5px 10px', fontSize: 11, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer' };
  const sel: React.CSSProperties = { padding: '6px 8px', fontSize: 11, background: 'var(--panel)', border: '1px solid var(--border-md)', borderRadius: 3, color: 'var(--tx-1)', outline: 'none', flex: 1 };
  const lbl: React.CSSProperties = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tx-3)', display: 'block', marginBottom: 4 };

  const versionA: WorkspaceVersion | undefined = versions[idxA];
  const versionB: WorkspaceVersion | undefined = versions[idxB];
  const canCompare = versionA !== undefined && versionB !== undefined && idxA !== idxB;

  function formatVerLabel(v: WorkspaceVersion, i: number) {
    const d = new Date(v.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    return v.label ? `${v.label} — ${d}` : `v${i + 1} — ${d}`;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)' }} onClick={onCancel}>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '20px 22px', width: 'min(860px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>Comparar Versoes</p>
          <button type="button" onClick={onCancel} style={btn}>Fechar</button>
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--tx-3)', fontSize: 11 }}>Buscando versoes...</p>
        ) : versions.length < 2 ? (
          <p style={{ color: 'var(--tx-3)', fontSize: 11 }}>Sao necessarias pelo menos 2 versoes salvas para comparar.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={lbl}>Versao A</span>
                <select style={sel} value={idxA} onChange={(e) => setIdxA(Number(e.target.value))}>
                  {versions.map((v, i) => (
                    <option key={v.id} value={i}>{formatVerLabel(v, i)}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={lbl}>Versao B</span>
                <select style={sel} value={idxB} onChange={(e) => setIdxB(Number(e.target.value))}>
                  {versions.map((v, i) => (
                    <option key={v.id} value={i}>{formatVerLabel(v, i)}</option>
                  ))}
                </select>
              </div>
            </div>
            {canCompare ? (
              <WorkspaceVersionDiff versionA={versionA} versionB={versionB} />
            ) : (
              <p style={{ color: 'var(--tx-3)', fontSize: 11 }}>Selecione versoes diferentes para comparar.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
