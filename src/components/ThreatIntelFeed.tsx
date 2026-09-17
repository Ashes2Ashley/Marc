import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Filter,
  Download,
  Plus,
  Search,
  Sparkles,
  Activity,
  Clock,
} from 'lucide-react';
import {
  ThreatIntelItem,
  ThreatSeverity,
  ThreatCategory,
  ScraperConfig,
  ScraperLogEntry,
} from '../types';
import { downloadFile } from '../utils/exportUtils';

interface ThreatIntelFeedProps {
  scrapers: ScraperConfig[];
  onSaveScraper: (updatedConfig: ScraperConfig) => void;
  onAddLog?: (log: ScraperLogEntry) => void;
  onNavigateToScraper?: (scraperId: string) => void;
}

const STORAGE_KEY = 'ethical_threat_intel_items';

export const ThreatIntelFeed: React.FC<ThreatIntelFeedProps> = ({
  scrapers,
  onSaveScraper,
  onAddLog,
}) => {
  const [threatItems, setThreatItems] = useState<ThreatIntelItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date().toLocaleTimeString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStateCode, setNewStateCode] = useState('TX');
  const [newSeverity, setNewSeverity] = useState<ThreatSeverity>('HIGH');
  const [newCategory, setNewCategory] = useState<ThreatCategory>('RATE_LIMIT_SPIKE');
  const [newDescription, setNewDescription] = useState('');
  const [newIocValue, setNewIocValue] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threatItems));
  }, [threatItems]);

  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 12000);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const filteredItems = threatItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.targetStateCode.toLowerCase().includes(q) ||
      item.iocValue.toLowerCase().includes(q);
    const matchesSeverity = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesApplied = !showAppliedOnly || item.isApplied;
    return matchesSearch && matchesSeverity && matchesCategory && matchesApplied;
  });

  const criticalCount = threatItems.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = threatItems.filter((i) => i.severity === 'HIGH').length;
  const pendingAdaptations = threatItems.filter((i) => !i.isApplied).length;
  const appliedAdaptations = threatItems.filter((i) => i.isApplied).length;
  const syncPercentage =
    threatItems.length > 0 ? Math.round((appliedAdaptations / threatItems.length) * 100) : 100;

  const handleApplyAdaptation = (item: ThreatIntelItem) => {
    const targetScraper = scrapers.find(
      (s) => s.id === item.targetScraperId || s.stateCode === item.targetStateCode
    );
    if (!targetScraper) {
      alert(`No scraper matching state ${item.targetStateCode}.`);
      return;
    }

    const updatedConfig: ScraperConfig = { ...targetScraper };
    const { actionType, suggestedValue } = item.recommendedAction;
    let adaptationMessage = '';

    switch (actionType) {
      case 'INCREASE_INTERVAL':
        updatedConfig.requestIntervalMs = Number(suggestedValue) || 4000;
        adaptationMessage = `Interval → ${updatedConfig.requestIntervalMs}ms for ${updatedConfig.name}`;
        break;
      case 'ROTATE_USER_AGENT':
        updatedConfig.userAgent = String(suggestedValue);
        adaptationMessage = `User-Agent rotated for ${updatedConfig.name}`;
        break;
      case 'ENABLE_CORS_PROXY':
        updatedConfig.useCorsProxy = true;
        if (!updatedConfig.corsProxyUrl) {
          updatedConfig.corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
        }
        adaptationMessage = `CORS proxy enabled for ${updatedConfig.name}`;
        break;
      case 'UPDATE_SELECTOR':
        updatedConfig.selectors = {
          ...updatedConfig.selectors,
          recordContainer: String(suggestedValue),
        };
        adaptationMessage = `Selector updated for ${updatedConfig.name}`;
        break;
      case 'ENFORCE_ROBOTS_TXT':
        updatedConfig.respectRobotsTxt = true;
        adaptationMessage = `robots.txt enforced for ${updatedConfig.name}`;
        break;
      case 'AUTO_REDACT_PII':
        updatedConfig.ethicalGuardrails = {
          ...updatedConfig.ethicalGuardrails,
          autoRedactPhone: true,
          autoRedactAddress: true,
          hashPiiIdentifiers: true,
        };
        adaptationMessage = `PII guardrails maxed for ${updatedConfig.name}`;
        break;
      default:
        break;
    }

    onSaveScraper(updatedConfig);
    setThreatItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isApplied: true } : i)));

    if (onAddLog) {
      onAddLog({
        id: `intel-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scraperId: updatedConfig.id,
        scraperName: updatedConfig.name,
        level: 'SUCCESS',
        message: `[THREAT INTEL] ${adaptationMessage} (${item.id})`,
      });
    }
  };

  const handleBatchAutoTune = () => {
    const unapplied = threatItems.filter((i) => !i.isApplied);
    if (unapplied.length === 0) {
      alert('No pending adaptations.');
      return;
    }
    unapplied.forEach((item) => handleApplyAdaptation(item));
  };

  const handleExportSTIXReport = () => {
    const reportData = {
      type: 'bundle',
      id: `bundle--${Date.now()}`,
      spec_version: '2.1',
      metadata: {
        title: 'Threat Intelligence Report',
        generator: 'Marc Live Ops',
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
        pattern: item.iocValue,
        valid_from: item.timestamp,
        x_target_state: item.targetStateCode,
        x_adaptation_status: item.isApplied ? 'APPLIED' : 'PENDING',
        x_recommended_action: item.recommendedAction,
      })),
    };
    downloadFile(JSON.stringify(reportData, null, 2), `stix21_threat_intel_${Date.now()}.json`, 'application/json');
  };

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
        description: 'Manual safety throttle recommendation.',
        actionType: 'INCREASE_INTERVAL',
        suggestedValue: 4000,
      },
      isApplied: false,
    };
    setThreatItems((prev) => [newItem, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewIocValue('');
  };

  const severityTone = (s: ThreatSeverity) => {
    if (s === 'CRITICAL') return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (s === 'HIGH') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    if (s === 'MEDIUM') return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    return 'text-slate-300 border-slate-600 bg-slate-800/60';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="ops-panel p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white tracking-wide">Analyst threat feed</h2>
              <span className="ops-kicker px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">
                {threatItems.length === 0 ? 'Empty' : `${threatItems.length} indicators`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Local analyst indicators and scraper adaptations. Nothing is preloaded.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`ops-btn-ghost px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 ${
              isLiveStreaming
                ? 'border-emerald-500/30 text-emerald-300'
                : 'border-slate-700 text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {isLiveStreaming ? 'Clock live' : 'Clock paused'}
          </button>
          <button
            type="button"
            onClick={handleBatchAutoTune}
            className="ops-btn-primary px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-tune pending
          </button>
          <button
            type="button"
            onClick={handleExportSTIXReport}
            className="ops-btn-ghost px-3 py-1.5 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export STIX 2.1
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="ops-btn-ghost px-3 py-1.5 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Report trend
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active indicators',
            value: threatItems.length,
            sub: `Updated ${lastRefreshed}`,
            icon: <ShieldAlert className="w-4 h-4" />,
            tone: 'text-red-400 bg-red-500/10',
          },
          {
            label: 'Critical & high',
            value: criticalCount + highCount,
            sub: `${criticalCount} critical · ${highCount} high`,
            icon: <AlertTriangle className="w-4 h-4" />,
            tone: 'text-amber-400 bg-amber-500/10',
          },
          {
            label: 'Pending auto-tunes',
            value: pendingAdaptations,
            sub: pendingAdaptations === 0 ? 'All clear' : 'Apply adaptations below',
            icon: <Sliders className="w-4 h-4" />,
            tone: 'text-indigo-400 bg-indigo-500/10',
          },
          {
            label: 'Resiliency rate',
            value: `${syncPercentage}%`,
            sub: `${appliedAdaptations} rules applied`,
            icon: <CheckCircle2 className="w-4 h-4" />,
            tone: 'text-emerald-400 bg-emerald-500/10',
          },
        ].map((card) => (
          <div key={card.label} className="ops-panel p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{card.label}</span>
              <div className={`p-2 rounded-lg ${card.tone}`}>{card.icon}</div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-white tabular-nums">{card.value}</div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="ops-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter IoCs, states, keywords…"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            Severity
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="INFO">Info</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Category
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="ALL">All</option>
              <option value="RATE_LIMIT_SPIKE">Rate limit</option>
              <option value="WAF_BLOCK">WAF block</option>
              <option value="SELECTOR_DRIFT">Selector drift</option>
              <option value="PII_EXPOSURE">PII exposure</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showAppliedOnly}
              onChange={(e) => setShowAppliedOnly(e.target.checked)}
              className="rounded border-slate-600"
            />
            Applied only
          </label>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="ops-empty text-center py-16 px-6">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-200">No indicators yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add an analyst note with Report trend, or apply adaptations once scrapers surface real signals.
            Empty beats fake feeds.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="ops-btn-primary mt-4 px-4 py-2 text-xs rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Report first trend
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="ops-panel p-4 hover:border-slate-700 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${severityTone(item.severity)}`}>
                      {item.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{item.id}</span>
                    <span className="text-[10px] text-slate-500">{item.targetStateCode}</span>
                    {item.isApplied && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Applied
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-2 truncate">{item.iocValue}</p>
                </div>
                {!item.isApplied && (
                  <button
                    type="button"
                    onClick={() => handleApplyAdaptation(item)}
                    className="ops-btn-primary shrink-0 px-3 py-1.5 text-xs rounded-lg"
                  >
                    Apply adaptation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleCreateNewIndicator}
            className="ops-panel w-full max-w-lg p-5 space-y-3 shadow-2xl"
          >
            <h3 className="text-sm font-semibold text-white">Report trend</h3>
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
            <textarea
              required
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newStateCode}
                onChange={(e) => setNewStateCode(e.target.value)}
                placeholder="State"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
              <input
                value={newIocValue}
                onChange={(e) => setNewIocValue(e.target.value)}
                placeholder="IoC value (optional)"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as ThreatSeverity)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="INFO">Info</option>
              </select>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ThreatCategory)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="RATE_LIMIT_SPIKE">Rate limit</option>
                <option value="WAF_BLOCK">WAF block</option>
                <option value="SELECTOR_DRIFT">Selector drift</option>
                <option value="PII_EXPOSURE">PII exposure</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="ops-btn-ghost px-3 py-1.5 text-xs rounded-lg border border-slate-700">
                Cancel
              </button>
              <button type="submit" className="ops-btn-primary px-3 py-1.5 text-xs rounded-lg">
                Save indicator
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
