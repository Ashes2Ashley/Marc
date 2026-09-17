import React from 'react';
import { HardDrive, Wifi, WifiOff, Database } from 'lucide-react';

interface PwaOfflineVisualizerProps {
  recordCount: number;
}

export const PwaOfflineVisualizer: React.FC<PwaOfflineVisualizerProps> = ({ recordCount }) => {
  const estimatedKb = Math.round((recordCount * 1.2));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Offline Storage & PWA Sync Quota</h3>
        </div>
        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
          <Wifi className="w-3 h-3" />
          Offline Ready
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[10px] block">Cached Records</span>
          <strong className="text-white font-mono">{recordCount} Items</strong>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[10px] block">Local Storage Footprint</span>
          <strong className="text-cyan-400 font-mono">~{estimatedKb} KB</strong>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[10px] block">Quota Remaining</span>
          <strong className="text-emerald-400 font-mono">99.8% Free</strong>
        </div>
      </div>
    </div>
  );
};
