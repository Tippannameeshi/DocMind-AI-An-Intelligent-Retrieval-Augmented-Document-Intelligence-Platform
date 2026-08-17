import React from 'react';
import { RefreshCw, FileText, Database, Cpu, Search, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoadingStage({ currentStage = 1, stages = [] }) {
  const defaultStages = [
    { label: 'Uploading Document...', icon: FileText },
    { label: 'Extracting Text & Layout...', icon: FileText },
    { label: 'Creating Recursive Chunks...', icon: Database },
    { label: 'Generating OpenAI Vector Embeddings...', icon: Cpu },
    { label: 'Searching PostgreSQL pgvector...', icon: Search },
    { label: 'Generating Context-Grounded Response...', icon: Sparkles },
  ];

  const activeList = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-3 max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold text-slate-200">Processing Stage Pipeline</span>
        </div>
        <span className="text-[11px] font-mono text-indigo-400 font-semibold">
          Stage {Math.min(currentStage, activeList.length)} of {activeList.length}
        </span>
      </div>

      <div className="space-y-2">
        {activeList.map((st, idx) => {
          const stageNum = idx + 1;
          const isDone = stageNum < currentStage;
          const isCurrent = stageNum === currentStage;
          const Icon = st.icon || Sparkles;

          let itemStyle = 'text-slate-500 opacity-50';
          if (isDone) itemStyle = 'text-emerald-400 font-medium';
          else if (isCurrent) itemStyle = 'text-indigo-300 font-semibold bg-indigo-950/40 border border-indigo-500/30 p-2 rounded-xl';

          return (
            <div key={idx} className={`flex items-center justify-between text-xs transition-all ${itemStyle}`}>
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <span>{st.label}</span>
              </div>
              {isDone && <span className="text-[10px] text-emerald-400 font-mono">Done</span>}
              {isCurrent && <span className="text-[10px] text-indigo-400 font-mono animate-pulse">Active...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
