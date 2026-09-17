import React from 'react';
import { ShieldCheck, Lock, Database, Terminal, BarChart2, FileCheck, Key, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel';
  setActiveTab: (tab: 'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel') => void;
  isVaultLocked: boolean;
  onToggleVaultLock: () => void;
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isVaultLocked,
  onToggleVaultLock,
  recordCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wide text-white">Ethical Registry Scraper</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  FCRA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Encrypted Database & Public Safety Data Research Vault
              </p>
            </div>
          </div>

          {/* Quick Security Status Badges */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-md text-xs">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">Vault: <strong className="text-white">{recordCount} Records</strong></span>
            </div>

            <button
              onClick={onToggleVaultLock}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-medium transition-all ${
                isVaultLocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              {isVaultLocked ? <Lock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              <span>{isVaultLocked ? 'AES-256 Vault Locked' : 'AES-256 Unlocked'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Overview Dashboard
          </button>

          <button
            onClick={() => setActiveTab('scrapers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'scrapers'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Adaptable Scraper Studio
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'vault'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            Encrypted DB Vault
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Research Analytics
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'compliance'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            FCRA & Ethical Compliance
          </button>

          <button
            onClick={() => setActiveTab('threat-intel')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'threat-intel'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            Active Threat Intel
          </button>
        </div>
      </div>
    </header>
  );
};
