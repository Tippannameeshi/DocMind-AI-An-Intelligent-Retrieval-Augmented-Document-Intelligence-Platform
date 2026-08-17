import React, { useState } from 'react';
import { BookOpen, X, Copy, Check, FileText, Sparkles, Hash, Percent } from 'lucide-react';

export default function CitationModal({ citation, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    if (citation.content) {
      navigator.clipboard.writeText(citation.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rawScore = citation.similarity_score || citation.similarityScore || 0;
  const scorePercent = typeof rawScore === 'number' ? (rawScore * 100).toFixed(1) : parseFloat(rawScore).toFixed(1);
  const numericScore = parseFloat(scorePercent);

  let badgeColor = 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300';
  if (numericScore < 70) badgeColor = 'bg-amber-950/80 border-amber-500/40 text-amber-300';
  else if (numericScore < 85) badgeColor = 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel max-w-xl w-full p-6 rounded-2xl border-slate-700 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Citation & Context Details
              </h3>
              <p className="text-[11px] text-slate-400">Ground truth context passage retrieved via pgvector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" /> Source File
            </div>
            <div className="text-xs font-semibold text-slate-200 truncate" title={citation.filename}>
              {citation.filename || 'Document'}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <Hash className="w-3 h-3 text-indigo-400" /> Page Number
            </div>
            <div className="text-xs font-bold text-indigo-300">
              Page {citation.page_number || citation.pageNumber || 1}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <Percent className="w-3 h-3 text-emerald-400" /> Vector Similarity
            </div>
            <div className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${badgeColor}`}>
              {scorePercent}% Match
            </div>
          </div>
        </div>

        {/* Content Passage Box */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Retrieved Passage Context:
            </span>
            <button
              onClick={handleCopy}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Passage'}</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap selection:bg-indigo-600 selection:text-white">
            <mark className="bg-indigo-950/90 text-indigo-200 border-l-2 border-indigo-400 pl-2 pr-1 py-0.5 rounded block">
              {citation.content || 'No text content available.'}
            </mark>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800 relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-all"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
