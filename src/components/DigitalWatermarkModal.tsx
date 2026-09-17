import React, { useState } from 'react';
import { Fingerprint, Download, CheckCircle2, ShieldCheck, Copy } from 'lucide-react';
import { sha256Hash } from '../utils/crypto';

interface DigitalWatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWatermark: (tag: string) => void;
}

export const DigitalWatermarkModal: React.FC<DigitalWatermarkModalProps> = ({
  isOpen,
  onClose,
  onApplyWatermark,
}) => {
  const [researcherId, setResearcherId] = useState('RES-AUDIT-2026-9081');
  const [purpose, setPurpose] = useState('Academic FCRA Public Safety Impact Study');
  const [watermarkTag, setWatermarkTag] = useState('');

  if (!isOpen) return null;

  const handleGenerateTag = async () => {
    const raw = `${researcherId}|${purpose}|${Date.now()}|NONCE-${Math.random().toString(36).slice(2, 8)}`;
    const hash = await sha256Hash(raw);
    const tag = `[FCRA-STENO-TAG: 0x${hash.slice(0, 16).toUpperCase()}]`;
    setWatermarkTag(tag);
    onApplyWatermark(tag);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center gap-3 text-cyan-400">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Fingerprint className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Digital Watermarking & Steganography</h3>
            <p className="text-xs text-slate-400">Embed traceable session metadata in data exports</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Researcher ID Tag</label>
            <input
              type="text"
              value={researcherId}
              onChange={(e) => setResearcherId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Export Purpose Justification</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {watermarkTag && (
            <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block">Generated Steganographic Header</span>
              <p className="font-mono text-cyan-300 text-xs font-bold break-all">{watermarkTag}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleGenerateTag}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold transition-all"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Generate & Embed Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
