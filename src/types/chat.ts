import { CurriculumAnalysisResult } from './themes';
import { ProcessedFile } from '../utils/fileParser';

export interface GroundingWebSource {
  uri?: string;
  title?: string;
}

export interface GroundingChunk {
  web?: GroundingWebSource;
}

export interface GroundingSupport {
  groundingChunkIndices?: number[];
  confidenceScores?: number[];
  segment?: {
    startIndex?: number;
    endIndex?: number;
    text?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  attachments?: ProcessedFile[];
  synthesizedDocument?: CurriculumAnalysisResult;
  modelUsed?: string;
  switchedDueTo404?: boolean;
  switchedFrom?: string;
  failoverNotice?: string;
  isStreaming?: boolean;
  durationMs?: number;
  groundingMetadata?: GroundingMetadata;
  isGrounded?: boolean;
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
