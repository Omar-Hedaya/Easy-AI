import React, { useState, useRef, useEffect } from 'react';
import { EXACT_GEMINI_MODELS, GeminiModelConfig } from '../constants/models';
import { Cpu, Check, Zap, ChevronDown, Sliders } from 'lucide-react';

interface ModelSelectorProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenSettings?: () => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onSelectModel,
  onOpenSettings,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const activeModel =
    EXACT_GEMINI_MODELS.find((m) => m.id === currentModel) || EXACT_GEMINI_MODELS[0];

  // Compact label for mobile displays (e.g. "3.8 Flash", "3.1 Lite")
  const compactModelLabel = activeModel.id
    .replace('gemini-', '')
    .replace('-flash-lite', ' Lite')
    .replace('-flash', ' Flash');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button: Responsive, compact on mobile, pointer-events-auto */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-8 flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-lg border border-slate-700/60 bg-slate-800/80 text-slate-200 hover:text-white hover:border-cyan-500/60 transition-all text-xs font-medium cursor-pointer shadow-sm group shrink-0 pointer-events-auto"
        title={`Active Gemini Model: ${activeModel.id}`}
        aria-label="Select Active Model"
      >
        <div className="p-0.5 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors shrink-0">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        {/* Mobile View: Compact badge (e.g. "3.8 Flash") */}
        <span className="font-mono font-semibold text-slate-100 sm:hidden text-[11px] whitespace-nowrap">
          {compactModelLabel}
        </span>
        {/* Tablet & Desktop View: Full Model ID */}
        <span className="font-mono font-semibold text-slate-100 hidden sm:inline text-xs truncate max-w-[125px]">
          {activeModel.id}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu: z-[60], opens directly underneath without mobile overflow */}
      {isOpen && (
        <div className="fixed sm:absolute top-12 sm:top-full left-2 right-2 sm:left-auto sm:right-0 mt-1 sm:mt-1.5 w-auto sm:w-84 md:w-96 max-w-sm sm:max-w-md mx-auto sm:mx-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 z-[60] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Gemini Models & Resiliency Chain
              </div>
              <p className="text-[10px] text-slate-400">
                Auto-failover on HTTP 404, 503 & 429
              </p>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer pointer-events-auto"
                title="Configure Failover Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
            {EXACT_GEMINI_MODELS.map((model: GeminiModelConfig, idx: number) => {
              const isSelected = model.id === currentModel;
              return (
                <button
                  type="button"
                  key={model.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start justify-between gap-2.5 cursor-pointer pointer-events-auto border ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-700/60 text-white shadow-sm'
                      : 'hover:bg-slate-800/80 border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-100">{model.id}</span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          idx === 0
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {model.tag}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                        {model.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {model.description}
                    </div>
                  </div>

                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
