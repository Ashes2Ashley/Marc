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

  const [records, setRecords] = useState<RegistryRecord[]>(() => {
    const liveFlag = localStorage.getItem('marc_live_ops_v1');
    if (!liveFlag) {
      localStorage.removeItem('ethical_registry_records');
      localStorage.setItem('marc_live_ops_v1', '1');
      return [];
    }
    const saved = localStorage.getItem('ethical_registry_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return INITIAL_REGISTRY_RECORDS;
  });

  const [scrapers, setScrapers] = useState<ScraperConfig[]>(() => {
    const saved = localStorage.getItem('ethical_scraper_configs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isLegacyMock = Array.isArray(parsed) && parsed.some((s: ScraperConfig) => String(s.id || '').startsWith('SCRAPER-'));
        if (isLegacyMock || !Array.isArray(parsed) || parsed.length === 0) {
          return INITIAL_SCRAPER_CONFIGS;
        }
        return parsed;
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
      scraperName: 'Live Ops',
      level: 'INFO',
      message: 'Demo records cleared. Vault is empty. Fetch a source or add a record.',
    },
  ]);

  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(true);
  const [activeCryptoKey, setActiveCryptoKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    localStorage.setItem('ethical_registry_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('ethical_scraper_configs', JSON.stringify(scrapers));
  }, [scrapers]);

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
            message: 'Vault unlocked.',
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
        message: 'Vault locked.',
      },
      ...prev,
    ]);
  };

  const handleRunScraperQuick = async (scraperId: string) => {
    const target = scrapers.find((s) => s.id === scraperId);
    if (!target) return;
    setActiveTab('scrapers');
    const onLog = (l: ScraperLogEntry) => setLogs((prev) => [l, ...prev]);
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
  };

  const handleScrapeComplete = (newRecords: RegistryRecord[], newJobLogs: ScraperLogEntry[]) => {
    if (newRecords.length > 0) {
      setRecords((prev) => [...newRecords, ...prev]);
    }
    setLogs((prev) => [...newJobLogs.reverse(), ...prev]);
  };

  const handleAddRecord = (newRecord: RegistryRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handlePurgeAllRecords = () => {
    setRecords([]);
    localStorage.setItem('ethical_registry_records', JSON.stringify([]));
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
          />
        )}

        {activeTab === 'analytics' && <AnalyticsHub records={records} />}

        {activeTab === 'compliance' && <ComplianceCenter />}

        {activeTab === 'threat-intel' && (
          <ThreatIntelFeed scrapers={scrapers} onSaveScraper={handleSaveScraper} />
        )}
      </main>
    </div>
  );
}
