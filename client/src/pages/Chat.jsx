import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getChats,
  createChat,
  getChatById,
  sendChatMessageStream,
  getDocuments,
  updateChatTitle,
  deleteChat,
} from '../services/api';
import CitationModal from '../components/CitationModal';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Toast from '../components/Toast';
import {
  MessageSquare,
  Send,
  Plus,
  FileText,
  CheckSquare,
  Square,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Pin,
  Edit2,
  Trash2,
  Search,
  Copy,
  Check,
  X,
  Clock,
  Cpu,
  Database,
  BarChart2,
  Zap,
} from 'lucide-react';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId');

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(initialDocId ? [initialDocId] : []);

  // Filter & Search states
  const [chatSearch, setChatSearch] = useState('');
  const [pinnedChatIds, setPinnedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pinnedChatIds') || '[]');
    } catch (e) {
      return [];
    }
  });

  // UI state
  const [inputQuery, setInputQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [retrievalStats, setRetrievalStats] = useState(null);

  // Modals & Toasts
  const [toast, setToast] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const queryInputRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [chatsRes, docsRes] = await Promise.all([getChats(), getDocuments()]);
      setChats(chatsRes.data.chats);
      setDocuments(docsRes.data.documents);

      if (chatsRes.data.chats.length > 0) {
        loadChatSession(chatsRes.data.chats[0].id);
      } else {
        handleCreateNewChat();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load initial chat workspace.' });
    }
  };

  const loadChatSession = async (chatId) => {
    setLoadingMessages(true);
    setRetrievalStats(null);
    try {
      const res = await getChatById(chatId);
      setActiveChat(res.data.chat);
      setMessages(res.data.messages);
    } catch (err) {
      setToast({ type: 'error', message: 'Error loading chat messages.' });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const res = await createChat({
        title: 'New Document Chat',
        documentIds: selectedDocIds,
      });
      const newChat = res.data.chat;
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      setMessages([]);
      setRetrievalStats(null);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to create new chat session.' });
    }
  };

  const handleRenameChat = async (chatId) => {
    if (!editTitleText.trim()) return;
    try {
      const res = await updateChatTitle(chatId, editTitleText.trim());
      setChats((prev) => prev.map((c) => (c.id === chatId ? res.data.chat : c)));
      if (activeChat?.id === chatId) {
        setActiveChat(res.data.chat);
      }
      setEditingChatId(null);
      setToast({ type: 'success', message: 'Chat title updated.' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to rename chat.' });
    }
  };

  const handleDeleteChatConfirm = async () => {
    if (!deletingChatId) return;
    try {
      await deleteChat(deletingChatId);
      const remaining = chats.filter((c) => c.id !== deletingChatId);
      setChats(remaining);
      setToast({ type: 'success', message: 'Chat session deleted.' });
      setDeletingChatId(null);

      if (activeChat?.id === deletingChatId) {
        if (remaining.length > 0) {
          loadChatSession(remaining[0].id);
        } else {
          handleCreateNewChat();
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete chat.' });
    }
  };

  const togglePinChat = (chatId, e) => {
    e.stopPropagation();
    setPinnedChatIds((prev) => {
      const updated = prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId];
      localStorage.setItem('pinnedChatIds', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || !activeChat || sending) return;

    const queryText = inputQuery;
    setInputQuery('');
    setSending(true);

    const tempUserMsgId = `user-${Date.now()}`;
    const tempAssistantMsgId = `assistant-${Date.now()}`;

    // Append Optimistic User Message
    const userMsg = {
      id: tempUserMsgId,
      sender: 'user',
      content: queryText,
      created_at: new Date().toISOString(),
    };

    // Placeholder Assistant Message for SSE token streaming
    const assistantMsgPlaceholder = {
      id: tempAssistantMsgId,
      sender: 'assistant',
      content: '',
      citations: [],
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsgPlaceholder]);

    await sendChatMessageStream(activeChat.id, {
      query: queryText,
      documentIds: selectedDocIds,
    }, {
      onCitations: (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId ? { ...msg, citations: data.citations || [] } : msg
          )
        );
        if (data.stats) setRetrievalStats(data.stats);
      },
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId ? { ...msg, content: msg.content + token } : msg
          )
        );
      },
      onDone: (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId
              ? { ...(data.message || msg), isStreaming: false }
              : msg
          )
        );
        if (data.stats) setRetrievalStats(data.stats);
        setSending(false);
      },
      onError: (errMsg) => {
        setToast({ type: 'error', message: errMsg || 'Streaming answer error.' });
        setSending(false);
      },
    });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== queryInputRef.current) {
        e.preventDefault();
        queryInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSelectedCitation(null);
        setEditingChatId(null);
        setDeletingChatId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const toggleDocumentSelection = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const copyMessageContent = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Sorted and Filtered Chats List
  const filteredChats = useMemo(() => {
    return chats
      .filter((c) => c.title.toLowerCase().includes(chatSearch.toLowerCase()))
      .sort((a, b) => {
        const isAPinned = pinnedChatIds.includes(a.id);
        const isBPinned = pinnedChatIds.includes(b.id);
        if (isAPinned && !isBPinned) return -1;
        if (!isAPinned && isBPinned) return 1;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
  }, [chats, chatSearch, pinnedChatIds]);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-6 overflow-hidden relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Left Sidebar: Chats, Multi-Doc Scope, Search & Actions */}
      <div className="w-80 shrink-0 glass-panel rounded-2xl p-4 flex flex-col justify-between border-slate-800 hidden md:flex">
        <div className="space-y-4 overflow-hidden flex flex-col h-full">
          {/* New Chat Button */}
          <button
            onClick={handleCreateNewChat}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>New Document Chat</span>
          </button>

          {/* Scope Documents Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Scope Documents</span>
              <span className="text-[10px] text-indigo-400 font-mono">
                {selectedDocIds.length === 0 ? 'All Files' : `${selectedDocIds.length} Selected`}
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-950/60 border border-indigo-500/40 text-indigo-200' : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{doc.original_filename}</span>
                    </div>
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Search & Recent Chats */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recent Chats</span>
              <span className="text-[10px] text-slate-500">{filteredChats.length} sessions</span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>

            {/* List */}
            <div className="space-y-1 overflow-y-auto flex-1 pr-1">
              {filteredChats.map((chat) => {
                const isPinned = pinnedChatIds.includes(chat.id);
                const isActive = activeChat?.id === chat.id;
                const isEditing = editingChatId === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => loadChatSession(chat.id)}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-medium border border-slate-700 shadow-md'
                        : 'text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameChat(chat.id);
                            if (e.key === 'Escape') setEditingChatId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full bg-slate-900 px-1.5 py-0.5 rounded text-xs text-white border border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className="truncate">{chat.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => togglePinChat(chat.id, e)}
                        className={`p-1 hover:text-white rounded ${isPinned ? 'text-amber-400 opacity-100' : 'text-slate-500'}`}
                        title={isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(chat.id);
                          setEditTitleText(chat.title);
                        }}
                        className="p-1 hover:text-indigo-300 text-slate-500 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChatId(chat.id);
                        }}
                        className="p-1 hover:text-red-400 text-slate-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col justify-between border-slate-800 overflow-hidden relative">
        {/* Chat Header with Retrieval Stats Summary */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white truncate max-w-md">
                {activeChat?.title || 'RAG Assistant Session'}
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Zero Hallucination SSE Mode
              </div>
            </div>
          </div>

          {/* Retrieval Statistics Bar */}
          {retrievalStats && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300">
              <div className="flex items-center gap-1" title="Retrieved Chunks">
                <Database className="w-3 h-3 text-indigo-400" />
                <span>{retrievalStats.retrievedChunkCount} Chunks</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1" title="Vector Search Time">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{retrievalStats.searchTimeMs}ms Search</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1" title="Embedding Time">
                <Cpu className="w-3 h-3 text-blue-400" />
                <span>{retrievalStats.embeddingTimeMs}ms Embed</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1" title="Average Cosine Similarity">
                <BarChart2 className="w-3 h-3 text-amber-400" />
                <span className="text-emerald-300 font-bold">{(retrievalStats.avgSimilarity * 100).toFixed(1)}% Sim</span>
              </div>
            </div>
          )}
        </div>

        {/* Message History Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingMessages ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading chat history...</div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-full w-14 h-14 mx-auto text-indigo-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Ask a Question About Your Uploaded Research Papers</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Questions are answered token-by-token strictly using retrieved vector context passages.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
                {[
                  'What are the main research contributions?',
                  'Summarize the core methodology used.',
                  'List all experimental performance metrics.',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputQuery(prompt);
                      queryInputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isCopied = copiedMsgId === msg.id;

              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                      AI
                    </div>
                  )}

                  <div className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-3 shadow-lg relative ${
                    isUser ? 'bg-indigo-600 text-white rounded-br-none' : 'glass-card border-slate-800 text-slate-200 rounded-bl-none'
                  }`}>
                    {/* Copy Button */}
                    <button
                      onClick={() => copyMessageContent(msg.id, msg.content)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy response"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>

                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    {/* Page Citation Badges */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block w-full">
                          Sources & Ground Truth Citations:
                        </span>
                        {msg.citations.map((cit, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedCitation(cit)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900 transition-colors text-[10px] font-medium flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3 h-3 text-indigo-400" />
                            <span>Page {cit.page_number || cit.pageNumber || 1}</span>
                            <span className="text-slate-400">({cit.filename})</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Message Timestamp */}
                    <div className="text-[9px] text-slate-500 text-right font-mono pt-1">
                      {formatTimestamp(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="relative">
            <input
              ref={queryInputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask a question about the uploaded documents (Ctrl+Enter to send, '/' to focus)..."
              className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={sending || !inputQuery.trim()}
              className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md shadow-indigo-600/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Citation Inspector Modal */}
      {selectedCitation && (
        <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
      )}

      {/* Delete Confirmation Modal */}
      {deletingChatId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Delete Chat Session?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this chat session and its message history?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingChatId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChatConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
