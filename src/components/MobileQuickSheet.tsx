import React from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, X, FileText } from 'lucide-react';
import { RegistryRecord } from '../types';

interface MobileQuickSheetProps {
  record: RegistryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isVaultLocked: boolean;
}

export const MobileQuickSheet: React.FC<MobileQuickSheetProps> = ({
  record,
  isOpen,
  onClose,
  isVaultLocked,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-200 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Record Mobile Detail Sheet</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Subject Identifier</span>
            <p className="font-bold text-white text-sm">
              {isVaultLocked ? '●●●●●●●●●● (Vault Locked)' : record.fullName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block">State Jurisdiction</span>
              <strong className="text-cyan-400">{record.state} ({record.city})</strong>
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block">Risk Tier</span>
              <strong className="text-amber-400">{record.tier}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Offense Summary</span>
            <p className="text-slate-300 text-xs">{record.offenseSummary}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
        >
          Close Sheet
        </button>
      </div>
    </div>
  );
};
