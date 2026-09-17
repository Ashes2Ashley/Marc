import React, { useState, useEffect } from 'react';
import { Sun, Moon, Eye } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  return (
    <button
      onClick={() => setHighContrast(!highContrast)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
        highContrast
          ? 'bg-yellow-400 text-black border-yellow-500 shadow-md'
          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
      }`}
      title="Toggle high contrast for glare / outdoor field research"
    >
      {highContrast ? <Sun className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-indigo-400" />}
      <span>{highContrast ? 'High Contrast Mode' : 'Field High Contrast'}</span>
    </button>
  );
};
