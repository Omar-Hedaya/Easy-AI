import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../types/themes';
import { THEMES } from '../constants/themes';
import { MathView, RichMathText } from '../utils/mathRenderer';
import {
  downloadMessageHtml,
  printMessageAsPdf,
  downloadMessageMarkdown,
} from '../utils/messageExporter';
import {
  X,
  Download,
  Printer,
  FileCode,
  FileText,
  Palette,
  Check,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  defaultTitle?: string;
  activeTheme: ThemeConfig;
  onSelectTheme?: (theme: ThemeConfig) => void;
}

export const ExportStudioModal: React.FC<ExportStudioModalProps> = ({
  isOpen,
  onClose,
  content,
  defaultTitle = 'Easy_Academic_Notes',
  activeTheme,
  onSelectTheme,
}) => {
  const [fileName, setFileName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'md'>('pdf');
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(activeTheme);
  const [forceExactInk, setForceExactInk] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setSelectedTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    if (defaultTitle) {
      const sanitized = defaultTitle
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      setFileName(sanitized.startsWith('Easy_') ? sanitized : `Easy_${sanitized}`);
    }
  }, [defaultTitle, isOpen]);

  if (!isOpen) return null;

  const handleConfirmDownload = () => {
    const finalTitle = fileName.trim() || 'Easy_Academic_Export';

    if (selectedFormat === 'pdf') {
      printMessageAsPdf(content, finalTitle, selectedTheme);
    } else if (selectedFormat === 'html') {
      downloadMessageHtml(content, finalTitle, selectedTheme);
    } else if (selectedFormat === 'md') {
      downloadMessageMarkdown(content, finalTitle);
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  const isRtl = /[\u0600-\u06FF]/.test(content);

  // 4 Curated fast-pick themes plus full 15 theme picker
  const curatedThemes = [
    { label: 'Academic Dark', theme: THEMES.find((t) => t.id === 'obsidian-oled') || THEMES[8] },
    { label: 'Clean White', theme: THEMES.find((t) => t.id === 'oxford-academic') || THEMES[1] },
    { label: 'Modern Minimal', theme: THEMES.find((t) => t.id === 'swiss-minimalist') || THEMES[7] },
    { label: 'Colorful Accent', theme: THEMES.find((t) => t.id === 'cyberpunk-neon') || THEMES[11] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Export Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Custom File Naming & Live Preview
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure export format, theme styling, and parameters before saving
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Deck */}
        <div className="p-5 bg-slate-900/90 border-b border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* File Name Input */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              File Title / Name:
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Easy_Physics_Electrodynamics"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="absolute right-3 text-[11px] text-slate-500 pointer-events-none">
                .{selectedFormat}
              </span>
            </div>
          </div>

          {/* Format Selector */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Format:
            </label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedFormat === 'pdf'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('html')}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedFormat === 'html'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>HTML Standalone</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('md')}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedFormat === 'md'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Document Theme:
            </label>
            <select
              value={selectedTheme.id}
              onChange={(e) => {
                const found = THEMES.find((t) => t.id === e.target.value);
                if (found) {
                  setSelectedTheme(found);
                  if (onSelectTheme) onSelectTheme(found);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <optgroup label="Curated Styles">
                {curatedThemes.map((ct) => (
                  <option key={ct.theme.id} value={ct.theme.id}>
                    {ct.label} ({ct.theme.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="All 15 Built-in Themes">
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Live Interactive Preview Window */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 table-scroll-container bg-slate-950/60">
          <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Rendered Document Preview</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Styling: {selectedTheme.name} ({selectedTheme.category})
            </span>
          </div>

          {/* Rendered Sheet */}
          <div
            className="max-w-3xl mx-auto rounded-xl border p-6 sm:p-8 shadow-2xl transition-colors duration-200"
            style={{
              backgroundColor: selectedTheme.bgHex,
              color: selectedTheme.textHex,
              borderColor: selectedTheme.cardBorderHex,
            }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Sheet Header */}
            <div
              className="border-b pb-4 mb-5 flex items-start justify-between flex-wrap gap-2"
              style={{ borderColor: selectedTheme.cardBorderHex }}
            >
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: selectedTheme.accentHex }}
                >
                  Easy Academic Intelligence
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ color: selectedTheme.headerAccentHex }}
                >
                  {fileName || defaultTitle}
                </h2>
              </div>
              {includeTimestamp && (
                <div
                  className="text-[11px] font-mono opacity-65"
                  style={{ color: selectedTheme.textHex }}
                >
                  {new Date().toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Sheet Body with KaTeX */}
            <div
              className="p-5 sm:p-6 rounded-xl border shadow-sm text-sm leading-relaxed"
              style={{
                backgroundColor: selectedTheme.cardBgHex,
                borderColor: selectedTheme.cardBorderHex,
              }}
            >
              <RichMathText text={content} />
            </div>

            {/* Sheet Footer */}
            <div
              className="mt-6 pt-3 border-t flex items-center justify-between text-[11px] font-mono opacity-70"
              style={{ borderColor: selectedTheme.cardBorderHex }}
            >
              <span>Verified Zero Duplication Engine</span>
              <span>Theme: {selectedTheme.name}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={forceExactInk}
                onChange={(e) => setForceExactInk(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Force Rich Ink (-webkit-print-color-adjust: exact)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Include Timestamp & Metadata</span>
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmDownload}
              className="flex items-center gap-2 px-5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition-all cursor-pointer shadow-lg shadow-blue-900/30"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Confirmed!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Confirm & Download ({selectedFormat.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
