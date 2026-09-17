import React, { useMemo, useState } from 'react';
import { OFFICIAL_SOURCES } from '../data/officialSources';
import { RegistryRecord, ScraperConfig } from '../types';

interface RunItem { at: string; label: string; rows: number; }
interface Props {
  records: RegistryRecord[];
  scrapers: ScraperConfig[];
  runs: RunItem[];
  onAddSource: (src: { code: string; name: string; url: string }) => void;
  onPasteRows: (rows: RegistryRecord[]) => void;
}

export const MoreOpsPanel: React.FC<Props> = ({ records, scrapers, runs, onAddSource, onPasteRows }) => {
  const [csv, setCsv] = useState('');
  const complete = useMemo(() => {
    if (!records.length) return 0;
    const score = records.reduce((acc, r) => acc + [r.fullName, r.state, r.offenseSummary, r.sourceUrl].filter((x) => x && String(x).length > 1).length, 0);
    return Math.round((score / (records.length * 4)) * 100);
  }, [records]);

  const parsePaste = () => {
    const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out: RegistryRecord[] = [];
    for (const line of lines) {
      if (/^name[,;]/i.test(line)) continue;
      const [fullName, state, offenseSummary, year] = line.split(/[,;\t]/).map((p) => p.trim());
      if (!fullName) continue;
      out.push({
        id: `REG-${Date.now()}-${out.length}`, externalId: `PASTE-${out.length + 1}`, fullName,
        phone: '', address: '', city: '', state: (state || '').slice(0, 2).toUpperCase() || 'US', zipCode: '',
        jurisdiction: state || '', tier: 'Unclassified', offenseSummary: offenseSummary || '',
        convictionYear: Number(year) || new Date().getFullYear(), registrationStatus: 'Active',
        scrapedAt: new Date().toISOString(), sourceUrl: 'manual-paste', isEncrypted: true,
        piiHash: `${fullName}:${state}:${offenseSummary}`, complianceStatus: 'Audit Pending', notes: 'Pasted', parseConfidence: 50,
      });
    }
    if (out.length) { onPasteRows(out); setCsv(''); }
  };

  return (
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-white mb-2">Official source directory</p>
        <p className="text-[11px] text-slate-500 mb-2">Adds a source card. Does not fetch people by itself.</p>
        <div className="flex flex-wrap gap-1.5">
          {OFFICIAL_SOURCES.map((s) => {
            const exists = scrapers.some((x) => x.targetUrl === s.url || x.stateCode === s.code);
            return (
              <button key={s.code} disabled={exists} onClick={() => onAddSource(s)} className={`px-2 py-1 text-[11px] rounded-lg border ${exists ? 'border-slate-800 text-slate-600' : 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10'}`}>
                {s.code}
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-white mb-1">Paste rows</p>
        <p className="text-[11px] text-slate-500 mb-2">name, state, offense, year</p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-200" placeholder="Jane Doe, CA, example statute, 2019" />
        <button onClick={parsePaste} className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white">Add pasted rows</button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-white">Field completeness {complete}%</p>
        <p className="text-[11px] text-slate-500 mb-2">Shortcuts: Ctrl/Cmd+K</p>
        <p className="text-[11px] text-slate-400 mb-1">Recent runs</p>
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {runs.length === 0 && <p className="text-[11px] text-slate-600">None yet</p>}
          {runs.slice(0, 6).map((r) => (
            <div key={r.at} className="text-[11px] text-slate-300 flex justify-between">
              <span className="truncate pr-2">{r.label}</span>
              <span className="text-slate-500">{r.rows}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
