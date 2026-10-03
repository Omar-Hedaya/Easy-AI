import React from 'react';
import { CurriculumAnalysisResult, ThemeConfig } from '../types/themes';
import { MathView, RichMathText } from '../utils/mathRenderer';
import { ShieldCheck, Sparkles, BookOpen, Layers, CheckCircle2, ChevronRight, Hash } from 'lucide-react';

interface CurriculumDisplayViewProps {
  data: CurriculumAnalysisResult;
  theme: ThemeConfig;
  onOpenPreview: () => void;
}

export const CurriculumDisplayView: React.FC<CurriculumDisplayViewProps> = ({
  data,
  theme,
  onOpenPreview,
}) => {
  const isRtl = data.targetLanguage === 'ar-EG' || data.targetLanguage === 'ar-SA';

  return (
    <div
      className="w-full rounded-2xl border transition-colors duration-200 overflow-hidden shadow-2xl"
      style={{
        backgroundColor: theme.bgHex,
        color: theme.textHex,
        borderColor: theme.cardBorderHex,
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Document Hero Banner */}
      <div
        className="px-6 md:px-10 pt-8 pb-6 border-b"
        style={{ borderColor: theme.cardBorderHex }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div
            className="flex items-center gap-2 text-xs font-bold"
            style={{ color: theme.headerAccentHex }}
          >
            <span>{data.discipline}</span>
            <span>/</span>
            <span>{data.level}</span>
            <span>/</span>
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {data.masterFormulaLedger.length} Unique Verified Formulas
            </span>
          </div>

          <button
            onClick={onOpenPreview}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
            style={{
              backgroundColor: theme.cardBgHex,
              borderColor: theme.cardBorderHex,
              color: theme.accentHex,
            }}
          >
            Export Options & Preview →
          </button>
        </div>

        <h1
          className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight"
          style={{ color: theme.headerAccentHex }}
        >
          {data.title}
        </h1>
      </div>

      {/* Main Body - Zero wasted side margins */}
      <div className="p-6 md:p-10 space-y-8">
        
        {/* Executive Summary Card */}
        <section
          className="p-6 rounded-xl border shadow-sm"
          style={{
            backgroundColor: theme.cardBgHex,
            borderColor: theme.cardBorderHex,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" style={{ color: theme.accentHex }} />
            <h2
              className="text-lg font-bold"
              style={{ color: theme.headerAccentHex }}
            >
              {isRtl ? 'الملخص التنفيذي للمنهج الأكاديمي' : 'Executive Curriculum Synthesis'}
            </h2>
          </div>
          <p className="text-sm md:text-base leading-relaxed opacity-95">
            {data.executiveSummary}
          </p>
        </section>

        {/* Master Formula Ledger (Anti-Repetition Engine Core) */}
        <section>
          <div
            className="flex items-center justify-between border-b pb-3 mb-4"
            style={{ borderColor: theme.cardBorderHex }}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2
                className="text-xl font-bold tracking-tight"
                style={{ color: theme.headerAccentHex }}
              >
                {isRtl
                  ? 'سجل القوانين والمعادلات الموحد (ممنوع التكرار نهائياً)'
                  : 'Master Formula & Law Ledger (Strict Anti-Repetition)'}
              </h2>
            </div>
            <div
              className="text-xs px-2.5 py-1 rounded font-mono font-bold"
              style={{
                backgroundColor: theme.badgeBgHex,
                color: theme.badgeTextHex,
              }}
            >
              Zero Redundancy
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.masterFormulaLedger.map((formula) => (
              <div
                key={formula.id}
                className="p-5 rounded-xl border shadow-sm flex flex-col justify-between"
                style={{
                  backgroundColor: theme.cardBgHex,
                  borderColor: theme.cardBorderHex,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.badgeBgHex,
                        color: theme.badgeTextHex,
                      }}
                    >
                      {formula.id}
                    </span>
                    <h3
                      className="text-sm font-bold truncate max-w-[240px]"
                      style={{ color: theme.headerAccentHex }}
                    >
                      {formula.name}
                    </h3>
                  </div>

                  {/* Math Display with KaTeX */}
                  <div
                    className="p-3.5 rounded-lg border text-center my-3 table-scroll-container"
                    style={{
                      backgroundColor: theme.codeBgHex,
                      borderColor: theme.codeBorderHex,
                      color: theme.katexColorHex,
                    }}
                  >
                    <MathView math={formula.latex} block={true} />
                  </div>

                  {/* Constituent Variables */}
                  <div className="text-xs space-y-1 mt-2">
                    <div className="font-semibold text-xs opacity-75">Constituent Variables:</div>
                    <ul className="space-y-0.5 pl-2">
                      {formula.variables.map((v, vIdx) => (
                        <li key={vIdx} className="flex items-baseline gap-1 text-[11px]">
                          <span className="font-serif font-bold text-xs">
                            <MathView math={v.symbol} />
                          </span>
                          <span>: {v.meaning}</span>
                          {v.unit && <span className="opacity-60">({v.unit})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className="mt-3 pt-2 border-t text-[11px] opacity-75"
                  style={{ borderColor: theme.cardBorderHex }}
                >
                  <strong className="opacity-90">Context / Limits: </strong>
                  {formula.context}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Theorems & Clinical/Engineering Laws */}
        <section>
          <div
            className="flex items-center gap-2 border-b pb-3 mb-4"
            style={{ borderColor: theme.cardBorderHex }}
          >
            <Layers className="w-5 h-5" style={{ color: theme.accentHex }} />
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ color: theme.headerAccentHex }}
            >
              {isRtl ? 'النظريات والمبادئ العلمية الأساسية' : 'Core Theorems, Laws & Governing Principles'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.coreTheoremsAndLaws.map((thm, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border shadow-sm"
                style={{
                  backgroundColor: theme.cardBgHex,
                  borderColor: theme.cardBorderHex,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3
                    className="text-base font-bold"
                    style={{ color: theme.headerAccentHex }}
                  >
                    {thm.name}
                  </h3>
                  {thm.formulaRefId && (
                    <span
                      className="text-xs font-mono font-semibold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: theme.badgeBgHex,
                        color: theme.badgeTextHex,
                        borderColor: theme.cardBorderHex,
                      }}
                      title="Points back to Master Formula Ledger without re-writing formula"
                    >
                      Cites Ledger: {thm.formulaRefId}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium mb-3 leading-relaxed">
                  <strong>Statement / Law: </strong>
                  {thm.statement}
                </p>

                <div
                  className="p-3.5 rounded-lg text-xs leading-relaxed"
                  style={{
                    backgroundColor: theme.codeBgHex,
                    border: `1px solid ${theme.codeBorderHex}`,
                  }}
                >
                  <strong className="block mb-1 opacity-80">Intuitive Explanation & Applications:</strong>
                  {thm.intuitiveExplanation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparative Matrix Table with Horizontal Scroll */}
        <section>
          <div
            className="flex items-center justify-between border-b pb-3 mb-4"
            style={{ borderColor: theme.cardBorderHex }}
          >
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-cyan-500" />
              <h2
                className="text-xl font-bold tracking-tight"
                style={{ color: theme.headerAccentHex }}
              >
                {isRtl ? 'مصفوفة المقارنة والتحليل الأكاديمي' : 'Comparative Synthesis Matrix'}
              </h2>
            </div>
            <span className="text-xs opacity-75 font-mono">
              Touch / Drag horizontally to slide matrices
            </span>
          </div>

          <div
            className="table-scroll-container rounded-xl border shadow-sm"
            style={{ borderColor: theme.tableBorderHex }}
          >
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.tableHeaderBgHex,
                    color: theme.tableHeaderTextHex,
                  }}
                >
                  {data.matrixAnalysisTable.headers.map((header, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-5 py-3.5 font-bold border-b"
                      style={{ borderColor: theme.tableBorderHex }}
                    >
                      {header}
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
                        rIdx % 2 === 0 ? theme.tableRowEvenHex : theme.tableRowOddHex,
                    }}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-5 py-3 border-b"
                        style={{ borderColor: theme.tableBorderHex }}
                      >
                        <RichMathText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deep Analytical Narrative */}
        <section
          className="p-6 md:p-8 rounded-xl border shadow-sm"
          style={{
            backgroundColor: theme.cardBgHex,
            borderColor: theme.cardBorderHex,
          }}
        >
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: theme.headerAccentHex }}
          >
            {isRtl
              ? 'الشرح التحليلي المفصل والتطبيقات الهندسية/السريرية'
              : 'Comprehensive Analytical Narrative & Applications'}
          </h2>
          <RichMathText text={data.deepCurriculumContent} />
        </section>

        {/* Strict Anti-Repetition Verification Audit */}
        <footer
          className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
          style={{
            backgroundColor: theme.codeBgHex,
            borderColor: theme.codeBorderHex,
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              <strong>Easy Engine Audit:</strong> {data.uniquenessValidationLedger.totalUniqueFormulasFound} Unique Formulas Verified · {data.uniquenessValidationLedger.duplicateFormulasPrevented} Redundancies Filtered
            </span>
          </div>
          <div className="text-emerald-500 font-bold">
            ZERO FORMULA DUPLICATION ENFORCED
          </div>
        </footer>
      </div>
    </div>
  );
};
