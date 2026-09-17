import React from 'react';
import { ShieldCheck, Terminal, Database, BarChart2, FileCheck, Radio, Lock, Key } from 'lucide-react';
import { hapticAudio } from '../utils/hapticsAndAudio';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel';
  setActiveTab: (tab: 'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel') => void;
  isVaultLocked: boolean;
  onToggleVaultLock: () => void;
  recordCount: number;
  threatCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  isVaultLocked,
  onToggleVaultLock,
  recordCount,
  threatCount,
}) => {
  const handleTabChange = (tab: 'dashboard' | 'scrapers' | 'vault' | 'analytics' | 'compliance' | 'threat-intel') => {
    hapticAudio.vibrate(25);
    setActiveTab(tab);
  };

  const handleLockClick = () => {
    hapticAudio.vibrate([20, 30, 20]);
    onToggleVaultLock();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl">
      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] ${
            activeTab === 'dashboard'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Overview</span>
        </button>

        {/* Scrapers Tab */}
        <button
          onClick={() => handleTabChange('scrapers')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] ${
            activeTab === 'scrapers'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Scraper</span>
        </button>

        {/* Vault Tab */}
        <button
          onClick={() => handleTabChange('vault')}
          className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] ${
            activeTab === 'vault'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Vault</span>
          {recordCount > 0 && (
            <span className="absolute top-0.5 right-1 px-1 py-0.2 bg-indigo-500 text-white text-[9px] font-bold rounded-full min-w-[14px] text-center">
              {recordCount > 99 ? '99+' : recordCount}
            </span>
          )}
        </button>

        {/* Threat Intel Tab */}
        <button
          onClick={() => handleTabChange('threat-intel')}
          className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] ${
            activeTab === 'threat-intel'
              ? 'text-amber-400 bg-amber-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5 text-amber-400 animate-pulse" />
          <span className="text-[10px] leading-tight">Threats</span>
          {threatCount > 0 && (
            <span className="absolute top-0.5 right-1 px-1 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full min-w-[14px] text-center">
              {threatCount}
            </span>
          )}
        </button>

        {/* Analytics Tab */}
        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] ${
            activeTab === 'analytics'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Analytics</span>
        </button>

        {/* Quick Lock/Unlock */}
        <button
          onClick={handleLockClick}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] ${
            isVaultLocked
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-emerald-400 bg-emerald-500/10'
          }`}
        >
          {isVaultLocked ? <Lock className="w-5 h-5 mb-0.5" /> : <Key className="w-5 h-5 mb-0.5" />}
          <span className="text-[10px] leading-tight font-semibold">
            {isVaultLocked ? 'Lock' : 'Unlock'}
          </span>
        </button>
      </div>
    </div>
  );
};
