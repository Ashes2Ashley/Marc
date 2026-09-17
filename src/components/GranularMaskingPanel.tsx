import React from 'react';
import { Eye, EyeOff, Lock, Check } from 'lucide-react';

export interface MaskingConfig {
  fullName: boolean;
  phone: boolean;
  address: boolean;
  zipCode: boolean;
  offenseSummary: boolean;
}

interface GranularMaskingPanelProps {
  masking: MaskingConfig;
  onChangeMasking: (newConfig: MaskingConfig) => void;
  isVaultLocked: boolean;
}

export const GranularMaskingPanel: React.FC<GranularMaskingPanelProps> = ({
  masking,
  onChangeMasking,
  isVaultLocked,
}) => {
  const toggleField = (field: keyof MaskingConfig) => {
    onChangeMasking({
      ...masking,
      [field]: !masking[field],
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isVaultLocked ? <Lock className="w-5 h-5 text-amber-400" /> : <Eye className="w-5 h-5 text-indigo-400" />}
          <h3 className="text-sm font-bold text-white">Granular Column-Level Masking Controls</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {isVaultLocked ? 'Master Lock Overrides All' : 'Custom Redaction Mode'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {[
          { key: 'fullName', label: 'Full Name' },
          { key: 'phone', label: 'Phone Number' },
          { key: 'address', label: 'Street Address' },
          { key: 'zipCode', label: 'Zip Code' },
          { key: 'offenseSummary', label: 'Offense Text' },
        ].map((item) => {
          const key = item.key as keyof MaskingConfig;
          const isMasked = isVaultLocked || masking[key];

          return (
            <button
              key={item.key}
              type="button"
              disabled={isVaultLocked}
              onClick={() => toggleField(key)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                isMasked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              } ${isVaultLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isMasked ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              <span className="font-semibold text-[11px]">{item.label}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider">
                {isMasked ? 'Masked' : 'Unmasked'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
