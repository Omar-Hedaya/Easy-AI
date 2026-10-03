import { CurriculumAnalysisResult, ThemeConfig } from '../types/themes';
import { THEMES } from '../constants/themes';
import { renderMarkdownWithMath } from './mathRenderer';

export function generateStandaloneHtml(
  data: CurriculumAnalysisResult,
  activeTheme: ThemeConfig,
  fileName: string
): string {
  const isRtl = data.targetLanguage === 'ar-EG' || data.targetLanguage === 'ar-SA';
  const themesJson = JSON.stringify(THEMES);

  // Sanitize and clean document title, stripping platform branding
  const rawTitle = fileName || data.title || '';
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

  // Render formula rows
  const formulaRowsHtml = data.masterFormulaLedger
    .map(
      (f) => `
    <div class="formula-card" data-eq-id="${f.id}">
      <div class="formula-header">
        <span class="formula-badge">${f.id}</span>
        <h4 class="formula-name">${escapeHtml(f.name)}</h4>
      </div>
      <div class="formula-math-display table-scroll-container">
        $$${f.latex}$$
      </div>
      <div class="formula-details">
        <div class="formula-vars">
          <strong>Constituent Variables:</strong>
          <ul>
            ${f.variables
              .map(
                (v) =>
                  `<li><span class="var-sym">$${v.symbol}$</span>: ${escapeHtml(v.meaning)}${
                    v.unit ? ` <em class="var-unit">(${escapeHtml(v.unit)})</em>` : ''
                  }</li>`
              )
              .join('')}
          </ul>
        </div>
        <div class="formula-context">
          <strong>Application & Bounds:</strong> ${escapeHtml(f.context)}
        </div>
      </div>
    </div>
  `
    )
    .join('');

  // Render theorems & laws
  const theoremsHtml = data.coreTheoremsAndLaws
    .map(
      (t) => `
    <div class="theorem-card">
      <div class="theorem-header">
        <h4 class="theorem-name">${escapeHtml(t.name)}</h4>
        ${
          t.formulaRefId
            ? `<span class="theorem-ref-badge" title="Derived from Master Ledger">Cites: ${escapeHtml(
                t.formulaRefId
              )}</span>`
            : ''
        }
      </div>
      <p class="theorem-statement"><strong>Statement / Law:</strong> ${escapeHtml(t.statement)}</p>
      <div class="theorem-intuitive">
        <strong>Intuitive Analysis:</strong> ${escapeHtml(t.intuitiveExplanation)}
      </div>
    </div>
  `
    )
    .join('');

  // Render comparative matrix table
  const tableHeadersHtml = data.matrixAnalysisTable.headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join('');

  const tableRowsHtml = data.matrixAnalysisTable.rows
    .map(
      (r, idx) => `
      <tr class="${idx % 2 === 0 ? 'even-row' : 'odd-row'}">
        ${r.map((cell) => `<td>${formatLatexInCell(cell)}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  // Format deep markdown content with GFM tables and KaTeX isolation
  const deepContentHtml = renderMarkdownWithMath(data.deepCurriculumContent);

  return `<!DOCTYPE html>
<html lang="${data.targetLanguage}" dir="${isRtl ? 'rtl' : 'ltr'}">
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
    /* =========================================================================
       EASY EXPORT ENGINE: HIGH-FIDELITY NON-CONSERVING INK CSS STYLES
       ========================================================================= */
    :root {
      --bg: ${activeTheme.bgHex};
      --text: ${activeTheme.textHex};
      --header-accent: ${activeTheme.headerAccentHex};
      --card-bg: ${activeTheme.cardBgHex};
      --card-border: ${activeTheme.cardBorderHex};
      --table-header-bg: ${activeTheme.tableHeaderBgHex};
      --table-header-text: ${activeTheme.tableHeaderTextHex};
      --table-row-even: ${activeTheme.tableRowEvenHex};
      --table-row-odd: ${activeTheme.tableRowOddHex};
      --table-border: ${activeTheme.tableBorderHex};
      --code-bg: ${activeTheme.codeBgHex};
      --code-text: ${activeTheme.codeTextHex};
      --code-border: ${activeTheme.codeBorderHex};
      --katex-color: ${activeTheme.katexColorHex};
      --badge-bg: ${activeTheme.badgeBgHex};
      --badge-text: ${activeTheme.badgeTextHex};
      --accent: ${activeTheme.accentHex};
      --accent-hover: ${activeTheme.accentHoverHex};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: ${isRtl ? "'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif" : "'Plus Jakarta Sans', system-ui, sans-serif"};
      line-height: 1.7;
      width: 100%;
      max-width: 100% !important;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      min-height: 100vh;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    .content-card {
      width: 100%;
      max-width: 100% !important;
      margin: 0;
      box-sizing: border-box;
      padding: 20px 16px;
      overflow-x: hidden; /* Prevents whole-page sideways rocking */
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

    .table-container, .table-scroll-container {
      width: 100% !important;
      max-width: 100% !important;
      display: block;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
      margin: 16px 0;
      border-radius: 8px;
      scrollbar-width: thin;
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

    /* Google Translate Element Suppression & Strict Isolation */
    .goog-te-banner-frame, .goog-te-banner, .skiptranslate:not(#google_translate_element), iframe.goog-te-banner-frame {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      width: 0 !important;
    }
    body {
      top: 0 !important;
      position: static !important;
    }
    .goog-tooltip, .goog-tooltip:hover {
      display: none !important;
    }
    .goog-text-highlight {
      background-color: transparent !important;
      box-shadow: none !important;
    }

    /* STRICT ISOLATION FOR MATH, EQUATIONS, AND CODE */
    .notranslate,
    [translate="no"],
    .katex,
    .katex-display,
    .katex-isolated,
    pre,
    code,
    .code-block-container,
    .matrix-table,
    .formula-badge,
    .equation-id {
      direction: ltr !important;
      unicode-bidi: isolate !important;
      text-align: left !important;
    }

    /* Page Layout: Zero blank side margins */
    .document-wrapper {
      width: 100%;
      max-width: 100% !important;
      margin: 0;
      padding: 16px 16px 80px 16px;
      box-sizing: border-box;
    }

    /* Header Zone */
    .doc-hero {
      border-bottom: 2px solid var(--card-border);
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .doc-meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--header-accent);
      font-weight: 600;
    }

    .doc-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--header-accent);
      line-height: 1.25;
      margin-bottom: 12px;
    }

    .executive-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 28px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--header-accent);
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }

    /* Anti-repetition formula cards */
    .formula-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .formula-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .formula-badge {
      background: var(--badge-bg);
      color: var(--badge-text);
      font-weight: 700;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .formula-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--header-accent);
    }

    .formula-math-display {
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 6px;
      padding: 12px;
      margin: 10px 0;
      text-align: center;
      color: var(--katex-color);
      font-size: 1.15em;
    }

    .formula-details {
      font-size: 13px;
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    @media (max-width: 768px) {
      .formula-details {
        grid-template-columns: 1fr;
      }
    }

    .formula-vars ul {
      margin-top: 4px;
      padding-left: ${isRtl ? '0' : '20px'};
      padding-right: ${isRtl ? '20px' : '0'};
    }

    /* Theorems */
    .theorem-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 16px;
      break-inside: avoid;
    }

    .theorem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .theorem-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--header-accent);
    }

    .theorem-ref-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: var(--badge-bg);
      color: var(--badge-text);
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Table Scroll Container */
    .table-scroll-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 18px 0;
      border-radius: 8px;
      border: 1px solid var(--table-border);
      scrollbar-width: thin;
    }

    table.matrix-table, table {
      width: 100%;
      min-width: 580px; /* Prevents column crushing, triggers smooth horizontal scroll inside table-container */
      border-collapse: collapse;
      table-layout: auto;
      margin: 12px 0;
      font-size: 13.5px;
    }

    table.matrix-table th, table th,
    table.matrix-table td, table td {
      white-space: normal !important;
      word-break: normal;
      overflow-wrap: break-word;
      text-align: ${isRtl ? 'right' : 'left'} !important;
      border: 1px solid var(--table-border);
    }

    table.matrix-table th:first-child, table th:first-child,
    table.matrix-table td:first-child, table td:first-child {
      min-width: 120px;
    }

    table.matrix-table th, table th {
      background: var(--table-header-bg);
      color: var(--table-header-text);
      padding: 12px 16px;
      font-weight: 700;
      border-bottom: 2px solid var(--table-border);
    }

    table.matrix-table td, table td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--table-border);
    }

    table.matrix-table tr.even-row {
      background: var(--table-row-even);
    }

    table.matrix-table tr.odd-row {
      background: var(--table-row-odd);
    }

    /* Deep content */
    .deep-narrative {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 22px 24px;
      line-height: 1.8;
      font-size: 15px;
    }

    .audit-box {
      margin-top: 36px;
      padding: 14px 18px;
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 6px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }

    /* Print Overrides: High-fidelity rich colors, zero ink restrictions */
    @media print {
      body {
        padding-top: 0 !important;
        background: var(--bg) !important;
        color: var(--text) !important;
      }

      .fab-btn, .ghost-trigger-btn, .doc-toolbar, #easy-export-toolbar, #google_translate_element {
        display: none !important;
      }

      .document-wrapper {
        max-width: 100% !important;
        padding: 0 !important;
      }

      .formula-card, .theorem-card, .executive-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      table.matrix-table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Semi-Transparent Bottom Floating Action Button (FAB) -->
  <button id="toolbar-fab-btn" class="fab-btn notranslate" translate="no" type="button" title="الإعدادات">
    ⚙️
  </button>

  <!-- Collapsible Floating Panel (Opens only on click) -->
  <nav id="docToolbar" class="doc-toolbar notranslate" translate="no">
    <!-- Top bar inside panel with title and close button -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--card-border);padding-bottom:8px;margin-bottom:2px;">
      <span style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px;">
        ⚙️ الإعدادات
      </span>
      <button id="panel-close-btn" type="button" style="background:transparent;border:none;color:var(--text);font-size:16px;cursor:pointer;padding:2px 6px;border-radius:4px;opacity:0.75;" title="إغلاق">
        ✕
      </button>
    </div>

    <!-- Panel Controls -->
    <div style="display:flex;flex-direction:column;gap:10px;">
      <!-- ⛶ ملء الشاشة Button -->
      <button id="fs-toggle-btn" type="button" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--card-border);background:var(--bg);color:var(--text);cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-family:inherit;">
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
  </nav>

  <!-- Document Body with Zero Side Margin Waste -->
  <main class="document-wrapper">
    <h1 class="doc-title" style="margin-top:0;margin-bottom:1.5rem;font-size:2rem;font-weight:800;color:var(--header-accent);line-height:1.3;">
      ${escapeHtml(displayTitle || 'الخلاصة الأكاديمية للمنهج')}
    </h1>

    <!-- Executive Summary -->
    <section class="executive-card">
      <h3 style="color: var(--header-accent); font-size: 18px; margin-bottom: 8px; font-weight: 700;">
        ${isRtl ? 'الملخص التنفيذي للمنهج' : 'Executive Curriculum Synthesis'}
      </h3>
      <p style="font-size: 15px; line-height: 1.7;">${escapeHtml(data.executiveSummary)}</p>
    </section>

    <!-- Anti-Repetition Master Formula Ledger -->
    <section>
      <h2 class="section-title">
        <span>📐</span>
        ${isRtl ? 'سجل القوانين والمعادلات الموحد (بلا تكرار)' : 'Master Formula & Law Ledger (Strict Anti-Repetition)'}
      </h2>
      <div class="formula-grid">
        ${formulaRowsHtml}
      </div>
    </section>

    <!-- Core Theorems & Principles (Formulas Cited Only) -->
    <section>
      <h2 class="section-title">
        <span>📜</span>
        ${isRtl ? 'النظريات والمبادئ العلمية الأساسية' : 'Core Theorems, Laws & Clinical Principles'}
      </h2>
      <div>
        ${theoremsHtml}
      </div>
    </section>

    <!-- Comparative Matrix Table with Horizontal Scroll -->
    <section>
      <h2 class="section-title">
        <span>📊</span>
        ${isRtl ? 'مصفوفة المقارنة والتحليل الأفقي' : 'Comparative Synthesis Matrix'}
      </h2>
      <div class="table-scroll-container">
        <table class="matrix-table">
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Deep Analytical Narrative -->
    <section>
      <h2 class="section-title">
        <span>📖</span>
        ${isRtl ? 'الشرح التحليلي والتطبيقات العملية' : 'Comprehensive Analytical Narrative & Applications'}
      </h2>
      <div class="deep-narrative">
        ${deepContentHtml}
      </div>
    </section>
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
    // Embedded Theme Database for On-the-Fly Switching
    const THEMES_DATA = ${themesJson};
    const root = document.documentElement;
    const fabBtn = document.getElementById('toolbar-fab-btn');
    const docToolbar = document.getElementById('docToolbar') || document.querySelector('.doc-toolbar');
    const closeBtn = document.getElementById('panel-close-btn');
    const fsBtn = document.getElementById('fs-toggle-btn') || document.getElementById('fullscreenBtn');
    const langSelect = document.getElementById('doc-lang-select') || document.getElementById('languageSelector');
    const themeSelect = document.getElementById('doc-theme-select') || document.getElementById('themeSelector');

    // FAB Button & Collapsible Panel Handlers
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

    // 1. Live Theme Switcher Handler (All 15 App Themes)
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const keyMap = { ivory: 'classic-ivory', dark: 'deep-midnight', neon: 'cyberpunk-neon', minimal: 'swiss-minimalist' };
        const resolvedId = keyMap[val] || val;
        const theme = THEMES_DATA.find(t => t.id === resolvedId) || THEMES_DATA[0];
        if (!theme) return;
        applyTheme(theme);
      });
    }

    function applyTheme(theme) {
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
      root.style.setProperty('--badge-bg', theme.badgeBgHex);
      root.style.setProperty('--badge-text', theme.badgeTextHex);
      root.style.setProperty('--accent', theme.accentHex);
      root.style.setProperty('--accent-hover', theme.accentHoverHex);
    }

    // 2. Language Switcher & Translator Engine (Egyptian Arabic / English / German)
    function switchLanguage(targetLang) {
      const docEl = document.documentElement;
      const bodyEl = document.body;

      if (targetLang === 'ar') {
        docEl.setAttribute('dir', 'rtl');
        docEl.setAttribute('lang', 'ar');
        bodyEl.style.textAlign = 'right';
        bodyEl.style.fontFamily = "'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif";

        // Reset translation cookies to restore original Egyptian Arabic text
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + location.hostname + ";";

        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = 'ar';
          combo.dispatchEvent(new Event('change'));
        }
      } else {
        docEl.setAttribute('dir', 'ltr');
        docEl.setAttribute('lang', targetLang);
        bodyEl.style.textAlign = 'left';
        bodyEl.style.fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";

        document.cookie = "googtrans=/ar/" + targetLang + "; path=/;";
        document.cookie = "googtrans=/ar/" + targetLang + "; path=/; domain=" + location.hostname + ";";

        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change'));
        } else {
          setTimeout(() => {
            const retryCombo = document.querySelector('.goog-te-combo');
            if (retryCombo) {
              retryCombo.value = targetLang;
              retryCombo.dispatchEvent(new Event('change'));
            }
          }, 450);
        }
      }
    }

    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        switchLanguage(e.target.value);
      });
    }

    // 3. Fullscreen Toggle Handler
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
        } else {
          document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
        }
      });
    }

    document.addEventListener('fullscreenchange', () => {
      if (fsBtn) {
        fsBtn.textContent = document.fullscreenElement ? '✕ خروج من الشاشة' : '⛶ ملء الشاشة';
      }
    });

    // 4. Instant Print / PDF Handler
    if (printPdfBtn) {
      printPdfBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // 5. KaTeX Math Render & Strict Isolation for Code and Equations
    document.addEventListener('DOMContentLoaded', () => {
      // Enforce notranslate on all code, KaTeX math blocks, and tables
      document.querySelectorAll('.katex, .katex-display, .katex-isolated, pre, code, .code-block-container, .matrix-table').forEach(el => {
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

function formatLatexInCell(cell: string): string {
  if (!cell) return '';
  // Check if cell already contains math
  if (cell.includes('$')) return cell;
  // If cell looks like formula or matrix notation, wrap appropriately
  return escapeHtml(cell);
}
