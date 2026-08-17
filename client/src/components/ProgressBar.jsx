import React from 'react';
import { Upload, Clock, Zap } from 'lucide-react';

export default function ProgressBar({ progress = 0, speed = '0 MB/s', timeRemaining = '0s', filename = '' }) {
  return (
    <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate">{filename || 'Uploading Document...'}</span>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-300">{Math.round(progress)}%</span>
      </div>

      {/* Track */}
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/30"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>

      {/* Speed & ETA stats */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Upload Speed: <strong className="text-slate-200 font-mono">{speed}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>Est. Remaining: <strong className="text-slate-200 font-mono">{timeRemaining}</strong></span>
        </div>
      </div>
    </div>
  );
}
