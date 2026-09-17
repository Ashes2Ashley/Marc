import React, { useState } from 'react';
import { Terminal, Copy, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

const SAMPLE_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (ResearchBot/FCRA-2026; research@publicsafety.org)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15 (AcademicPublicSafetyScraper/1.0)',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 (EthicalRegistryAudit/2026; +https://publicsafety.org/bot)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0 (FCRA-Audit-Agent; contact@ethicalresearch.org)',
];

interface FingerprintGeneratorProps {
  onSelectUserAgent?: (ua: string) => void;
}

export const FingerprintGenerator: React.FC<FingerprintGeneratorProps> = ({
  onSelectUserAgent,
}) => {
  const [currentAgent, setCurrentAgent] = useState(SAMPLE_AGENTS[0]);
  const [copied, setCopied] = useState(false);

  const handleRotate = () => {
    const next = SAMPLE_AGENTS[Math.floor(Math.random() * SAMPLE_AGENTS.length)];
    setCurrentAgent(next);
    if (onSelectUserAgent) onSelectUserAgent(next);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAgent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Dynamic Ethical User-Agent Fingerprint Generator</h3>
        </div>

        <button
          onClick={handleRotate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Rotate User-Agent</span>
        </button>
      </div>

      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 break-all relative">
        {currentAgent}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          title="Copy User-Agent Header"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
