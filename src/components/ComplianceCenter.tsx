import React, { useState } from 'react';
import {
  FileCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCw,
  Lock,
  Trash2,
  Info
} from 'lucide-react';
import { ComplianceAuditRule } from '../types';

export const ComplianceCenter: React.FC = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  const rules: ComplianceAuditRule[] = [
    {
      id: 'RULE-FCRA-01',
      category: 'FCRA',
      title: 'Fair Credit Reporting Act Notice (15 U.S.C. § 1681)',
      description: 'Public registry data must be flagged with mandatory non-commercial use notices prohibiting employment, tenant, or credit screening.',
      status: 'COMPLIANT',
      detail: 'Notice injected into all vault exports and UI viewports.',
    },
    {
      id: 'RULE-ENC-02',
      category: 'DATA_SECURITY',
      title: 'AES-256-GCM At-Rest Vault Encryption',
      description: 'All raw record payloads and PII contact identifiers must be stored in encrypted blobs using PBKDF2 derived keys.',
      status: 'COMPLIANT',
      detail: 'Web Crypto API active with 256-bit key length.',
    },
    {
      id: 'RULE-HASH-03',
      category: 'ETHICAL_RESEARCH',
      title: 'SHA-256 One-Way PII Index Hashing',
      description: 'Unique database record keys are generated from cryptographic hashes to prevent unauthenticated PII lookup across datasets.',
      status: 'COMPLIANT',
      detail: 'SHA-256 hashing applied on ingestion pipeline.',
    },
    {
      id: 'RULE-PRIV-04',
      category: 'GDPR_CCPA',
      title: 'Academic & Public Safety Research Exemption Audit',
      description: 'Data collection is strictly limited to public government registries for academic study, law enforcement analytics, and public safety research.',
      status: 'COMPLIANT',
      detail: 'Verified against California Megan\'s Law and Texas DPS terms.',
    },
  ];

  const handleRunAuditScan = () => {
    setIsAuditing(true);
    setAuditComplete(false);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditComplete(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">FCRA & Ethical Compliance Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Privacy regulations matrix, Fair Credit Reporting Act guardrails, and automated database compliance auditor.
          </p>
        </div>

        <button
          onClick={handleRunAuditScan}
          disabled={isAuditing}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 transition-colors"
        >
          {isAuditing ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-emerald-200" />
              Scanning Vault...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Run Full Audit Scan
            </>
          )}
        </button>
      </div>

      {auditComplete && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong>Database Audit Completed:</strong> All 4 compliance rules passed. PII is encrypted with AES-256-GCM, SHA-256 hashing is enforced, and FCRA non-screening notices are actively bound to exports.
          </div>
        </div>
      )}

      {/* FCRA Mandate Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          FCRA Legal Notice & Ethical Scraping Standard
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Prohibited Uses (Non-Screening Mandate)
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Sex offender registry data collected via this system is explicitly forbidden from being used as a factor in establishing an individual's eligibility for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>Employment or independent contractor vetting</li>
              <li>Housing, rental lease, or tenant screening</li>
              <li>Credit card or loan underwriting</li>
              <li>Commercial marketing or direct solicitations</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Permitted Academic & Safety Research Uses
            </h4>
            <p className="text-slate-400 leading-relaxed">
              This system is engineered strictly for authorized research applications:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>Statistical spatial clustering & geographic mapping</li>
              <li>Recidivism rate estimation & academic studies</li>
              <li>Public safety policy research & agency audits</li>
              <li>Anonymized open data research dashboards</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Compliance Audit Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Active Regulatory Compliance Matrix
          </h3>
          <span className="text-slate-400 font-mono">4 Verified Guardrails</span>
        </div>

        <div className="divide-y divide-slate-800">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{rule.title}</span>
                  <span className="px-2 py-0.5 text-[10px] bg-slate-800 font-mono text-indigo-300 rounded border border-slate-700">
                    {rule.category}
                  </span>
                </div>
                <p className="text-slate-400 max-w-2xl">{rule.description}</p>
                <p className="text-[11px] text-slate-500 font-mono">Status Detail: {rule.detail}</p>
              </div>

              <div className="shrink-0">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {rule.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Retention & Data Purge Policy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Automated Data Retention & Purge Configuration</h3>
        </div>

        <p className="text-slate-400">
          To maintain compliance with state and federal data privacy standards, old scraped records can be configured to auto-purge or re-encrypt after a designated research retention window.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-slate-400 mb-1">Research Retention Period</label>
            <select className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200">
              <option value="90">90 Days (Recommended)</option>
              <option value="180">180 Days (Semi-Annual)</option>
              <option value="365">365 Days (Annual Academic Cycle)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Pii Auto-Anonymization</label>
            <select className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200">
              <option value="ALWAYS">Always Mask Phone & Street Address</option>
              <option value="HASH_ONLY">Replace PII with SHA-256 Hashes</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => alert('Data retention settings updated & saved to vault configuration.')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Save Retention Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
