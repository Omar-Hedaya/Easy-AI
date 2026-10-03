import React from 'react';
import { THEMES } from '../constants/themes';
import { ThemeConfig } from '../types/themes';
import { Palette, Check, Sun, Moon } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeConfig) => void;
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lightThemes = THEMES.filter((t) => t.category === 'light');
  const darkThemes = THEMES.filter((t) => t.category === 'dark');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 hover:text-white hover:border-slate-500 transition-colors text-xs font-medium cursor-pointer shadow-sm"
        title="Select from 15 Professional Themes"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
          style={{ backgroundColor: currentTheme.bgHex }}
        />
        <span className="truncate max-w-[110px]">{currentTheme.name}</span>
        <Palette className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 max-h-[480px] overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1">
            Academic Themes (Live Switcher)
          </div>

          {/* Core Featured Themes */}
          <div className="mb-3 pb-2 border-b border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 px-2 py-1 uppercase tracking-wider">
              Core Themes
            </div>
            <div className="space-y-1">
              {[
                { id: 'classic-ivory', label: 'Classic Ivory (Warm Light)' },
                { id: 'deep-midnight', label: 'Academic Dark (Deep Slate)' },
                { id: 'cyberpunk-neon', label: 'Cyberpunk Neon (Purple/Cyan)' },
                { id: 'swiss-minimalist', label: 'Clean Minimal (Paper White)' },
              ].map(({ id, label }) => {
                const theme = THEMES.find((t) => t.id === id);
                if (!theme) return null;
                const isSelected = theme.id === currentTheme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme(theme);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-slate-600 shrink-0"
                        style={{ backgroundColor: theme.bgHex }}
                      />
                      <span>{label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Light Themes */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 px-2 py-1">
              <Sun className="w-3.5 h-3.5" />
              <span>Light Themes (8)</span>
            </div>
            <div className="space-y-1">
              {lightThemes.map((theme) => {
                const isSelected = theme.id === currentTheme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme(theme);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-slate-600 shrink-0"
                        style={{ backgroundColor: theme.bgHex }}
                      />
                      <span>{theme.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark / OLED Themes */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 px-2 py-1">
              <Moon className="w-3.5 h-3.5" />
              <span>Dark & OLED Themes (7)</span>
            </div>
            <div className="space-y-1">
              {darkThemes.map((theme) => {
                const isSelected = theme.id === currentTheme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme(theme);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-slate-600 shrink-0"
                        style={{ backgroundColor: theme.bgHex }}
                      />
                      <span>{theme.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
