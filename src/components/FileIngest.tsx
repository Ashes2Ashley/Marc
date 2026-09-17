import React, { useRef, useState } from 'react';
import { RegistryRecord } from '../types';
import { ingestFile } from '../utils/ingestFiles';

interface Props { onIngest: (rows: RegistryRecord[], summary: string) => void; }

export const FileIngest: React.FC<Props> = ({ onIngest }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('Drop .csv or .json — columns are auto-mapped');
  const [over, setOver] = useState(false);
  const run = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => /\.(csv|json|tsv|txt)$/i.test(f.name) || f.type.includes('json') || f.type.includes('csv'));
    if (!list.length) { setHint('Use .csv or .json'); return; }
    setBusy(true);
    let all: RegistryRecord[] = [];
    let skipped = 0;
    const kinds: string[] = [];
    try {
      for (const file of list) {
        const res = await ingestFile(file);
        all = all.concat(res.records);
        skipped += res.skipped;
        kinds.push(`${file.name} (${res.kind}, ${res.records.length})`);
      }
      onIngest(all, kinds.join('; ') + (skipped ? `; skipped ${skipped}` : ''));
      setHint(all.length ? `Loaded ${all.length} row(s)` : 'No usable name fields found');
    } catch (err) {
      setHint(`Parse failed: ${String(err)}`);
    } finally { setBusy(false); }
  };
  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) run(e.dataTransfer.files); }} className={`mb-6 rounded-xl border p-4 ${over ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-800 bg-slate-900'}`}>
      <p className="text-xs font-semibold text-white mb-1">Auto ingest</p>
      <p className="text-[11px] text-slate-500 mb-3">{hint}</p>
      <div className="flex items-center gap-2">
        <button disabled={busy} onClick={() => inputRef.current?.click()} className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white disabled:opacity-50">{busy ? 'Parsing…' : 'Choose files'}</button>
        <span className="text-[11px] text-slate-500">or drop here</span>
      </div>
      <input ref={inputRef} type="file" accept=".csv,.json,.tsv,.txt,application/json,text/csv" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) run(e.target.files); e.target.value = ''; }} />
    </div>
  );
};
