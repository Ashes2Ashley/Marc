import React, { useState, useMemo } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, AlertTriangle, Zap, Cpu, Sparkles } from 'lucide-react';

interface PassphraseEntropyCalculatorProps {
  passphrase: string;
  onSelectPassphrase?: (passphrase: string) => void;
}

export const PassphraseEntropyCalculator: React.FC<PassphraseEntropyCalculatorProps> = ({
  passphrase,
  onSelectPassphrase,
}) => {
  const [customInput, setCustomInput] = useState(passphrase);

  const evaluation = useMemo(() => {
    const text = customInput || passphrase || '';
    const length = text.length;

    let poolSize = 0;
    if (/[a-z]/.test(text)) poolSize += 26;
    if (/[A-Z]/.test(text)) poolSize += 26;
    if (/[0-9]/.test(text)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(text)) poolSize += 33;

    // Shannon Entropy calculation in bits: Log2(poolSize^length)
    const entropyBits = poolSize > 0 && length > 0 ? Math.round(length * Math.log2(poolSize)) : 0;

    // Time to crack at 100 billion hashes/sec (standard GPU cluster)
    const combinations = poolSize > 0 ? Math.pow(poolSize, length) : 0;
    const secondsToCrack = combinations / 100_000_000_000;

    let timeToCrackStr = 'Instantaneous';
    if (secondsToCrack < 1) timeToCrackStr = '< 1 second';
    else if (secondsToCrack < 60) timeToCrackStr = `${Math.round(secondsToCrack)} seconds`;
    else if (secondsToCrack < 3600) timeToCrackStr = `${Math.round(secondsToCrack / 60)} minutes`;
    else if (secondsToCrack < 86400) timeToCrackStr = `${Math.round(secondsToCrack / 3600)} hours`;
    else if (secondsToCrack < 31536000) timeToCrackStr = `${Math.round(secondsToCrack / 86400)} days`;
    else if (secondsToCrack < 31536000000) timeToCrackStr = `${Math.round(secondsToCrack / 31536000)} years`;
    else timeToCrackStr = 'Centuries / Trillions of Years';

    let nistScore = 'Weak (Non-Compliant)';
    let colorCls = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    let barWidth = Math.min(100, Math.max(10, (entropyBits / 128) * 100));

    if (entropyBits >= 128) {
      nistScore = 'Military Grade (NIST SP 800-63B High Assurance)';
      colorCls = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (entropyBits >= 80) {
      nistScore = 'Strong (NIST Compliant)';
      colorCls = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    } else if (entropyBits >= 50) {
      nistScore = 'Moderate (Basic Protection)';
      colorCls = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }

    // Common weak patterns
    const isWeakDictionary = /admin|password|123456|research|vault|secret/i.test(text);

    return {
      length,
      poolSize,
      entropyBits,
      timeToCrackStr,
      nistScore,
      colorCls,
      barWidth,
      isWeakDictionary,
    };
  }, [customInput, passphrase]);

  const generateHighEntropyKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 24; i++) {
      result += chars[array[i] % chars.length];
    }
    setCustomInput(result);
    if (onSelectPassphrase) onSelectPassphrase(result);
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Zero-Knowledge Key Entropy Calculator</h3>
        </div>
        <button
          type="button"
          onClick={generateHighEntropyKey}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Generate 128-Bit Key</span>
        </button>
      </div>

      <input
        type="text"
        value={customInput}
        onChange={(e) => {
          setCustomInput(e.target.value);
          if (onSelectPassphrase) onSelectPassphrase(e.target.value);
        }}
        placeholder="Enter passphrase to test mathematical entropy..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
      />

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Entropy Density: <strong className="text-white">{evaluation.entropyBits} bits</strong></span>
          <span className="text-slate-400">Target: <strong>128 bits (AES)</strong></span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full transition-all duration-300 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400"
            style={{ width: `${evaluation.barWidth}%` }}
          />
        </div>
      </div>

      {/* Grid metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <span className="text-slate-400 block text-[10px]">Length / Pool</span>
          <strong className="text-slate-200 font-mono">{evaluation.length} chars ({evaluation.poolSize} set)</strong>
        </div>

        <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <span className="text-slate-400 block text-[10px]">GPU Crack Time</span>
          <strong className="text-cyan-300 font-mono">{evaluation.timeToCrackStr}</strong>
        </div>

        <div className="col-span-2 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">NIST Assurance Grade</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${evaluation.colorCls}`}>
              {evaluation.nistScore}
            </span>
          </div>
          {evaluation.isWeakDictionary && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Common Pattern
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
