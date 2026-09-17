import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StixParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStix: (threatCount: number) => void;
}

export const StixParserModal: React.FC<StixParserModalProps> = ({
  isOpen,
  onClose,
  onImportStix,
}) => {
  const [stixJson, setStixJson] = useState(`{
  "type": "bundle",
  "id": "bundle--e4d81741-2026-4fa2-9b0c",
  "objects": [
    {
      "type": "indicator",
      "id": "indicator--8e2e2d09-2026-4db0-9f0a",
      "pattern": "[ipv4-addr:value = '198.51.100.42']",
      "labels": ["rate-limit-bypass", "registry-scraper-ip"]
    }
  ]
}`);
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const handleParse = () => {
    try {
      const parsed = JSON.parse(stixJson);
      const objects = parsed.objects || [];
      setStatus(`Successfully parsed ${objects.length} STIX 2.1 threat objects!`);
      onImportStix(objects.length);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setStatus('Invalid STIX 2.1 JSON bundle format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center gap-3 text-indigo-400">
          <Upload className="w-6 h-6" />
          <div>
            <h3 className="text-base font-bold text-white">STIX 2.1 Threat Bundle Importer</h3>
            <p className="text-xs text-slate-400">Import structured Cyber Threat Intelligence IoCs</p>
          </div>
        </div>

        <textarea
          rows={6}
          value={stixJson}
          onChange={(e) => setStixJson(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        />

        {status && <p className="text-xs text-emerald-400 font-semibold">{status}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
          >
            Import STIX Bundle
          </button>
        </div>
      </div>
    </div>
  );
};
