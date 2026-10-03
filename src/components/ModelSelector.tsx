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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModel =
    EXACT_GEMINI_MODELS.find((m) => m.id === currentModel) || EXACT_GEMINI_MODELS[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 hover:text-white hover:border-cyan-500/60 transition-all text-xs font-medium cursor-pointer shadow-sm group"
        title="Select Active Gemini Model & Failover Priority"
      >
        <div className="p-0.5 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="font-mono font-semibold text-slate-100 max-w-[125px] truncate">
          {activeModel.id}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Configure Failover Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-[360px] overflow-y-auto pr-0.5">
            {EXACT_GEMINI_MODELS.map((model: GeminiModelConfig, idx: number) => {
              const isSelected = model.id === currentModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start justify-between gap-2.5 cursor-pointer border ${
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
                      <div className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Preserves all PDF / attachment Base64 on failover</span>
            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                Settings →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
