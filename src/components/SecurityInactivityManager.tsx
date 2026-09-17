import React, { useState, useEffect } from 'react';
import { Timer, Lock, ShieldCheck, Pause, Play, AlertOctagon } from 'lucide-react';
import { hapticAudio } from '../utils/hapticsAndAudio';

interface SecurityInactivityManagerProps {
  isVaultLocked: boolean;
  onAutoLock: () => void;
}

export const SecurityInactivityManager: React.FC<SecurityInactivityManagerProps> = ({
  isVaultLocked,
  onAutoLock,
}) => {
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(5);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Reset timer on user activity
  useEffect(() => {
    if (isVaultLocked) return;

    const resetTimer = () => {
      setSecondsRemaining(timeoutMinutes * 60);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [isVaultLocked, timeoutMinutes]);

  // Countdown timer interval
  useEffect(() => {
    if (isVaultLocked || isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          hapticAudio.triggerLockSound();
          onAutoLock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVaultLocked, isPaused, onAutoLock]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isVaultLocked) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300">
      <Timer className={`w-4 h-4 ${secondsRemaining < 30 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
      <span>Auto-Lock: <strong className="font-mono text-white">{formatSeconds(secondsRemaining)}</strong></span>

      <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-2">
        <select
          value={timeoutMinutes}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setTimeoutMinutes(val);
            setSecondsRemaining(val * 60);
          }}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
        >
          <option value={1}>1 min</option>
          <option value={5}>5 min</option>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
        </select>

        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          title={isPaused ? 'Resume countdown' : 'Pause timer'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
