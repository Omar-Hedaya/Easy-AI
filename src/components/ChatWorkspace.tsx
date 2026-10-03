import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/chat';
import { ProcessedFile, processUploadedFile, formatBytes } from '../utils/fileParser';
import { CurriculumAnalysisResult, ThemeConfig, TargetLanguage } from '../types/themes';
import { DocumentCard } from './DocumentCard';
import { MathView, RichMathText } from '../utils/mathRenderer';
import { printMessageAsPdf, downloadMessageHtml } from '../utils/messageExporter';
import { GroundingSourcesView } from './GroundingSourcesView';
import {
  Send,
  Paperclip,
  X,
  FileCode,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Archive,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Zap,
  BookOpen,
  Printer,
  Sliders,
  ArrowDown,
  Files,
  Trash2,
  Loader2,
  Layers,
  AlertTriangle,
  Globe,
  Atom,
} from 'lucide-react';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments: ProcessedFile[], requestSynthesis: boolean, searchGrounding?: boolean) => void;
  isLoading: boolean;
  activeTheme: ThemeConfig;
  currentLanguage: TargetLanguage;
  onOpenExportPreview: (doc: CurriculumAnalysisResult) => void;
  onOpenExportStudio: (content: string, defaultTitle?: string) => void;
  lastModelUsed?: string;
  onOpenSettings: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeTheme,
  currentLanguage,
  onOpenExportPreview,
  onOpenExportStudio,
  lastModelUsed = 'gemini-3.8-flash',
  onOpenSettings,
  isSidebarOpen = false,
  onToggleSidebar,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<ProcessedFile[]>([]);
  const [requestSynthesis, setRequestSynthesis] = useState(false);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiPdfInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // User-scroll detection to prevent auto-scrolling to top or abrupt jumps
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isNear = distanceToBottom < 140;
    isNearBottomRef.current = isNear;
    setShowScrollBottomBtn(distanceToBottom > 300);
  };

  // Safe auto-scroll ONLY when user is already near bottom (no window jumping)
  useEffect(() => {
    if (isNearBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Universal Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await handleProcessFiles(files);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleProcessFiles(files);
      e.target.value = '';
    }
  };

  const handleProcessFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);
    const pdfCount = files.filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    ).length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (pdfCount > 1) {
        setProcessingStatus(`Extracting lecture text (${i + 1}/${files.length}): "${file.name}"...`);
      } else {
        setProcessingStatus(`Ingesting "${file.name}"...`);
      }
      try {
        const processed = await processUploadedFile(file);
        setAttachments((prev) => [...prev, processed]);
      } catch (err) {
        console.error('Failed to parse file:', file.name, err);
      }
    }
    setIsProcessingFiles(false);
    setProcessingStatus(null);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputPrompt.trim() && attachments.length === 0) || isLoading) return;

    onSendMessage(inputPrompt, attachments, requestSynthesis, enableSearchGrounding);
    setInputPrompt('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Set near bottom true on new user submission
    isNearBottomRef.current = true;
    setTimeout(scrollToBottom, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileIcon = (category: ProcessedFile['fileCategory']) => {
    switch (category) {
      case 'code':
        return <FileCode className="w-3.5 h-3.5 text-cyan-400" />;
      case 'data':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'archive':
        return <Archive className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const samplePrompts = [
    {
      title: 'تدقيق ثوابت CODATA ومعادلات ماكسويل',
      prompt: 'تحقق لحظياً عبر Google Search من أدق قيم الثوابت الفيزيائية العالمية (Planck constant h, Speed of light c, Elementary charge e, Boltzmann constant k_B) وفق معايير CODATA العالمية، واشرح معادلات ماكسويل الأربعة بصيغتها التفاضلية مع توثيق المصادر.',
      badge: 'التحقق الأكاديمي المباشر',
    },
    {
      title: 'شرح فضاء الحالة وأنظمة التحكم',
      prompt: 'اشرح لي بمثال عملي بالعامية المصرية إزاي بنحول معادلة تفاضلية من الدرجة الثانية لتمثيل فضاء الحالة (State-Space) واشتقاق مصفوفات A و B و C مع صيغة أكرمان للتحكم.',
      badge: 'الهندسة والتحكم',
    },
    {
      title: 'أحدث التطورات العلمية ونماذج الاستدلال 2026',
      prompt: 'تحقق لحظياً عبر Google Search من أحدث الابتكارات في نماذج الاستدلال الممتد (Extended Reasoning & Chain-of-Thought) ومقارنة مؤشرات الأداء العلمية على معايير الرياضيات والبرمجة مع توثيق الأوراق البحثية.',
      badge: 'الابتكارات العلمية الحديثة',
    },
    {
      title: 'حسابات التمريض ومعدلات التسريب الوريدي',
      prompt: 'اشرح معادلات حساب جرعات أدوية الطوارئ في العناية المركزة، والـ Mean Arterial Pressure (MAP) ومعدل التنقيط gtt/min مع التحقق من المعايير السريرية العالمية.',
      badge: 'التمريض والطب',
    },
  ];

  const getExportContent = (msg: ChatMessage) => {
    let content = msg.content;
    const sources = msg.groundingMetadata?.groundingChunks
      ?.filter((c) => c.web?.uri)
      ?.map((c, i) => `${i + 1}. [${c.web?.title || c.web?.uri}](${c.web?.uri})`)
      ?.join('\n');
    if (sources) {
      content += `\n\n---\n### 🌐 المراجع والمصادر الأكاديمية الموثقة عبر Google Search\n${sources}`;
    }
    return content;
  };

  const getSurvivingModelBadge = (msg: ChatMessage): string => {
    const rawModel = msg.modelUsed || '';
    if (msg.fallbackProvider === 'groq') {
      const clean = rawModel
        .replace(/^groq\//, '')
        .replace(/-versatile$/, '')
        .replace(/-instant$/, '')
        .replace(/^openai\//, '');
      return `Groq (${clean || 'llama-3.3-70b'})`;
    }
    if (msg.fallbackProvider === 'openrouter') {
      const clean = rawModel
        .replace(/^openrouter\//, '')
        .replace(/^[^/]+\//, '')
        .replace(/:free$/, '')
        .replace(/-instruct$/, '');
      return `OpenRouter (${clean || 'deepseek-chat'})`;
    }
    return rawModel;
  };

  return (
    <div
      className="relative flex flex-col h-full w-full max-w-6xl mx-auto rounded-none md:rounded-2xl border-0 md:border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex-1 min-h-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Universal Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-950/90 border-2 border-dashed border-cyan-400 backdrop-blur-xs p-6 text-center animate-in fade-in">
          <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-300 mb-3 animate-bounce">
            <Archive className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            Universal Drag & Drop Active
          </h3>
          <p className="text-sm text-cyan-200 max-w-md">
            Drop any file: Code (.py, .ts, .cpp), Documents (.pdf, .docx, .md), Data (.csv, .xlsx), Images or Archives (.zip)
          </p>
        </div>
      )}

      {/* Messages Feed (Starts immediately underneath top navbar to maximize vertical reading area) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-5 space-y-4 sm:space-y-5 scrollbar-thin"
      >
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-900/30 mb-3">
              <Bot className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              أهلاً بك في Easy الأكاديمي الذكي
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
              منصة ذكية متخصصة في تحليل وتلخيص المناهج الأكاديمية (الهندسة، الرياضيات، التمريض، الفيزياء، الحاسب) بالعامية المصرية الأكاديمية السلسة مع دقة رياضية مطلقة بـ LaTeX وقاعدة منع تكرار القوانين.
            </p>

            {/* Universal Ingestion Notice */}
            <div className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 mb-6 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>معالجة فائقة للملفات:</strong> اسحب وأفلت ملفات PDF (استخراج نصوص كامل بـ pdfjs-dist ودعم مالتي-مودال أصيل)، أكواد، مستندات، وأرشيفات مضغوطة.
              </span>
            </div>

            {/* Quick Prompt Cards */}
            <div className="w-full text-left">
              <div className="text-xs font-semibold text-slate-400 mb-2.5 px-1">
                نماذج جاهزة للاستكشاف الأكاديمي السريع:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(sp.prompt);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 w-fit mb-1">
                      {sp.badge}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 mb-0.5">{sp.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{sp.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isAr = /[\u0600-\u06FF]/.test(msg.content);

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[85%]`}>
                  {/* Attached files in user message */}
                  {isUser && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 justify-end">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200"
                        >
                          {getFileIcon(att.fileCategory)}
                          <span className="font-mono truncate max-w-[140px]">{att.name}</span>
                          <span className="text-slate-400 text-[10px]">({formatBytes(att.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Bubble Container */}
                  <div
                    className={`rounded-2xl text-sm leading-relaxed overflow-hidden shadow-md w-full ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none p-3.5 sm:p-4'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {/* Triple Action Buttons on Top of Every Bot Message */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium text-slate-400">
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold text-slate-200">Easy AI</span>
                          {msg.modelUsed && (
                            <span className="font-mono text-[10px] text-cyan-400/90 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
                              {msg.modelUsed}
                            </span>
                          )}
                          {msg.switchedDueToQuota && (
                            <span
                              className={`flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded border shadow-xs ${
                                msg.fallbackProvider === 'groq'
                                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 font-bold shadow-amber-900/40'
                                  : 'bg-purple-950/80 border-purple-500/80 text-purple-200 font-bold shadow-purple-900/40'
                              }`}
                              title={msg.fallbackNotice || 'Surviving failover model active'}
                            >
                              <Zap className={`w-2.5 h-2.5 ${msg.fallbackProvider === 'groq' ? 'text-amber-400' : 'text-purple-400'}`} />
                              <span>{getSurvivingModelBadge(msg)}</span>
                            </span>
                          )}
                          {(msg.groundingMetadata || msg.isGrounded) && (
                            <span
                              className="flex items-center gap-1 font-mono text-[10px] text-cyan-300 bg-cyan-950/70 border border-cyan-800/50 px-1.5 py-0.5 rounded shadow-xs"
                              title="Verified in real-time via Google Search Grounding"
                            >
                              <Globe className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                              <span>Grounded</span>
                            </span>
                          )}
                        </div>

                        {/* 3 Dedicated Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* 1. Quick Export PDF */}
                          <button
                            type="button"
                            onClick={() => printMessageAsPdf(getExportContent(msg), 'الخلاصة الأكاديمية', activeTheme)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 transition-colors cursor-pointer"
                            title="Quick Export PDF: Instantly downloads/prints formatted message as a PDF document"
                          >
                            <Printer className="w-3 h-3 text-rose-400" />
                            <span>PDF</span>
                          </button>

                          {/* 2. Quick Export HTML */}
                          <button
                            type="button"
                            onClick={() => downloadMessageHtml(getExportContent(msg), 'الخلاصة الأكاديمية', activeTheme)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-300 hover:text-white bg-blue-950/50 hover:bg-blue-900/70 border border-blue-800/60 transition-colors cursor-pointer"
                            title="Quick Export HTML: Instantly downloads message as a standalone HTML document"
                          >
                            <FileCode className="w-3 h-3 text-blue-400" />
                            <span>HTML</span>
                          </button>

                          {/* 3. Export Studio (Modal) */}
                          <button
                            type="button"
                            onClick={() => onOpenExportStudio(getExportContent(msg), 'الخلاصة الأكاديمية')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-cyan-200 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 transition-colors cursor-pointer shadow-sm"
                            title="Export Studio: Edit file name, select theme, view live preview before saving"
                          >
                            <Sliders className="w-3 h-3 text-cyan-400" />
                            <span>Export Studio</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline 404 Automatic Model Switch Notification Banner */}
                    {!isUser && msg.switchedDueTo404 && (
                      <div className="mx-3.5 mt-3 p-3 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          <div className="font-bold text-amber-300 flex items-center gap-1.5">
                            <span>Automatic Failover Active (HTTP 404 Not Found)</span>
                          </div>
                          <p className="text-amber-200/90">
                            Model <code className="px-1 py-0.5 rounded bg-amber-900/60 font-mono text-[10px] text-amber-100">{msg.switchedFrom || 'Target Model'}</code> was unavailable in your project account (HTTP 404). The Resiliency Engine seamlessly failed over to <code className="px-1 py-0.5 rounded bg-amber-900/60 font-mono text-[10px] text-amber-100 font-bold">{msg.modelUsed}</code>.
                          </p>
                          <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                            <span>✓ All uploaded PDF attachments and multimodal context were preserved 100%.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline Multi-Tier Quota & Rate-Limit Failover Banner */}
                    {!isUser && msg.switchedDueToQuota && (
                      <div className={`mx-3.5 mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in shadow-inner ${
                        msg.fallbackProvider === 'groq'
                          ? 'bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-amber-950/40 border-amber-500/70 text-amber-200'
                          : 'bg-gradient-to-r from-purple-950/50 via-slate-900/90 to-blue-950/50 border-purple-600/40 text-purple-200'
                      }`}>
                        <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                          msg.fallbackProvider === 'groq' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 text-[11px] leading-relaxed flex-1">
                          <div className="font-bold flex items-center justify-between flex-wrap gap-1">
                            <span className="flex items-center gap-1.5">
                              {msg.fallbackProvider === 'groq' ? (
                                <span className="text-amber-300 font-extrabold flex items-center gap-1.5">
                                  <span>{getSurvivingModelBadge(msg)}</span>
                                  <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-amber-900/90 text-amber-100 border border-amber-600 font-semibold">
                                    Groq Tier 1 Active
                                  </span>
                                </span>
                              ) : (
                                <span className="text-purple-300 font-bold flex items-center gap-1.5">
                                  <span>{getSurvivingModelBadge(msg)}</span>
                                  <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-purple-900/90 text-purple-100 border border-purple-600 font-semibold">
                                    OpenRouter Tier 2 Active
                                  </span>
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 uppercase px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40">
                              {msg.modelUsed}
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium">
                            {msg.fallbackNotice || (msg.fallbackProvider === 'groq'
                              ? 'GROQ T1 (Ultra-Fast Active) - تم التحويل التلقائي بنجاح إلى Groq (Tier 1)'
                              : 'تم تحويل الطلب تلقائياً إلى OpenRouter لتجاوز حدود الحصة وضمان استمرارية الجلسة.')}
                          </p>
                          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-2 flex-wrap">
                            <span>✓ تم الحفاظ على سياق المحاضرات والملفات والأسلوب الأكاديمي بنسبة 100%.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={!isUser ? 'p-3.5 sm:p-5' : ''} dir={isAr ? 'rtl' : 'ltr'}>
                      <RichMathText text={msg.content} />

                      {/* Google Search Grounding Academic Validation Sources Panel */}
                      {!isUser && (msg.groundingMetadata || msg.isGrounded) && (
                        <GroundingSourcesView
                          metadata={msg.groundingMetadata}
                          isGrounded={msg.isGrounded}
                        />
                      )}

                      {/* Synthesized Curriculum Document (Embedded on demand) */}
                      {msg.synthesizedDocument && (
                        <DocumentCard
                          document={msg.synthesizedDocument}
                          theme={activeTheme}
                          onOpenExportPreview={onOpenExportPreview}
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer Meta: Timestamp & Copy */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-0.5 ml-1"
                      title="Copy content"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 mr-auto max-w-4xl items-center">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Easy AI is reasoning and computing exact formulas...</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-900/40 transition-all cursor-pointer z-20 flex items-center justify-center animate-bounce"
          title="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* File Extraction Progress Indicator */}
      {isProcessingFiles && (
        <div className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-blue-950/90 to-cyan-950/90 border-t border-cyan-800/60 flex items-center justify-between text-xs text-cyan-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span className="font-mono">{processingStatus || 'Extracting lecture slides & PDF text...'}</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">PDF.js Engine</span>
        </div>
      )}

      {/* Multi-PDF Academic Batch Zone */}
      {(() => {
        const pdfAttachments = attachments.filter(
          (a) => a.extension === 'pdf' || a.mimeType === 'application/pdf' || a.type === 'application/pdf'
        );
        const totalPdfPages = pdfAttachments.reduce((sum, p) => sum + (p.pageCount || 1), 0);
        const totalPdfBytes = pdfAttachments.reduce((sum, p) => sum + p.size, 0);

        if (pdfAttachments.length < 2) return null;

        return (
          <div className="flex-shrink-0 px-3.5 py-2.5 bg-gradient-to-r from-blue-950/95 via-slate-900/95 to-cyan-950/95 border-t border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 shadow-sm">
                <Files className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    حزمة محاضرات متعددة ({pdfAttachments.length} ملفات PDF)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 font-mono border border-cyan-700/60">
                    {totalPdfPages} صفحة إجمالية · {formatBytes(totalPdfBytes)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  سيتم دمج المحتوى كمنهج دراسي موحد ومترابط في تحليل Gemini بدون تكرار
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRequestSynthesis(true);
                  if (!inputPrompt.trim()) {
                    setInputPrompt('قم بتوليد ملخص وتجميعة أكاديمية شاملة ومترابطة لجميع محاضرات الـ PDF المرفقة كمنهج دراسي موحد، مع استخراج مصفوفة القوانين الشاملة وحسابات التحويل ومصائد الامتحانات دون أي تكرار.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                title="Synthesize all uploaded lecture PDFs into a unified curriculum"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>تلخيص المحاضرات كمنهج موحد</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttachments((prev) => prev.filter((a) => a.extension !== 'pdf' && a.mimeType !== 'application/pdf'));
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Remove all PDF lectures from batch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Attached Files Preview Dock */}
      {attachments.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-950/95 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
            Attached ({attachments.length}):
          </span>
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 shrink-0 shadow-sm"
            >
              {getFileIcon(file.fileCategory)}
              <span className="font-mono text-[11px] truncate max-w-[160px]">{file.name}</span>
              {file.pageCount && file.pageCount > 1 && (
                <span className="text-[10px] text-cyan-300 font-mono">({file.pageCount}p)</span>
              )}
              <span className="text-[10px] text-slate-400">({formatBytes(file.size)})</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(file.id)}
                className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fixed Sticky Bottom Input Container */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-slate-950 border-t border-slate-800 z-10 sticky bottom-0">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-2.5 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all shadow-lg">
            {/* Real-Time Google Search Grounding Active Banner */}
            {enableSearchGrounding && (
              <div className="flex items-center justify-between px-2.5 py-1 mb-1.5 rounded-lg bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-cyan-950/80 border border-cyan-800/40 text-[10px] text-cyan-300 select-none">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
                  <span>
                    <strong>Google Search Grounding نشط:</strong> تدقيق لحظي للثوابت الفيزيائية (CODATA)، صيغ المعادلات، وأحدث الأبحاث العلمية.
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE VALIDATION</span>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك، اطلب شرح مفهوم، أو الصق كود/منهج بالعامية المصرية... (Enter للإرسال، Shift+Enter لسطر جديد)"
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none px-2 py-1 max-h-32 overflow-y-auto font-sans"
              dir="auto"
            />

            {/* Bottom Controls inside input box */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Generic File Attachment Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Attach any file (Code, PDF, Word, Data, Images, ZIP...)"
                >
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Attach</span>
                </button>

                {/* Dedicated Multi-PDF Batch Upload Button */}
                <input
                  type="file"
                  ref={multiPdfInputRef}
                  onChange={handleFileInputChange}
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => multiPdfInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-800/80 hover:border-cyan-600 transition-all cursor-pointer shadow-sm"
                  title="Upload multiple academic lecture PDFs at once for cross-document synthesis"
                >
                  <Files className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Upload Lecture PDFs</span>
                  <span className="text-[10px] bg-cyan-800/90 text-cyan-100 px-1 py-0.2 rounded font-mono">+PDFs</span>
                </button>

                {/* Synthesis Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setRequestSynthesis(!requestSynthesis)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    requestSynthesis
                      ? 'bg-blue-900/40 border-blue-500/50 text-blue-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Toggle full formal curriculum document synthesis"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">Full Curriculum Synthesis</span>
                </button>

                {/* Google Search Grounding Toggle Button */}
                <button
                  type="button"
                  onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    enableSearchGrounding
                      ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 shadow-sm shadow-cyan-950/60 ring-1 ring-cyan-500/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Toggle real-time Google Search Grounding to verify constants, equations & scientific breakthroughs"
                >
                  <Globe className={`w-3.5 h-3.5 ${enableSearchGrounding ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">Search Grounding</span>
                  {enableSearchGrounding ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-mono">ON</span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">OFF</span>
                  )}
                </button>
              </div>

              {/* Send Button */}
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-[11px] text-slate-500 font-mono">
                  Shift+Enter for newline
                </span>
                <button
                  type="submit"
                  disabled={isLoading || (!inputPrompt.trim() && attachments.length === 0)}
                  className="flex items-center justify-center p-2 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Send</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
