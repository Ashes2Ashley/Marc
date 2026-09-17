import React, { useEffect, useMemo, useState } from 'react';

type Tab = 'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel';

interface Props {
  open: boolean;
  onClose: () => void;
  onGo: (tab: Tab) => void;
  onDedup: () => void;
  onChecksum: () => void;
}

export const CommandPalette: React.FC<Props> = ({ open, onClose, onGo, onDedup, onChecksum }) => {
  const [q, setQ] = useState('');
  const items = useMemo(
    () =>
      [
        { label: 'Home', run: () => onGo('dashboard') },
        { label: 'Sources', run: () => onGo('scrapers') },
        { label: 'Vault', run: () => onGo('vault') },
        { label: 'Charts', run: () => onGo('analytics') },
        { label: 'Rules', run: () => onGo('compliance') },
        { label: 'Feed', run: () => onGo('threat-intel') },
        { label: 'Collapse duplicate hashes', run: onDedup },
        { label: 'Copy vault checksum', run: onChecksum },
      ].filter((i) => i.label.toLowerCase().includes(q.toLowerCase())),
    [q, onGo, onDedup, onChecksum]
  );

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to\u2026 (Esc to close)" className="w-full bg-slate-950 text-white px-4 py-3 text-sm outline-none border-b border-slate-800" />
        <div className="max-h-72 overflow-y-auto">
          {items.map((item) => (
            <button key={item.label} onClick={() => { item.run(); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/20">
              {item.label}
            </button>
          ))}
          {items.length === 0 && <p className="px-4 py-3 text-xs text-slate-500">No match</p>}
        </div>
      </div>
    </div>
  );
};
