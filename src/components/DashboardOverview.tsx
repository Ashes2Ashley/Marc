import React from 'react';
import {
  ShieldCheck,
  Database,
  Terminal,
  Lock,
  AlertTriangle,
  Activity,
  CheckCircle2,
  BarChart,
  ArrowRight,
  Sparkles,
  Radio,
  FileText
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
  const encryptedCount = records.filter(r => r.isEncrypted).length;
  const fcraCompliantCount = records.filter(r => r.complianceStatus === 'FCRA Compliant').length;
  const totalJurisdictions = new Set(records.map(r => r.jurisdiction)).size;

  return (
    <div className="space-y-6">
      {/* Mandatory FCRA Research Legal Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-300">
            FCRA & Public Safety Data Legal Mandate (15 U.S.C. § 1681 et seq.)
          </p>
          <p className="text-amber-200/80 leading-relaxed">
            Data harvested from public sex offender registries is maintained strictly for legitimate academic, legal, and public safety research. Under federal law, registry information <strong>SHALL NOT</strong> be used to deny housing, employment, credit, or insurance, or to harass, intimidate, or stalk registered individuals. All stored PII is encrypted with AES-256-GCM.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Encrypted Records */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Vault Records</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{records.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{encryptedCount} AES-256 Encrypted</span>
            </div>
          </div>
        </div>

        {/* Ethical Scraper Pipelines */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Adaptable Scrapers</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{scrapers.length} Configured</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>Robots.txt & Throttling Enforced</span>
            </div>
          </div>
        </div>

        {/* FCRA Compliance Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">FCRA Compliance Rate</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {records.length > 0 ? `${Math.round((fcraCompliantCount / records.length) * 100)}%` : '100%'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{fcraCompliantCount} Fully Audited</span>
            </div>
          </div>
        </div>

        {/* Covered Jurisdictions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Jurisdictions Mapped</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <BarChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{totalJurisdictions} Agencies</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <Activity className="w-3 h-3 text-purple-400" />
              <span>State & County Public Feeds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Quick Scraper Launch + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Pipeline Presets */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Threat Intelligence Card */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 shadow-lg bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <h3 className="text-xs font-semibold text-white">Threat Intel Feed</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                4 Active IOCs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Real-time IoCs, registry bypass trends, and auto-tuning scraper mitigations.
            </p>
            <button
              onClick={() => onNavigate('threat-intel')}
              className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Threat Feed & Auto-Tune</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Configured Scraper Pipelines
              </h3>
              <button
                onClick={() => onNavigate('scrapers')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {scrapers.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-200">{sc.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                        {sc.targetUrl}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {sc.sourceType}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Delay: {sc.requestIntervalMs}ms</span>
                    <button
                      onClick={() => onRunScraperQuick(sc.id)}
                      className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Execute Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Navigation Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Research Control Hub
            </h3>

            <button
              onClick={() => onNavigate('vault')}
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between transition-colors text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Explore Encrypted DB Vault</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between transition-colors text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4 text-purple-400" />
                <span>Advanced Regional Analytics</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigate('compliance')}
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between transition-colors text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>FCRA & Privacy Guidelines</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Audit Log Console */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Scraper Execution & Audit Terminal Log</h3>
              </div>
              <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-300 font-mono rounded">
                Live Audit Stream
              </span>
            </div>

            <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 h-80 overflow-y-auto space-y-2 border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-12">
                  No execution logs recorded yet. Run a scraper pipeline to inspect live extraction events.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed border-b border-slate-900/60 pb-1.5">
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
                    <span className="text-slate-400 shrink-0">[{log.scraperName.slice(0, 18)}...]</span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Security Engine: <strong>AES-256-GCM + SHA-256 PII Hashes</strong></span>
            <span>FCRA Audit Trail Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
