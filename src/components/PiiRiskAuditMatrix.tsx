import React, { useMemo } from 'react';
import { ShieldAlert, FileText, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { RegistryRecord } from '../types';

interface PiiRiskAuditMatrixProps {
  records: RegistryRecord[];
  isVaultLocked: boolean;
}

export const PiiRiskAuditMatrix: React.FC<PiiRiskAuditMatrixProps> = ({
  records,
  isVaultLocked,
}) => {
  const audit = useMemo(() => {
    let unmaskedNames = 0;
    let unmaskedPhones = 0;
    let unmaskedAddresses = 0;
    let highRiskJurisdictionCount = 0;

    records.forEach((r) => {
      if (!isVaultLocked && r.fullName && !r.fullName.includes('●')) unmaskedNames++;
      if (!isVaultLocked && r.phone && !r.phone.includes('●')) unmaskedPhones++;
      if (!isVaultLocked && r.address && !r.address.includes('●')) unmaskedAddresses++;

      if (['CA', 'NY', 'TX', 'FL', 'IL', 'MA'].includes(r.state)) {
        highRiskJurisdictionCount++;
      }
    });

    // Score out of 100 (0 = Lowest Risk, 100 = Highest Exposure)
    const total = records.length || 1;
    let score = 0;

    if (!isVaultLocked) {
      score += (unmaskedNames / total) * 35;
      score += (unmaskedPhones / total) * 35;
      score += (unmaskedAddresses / total) * 30;
    }

    score = Math.round(score);

    let riskLevel = 'LOW EXPOSURE (SAFE)';
    let colorCls = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

    if (score > 60) {
      riskLevel = 'CRITICAL PII EXPOSURE';
      colorCls = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (score > 25) {
      riskLevel = 'MODERATE EXPOSURE';
      colorCls = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }

    return {
      total,
      unmaskedNames,
      unmaskedPhones,
      unmaskedAddresses,
      highRiskJurisdictionCount,
      score,
      riskLevel,
      colorCls,
    };
  }, [records, isVaultLocked]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">PII Exposure Risk Audit Matrix</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${audit.colorCls}`}>
          {audit.riskLevel} ({audit.score}/100 Risk)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block text-[10px]">Unmasked Names</span>
          <strong className="text-slate-100 font-mono">{isVaultLocked ? '0 (Masked)' : audit.unmaskedNames}</strong>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block text-[10px]">Unmasked Phones</span>
          <strong className="text-slate-100 font-mono">{isVaultLocked ? '0 (Masked)' : audit.unmaskedPhones}</strong>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block text-[10px]">Unmasked Addresses</span>
          <strong className="text-slate-100 font-mono">{isVaultLocked ? '0 (Masked)' : audit.unmaskedAddresses}</strong>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block text-[10px]">Strict State Jurisdictions</span>
          <strong className="text-cyan-400 font-mono">{audit.highRiskJurisdictionCount} Records</strong>
        </div>
      </div>
    </div>
  );
};
