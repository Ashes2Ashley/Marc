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
  const tabClass = (id: string) =>
    `flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
      activeTab === id
        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wide text-white">Marc</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400">No demo data — fetch or add records</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-md text-xs">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">Vault: <strong className="text-white">{recordCount}</strong></span>
            </div>
            <button
              onClick={onToggleVaultLock}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-medium transition-all ${
                isVaultLocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {isVaultLocked ? <Lock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              <span>{isVaultLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          </div>
        </div>
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}><ShieldCheck className="w-4 h-4" />Home</button>
          <button onClick={() => setActiveTab('scrapers')} className={tabClass('scrapers')}><Terminal className="w-4 h-4" />Sources</button>
          <button onClick={() => setActiveTab('vault')} className={tabClass('vault')}><Database className="w-4 h-4" />Vault</button>
          <button onClick={() => setActiveTab('analytics')} className={tabClass('analytics')}><BarChart2 className="w-4 h-4" />Charts</button>
          <button onClick={() => setActiveTab('compliance')} className={tabClass('compliance')}><FileCheck className="w-4 h-4" />Rules</button>
          <button onClick={() => setActiveTab('threat-intel')} className={tabClass('threat-intel')}><Radio className="w-4 h-4" />Feed</button>
        </div>
      </div>
    </header>
  );
};
