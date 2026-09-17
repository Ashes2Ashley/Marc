import React from 'react';
import {
  ShieldCheck,
  Database,
  Terminal,
  Lock,
  AlertTriangle,
  Activity,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Sparkles,
  Radio,
  FileText,
} from 'lucide-react';
import { RegistryRecord, ScraperConfig, ScraperLogEntry } from '../types';

interface DashboardOverviewProps {
  records: RegistryRecord[];
  scrapers: ScraperConfig[];
  logs: ScraperLogEntry[];
  isVaultLocked: boolean;
  onNavigate: (tab: 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel') => void;
  onRunScraperQuick: (scraperId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  records,
  scrapers,
  logs,
  isVaultLocked,
  onNavigate,
  onRunScraperQuick,
}) => {
  const encryptedCount = records.filter((r) => r.isEncrypted).length;
  const fcraCount = records.filter((r) => r.complianceStatus === 'FCRA Compliant').length;
  const jurisdictions = new Set(records.map((r) => r.jurisdiction)).size;

  return (
    <div className="space-y-6">
      {records.length === 0 && (
        <div className="ops-empty px-5 py-8 text-center">
          <p className="ops-kicker mb-2">Vault empty</p>
          <h3 className="text-sm font-medium text-slate-100">Start with a locked vault</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
            No sample registries are loaded. Unlock Encrypted Vault to import, or configure an official source in Scraper Studio.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => onNavigate('vault')} className="ops-btn-primary px-3 py-1.5 text-xs rounded-lg">
              Open vault
            </button>
            <button type="button" onClick={() => onNavigate('scrapers')} className="ops-btn-ghost px-3 py-1.5 text-xs rounded-lg">
              Scraper Studio
            </button>
          </div>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-300">FCRA & public safety data mandate (15 U.S.C. § 1681)</p>
          <p className="text-amber-200/80 leading-relaxed">
            Registry data is for legitimate research only. It shall not be used to deny housing, employment, credit, or insurance, or to harass registered individuals. Vault PII uses AES-256-GCM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vault records', value: records.length, sub: `${encryptedCount} encrypted`, icon: <Database className="w-4 h-4" />, tone: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Scrapers', value: scrapers.length, sub: 'Robots & throttle on', icon: <Terminal className="w-4 h-4" />, tone: 'text-cyan-400 bg-cyan-500/10' },
          { label: 'FCRA rate', value: records.length ? `${Math.round((fcraCount / records.length) * 100)}%` : '100%', sub: `${fcraCount} audited`, icon: <ShieldCheck className="w-4 h-4" />, tone: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Jurisdictions', value: jurisdictions, sub: isVaultLocked ? 'Vault locked' : 'Vault open', icon: <BarChart3 className="w-4 h-4" />, tone: 'text-purple-400 bg-purple-500/10' },
        ].map((card) => (
          <div key={card.label} className="ops-panel p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{card.label}</span>
              <div className={`p-2 rounded-lg ${card.tone}`}>{card.icon}</div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-white tabular-nums">{card.value}</div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="ops-panel p-4 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-white">Threat intel</h3>
              </div>
              <span className="ops-kicker px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300">Feed idle</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Analyst indicators only — nothing preloaded.</p>
            <button
              type="button"
              onClick={() => onNavigate('threat-intel')}
              className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs rounded-lg flex items-center justify-center gap-1.5"
            >
              Open feed <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="ops-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Pipelines
              </h3>
              <button type="button" onClick={() => onNavigate('scrapers')} className="text-xs text-indigo-400 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {scrapers.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No scrapers yet — add an official source.</p>
              ) : (
                scrapers.map((sc) => (
                  <div key={sc.id} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">{sc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{sc.targetUrl || 'No URL'}</div>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300">{sc.sourceType}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{sc.requestIntervalMs}ms</span>
                      <button
                        type="button"
                        onClick={() => onRunScraperQuick(sc.id)}
                        className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Run
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ops-panel p-4 space-y-2">
            <p className="ops-kicker mb-1">Control hub</p>
            {(
              [
                { tab: 'vault' as const, label: 'Encrypted vault', icon: <Database className="w-4 h-4 text-cyan-400" /> },
                { tab: 'analytics' as const, label: 'Analytics', icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
                { tab: 'compliance' as const, label: 'FCRA guidelines', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
              ] as const
            ).map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className="w-full text-left p-3 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-200"
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 ops-panel p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Audit terminal</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Live stream</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 h-80 overflow-y-auto space-y-2 border border-slate-800 flex-1">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic text-center py-12">No runs yet. Execute a scraper to populate the audit stream.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 border-b border-slate-900/60 pb-1.5">
                  <span className="text-slate-500 shrink-0">{log.timestamp.slice(11, 19)}</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      log.level === 'SUCCESS'
                        ? 'text-emerald-400'
                        : log.level === 'WARN'
                          ? 'text-amber-400'
                          : log.level === 'ERROR'
                            ? 'text-rose-400'
                            : 'text-cyan-400'
                    }`}
                  >
                    [{log.level}]
                  </span>
                  <span className="text-slate-400 shrink-0">[{log.scraperName.slice(0, 16)}]</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AES-256-GCM + SHA-256 PII hashes
            </span>
            <span>FCRA audit trail</span>
          </div>
        </div>
      </div>
    </div>
  );
};
