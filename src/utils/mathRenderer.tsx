import React, { useMemo } from 'react';
import katex from 'katex';
import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with GFM and syntax highlighting via highlight.js
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const trimmedLang = (lang || '').trim().toLowerCase();
      const validLang = (trimmedLang && hljs.getLanguage(trimmedLang)) ? trimmedLang : '';
      let codeHtml = '';
      try {
        if (validLang) {
          codeHtml = hljs.highlight(text, { language: validLang, ignoreIllegals: true }).value;
        } else if (text.length < 2500) {
          codeHtml = hljs.highlightAuto(text).value;
        } else {
          codeHtml = escapeHtml(text);
        }
      } catch {
        codeHtml = escapeHtml(text);
      }

      const displayLang = validLang || trimmedLang || 'code';

      return `<div class="code-block-container my-4 rounded-xl border border-slate-700/70 overflow-hidden bg-[#1e1e2e] shadow-md" dir="ltr" style="direction: ltr !important; unicode-bidi: isolate !important; text-align: left;">
        <div class="code-header flex items-center justify-between px-3.5 py-1.5 bg-[#181825] border-b border-slate-700/60 text-xs font-mono text-slate-400 select-none">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span class="font-semibold text-slate-300 uppercase tracking-wider ml-1 text-[11px]">${escapeHtml(displayLang)}</span>
          </div>
          <button
            type="button"
            class="copy-code-btn text-[11px] px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            onclick="navigator.clipboard.writeText(this.closest('.code-block-container').querySelector('code').innerText); const orig=this.innerText; this.innerText='Copied!'; setTimeout(()=>this.innerText=orig, 2000);"
          >
            Copy
          </button>
        </div>
        <pre class="p-3.5 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-100 bg-[#1e1e2e]"><code class="hljs ${validLang}">${codeHtml}</code></pre>
      </div>`;
    },
    codespan({ text }: { text: string }) {
      return `<code class="px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-300 font-mono text-[0.88em] border border-slate-700/50" dir="ltr" style="direction: ltr !important; unicode-bidi: isolate !important;">${text}</code>`;
    }
  }
});

interface MathProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathProps> = ({ math, block = false, className = '' }) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math.trim(), containerRef.current, {
          displayMode: block,
          throwOnError: false,
          output: 'htmlAndMathml',
          strict: false,
        });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.textContent = math;
        }
      }
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`table-scroll-container my-3 py-2 px-1 text-center overflow-x-auto ${className}`}
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'center' }}
      >
        <span ref={containerRef} className="inline-block max-w-full font-serif" />
      </div>
    );
  }

  return (
    <span
      ref={containerRef}
      className={`inline-block font-serif ${className}`}
      dir="ltr"
      style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
    />
  );
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extracts math formulas, renders markdown with marked (with GFM tables),
 * wraps tables inside responsive scroll containers, and replaces formulas with isolated LTR KaTeX HTML.
 */
export function renderMarkdownWithMath(content: string): string {
  if (!content) return '';

  const mathPlaceholders: { token: string; html: string }[] = [];
  let tokenCounter = 0;

  // 1. Extract block math $$...$$
  let processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const token = `%%MATH_BLOCK_${tokenCounter++}%%`;
    let rendered = '';
    try {
      rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch {
      rendered = `<div class="katex-fallback font-mono">${escapeHtml(math)}</div>`;
    }
    const isolatedHtml = `<div class="katex-display table-scroll-container" dir="ltr" style="direction: ltr !important; unicode-bidi: isolate !important; text-align: center; overflow-x: auto; margin: 12px 0;">${rendered}</div>`;
    mathPlaceholders.push({ token, html: isolatedHtml });
    return `\n\n${token}\n\n`;
  });

  // 2. Extract inline math $...$
  processed = processed.replace(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g, (_, math) => {
    if (!math.trim()) return '$' + math + '$';
    const token = `%%MATH_INLINE_${tokenCounter++}%%`;
    let rendered = '';
    try {
      rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      rendered = `<span class="katex-fallback font-mono">${escapeHtml(math)}</span>`;
    }
    const isolatedHtml = `<span class="katex-isolated" dir="ltr" style="direction: ltr !important; unicode-bidi: isolate !important; text-align: left; display: inline-block;">${rendered}</span>`;
    mathPlaceholders.push({ token, html: isolatedHtml });
    return token;
  });

  // 3. Parse Markdown using marked
  let html = marked.parse(processed, { async: false }) as string;

  // 4. Wrap any <table> in a responsive table-container with overflow-x: auto
  html = html.replace(/<table(\s*[^>]*)>([\s\S]*?)<\/table>/gi, (match) => {
    return `<div class="table-container table-scroll-container overflow-x-auto my-3">${match}</div>`;
  });

  // Strip hardcoded align="..." attributes from th and td generated by marked
  html = html.replace(/<(th|td)(\s+[^>]*)>/gi, (match, tag, rest) => {
    const cleaned = rest.replace(/\balign="[^"]*"/gi, '').trim();
    return `<${tag}${cleaned ? ' ' + cleaned : ''}>`;
  });

  // 5. Restore math placeholders
  for (const { token, html: mathHtml } of mathPlaceholders) {
    html = html.split(token).join(mathHtml);
  }

  return html;
}

/**
 * RichMathText component that renders GFM Markdown with real tables and KaTeX formulas
 * with strict LTR isolation for RTL contexts.
 */
export const RichMathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const renderedHtml = useMemo(() => renderMarkdownWithMath(text), [text]);

  return (
    <div
      className={`markdown-body leading-relaxed space-y-3 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
