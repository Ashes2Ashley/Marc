SIZE_CANARY_5K_START
import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Settings,
  Plus,
  CheckCircle2,
  FileCode,
  Shield,
  RotateCw,
  Sliders,
  Sparkles,
  Info,
  Globe,
  Radio,
  ExternalLink,
  Code2
} from 'lucide-react';
import { ScraperConfig, ScraperLogEntry, RegistryRecord, HttpTestResult } from '../types';
import { executeScraperJob, testHttpEndpoint } from '../utils/ethicalScraper';

interface ScraperStudioProps {
  scrapers: ScraperConfig[];
  onSaveScraper: (config: ScraperConfig) => void;
  onScrapeComplete: (newRecords: RegistryRecord[], logs: ScraperLogEntry[]) => void;
}

export const ScraperStudio: React.FC<ScraperStudioProps> = ({
  scrapers,
  onSaveScraper,
  onScrapeComplete,
}) => {
  const [selectedScraperId, setSelectedScraperId] = useState<string>(scrapers[0]?.id || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobLogs, setJobLogs] = useState<ScraperLogEntry[]>([]);

  // Live HTTP Probe State
  const [activeTabMode, setActiveTabMode] = useState<'pipelines' | 'liveProbe'>('pipelines');
  const [probeUrl, setProbeUrl] = useState<string>('https://api.nsopw.gov/v1/search/public-data');
  const [useProxy, setUseProxy] = useState<boolean>(false);
  const [proxyUrl, setProxyUrl] = useState<string>('https://cors-anywhere.herokuapp.com/');
  const [isTestingHttp, setIsTestingHttp] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<HttpTestResult | null>(null);

  const activeScraper = scrapers.find(s => s.id === selectedScraperId) || scrapers[0];

  // Form State for Editing/Creating Scraper Config
  const [formConfig, setFormConfig] = useState<ScraperConfig>(
    activeScraper || {
      id: `SCRAPER-${Date.now()}`,
      name: 'New official source',
      stateCode: 'US',
      targetUrl: '',
      sourceType: 'HTML_TABLE',
      requestIntervalMs: 2000,
      respectRobotsTxt: true,
      userAgent: 'PublicSafetyResearchBot/1.0 (+https://research-portal.org/bot-info)',
      selectors: {
        recordContainer: 'table.offender-list tr.data-row',
        fullName: 'td.name',
        phone: 'td.contact-phone',
        address: 'td.registered-address',
        jurisdiction: 'td.agency-jurisdiction',
        tier: 'td.tier-classification',
        offense: 'td.offense-summary',
        convictionYear: 'td.conviction-year',
      },
      ethicalGuardrails: {
        fcraAcknowledged: true,
        autoRedactPhone: true,
        autoRedactAddress: false,
        hashPiiIdentifiers: true,
        maxDepth: 2,
      },
      status: 'Idle',
    }
  );

  const handleSelectScraper = (id: string) => {
    setSelectedScraperId(id);
    const found = scrapers.find(s => s.id === id);
    if (found) {
      setFormConfig(found);
      setIsEditing(false);
    }
  };

  // SIZE_CANARY_5K_END - truncated intentionally for payload test
  return (
    <div className="space-y-6 ops-panel p-6">
      <h2 className="text-base font-bold text-white">Adaptable Scraper Studio (size canary)</h2>
      <p className="text-xs text-slate-400">Payload test file — will be replaced with full restore.</p>
      <button className="ops-btn-primary text-xs">New official source</button>
    </div>
  );
};
