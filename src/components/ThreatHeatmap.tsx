import React from 'react';
import { MapPin, ShieldAlert } from 'lucide-react';

interface StateHeat {
  code: string;
  name: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  activeScrapers: number;
}

const STATES_HEAT: StateHeat[] = [
  { code: 'CA', name: 'California', threatLevel: 'CRITICAL', activeScrapers: 3 },
  { code: 'NY', name: 'New York', threatLevel: 'HIGH', activeScrapers: 2 },
  { code: 'TX', name: 'Texas', threatLevel: 'HIGH', activeScrapers: 2 },
  { code: 'FL', name: 'Florida', threatLevel: 'MODERATE', activeScrapers: 1 },
  { code: 'IL', name: 'Illinois', threatLevel: 'MODERATE', activeScrapers: 1 },
  { code: 'OH', name: 'Ohio', threatLevel: 'LOW', activeScrapers: 1 },
  { code: 'PA', name: 'Pennsylvania', threatLevel: 'LOW', activeScrapers: 1 },
  { code: 'MA', name: 'Massachusetts', threatLevel: 'HIGH', activeScrapers: 1 },
];

export const ThreatHeatmap: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">US State Registry Threat Heatmap</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {STATES_HEAT.map((st) => {
          let bg = 'bg-slate-950 border-slate-800 text-slate-300';
          if (st.threatLevel === 'CRITICAL') bg = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
          else if (st.threatLevel === 'HIGH') bg = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
          else if (st.threatLevel === 'MODERATE') bg = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';

          return (
            <div key={st.code} className={`p-2.5 border rounded-xl space-y-1 ${bg}`}>
              <div className="flex items-center justify-between font-bold">
                <span>{st.code} - {st.name}</span>
                <span className="text-[10px] font-mono">{st.threatLevel}</span>
              </div>
              <span className="text-[10px] text-slate-400 block">{st.activeScrapers} Active Portal Node(s)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
