import React, { useState } from 'react';
import { Code2, Play, CheckCircle2, XCircle } from 'lucide-react';

export const DomMutationTester: React.FC = () => {
  const [selector, setSelector] = useState('table.registry-data tr.record-row');
  const [htmlSnippet, setHtmlSnippet] = useState(
    `<table className="registry-data">\n  <tr className="record-row">\n    <td className="name">Doe, John</td>\n    <td className="phone">(555) 019-2834</td>\n  </tr>\n</table>`
  );
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const handleTest = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSnippet, 'text/html');
      const elements = doc.querySelectorAll(selector);
      setMatchCount(elements.length);
    } catch {
      setMatchCount(0);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">DOM Selector Mutation Tester</h3>
        </div>

        <button
          onClick={handleTest}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Test Selector</span>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <label className="text-slate-300 font-semibold block mb-1">CSS Selector Expression</label>
          <input
            type="text"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Sample Target HTML DOM Snippet</label>
          <textarea
            rows={3}
            value={htmlSnippet}
            onChange={(e) => setHtmlSnippet(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {matchCount !== null && (
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              matchCount > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {matchCount > 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>
              {matchCount > 0
                ? `Match Successful! Found ${matchCount} matching element(s) in DOM.`
                : 'Selector Mutation Failure: 0 elements matched in sample HTML.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
