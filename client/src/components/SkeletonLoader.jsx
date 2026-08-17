import React from 'react';

export function SkeletonCard() {
  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-800 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-800 rounded-md"></div>
        <div className="h-8 w-8 bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-8 w-24 bg-slate-800 rounded-md"></div>
      <div className="h-3 w-40 bg-slate-800/60 rounded-md"></div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="py-4 flex items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-slate-800 rounded-xl shrink-0"></div>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-3 bg-slate-800/60 rounded w-1/4"></div>
        </div>
      </div>
      <div className="h-6 w-20 bg-slate-800 rounded-full shrink-0"></div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 justify-start animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-slate-800 shrink-0 mt-1"></div>
      <div className="glass-card p-4 rounded-2xl border-slate-800 space-y-2 w-2/3">
        <div className="h-3 bg-slate-800 rounded w-full"></div>
        <div className="h-3 bg-slate-800 rounded w-4/5"></div>
        <div className="h-3 bg-slate-800/60 rounded w-2/5"></div>
      </div>
    </div>
  );
}

export default {
  SkeletonCard,
  SkeletonRow,
  SkeletonMessage,
};
