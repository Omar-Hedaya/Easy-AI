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

// Robust Fallback Model Chain (Strictly latest 3.x series in priority order)
const FALLBACK_MODELS = [
  'gemini-3.8-flash', // Primary Target (High speed & performance)
  'gemini-3.7-flash', // Fallback 1
  'gemini-3.6-flash', // Fallback 2
  'gemini-3.5-flash-lite', // Fallback 3 (Low-latency/lightweight fallback)
];

interface FallbackOptions {
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
  openRouterKey?: string;
  groqKey?: string;
}

/**
 * Execute Gemini calls with instant, silent, sequential failover across models
 * resolving 503 (High Demand / Service Unavailable) and 429 (Rate Limit / Quota Exceeded).
 */
async function generateWithFallback(
  contents: any,
  options: FallbackOptions = {}
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  // 1. Try Gemini chain sequentially
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`[Easy AI Engine] Attempting inference with model: ${model}`);
      
      const config: any = {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: 8192, // Maximum supported output tokens for exhaustive, detailed academic responses
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
        contents,
        config,
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        console.log(`[Easy AI Engine] Successful response from: ${model}`);
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('Overloaded') ||
        errMsg.includes('quota') ||
        errMsg.includes('rate limit');

      console.warn(`[Easy AI Engine] Model ${model} encountered error (${isTransient ? 'transient 503/429' : 'error'}):`, errMsg);
      
      // Brief pause before switching to next fallback in chain
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // 2. Try External Provider Fallback: OpenRouter if configured
  const openRouterApiKey = options.openRouterKey || process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    try {
      console.log('[Easy AI Engine] Invoking OpenRouter Fallback Provider...');
      const promptString = typeof contents === 'string' ? contents : JSON.stringify(contents);
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
          return { text, modelUsed: 'openrouter/google/gemini-3.8-flash' };
        }
      }
    } catch (openRouterErr) {
      console.error('[Easy AI Engine] OpenRouter fallback failed:', openRouterErr);
    }
  }

  // 3. Try External Provider Fallback: Groq if configured
  const groqApiKey = options.groqKey || process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      console.log('[Easy AI Engine] Invoking Groq Fallback Provider...');
      const promptString = typeof contents === 'string' ? contents : JSON.stringify(contents);
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
          return { text, modelUsed: 'groq/llama-3.3-70b-versatile' };
        }
      }
    } catch (groqErr) {
      console.error('[Easy AI Engine] Groq fallback failed:', groqErr);
    }
  }

  throw new Error(
    `All models in the fallback chain encountered errors. Last error: ${lastError?.message || 'Unknown error'}`
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
    const { messages, targetLanguage = 'ar-EG', externalKeys, requestSynthesis = false } = req.body;

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

    const { text, modelUsed } = await generateWithFallback(formattedContents, {
      systemInstruction: `${systemInstruction}\n${EGYPTIAN_ARABIC_DIRECTIVE}`,
      temperature: 0.3,
      openRouterKey: externalKeys?.openRouterKey,
      groqKey: externalKeys?.groqKey,
    });

    res.json({
      reply: text,
      modelUsed,
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
    const { title, discipline, targetLanguage = 'ar-EG', level, focus, rawContent, externalKeys } = req.body;

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

    const { text, modelUsed } = await generateWithFallback(userPrompt, {
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
