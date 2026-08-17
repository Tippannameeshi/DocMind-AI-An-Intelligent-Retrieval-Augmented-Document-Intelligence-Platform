import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
        <span>Code Snippet</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-indigo-200 overflow-x-auto">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          if (inline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 font-mono text-[11px] text-indigo-300" {...props}>
                {children}
              </code>
            );
          }
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        h1: ({ children }) => <h1 className="text-sm font-bold text-white mt-3 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-bold text-slate-100 mt-2.5 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold text-indigo-300 mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-200">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1 text-slate-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1 text-slate-300">{ol => ol.children}</ol>,
        li: ({ children }) => <li className="text-xs">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-slate-300 my-2 bg-indigo-950/20 py-1 rounded-r-lg">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-800">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="bg-slate-900 p-2 border border-slate-800 font-semibold text-slate-200">{children}</th>,
        td: ({ children }) => <td className="p-2 border border-slate-800 text-slate-300">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
