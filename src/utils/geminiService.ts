import { ChatMessage, GroundingMetadata } from '../types/chat';
import { CurriculumAnalysisResult, TargetLanguage } from '../types/themes';
import { ProcessedFile } from './fileParser';

/**
 * Reads the Gemini API key strictly from environment variables.
 * If apiKey is missing, displays an alert: "API Key is missing in environment variables"
 * and throws an error instead of sending a request.
 */
export function getGeminiApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    alert('API Key is missing in environment variables');
    throw new Error('API Key is missing in environment variables');
  }
  return apiKey.trim();
}

const EGYPTIAN_ARABIC_DIRECTIVE = `
اللغة المستهدفة للشرح والمحادثة: العامية المصرية الأكاديمية الراقية والذكية (Egyptian Arabic عامية مصرية).
- اشرح المفاهيم بأسلوب علمي مصري سلس ومحبوب وعميق (زي أسلوب كبار أساتذة الهندسة والطب في مصر: "بص يا فنان / يا هندسة / يا دكتور"، "الفكرة كلها في القانون ده إن...", "خد بالك من التريكاية دي").
- المصطلحات التقنية والمعادلات الرياضية وأسماء القوانين والمتغيرات تُكتب كما هي بدقة فائقة باللغة الإنجليزية ورموز LaTeX الدولية ($...$ أو $$...$$).
- التزم التزاماً صارماً بقاعدة عدم التكرار (Zero Formula Duplication): كل قانون يُكتب بصيغته الرياضية مرة واحدة فقط ويُشار إليه بـ [EQ-x] عند الحاجة.
`;

const CHAT_SYSTEM_INSTRUCTION = `You are an Elite Academic Curriculum Engine. When the user provides lecture slides, PDFs, or raw material, generate a 100% comprehensive, exhaustive, and professionally structured academic summary directly—without requiring external summarization tools.

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

export interface DirectApiResult<T = string> {
  result: T;
  modelUsed: string;
  switchedDueTo404: boolean;
  switchedFrom?: string;
  groundingMetadata?: GroundingMetadata;
  isGrounded?: boolean;
  switchedDueToQuota?: boolean;
  fallbackProvider?: 'gemini' | 'groq' | 'openrouter';
  fallbackTier?: 1 | 2 | 3;
  fallbackNotice?: string;
}

export const GROQ_DEFAULT_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant',
];

export const OPENROUTER_TIER2_MODELS = [
  'deepseek/deepseek-chat',
  'google/gemini-2.0-flash-exp:free',
];

export const OPENROUTER_TIER3_FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat',
  'meta-llama/llama-3.1-8b-instruct:free',
];

export const OPENROUTER_FALLBACK_MODELS = OPENROUTER_TIER3_FREE_MODELS;

/**
 * Resolves Groq API Key from:
 * 1. Explicit parameter
 * 2. VITE_GROQ_API_KEY environment variable
 * 3. Settings localStorage ('groq_api_key' or 'easy_external_keys')
 */
export function getGroqApiKey(customKey?: string): string {
  // 1. Explicit parameter
  if (customKey && typeof customKey === 'string' && customKey.trim()) {
    return customKey.trim().replace(/^["']|["']$/g, '');
  }

  // 2. Environment variable VITE_GROQ_API_KEY
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() && envKey !== 'MY_GROQ_API_KEY') {
    return envKey.trim().replace(/^["']|["']$/g, '');
  }

  // 3. User settings localStorage 'groq_api_key'
  try {
    const directStored = localStorage.getItem('groq_api_key');
    if (directStored && typeof directStored === 'string' && directStored.trim()) {
      return directStored.trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    console.warn('[Groq Key Resolution] Error reading groq_api_key from localStorage:', e);
  }

  // 4. User settings localStorage 'easy_external_keys' (object)
  try {
    const stored = localStorage.getItem('easy_external_keys');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.groqKey && typeof parsed.groqKey === 'string' && parsed.groqKey.trim()) {
        return parsed.groqKey.trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (e) {
    console.warn('[Groq Key Resolution] Error reading easy_external_keys from localStorage:', e);
  }

  return '';
}

/**
 * Resolves OpenRouter API Key from:
 * 1. Explicit parameter
 * 2. VITE_OPENROUTER_API_KEY environment variable
 * 3. Settings localStorage ('easy_external_keys' or 'openrouter_api_key')
 */
export function getOpenRouterApiKey(customKey?: string): string {
  if (customKey && typeof customKey === 'string' && customKey.trim()) {
    return customKey.trim();
  }
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() && envKey !== 'MY_OPENROUTER_API_KEY') {
    return envKey.trim();
  }
  try {
    const stored = localStorage.getItem('easy_external_keys');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.openRouterKey && typeof parsed.openRouterKey === 'string' && parsed.openRouterKey.trim()) {
        return parsed.openRouterKey.trim();
      }
    }
    const directStored = localStorage.getItem('openrouter_api_key');
    if (directStored && typeof directStored === 'string' && directStored.trim()) {
      return directStored.trim();
    }
  } catch (e) {
    console.warn('[OpenRouter] Error reading stored key:', e);
  }
  return '';
}

/**
 * Intercepts Gemini rate limit, quota exhaustion (429), service unavailable (503), or network errors.
 */
export function isRateLimitOrQuotaError(status?: number, message?: string): boolean {
  if (status === 429 || status === 503 || status === 504 || status === 500 || status === 502) return true;
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('resource exhausted') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('rate limit') ||
    lower.includes('ratelimit') ||
    lower.includes('too many requests') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('overloaded') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('networkerror') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('connection') ||
    lower.includes('abort')
  );
}

/**
 * Converts chat history and multimodal attachments into standard OpenAI-compatible format
 * for Groq and OpenRouter endpoints.
 * @param preferTextOnly When true (e.g. for Groq text models), formats image attachments as textual metadata
 *                       to avoid 400 Bad Request on models without vision capability.
 */
export function convertMessagesToOpenAIFormat(
  messages: ChatMessage[],
  systemInstruction?: string,
  targetLanguage: string = 'ar-EG',
  preferTextOnly: boolean = false
): any[] {
  const formattedMessages: any[] = [];

  const fullSystemPrompt = `${systemInstruction || CHAT_SYSTEM_INSTRUCTION}\n${EGYPTIAN_ARABIC_DIRECTIVE}\nTarget Language: ${targetLanguage}`;
  formattedMessages.push({
    role: 'system',
    content: fullSystemPrompt,
  });

  for (const msg of messages) {
    const role = msg.role === 'model' || (msg.role as any) === 'assistant' ? 'assistant' : 'user';

    if (role === 'assistant') {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content || '',
      });
      continue;
    }

    // Role is user
    if (preferTextOnly) {
      // 1. Text Extraction for Groq (Multimodal to Text)
      // Groq models accept text-only payloads. If a user uploads a PDF, document, or code file,
      // extract and convert the file content into plain text inside the user prompt rather than sending raw media.
      let attachedDocsText = '';
      if (msg.attachments && msg.attachments.length > 0) {
        for (const file of msg.attachments) {
          let extractedText = '';
          if (file.textContent && file.textContent.trim()) {
            extractedText = file.textContent.trim();
          } else if (file.fileCategory === 'image') {
            extractedText = `(Image file: "${file.name}" - ${file.type || 'image'})`;
          } else {
            extractedText = `(Document file: "${file.name}" - ${file.type || file.extension || 'file'})`;
          }
          attachedDocsText += `[Attached Document Content (${file.name}):\n${extractedText}]\n\n`;
        }
      }

      let userPrompt = '';
      if (attachedDocsText) {
        userPrompt = `${attachedDocsText}User Question: ${msg.content || 'Please review, analyze, and synthesize the attached document content thoroughly.'}`;
      } else {
        userPrompt = msg.content || ' ';
      }

      formattedMessages.push({
        role: 'user',
        content: userPrompt,
      });
      continue;
    }

    // Role is user (Standard / OpenRouter multimodal format)
    const textAttachments = msg.attachments?.filter((a) => a.fileCategory !== 'image') || [];
    const imageAttachments = msg.attachments?.filter((a) => a.fileCategory === 'image') || [];

    let combinedText = msg.content || '';
    for (const file of textAttachments) {
      if (file.textContent) {
        combinedText += `\n\n[Attached Ingested File: "${file.name}" (${file.type || file.extension || 'document'})]\n${file.textContent}`;
      }
    }

    if (imageAttachments.length > 0) {
      const parts: any[] = [];
      if (combinedText.trim()) {
        parts.push({ type: 'text', text: combinedText });
      }
      for (const img of imageAttachments) {
        let dataUrl = '';
        if (img.base64Data) {
          dataUrl = img.base64Data.startsWith('data:')
            ? img.base64Data
            : `data:${img.mimeType || 'image/png'};base64,${img.base64Data}`;
        }
        if (dataUrl) {
          parts.push({
            type: 'image_url',
            image_url: { url: dataUrl },
          });
        }
      }
      formattedMessages.push({
        role: 'user',
        content: parts.length > 0 ? parts : combinedText || ' ',
      });
    } else {
      formattedMessages.push({
        role: 'user',
        content: combinedText || ' ',
      });
    }
  }

  return formattedMessages;
}

// Backward-compatibility alias
export const convertMessagesToOpenRouterFormat = convertMessagesToOpenAIFormat;

/**
 * Tier 1 Failover: Executes chat completion request via Groq Cloud API.
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 * Models: llama-3.3-70b-versatile, openai/gpt-oss-120b, llama-3.1-8b-instant
 */
export async function callGroqApi(params: {
  messages: any[];
  model?: string;
  groqKey?: string;
  responseFormatJson?: boolean;
}): Promise<{ content: string; modelUsed: string }> {
  const apiKey = getGroqApiKey(params.groqKey);
  if (!apiKey) {
    throw new Error('Groq API Key is not configured (check VITE_GROQ_API_KEY or localStorage "groq_api_key").');
  }

  const modelsToTry = params.model
    ? [params.model, ...GROQ_DEFAULT_MODELS.filter((m) => m !== params.model)]
    : GROQ_DEFAULT_MODELS;

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  let lastError: any = null;

  // Guarantee all message payloads are strictly text strings for Groq compatibility
  const sanitizedMessages = params.messages.map((m: any) => {
    let cleanContent = '';
    if (typeof m.content === 'string') {
      cleanContent = m.content;
    } else if (Array.isArray(m.content)) {
      cleanContent = m.content
        .map((p: any) => {
          if (typeof p === 'string') return p;
          if (p?.type === 'text') return p.text;
          if (p?.type === 'image_url') return '[Attached Image]';
          return '';
        })
        .filter(Boolean)
        .join('\n');
    } else {
      cleanContent = String(m.content || ' ');
    }
    return {
      role: m.role || 'user',
      content: cleanContent || ' ',
    };
  });

  for (const modelCandidate of modelsToTry) {
    try {
      console.log(`[Groq API] Attempting chat completion with model "${modelCandidate}" at ${endpoint}...`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      const bodyPayload: any = {
        model: modelCandidate,
        messages: sanitizedMessages,
        temperature: 0.3,
        max_tokens: 8000,
      };

      if (params.responseFormatJson) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let detailedError = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) {
            detailedError = parsed.error.message;
          }
        } catch {}
        console.error(
          `[Groq API Error] ❌ Model "${modelCandidate}" returned HTTP ${response.status}: ${detailedError}`
        );
        lastError = new Error(`Groq API error on model "${modelCandidate}" (HTTP ${response.status}): ${detailedError}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      console.log(`[Groq API Success] ✅ Model "${modelCandidate}" returned valid response (${content.length} chars).`);
      return {
        content,
        modelUsed: modelCandidate,
      };
    } catch (err: any) {
      console.error(`[Groq API Network/Execution Error] ❌ Error executing model "${modelCandidate}":`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to obtain response from Groq Cloud models.');
}

/**
 * Tier 2 & Tier 3 Failover: Executes chat completion request via OpenRouter API with automated model fallback chain.
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Headers: HTTP-Referer, X-Title: Easy-AI, Authorization: Bearer <KEY>
 */
export async function callOpenRouterApi(params: {
  messages: any[];
  model?: string;
  candidateModels?: string[];
  openRouterKey?: string;
  responseFormatJson?: boolean;
}): Promise<{ content: string; modelUsed: string }> {
  const apiKey = getOpenRouterApiKey(params.openRouterKey);
  const modelsToTry = params.candidateModels
    ? params.candidateModels
    : params.model
    ? [params.model, ...OPENROUTER_TIER2_MODELS.filter((m) => m !== params.model)]
    : OPENROUTER_TIER2_MODELS;

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const referer = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://easy-ai.app';

  let lastError: any = null;

  for (const modelCandidate of modelsToTry) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': 'Easy-AI',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const bodyPayload: any = {
        model: modelCandidate,
        messages: params.messages,
        temperature: 0.3,
      };

      if (params.responseFormatJson) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[OpenRouter] Model ${modelCandidate} returned HTTP ${response.status}: ${errText}`);
        lastError = new Error(`OpenRouter (${modelCandidate}) HTTP ${response.status}: ${errText}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return {
        content,
        modelUsed: modelCandidate,
      };
    } catch (err: any) {
      console.warn(`[OpenRouter] Network or execution error on model ${modelCandidate}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to obtain response from OpenRouter fallback models.');
}

export interface MultiTierFailoverResult {
  content: string;
  provider: 'groq' | 'openrouter';
  modelUsed: string;
  tier: 1 | 2 | 3;
  notice: string;
}

/**
 * Multi-Tier Automatic Cascading Failover Pipeline:
 * Priority:
 *   Tier 1: Groq Cloud API (Immediate high-throughput inference)
 *   Tier 2: OpenRouter API (Primary flagship models)
 *   Tier 3: OpenRouter Free Models (Zero-cost emergency models)
 */
export async function executeMultiTierFailover(params: {
  messages: ChatMessage[];
  systemInstruction?: string;
  targetLanguage?: TargetLanguage;
  responseFormatJson?: boolean;
  groqKey?: string;
  openRouterKey?: string;
  onFailoverStatus?: (tier: 1 | 2 | 3, provider: 'groq' | 'openrouter', message: string) => void;
}): Promise<MultiTierFailoverResult> {
  const {
    messages,
    systemInstruction,
    targetLanguage = 'ar-EG',
    responseFormatJson,
    groqKey,
    openRouterKey,
    onFailoverStatus,
  } = params;

  const failureLog: string[] = [];

  // ==========================================
  // TIER 1: Groq Cloud API (Strict Priority Fallback)
  // ==========================================
  const groqApiKey = getGroqApiKey(groqKey);

  if (!groqApiKey) {
    console.warn(
      '[Failover Cascade] ⚠️ Groq (Tier 1) SKIPPED: Missing API key. Neither import.meta.env.VITE_GROQ_API_KEY nor localStorage ("groq_api_key" / "easy_external_keys") has a valid key. Proceeding strictly to Tier 2 (OpenRouter)...'
    );
    failureLog.push('Tier 1 (Groq): Skipped - Missing API key in environment or localStorage');
  } else {
    try {
      console.log(
        '[Failover Cascade] 🚀 GROQ PRIORITY EXECUTION: Strictly calling Groq Cloud API FIRST (Endpoint: https://api.groq.com/openai/v1/chat/completions)...'
      );
      onFailoverStatus?.(
        1,
        'groq',
        '⚡ سيرفر Gemini مضغوط، جاري المتابعة فوراً عبر Groq Cloud (Tier 1)...'
      );
      const groqMessages = convertMessagesToOpenAIFormat(
        messages,
        systemInstruction,
        targetLanguage,
        true // Text-friendly compatibility for Groq
      );
      const res = await callGroqApi({
        messages: groqMessages,
        groqKey: groqApiKey,
        responseFormatJson,
      });

      console.log(`[Failover Cascade] ✅ GROQ Tier 1 Succeeded! Model used: ${res.modelUsed}`);
      return {
        content: res.content,
        provider: 'groq',
        modelUsed: `groq/${res.modelUsed}`,
        tier: 1,
        notice: 'GROQ T1 (Ultra-Fast Active) - تم التحويل التلقائي بنجاح إلى Groq (Tier 1)',
      };
    } catch (groqErr: any) {
      console.error(
        `[Groq Failover Error] ❌ Groq (Tier 1) request failed. Outputting exact error for API key and payload verification:\n`,
        groqErr?.message || groqErr,
        `\nNow cascading to Tier 2 (OpenRouter)...`
      );
      failureLog.push(`Tier 1 (Groq): ${groqErr.message || groqErr}`);
    }
  }

  // ==========================================
  // TIER 2: OpenRouter API (Primary Models)
  // ==========================================
  try {
    onFailoverStatus?.(
      2,
      'openrouter',
      '⚡ جاري المتابعة السلسة عبر OpenRouter (Tier 2)...'
    );
    const openRouterMessages = convertMessagesToOpenAIFormat(
      messages,
      systemInstruction,
      targetLanguage,
      false
    );
    const res = await callOpenRouterApi({
      messages: openRouterMessages,
      candidateModels: OPENROUTER_TIER2_MODELS,
      openRouterKey,
      responseFormatJson,
    });

    return {
      content: res.content,
      provider: 'openrouter',
      modelUsed: `openrouter/${res.modelUsed}`,
      tier: 2,
      notice: 'تم التحويل التلقائي بنجاح إلى OpenRouter (Tier 2) لضمان استمرارية الجلسة',
    };
  } catch (openRouterErr: any) {
    console.warn('[Failover Tier 2 (OpenRouter Primary) Failed]:', openRouterErr);
    failureLog.push(`Tier 2 (OpenRouter Primary): ${openRouterErr.message || openRouterErr}`);
  }

  // ==========================================
  // TIER 3: OpenRouter API (Free Fallback Models)
  // ==========================================
  try {
    onFailoverStatus?.(
      3,
      'openrouter',
      '⚡ جاري المتابعة عبر نماذج OpenRouter المجانية البديلة (Tier 3)...'
    );
    const openRouterMessages = convertMessagesToOpenAIFormat(
      messages,
      systemInstruction,
      targetLanguage,
      false
    );
    const res = await callOpenRouterApi({
      messages: openRouterMessages,
      candidateModels: OPENROUTER_TIER3_FREE_MODELS,
      openRouterKey,
      responseFormatJson,
    });

    return {
      content: res.content,
      provider: 'openrouter',
      modelUsed: `openrouter/${res.modelUsed}`,
      tier: 3,
      notice: 'تم إكمال الطلب بنجاح عبر مسار الطوارئ المجاني في OpenRouter (Tier 3)',
    };
  } catch (tier3Err: any) {
    console.warn('[Failover Tier 3 (OpenRouter Free) Failed]:', tier3Err);
    failureLog.push(`Tier 3 (OpenRouter Free): ${tier3Err.message || tier3Err}`);
  }

  throw new Error(
    `All failover tiers exhausted.\n${failureLog.join('\n')}`
  );
}

/**
 * Makes a direct POST request to Google Generative Language API:
 * https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
 * Disables local proxies, non-existent serverless routes, or unconfigured external fallback providers.
 * Catches HTTP 404 (Not Found / Model Unavailable) and immediately retries using 'gemini-3.7-flash'.
 */
export async function callGoogleGenerativeLanguageApi(
  requestedModel: string,
  payload: any
): Promise<{ data: any; modelUsed: string; switchedDueTo404: boolean; switchedFrom?: string }> {
  // Requirement 3: Read API key strictly via import.meta.env.VITE_GEMINI_API_KEY
  // If missing, display alert: "API Key is missing in environment variables"
  const apiKey = getGeminiApiKey();

  let activeModel = requestedModel || 'gemini-3.8-flash';
  let switchedDueTo404 = false;
  let switchedFrom: string | undefined = undefined;

  const makeRequest = async (model: string, currentPayload: any) => {
    // Requirement 1: Direct Google Gemini API Call
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentPayload),
    });
  };

  try {
    let response = await makeRequest(activeModel, payload);

    // Requirement 2: If gemini-3.8-flash (or requested model) returns 404 from Google,
    // catch that error and immediately retry the request using 'gemini-3.7-flash' as an in-code automatic fallback.
    if (response.status === 404) {
      console.warn(
        `[Google Gemini API] Model "${activeModel}" returned 404 Not Found. Immediately retrying with gemini-3.7-flash...`
      );
      switchedDueTo404 = true;
      switchedFrom = activeModel;
      activeModel = activeModel === 'gemini-3.7-flash' ? 'gemini-3.6-flash' : 'gemini-3.7-flash';

      response = await makeRequest(activeModel, payload);

      // If still 404, fallback to gemini-3.1-flash-lite
      if (response.status === 404) {
        console.warn(
          `[Google Gemini API] Model "${activeModel}" returned 404. Retrying with gemini-3.1-flash-lite...`
        );
        activeModel = 'gemini-3.1-flash-lite';
        response = await makeRequest(activeModel, payload);
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errMessage = errorBody?.error?.message || `Google Gemini API error (HTTP ${response.status})`;

      // If the error was triggered by tools and fallback is needed
      if (payload.tools && (errMessage.includes('tool') || errMessage.includes('search') || errMessage.includes('Search') || response.status === 400)) {
        console.warn(`[Google Gemini API] Tools error encountered (${errMessage}). Gracefully retrying without tools...`);
        const payloadWithoutTools = { ...payload };
        delete payloadWithoutTools.tools;
        const retryRes = await makeRequest(activeModel, payloadWithoutTools);
        if (retryRes.ok) {
          const data = await retryRes.json();
          return {
            data,
            modelUsed: activeModel,
            switchedDueTo404,
            switchedFrom,
          };
        }
      }

      throw new Error(errMessage);
    }

    const data = await response.json();
    return {
      data,
      modelUsed: activeModel,
      switchedDueTo404,
      switchedFrom,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    // If the error indicates a 404 from Google
    if (
      (errorMsg.includes('404') || errorMsg.includes('NOT_FOUND') || errorMsg.includes('not found')) &&
      activeModel !== 'gemini-3.7-flash'
    ) {
      console.warn(
        `[Google Gemini API] Caught 404 error for ${activeModel}: ${errorMsg}. Retrying with gemini-3.7-flash...`
      );
      switchedDueTo404 = true;
      switchedFrom = activeModel;
      activeModel = 'gemini-3.7-flash';

      const retryRes = await makeRequest(activeModel, payload);
      if (!retryRes.ok) {
        const errJson = await retryRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Retry failed with HTTP ${retryRes.status}`);
      }
      const data = await retryRes.json();
      return {
        data,
        modelUsed: activeModel,
        switchedDueTo404,
        switchedFrom,
      };
    }
    throw error;
  }
}

/**
 * Requirement 4: Handle Text & Multimodal/PDF inputs.
 * Supports simple text prompts as well as PDF uploads (sent as Base64 in inlineData with mimeType: 'application/pdf').
 */
export function buildMessageParts(msg: { content?: string; attachments?: ProcessedFile[] }): any[] {
  const parts: any[] = [];

  if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    for (const att of msg.attachments) {
      const isPdf =
        att.mimeType === 'application/pdf' ||
        att.extension === 'pdf' ||
        att.type === 'application/pdf';

      // PDF Uploads: sent as Base64 in inlineData with mimeType: 'application/pdf'
      if (att.base64Data && isPdf) {
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        });
      } else if (att.base64Data && att.mimeType && att.mimeType.startsWith('image/')) {
        // Image Uploads: sent as Base64 in inlineData
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: cleanBase64,
          },
        });
      }

      // Extracted text content from file (if available) for OCR/textual context
      if (att.textContent && att.textContent.trim()) {
        parts.push({
          text: `[Attached Ingested Content: "${att.name}" (${att.type || 'file'})]\n${att.textContent}`,
        });
      }
    }
  }

  if (msg.content && msg.content.trim()) {
    parts.push({ text: msg.content });
  }

  // Ensure at least one part is present
  if (parts.length === 0) {
    parts.push({ text: ' ' });
  }

  return parts;
}

/**
 * Sends chat request directly to Google Gemini API (no proxies) with Google Search Grounding for academic validation.
 * Automatically intercepts HTTP 429 ("Resource Exhausted", "You exceeded your current quota"), 503,
 * or persistent network failures from the Gemini API and seamlessly redirects to OpenRouter endpoint.
 */
export async function sendDirectChatMessage(params: {
  messages: ChatMessage[];
  model: string;
  targetLanguage?: TargetLanguage;
  enableSearchGrounding?: boolean;
  groqKey?: string;
  openRouterKey?: string;
  onFailoverStatus?: (tier: 1 | 2 | 3, provider: 'groq' | 'openrouter', message: string) => void;
}): Promise<DirectApiResult<string>> {
  const {
    messages,
    model,
    targetLanguage = 'ar-EG',
    enableSearchGrounding = true,
    groqKey,
    openRouterKey,
    onFailoverStatus,
  } = params;

  try {
    // Build multi-turn contents array with PDF and multimodal inlineData support
    const contents = messages.map((m) => ({
      role: m.role === 'model' || (m.role as any) === 'assistant' ? 'model' : 'user',
      parts: buildMessageParts(m),
    }));

    const academicGroundingPrompt = enableSearchGrounding
      ? `
ACADEMIC GOOGLE SEARCH GROUNDING ACTIVE:
- Use real-time Google Search grounding to verify all physical constants (CODATA exact values, Planck's constant h, speed of light c, elementary charge e, Boltzmann constant k_B, universal gas constant R, acceleration due to gravity g, permittivity of free space ε0, etc.).
- When discussing engineering equations, formulas, mathematical theorems, or medical dosage formulas, cross-reference standard conventions and verify edge cases.
- For recent scientific breakthroughs, AI models, modern benchmarks, or state-of-the-art discoveries, use the Google Search grounding tool to provide fresh, verified academic validation.
- Highlight verified constants and cite key academic/research sources when applicable.`
      : '';

    const payload: any = {
      contents,
      systemInstruction: {
        parts: [
          {
            text: `${CHAT_SYSTEM_INSTRUCTION}\n${EGYPTIAN_ARABIC_DIRECTIVE}\nTarget Language: ${targetLanguage}${academicGroundingPrompt}`,
          },
        ],
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    };

    if (enableSearchGrounding) {
      payload.tools = [{ googleSearch: {} }];
    }

    const { data, modelUsed, switchedDueTo404, switchedFrom } = await callGoogleGenerativeLanguageApi(
      model,
      payload
    );

    const replyText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join('') || '';

    const groundingMetadata: GroundingMetadata | undefined = data?.candidates?.[0]?.groundingMetadata;
    const isGrounded = Boolean(
      groundingMetadata &&
        ((groundingMetadata.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) ||
          (groundingMetadata.groundingChunks && groundingMetadata.groundingChunks.length > 0))
    );

    return {
      result: replyText,
      modelUsed,
      switchedDueTo404,
      switchedFrom,
      groundingMetadata,
      isGrounded,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const statusMatch = errorMsg.match(/HTTP\s*(\d+)/i);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

    // Requirement 1 & 2: Cascading Failover Priority
    // Intercept HTTP 429 ("Resource Exhausted", "You exceeded your current quota"), 503, or network timeout.
    // Trigger Cascading Failover Pipeline: Tier 1 (Groq) -> Tier 2 (OpenRouter Primary) -> Tier 3 (OpenRouter Free).
    if (isRateLimitOrQuotaError(status, errorMsg)) {
      console.warn(
        `[Gemini Quota/Error Interception] Caught quota/rate-limit error (${errorMsg}). Triggering cascading multi-tier failover (Tier 1 Groq -> Tier 2 OpenRouter -> Tier 3 Free Models)...`
      );

      try {
        const failoverRes = await executeMultiTierFailover({
          messages,
          systemInstruction: `${CHAT_SYSTEM_INSTRUCTION}\n${EGYPTIAN_ARABIC_DIRECTIVE}\nTarget Language: ${targetLanguage}`,
          targetLanguage,
          groqKey,
          openRouterKey,
          onFailoverStatus,
        });

        return {
          result: failoverRes.content,
          modelUsed: failoverRes.modelUsed,
          switchedDueTo404: false,
          switchedDueToQuota: true,
          fallbackProvider: failoverRes.provider,
          fallbackTier: failoverRes.tier,
          fallbackNotice: failoverRes.notice,
        };
      } catch (failoverErr: any) {
        console.error('[Multi-Tier Failover Exhausted]:', failoverErr);
        throw new Error(
          `Google Gemini quota exhausted (${errorMsg}), and cascading fallback pipeline failed: ${failoverErr.message || failoverErr}`
        );
      }
    }

    throw error;
  }
}

/**
 * Sends curriculum analysis and synthesis directly to Google Gemini API (no proxies).
 */
export async function analyzeDirectCurriculum(params: {
  title: string;
  discipline: string;
  targetLanguage: TargetLanguage;
  level: string;
  focus: string;
  rawContent: string;
  model: string;
  attachments?: ProcessedFile[];
  groqKey?: string;
  openRouterKey?: string;
  onFailoverStatus?: (tier: 1 | 2 | 3, provider: 'groq' | 'openrouter', message: string) => void;
}): Promise<DirectApiResult<CurriculumAnalysisResult>> {
  const {
    title,
    discipline,
    targetLanguage,
    level,
    focus,
    rawContent,
    model,
    attachments,
    groqKey,
    openRouterKey,
    onFailoverStatus,
  } = params;

  const userPrompt = `DISCIPLINE: ${discipline || 'Academic Curriculum'}
COURSE/MODULE TITLE: ${title || 'Comprehensive Curriculum Analysis'}
ACADEMIC LEVEL: ${level || 'Undergraduate / Professional'}
PEDAGOGICAL FOCUS: ${focus || 'Comprehensive Theory & Mathematical Precision'}

SOURCE CONTENT / INGESTED SYLLABUS:
"""
${rawContent}
"""

Synthesize this curriculum into a 100% exhaustive, professionally structured academic summary directly adhering to all output rules with zero omissions, complete structured tables, and the 3 mandatory high-yield analytical blocks. Return the result strictly as a valid JSON object matching the requested schema.`;

  const userParts: any[] = [];

  // Multimodal & PDF attachments
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      const isPdf =
        att.mimeType === 'application/pdf' ||
        att.extension === 'pdf' ||
        att.type === 'application/pdf';

      if (att.base64Data && isPdf) {
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        userParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        });
      } else if (att.base64Data && att.mimeType && att.mimeType.startsWith('image/')) {
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        userParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: cleanBase64,
          },
        });
      }
    }
  }

  userParts.push({ text: userPrompt });

  const payload = {
    contents: [
      {
        role: 'user',
        parts: userParts,
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: `You are an Elite Academic Curriculum Engine and lead mathematical architect for "Easy".
When given lecture slides, PDFs, code, or raw curriculum material, generate a 100% comprehensive, exhaustive, and professionally structured academic synthesis.
Follow these strict rules:
1. Zero Omission Policy: Retain every single formula, table, parameter, and edge case.
2. Structured Markdown Tables: Explicit column headers and crisp rows.
3. Standardized LaTeX Equations: Render formulas in clean LaTeX ($...$ or $$...$$). Label key equations [EQ-1], [EQ-2], etc.
4. Dedicated High-Yield Sections: Scaling & Exam Traps, Efficiency & Balances, Final Golden Checks.
5. Tone: العامية المصرية الأكاديمية الراقية والذكية mixed smoothly with standard English technical terms.
Output must be strictly valid JSON without any markdown formatting wrappers.`,
        },
      ],
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  try {
    const { data, modelUsed, switchedDueTo404, switchedFrom } = await callGoogleGenerativeLanguageApi(
      model,
      payload
    );

    let rawJsonText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join('') || '{}';

    rawJsonText = rawJsonText.trim();
    if (rawJsonText.startsWith('```json')) {
      rawJsonText = rawJsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (rawJsonText.startsWith('```')) {
      rawJsonText = rawJsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    let docResult: CurriculumAnalysisResult;
    try {
      docResult = JSON.parse(rawJsonText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', parseErr, rawJsonText);
      throw new Error('Failed to parse synthesized curriculum JSON from Gemini.');
    }

    return {
      result: docResult,
      modelUsed,
      switchedDueTo404,
      switchedFrom,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const statusMatch = errorMsg.match(/HTTP\s*(\d+)/i);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

    if (isRateLimitOrQuotaError(status, errorMsg)) {
      console.warn(
        `[analyzeDirectCurriculum] Gemini quota/rate-limit error (${errorMsg}). Triggering cascading multi-tier failover for curriculum synthesis...`
      );

      try {
        const curriculumSystem = `You are an Elite Academic Curriculum Engine for "Easy".
Synthesize the provided material into a full comprehensive academic curriculum.
Output MUST be strictly valid JSON without markdown formatting wrappers or prelude.
Structure must include:
- title, subtitle, targetDiscipline, targetLanguage, academicLevel, executiveSummary
- coreModules: array of { id, title, icon, estimatedTime, overview, learningObjectives, conceptualFramework, practicalSignificance, commonMisconceptions }
- masterFormulaLedger: array of { id, formulaLatex, title, description, application, variables, category }
- comparativeMatrices: array of { id, title, description, columns, rows }
- examinationTraps: array of { id, trapTitle, misleadingIntuition, correctPrinciple, memoryAnchor }
- laboratoryProtocols: array of { id, title, objective, steps, analyticalChecks, criticalSafetyNotes }
- selfAssessmentDrills: array of { id, prompt, difficulty, answerExplanation, keyEquationRef }`;

        const dummyMessage: ChatMessage = {
          id: `curriculum-task-${Date.now()}`,
          role: 'user',
          content: userPrompt,
          timestamp: new Date().toLocaleTimeString(),
          attachments,
        };

        const failoverRes = await executeMultiTierFailover({
          messages: [dummyMessage],
          systemInstruction: curriculumSystem,
          targetLanguage,
          responseFormatJson: true,
          groqKey,
          openRouterKey,
          onFailoverStatus,
        });

        let cleanJson = failoverRes.content.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
        }

        const docResult: CurriculumAnalysisResult = JSON.parse(cleanJson);
        return {
          result: docResult,
          modelUsed: failoverRes.modelUsed,
          switchedDueTo404: false,
          switchedDueToQuota: true,
          fallbackProvider: failoverRes.provider,
          fallbackTier: failoverRes.tier,
          fallbackNotice: failoverRes.notice,
        };
      } catch (failoverErr: any) {
        console.error('[Curriculum Multi-Tier Failover Exhausted]:', failoverErr);
        throw new Error(
          `Google Gemini quota reached (${errorMsg}), and cascading fallback pipeline failed: ${failoverErr.message || failoverErr}`
        );
      }
    }

    throw error;
  }
}
