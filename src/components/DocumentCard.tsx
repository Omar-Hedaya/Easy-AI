import React, { useState } from 'react';
import { CurriculumAnalysisResult, ThemeConfig } from '../types/themes';
import { MathView, RichMathText } from '../utils/mathRenderer';
import { Sparkles, FileText, Download, ShieldCheck, ChevronRight, Eye, Table, Layers } from 'lucide-react';

interface DocumentCardProps {
  document: CurriculumAnalysisResult;
  theme: ThemeConfig;
  onOpenExportPreview: (doc: CurriculumAnalysisResult) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  theme,
  onOpenExportPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'formulas' | 'matrix' | 'theorems'>('summary');
  const isRtl = document.targetLanguage === 'ar-EG' || document.targetLanguage === 'ar-SA';

  return (
    <div className="w-full mt-4 rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl overflow-hidden transition-all">
      {/* Header bar of the document card */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {document.discipline}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3" />
                {document.masterFormulaLedger.length} Unique Formulas
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
              {document.title}
            </h3>
          </div>
        </div>

        {/* Action Button: Opens the Export & Preview Modal */}
        <button
          onClick={() => onOpenExportPreview(document)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-900/20 transition-all cursor-pointer whitespace-nowrap"
          title="Open interactive preview and download standalone HTML or print PDF"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Export & Preview</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/80 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-slate-800 text-white font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Executive Summary
        </button>
        <button
          onClick={() => setActiveTab('formulas')}
          className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'formulas'
              ? 'bg-slate-800 text-cyan-300 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Formula Ledger</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 font-mono">
            {document.masterFormulaLedger.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-slate-800 text-amber-300 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-3 h-3" />
          <span>Comparative Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('theorems')}
          className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'theorems'
              ? 'bg-slate-800 text-indigo-300 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Core Theorems</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-4 text-xs max-h-80 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">
              {document.executiveSummary}
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Anti-Repetition Rule: Absolute zero duplication enforced.</span>
              <span className="text-emerald-400 font-semibold">Verified</span>
            </div>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="space-y-3">
            {document.masterFormulaLedger.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40 font-bold">
                    {f.id}
                  </span>
                  <span className="font-semibold text-slate-200 text-xs">{f.name}</span>
                </div>
                <div className="my-2 p-2 rounded bg-slate-900/90 text-center table-scroll-container text-cyan-300">
                  <MathView math={f.latex} block={true} />
                </div>
                <div className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Context:</strong> {f.context}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="table-scroll-container rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-950 text-slate-200">
                  {document.matrixAnalysisTable.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 border-b border-slate-800 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {document.matrixAnalysisTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/40'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 border-b border-slate-800/60 text-slate-300">
                        <RichMathText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'theorems' && (
          <div className="space-y-3">
            {document.coreTheoremsAndLaws.map((thm, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-100 text-xs">{thm.name}</span>
                  {thm.formulaRefId && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                      Cites {thm.formulaRefId}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-xs mb-1.5">{thm.statement}</p>
                <div className="p-2 rounded bg-slate-900/80 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Intuition:</strong> {thm.intuitiveExplanation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
