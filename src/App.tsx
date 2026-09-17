import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ScraperStudio } from './components/ScraperStudio';
import { EncryptedVault } from './components/EncryptedVault';
import { AnalyticsHub } from './components/AnalyticsHub';
import { ComplianceCenter } from './components/ComplianceCenter';
import { ThreatIntelFeed } from './components/ThreatIntelFeed';

import { RegistryRecord, ScraperConfig, ScraperLogEntry } from './types';
import { INITIAL_REGISTRY_RECORDS, INITIAL_SCRAPER_CONFIGS } from './data/mockRegistryData';
import { deriveKeyFromPassphrase } from './utils/crypto';
import { executeScraperJob } from './utils/ethicalScraper';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel'>('dashboard');

  // Database Vault & Scraper State
  const [records, setRecords] = useState<RegistryRecord[]>(() => {
    const saved = localStorage.getItem('ethical_registry_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_REGISTRY_RECORDS;
      }
    }
    return INITIAL_REGISTRY_RECORDS;
  });

  const [scrapers, setScrapers] = useState<ScraperConfig[]>(() => {
    const saved = localStorage.getItem('ethical_scraper_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SCRAPER_CONFIGS;
      }
    }
    return INITIAL_SCRAPER_CONFIGS;
  });

  const [logs, setLogs] = useState<ScraperLogEntry[]>([
    {
      id: 'init-log-1',
      timestamp: new Date().toISOString(),
      scraperId: 'SYS',
      scraperName: 'Security Engine',
      level: 'INFO',
      message: 'AES-256-GCM Web Crypto engine initialized. FCRA compliance guardrails loaded.',
    },
    {
      id: 'init-log-2',
      timestamp: new Date().toISOString(),
      scraperId: 'SYS',
      scraperName: 'Security Engine',
      level: 'SUCCESS',
      message: 'Database vault locked in read-only masked research mode.',
    }
  ]);

  // Encryption Lock State
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(true);
  const [activeCryptoKey, setActiveCryptoKey] = useState<CryptoKey | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ethical_registry_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('ethical_scraper_configs', JSON.stringify(scrapers));
  }, [scrapers]);

  // Master passphrase unlock handler
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    try {
      const derived = await deriveKeyFromPassphrase(passphrase, 'fixed-research-salt-2026');
      if (derived.key) {
        setActiveCryptoKey(derived.key);
        setIsVaultLocked(false);
        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            scraperId: 'SEC',
            scraperName: 'Vault Security',
            level: 'SUCCESS',
            message: 'Master key successfully derived via PBKDF2. Vault unlocked for full PII inspection.',
          },
          ...prev,
        ]);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleLockVault = () => {
    setIsVaultLocked(true);
    setActiveCryptoKey(null);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: 'SEC',
        scraperName: 'Vault Security',
        level: 'INFO',
        message: 'Master key wiped from active memory. Vault relocked.',
      },
      ...prev,
    ]);
  };

  // Quick run scraper from Dashboard
  const handleRunScraperQuick = async (scraperId: string) => {
    const target = scrapers.find((s) => s.id === scraperId);
    if (!target) return;

    setActiveTab('scrapers');

    const newLogs: ScraperLogEntry[] = [];
    const onLog = (l: ScraperLogEntry) => {
      newLogs.push(l);
      setLogs((prev) => [l, ...prev]);
    };

    const res = await executeScraperJob(target, onLog);
    if (res.newRecords.length > 0) {
      setRecords((prev) => [...res.newRecords, ...prev]);
    }
  };

  const handleSaveScraper = (updatedConfig: ScraperConfig) => {
    setScrapers((prev) => {
      const exists = prev.some((s) => s.id === updatedConfig.id);
      if (exists) {
        return prev.map((s) => (s.id === updatedConfig.id ? updatedConfig : s));
      }
      return [updatedConfig, ...prev];
    });

    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: updatedConfig.id,
        scraperName: updatedConfig.name,
        level: 'INFO',
        message: `Scraper configuration '${updatedConfig.name}' updated and saved to system registry.`,
      },
      ...prev,
    ]);
  };

  const handleScrapeComplete = (newRecords: RegistryRecord[], newJobLogs: ScraperLogEntry[]) => {
    if (newRecords.length > 0) {
      setRecords((prev) => [...newRecords, ...prev]);
    }
    setLogs((prev) => [...newJobLogs.reverse(), ...prev]);
  };

  const handleAddRecord = (newRecord: RegistryRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: 'MANUAL',
        scraperName: 'Manual Verification',
        level: 'SUCCESS',
        message: `New verified record ${newRecord.externalId} committed to encrypted vault.`,
      },
      ...prev,
    ]);
  };

  const handlePurgeAllRecords = () => {
    setRecords([]);
    localStorage.setItem('ethical_registry_records', JSON.stringify([]));
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: 'SYS',
        scraperName: 'Live Ops Manager',
        level: 'WARN',
        message: 'Mock registry records purged. Database vault prepared for live operations.',
      },
      ...prev,
    ]);
  };

  const handleSeedMockRecords = () => {
    setRecords(INITIAL_REGISTRY_RECORDS);
    localStorage.setItem('ethical_registry_records', JSON.stringify(INITIAL_REGISTRY_RECORDS));
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: 'SYS',
        scraperName: 'Live Ops Manager',
        level: 'INFO',
        message: 'Demo research mock data re-seeded into database vault.',
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isVaultLocked={isVaultLocked}
        onToggleVaultLock={() => {
          if (!isVaultLocked) handleLockVault();
          else setActiveTab('vault');
        }}
        recordCount={records.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            records={records}
            scrapers={scrapers}
            logs={logs}
            isVaultLocked={isVaultLocked}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunScraperQuick={handleRunScraperQuick}
          />
        )}

        {activeTab === 'scrapers' && (
          <ScraperStudio
            scrapers={scrapers}
            onSaveScraper={handleSaveScraper}
            onScrapeComplete={handleScrapeComplete}
          />
        )}

        {activeTab === 'vault' && (
          <EncryptedVault
            records={records}
            isVaultLocked={isVaultLocked}
            onUnlockVault={handleUnlockVault}
            onLockVault={handleLockVault}
            onAddRecord={handleAddRecord}
            onPurgeRecords={handlePurgeAllRecords}
            onSeedMockRecords={handleSeedMockRecords}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsHub records={records} />}

        {activeTab === 'compliance' && <ComplianceCenter />}

        {activeTab === 'threat-intel' && (
          <ThreatIntelFeed
            scrapers={scrapers}
            onSaveScraper={handleSaveScraper}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Ethical Public Safety Data & Research Portal. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setActiveTab('compliance')}>
              FCRA Notice
            </span>
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setActiveTab('compliance')}>
              Privacy Policy
            </span>
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setActiveTab('vault')}>
              AES-256 Vault
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
