import React from 'react';
import { CURRICULUM_PRESETS, CurriculumPreset } from '../constants/presets';
import { TargetLanguage } from '../types/themes';
import { LANGUAGES } from '../constants/themes';
import { Sparkles, BookOpen, Layers, Send, RefreshCw, Cpu, Sigma, HeartPulse, Zap, Binary } from 'lucide-react';

interface CurriculumInputFormProps {
  onAnalyze: (payload: {
    title: string;
    discipline: string;
    targetLanguage: TargetLanguage;
    level: string;
    focus: string;
    rawContent: string;
  }) => void;
  isLoading: boolean;
  selectedLanguage: TargetLanguage;
  onLanguageChange: (lang: TargetLanguage) => void;
}

export const CurriculumInputForm: React.FC<CurriculumInputFormProps> = ({
  onAnalyze,
  isLoading,
  selectedLanguage,
  onLanguageChange,
}) => {
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>('eng-control-systems');
  const [title, setTitle] = React.useState<string>(CURRICULUM_PRESETS[0].title);
  const [discipline, setDiscipline] = React.useState<string>(CURRICULUM_PRESETS[0].discipline);
  const [level, setLevel] = React.useState<string>('Undergraduate / Professional');
  const [focus, setFocus] = React.useState<string>('Comprehensive Synthesis & Zero-Duplication Formulas');
  const [rawContent, setRawContent] = React.useState<string>(CURRICULUM_PRESETS[0].sampleInput);

  const handleSelectPreset = (preset: CurriculumPreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setDiscipline(preset.discipline);
    setLevel(preset.level);
    setRawContent(preset.sampleInput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawContent.trim() || isLoading) return;

    onAnalyze({
      title: title.trim() || 'Academic Curriculum Analysis',
      discipline,
      targetLanguage: selectedLanguage,
      level,
      focus,
      rawContent,
    });
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'Sigma':
        return <Sigma className="w-4 h-4 text-emerald-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Binary':
        return <Binary className="w-4 h-4 text-indigo-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-400" />;
    }
  };

  const activeLangConfig = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl mb-8">
      {/* Preset Academic Disciplines Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Pre-Configured Academic Curricula Presets</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any discipline to instantly load verified syllabi
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CURRICULUM_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-md shadow-blue-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  {getPresetIcon(preset.icon)}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                    {preset.discipline}
                  </span>
                </div>
                <div className="text-xs font-bold truncate leading-tight">{preset.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form Meta Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Curriculum / Course Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modern Control Systems"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Discipline:
            </label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Engineering">Engineering (Mech, Elec, Aero)</option>
              <option value="Mathematics">Mathematics & Vector Calculus</option>
              <option value="Nursing & Health Sciences">Nursing & Health Sciences</option>
              <option value="Physics">Physics & Electrodynamics</option>
              <option value="Computer Science">Computer Science & Algorithms</option>
              <option value="Biomedical & Pharmacology">Biomedical & Pharmacology</option>
              <option value="Chemistry">Physical & Organic Chemistry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Academic Target Level:
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Undergraduate">Undergraduate (BSc/BEng)</option>
              <option value="Graduate / Master of Science">Graduate (MSc / PhD)</option>
              <option value="Professional Board / NCLEX / FE">Professional Board (NCLEX, FE, PE)</option>
              <option value="College Preparatory / Honors">College Preparatory / Honors</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Language Output:
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
              <span className="text-base">{activeLangConfig.flag}</span>
              <span className="font-semibold truncate">{activeLangConfig.nativeName}</span>
            </div>
          </div>
        </div>

        {/* Raw Curriculum Content Area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Syllabus, Lecture Transcripts or Problem Set Notes:</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              LaTeX ($...$, $$...$$) supported
            </span>
          </div>
          <textarea
            rows={6}
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="Paste syllabus, textbook chapters, lecture transcripts, or math formulas here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
            required
          />
        </div>

        {/* Action Button & Anti-Repetition Assurance */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Strict Anti-Repetition Engine Active</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">KaTeX Mathematical Precision</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !rawContent.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Academic Curriculum...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synthesize & Format Curriculum</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
