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
import { sendDirectChatMessage, analyzeDirectCurriculum } from './utils/geminiService';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEMES[0]); // Classic Ivory
  const [currentLanguage, setCurrentLanguage] = useState<TargetLanguage>('ar-EG'); // Egyptian Arabic Default
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('easy_selected_model');
      return stored || 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  });
  
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

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [liveFailoverStatus, setLiveFailoverStatus] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isExportStudioOpen, setIsExportStudioOpen] = useState<boolean>(false);
  const [exportStudioContent, setExportStudioContent] = useState<string>('');
  const [exportStudioTitle, setExportStudioTitle] = useState<string>('Easy_Academic_Notes');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [lastModelUsed, setLastModelUsed] = useState<string>(() => selectedModel);
  const [externalKeys, setExternalKeys] = useState<ExternalKeysConfig>(() => {
    try {
      const stored = localStorage.getItem('easy_external_keys');
      const parsed = stored ? JSON.parse(stored) : {};
      const directGroq = localStorage.getItem('groq_api_key');
      const directOpenRouter = localStorage.getItem('openrouter_api_key');
      return {
        ...parsed,
        groqKey: parsed.groqKey || (directGroq?.trim() || undefined),
        openRouterKey: parsed.openRouterKey || (directOpenRouter?.trim() || undefined),
      };
    } catch {
      return {};
    }
  });
  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'warning'; message: string } | null>(null);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setLastModelUsed(modelId); // Sync immediately with chat workspace badge
    try {
      localStorage.setItem('easy_selected_model', modelId);
    } catch (e) {
      console.warn(e);
    }
    showNotification('success', `Active inference model set to ${modelId}`);
  };

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
      if (keys.groqKey) {
        localStorage.setItem('groq_api_key', keys.groqKey.trim());
      } else {
        localStorage.removeItem('groq_api_key');
      }
      if (keys.openRouterKey) {
        localStorage.setItem('openrouter_api_key', keys.openRouterKey.trim());
      } else {
        localStorage.removeItem('openrouter_api_key');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const showNotification = (type: 'error' | 'success' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Session Handlers
  const handleCreateNewChat = () => {
    const newSession = createNewSession('New Academic Chat');
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionIdState(newSession.id);
    showNotification('success', 'New chat session started.');
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
    requestSynthesis: boolean,
    searchGrounding: boolean = true
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

    // Requirement 3: Read API key strictly via import.meta.env.VITE_GEMINI_API_KEY
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      alert('API Key is missing in environment variables');
      return;
    }

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

        // Requirement 1 & 4: Direct Google Gemini API Call with Multimodal/PDF inputs and Cascading Multi-Tier Failover
        const {
          result: docResult,
          modelUsed,
          switchedDueTo404,
          switchedFrom,
          switchedDueToQuota,
          fallbackProvider,
          fallbackTier,
          fallbackNotice,
        } = await analyzeDirectCurriculum({
          title: synthesisTitle,
          discipline: 'Academic Science & Engineering',
          targetLanguage: currentLanguage,
          level: 'Undergraduate / Professional',
          focus: 'Strict Anti-Repetition & Mathematical Precision',
          rawContent,
          model: selectedModel,
          attachments: pdfFiles,
          groqKey: externalKeys.groqKey,
          openRouterKey: externalKeys.openRouterKey,
          onFailoverStatus: (tier, provider, message) => {
            setLiveFailoverStatus(message);
            showNotification('warning', message);
          },
        });

        setLastModelUsed(modelUsed);

        if (switchedDueToQuota) {
          if (fallbackProvider === 'groq') {
            showNotification(
              'success',
              '⚡ GROQ T1 (Ultra-Fast Active) - تم التحويل التلقائي بنجاح إلى Groq (Tier 1)'
            );
          } else {
            showNotification(
              'success',
              `✓ استمرارية الجلسة: تم توليد المنهج بنجاح عبر (${modelUsed}) [Tier ${fallbackTier || 2}: ${fallbackProvider?.toUpperCase()}]`
            );
          }
        } else if (switchedDueTo404) {
          setSelectedModel(modelUsed);
          showNotification(
            'warning',
            `⚠️ Model ${switchedFrom || selectedModel} returned 404 (Not Found). Automatically switched to ${modelUsed} with all PDF attachments preserved.`
          );
        } else {
          showNotification('success', `Curriculum synthesized using ${modelUsed}`);
        }

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
          switchedDueTo404,
          switchedFrom,
          switchedDueToQuota,
          fallbackProvider,
          fallbackTier,
          fallbackNotice,
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
      } else {
        // Requirement 1, 2 & Cascading Failover: Direct Google Gemini API conversational inference
        // If 429/503/Quota is hit, automatically cascades: Tier 1 (Groq) -> Tier 2 (OpenRouter) -> Tier 3 (OpenRouter Free)
        const {
          result: replyText,
          modelUsed,
          switchedDueTo404,
          switchedFrom,
          groundingMetadata,
          isGrounded,
          switchedDueToQuota,
          fallbackProvider,
          fallbackTier,
          fallbackNotice,
        } = await sendDirectChatMessage({
          messages: updatedMessages,
          model: selectedModel,
          targetLanguage: currentLanguage,
          enableSearchGrounding: searchGrounding,
          groqKey: externalKeys.groqKey,
          openRouterKey: externalKeys.openRouterKey,
          onFailoverStatus: (tier, provider, message) => {
            setLiveFailoverStatus(message);
            showNotification('warning', message);
          },
        });

        setLastModelUsed(modelUsed);

        if (switchedDueToQuota) {
          if (fallbackProvider === 'groq') {
            showNotification(
              'success',
              '⚡ GROQ T1 (Ultra-Fast Active) - تم التحويل التلقائي بنجاح إلى Groq (Tier 1)'
            );
          } else {
            showNotification(
              'success',
              `✓ استمرارية الجلسة: تم إكمال الرد بنجاح عبر (${modelUsed}) [Tier ${fallbackTier || 2}: ${fallbackProvider?.toUpperCase()}]`
            );
          }
        } else if (switchedDueTo404) {
          setSelectedModel(modelUsed);
          showNotification(
            'warning',
            `⚠️ Model ${switchedFrom || selectedModel} returned 404 (Not Found). Automatically switched to ${modelUsed} with full PDF context preserved.`
          );
        } else if (isGrounded) {
          showNotification('success', `✓ Google Search Grounding: تم التحقق وتوثيق المراجع الأكاديمية بنجاح`);
        }

        const aiMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed,
          switchedDueTo404,
          switchedFrom,
          groundingMetadata,
          isGrounded,
          switchedDueToQuota,
          fallbackProvider,
          fallbackTier,
          fallbackNotice,
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
        content: `حصلت مشكلة أثناء المعالجة: "${err.message}". تم فحص مسار الـ Fallback التلقائي. برجاء المحاولة مجدداً أو التأكد من توفر مفتاح Gemini API في متغيرات البيئة.`,
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
      setLiveFailoverStatus(null);
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
      <div className="flex-shrink-0 relative z-50 pointer-events-auto">
        <DocumentHeaderBar
          currentTheme={currentTheme}
          onSelectTheme={setCurrentTheme}
          currentLanguage={currentLanguage}
          onSelectLanguage={setCurrentLanguage}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          onOpenPreview={() => handleOpenExportPreview(activeDocument || undefined)}
          onDirectPrint={handleDirectPrint}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewChat={handleCreateNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          hasAnalyzedData={Boolean(activeDocument || messages.length > 0)}
          lastModelUsed={lastModelUsed}
          isSidebarOpen={isSidebarOpen}
          onOpenExportStudio={() => handleOpenExportStudio(messages.map((m) => m.content).join('\n\n'))}
        />
      </div>

      {/* Main Row: Sidebar Drawer + Chat Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Collapsible Chat History Drawer (Overlay on Mobile/Desktop with 0 Squeezing) */}
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

        {/* Central Workspace (Zero Window Jumping, Fixed Sticky Bottom Input, 100% Mobile Width) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative p-0 sm:p-2 md:p-3">
          {/* Floating Notification */}
          {notification && (
            <div
              className={`fixed top-16 right-4 z-50 p-3 px-4 rounded-xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 ${
                notification.type === 'error'
                  ? 'bg-rose-950/90 border border-rose-800 text-rose-200'
                  : notification.type === 'warning'
                  ? 'bg-amber-950/90 border border-amber-800 text-amber-200'
                  : 'bg-emerald-950/90 border border-emerald-800 text-emerald-200'
              }`}
            >
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
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
            activeSessionId={activeSessionId}
            liveFailoverStatus={liveFailoverStatus}
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
