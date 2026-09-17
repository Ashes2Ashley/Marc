import React, { useState } from 'react';
import { BookOpen, Download, FileText, CheckCircle2 } from 'lucide-react';

interface PlaybookGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaybookGeneratorModal: React.FC<PlaybookGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleDownloadSop = () => {
    const text = `# FCRA Public Safety Research Incident Response SOP (2026)

## 1. Scope & Objective
Standard Operating Procedures for handling state registry anti-bot challenges, rate limits, and DOM schema mutations while ensuring 100% FCRA Rule 2026 compliance.

## 2. Immediate Remediation Protocols
- **HTTP 429 Rate Limit Trigger**: Pause scraper immediately. Increment requestIntervalMs to minimum 3000ms. Enable full jitter backoff.
- **WAF / CAPTCHA Challenge**: Rotate Ethical User-Agent header with embedded researcher contact string. Switch to secondary CORS proxy node.
- **DOM Selector Mutation**: Execute DOM Mutation Tester to inspect shadow tree changes. Fallback to structural XPath text node traversal.
- **PII Leak Mitigation**: Verify zero-knowledge AES-256-GCM master key lock state. Execute Memory Shredder if unmasked PII buffer is flagged.

## 3. Compliance Verification
- Generate FCRA Rule 2026 Audit Certificate before publishing research datasets.
- Verify SHA-256 Merkle ledger block chain continuity.
`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FCRA-Incident-Playbook-SOP.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center gap-3 text-amber-400">
          <BookOpen className="w-6 h-6" />
          <div>
            <h3 className="text-base font-bold text-white">Incident Playbook & Remediation SOP</h3>
            <p className="text-xs text-slate-400">Standard Operating Procedures for Field Research Disruptions</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300 font-mono">
          <p className="font-bold text-amber-300">SOP-2026-REG-01: Anti-Bot & WAF Challenge Response</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>Step 1: Auto-pause scraper jobs via Circuit Breaker</li>
            <li>Step 2: Inject 25% full jitter to request interval</li>
            <li>Step 3: Rotate User-Agent fingerprint header</li>
            <li>Step 4: Verify FCRA PII Masking & Cryptographic Watermark</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
            Close
          </button>
          <button onClick={handleDownloadSop} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold">
            <Download className="w-4 h-4" />
            <span>Download SOP (.md)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
