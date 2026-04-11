import { useEffect } from 'react';
import type { EdgeModalState } from '../types';

export function EdgeModal({ state, onChange, onConfirm, onCancel }: {
  state: EdgeModalState;
  onChange: (p: Partial<Pick<EdgeModalState, 'name' | 'value' | 'tolerance'>>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onConfirm, onCancel]);

  const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: 12, background: 'var(--panel)', border: '1px solid var(--border-md)', borderRadius: 3, color: 'var(--tx-1)', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '20px 22px', width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: 'var(--tx-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Corrente</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label><span style={lbl}>Nome</span><input style={inp} value={state.name} onChange={(e) => onChange({ name: e.target.value })} autoFocus /></label>
          <label><span style={lbl}>Valor</span><input style={inp} type="number" value={state.value} onChange={(e) => onChange({ value: e.target.value })} /></label>
          <label><span style={lbl}>Tolerância</span><input style={inp} type="number" step="0.01" value={state.tolerance} onChange={(e) => onChange({ tolerance: e.target.value })} /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--border-md)', borderRadius: 3, background: 'transparent', color: 'var(--tx-2)', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={onConfirm} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--accent-bd)', borderRadius: 3, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
