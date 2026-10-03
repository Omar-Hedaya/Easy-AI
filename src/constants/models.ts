export interface GeminiModelConfig {
  id: string;
  name: string;
  tag: string;
  badge: string;
  description: string;
  isPrimary?: boolean;
}

export const EXACT_GEMINI_MODELS: GeminiModelConfig[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Primary / Default',
    badge: 'Flagship Speed',
    description: 'High-speed reasoning, advanced STEM comprehension & full multimodal parsing',
    isPrimary: true,
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tag: 'Fallback 1',
    badge: 'Hybrid Precision',
    description: 'High-accuracy technical derivations and complex mathematical formulations',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tag: 'Fallback 2',
    badge: 'Stable Engine',
    description: 'Balanced throughput with robust multi-turn context retention',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'Fallback 3',
    badge: 'High Reliability',
    description: 'Consistent curriculum synthesis and extensive formula table parsing',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    tag: 'Fallback 4',
    badge: 'Ultra Fast',
    description: 'Low-latency lightweight generation with efficient resource usage',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Fallback 5',
    badge: 'Resilient Base',
    description: 'Ultra-reliable foundational fallback ensuring continuous service availability',
  },
];

export const DEFAULT_MODEL_ID = 'gemini-3.8-flash';

export const FALLBACK_CHAIN_ORDER = EXACT_GEMINI_MODELS.map((m) => m.id);
