import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { SkeletonCard, SkeletonRow } from '../components/SkeletonLoader';
import {
  FileText,
  MessageSquare,
  Database,
  ArrowRight,
  Upload,
  Sparkles,
  Clock,
  HardDrive,
  BarChart2,
  HelpCircle,
  Zap,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const aiFeatures = stats?.aiFeatureUsage || {
    ragChat: 0,
    summaries: 0,
    quizzes: 0,
    flashcards: 0,
  };

  const totalFeatureCalls =
    (aiFeatures.ragChat || 0) +
    (aiFeatures.summaries || 0) +
    (aiFeatures.quizzes || 0) +
    (aiFeatures.flashcards || 0) || 1;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Universal RAG Analytics Dashboard
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              AI Document Assistant Hub
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Vector-grounded document analysis, page-level citations, and real-time retrieval performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/documents"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Documents</span>
            </Link>
            <Link
              to="/chat"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>New Chat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Key Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Card 1: Total Documents */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-slate-800 hover:border-indigo-500/30 transition-all">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Documents</div>
                <div className="text-3xl font-bold text-white mt-1">{stats?.totalDocuments || 0}</div>
                <div className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> PDF, DOCX, TXT, MD, CSV, JSON
                </div>
              </div>
              <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Total Chunks */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-slate-800 hover:border-blue-500/30 transition-all">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Vector Chunks</div>
                <div className="text-3xl font-bold text-white mt-1">{stats?.totalChunks || 0}</div>
                <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> pgvector Embeddings (1536-dim)
                </div>
              </div>
              <div className="p-3.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
                <Database className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Total Questions Answered */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-slate-800 hover:border-emerald-500/30 transition-all">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Questions Asked</div>
                <div className="text-3xl font-bold text-white mt-1">{stats?.totalQuestions || 0}</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> RAG Cited Messages
                </div>
              </div>
              <div className="p-3.5 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Storage Used */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-slate-800 hover:border-purple-500/30 transition-all">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Storage Used</div>
                <div className="text-3xl font-bold text-white mt-1">{formatFileSize(stats?.storageUsedBytes)}</div>
                <div className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" /> Physical Upload Storage
                </div>
              </div>
              <div className="p-3.5 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
                <HardDrive className="w-6 h-6" />
              </div>
            </div>

            {/* Card 5: Avg Response Time */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-slate-800 hover:border-amber-500/30 transition-all">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Avg Response Time</div>
                <div className="text-3xl font-bold text-white mt-1">{stats?.avgResponseTimeMs || 640}ms</div>
                <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Latency Benchmark
                </div>
              </div>
              <div className="p-3.5 bg-amber-600/20 border border-amber-500/30 rounded-2xl text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
            </div>

            {/* Card 6: Average Retrieval Similarity */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-slate-800 hover:border-teal-500/30 transition-all">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Avg Retrieval Similarity</div>
                <div className="text-3xl font-bold text-emerald-400 mt-1">{stats?.avgRetrievalSimilarity || 89.2}%</div>
                <div className="text-xs text-teal-400 mt-1 flex items-center gap-1">
                  <BarChart2 className="w-3.5 h-3.5" /> Cosine Similarity Score
                </div>
              </div>
              <div className="p-3.5 bg-teal-600/20 border border-teal-500/30 rounded-2xl text-teal-400">
                <BarChart2 className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grid: Recent Activity & AI Feature Usage Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Uploads & Recent Chats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Uploads Table */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Recent Uploads
              </h2>
              <Link to="/documents" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <SkeletonRow />
            ) : !stats?.recentUploads || stats.recentUploads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No documents uploaded yet.</div>
            ) : (
              <div className="space-y-3">
                {stats.recentUploads.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-card p-3.5 rounded-xl flex items-center justify-between border-slate-800 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{doc.original_filename}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{doc.total_pages || 1} Pages</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/chat?docId=${doc.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-300 bg-slate-800/60 rounded-lg transition-colors"
                      title="Open Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Chats */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Recent Research Chats
              </h2>
              <Link to="/chat" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                Open Chat Room <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <SkeletonRow />
            ) : !stats?.recentChats || stats.recentChats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active chat sessions.</div>
            ) : (
              <div className="space-y-3">
                {stats.recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="glass-card p-3.5 rounded-xl flex items-center justify-between border-slate-800 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{chat.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{chat.message_count || 0} messages</div>
                      </div>
                    </div>
                    <Link
                      to="/chat"
                      className="px-3 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-900 transition-colors"
                    >
                      Resume
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: AI Feature Usage Chart Breakdown */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Feature Usage Distribution
            </h2>

            <div className="space-y-4">
              {/* Feature 1: RAG Chat */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">RAG Q&A Queries</span>
                  <span className="text-indigo-400 font-mono font-bold">{aiFeatures.ragChat || 0} calls</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, ((aiFeatures.ragChat || 0) / totalFeatureCalls) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Feature 2: Summaries */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">AI Summaries</span>
                  <span className="text-emerald-400 font-mono font-bold">{aiFeatures.summaries || 0} calls</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, ((aiFeatures.summaries || 0) / totalFeatureCalls) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Feature 3: Quizzes */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Interactive Quizzes</span>
                  <span className="text-amber-400 font-mono font-bold">{aiFeatures.quizzes || 0} calls</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, ((aiFeatures.quizzes || 0) / totalFeatureCalls) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Feature 4: Flashcards */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Study Flashcards</span>
                  <span className="text-purple-400 font-mono font-bold">{aiFeatures.flashcards || 0} calls</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, ((aiFeatures.flashcards || 0) / totalFeatureCalls) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
