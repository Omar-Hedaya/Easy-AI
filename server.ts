import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Robust Fallback Model Chain (Exact list of available Gemini models in priority order)
const AVAILABLE_GEMINI_MODELS = [
  'gemini-3.8-flash', // Primary / Default (High speed & performance)
  'gemini-3.7-flash', // Fallback 1
  'gemini-3.6-flash', // Fallback 2
  'gemini-3.5-flash', // Fallback 3
  'gemini-3.5-flash-lite', // Fallback 4 (Ultra Fast)
  'gemini-3.1-flash-lite', // Fallback 5 (Resilient Base)
];

interface FailoverRecord {
  model: string;
  error: string;
  is404: boolean;
  is503Or429: boolean;
  nextModel?: string;
}

interface FallbackOptions {
  preferredModel?: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
  openRouterKey?: string;
  groqKey?: string;
}

interface FallbackResult {
  text: string;
  modelUsed: string;
  switchedDueTo404: boolean;
  switchedFrom?: string;
  failovers: FailoverRecord[];
}

/**
 * Builds the failover sequence starting with user's preferred model or the primary default,
 * followed sequentially down through the remaining available Gemini models.
 */
function buildModelChain(preferredModel?: string): string[] {
  if (!preferredModel || !AVAILABLE_GEMINI_MODELS.includes(preferredModel)) {
    return [...AVAILABLE_GEMINI_MODELS];
  }
  const idx = AVAILABLE_GEMINI_MODELS.indexOf(preferredModel);
  return [
    ...AVAILABLE_GEMINI_MODELS.slice(idx),
    ...AVAILABLE_GEMINI_MODELS.slice(0, idx),
  ];
}

/**
 * Helper to extract clean text for external fallback providers (Groq/OpenRouter)
 * without sending raw massive Base64 strings.
 */
function extractCleanTextForExternal(contents: any): string {
  if (typeof contents === 'string') return contents;
  if (Array.isArray(contents)) {
    return contents
      .map((item: any) => {
        if (item.parts && Array.isArray(item.parts)) {
          return item.parts
            .map((p: any) => {
              if (p.text) return p.text;
              if (p.inlineData) return `[Attached File: ${p.inlineData.mimeType || 'Document'}]`;
              return '';
            })
            .filter(Boolean)
            .join('\n');
        }
        return item.content || '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  if (contents && contents.parts && Array.isArray(contents.parts)) {
    return contents.parts
      .map((p: any) => {
        if (p.text) return p.text;
        if (p.inlineData) return `[Attached File: ${p.inlineData.mimeType || 'Document'}]`;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return String(contents);
}

/**
 * Execute Gemini calls with automatic, sequential failover across models.
 * Automatically resolves:
 * - HTTP 404 (Not Found / Model Unavailable in account) -> immediate failover down chain
 * - HTTP 503 (High Demand / Service Unavailable)
 * - HTTP 429 (Rate Limit / Quota Exceeded)
 * 
 * Preserves all PDF and multimodal Base64 inlineData across every fallback attempt.
 */
async function generateWithFallback(
  contents: any,
  options: FallbackOptions = {}
): Promise<FallbackResult> {
  let lastError: any = null;
  const failovers: FailoverRecord[] = [];
  let switchedDueTo404 = false;
  let switchedFrom: string | undefined = undefined;

  const modelChain = buildModelChain(options.preferredModel);
  console.log(`[Easy AI Engine] Starting inference chain (${modelChain.join(' → ')})`);

  // 1. Try Gemini chain sequentially
  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    const nextModel = modelChain[i + 1];

    try {
      console.log(`[Easy AI Engine] Attempting inference with model: ${model}`);

      // Deep clone contents on every attempt to guarantee pristine preservation of all
      // multimodal PDF and image inlineData (Base64) across every fallback switch.
      const payloadContents =
        typeof contents === 'object' && contents !== null
          ? JSON.parse(JSON.stringify(contents))
          : contents;

      const config: any = {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: 8192,
      };

      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: payloadContents,
        config,
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        console.log(`[Easy AI Engine] Successful response from model: ${model}`);
        return {
          text,
          modelUsed: model,
          switchedDueTo404,
          switchedFrom,
          failovers,
        };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const status = err?.status || err?.statusCode || err?.code || 0;

      const is404 =
        status === 404 ||
        errMsg.includes('404') ||
        errMsg.includes('NOT_FOUND') ||
        errMsg.includes('not found') ||
        errMsg.includes('is not found for API version') ||
        errMsg.includes('is not supported') ||
        errMsg.includes('Model Unavailable');

      const is503Or429 =
        status === 503 ||
        status === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('Overloaded') ||
        errMsg.includes('quota') ||
        errMsg.includes('rate limit');

      if (is404) {
        switchedDueTo404 = true;
        if (!switchedFrom) switchedFrom = model;
        console.warn(
          `[Easy AI Engine] Model ${model} returned HTTP 404 (Not Found / Unavailable). Triggering immediate failover down the chain to ${nextModel || 'next'}...`
        );
      } else {
        console.warn(
          `[Easy AI Engine] Model ${model} encountered error (${is503Or429 ? 'transient 503/429' : 'error'}): ${errMsg}. Failing over...`
        );
      }

      failovers.push({
        model,
        error: errMsg,
        is404,
        is503Or429,
        nextModel,
      });

      // For 404, fail over immediately without waiting. For 503/429, short pause to let rate limit clear.
      if (!is404) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  // 2. Only attempt external fallbacks (OpenRouter / Groq) IF those keys were explicitly provided
  const openRouterApiKey = options.openRouterKey || process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    try {
      console.log('[Easy AI Engine] Invoking OpenRouter Fallback Provider...');
      const promptString = extractCleanTextForExternal(contents);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://easy.academic.engine',
          'X-Title': 'Easy Academic Engine',
        },
        body: JSON.stringify({
          model: 'google/gemini-3.8-flash',
          messages: [
            ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
            { role: 'user', content: promptString },
          ],
          temperature: options.temperature ?? 0.2,
          ...(options.responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          console.log('[Easy AI Engine] Successfully answered via OpenRouter fallback.');
          return {
            text,
            modelUsed: 'openrouter/google/gemini-3.8-flash',
            switchedDueTo404,
            switchedFrom,
            failovers,
          };
        }
      }
    } catch (openRouterErr) {
      console.error('[Easy AI Engine] OpenRouter fallback failed:', openRouterErr);
    }
  }

  // 3. Try Groq if key is provided
  const groqApiKey = options.groqKey || process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      console.log('[Easy AI Engine] Invoking Groq Fallback Provider...');
      const promptString = extractCleanTextForExternal(contents);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
            { role: 'user', content: promptString },
          ],
          temperature: options.temperature ?? 0.2,
          ...(options.responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          console.log('[Easy AI Engine] Successfully answered via Groq fallback.');
          return {
            text,
            modelUsed: 'groq/llama-3.3-70b-versatile',
            switchedDueTo404,
            switchedFrom,
            failovers,
          };
        }
      }
    } catch (groqErr) {
      console.error('[Easy AI Engine] Groq fallback failed:', groqErr);
    }
  }

  throw new Error(
    `All available Gemini models in the fallback chain (${AVAILABLE_GEMINI_MODELS.join(' → ')}) failed or were unavailable. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

const EGYPTIAN_ARABIC_DIRECTIVE = `
اللغة المستهدفة للشرح والمحادثة: العامية المصرية الأكاديمية الراقية والذكية (Egyptian Arabic عامية مصرية).
- اشرح المفاهيم بأسلوب علمي مصري سلس ومحبوب وعميق (زي أسلوب كبار أساتذة الهندسة والطب في مصر: "بص يا فنان / يا هندسة / يا دكتور"، "الفكرة كلها في القانون ده إن...", "خد بالك من التريكاية دي").
- المصطلحات التقنية والمعادلات الرياضية وأسماء القوانين والمتغيرات تُكتب كما هي بدقة فائقة باللغة الإنجليزية ورموز LaTeX الدولية ($...$ أو $$...$$).
- التزم التزاماً صارماً بقاعدة عدم التكرار (Zero Formula Duplication): كل قانون يُكتب بصيغته الرياضية مرة واحدة فقط ويُشار إليه بـ [EQ-x] عند الحاجة.
`;

// ==========================================
// 1. Conversational Chat & Universal Ingestion API
// ==========================================
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, targetLanguage = 'ar-EG', externalKeys, requestSynthesis = false, preferredModel } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const systemInstruction = `You are an Elite Academic Curriculum Engine. When the user provides lecture slides, PDFs, or raw material, generate a 100% comprehensive, exhaustive, and professionally structured academic summary directly—without requiring external summarization tools.

Follow these strict output rules:
1. Zero Omission Policy: Never drop, shorten, or skip any formulas, rules, tables, parameters, component definitions, or edge-case warnings. Retain every single technical detail from the source.
2. Structured Markdown Tables: 
   - Group related components, measurement instruments, operational states, physical quantities, and color bands into structured Markdown tables.
   - Every table must have explicit column headers and clear, crisp cell entries.
3. Standardized LaTeX Equations:
   - Render all math formulas, unit derivations, and variables in clean LaTeX ($...$ inline or $$...$$ display blocks).
   - Label key equations sequentially (e.g., [EQ-1], [EQ-2]) when referencing them in subsequent derivations.
   - Strictly avoid repeating raw equation blocks; reference [EQ-x] once defined.
4. Dedicated High-Yield Sections:
   Conclude every lecture synthesis with 3 mandatory analytical blocks:
   - "Scaling & Exam Traps": proportional relationships, constant-variable conditions, and common pitfalls.
   - "Efficiency, Balances & Conversion Rules": all conversion factors (e.g., horsepower to watts) and governing conservation laws.
   - "Final Golden Checks": practical heuristics, sign conventions, and verification steps for problem-solving.
5. Tone & Language:
   - Deliver clear, authoritative academic Arabic explanations (العامية المصرية الأكاديمية الراقية والذكية) mixed smoothly with standard English technical terms and symbols.`;

    // Format contents from messages history and attachments
    const formattedContents: any[] = [];

    for (const msg of messages) {
      const parts: any[] = [];

      // If user message has attachments (universal file support)
      if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          // Native Multimodal Support for Images and PDF files via inlineData
          if (att.base64Data && att.mimeType && (att.mimeType.startsWith('image/') || att.mimeType === 'application/pdf')) {
            const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: att.mimeType,
              },
            });
          }

          // Clean extracted text (from pdfjs-dist, code, txt, md, etc.) without artificial truncation
          if (att.textContent && att.textContent.trim()) {
            parts.push({
              text: `[Attached Ingested Content: "${att.name}" (${att.type || 'file'})]\n${att.textContent}`,
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      formattedContents.push({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
        parts,
      });
    }

    const { text, modelUsed, switchedDueTo404, switchedFrom, failovers } = await generateWithFallback(formattedContents, {
      preferredModel,
      systemInstruction: `${systemInstruction}\n${EGYPTIAN_ARABIC_DIRECTIVE}`,
      temperature: 0.3,
      openRouterKey: externalKeys?.openRouterKey,
      groqKey: externalKeys?.groqKey,
    });

    res.json({
      reply: text,
      modelUsed,
      switchedDueTo404,
      switchedFrom,
      failovers,
    });
  } catch (err: any) {
    console.error('[Easy AI Engine] /api/chat error:', err);
    res.status(500).json({
      error: err?.message || 'Inference engine encountered an issue. Please try again.',
    });
  }
});

// ==========================================
// 2. Core Curriculum Synthesis API (Structured with Anti-Repetition)
// ==========================================
app.post('/api/curriculum/analyze', async (req: Request, res: Response) => {
  try {
    const {
      title,
      discipline,
      targetLanguage = 'ar-EG',
      level,
      focus,
      rawContent,
      externalKeys,
      preferredModel,
      attachments,
    } = req.body;

    if (!rawContent || typeof rawContent !== 'string') {
      res.status(400).json({ error: 'Missing curriculum raw content.' });
      return;
    }

    const systemInstruction = `You are an Elite Academic Curriculum Engine and lead mathematical architect for "Easy".
When given lecture slides, PDFs, code, or raw curriculum material, generate a 100% comprehensive, exhaustive, and professionally structured academic synthesis adhering to the following strict output rules:

1. Zero Omission Policy: Never drop, shorten, or skip any formulas, rules, tables, parameters, component definitions, or edge-case warnings. Retain every single technical detail from the source.
2. Structured Markdown Tables: 
   - Group related components, measurement instruments, operational states, physical quantities, and color bands into structured Markdown tables.
   - Every table must have explicit column headers and clear, crisp cell entries.
3. Standardized LaTeX Equations & Strict Anti-Repetition:
   - Render all math formulas, unit derivations, and variables in clean LaTeX ($...$ inline or $$...$$ display blocks).
   - In "masterFormulaLedger", assign each unique formula an immutable ID: [EQ-1], [EQ-2], [EQ-3], etc.
   - In subsequent sections, cite equations by their [EQ-x] identifier rather than rewriting raw formula blocks.
4. Dedicated High-Yield Sections:
   In the "deepCurriculumContent" breakdown, conclude with 3 mandatory analytical blocks:
   - "Scaling & Exam Traps": proportional relationships, constant-variable conditions, and common pitfalls.
   - "Efficiency, Balances & Conversion Rules": all conversion factors (e.g., horsepower to watts) and governing conservation laws.
   - "Final Golden Checks": practical heuristics, sign conventions, and verification steps for problem-solving.
5. Tone & Language:
   - Deliver clear, authoritative academic Arabic explanations (العامية المصرية الأكاديمية الراقية والذكية) mixed smoothly with standard English technical terms and symbols.`;

    const userPrompt = `DISCIPLINE: ${discipline || 'Academic Curriculum'}
COURSE/MODULE TITLE: ${title || 'Comprehensive Curriculum Analysis'}
ACADEMIC LEVEL: ${level || 'Undergraduate / Professional'}
PEDAGOGICAL FOCUS: ${focus || 'Comprehensive Theory & Mathematical Precision'}

SOURCE CONTENT / INGESTED SYLLABUS:
"""
${rawContent}
"""

Synthesize this curriculum into a 100% exhaustive, professionally structured academic summary directly adhering to all 5 output rules with zero omissions, complete structured tables, and the 3 mandatory high-yield analytical blocks.`;

    let curriculumContents: any = userPrompt;
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const parts: any[] = [];
      for (const att of attachments) {
        if (att.base64Data && att.mimeType && (att.mimeType === 'application/pdf' || att.mimeType.startsWith('image/'))) {
          const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: att.mimeType,
            },
          });
        }
      }
      parts.push({ text: userPrompt });
      curriculumContents = { parts };
    }

    const { text, modelUsed, switchedDueTo404, switchedFrom, failovers } = await generateWithFallback(curriculumContents, {
      preferredModel,
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          discipline: { type: Type.STRING },
          targetLanguage: { type: Type.STRING },
          level: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          masterFormulaLedger: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                latex: { type: Type.STRING },
                variables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      symbol: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      unit: { type: Type.STRING },
                    },
                    required: ['symbol', 'meaning'],
                  },
                },
                context: { type: Type.STRING },
              },
              required: ['id', 'name', 'latex', 'variables', 'context'],
            },
          },
          coreTheoremsAndLaws: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                statement: { type: Type.STRING },
                formulaRefId: { type: Type.STRING },
                intuitiveExplanation: { type: Type.STRING },
              },
              required: ['name', 'statement', 'intuitiveExplanation'],
            },
          },
          matrixAnalysisTable: {
            type: Type.OBJECT,
            properties: {
              headers: { type: Type.ARRAY, items: { type: Type.STRING } },
              rows: {
                type: Type.ARRAY,
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            required: ['headers', 'rows'],
          },
          deepCurriculumContent: { type: Type.STRING },
          uniquenessValidationLedger: {
            type: Type.OBJECT,
            properties: {
              totalUniqueFormulasFound: { type: Type.INTEGER },
              duplicateFormulasPrevented: { type: Type.INTEGER },
              verificationNotice: { type: Type.STRING },
            },
            required: ['totalUniqueFormulasFound', 'duplicateFormulasPrevented', 'verificationNotice'],
          },
        },
        required: [
          'title',
          'discipline',
          'targetLanguage',
          'level',
          'executiveSummary',
          'masterFormulaLedger',
          'coreTheoremsAndLaws',
          'matrixAnalysisTable',
          'deepCurriculumContent',
          'uniquenessValidationLedger',
        ],
      },
      openRouterKey: externalKeys?.openRouterKey,
      groqKey: externalKeys?.groqKey,
    });

    const parsedData = JSON.parse(text);
    parsedData._modelUsed = modelUsed;
    parsedData._switchedDueTo404 = switchedDueTo404;
    parsedData._switchedFrom = switchedFrom;
    parsedData._failovers = failovers;
    res.json(parsedData);
  } catch (error: any) {
    console.error('[Easy AI Engine] Curriculum analyze error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to synthesize curriculum.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Easy academic curriculum server running on port ${port}`);
  });
}

startServer();
