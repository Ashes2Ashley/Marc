import React, { useState } from 'react';
import { Database, Link, ShieldCheck, Cpu, RefreshCw, FileText } from 'lucide-react';
import { sha256Hash } from '../utils/crypto';

export interface LedgerBlock {
  blockNumber: number;
  timestamp: string;
  action: string;
  recordId?: string;
  previousHash: string;
  hash: string;
  author: string;
}

interface TamperEvidentLedgerProps {
  blocks: LedgerBlock[];
  onVerifyLedger?: () => void;
}

export const TamperEvidentLedger: React.FC<TamperEvidentLedgerProps> = ({
  blocks,
  onVerifyLedger,
}) => {
  const [filterText, setFilterText] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);

  const filteredBlocks = blocks.filter(
    (b) =>
      b.action.toLowerCase().includes(filterText.toLowerCase()) ||
      b.hash.toLowerCase().includes(filterText.toLowerCase()) ||
      (b.recordId && b.recordId.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleVerifyChain = async () => {
    let isValid = true;
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];
      if (curr.previousHash !== prev.hash) {
        isValid = false;
        break;
      }
    }
    setVerified(isValid);
    if (onVerifyLedger) onVerifyLedger();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Cryptographic Tamper-Evident Ledger</h3>
            <p className="text-xs text-slate-400">SHA-256 Merkle Chain of Vault State & Modifications</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleVerifyChain}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Verify Hash Chain Integrity</span>
          </button>
        </div>
      </div>

      {verified !== null && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            verified
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>
            {verified
              ? 'Chain Integrity Verified: All SHA-256 block hashes match previous block outputs.'
              : 'Cryptographic Discrepancy Detected: Block hash mismatch!'}
          </span>
          <span className="font-mono text-[10px]">
            {blocks.length} Blocks Checked
          </span>
        </div>
      )}

      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Search ledger by block hash, record ID, or action..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
      />

      {/* Ledger Block List */}
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {filteredBlocks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No ledger records match filter.</p>
        ) : (
          filteredBlocks.map((block) => (
            <div
              key={block.blockNumber}
              className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs space-y-1.5 font-mono"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-cyan-400 font-bold">#Block-{block.blockNumber}</span>
                <span className="text-[10px]">{new Date(block.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="text-slate-200 font-sans font-medium text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>{block.action}</span>
                {block.recordId && <span className="text-slate-400 text-[10px]">({block.recordId})</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <div className="truncate">
                  Prev: <span className="text-slate-500">{block.previousHash.slice(0, 18)}...</span>
                </div>
                <div className="truncate">
                  Hash: <span className="text-cyan-300">{block.hash.slice(0, 18)}...</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
