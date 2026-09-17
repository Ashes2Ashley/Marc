import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ScraperStudio } from './components/ScraperStudio';
import { EncryptedVault } from './components/EncryptedVault';
import { AnalyticsHub } from './components/AnalyticsHub';
import { ComplianceCenter } from './components/ComplianceCenter';
import { ThreatIntelFeed } from './components/ThreatIntelFeed';
import { CommandPalette } from './components/CommandPalette';
import { LiveOpsBar } from './components/LiveOpsBar';
import { MoreOpsPanel } from './components/MoreOpsPanel';
import { HardenedBar } from './components/HardenedBar';
import { RegistryRecord, ScraperConfig, ScraperLogEntry } from './types';
import { INITIAL_REGISTRY_RECORDS, INITIAL_SCRAPER_CONFIGS } from './data/mockRegistryData';
import { deriveKeyFromPassphrase } from './utils/crypto';
import { executeScraperJob, probeWorkerHealth } from './utils/ethicalScraper';
import { isUnlockLocked, recordUnlockFail, recordUnlockOk, lockRemainingMs, readFails, secureWipe, sealVault, verifyVaultSeal, readAudit } from './utils/hardening';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel'>('dashboard');
  const [records, setRecords] = useState<RegistryRecord[]>(() => {
    const liveFlag = localStorage.getItem('marc_live_ops_v1');
    if (!liveFlag) { localStorage.removeItem('ethical_registry_records'); localStorage.setItem('marc_live_ops_v1', '1'); return []; }
    const saved = localStorage.getItem('ethical_registry_records');
    if (saved) { try { const parsed = JSON.parse(saved); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
    return INITIAL_REGISTRY_RECORDS;
  });
  const [scrapers, setScrapers] = useState<ScraperConfig[]>(() => {
    const saved = localStorage.getItem('ethical_scraper_configs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isLegacyMock = Array.isArray(parsed) && parsed.some((s: ScraperConfig) => String(s.id || '').startsWith('SCRAPER-'));
        if (isLegacyMock || !Array.isArray(parsed) || parsed.length === 0) return INITIAL_SCRAPER_CONFIGS;
        return parsed;
      } catch { return INITIAL_SCRAPER_CONFIGS; }
    }
    return INITIAL_SCRAPER_CONFIGS;
  });
  const [logs, setLogs] = useState<ScraperLogEntry[]>([{ id: 'init-log-1', timestamp: new Date().toISOString(), scraperId: 'SYS', scraperName: 'Live Ops', level: 'INFO', message: 'Hardened live workspace.' }]);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [activeCryptoKey, setActiveCryptoKey] = useState<CryptoKey | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [workerOk, setWorkerOk] = useState<boolean | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);
  const [lastFetchStatus, setLastFetchStatus] = useState('');
  const [retentionDays, setRetentionDays] = useState(0);
  const [runs, setRuns] = useState<{ at: string; label: string; rows: number }[]>([]);
  const [lockedOut, setLockedOut] = useState(isUnlockLocked());
  const [lockMs, setLockMs] = useState(lockRemainingMs());
  const [fails, setFails] = useState(readFails());
  const [sealOk, setSealOk] = useState<boolean | null>(null);
  const [auditCount, setAuditCount] = useState(readAudit().length);
  const idleLockMin = 10;

  useEffect(() => { localStorage.setItem('ethical_registry_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('ethical_scraper_configs', JSON.stringify(scrapers)); }, [scrapers]);
  useEffect(() => { probeWorkerHealth().then(setWorkerOk); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    let timer: number;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { setIsVaultLocked(true); setActiveCryptoKey(null); }, idleLockMin * 60 * 1000);
    };
    ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, bump));
    bump();
    return () => { window.clearTimeout(timer); ['pointerdown', 'keydown'].forEach((ev) => window.removeEventListener(ev, bump)); };
  }, []);

  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    if (isUnlockLocked()) { setLockedOut(true); setLockMs(lockRemainingMs()); return false; }
    try {
      const derived = await deriveKeyFromPassphrase(passphrase, 'fixed-research-salt-2026');
      if (derived.key) {
        recordUnlockOk(); setFails(0); setLockedOut(false); setActiveCryptoKey(derived.key); setIsVaultLocked(false); setAuditCount(readAudit().length); return true;
      }
      const fail = recordUnlockFail(); setFails(fail.fails); setLockedOut(fail.locked); setLockMs(fail.remainingMs); setAuditCount(readAudit().length); return false;
    } catch {
      const fail = recordUnlockFail(); setFails(fail.fails); setLockedOut(fail.locked); setLockMs(fail.remainingMs); setAuditCount(readAudit().length); return false;
    }
  };
  const handleLockVault = () => { setIsVaultLocked(true); setActiveCryptoKey(null); };
  const stampRun = (label: string, rows: number) => {
    const at = new Date().toISOString();
    setLastFetchAt(at); setLastFetchStatus(rows ? `${rows} rows` : '0 rows');
    setRuns((prev) => [{ at, label, rows }, ...prev].slice(0, 20));
  };
  const handleRunScraperQuick = async (scraperId: string) => {
    const target = scrapers.find((s) => s.id === scraperId);
    if (!target) return;
    setActiveTab('scrapers');
    const res = await executeScraperJob(target, (l) => setLogs((prev) => [l, ...prev]));
    stampRun(target.name, res.newRecords.length);
    if (res.newRecords.length > 0) setRecords((prev) => [...res.newRecords, ...prev]);
  };
  const handleDedup = () => {
    setRecords((prev) => { const seen = new Set<string>(); return prev.filter((r) => { const key = r.piiHash || r.id; if (seen.has(key)) return false; seen.add(key); return true; }); });
  };
  const handleChecksum = async () => {
    const payload = JSON.stringify(records.map((r) => r.piiHash).sort());
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    await navigator.clipboard.writeText(hex);
  };
  const handleSaveScraper = (updatedConfig: ScraperConfig) => {
    setScrapers((prev) => prev.some((s) => s.id === updatedConfig.id) ? prev.map((s) => (s.id === updatedConfig.id ? updatedConfig : s)) : [updatedConfig, ...prev]);
  };
  const handleScrapeComplete = (newRecords: RegistryRecord[], newJobLogs: ScraperLogEntry[]) => {
    if (newRecords.length > 0) setRecords((prev) => [...newRecords, ...prev]);
    stampRun('Source job', newRecords.length);
    setLogs((prev) => [...newJobLogs.reverse(), ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isVaultLocked={isVaultLocked} onToggleVaultLock={() => { if (!isVaultLocked) handleLockVault(); else setActiveTab('vault'); }} recordCount={records.length} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onGo={setActiveTab} onDedup={handleDedup} onChecksum={handleChecksum} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HardenedBar lockedOut={lockedOut} remainingMs={lockMs} fails={fails} sealOk={sealOk} auditCount={auditCount}
          onWipe={() => { secureWipe(); setRecords([]); setScrapers(INITIAL_SCRAPER_CONFIGS); setAuditCount(readAudit().length); setIsVaultLocked(true); setActiveCryptoKey(null); }}
          onSeal={async () => { await sealVault(records.map((r) => r.piiHash)); setSealOk(true); setAuditCount(readAudit().length); }}
          onVerify={async () => { setSealOk(await verifyVaultSeal(records.map((r) => r.piiHash))); setAuditCount(readAudit().length); }} />
        <LiveOpsBar workerOk={workerOk} workerHost={(import.meta as any).env?.VITE_WORKER_URL || '/api'} lastFetchAt={lastFetchAt} lastFetchStatus={lastFetchStatus} recordCount={records.length} uniqueHashes={new Set(records.map((r) => r.piiHash)).size} retentionDays={retentionDays} onRetention={setRetentionDays} onDedup={handleDedup} onChecksum={handleChecksum} idleLockMin={idleLockMin} />
        <MoreOpsPanel records={records} scrapers={scrapers} runs={runs} onPasteRows={(rows) => setRecords((prev) => [...rows, ...prev])} onAddSource={(src) => {
          const cfg: ScraperConfig = {
            id: `SRC-${src.code}`, name: src.name, stateCode: src.code, targetUrl: src.url, sourceType: 'HTML_TABLE',
            requestIntervalMs: 4000, respectRobotsTxt: true, userAgent: 'MarcLiveResearch/1.0',
            selectors: { recordContainer: 'table tr', fullName: 'td', phone: 'td', address: 'td', jurisdiction: 'td', tier: 'td', offense: 'td', convictionYear: 'td' },
            ethicalGuardrails: { fcraAcknowledged: true, autoRedactPhone: true, autoRedactAddress: true, hashPiiIdentifiers: true, maxDepth: 1 },
            status: 'Idle',
          };
          setScrapers((prev) => (prev.some((s) => s.id === cfg.id) ? prev : [cfg, ...prev]));
          setActiveTab('scrapers');
        }} />
        {activeTab === 'dashboard' && <DashboardOverview records={records} scrapers={scrapers} logs={logs} isVaultLocked={isVaultLocked} onNavigate={(tab) => setActiveTab(tab)} onRunScraperQuick={handleRunScraperQuick} />}
        {activeTab === 'scrapers' && <ScraperStudio scrapers={scrapers} onSaveScraper={handleSaveScraper} onScrapeComplete={handleScrapeComplete} />}
        {activeTab === 'vault' && <EncryptedVault records={records} isVaultLocked={isVaultLocked} onUnlockVault={handleUnlockVault} onLockVault={handleLockVault} onAddRecord={(r) => setRecords((prev) => [r, ...prev])} onPurgeRecords={() => setRecords([])} />}
        {activeTab === 'analytics' && <AnalyticsHub records={records} />}
        {activeTab === 'compliance' && <ComplianceCenter />}
        {activeTab === 'threat-intel' && <ThreatIntelFeed scrapers={scrapers} onSaveScraper={handleSaveScraper} />}
      </main>
    </div>
  );
}
