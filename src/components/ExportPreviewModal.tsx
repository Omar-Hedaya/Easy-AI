import React from 'react';
import { CurriculumAnalysisResult, ThemeConfig } from '../types/themes';
import { generateStandaloneHtml } from '../utils/htmlExporter';
import { MathView, RichMathText } from '../utils/mathRenderer';
import { X, Download, Printer, Copy, Check, FileCode, Sparkles, ShieldCheck } from 'lucide-react';

interface ExportPreviewModalProps {
  data: CurriculumAnalysisResult;
  activeTheme: ThemeConfig;
  isOpen: boolean;
  onClose: () => void;
  onPrintPdf: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  data,
  activeTheme,
  isOpen,
  onClose,
  onPrintPdf,
}) => {
  const [fileName, setFileName] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  // Initialize file name from data title
  React.useEffect(() => {
    if (data?.title) {
      const sanitized = data.title
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      setFileName(sanitized || 'الخلاصة_الأكاديمية');
    }
  }, [data]);

  if (!isOpen) return null;

  const isRtl = data.targetLanguage === 'ar-EG' || data.targetLanguage === 'ar-SA';

  const handleDownloadHtml = () => {
    const finalTitle = fileName.trim() || 'Easy_Academic_Curriculum';
    const htmlString = generateStandaloneHtml(data, activeTheme, finalTitle);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${finalTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyHtml = async () => {
    const finalTitle = fileName.trim() || 'Easy_Academic_Curriculum';
    const htmlString = generateStandaloneHtml(data, activeTheme, finalTitle);
    await navigator.clipboard.writeText(htmlString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Export & File Naming Preview
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Full Ink Intensity
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Rename document title, verify zero formula repetition, and download print-ready formats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Naming & Export Action Deck */}
        <div className="p-4 px-6 bg-slate-900/90 border-b border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              File Title & Export Name:
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Easy_Multivariable_Calculus_2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="absolute right-3 text-xs text-slate-500 pointer-events-none">
                .html / .pdf
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-wrap items-center justify-start lg:justify-end gap-2.5">
            {/* Download Standalone HTML Button */}
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
              title="Download standalone HTML with embedded 15-theme switcher"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded HTML!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Interactive HTML</span>
                </>
              )}
            </button>

            {/* Instant Print / PDF */}
            <button
              onClick={onPrintPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
              title="Print or Save as PDF with rich non-conserving ink"
            >
              <Printer className="w-4 h-4" />
              <span>Print to PDF (Rich Ink)</span>
            </button>

            {/* Copy HTML Source */}
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
              title="Copy self-contained HTML to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy HTML'}</span>
            </button>
          </div>
        </div>

        {/* Live Formatted Document Preview Window */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-8 table-scroll-container"
          style={{
            backgroundColor: activeTheme.bgHex,
            color: activeTheme.textHex,
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header: Starts directly with main title */}
            <div className="border-b pb-4" style={{ borderColor: activeTheme.cardBorderHex }}>
              <h1
                className="text-2xl md:text-3xl font-extrabold tracking-tight"
                style={{ color: activeTheme.headerAccentHex }}
              >
                {fileName.replace(/_/g, ' ') || data.title || 'الخلاصة الأكاديمية'}
              </h1>
            </div>

            {/* Executive Summary */}
            <div
              className="p-5 rounded-xl border shadow-sm"
              style={{
                backgroundColor: activeTheme.cardBgHex,
                borderColor: activeTheme.cardBorderHex,
              }}
            >
              <h2
                className="text-base font-bold mb-2"
                style={{ color: activeTheme.headerAccentHex }}
              >
                {isRtl ? 'الملخص التنفيذي للمنهج' : 'Executive Curriculum Synthesis'}
              </h2>
              <p className="text-sm leading-relaxed opacity-90">{data.executiveSummary}</p>
            </div>

            {/* Master Formula Ledger */}
            <div>
              <div
                className="flex items-center justify-between border-b pb-2 mb-3"
                style={{ borderColor: activeTheme.cardBorderHex }}
              >
                <h2
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ color: activeTheme.headerAccentHex }}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {isRtl
                    ? 'سجل القوانين والمعادلات الموحد (ممنوع التكرار)'
                    : 'Master Formula Ledger (Strict Anti-Repetition)'}
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                  style={{
                    backgroundColor: activeTheme.badgeBgHex,
                    color: activeTheme.badgeTextHex,
                  }}
                >
                  Zero Redundancy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.masterFormulaLedger.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-lg border shadow-sm"
                    style={{
                      backgroundColor: activeTheme.cardBgHex,
                      borderColor: activeTheme.cardBorderHex,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: activeTheme.badgeBgHex,
                          color: activeTheme.badgeTextHex,
                        }}
                      >
                        {f.id}
                      </span>
                      <h4
                        className="text-xs font-bold truncate max-w-[200px]"
                        style={{ color: activeTheme.headerAccentHex }}
                      >
                        {f.name}
                      </h4>
                    </div>

                    <div
                      className="p-2.5 rounded border text-center my-2 table-scroll-container"
                      style={{
                        backgroundColor: activeTheme.codeBgHex,
                        borderColor: activeTheme.codeBorderHex,
                        color: activeTheme.katexColorHex,
                      }}
                    >
                      <MathView math={f.latex} block={true} />
                    </div>

                    <div className="text-[11px] space-y-1.5 opacity-90">
                      <div>
                        <strong>Variables: </strong>
                        {f.variables.map((v, i) => (
                          <span key={i} className="mr-2 inline-block">
                            <MathView math={v.symbol} />: {v.meaning}
                            {v.unit && ` (${v.unit})`}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs opacity-75">
                        <strong>Context: </strong>
                        {f.context}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Theorems & Laws */}
            <div>
              <h2
                className="text-lg font-bold border-b pb-2 mb-3"
                style={{
                  color: activeTheme.headerAccentHex,
                  borderColor: activeTheme.cardBorderHex,
                }}
              >
                {isRtl
                  ? 'النظريات والمبادئ العلمية الأساسية'
                  : 'Core Theorems & Governing Laws'}
              </h2>
              <div className="space-y-3">
                {data.coreTheoremsAndLaws.map((thm, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border shadow-sm"
                    style={{
                      backgroundColor: activeTheme.cardBgHex,
                      borderColor: activeTheme.cardBorderHex,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4
                        className="text-sm font-bold"
                        style={{ color: activeTheme.headerAccentHex }}
                      >
                        {thm.name}
                      </h4>
                      {thm.formulaRefId && (
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                          style={{
                            backgroundColor: activeTheme.badgeBgHex,
                            color: activeTheme.badgeTextHex,
                          }}
                        >
                          Cites: {thm.formulaRefId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed mb-2 font-medium">
                      <strong>Statement: </strong>
                      {thm.statement}
                    </p>
                    <div
                      className="p-2.5 rounded text-xs leading-relaxed"
                      style={{
                        backgroundColor: activeTheme.codeBgHex,
                        border: `1px solid ${activeTheme.codeBorderHex}`,
                      }}
                    >
                      <strong>Intuitive Explanation: </strong>
                      {thm.intuitiveExplanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparative Matrix Table with Horizontal Scroll */}
            <div>
              <h2
                className="text-lg font-bold border-b pb-2 mb-3"
                style={{
                  color: activeTheme.headerAccentHex,
                  borderColor: activeTheme.cardBorderHex,
                }}
              >
                {isRtl ? 'مصفوفة المقارنة والتحليل الأكاديمي' : 'Comparative Synthesis Matrix'}
              </h2>
              <div
                className="table-scroll-container rounded-lg border"
                style={{ borderColor: activeTheme.tableBorderHex }}
              >
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: activeTheme.tableHeaderBgHex,
                        color: activeTheme.tableHeaderTextHex,
                      }}
                    >
                      {data.matrixAnalysisTable.headers.map((h, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 font-bold border-b"
                          style={{ borderColor: activeTheme.tableBorderHex }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.matrixAnalysisTable.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          backgroundColor:
                            rIdx % 2 === 0
                              ? activeTheme.tableRowEvenHex
                              : activeTheme.tableRowOddHex,
                        }}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-4 py-2.5 border-b"
                            style={{ borderColor: activeTheme.tableBorderHex }}
                          >
                            <RichMathText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deep Content */}
            <div
              className="p-6 rounded-xl border shadow-sm"
              style={{
                backgroundColor: activeTheme.cardBgHex,
                borderColor: activeTheme.cardBorderHex,
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: activeTheme.headerAccentHex }}
              >
                {isRtl
                  ? 'الشرح التحليلي والتطبيقات الهندسية/السريرية'
                  : 'Comprehensive Analytical Narrative & Applications'}
              </h2>
              <RichMathText text={data.deepCurriculumContent} />
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>
            Active Theme: <strong className="text-slate-200">{activeTheme.name}</strong> ({activeTheme.category})
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Non-conserving ink enabled: -webkit-print-color-adjust: exact</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
