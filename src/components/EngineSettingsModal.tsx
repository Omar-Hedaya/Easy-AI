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
            <div className="text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300">Gemini Account Models (Failover Chain):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-cyan-300 font-bold">1. gemini-3.8-flash</span>
                  <span className="text-[9px] text-slate-400">Primary / Default</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">2. gemini-3.7-flash</span>
                  <span className="text-[9px] text-slate-400">Fallback 1</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">3. gemini-3.6-flash</span>
                  <span className="text-[9px] text-slate-400">Fallback 2</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">4. gemini-3.5-flash</span>
                  <span className="text-[9px] text-slate-400">Fallback 3</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">5. gemini-3.5-flash-lite</span>
                  <span className="text-[9px] text-slate-400">Fallback 4</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">6. gemini-3.1-flash-lite</span>
                  <span className="text-[9px] text-slate-400">Fallback 5</span>
                </div>
              </div>
              <div className="text-[10px] text-emerald-400/90 pt-0.5">
                ✓ Uploaded PDFs & multimodal Base64 inlineData are preserved 100% across every model switch.
              </div>
            </div>
          </div>

          {/* Multi-Tier Cascading Failover Pipeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Multi-Tier Cascading Failover Pipeline</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40">
                Zero-Downtime Architecture
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-2">
              <div className="font-semibold text-slate-200">Cascading Priority Chain:</div>
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-cyan-300 font-bold">1. Google Gemini API (Primary)</span>
                  <span className="text-slate-400">Direct inference + 404 auto-retry</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-amber-800/40">
                  <span className="text-amber-300 font-bold">2. Tier 1: Groq Cloud API</span>
                  <span className="text-slate-400">llama-3.3-70b-versatile / 8b-instant</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-purple-800/40">
                  <span className="text-purple-300 font-bold">3. Tier 2: OpenRouter API</span>
                  <span className="text-slate-400">deepseek/deepseek-chat</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-emerald-800/40">
                  <span className="text-emerald-300 font-bold">4. Tier 3: OpenRouter Free Models</span>
                  <span className="text-slate-400">gemini-2.0-flash-exp:free / llama-3.3:free</span>
                </div>
              </div>
            </div>

            {/* Tier 1: Groq Key */}
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                Tier 1 Fallback: Groq API Key (<code className="text-amber-300">VITE_GROQ_API_KEY</code>):
              </label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Endpoint: https://api.groq.com/openai/v1/chat/completions (Ultra-fast failover)
              </span>
            </div>

            {/* Tier 2 & 3: OpenRouter Key */}
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                Tier 2 & 3 Fallback: OpenRouter API Key (<code className="text-cyan-300">VITE_OPENROUTER_API_KEY</code>):
              </label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Endpoint: https://openrouter.ai/api/v1/chat/completions (Includes free tier fallback models)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <span>
              Whenever Google Gemini encounters <strong>HTTP 429 ("Resource Exhausted" / Quota limit)</strong>, <strong>503 (High Demand)</strong>, or network timeouts, the pipeline immediately transfers inference to Tier 1 (Groq), then Tier 2 (OpenRouter), and Tier 3 (Free models) without breaking your session.
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
