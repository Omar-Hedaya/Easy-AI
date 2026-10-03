import { ThemeConfig } from '../types/themes';
import { THEMES } from '../constants/themes';
import { renderMarkdownWithMath } from './mathRenderer';

export interface ExportMessageOptions {
  title: string;
  theme: ThemeConfig;
  targetLanguage?: string;
  includeTimestamp?: boolean;
  forceExactInk?: boolean;
}

/**
 * Builds a standalone, print-ready HTML document for an individual message or synthesized response
 * with KaTeX math rendering, responsive tables, and full color intensity.
 */
export function generateStyledMessageHtml(
  content: string,
  options: ExportMessageOptions
): string {
  const { title, theme, targetLanguage = 'ar-EG', includeTimestamp = true, forceExactInk = true } = options;
  const rawTitle = title || '';
  const cleanTitle = (raw: string): string => {
    if (!raw) return 'ملخص المحاضرة';
    let t = raw
      .replace(/\.html$/i, '')
      .replace(/^Easy[_\s-]*(Response|Academic|Intelligence|Export)?[_\s-]*/gi, '')
      .replace(/^Easy_Response_[0-9_\s-]*/gi, '')
      .replace(/Easy_Response/gi, '')
      .replace(/Easy Academic Intelligence/gi, '')
      .replace(/Easy Academic/gi, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    return t || 'ملخص المحاضرة';
  };
  const displayTitle = cleanTitle(rawTitle);
  const isRtl = targetLanguage === 'ar-EG' || targetLanguage === 'ar-SA' || /[\u0600-\u06FF]/.test(content);
  const dateStr = new Date().toLocaleString();

  // Convert markdown to clean HTML structure with GFM tables and isolated KaTeX
  const formattedBody = renderMarkdownWithMath(content);
  const themesJson = JSON.stringify(THEMES);

  return `<!DOCTYPE html>
<html lang="${targetLanguage}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(displayTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/atom-one-dark.min.css" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
  <style>
    :root {
      --bg: ${theme.bgHex};
      --text: ${theme.textHex};
      --header-accent: ${theme.headerAccentHex};
      --card-bg: ${theme.cardBgHex};
      --card-border: ${theme.cardBorderHex};
      --table-header-bg: ${theme.tableHeaderBgHex};
      --table-header-text: ${theme.tableHeaderTextHex};
      --table-row-even: ${theme.tableRowEvenHex};
      --table-row-odd: ${theme.tableRowOddHex};
      --table-border: ${theme.tableBorderHex};
      --code-bg: ${theme.codeBgHex};
      --code-text: ${theme.codeTextHex};
      --code-border: ${theme.codeBorderHex};
      --katex-color: ${theme.katexColorHex};
      --badge-bg: ${theme.badgeBgHex};
      --badge-text: ${theme.badgeTextHex};
      --accent: ${theme.accentHex};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      ${forceExactInk ? '-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;' : ''}
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: ${isRtl ? "'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif" : "'Plus Jakarta Sans', system-ui, sans-serif"};
      line-height: 1.7;
      width: 100%;
      max-width: 100% !important;
      margin: 0;
      padding: 16px 12px;
      box-sizing: border-box;
    }

    header.doc-header {
      border-bottom: 2px solid var(--card-border);
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
    }

    .doc-brand {
      font-weight: 800;
      font-size: 14px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    h1.doc-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--header-accent);
      margin-top: 4px;
    }

    .doc-meta {
      font-size: 11px;
      color: var(--text);
      opacity: 0.7;
      font-family: 'JetBrains Mono', monospace;
    }

    .content-card {
      width: 100%;
      max-width: 100% !important;
      margin: 0;
      box-sizing: border-box;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px 16px;
      overflow-x: hidden; /* Prevents whole-page sideways rocking */
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      font-size: 14.5px;
    }

    .content-card p {
      margin-bottom: 14px;
    }

    .content-card h2, .content-card h3, .content-card h4 {
      color: var(--header-accent);
      margin-top: 22px;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .content-card pre, .content-card code {
      font-family: 'JetBrains Mono', monospace;
    }

    .content-card pre {
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      color: var(--code-text);
      border-radius: 8px;
      padding: 14px;
      overflow-x: auto;
      margin: 14px 0;
      font-size: 12.5px;
    }

    .content-card code:not(pre code) {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      border: 1px solid var(--code-border);
    }

    .code-block-container {
      margin: 16px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--code-border);
      background: #1e1e2e;
      direction: ltr !important;
      unicode-bidi: isolate !important;
      text-align: left;
    }

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px;
      background: #181825;
      border-bottom: 1px solid var(--code-border);
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #a6adc8;
      user-select: none;
    }

    .copy-code-btn {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #313244;
      color: #cdd6f4;
      border: 1px solid #45475a;
      cursor: pointer;
    }

    .copy-code-btn:hover {
      background: #45475a;
      color: #ffffff;
    }

    /* Isolate Math and LTR Blocks in RTL Documents (Strict Isolation) */
    .katex, pre, code {
      direction: ltr !important;
      unicode-bidi: isolate !important;
      text-align: left;
    }

    .katex-display {
      direction: ltr !important;
      unicode-bidi: isolate !important;
      width: 100% !important;
      text-align: center !important;
      display: flex !important;
      justify-content: center !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 8px 0;
      margin: 12px 0;
    }

    /* Table styles and responsive container */
    .table-container, .table-scroll-container {
      width: 100% !important;
      max-width: 100% !important;
      display: block;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
      margin: 16px 0;
      border-radius: 8px;
      border: 1px solid var(--table-border);
      scrollbar-width: thin;
    }

    table {
      width: 100%;
      min-width: 580px; /* Prevents column crushing, triggers smooth horizontal scroll inside table-container */
      border-collapse: collapse;
      table-layout: auto;
      margin: 10px 0;
      font-size: 13.5px;
    }

    th, td {
      white-space: normal !important;
      word-break: normal;
      overflow-wrap: break-word;
      text-align: ${isRtl ? 'right' : 'left'} !important;
      border: 1px solid var(--table-border);
    }

    th:first-child, td:first-child {
      min-width: 120px;
    }

    th {
      background: var(--table-header-bg);
      color: var(--table-header-text);
      padding: 10px 14px;
      border: 1px solid var(--table-border);
    }

    td {
      padding: 8px 14px;
      border: 1px solid var(--table-border);
    }

    tr:nth-child(even) {
      background: var(--table-row-even);
    }

    tr:nth-child(odd) {
      background: var(--table-row-odd);
    }

    footer.doc-footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      opacity: 0.65;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Semi-Transparent Bottom Floating Action Button (FAB) */
    .fab-btn {
      position: fixed;
      bottom: 20px;
      right: 18px;
      z-index: 10000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      opacity: 0.35; /* Semi-transparent so it never obstructs reading */
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .fab-btn:hover, .fab-btn:active {
      opacity: 0.95;
      transform: scale(1.08);
    }

    /* Collapsible Floating Panel (Opens only on click) */
    .doc-toolbar {
      display: none;
      position: fixed;
      bottom: 70px;
      right: 18px;
      left: 18px;
      max-width: 420px;
      margin: 0 auto;
      z-index: 9999;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
      border-radius: 14px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      box-shadow: 0 12px 32px rgba(0,0,0,0.22);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    @media print {
      body {
        padding: 0;
        background: var(--bg) !important;
        color: var(--text) !important;
      }
      .fab-btn, .doc-toolbar, #google_translate_element {
        display: none !important;
      }
      .content-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    }

    .notranslate, [translate="no"], .katex, .katex-display, .katex-isolated, pre, code, .code-block-container {
      direction: ltr !important;
      unicode-bidi: isolate !important;
      text-align: left !important;
    }

    .goog-te-banner-frame, .skiptranslate:not(#google_translate_element), iframe.goog-te-banner-frame {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      width: 0 !important;
    }
  </style>
</head>
<body>
  <!-- Semi-Transparent Bottom Floating Action Button (FAB) -->
  <button id="toolbar-fab-btn" class="fab-btn notranslate" translate="no" type="button" title="الإعدادات">
    ⚙️
  </button>

  <!-- Collapsible Floating Panel -->
  <div id="docToolbar" class="doc-toolbar notranslate" translate="no">
    <!-- Top bar inside panel with title and close button -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--card-border);padding-bottom:8px;margin-bottom:4px;">
      <span style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px;">
        ⚙️ الإعدادات
      </span>
      <button id="panel-close-btn" type="button" style="background:transparent;border:none;color:var(--text);font-size:16px;cursor:pointer;padding:2px 6px;border-radius:4px;opacity:0.75;" title="إغلاق">
        ✕
      </button>
    </div>

    <!-- Panel Controls -->
    <div style="display:flex;flex-direction:column;gap:10px;">
      <!-- ⛶ Fullscreen Toggle -->
      <button id="fs-toggle-btn" type="button" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--card-border);background:var(--bg);color:var(--text);cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;">
        ⛶ ملء الشاشة
      </button>

      <!-- Language Switcher -->
      <label style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;gap:8px;">
        <span style="display:flex;align-items:center;gap:4px;">🌐 اللغة:</span>
        <select id="doc-lang-select" style="flex:1;max-width:240px;padding:6px 10px;border-radius:8px;border:1px solid var(--card-border);background:var(--bg);color:var(--text);font-family:inherit;font-size:12px;">
          <option value="ar" ${isRtl ? 'selected' : ''}>🇪🇬 المصرية</option>
          <option value="en" ${!isRtl ? 'selected' : ''}>🇬🇧 English</option>
          <option value="de">🇩🇪 Deutsch</option>
        </select>
      </label>

      <!-- Exact 15-Theme Catalog -->
      <label style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;gap:8px;">
        <span style="display:flex;align-items:center;gap:4px;">🎨 المظهر:</span>
        <select id="doc-theme-select" style="flex:1;max-width:240px;padding:6px 10px;border-radius:8px;border:1px solid var(--card-border);background:var(--bg);color:var(--text);font-family:inherit;font-size:12px;">
          <optgroup label="Light Themes (8)">
            <option value="classic-ivory" selected>1. Classic Ivory</option>
            <option value="oxford-academic">2. Oxford Academic</option>
            <option value="mit-slate">3. MIT Slate</option>
            <option value="harvard-crimson">4. Harvard Crimson</option>
            <option value="cambridge-emerald">5. Cambridge Emerald</option>
            <option value="caltech-solar">6. Caltech Solar</option>
            <option value="royal-violet">7. Royal Violet</option>
            <option value="swiss-minimalist">8. Swiss Minimalist</option>
          </optgroup>
          <optgroup label="Dark & OLED Themes (7)">
            <option value="obsidian-oled">9. Pure OLED Obsidian</option>
            <option value="deep-midnight">10. Deep Midnight</option>
            <option value="matrix-cyber">11. Matrix Cyber</option>
            <option value="cyberpunk-neon">12. Cyberpunk Neon</option>
            <option value="nordic-frost">13. Nordic Frost</option>
            <option value="dark-crimson">14. Dracula Crimson</option>
            <option value="espresso-roast">15. Tokyo Night</option>
          </optgroup>
        </select>
      </label>
    </div>
  </div>

  <main class="content-card">
    <h1 class="doc-title" style="margin-top:0;margin-bottom:1.25rem;font-size:1.75rem;font-weight:800;color:var(--header-accent);line-height:1.3;">
      ${escapeHtml(displayTitle || 'الخلاصة الأكاديمية')}
    </h1>
    ${formattedBody}
  </main>

  <!-- Google Translate Element Anchor (Suppressed UI) -->
  <div id="google_translate_element" style="display:none; visibility:hidden; position:absolute; width:0; height:0; overflow:hidden;"></div>
  <script type="text/javascript">
    function googleTranslateElementInit() {
      new google.translate.TranslateElement({
        pageLanguage: 'ar',
        includedLanguages: 'ar,en,de',
        autoDisplay: false
      }, 'google_translate_element');
    }
  </script>
  <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

  <script>
    // Embedded 15-Theme Catalog for Live Switcher
    const THEMES_DATA = ${themesJson};
    const root = document.documentElement;
    const fabBtn = document.getElementById('toolbar-fab-btn');
    const docToolbar = document.getElementById('docToolbar') || document.querySelector('.doc-toolbar');
    const closeBtn = document.getElementById('panel-close-btn');
    const fsBtn = document.getElementById('fs-toggle-btn');
    const langSelect = document.getElementById('doc-lang-select');
    const themeSelect = document.getElementById('doc-theme-select');

    // FAB Button & Panel Collapse Handlers
    if (fabBtn && docToolbar) {
      fabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = getComputedStyle(docToolbar).display === 'none';
        docToolbar.style.display = isHidden ? 'flex' : 'none';
        fabBtn.style.opacity = isHidden ? '0.95' : '0.35';
      });
    }

    if (closeBtn && docToolbar) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        docToolbar.style.display = 'none';
        if (fabBtn) fabBtn.style.opacity = '0.35';
      });
    }

    document.addEventListener('click', (e) => {
      if (docToolbar && docToolbar.style.display === 'flex') {
        if (!docToolbar.contains(e.target) && e.target !== fabBtn) {
          docToolbar.style.display = 'none';
          if (fabBtn) fabBtn.style.opacity = '0.35';
        }
      }
    });

    // 1. Fullscreen Toggle
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen err:', err));
        } else {
          document.exitFullscreen().catch(err => console.log('Exit fullscreen err:', err));
        }
      });
      document.addEventListener('fullscreenchange', () => {
        fsBtn.textContent = document.fullscreenElement ? '✕ خروج من الشاشة' : '⛶ ملء الشاشة';
      });
    }

    // 2. Exact 15-Theme Switcher
    function applyTheme(themeKey) {
      const theme = THEMES_DATA.find(t => t.id === themeKey) || THEMES_DATA[0];
      if (!theme) return;
      root.style.setProperty('--bg', theme.bgHex);
      root.style.setProperty('--text', theme.textHex);
      root.style.setProperty('--header-accent', theme.headerAccentHex);
      root.style.setProperty('--card-bg', theme.cardBgHex);
      root.style.setProperty('--card-border', theme.cardBorderHex);
      root.style.setProperty('--table-header-bg', theme.tableHeaderBgHex);
      root.style.setProperty('--table-header-text', theme.tableHeaderTextHex);
      root.style.setProperty('--table-row-even', theme.tableRowEvenHex);
      root.style.setProperty('--table-row-odd', theme.tableRowOddHex);
      root.style.setProperty('--table-border', theme.tableBorderHex);
      root.style.setProperty('--code-bg', theme.codeBgHex);
      root.style.setProperty('--code-text', theme.codeTextHex);
      root.style.setProperty('--code-border', theme.codeBorderHex);
      root.style.setProperty('--katex-color', theme.katexColorHex);
      root.style.setProperty('--accent', theme.accentHex);
      root.style.setProperty('--accent-hover', theme.accentHoverHex || theme.accentHex);
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    }

    // 3. Language Switcher (ar = RTL, en/de = LTR with Google Translate)
    function switchLang(lang) {
      const docEl = document.documentElement;
      const bodyEl = document.body;
      if (lang === 'ar') {
        docEl.setAttribute('dir', 'rtl');
        docEl.setAttribute('lang', 'ar');
        bodyEl.style.textAlign = 'right';
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + location.hostname + ";";
        const combo = document.querySelector('.goog-te-combo');
        if (combo) { combo.value = 'ar'; combo.dispatchEvent(new Event('change')); }
      } else {
        docEl.setAttribute('dir', 'ltr');
        docEl.setAttribute('lang', lang);
        bodyEl.style.textAlign = 'left';
        document.cookie = "googtrans=/ar/" + lang + "; path=/;";
        document.cookie = "googtrans=/ar/" + lang + "; path=/; domain=" + location.hostname + ";";
        const combo = document.querySelector('.goog-te-combo');
        if (combo) { combo.value = lang; combo.dispatchEvent(new Event('change')); }
        else {
          setTimeout(() => {
            const retry = document.querySelector('.goog-te-combo');
            if (retry) { retry.value = lang; retry.dispatchEvent(new Event('change')); }
          }, 450);
        }
      }
    }

    if (langSelect) {
      langSelect.addEventListener('change', (e) => switchLang(e.target.value));
    }

    // Math & Code Protection
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.katex, .katex-display, .katex-isolated, pre, code, .code-block-container, table').forEach(el => {
        el.classList.add('notranslate');
        el.setAttribute('translate', 'no');
      });
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\\\(', right: '\\\\)', display: false},
            {left: '\\\\[', right: '\\\\]', display: true}
          ],
          throwOnError: false
        });
      }
    });
  </script>
</body>
</html>`;
}

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
 * Downloads message content as a formatted standalone HTML file
 */
export function downloadMessageHtml(
  content: string,
  title: string,
  theme: ThemeConfig
): void {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'Easy_Export';
  const htmlContent = generateStyledMessageHtml(content, { title, theme });
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizedTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Directly prints the message as a PDF using an isolated print iframe with full ink styling
 */
export function printMessageAsPdf(
  content: string,
  title: string,
  theme: ThemeConfig
): void {
  const htmlContent = generateStyledMessageHtml(content, { title, theme });
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Wait for KaTeX and fonts to render
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 600);
  }
}

/**
 * Downloads message as a clean Markdown (.md) file
 */
export function downloadMessageMarkdown(
  content: string,
  title: string
): void {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'Easy_Export';
  const mdHeader = `# ${title}\n*Exported from Easy Academic Intelligence on ${new Date().toLocaleString()}*\n\n---\n\n`;
  const blob = new Blob([mdHeader + content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizedTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
