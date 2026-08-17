import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDocuments, generateAiFeature } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Toast from '../components/Toast';
import { Sparkles, FileText, BookOpen, HelpCircle, Layers, RefreshCw, Lightbulb } from 'lucide-react';

export default function AiTools() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'summary';

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [toast, setToast] = useState(null);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState({});
  // Flashcard flip state
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents);
      if (res.data.documents.length > 0) {
        setSelectedDocId(res.data.documents[0].id);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to fetch uploaded documents.' });
    }
  };

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setToast({ type: 'error', message: 'Please select a research paper document first.' });
      return;
    }

    setLoading(true);
    setResultData(null);
    setUserAnswers({});
    setFlippedCards({});

    try {
      const res = await generateAiFeature({
        documentId: selectedDocId,
        featureType: activeTab,
      });
      setResultData(res.data);
      setToast({ type: 'success', message: 'AI insights generated successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Failed to generate AI insights.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleCardFlip = (index) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-8 relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            AI Document Insights Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate executive summaries, interactive quizzes, study flashcards, key takeaways, and action items.
          </p>
        </div>
      </div>

      {/* Selector & Tool Tabs */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="w-full md:w-96">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Document File
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {documents.length === 0 ? (
                <option value="">No documents uploaded yet</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.original_filename} ({doc.total_pages || 1} pages/sections)
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedDocId}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Vector Context...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'summary', label: 'Document Summarizer', icon: FileText },
            { id: 'quiz', label: 'Interactive Quiz', icon: HelpCircle },
            { id: 'flashcards', label: 'Study Flashcards', icon: BookOpen },
            { id: 'contributions', label: 'Key Takeaways', icon: Lightbulb },
            { id: 'future_work', label: 'Action Items & Next Steps', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResultData(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results View */}
      {resultData && (
        <div className="glass-panel p-8 rounded-2xl border-slate-800 space-y-6">
          {/* Text Result View */}
          {resultData.result && (
            <div className="text-xs text-slate-200 leading-relaxed">
              <MarkdownRenderer content={resultData.result} />
            </div>
          )}

          {/* Interactive Quiz View */}
          {Array.isArray(resultData) && activeTab === 'quiz' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                5-Question Context Quiz
              </h3>
              <div className="space-y-6">
                {resultData.map((q, idx) => (
                  <div key={idx} className="glass-card p-5 rounded-xl space-y-3 border-slate-800">
                    <div className="text-xs font-semibold text-slate-200">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = userAnswers[idx] === optIdx;
                        const isCorrect = q.correctIndex === optIdx;
                        const hasAnswered = userAnswers[idx] !== undefined;

                        let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';
                        if (hasAnswered) {
                          if (isCorrect) btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                          else if (isSelected) btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => setUserAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                            className={`p-3 rounded-lg border text-xs text-left transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {userAnswers[idx] !== undefined && (
                      <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 mt-2">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Flashcards Deck View */}
          {Array.isArray(resultData) && activeTab === 'flashcards' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Study Flashcard Deck (Click card to flip)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultData.map((card, idx) => {
                  const isFlipped = flippedCards[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCardFlip(idx)}
                      className="glass-card h-48 p-6 rounded-2xl border-slate-700 cursor-pointer flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-xl select-none"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                          {isFlipped ? `Definition (Page ${card.page || 1})` : 'Concept / Term'}
                        </span>
                        <div className="text-sm font-bold text-white leading-relaxed">
                          {isFlipped ? card.back : card.front}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">
                        {isFlipped ? 'Click to show term' : 'Click to flip definition'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
