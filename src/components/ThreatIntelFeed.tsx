import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldAlert,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Filter,
  Download,
  Plus,
  Search,
  Sparkles,
  Globe,
  Activity,
  Terminal,
  Lock,
  Server,
  BarChart2,
  ArrowRight,
  FileText,
  Check,
  Info,
  Clock,
  ChevronDown
} from 'lucide-react';
import {
  ThreatIntelItem,
  ThreatSeverity,
  ThreatCategory,
  ScraperConfig,
  ScraperLogEntry,
} from '../types';
import { INITIAL_THREAT_INTEL } from '../data/mockThreatIntel';
import { downloadFile } from '../utils/exportUtils';

interface ThreatIntelFeedProps {
  scrapers: ScraperConfig[];
  onSaveScraper: (updatedConfig: ScraperConfig) => void;
  onAddLog?: (log: ScraperLogEntry) => void;
  onNavigateToScraper?: (scraperId: string) => void;
}

export const ThreatIntelFeed: React.FC<ThreatIntelFeedProps> = ({
  scrapers,
  onSaveScraper,
  onAddLog,
  onNavigateToScraper,
}) => {
  const [threatItems, setThreatItems] = useState<ThreatIntelItem[]>(() => {
    const saved = localStorage.getItem('ethical_threat_intel_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_THREAT_INTEL;
      }
    }
    return INITIAL_THREAT_INTEL;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAppliedOnly, setShowAppliedOnly] = useState<boolean>(false);

  // Live Telemetry Feed Simulation Toggle
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Modal State for Submitting New Threat Alert
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStateCode, setNewStateCode] = useState<string>('TX');
  const [newSeverity, setNewSeverity] = useState<ThreatSeverity>('HIGH');
  const [newCategory, setNewCategory] = useState<ThreatCategory>('RATE_LIMIT_SPIKE');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIocValue, setNewIocValue] = useState<string>('');

  // Persist items
  useEffect(() => {
    localStorage.setItem('ethical_threat_intel_items', JSON.stringify(threatItems));
  }, [threatItems]);

  // Periodic Simulated Feed Updates when streaming is enabled
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 12000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Filter Logic
  const filteredItems = threatItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetStateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.iocValue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesApplied = !showAppliedOnly || item.isApplied;

    return matchesSearch && matchesSeverity && matchesCategory && matchesApplied;
  });

  // Calculate Metrics
  const criticalCount = threatItems.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = threatItems.filter((i) => i.severity === 'HIGH').length;
  const pendingAdaptations = threatItems.filter((i) => !i.isApplied).length;
  const appliedAdaptations = threatItems.filter((i) => i.isApplied).length;
  const syncPercentage =
    threatItems.length > 0 ? Math.round((appliedAdaptations / threatItems.length) * 100) : 100;

  // Execute Dynamic Scraper Adaptation
  const handleApplyAdaptation = (item: ThreatIntelItem) => {
    // Find target scraper by targetScraperId or state code
    const targetScraper = scrapers.find(
      (s) => s.id === item.targetScraperId || s.stateCode === item.targetStateCode
    );

    if (!targetScraper) {
      alert(`No active scraper configuration found matching state ${item.targetStateCode}.`);
      return;
    }

    const updatedConfig: ScraperConfig = { ...targetScraper };
    const { actionType, suggestedValue } = item.recommendedAction;

    let adaptationMessage = '';

    switch (actionType) {
      case 'INCREASE_INTERVAL':
        updatedConfig.requestIntervalMs = Number(suggestedValue) || 4000;
        adaptationMessage = `Adjusted request interval to ${updatedConfig.requestIntervalMs}ms for ${updatedConfig.name}`;
        break;
      case 'ROTATE_USER_AGENT':
        updatedConfig.userAgent = String(suggestedValue);
        adaptationMessage = `Rotated User-Agent header for ${updatedConfig.name}`;
        break;
      case 'ENABLE_CORS_PROXY':
        updatedConfig.useCorsProxy = true;
        if (!updatedConfig.corsProxyUrl) {
          updatedConfig.corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
        }
        adaptationMessage = `Enabled CORS proxy fallback relay for ${updatedConfig.name}`;
        break;
      case 'UPDATE_SELECTOR':
        updatedConfig.selectors = {
          ...updatedConfig.selectors,
          recordContainer: String(suggestedValue),
        };
        adaptationMessage = `Updated DOM record container selector to "${suggestedValue}" for ${updatedConfig.name}`;
        break;
      case 'ENFORCE_ROBOTS_TXT':
        updatedConfig.respectRobotsTxt = true;
        adaptationMessage = `Enforced strict robots.txt compliance for ${updatedConfig.name}`;
        break;
      case 'AUTO_REDACT_PII':
        updatedConfig.ethicalGuardrails = {
          ...updatedConfig.ethicalGuardrails,
          autoRedactPhone: true,
          autoRedactAddress: true,
          hashPiiIdentifiers: true,
        };
        adaptationMessage = `Enforced maximum PII auto-redaction and hashing guardrails for ${updatedConfig.name}`;
        break;
      default:
        break;
    }

    // Save updated scraper
    onSaveScraper(updatedConfig);

    // Mark IoC item as applied
    setThreatItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isApplied: true } : i))
    );

    // Add log
    if (onAddLog) {
      onAddLog({
        id: `intel-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: updatedConfig.id,
        scraperName: updatedConfig.name,
        level: 'SUCCESS',
        message: `[THREAT INTEL ADAPTATION] ${adaptationMessage} (Triggered by ${item.id})`,
      });
    }
  };

  // Batch Auto-Tune All Scrapers
  const handleBatchAutoTune = () => {
    const unapplied = threatItems.filter((i) => !i.isApplied);
    if (unapplied.length === 0) {
      alert('All threat intelligence recommendations have already been applied.');
      return;
    }

    unapplied.forEach((item) => {
      handleApplyAdaptation(item);
    });

    alert(`Successfully auto-tuned scraper configurations based on ${unapplied.length} pending threat intelligence alerts.`);
  };

  // Export STIX / JSON Threat Report
  const handleExportSTIXReport = () => {
    const reportData = {
      type: 'bundle',
      id: `bundle--${Date.now()}`,
      spec_version: '2.1',
      metadata: {
        title: 'Public Safety Registry Threat Intelligence & Scraper Adaptation Report',
        generator: 'Ethical Scraper Security Vault Threat Engine',
        generatedAt: new Date().toISOString(),
        totalIndicators: threatItems.length,
        appliedCountermeasures: appliedAdaptations,
      },
      objects: threatItems.map((item) => ({
        type: 'indicator',
        id: `indicator--${item.id}`,
        created: item.timestamp,
        name: item.title,
        description: item.description,
        indicator_types: [item.indicatorType],
        severity: item.severity,
        confidence: item.confidence,
        external_references: [
          {
            source_name: item.sourceFeed,
            external_id: item.techniqueId,
          },
        ],
        pattern: item.iocValue,
        valid_from: item.timestamp,
        x_target_state: item.targetStateCode,
        x_adaptation_status: item.isApplied ? 'APPLIED' : 'PENDING',
        x_recommended_action: item.recommendedAction,
      })),
    };

    const content = JSON.stringify(reportData, null, 2);
    downloadFile(content, `stix21_threat_intel_${Date.now()}.json`, 'application/json');
  };

  // Add Manual Threat Indicator
  const handleCreateNewIndicator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    const newItem: ThreatIntelItem = {
      id: `IOC-MANUAL-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      title: newTitle,
      indicatorType: 'RATE_LIMIT',
      category: newCategory,
      severity: newSeverity,
      targetStateCode: newStateCode.toUpperCase(),
      confidence: 95,
      techniqueId: 'T1071.001',
      sourceFeed: 'Analyst Manual Submission',
      description: newDescription,
      iocValue: newIocValue || `${newStateCode} Registry Access Alert`,
      recommendedAction: {
        label: 'Increase Request Delay to 4000ms',
        description: 'Manual safety throttle recommendation applied.',
        actionType: 'INCREASE_INTERVAL',
        suggestedValue: 4000,
      },
      isApplied: false,
    };

    setThreatItems((prev) => [newItem, ...prev]);
    setIsModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewIocValue('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Active Threat Intelligence & Adaptive Feed
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-red-500/10 text-red-300 border border-red-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
                Live Feed Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time indicators of compromise, anti-bot WAF bypass trends, and dynamic scraper auto-tuning engine.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              isLiveStreaming
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isLiveStreaming ? 'Streaming On' : 'Streaming Paused'}</span>
          </button>

          <button
            onClick={handleBatchAutoTune}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Batch Auto-Tune All Scrapers</span>
          </button>

          <button
            onClick={handleExportSTIXReport}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export STIX 2.1</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report Trend</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active IoCs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Indicators (IoCs)</span>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{threatItems.length}</span>
            <span className="text-xs text-slate-400">Recorded Signals</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Updated {lastRefreshed}</span>
          </div>
        </div>

        {/* Critical / High Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical & High Alerts</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {criticalCount + highCount}
            </span>
            <span className="text-xs text-slate-400">
              ({criticalCount} Critical, {highCount} High)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300/80">
            Action recommended for active state scrapers
          </div>
        </div>

        {/* Pending Auto-Adaptations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Scraper Auto-Tunes</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{pendingAdaptations}</span>
            <span className="text-xs text-slate-400">Scrapers Require Tuning</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-300">
            {pendingAdaptations === 0
              ? 'All scrapers synchronized'
              : 'Click "Apply Adaptation" to align rules'}
          </div>
        </div>

        {/* Scraper Resiliency Sync % */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Scraper Resiliency Rate</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{syncPercentage}%</span>
            <span className="text-xs text-slate-400">Adaptive Countermeasures</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{appliedAdaptations} Rules Applied</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter IoCs, state codes, keywords..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="INFO">Info Notices</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="RATE_LIMIT_SPIKE">Rate Limit Spike</option>
              <option value="ANTI_BOT_BYPASS">Anti-Bot / WAF Challenge</option>
              <option value="DOM_SCHEMA_SHIFT">DOM Schema Shift</option>
              <option value="CORS_POLICY_CHANGE">CORS Policy Change</option>
              <option value="APT_REGISTRY_TREND">APT Registry Trend</option>
            </select>
          </div>

          {/* Show Applied Only Toggle */}
          <button
            onClick={() => setShowAppliedOnly(!showAppliedOnly)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
              showAppliedOnly
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showAppliedOnly ? 'Showing Applied' : 'All States'}
          </button>
        </div>
      </div>

      {/* Main Threat Intelligence Feed Grid */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-400">No threat intelligence alerts match the current filter criteria.</p>
            <p className="text-xs text-slate-500">
              Try adjusting search terms, resetting severity filters, or enabling live feed streaming.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const linkedScraper = scrapers.find(
              (s) => s.id === item.targetScraperId || s.stateCode === item.targetStateCode
            );

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-5 shadow-lg transition-all hover:border-slate-700 ${
                  item.severity === 'CRITICAL'
                    ? 'border-red-500/40 bg-red-950/10'
                    : item.severity === 'HIGH'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : item.severity === 'MEDIUM'
                    ? 'border-yellow-500/30 bg-yellow-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md font-mono ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : item.severity === 'MEDIUM'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {item.severity}
                    </span>

                    {/* State Tag */}
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                      [{item.targetStateCode}] REGISTRY
                    </span>

                    {/* MITRE Technique Badge if present */}
                    {item.techniqueId && (
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                        MITRE {item.techniqueId}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      ID: {item.id}
                    </span>
                  </div>

                  {/* Confidence & Source */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-mono">
                      <Zap className="w-3 h-3" />
                      {item.confidence}% Confidence
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400 text-[11px]">{item.sourceFeed}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column: Title & Threat Description */}
                  <div className="lg:col-span-2 space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    {/* IoC Technical Telemetry Box */}
                    <div className="mt-2 bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 font-mono text-xs text-slate-300 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-slate-500 text-[10px] uppercase block font-semibold mb-0.5">
                          Signal / IoC Telemetry Pattern:
                        </span>
                        <code className="text-cyan-300 text-[11px]">{item.iocValue}</code>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scraper Link & Dynamic Action Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase text-indigo-400 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Recommended Adaptation
                      </div>
                      <p className="text-xs font-semibold text-white">
                        {item.recommendedAction.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {item.recommendedAction.description}
                      </p>

                      {/* Linked Scraper Status */}
                      {linkedScraper && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[150px]">
                            Scraper: <strong className="text-slate-200">{linkedScraper.name}</strong>
                          </span>
                          <span className="text-slate-500 font-mono">
                            Delay: {linkedScraper.requestIntervalMs}ms
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {item.isApplied ? (
                        <div className="w-full py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Scraper Adapted & Synchronized
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyAdaptation(item)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Apply Dynamic Adaptation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Submit Observed Registry Threat / Rate-Limit Signal
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewIndicator} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Signal Title / Summary
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Texas DPS Rate Limit Throttle Alert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">State Code</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newStateCode}
                    onChange={(e) => setNewStateCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as ThreatSeverity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Threat Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ThreatCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="RATE_LIMIT_SPIKE">Rate Limit Spike (429)</option>
                  <option value="ANTI_BOT_BYPASS">Anti-Bot / WAF Challenge</option>
                  <option value="DOM_SCHEMA_SHIFT">DOM Schema Shift</option>
                  <option value="CORS_POLICY_CHANGE">CORS Policy Change</option>
                  <option value="APT_REGISTRY_TREND">APT Registry Trend</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Technical IoC Pattern / URL / Header
                </label>
                <input
                  type="text"
                  value={newIocValue}
                  onChange={(e) => setNewIocValue(e.target.value)}
                  placeholder="e.g. sor.dps.texas.gov/PublicSite/Search [Status: 429]"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Threat Description & Analysis
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe observed access limits, anti-bot mechanisms, or rate-limiting behaviors..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Commit Threat Signal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
