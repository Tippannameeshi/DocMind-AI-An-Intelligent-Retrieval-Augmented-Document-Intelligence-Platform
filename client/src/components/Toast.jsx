import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ type = 'info', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  let bgStyle = 'bg-slate-900 border-slate-700 text-slate-200';
  let icon = <Info className="w-4 h-4 text-indigo-400 shrink-0" />;

  if (type === 'error') {
    bgStyle = 'bg-red-950/90 border-red-800/60 text-red-200';
    icon = <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
  } else if (type === 'success') {
    bgStyle = 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200';
    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 max-w-md animate-in slide-in-from-bottom-5 duration-300 ${bgStyle}`}>
      {icon}
      <span className="text-xs font-medium leading-normal flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
