import React, { useState, useEffect } from 'react';
import { ThemeConfig, TargetLanguage } from '../types/themes';
import { ThemeSelector } from './ThemeSelector';
import { LanguageSelector } from './LanguageSelector';
import { Printer, Eye, Zap, PlusCircle, PanelLeft, Maximize2, Minimize2 } from 'lucide-react';

interface DocumentHeaderBarProps {
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeConfig) => void;
  currentLanguage: TargetLanguage;
  onSelectLanguage: (lang: TargetLanguage) => void;
  onOpenPreview: () => void;
  onDirectPrint: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  hasAnalyzedData: boolean;
  lastModelUsed?: string;
}

export const DocumentHeaderBar: React.FC<DocumentHeaderBarProps> = ({
  currentTheme,
  onSelectTheme,
  currentLanguage,
  onSelectLanguage,
  onOpenPreview,
  onDirectPrint,
  onOpenSettings,
  onNewChat,
  onToggleSidebar,
  hasAnalyzedData,
  lastModelUsed = 'gemini-3.8-flash',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <header className="app-toolbar notranslate sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-sm" translate="no">
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        
        {/* Zone 1: Brand Title & Sidebar / New Chat */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle chat sessions drawer"
            >
              <PanelLeft className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-cyan-900/30">
              E
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-mono">
              Easy
            </span>
          </div>

          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            title="Start fresh conversation"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Zone 2: Clean Controls (Theme + Language + Fullscreen) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Target Language Dropdown (Egyptian Arabic / English / German) */}
          <LanguageSelector
            currentLanguage={currentLanguage}
            onSelectLanguage={onSelectLanguage}
          />

          {/* Theme Dropdown (Classic Ivory / Academic Dark / Cyberpunk Neon / Clean Minimal) */}
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs font-medium cursor-pointer shadow-sm"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (⛶)'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Fullscreen</span>
              </>
            )}
          </button>

          {/* Engine 503/429 Status Button */}
          <button
            onClick={onOpenSettings}
            className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors text-xs font-mono cursor-pointer"
            title="Inspect 503 & 429 Fallback Engine & Resiliency Settings"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[100px]">{lastModelUsed}</span>
          </button>
        </div>

        {/* Zone 3: Primary Actions (Export Preview & High-Fidelity Print) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenPreview}
            disabled={!hasAnalyzedData}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
              hasAnalyzedData
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50 opacity-60'
            }`}
            title="Open interactive preview to rename and download standalone HTML or print PDF"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Export & Preview</span>
          </button>

          <button
            onClick={onDirectPrint}
            disabled={!hasAnalyzedData}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              hasAnalyzedData
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title="Instant Print / PDF"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
