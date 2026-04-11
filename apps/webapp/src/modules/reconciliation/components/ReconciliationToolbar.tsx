import { AlertTriangle, CheckCircle2, Download, FolderOpen, Play, Save } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import type { ReconcileResult } from '../../../types';
import type { CanvasPreset } from '../types';

export function ReconciliationToolbar({
  activeWorkspace,
  onFileUpload,
  onLoadLayouts,
  onLoadPreset,
  onReconcile,
  onSaveNew,
  onToggleSidebar,
  onToggleSummary,
  onUpdateLayout,
  pendingConnection,
  presets,
  reconcileResult,
  sidebarVisible,
  status,
  summaryVisible,
}: {
  activeWorkspace: boolean;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onLoadLayouts: () => void;
  onLoadPreset: (preset: CanvasPreset) => void;
  onReconcile: () => void;
  onSaveNew: () => void;
  onToggleSidebar: () => void;
  onToggleSummary: () => void;
  onUpdateLayout: () => void;
  pendingConnection: boolean;
  presets: CanvasPreset[];
  reconcileResult: ReconcileResult | null;
  sidebarVisible: boolean;
  status: string | null;
  summaryVisible: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const globalTestLabel = reconcileResult?.statistical_validity === false ? 'Suspeito a 95%' : 'Válido a 95%';
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontSize: 11, fontWeight: 500, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer', whiteSpace: 'nowrap' };
  const btnPrimary: React.CSSProperties = { ...btnBase, border: '1px solid var(--accent-bd)', background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 };
  const sep = <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-md)', margin: '0 6px' }} />;
  const grp = (t: string) => <span style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'var(--tx-3)', paddingRight: 4, userSelect: 'none' as const }}>{t}</span>;

  return (
    <div className="flex shrink-0 items-center overflow-x-auto px-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', height: 38, gap: 0 }}>
      {grp('Exec')}
      <div style={{ display: 'flex', gap: 3 }}>
        <button type="button" style={btnPrimary} onClick={onReconcile} data-testid="reconcile-button"><Play size={11} />Reconciliar</button>
        <button type="button" style={btnBase} onClick={() => fileRef.current?.click()}><Download size={11} />Importar JSON</button>
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
      {grp('Exemplos')}
      <div style={{ display: 'flex', gap: 3 }}>
        {presets.map((preset) => (
          <button key={preset.id} type="button" style={btnBase} onClick={() => onLoadPreset(preset)}>
            {preset.name}
          </button>
        ))}
      </div>
      {sep}
      {grp('Vista')}
      <div style={{ display: 'flex', gap: 3 }}>
        <button type="button" style={btnBase} onClick={onToggleSidebar}>{sidebarVisible ? 'Ocultar painel' : 'Exibir painel'}</button>
        <button type="button" style={btnBase} onClick={onToggleSummary}>{summaryVisible ? 'Ocultar resumo' : 'Exibir resumo'}</button>
      </div>

      {reconcileResult && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: reconcileResult.statistical_validity === false ? 'var(--danger-bg)' : 'var(--accent-bg)', color: reconcileResult.statistical_validity === false ? 'var(--danger)' : 'var(--accent)', border: `1px solid ${reconcileResult.statistical_validity === false ? 'var(--danger)' : 'var(--accent)'}` }}>
            {reconcileResult.statistical_validity === false ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            {globalTestLabel}
          </div>
          {reconcileResult.confidence_score !== undefined && (
            <span style={{ fontSize: 10, color: 'var(--tx-3)', fontWeight: 600 }}>P-valor: {(reconcileResult.confidence_score * 100).toFixed(1)}%</span>
          )}
        </div>
      )}

      {pendingConnection && <span style={{ marginLeft: reconcileResult ? 16 : 'auto', fontSize: 11, color: 'var(--accent)', paddingLeft: 16 }}>Clique em um nó para conectar · Esc para cancelar</span>}
      {!pendingConnection && !reconcileResult && status && <span style={{ marginLeft: 'auto', paddingLeft: 16, fontSize: 11, color: 'var(--tx-3)', whiteSpace: 'nowrap' }}>{status}</span>}
      <input ref={fileRef} type="file" accept=".json" onChange={onFileUpload} className="hidden" />
    </div>
  );
}
