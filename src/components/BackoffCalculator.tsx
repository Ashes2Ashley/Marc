import React, { useState } from 'react';
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export const BackoffCalculator: React.FC = () => {
  const [baseDelayMs, setBaseDelayMs] = useState(1000);
  const [maxRetries, setMaxRetries] = useState(5);
  const [jitterPct, setJitterPct] = useState(25);

  const calculateDelays = () => {
    const list = [];
    for (let i = 1; i <= maxRetries; i++) {
      const expDelay = baseDelayMs * Math.pow(2, i - 1);
      const jitter = expDelay * (jitterPct / 100) * (Math.random() * 2 - 1);
      const finalDelay = Math.round(expDelay + jitter);
      list.push({ retry: i, expDelay, finalDelay });
    }
    return list;
  };

  const schedule = calculateDelays();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Rate Limit Retry Backoff Simulator</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="text-slate-400 text-[10px] block mb-1">Base Delay (ms)</label>
          <input
            type="number"
            value={baseDelayMs}
            onChange={(e) => setBaseDelayMs(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-mono"
          />
        </div>

        <div>
          <label className="text-slate-400 text-[10px] block mb-1">Max Retries</label>
          <input
            type="number"
            value={maxRetries}
            onChange={(e) => setMaxRetries(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-mono"
          />
        </div>

        <div>
          <label className="text-slate-400 text-[10px] block mb-1">Jitter ±%</label>
          <input
            type="number"
            value={jitterPct}
            onChange={(e) => setJitterPct(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-mono"
          />
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold block">Calculated Schedule with Full Jitter:</span>
        <div className="flex flex-wrap gap-1.5">
          {schedule.map((item) => (
            <span
              key={item.retry}
              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono text-[11px]"
            >
              Attempt {item.retry}: <strong>{item.finalDelay} ms</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
