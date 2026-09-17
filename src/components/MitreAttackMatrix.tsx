import React, { useState } from 'react';
import { ShieldAlert, Crosshair, ExternalLink, ChevronRight } from 'lucide-react';

interface MitreTechnique {
  id: string;
  name: string;
  tactic: 'Reconnaissance' | 'Resource Development' | 'Defense Evasion' | 'Collection';
  description: string;
  countermeasure: string;
  detectionCount: number;
}

const MITRE_TECHNIQUES: MitreTechnique[] = [
  {
    id: 'T1071.001',
    name: 'Web Protocols / CORS Proxy Evasion',
    tactic: 'Defense Evasion',
    description: 'Scraper routes HTTP requests through CORS proxies or cloud workers to bypass state origin IP filters.',
    countermeasure: 'Enforce CorsProxy validation tokens & strict TLS fingerprint matching.',
    detectionCount: 142,
  },
  {
    id: 'T1027',
    name: 'Obfuscated DOM / Dynamic Shadow DOM Shifting',
    tactic: 'Defense Evasion',
    description: 'State registry portals introduce randomized CSS class names to disrupt automated query parsers.',
    countermeasure: 'Deploy heuristic DOM path resolution & structural text-node tree traversal.',
    detectionCount: 89,
  },
  {
    id: 'T1588.002',
    name: 'Anti-Bot CAPTCHA Challenge & WAF Probing',
    tactic: 'Reconnaissance',
    description: 'Probing portal endpoints for Cloudflare / Akamai Bot Manager JavaScript challenges.',
    countermeasure: 'Automatic rate-limit circuit breaking & exponential backoff jitter.',
    detectionCount: 215,
  },
  {
    id: 'T1595',
    name: 'Active Scanning / Bulk Registry Pagination',
    tactic: 'Reconnaissance',
    description: 'Iterating zip codes and conviction years to systematically pull public records.',
    countermeasure: 'FCRA rate delay enforcement (min 3000ms delay per page).',
    detectionCount: 310,
  },
];

export const MitreAttackMatrix: React.FC = () => {
  const [selected, setSelected] = useState<MitreTechnique>(MITRE_TECHNIQUES[0]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center gap-2">
        <Crosshair className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-white">MITRE ATT&CK® Threat Mapping Matrix</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Technique List */}
        <div className="space-y-1.5">
          {MITRE_TECHNIQUES.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setSelected(tech)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                selected.id === tech.id
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="font-mono text-[10px] text-amber-400 block font-bold">{tech.id}</span>
                <span className="font-semibold text-xs text-white">{tech.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          ))}
        </div>

        {/* Selected Technique Details */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                {selected.tactic}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selected.detectionCount} Detections Logged
              </span>
            </div>

            <h4 className="text-sm font-bold text-white font-mono">{selected.id}: {selected.name}</h4>
            <p className="text-slate-300 text-xs leading-relaxed">{selected.description}</p>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <span className="text-[10px] text-cyan-400 font-bold block uppercase">Recommended Defensive Countermeasure</span>
            <p className="text-slate-200 text-xs">{selected.countermeasure}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
