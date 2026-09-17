import React, { useMemo } from 'react';
import { RegistryRecord } from '../types';

export type LensId =
  | 'all' | 'thin' | 'hi-conf' | 'lo-conf' | 'dups' | 'pasted' | 'fetched' | 'fresh' | 'stale'
  | 'no-offense' | 'has-notes' | 'unclassified' | 'audit' | 'fcra' | 'redacted' | 'active'
  | 'no-source' | 'old-year' | 'new-year' | 'named-only' | 'multi-state';

const LENSES: { id: LensId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'thin', label: 'Thin rows' },
  { id: 'hi-conf', label: 'High confidence' },
  { id: 'lo-conf', label: 'Low confidence' },
  { id: 'dups', label: 'Duplicate hashes' },
  { id: 'pasted', label: 'Pasted' },
  { id: 'fetched', label: 'Fetched' },
  { id: 'fresh', label: 'Last 24h' },
  { id: 'stale', label: 'Older than 30d' },
  { id: 'no-offense', label: 'No offense text' },
  { id: 'has-notes', label: 'Has notes' },
  { id: 'unclassified', label: 'Unclassified tier' },
  { id: 'audit', label: 'Audit pending' },
  { id: 'fcra', label: 'FCRA marked' },
  { id: 'redacted', label: 'Redacted phone' },
  { id: 'active', label: 'Active status' },
  { id: 'no-source', label: 'Weak source' },
  { id: 'old-year', label: 'Year ≤ 2010' },
  { id: 'new-year', label: 'Year ≥ 2020' },
  { id: 'named-only', label: 'Name only' },
  { id: 'multi-state', label: 'Repeat states' },
];

export function applyLens(records: RegistryRecord[], lens: LensId): RegistryRecord[] {
  const now = Date.now();
  const hashCount = new Map<string, number>();
  const stateCount = new Map<string, number>();
  records.forEach((r) => {
    hashCount.set(r.piiHash, (hashCount.get(r.piiHash) || 0) + 1);
    stateCount.set(r.state, (stateCount.get(r.state) || 0) + 1);
  });
  const popularStates = new Set([...stateCount.entries()].filter(([, n]) => n >= 2).map(([s]) => s));
  return records.filter((r) => {
    const filled = [r.fullName, r.state, r.offenseSummary, r.address].filter((x) => x && String(x).length > 1).length;
    const age = now - new Date(r.scrapedAt).getTime();
    switch (lens) {
      case 'all': return true;
      case 'thin': return filled <= 2;
      case 'hi-conf': return (r.parseConfidence || 0) >= 75;
      case 'lo-conf': return (r.parseConfidence || 0) > 0 && (r.parseConfidence || 0) < 50;
      case 'dups': return (hashCount.get(r.piiHash) || 0) > 1;
      case 'pasted': return r.sourceUrl === 'manual-paste' || r.notes === 'Pasted';
      case 'fetched': return Boolean(r.sourceUrl && r.sourceUrl.startsWith('http'));
      case 'fresh': return age <= 86400000;
      case 'stale': return age > 30 * 86400000;
      case 'no-offense': return !r.offenseSummary;
      case 'has-notes': return Boolean(r.notes);
      case 'unclassified': return r.tier === 'Unclassified';
      case 'audit': return r.complianceStatus === 'Audit Pending';
      case 'fcra': return r.complianceStatus === 'FCRA Compliant';
      case 'redacted': return String(r.phone).includes('*');
      case 'active': return r.registrationStatus === 'Active';
      case 'no-source': return !r.sourceUrl || r.sourceUrl === 'manual-paste';
      case 'old-year': return r.convictionYear <= 2010;
      case 'new-year': return r.convictionYear >= 2020;
      case 'named-only': return Boolean(r.fullName) && !r.phone && !r.address && !r.offenseSummary;
      case 'multi-state': return popularStates.has(r.state);
      default: return true;
    }
  });
}

interface Props { records: RegistryRecord[]; lens: LensId; onLens: (id: LensId) => void; }

export const OpsLenses: React.FC<Props> = ({ records, lens, onLens }) => {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    LENSES.forEach((l) => { map[l.id] = applyLens(records, l.id).length; });
    return map;
  }, [records]);
  return (
    <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs font-semibold text-white mb-2">Ops lenses · {counts[lens] || 0} in view</p>
      <div className="flex flex-wrap gap-1.5">
        {LENSES.map((l) => (
          <button key={l.id} onClick={() => onLens(l.id)} className={`px-2 py-1 text-[11px] rounded-lg border ${lens === l.id ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {l.label} {counts[l.id] || 0}
          </button>
        ))}
      </div>
    </div>
  );
};
