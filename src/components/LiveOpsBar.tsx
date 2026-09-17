import React from 'react';

interface Props {
  workerOk: boolean | null;
  workerHost: string;
  lastFetchAt: string | null;
  lastFetchStatus: string;
  recordCount: number;
  uniqueHashes: number;
  retentionDays: number;
  onRetention: (days: number) => void;
  onDedup: () => void;
  onChecksum: () => void;
  idleLockMin: number;
}

export const LiveOpsBar: React.FC<Props> = ({
  workerOk, workerHost, lastFetchAt, lastFetchStatus, recordCount, uniqueHashes, retentionDays, onRetention, onDedup, onChecksum, idleLockMin,
}) => {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <div className="ops-panel p-3">
        <p className="text-[11px] text-slate-400">Worker gateway</p>
        <p className={`text-sm font-semibold ${workerOk ? 'text-emerald-400' : workerOk === false ? 'text-rose-400' : 'text-slate-300'}`}>
          {workerOk === null ? 'Not probed' : workerOk ? 'Online' : 'Offline'}
        </p>
        <p className="text-[11px] text-slate-500 truncate">{workerHost || 'same-origin /api or VITE_WORKER_URL'}</p>
      </div>
      <div className="ops-panel p-3">
        <p className="text-[11px] text-slate-400">Last live fetch</p>
        <p className="text-sm font-semibold text-white">{lastFetchStatus || 'None yet'}</p>
        <p className="text-[11px] text-slate-500">{lastFetchAt ? new Date(lastFetchAt).toLocaleString() : '\u2014'}</p>
      </div>
      <div className="ops-panel p-3">
        <p className="text-[11px] text-slate-400">Vault / unique hashes</p>
        <p className="text-sm font-semibold text-white">{recordCount} / {uniqueHashes}</p>
        <button onClick={onDedup} className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300">Collapse duplicates</button>
      </div>
      <div className="ops-panel p-3">
        <p className="text-[11px] text-slate-400">Retention \u00b7 idle lock {idleLockMin}m</p>
        <div className="flex items-center gap-2 mt-1">
          <select value={retentionDays} onChange={(e) => onRetention(Number(e.target.value))} className="bg-slate-950 border border-slate-700 rounded text-xs px-2 py-1">
            <option value={0}>Keep all</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button onClick={onChecksum} className="text-[11px] text-indigo-400">Checksum</button>
        </div>
      </div>
    </div>
  );
};
