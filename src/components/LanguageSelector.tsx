import React from 'react';
import { LANGUAGES } from '../constants/themes';
import { TargetLanguage } from '../types/themes';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: TargetLanguage;
  onSelectLanguage: (lang: TargetLanguage) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
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

  const activeLang = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 hover:text-white hover:border-slate-500 transition-colors text-xs font-medium cursor-pointer shadow-sm"
        title="Target Generation Language"
      >
        <span className="text-sm">{activeLang.flag}</span>
        <span className="truncate max-w-[120px]">{activeLang.nativeName}</span>
        <Globe className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
          <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 mb-1">
            لغة العرض / Language (Live Switcher)
          </div>
          <div className="space-y-1">
            {[
              { code: 'ar-EG', flag: '🇪🇬', nativeName: 'المصرية (Default)', name: 'Egyptian Arabic - RTL' },
              { code: 'en-US', flag: '🇬🇧', nativeName: 'English', name: 'English - LTR' },
              { code: 'de-DE', flag: '🇩🇪', nativeName: 'Deutsch', name: 'German - LTR' },
            ].map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code as TargetLanguage);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <div>
                      <div className="font-medium text-slate-100">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-400">{lang.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
