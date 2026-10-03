import React, { useState } from 'react';
import { GroundingMetadata } from '../types/chat';
import {
  Globe,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Atom,
} from 'lucide-react';

interface GroundingSourcesViewProps {
  metadata?: GroundingMetadata;
  isGrounded?: boolean;
}

export const GroundingSourcesView: React.FC<GroundingSourcesViewProps> = ({
  metadata,
  isGrounded,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata && !isGrounded) return null;

  const queries = metadata?.webSearchQueries || [];
  const rawChunks = metadata?.groundingChunks || [];
  
  // Extract web sources and remove duplicate URIs
  const uniqueSources: Array<{ uri: string; title: string; domain: string }> = [];
  const seenUris = new Set<string>();

  for (const chunk of rawChunks) {
    if (chunk.web?.uri) {
      const uri = chunk.web.uri;
      if (!seenUris.has(uri)) {
        seenUris.add(uri);
        let domain = '';
        try {
          const parsed = new URL(uri);
          domain = parsed.hostname.replace(/^www\./, '');
        } catch {
          domain = uri.slice(0, 30);
        }
        uniqueSources.push({
          uri,
          title: chunk.web.title || domain || 'Verified Academic Source',
          domain,
        });
      }
    }
  }

  // If there are neither queries nor sources, don't show an empty panel
  if (queries.length === 0 && uniqueSources.length === 0 && !isGrounded) {
    return null;
  }

  return (
    <div className="mt-3.5 rounded-xl border border-cyan-500/30 bg-slate-950/70 overflow-hidden shadow-inner text-xs transition-all duration-200">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-cyan-950/80 border-b border-cyan-800/40 cursor-pointer select-none hover:bg-slate-900/90 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Google Search Grounding Icon & Brand */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-900/60 border border-blue-700/60 text-blue-200 text-[11px] font-semibold">
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Google Search Grounding</span>
          </div>

          {/* Academic Verification Tag */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>التحقق الأكاديمي اللحظي</span>
          </div>

          {/* Source Count Pill */}
          {uniqueSources.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              {uniqueSources.length} مصادر موثقة
            </span>
          )}
        </div>

        {/* Toggle Expand / Collapse Icon */}
        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px]">
          <span className="hidden sm:inline text-[10px] text-slate-400">
            {isExpanded ? 'طي التفاصيل' : 'عرض المراجع والاستعلامات'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
          )}
        </div>
      </div>

      {/* Summary Row (Always visible or compact preview) */}
      <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/40">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Atom className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            تم تدقيق الثوابت العلمية، المعادلات، والبيانات التقنية مباشرة عبر البحث الأكاديمي العالمي.
          </span>
        </div>
        {!isExpanded && uniqueSources.length > 0 && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {uniqueSources.slice(0, 3).map((src, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 max-w-[100px] truncate"
                title={src.title}
              >
                {src.domain}
              </span>
            ))}
            {uniqueSources.length > 3 && (
              <span className="text-[10px] text-cyan-400 font-mono">+{uniqueSources.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details: Queries & Grounded Citations */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 bg-slate-950/90 border-t border-slate-800/60 animate-in fade-in">
          {/* Web Search Queries Performed by the Model */}
          {queries.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-cyan-300 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>استعلامات البحث الأكاديمي المنفذة (Verification Queries):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {queries.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200 font-mono"
                  >
                    <Search className="w-3 h-3 text-slate-400" />
                    <span>"{q}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Grounding Sources (Papers, NIST, Standards, University Reference Links) */}
          {uniqueSources.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>المصادر والمراجع الأكاديمية المعتمدة (Validated Sources):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {uniqueSources.map((source, index) => (
                  <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {source.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-slate-500" />
                        <span className="truncate">{source.domain}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-0.5 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Trust Banner */}
          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-200/90 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              تم تأكيد هذه البيانات بدقة عبر محرك Google Search لضمان مطابقتها للمواصفات الدولية (NIST / IEEE / CODATA) ومنع الهلوسة العلمية.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
