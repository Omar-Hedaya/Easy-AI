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
  switchedDueTo404?: boolean;
  switchedDueToDemand?: boolean;
  switchedFrom?: string;
  failoverReason?: 'high_demand' | 'slow_latency' | 'rate_limit' | 'not_found' | 'server_error';
  failoverLatencyMs?: number;
  durationMs?: number;
  groundingMetadata?: GroundingMetadata;
  isGrounded?: boolean;
}

/**
 * Makes a direct POST request to Google Generative Language API.
 * Automatically detects:
 * 1. Slow response latency / hangs (soft timeout threshold: 7500ms).
 * 2. Server high demand (HTTP 429 RESOURCE_EXHAUSTED / Rate Limit, HTTP 503 UNAVAILABLE / High Load, 502/504 Gateway).
 * 3. Model unavailability (HTTP 404 NOT_FOUND).
 * Immediately switches to an alternate model ('gemini-3.7-flash', 'gemini-3.1-flash-lite') or alternate endpoint without failing.
 */
export async function callGoogleGenerativeLanguageApi(
  requestedModel: string,
  payload: any,
  options?: {
    latencyThresholdMs?: number;
  }
): Promise<{
  data: any;
  modelUsed: string;
  switchedDueTo404: boolean;
  switchedDueToDemand: boolean;
  switchedFrom?: string;
  failoverReason?: 'high_demand' | 'slow_latency' | 'rate_limit' | 'not_found' | 'server_error';
  failoverLatencyMs?: number;
  durationMs: number;
}> {
  const apiKey = getGeminiApiKey();
  const overallStart = performance.now();

  const initialModel = requestedModel || 'gemini-3.8-flash';

  // Resilient model fallback ladder
  const modelLadder = Array.from(
    new Set([
      initialModel,
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ])
  );

  // Endpoint variants for high-availability routing
  const endpointBases = [
    'https://generativelanguage.googleapis.com/v1beta/models',
    'https://generativelanguage.googleapis.com/v1/models',
  ];

  let lastError: any = null;
  let failoverReason: 'high_demand' | 'slow_latency' | 'rate_limit' | 'not_found' | 'server_error' | undefined = undefined;
  let switchedDueTo404 = false;
  let switchedDueToDemand = false;
  let switchedFrom: string | undefined = undefined;

  for (let i = 0; i < modelLadder.length; i++) {
    const currentModel = modelLadder[i];
    const isInitialAttempt = i === 0;

    // Latency cutoff: 7500ms for first candidate to avoid keeping the user waiting on overloaded queues
    const latencyTimeoutMs = isInitialAttempt
      ? options?.latencyThresholdMs || 7500
      : 12000;

    for (let epIdx = 0; epIdx < endpointBases.length; epIdx++) {
      const endpointBase = endpointBases[epIdx];
      const endpoint = `${endpointBase}/${currentModel}:generateContent?key=${apiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, latencyTimeoutMs);

      const attemptStart = performance.now();

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Detect HTTP 404 (Model Not Found)
        if (response.status === 404) {
          console.warn(
            `[Resiliency Engine] Model "${currentModel}" returned 404 Not Found at ${endpointBase}. Switching to alternate model...`
          );
          switchedDueTo404 = true;
          switchedFrom = initialModel;
          failoverReason = 'not_found';
          break; // Move to next model in ladder
        }

        // Detect High Demand: HTTP 429 (Rate Limit / Quota Exhaustion)
        if (response.status === 429) {
          console.warn(
            `[Resiliency Engine] High demand / rate limit (HTTP 429) detected on "${currentModel}". Switching to alternate model...`
          );
          switchedDueToDemand = true;
          switchedFrom = initialModel;
          failoverReason = 'rate_limit';
          break; // Move to next model in ladder
        }

        // Detect High Demand / Outage: HTTP 503 (Unavailable) / 502 / 504 / 500
        if (response.status === 503 || response.status === 502 || response.status === 504 || response.status === 500) {
          console.warn(
            `[Resiliency Engine] Server high demand / temporary outage (HTTP ${response.status}) on "${currentModel}". Switching to alternate model...`
          );
          switchedDueToDemand = true;
          switchedFrom = initialModel;
          failoverReason = response.status === 503 ? 'high_demand' : 'server_error';
          break; // Move to next model in ladder
        }

        // Detect Tool Incompatibility (e.g. 400 with tool mismatch on alternate models/endpoints)
        if (!response.ok && payload.tools && response.status === 400) {
          const errBody = await response.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || '';
          if (errMsg.includes('tool') || errMsg.includes('search') || errMsg.includes('Search')) {
            console.warn(`[Resiliency Engine] Tools not supported on ${currentModel} (${errMsg}). Retrying without tools...`);
            const payloadNoTools = { ...payload };
            delete payloadNoTools.tools;
            const retryRes = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadNoTools),
            });
            if (retryRes.ok) {
              const data = await retryRes.json();
              const durationMs = Math.round(performance.now() - overallStart);
              return {
                data,
                modelUsed: currentModel,
                switchedDueTo404: currentModel !== initialModel && failoverReason === 'not_found',
                switchedDueToDemand: currentModel !== initialModel && failoverReason !== 'not_found',
                switchedFrom: currentModel !== initialModel ? initialModel : undefined,
                failoverReason: currentModel !== initialModel ? failoverReason : undefined,
                failoverLatencyMs: currentModel !== initialModel ? durationMs : undefined,
                durationMs,
              };
            }
          }
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const errMessage = errorBody?.error?.message || `Google Gemini API error (HTTP ${response.status})`;
          throw new Error(errMessage);
        }

        // Successful request!
        const data = await response.json();
        const durationMs = Math.round(performance.now() - overallStart);

        return {
          data,
          modelUsed: currentModel,
          switchedDueTo404: currentModel !== initialModel && failoverReason === 'not_found',
          switchedDueToDemand: currentModel !== initialModel && failoverReason !== 'not_found',
          switchedFrom: currentModel !== initialModel ? initialModel : undefined,
          failoverReason: currentModel !== initialModel ? failoverReason : undefined,
          failoverLatencyMs: currentModel !== initialModel ? durationMs : undefined,
          durationMs,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        const elapsed = Math.round(performance.now() - attemptStart);

        const isAbortOrTimeout =
          err?.name === 'AbortError' ||
          err?.name === 'TimeoutError' ||
          err?.message?.includes('aborted') ||
          err?.message?.includes('timeout') ||
          elapsed >= latencyTimeoutMs;

        if (isAbortOrTimeout) {
          console.warn(
            `[Resiliency Engine] Slow response latency detected on "${currentModel}" (${elapsed}ms >= ${latencyTimeoutMs}ms). Instantly switching to alternate model...`
          );
          switchedDueToDemand = true;
          switchedFrom = initialModel;
          failoverReason = 'slow_latency';
          break; // Move to next model in ladder immediately
        }

        // If endpoint 1 failed with a network error, try endpoint 2 before changing model
        if (epIdx < endpointBases.length - 1) {
          console.warn(`[Resiliency Engine] Endpoint ${endpointBase} failed (${err.message}). Trying alternate endpoint...`);
          continue;
        }

        // If generic error, flag demand/server error and advance ladder
        switchedDueToDemand = true;
        switchedFrom = initialModel;
        if (!failoverReason) failoverReason = 'server_error';
      }
    }
  }

  // If every model in the fallback ladder failed, throw the last encountered error
  console.error('[Resiliency Engine] Exhausted all model and endpoint fallbacks.', lastError);
  throw lastError || new Error('All Gemini model endpoints are temporarily unavailable due to severe network or server load.');
}

/**
 * Requirement 4: Handle Text & Multimodal (PDF, Image, Audio, Video, Code, Document) inputs.
 * Reads documents, images, audio, and videos as binary Base64 with proper MIME types in inlineData,
 * and reads code/text files as raw UTF-8 text parts for the Gemini API.
 */
export function buildMessageParts(msg: { content?: string; attachments?: ProcessedFile[] }): any[] {
  const parts: any[] = [];

  if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    for (const att of msg.attachments) {
      const mime = att.mimeType || att.type || '';
      const isMedia =
        mime === 'application/pdf' ||
        mime.startsWith('image/') ||
        mime.startsWith('audio/') ||
        mime.startsWith('video/');

      // Multimodal Media (PDF, Image, Audio, Video): sent as Base64 in inlineData
      if (att.base64Data && isMedia) {
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanBase64,
          },
        });
      }

      // Code & Text files (or extracted document text): sent as raw UTF-8 text parts
      if (att.textContent && att.textContent.trim()) {
        const isPureMedia = mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/');
        if (!isPureMedia || att.fileCategory === 'code' || att.fileCategory === 'data' || att.fileCategory === 'document') {
          parts.push({
            text: `[Attached File: "${att.name}" (${mime || att.extension || 'file'})]\n${att.textContent}`,
          });
        }
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
 */
export async function sendDirectChatMessage(params: {
  messages: ChatMessage[];
  model: string;
  targetLanguage?: TargetLanguage;
  enableSearchGrounding?: boolean;
}): Promise<DirectApiResult<string>> {
  const { messages, model, targetLanguage = 'ar-EG', enableSearchGrounding = true } = params;

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

  const {
    data,
    modelUsed,
    switchedDueTo404,
    switchedDueToDemand,
    switchedFrom,
    failoverReason,
    failoverLatencyMs,
    durationMs,
  } = await callGoogleGenerativeLanguageApi(model, payload);

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
    switchedDueToDemand,
    switchedFrom,
    failoverReason,
    failoverLatencyMs,
    durationMs,
    groundingMetadata,
    isGrounded,
  };
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

  // Multimodal attachments (Images, Audio, Video, PDF, Documents)
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      const mime = att.mimeType || att.type || '';
      const isMedia =
        mime === 'application/pdf' ||
        mime.startsWith('image/') ||
        mime.startsWith('audio/') ||
        mime.startsWith('video/');

      if (att.base64Data && isMedia) {
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        userParts.push({
          inlineData: {
            mimeType: mime,
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

  const {
    data,
    modelUsed,
    switchedDueTo404,
    switchedDueToDemand,
    switchedFrom,
    failoverReason,
    failoverLatencyMs,
    durationMs,
  } = await callGoogleGenerativeLanguageApi(model, payload);

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
    switchedDueToDemand,
    switchedFrom,
    failoverReason,
    failoverLatencyMs,
    durationMs,
  };
}
