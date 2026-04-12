import { FolderOpen, Play, RotateCcw, RotateCw, Save } from 'lucide-react';

export function WorkspaceToolbar({
  activeWorkspace,
  onLoadLayouts,
  onRedo,
  onReconcile,
  onSaveNew,
  onUndo,
  onUpdateLayout,
  canRedo,
  canUndo,
}: {
  activeWorkspace: boolean;
  canRedo: boolean;
  canUndo: boolean;
  onLoadLayouts: () => void;
  onRedo: () => void;
  onReconcile: () => void;
  onSaveNew: () => void;
  onUndo: () => void;
  onUpdateLayout: () => void;
}) {
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: 11, fontWeight: 500, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer', whiteSpace: 'nowrap' };
  const btnDisabled: React.CSSProperties = { ...btnBase, color: 'var(--tx-3)', cursor: 'not-allowed', opacity: 0.55 };
  const btnPrimary: React.CSSProperties = { ...btnBase, border: '1px solid var(--accent-bd)', background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 };
  const sep = <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-md)', margin: '0 6px' }} />;
  const grp = (t: string) => <span style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'var(--tx-3)', paddingRight: 4, userSelect: 'none' as const }}>{t}</span>;

  return (
    <div className="flex shrink-0 items-center overflow-x-auto px-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', height: 38, gap: 0 }}>
      {grp('Exec')}
      <div style={{ display: 'flex', gap: 3 }}>
        <button type="button" style={btnPrimary} onClick={onReconcile} data-testid="reconcile-button"><Play size={11} />Reconciliar</button>
      </div>
      {sep}
      {grp('Layout')}
      <div style={{ display: 'flex', gap: 3 }}>
        <button type="button" style={btnBase} onClick={onSaveNew}><Save size={11} />Salvar novo</button>
        {activeWorkspace && (
          <button type="button" style={btnBase} onClick={onUpdateLayout}><Save size={11} />Atualizar</button>
        )}
        <button type="button" style={btnBase} onClick={onLoadLayouts}><FolderOpen size={11} />Carregar</button>
      </div>
      {sep}
      {grp('Hist')}
      <div style={{ display: 'flex', gap: 3 }}>
        <button type="button" style={canUndo ? btnBase : btnDisabled} disabled={!canUndo} onClick={onUndo}><RotateCcw size={11} />Desfazer</button>
        <button type="button" style={canRedo ? btnBase : btnDisabled} disabled={!canRedo} onClick={onRedo}><RotateCw size={11} />Refazer</button>
      </div>
    </div>
  );
}
