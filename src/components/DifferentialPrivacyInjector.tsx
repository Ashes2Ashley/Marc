import React, { useState } from 'react';
import { Sliders, Activity, Info, ShieldCheck } from 'lucide-react';

interface DifferentialPrivacyInjectorProps {
  epsilon: number;
  onEpsilonChange: (epsilon: number) => void;
}

export const DifferentialPrivacyInjector: React.FC<DifferentialPrivacyInjectorProps> = ({
  epsilon,
  onEpsilonChange,
}) => {
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Differential Privacy (Laplace Noise Injector)</h3>
        </div>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all ${
            isEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {isEnabled ? 'Noise Active (ε-DP)' : 'Raw Aggregates'}
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Injects controlled Laplacian noise into statistical count summaries to guarantee mathematical differential privacy (ε-differential privacy) and prevent re-identification via database reconstruction attacks.
      </p>

      {isEnabled && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Privacy Budget Parameter (ε - Epsilon): <strong className="text-indigo-400 font-mono">{epsilon.toFixed(2)}</strong></span>
            <span className="text-slate-400">{epsilon < 0.5 ? 'High Privacy (More Noise)' : 'High Utility (Less Noise)'}</span>
          </div>

          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.1}
            value={epsilon}
            onChange={(e) => onEpsilonChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
