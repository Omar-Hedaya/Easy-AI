import { ChatMessage } from '../types/chat';
import { CurriculumAnalysisResult } from '../types/themes';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  activeDocument?: CurriculumAnalysisResult | null;
  lastModelUsed?: string;
}

const SESSIONS_STORAGE_KEY = 'easy_academic_chat_sessions_v1';
const ACTIVE_SESSION_ID_KEY = 'easy_active_session_id_v1';

export function loadAllSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load chat sessions:', err);
    return [];
  }
}

export function saveAllSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save chat sessions:', err);
  }
}

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function createNewSession(initialTitle = 'New Academic Chat'): ChatSession {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messages: [],
    activeDocument: null,
    lastModelUsed: 'gemini-3.8-flash',
  };
}

export function autoGenerateSessionTitle(firstPrompt: string): string {
  if (!firstPrompt || !firstPrompt.trim()) return 'Academic Discussion';
  const clean = firstPrompt.trim().replace(/\s+/g, ' ');
  if (clean.length <= 40) return clean;
  return clean.slice(0, 38) + '...';
}
