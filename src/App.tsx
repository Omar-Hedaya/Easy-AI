import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from './constants/themes';
import { ThemeConfig, TargetLanguage, CurriculumAnalysisResult } from './types/themes';
import { ChatMessage, ExternalKeysConfig } from './types/chat';
import { ProcessedFile, buildConcatenatedPdfCurriculum } from './utils/fileParser';
import { DocumentHeaderBar } from './components/DocumentHeaderBar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ChatSidebar } from './components/ChatSidebar';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { ExportStudioModal } from './components/ExportStudioModal';
import { EngineSettingsModal } from './components/EngineSettingsModal';
import { INITIAL_CURRICULUM_DATA } from './constants/initialData';
import {
  ChatSession,
  loadAllSessions,
  saveAllSessions,
  createNewSession,
  autoGenerateSessionTitle,
  getActiveSessionId,
  setActiveSessionId,
} from './utils/sessionStorage';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEMES[0]); // Classic Ivory
  const [currentLanguage, setCurrentLanguage] = useState<TargetLanguage>('ar-EG'); // Egyptian Arabic Default
  
  // Persistent Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadAllSessions();
    if (loaded.length > 0) return loaded;
    const initial = createNewSession('أنظمة التحكم الحديثة (جلسة افتتاحية)');
    // Seed initial session with initial curriculum summary message
    initial.messages = [
      {
        id: 'msg-welcome-init',
        role: 'model',
        content: `أهلاً بك يا هندسة في **Easy**! المنصة جاهزة لتحليل وتلخيص أي منهج أو كود أو ملفات PDF بالعامية المصرية الراقية ودقة رياضية كاملة بـ LaTeX بدون تكرار للقوانين.
تقدر تسحب وتفلت أي ملف هنا، أو تسأل عن أي معادلة، أو تضغط على أزرار التصدير بالأعلى!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        synthesizedDocument: INITIAL_CURRICULUM_DATA,
        modelUsed: 'gemini-3.8-flash',
      },
    ];
    initial.activeDocument = INITIAL_CURRICULUM_DATA;
    return [initial];
  });

  const [activeSessionId, setActiveSessionIdState] = useState<string>(() => {
    const storedActive = getActiveSessionId();
    if (storedActive && sessions.some((s) => s.id === storedActive)) {
      return storedActive;
    }
    return sessions[0]?.id || 'default-session';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isExportStudioOpen, setIsExportStudioOpen] = useState<boolean>(false);
  const [exportStudioContent, setExportStudioContent] = useState<string>('');
  const [exportStudioTitle, setExportStudioTitle] = useState<string>('Easy_Academic_Notes');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [lastModelUsed, setLastModelUsed] = useState<string>('gemini-3.8-flash');
  const [externalKeys, setExternalKeys] = useState<ExternalKeysConfig>(() => {
    try {
      const stored = localStorage.getItem('easy_external_keys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Active session helper
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [];
  const activeDocument = currentSession?.activeDocument || null;

  // Persist sessions to localStorage whenever sessions state changes
  useEffect(() => {
    saveAllSessions(sessions);
  }, [sessions]);

  // Persist active session ID
  useEffect(() => {
    if (activeSessionId) {
      setActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Apply live theme CSS variables dynamically across the app
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg', currentTheme.bgHex);
    root.style.setProperty('--text', currentTheme.textHex);
    root.style.setProperty('--header-accent', currentTheme.headerAccentHex);
    root.style.setProperty('--card-bg', currentTheme.cardBgHex);
    root.style.setProperty('--card-border', currentTheme.cardBorderHex);
    root.style.setProperty('--table-header-bg', currentTheme.tableHeaderBgHex);
    root.style.setProperty('--table-header-text', currentTheme.tableHeaderTextHex);
    root.style.setProperty('--table-row-even', currentTheme.tableRowEvenHex);
    root.style.setProperty('--table-row-odd', currentTheme.tableRowOddHex);
    root.style.setProperty('--table-border', currentTheme.tableBorderHex);
    root.style.setProperty('--code-bg', currentTheme.codeBgHex);
    root.style.setProperty('--code-text', currentTheme.codeTextHex);
    root.style.setProperty('--code-border', currentTheme.codeBorderHex);
    root.style.setProperty('--katex-color', currentTheme.katexColorHex);
    root.style.setProperty('--badge-bg', currentTheme.badgeBgHex);
    root.style.setProperty('--badge-text', currentTheme.badgeTextHex);
    root.style.setProperty('--accent', currentTheme.accentHex);
    root.style.setProperty('--accent-hover', currentTheme.accentHoverHex);
  }, [currentTheme]);

  // Apply language direction to document
  useEffect(() => {
    const isRtl = currentLanguage === 'ar-EG' || currentLanguage === 'ar-SA';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage);
  }, [currentLanguage]);

  // Save external keys
  const handleSaveExternalKeys = (keys: ExternalKeysConfig) => {
    setExternalKeys(keys);
    try {
      localStorage.setItem('easy_external_keys', JSON.stringify(keys));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const showNotification = (type: 'error' | 'success', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Session Handlers
  const handleCreateNewChat = () => {
    const newSession = createNewSession('New Academic Chat');
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionIdState(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionIdState(id);
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    );
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession('New Academic Chat');
        setActiveSessionIdState(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionIdState(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleClearAllSessions = () => {
    const fresh = createNewSession('New Academic Chat');
    setSessions([fresh]);
    setActiveSessionIdState(fresh.id);
    showNotification('success', 'Chat history cleared successfully.');
  };

  // Handle sending messages (conversational query or curriculum synthesis)
  const handleSendMessage = async (
    prompt: string,
    attachments: ProcessedFile[],
    requestSynthesis: boolean
  ) => {
    const userMsgId = `user-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: prompt,
      timestamp,
      attachments,
    };

    // Update active session with user message and auto-generate title if first user message
    const updatedMessages = [...messages, userMessage];
    const isFirstUserMessage = messages.filter((m) => m.role === 'user').length === 0;
    const newTitle = isFirstUserMessage
      ? autoGenerateSessionTitle(prompt || attachments[0]?.name || 'Academic Discussion')
      : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: newTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsLoading(true);

    try {
      const pdfFiles = attachments.filter(
        (a) => a.extension === 'pdf' || a.mimeType === 'application/pdf' || a.type === 'application/pdf'
      );
      const isMultiPdfBatch = pdfFiles.length > 1;

      const isCurriculumRequest =
        requestSynthesis ||
        isMultiPdfBatch ||
        prompt.includes('لخص منهج') ||
        prompt.includes('سجل قوانين') ||
        prompt.includes('curriculum') ||
        prompt.includes('synthesize document') ||
        prompt.includes('مصفوفة مقارنة') ||
        prompt.includes('المحاضرات كمنهج موحد') ||
        prompt.includes('cross-document');

      if (isCurriculumRequest) {
        // Collect raw content from prompt and attached files with dedicated multi-PDF concatenation
        let rawContent = prompt;
        if (isMultiPdfBatch) {
          const batch = buildConcatenatedPdfCurriculum(pdfFiles);
          rawContent += `\n\n${batch.concatenatedText}`;
          // Also append non-PDF files if any
          for (const att of attachments) {
            if (att.extension !== 'pdf' && att.mimeType !== 'application/pdf' && att.textContent) {
              rawContent += `\n\n[Attached File: "${att.name}" (${att.type || 'file'})]\n${att.textContent}`;
            }
          }
        } else {
          for (const att of attachments) {
            if (att.textContent) {
              rawContent += `\n\n[Attached Ingested File: "${att.name}" (${att.type || 'file'})]\n${att.textContent}`;
            }
          }
        }

        const synthesisTitle = isMultiPdfBatch
          ? `Cross-Document Synthesis (${pdfFiles.length} Lecture PDFs)`
          : prompt.slice(0, 80) || attachments[0]?.name || 'Academic Curriculum Synthesis';

        const res = await fetch('/api/curriculum/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: synthesisTitle,
            discipline: 'Academic Science & Engineering',
            targetLanguage: currentLanguage,
            level: 'Undergraduate / Professional',
            focus: 'Strict Anti-Repetition & Mathematical Precision',
            rawContent,
            externalKeys,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Synthesis failed (HTTP ${res.status})`);
        }

        const docResult: CurriculumAnalysisResult = await res.json();
        const modelUsed = (docResult as any)._modelUsed || 'gemini-3.8-flash';
        setLastModelUsed(modelUsed);

        const aiMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: isMultiPdfBatch
            ? `تم تحليل وتلخيص حزمة المحاضرات الشاملة المكونة من **${pdfFiles.length} ملفات PDF أكاديمية** (${pdfFiles.reduce((s, p) => s + (p.pageCount || 1), 0)} صفحة إجمالية) ودمجها في منهج موحد ومترابط يا فنان وفقاً لقاعدة عدم التكرار الصارمة (Zero Formula Duplication).
سجل القوانين الموحد يحتوي على **${docResult.masterFormulaLedger.length} قانون فريد** بدون أي تكرار عبر الجداول أو الشروحات، وتم توثيق كل قانون برمز [EQ-x] مستقل مع المقارنات ومصائد الامتحانات.
يمكنك النقر على زر **"Export Studio"** أو أزرار التصدير أعلى الرسالة لمعاينة وتصدير المنهج الشامل بصيغة PDF أو HTML أو Markdown بألوان كاملة.`
            : `تم تحليل وتلخيص المنهج الأكاديمي بنجاح يا فنان وفقاً لقاعدة عدم التكرار الصارمة (Zero Formula Duplication).
سجل القوانين الموحد يحتوي على **${docResult.masterFormulaLedger.length} قانون فريد** بدون أي تكرار عبر الجداول أو الشروحات، وتم توثيق كل قانون برمز [EQ-x] مستقل.
يمكنك النقر على زر **"Export Studio"** أو أزرار التصدير أعلى الرسالة لمعاينة وتصدير الملف بصيغة PDF أو HTML أو Markdown بألوان كاملة.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          synthesizedDocument: docResult,
          modelUsed,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: [...updatedMessages, aiMessage],
                  activeDocument: docResult,
                  lastModelUsed: modelUsed,
                }
              : s
          )
        );

        showNotification('success', `Curriculum synthesized using ${modelUsed}`);
      } else {
        // Conversational query with multimodal and untruncated context
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments?.map((a) => ({
                name: a.name,
                type: a.type,
                size: a.size,
                textContent: a.textContent,
                base64Data: a.base64Data,
                mimeType: a.mimeType,
              })),
            })),
            targetLanguage: currentLanguage,
            externalKeys,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Chat inference failed (HTTP ${res.status})`);
        }

        const data = await res.json();
        const modelUsed = data.modelUsed || 'gemini-3.8-flash';
        setLastModelUsed(modelUsed);

        const aiMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: [...updatedMessages, aiMessage],
                  lastModelUsed: modelUsed,
                }
              : s
          )
        );
      }
    } catch (err: any) {
      console.error('Inference error:', err);
      showNotification('error', err.message || 'Error processing request.');

      const errorMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: `حصلت مشكلة أثناء المعالجة: "${err.message}". تم فحص مسار الـ Fallback التلقائي. برجاء المحاولة مجدداً أو مراجعة مفاتيح الـ Fallback الخارجية في الإعدادات.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...updatedMessages, errorMessage],
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExportPreview = (doc?: CurriculumAnalysisResult) => {
    if (doc) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, activeDocument: doc } : s))
      );
    }
    setIsPreviewModalOpen(true);
  };

  const handleOpenExportStudio = (content: string, defaultTitle?: string) => {
    setExportStudioContent(content);
    if (defaultTitle) setExportStudioTitle(defaultTitle);
    setIsExportStudioOpen(true);
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 3-Zone Header Bar (Fixed at top, flex-shrink-0) */}
      <div className="flex-shrink-0">
        <DocumentHeaderBar
          currentTheme={currentTheme}
          onSelectTheme={setCurrentTheme}
          currentLanguage={currentLanguage}
          onSelectLanguage={setCurrentLanguage}
          onOpenPreview={() => handleOpenExportPreview(activeDocument || undefined)}
          onDirectPrint={handleDirectPrint}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewChat={handleCreateNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          hasAnalyzedData={Boolean(activeDocument || messages.length > 0)}
          lastModelUsed={lastModelUsed}
        />
      </div>

      {/* Main Row: Sidebar Drawer + Chat Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Collapsible Chat History Drawer */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectSession={handleSelectSession}
          onNewChat={handleCreateNewChat}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onClearAllSessions={handleClearAllSessions}
        />

        {/* Central Workspace (Zero Window Jumping, Fixed Sticky Bottom Input) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative p-1 sm:p-3">
          {/* Floating Notification */}
          {notification && (
            <div
              className={`fixed top-16 right-4 z-50 p-3 px-4 rounded-xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 ${
                notification.type === 'error'
                  ? 'bg-rose-950/90 border border-rose-800 text-rose-200'
                  : 'bg-emerald-950/90 border border-emerald-800 text-emerald-200'
              }`}
            >
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <ChatWorkspace
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            activeTheme={currentTheme}
            currentLanguage={currentLanguage}
            onOpenExportPreview={handleOpenExportPreview}
            onOpenExportStudio={handleOpenExportStudio}
            lastModelUsed={lastModelUsed}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>
      </div>

      {/* Hidden Export / Preview Modal for Formal Synthesized Documents */}
      {activeDocument && (
        <ExportPreviewModal
          data={activeDocument}
          activeTheme={currentTheme}
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          onPrintPdf={handleDirectPrint}
        />
      )}

      {/* Interactive Export Studio Modal for Individual Responses */}
      <ExportStudioModal
        isOpen={isExportStudioOpen}
        onClose={() => setIsExportStudioOpen(false)}
        content={exportStudioContent}
        defaultTitle={exportStudioTitle}
        activeTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
      />

      {/* Robust Fallback Engine & Resiliency Settings Modal */}
      <EngineSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        externalKeys={externalKeys}
        onSaveKeys={handleSaveExternalKeys}
        lastModelUsed={lastModelUsed}
      />
    </div>
  );
}
