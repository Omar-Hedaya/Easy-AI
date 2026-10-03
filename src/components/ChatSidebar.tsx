import React, { useState } from 'react';
import { ChatSession } from '../utils/sessionStorage';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bot,
  AlertTriangle,
} from 'lucide-react';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  isOpen,
  onToggleOpen,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onClearAllSessions,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 sm:w-80 bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-72 md:translate-x-0'
        }`}
      >
        {/* Top Header & New Chat Button */}
        <div className="p-3.5 border-b border-slate-800 flex flex-col gap-2.5 bg-slate-950/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Chat History
              </span>
            </div>
            <button
              onClick={onToggleOpen}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Prominent + New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Chat Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {sessions.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
              <MessageSquare className="w-6 h-6 mb-2 opacity-40 text-slate-400" />
              <p>No saved conversations yet.</p>
              <p className="text-[11px] text-slate-600">Start a new chat to begin!</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-blue-950/50 border-blue-500/50 text-white shadow-sm'
                      : 'bg-slate-900/50 border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(e as any, session.id);
                          if (e.key === 'Escape') cancelEditing(e as any);
                        }}
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    ) : (
                      <div className="truncate">
                        <div className="font-medium truncate">{session.title}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{session.messages.length} msgs</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions (Rename / Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => saveEditing(e, session.id)}
                          className="p-1 rounded text-emerald-400 hover:bg-slate-800 cursor-pointer"
                          title="Save title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 rounded text-slate-400 hover:bg-slate-800 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startEditing(e, session)}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 hover:bg-slate-800 transition-opacity cursor-pointer"
                          title="Rename chat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-slate-800 transition-opacity cursor-pointer"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Clear History */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-xs">
          {showClearConfirm ? (
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete all chat sessions?</span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllSessions();
                    setShowClearConfirm(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
                >
                  Confirm Clear
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={sessions.length === 0}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Chat History</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
