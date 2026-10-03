import React, { useState } from 'react';
import { ExternalKeysConfig } from '../types/chat';
import { X, ShieldAlert, Cpu, Key, Check, Info } from 'lucide-react';

interface EngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalKeys: ExternalKeysConfig;
  onSaveKeys: (keys: ExternalKeysConfig) => void;
  lastModelUsed?: string;
}

export const EngineSettingsModal: React.FC<EngineSettingsModalProps> = ({
  isOpen,
  onClose,
  externalKeys,
  onSaveKeys,
  lastModelUsed = 'gemini-3.8-flash',
}) => {
  const [openRouterKey, setOpenRouterKey] = useState(externalKeys.openRouterKey || '');
  const [groqKey, setGroqKey] = useState(externalKeys.groqKey || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKeys({
      openRouterKey: openRouterKey.trim() || undefined,
      groqKey: groqKey.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Robust Gemini Fallback Engine & Resiliency
              </h3>
              <p className="text-[11px] text-slate-400">
                Automated 503 & 429 resolution with multi-tiered model switching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Active Model & Resiliency Status */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Active Inference Model:</span>
              <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50">
                {lastModelUsed}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Automatic Failover Chain:</div>
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">1. gemini-3.8-flash (Primary)</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">2. gemini-3.7-flash</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">3. gemini-3.6-flash</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">4. gemini-3.5-flash-lite</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">5. OpenRouter/Groq</span>
              </div>
            </div>
          </div>

          {/* External Fallback Provider Keys */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Optional External Fallback API Keys (User-Configured)</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                OpenRouter API Key (Optional failover):
              </label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Groq API Key (Optional ultra-fast failover):
              </label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <span>
              If Gemini ever responds with HTTP 503 or 429, the engine automatically switches models in real time without failing your query.
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
            <span>{saved ? 'Saved!' : 'Save Resiliency Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
