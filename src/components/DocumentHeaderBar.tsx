import React, { useState, useEffect, useRef } from 'react';
import { ThemeConfig, TargetLanguage } from '../types/themes';
import { THEMES, LANGUAGES } from '../constants/themes';
import { ModelSelector } from './ModelSelector';
import {
  Menu,
  X,
  Settings,
  ChevronDown,
  Plus,
  Eye,
  Printer,
  Maximize2,
  Minimize2,
  Globe,
  Palette,
  Sliders,
  Share2,
  Check,
  FileText,
} from 'lucide-react';

interface DocumentHeaderBarProps {
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeConfig) => void;
  currentLanguage: TargetLanguage;
  onSelectLanguage: (lang: TargetLanguage) => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenPreview: () => void;
  onDirectPrint: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  hasAnalyzedData: boolean;
  lastModelUsed?: string;
  isSidebarOpen?: boolean;
  onOpenExportStudio?: () => void;
}

export const DocumentHeaderBar: React.FC<DocumentHeaderBarProps> = ({
  currentTheme,
  onSelectTheme,
  currentLanguage,
  onSelectLanguage,
  selectedModel,
  onSelectModel,
  onOpenPreview,
  onDirectPrint,
  onOpenSettings,
  onNewChat,
  onToggleSidebar,
  hasAnalyzedData,
  isSidebarOpen = false,
  onOpenExportStudio,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log('Fullscreen error:', err));
    } else {
      document.exitFullscreen().catch((err) => console.log('Exit fullscreen error:', err));
    }
  };

  return (
    <header
      className="app-toolbar notranslate sticky top-0 relative z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-sm pointer-events-auto"
      translate="no"
    >
      <div className="w-full flex items-center justify-between px-2 py-1.5 gap-1 sm:gap-2 pointer-events-auto">
        {/* Left Side: App Logo / Branding ("Easy AI") + New Chat (+) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-cyan-900/30 shrink-0">
              E
            </div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white font-mono whitespace-nowrap">
              Easy AI
            </span>
          </div>

          {/* New Chat (+) Button: active onClick to reset active session */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNewChat();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5 border border-slate-700/60 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors shrink-0 cursor-pointer pointer-events-auto"
            title="Start fresh conversation"
            aria-label="New Chat"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Right Side: Consolidated Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 1. Compact Model Switcher: active onClick, opens z-[60] dropdown */}
          <ModelSelector
            currentModel={selectedModel}
            onSelectModel={onSelectModel}
            onOpenSettings={onOpenSettings}
          />

          {/* 2. Settings Dropdown Button (⚙️) for Language & Theme */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsDropdownOpen((prev) => !prev);
                setIsExportDropdownOpen(false);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center p-1.5 border transition-all cursor-pointer shadow-sm shrink-0 pointer-events-auto ${
                isSettingsDropdownOpen
                  ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300'
                  : 'border-slate-700/60 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title="Settings (Language & Theme)"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Settings Dropdown: opens directly underneath, z-[60], bounded to viewport */}
            {isSettingsDropdownOpen && (
              <div className="fixed sm:absolute top-12 sm:top-full left-2 right-2 sm:left-auto sm:right-0 mt-1 sm:mt-1.5 w-auto sm:w-80 max-w-sm sm:max-w-md mx-auto sm:mx-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-[60] animate-in fade-in zoom-in-95 duration-150 space-y-3 pointer-events-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>App Preferences</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer pointer-events-auto"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Maximize2 className="w-3 h-3 text-cyan-400" />
                    )}
                    <span>{isFullscreen ? 'Exit' : 'Full'}</span>
                  </button>
                </div>

                {/* Language Picker */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-400" />
                    <span>اللغة / Language</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { code: 'ar-EG', flag: '🇪🇬', label: 'المصرية' },
                      { code: 'en-US', flag: '🇬🇧', label: 'English' },
                      { code: 'de-DE', flag: '🇩🇪', label: 'Deutsch' },
                    ].map((lang) => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLanguage(lang.code as TargetLanguage);
                        }}
                        className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-medium transition-colors cursor-pointer pointer-events-auto border ${
                          lang.code === currentLanguage
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Catalog */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Palette className="w-3 h-3 text-purple-400" />
                      <span>المظهر / Theme</span>
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      {currentTheme.name}
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                      Light Themes
                    </div>
                    {THEMES.filter((t) => t.category === 'light').map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTheme(t);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer pointer-events-auto ${
                          t.id === currentTheme.id
                            ? 'bg-cyan-950/70 text-cyan-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: t.bgHex }}
                          />
                          <span className="truncate">{t.name}</span>
                        </div>
                        {t.id === currentTheme.id && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                      </button>
                    ))}

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
                      Dark & OLED Themes
                    </div>
                    {THEMES.filter((t) => t.category === 'dark').map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTheme(t);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer pointer-events-auto ${
                          t.id === currentTheme.id
                            ? 'bg-cyan-950/70 text-cyan-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: t.bgHex }}
                          />
                          <span className="truncate">{t.name}</span>
                        </div>
                        {t.id === currentTheme.id && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSettingsDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer pointer-events-auto"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Resiliency & Fallback Engine Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Export Studio Dropdown Button */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExportDropdownOpen((prev) => !prev);
                setIsSettingsDropdownOpen(false);
              }}
              className={`w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1 sm:h-8 rounded-lg flex items-center justify-center gap-1 border transition-all cursor-pointer shadow-sm shrink-0 pointer-events-auto ${
                isExportDropdownOpen
                  ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40'
                  : 'border-slate-700/60 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title="Export Studio (HTML & PDF)"
              aria-label="Export Studio"
            >
              <Share2 className="w-4 h-4 text-cyan-400 sm:text-white" />
              <span className="hidden sm:inline text-xs font-semibold">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {/* Export Dropdown: z-[60], opens directly underneath */}
            {isExportDropdownOpen && (
              <div className="fixed sm:absolute top-12 sm:top-full left-2 right-2 sm:left-auto sm:right-0 mt-1 sm:mt-1.5 w-auto sm:w-64 max-w-sm sm:max-w-md mx-auto sm:mx-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-[60] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExportDropdownOpen(false);
                    onOpenPreview();
                  }}
                  disabled={!hasAnalyzedData}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors cursor-pointer pointer-events-auto ${
                    hasAnalyzedData
                      ? 'text-slate-200 hover:bg-blue-600/20 hover:text-white'
                      : 'text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Export & Preview</div>
                    <div className="text-[10px] text-slate-400">Interactive standalone HTML & PDF</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExportDropdownOpen(false);
                    onDirectPrint();
                  }}
                  disabled={!hasAnalyzedData}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors cursor-pointer pointer-events-auto ${
                    hasAnalyzedData
                      ? 'text-slate-200 hover:bg-emerald-600/20 hover:text-white'
                      : 'text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Print PDF</div>
                    <div className="text-[10px] text-slate-400">High-fidelity color print dialog</div>
                  </div>
                </button>

                {onOpenExportStudio && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExportDropdownOpen(false);
                      onOpenExportStudio();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 text-slate-200 hover:bg-cyan-600/20 hover:text-white transition-colors cursor-pointer pointer-events-auto border-t border-slate-800/80 mt-1"
                  >
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Export Studio Modal</div>
                      <div className="text-[10px] text-slate-400">Quick Markdown / HTML exporter</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. 3-Line Hamburger Menu Button (☰ / ✕) */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSidebar();
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center p-1.5 border transition-all cursor-pointer shrink-0 pointer-events-auto ${
                isSidebarOpen
                  ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300 shadow-sm'
                  : 'border-slate-700/60 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title={isSidebarOpen ? 'Close chat history (✕)' : 'Open chat history (☰)'}
              aria-label="Toggle chat history drawer"
            >
              {isSidebarOpen ? (
                <X className="w-4 h-4 text-cyan-400" />
              ) : (
                <Menu className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
