import { CurriculumAnalysisResult } from './themes';
import { ProcessedFile } from '../utils/fileParser';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  attachments?: ProcessedFile[];
  synthesizedDocument?: CurriculumAnalysisResult;
  modelUsed?: string;
  isStreaming?: boolean;
  durationMs?: number;
}

export interface ExternalKeysConfig {
  openRouterKey?: string;
  groqKey?: string;
}

export interface ModelHealthInfo {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'groq';
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'rate_limited' | 'down';
  lastPing: number;
  consecutiveFailures: number;
  successCount: number;
}
