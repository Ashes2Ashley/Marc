import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { hapticAudio } from '../utils/hapticsAndAudio';

interface DuressSanitizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSanitizeVault: () => void;
}

export const DuressSanitizerModal: React.FC<DuressSanitizerModalProps> = ({
  isOpen,
  onClose,
  onSanitizeVault,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [sanitized, setSanitized] = useState(false);

  if (!isOpen) return null;

  const handleExecuteDuress = () => {
    if (pin !== '9999' && pin !== '0000') {
      setError('Invalid panic/duress protocol PIN. (Try demo PIN: 9999)');
      hapticAudio.triggerAlertSound();
      return;
    }

    setIsSanitizing(true);
    hapticAudio.vibrate([100, 100, 100, 100]);

    setTimeout(() => {
      onSanitizeVault();
      setIsSanitizing(false);
      setSanitized(true);
      setTimeout(() => {
        setSanitized(false);
        setPin('');
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Emergency Duress & Memory Shredder</h3>
            <p className="text-xs text-slate-400">Zeroize decrypted PII state in browser RAM</p>
          </div>
        </div>

        {sanitized ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-300">Vault Memory Zeroized</h4>
            <p className="text-xs text-slate-300">All plaintext PII fields shredded and reset to cryptographically masked state.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-300 leading-relaxed">
              Entering the Duress Panic Code (Default: <code className="text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded font-mono">9999</code>) will instantly overwrite memory buffers containing decrypted PII with random bytes, flush localStorage session keys, and lock the system into decoy read-only state.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Panic Protocol PIN</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter 4-digit duress PIN"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono text-lg text-white tracking-widest focus:outline-none focus:border-rose-500"
              />
              {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSanitizing || pin.length < 4}
                onClick={handleExecuteDuress}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSanitizing ? 'Shredding RAM...' : 'Execute Memory Shred'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
