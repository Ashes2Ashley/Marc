import React from 'react';

interface Props {
  lockedOut: boolean;
  remainingMs: number;
  fails: number;
  sealOk: boolean | null;
  auditCount: number;
  onWipe: () => void;
  onSeal: () => void;
  onVerify: () => void;
}

export const HardenedBar: React.FC<Props> = ({ lockedOut, remainingMs, fails, sealOk, auditCount, onWipe, onSeal, onVerify }) => {
  const mins = Math.ceil(remainingMs / 60000);
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <p className="text-[11px] text-slate-400">Unlock lockout</p>
        <p className={`text-sm font-semibold ${lockedOut ? 'text-rose-400' : 'text-emerald-400'}`}>{lockedOut ? `Locked ${mins}m` : 'Open'}</p>
        <p className="text-[11px] text-slate-500">{fails} failed tries</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <p className="text-[11px] text-slate-400">Vault seal</p>
        <p className={`text-sm font-semibold ${sealOk === false ? 'text-rose-400' : 'text-white'}`}>{sealOk === null ? 'Not checked' : sealOk ? 'Matches' : 'Break'}</p>
        <div className="flex gap-2 mt-1">
          <button onClick={onSeal} className="text-[11px] text-indigo-400">Seal</button>
          <button onClick={onVerify} className="text-[11px] text-indigo-400">Verify</button>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <p className="text-[11px] text-slate-400">Security audit</p>
        <p className="text-sm font-semibold text-white">{auditCount} events</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <p className="text-[11px] text-slate-400">Secure wipe</p>
        <button onClick={onWipe} className="mt-1 text-xs px-2 py-1 rounded bg-rose-900/60 text-rose-100">Overwrite + clear vault keys</button>
      </div>
    </div>
  );
};
