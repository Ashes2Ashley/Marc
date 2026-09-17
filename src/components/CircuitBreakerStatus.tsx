import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export const CircuitBreakerStatus: React.FC = () => {
  const [status, setStatus] = useState<'CLOSED' | 'HALF_OPEN' | 'OPEN'>('CLOSED');
  const [failureThreshold, setFailureThreshold] = useState(3);
  const [recent429s, setRecent429s] = useState(0);

  const simulate429 = () => {
    const nextCount = recent429s + 1;
    setRecent429s(nextCount);
    if (nextCount >= failureThreshold) {
      setStatus('OPEN');
    }
  };

  const resetCircuit = () => {
    setStatus('CLOSED');
    setRecent429s(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Rate Limit Circuit Breaker</h3>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
            status === 'CLOSED'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : status === 'OPEN'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          Circuit: {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={simulate429}
          className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 rounded-xl font-semibold transition-all"
        >
          Simulate 429 Rate Limit ({recent429s}/{failureThreshold})
        </button>

        <button
          onClick={resetCircuit}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all border border-slate-700"
        >
          Reset Circuit Breaker
        </button>
      </div>
    </div>
  );
};
