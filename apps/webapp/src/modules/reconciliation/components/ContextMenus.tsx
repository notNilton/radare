import { useEffect, useState } from 'react';

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', padding: '6px 10px', background: hovered ? 'var(--panel)' : 'transparent',
        border: 'none', borderRadius: 3, cursor: 'pointer', textAlign: 'left',
        fontSize: 11, fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--tx-1)',
      }}
    >
      {label}
    </button>
  );
}

export function PaneMenu({ x, y, onAdd, onClose }: { x: number; y: number; onAdd: () => void; onClose: () => void }) {
  useEffect(() => {
    const click = () => onClose();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', click);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('click', click); window.removeEventListener('keydown', key); };
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 4, padding: 4, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem label="Adicionar nó" onClick={() => { onAdd(); onClose(); }} />
    </div>
  );
}

export function NodeMenu({ x, y, onRename, onDelete, onClose }: { x: number; y: number; onRename: () => void; onDelete: () => void; onClose: () => void }) {
  useEffect(() => {
    const click = () => onClose();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', click);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('click', click); window.removeEventListener('keydown', key); };
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 4, padding: 4, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem label="Renomear" onClick={() => { onRename(); onClose(); }} />
      <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
      <MenuItem label="Deletar" onClick={() => { onDelete(); onClose(); }} danger />
    </div>
  );
}
