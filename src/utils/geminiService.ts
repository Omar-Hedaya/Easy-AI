import { ChatMessage } from '../types/chat';
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

  const makeRequest = async (model: string) => {
    // Requirement 1: Direct Google Gemini API Call
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  };

  try {
    let response = await makeRequest(activeModel);

    // Requirement 2: If gemini-3.8-flash (or requested model) returns 404 from Google,
    // catch that error and immediately retry the request using 'gemini-3.7-flash' as an in-code automatic fallback.
    if (response.status === 404) {
      console.warn(
        `[Google Gemini API] Model "${activeModel}" returned 404 Not Found. Immediately retrying with gemini-3.7-flash...`
      );
      switchedDueTo404 = true;
      switchedFrom = activeModel;
      activeModel = activeModel === 'gemini-3.7-flash' ? 'gemini-3.6-flash' : 'gemini-3.7-flash';

      response = await makeRequest(activeModel);

      // If still 404, fallback to gemini-3.1-flash-lite
      if (response.status === 404) {
        console.warn(
          `[Google Gemini API] Model "${activeModel}" returned 404. Retrying with gemini-3.1-flash-lite...`
        );
        activeModel = 'gemini-3.1-flash-lite';
        response = await makeRequest(activeModel);
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errMessage = errorBody?.error?.message || `Google Gemini API error (HTTP ${response.status})`;
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

      const retryRes = await makeRequest(activeModel);
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
 * Sends chat request directly to Google Gemini API (no proxies).
 */
export async function sendDirectChatMessage(params: {
  messages: ChatMessage[];
  model: string;
  targetLanguage?: TargetLanguage;
}): Promise<DirectApiResult<string>> {
  const { messages, model, targetLanguage = 'ar-EG' } = params;

  // Build multi-turn contents array with PDF and multimodal inlineData support
  const contents = messages.map((m) => ({
    role: m.role === 'model' || (m.role as any) === 'assistant' ? 'model' : 'user',
    parts: buildMessageParts(m),
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [
        {
          text: `${CHAT_SYSTEM_INSTRUCTION}\n${EGYPTIAN_ARABIC_DIRECTIVE}\nTarget Language: ${targetLanguage}`,
        },
      ],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  };

  const { data, modelUsed, switchedDueTo404, switchedFrom } = await callGoogleGenerativeLanguageApi(
    model,
    payload
  );

  const replyText =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join('') || '';

  return {
    result: replyText,
    modelUsed,
    switchedDueTo404,
    switchedFrom,
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
}
