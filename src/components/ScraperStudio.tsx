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

  const handleRunCurrentJob = async () => {
    if (!activeScraper) return;
    setIsRunning(true);
    setProgress(5);
    setJobLogs([]);

    const newLogs: ScraperLogEntry[] = [];

    const onLog = (log: ScraperLogEntry) => {
      newLogs.push(log);
      setJobLogs([...newLogs]);
    };

    try {
      const result = await executeScraperJob(activeScraper, onLog, (p) => setProgress(p));
      onScrapeComplete(result.newRecords, newLogs);
    } catch (err) {
      onLog({
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: activeScraper.id,
        scraperName: activeScraper.name,
        level: 'ERROR',
        message: `Scraper execution failed: ${String(err)}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestEndpoint = async () => {
    if (!probeUrl) return;
    setIsTestingHttp(true);
    setTestResult(null);

    const res = await testHttpEndpoint(probeUrl, useProxy ? proxyUrl : undefined);
    setTestResult(res);
    setIsTestingHttp(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveScraper(formConfig);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Adaptable Scraper Studio</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Engine v2.5 ({scrapers.length} State Pipelines)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure target DOM selectors, REST APIs, live HTTP fetch probes, and FCRA ethical guardrails across multi-state portals.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTabMode('pipelines')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTabMode === 'pipelines' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              State Pipelines ({scrapers.length})
            </button>
            <button
              onClick={() => setActiveTabMode('liveProbe')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                activeTabMode === 'liveProbe' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Live Endpoint Tester
            </button>
          </div>

          <button
            onClick={() => {
              const newScraper: ScraperConfig = {
                id: `SCRAPER-${Date.now()}`,
                name: 'New official source',
                stateCode: 'US',
                targetUrl: '',
                sourceType: 'HTML_TABLE',
                requestIntervalMs: 3000,
                respectRobotsTxt: true,
                userAgent: 'PublicSafetyResearchBot/1.0 (+https://research.org/bot)',
                selectors: {
                  recordContainer: 'table.records tr',
                  fullName: 'td.name',
                  phone: 'td.phone',
                  address: 'td.address',
                  jurisdiction: 'td.jurisdiction',
                  tier: 'td.tier',
                  offense: 'td.offense',
                  convictionYear: 'td.year',
                },
                ethicalGuardrails: {
                  fcraAcknowledged: true,
                  autoRedactPhone: true,
                  autoRedactAddress: false,
                  hashPiiIdentifiers: true,
                  maxDepth: 1,
                },
                status: 'Idle',
              };
              setFormConfig(newScraper);
              setIsEditing(true);
              setActiveTabMode('pipelines');
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            New official source
          </button>

          <button
            onClick={handleRunCurrentJob}
            disabled={isRunning || !activeScraper}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-lg flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-indigo-600/50 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-indigo-200" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                Run Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {activeTabMode === 'liveProbe' ? (
        /* Live HTTP Probe Tool */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Live Endpoint Tester & HTTP Inspect</h3>
                <p className="text-slate-400">Test direct client fetch requests against live web URLs or APIs to inspect headers, CORS response status, and raw response payloads.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Endpoint URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={probeUrl}
                  onChange={(e) => setProbeUrl(e.target.value)}
                  placeholder="Official public search / registry URL"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleTestEndpoint}
                  disabled={isTestingHttp}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isTestingHttp ? <RotateCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {isTestingHttp ? 'Querying...' : 'Execute HTTP GET'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                />
                <span>Route request through CORS Proxy (for third-party sites without Access-Control headers)</span>
              </label>
            </div>

            {useProxy && (
              <div>
                <label className="block text-slate-400 mb-1">CORS Proxy Prefix</label>
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-300 font-mono text-[11px]"
                />
              </div>
            )}
          </div>

          {/* Test Output Panel */}
          {testResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 font-mono text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      testResult.status === 200
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    HTTP {testResult.status || 'ERR'} {testResult.statusText}
                  </span>
                  <span className="text-slate-400 text-[11px]">{testResult.byteSize} Bytes</span>
                  <span className="text-slate-500 text-[11px]">{testResult.contentType}</span>
                </div>

                {testResult.corsBlocked && (
                  <span className="text-amber-400 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    CORS Restricted
                  </span>
                )}
              </div>

              {/* Headers Table */}
              {Object.keys(testResult.headers).length > 0 && (
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase mb-1">Response Headers</span>
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[10px] space-y-1 max-h-28 overflow-y-auto">
                    {Object.entries(testResult.headers).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-cyan-400">{k}:</span>
                        <span className="text-slate-300 truncate max-w-md">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Preview */}
              <div>
                <span className="text-slate-500 text-[10px] block uppercase mb-1">Raw Payload Response Preview</span>
                <pre className="bg-slate-900/90 p-3 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                  {testResult.rawBody}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Main Grid: Pipeline List & Configuration Details */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Config Selector List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Active State Scrapers ({scrapers.length})
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {scrapers.map((sc) => {
                const isSelected = sc.id === activeScraper?.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => handleSelectScraper(sc.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {sc.stateCode}
                          </span>
                          <h4 className="text-xs font-bold text-slate-100">{sc.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-[200px]">
                          {sc.targetUrl}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {sc.sourceType}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        Throttle: {sc.requestIntervalMs}ms
                      </span>
                      <span className="text-slate-500 font-mono">
                        {sc.ethicalGuardrails.autoRedactPhone ? 'Phone Redacted' : 'Raw Phone'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Adaptable Selector Builder or Execution View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar during Execution */}
            {isRunning && (
              <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-4 space-y-2 shadow-xl animate-pulse">
                <div className="flex justify-between text-xs font-semibold text-indigo-300">
                  <span>Executing Pipeline: {activeScraper?.name}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Form / Configuration Editor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    {isEditing ? 'Edit Scraper Parameters' : 'Pipeline Specifications'}
                  </h3>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => {
                      if (activeScraper) setFormConfig(activeScraper);
                      setIsEditing(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    Edit Selectors & Rules
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                  {/* Basic Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-medium mb-1">Source name</label>
                      <input
                        type="text"
                        value={formConfig.name}
                        onChange={(e) => setFormConfig({ ...formConfig, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">State Code</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formConfig.stateCode}
                        onChange={(e) => setFormConfig({ ...formConfig, stateCode: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500 uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Target Endpoint / URL</label>
                      <input
                        type="url"
                        value={formConfig.targetUrl}
                        onChange={(e) => setFormConfig({ ...formConfig, targetUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Data Source Format</label>
                      <select
                        value={formConfig.sourceType}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            sourceType: e.target.value as any,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="HTML_TABLE">HTML Table Parsing</option>
                        <option value="JSON_API">JSON REST API Endpoint</option>
                        <option value="XML_FEED">XML / RSS Public Feed</option>
                        <option value="CUSTOM_DOM">Custom DOM Selectors</option>
                      </select>
                    </div>
                  </div>

                  {/* Throttling & User Agent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Request Throttle Delay (ms)</label>
                      <input
                        type="number"
                        min={1000}
                        max={10000}
                        step={250}
                        value={formConfig.requestIntervalMs}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, requestIntervalMs: parseInt(e.target.value) || 2000 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Research User-Agent Header</label>
                      <input
                        type="text"
                        value={formConfig.userAgent}
                        onChange={(e) => setFormConfig({ ...formConfig, userAgent: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* DOM / JSON Field Mapping */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      Field Extraction Selectors / JSON Keys
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Record Container Selector</label>
                        <input
                          type="text"
                          value={formConfig.selectors.recordContainer}
                          onChange={(e) =>
                            setFormConfig({
                              ...formConfig,
                              selectors: { ...formConfig.selectors, recordContainer: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Full Name Selector</label>
                        <input
                          type="text"
                          value={formConfig.selectors.fullName}
                          onChange={(e) =>
                            setFormConfig({
                              ...formConfig,
                              selectors: { ...formConfig.selectors, fullName: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Phone Number Selector</label>
                        <input
                          type="text"
                          value={formConfig.selectors.phone}
                          onChange={(e) =>
                            setFormConfig({
                              ...formConfig,
                              selectors: { ...formConfig.selectors, phone: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Address Selector</label>
                        <input
                          type="text"
                          value={formConfig.selectors.address}
                          onChange={(e) =>
                            setFormConfig({
                              ...formConfig,
                              selectors: { ...formConfig.selectors, address: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ethical Guardrail Toggles */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Ethical Safeguards & Privacy Rules
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formConfig.respectRobotsTxt}
                          onChange={(e) =>
                            setFormConfig({ ...formConfig, respectRobotsTxt: e.target.checked })
                          }
                          className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                        />
                        <span>Enforce Robots.txt Compliance Check before request dispatch</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formConfig.ethicalGuardrails.autoRedactPhone}
                          onChange={(e) =>
                            setFormConfig({
                              ...formConfig,
                              ethicalGuardrails: {
                                ...formConfig.ethicalGuardrails,
                                autoRedactPhone: e.target.checked,
                              },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                        />
                        <span>Auto-redact non-public Phone PII upon extraction</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formConfig.ethicalGuardrails.hashPiiIdentifiers}
                          onChange={(e) =>
                            setFormConfig({
                              ...formConfig,
                              ethicalGuardrails: {
                                ...formConfig.ethicalGuardrails,
                                hashPiiIdentifiers: e.target.checked,
                              },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                        />
                        <span>Generate SHA-256 PII Hashes for deduplication & vault indexing</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs"
                    >
                      Save Scraper Pipeline
                    </button>
                  </div>
                </form>
              ) : (
                /* Read-only specification summary */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Target Endpoint</span>
                      <span className="font-mono text-slate-200 text-[11px] break-all">
                        {activeScraper?.targetUrl}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Source Format & State</span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        {activeScraper?.sourceType} ({activeScraper?.stateCode})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Rate Limit Delay</span>
                      <span className="text-slate-200">{activeScraper?.requestIntervalMs} ms between HTTP calls</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Robots.txt Policy</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {activeScraper?.respectRobotsTxt ? 'Strictly Honored' : 'Override Active'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300">Target Selector Mapping</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                        <span className="text-slate-500">Container:</span> {activeScraper?.selectors.recordContainer}
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                        <span className="text-slate-500">Name:</span> {activeScraper?.selectors.fullName}
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                        <span className="text-slate-500">Phone:</span> {activeScraper?.selectors.phone}
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                        <span className="text-slate-500">Address:</span> {activeScraper?.selectors.address}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      This scraper enforces mandatory throttling, User-Agent research attribution, and auto-hashing of extracted PII before committing records into the AES-256 database vault.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Job Console Stream Output */}
            {jobLogs.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Live Job Console Output
                </h3>

                <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto space-y-1 border border-slate-800">
                  {jobLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500">{log.timestamp.slice(11, 19)}</span>
                      <span
                        className={`font-semibold ${
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
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
