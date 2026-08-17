import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, uploadDocuments, deleteDocument } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import ProgressBar from '../components/ProgressBar';
import LoadingStage from '../components/LoadingStage';
import { SkeletonRow } from '../components/SkeletonLoader';
import Toast from '../components/Toast';
import {
  FileText,
  Upload,
  Trash2,
  MessageSquare,
  RefreshCw,
  Layers,
  Search,
  Filter,
  Calendar,
  Sparkles,
  FileCode,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Upload Experience States
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s');
  const [timeRemaining, setTimeRemaining] = useState('0s');
  const [currentStage, setCurrentStage] = useState(1);
  const [activeUploadFile, setActiveUploadFile] = useState('');

  const [toast, setToast] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await getDocuments({
        search: debouncedSearch,
        status: statusFilter,
      });
      setDocuments(res.data.documents);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to fetch uploaded documents.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [debouncedSearch, statusFilter]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setCurrentStage(1);
    setActiveUploadFile(files[0].name);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const uploadStartTime = Date.now();
    let loadedBytesPrevious = 0;

    try {
      await uploadDocuments(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);

        // Calculate upload speed & remaining time
        const elapsedTimeSec = (Date.now() - uploadStartTime) / 1000;
        if (elapsedTimeSec > 0) {
          const speedBytesPerSec = progressEvent.loaded / elapsedTimeSec;
          const speedMB = (speedBytesPerSec / (1024 * 1024)).toFixed(2);
          setUploadSpeed(`${speedMB} MB/s`);

          const remainingBytes = progressEvent.total - progressEvent.loaded;
          const remainingSec = Math.ceil(remainingBytes / (speedBytesPerSec || 1));
          setTimeRemaining(`${remainingSec}s`);
        }

        if (percentCompleted < 30) setCurrentStage(1);
        else if (percentCompleted < 60) setCurrentStage(2);
        else if (percentCompleted < 90) setCurrentStage(3);
        else setCurrentStage(4);
      });

      setCurrentStage(5);
      setToast({ type: 'success', message: 'File(s) uploaded successfully! Background indexing active.' });
      setTimeout(() => setCurrentStage(6), 1000);
      setTimeout(() => {
        setUploading(false);
        fetchDocs();
      }, 2000);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Upload failed.' });
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDocId) return;
    try {
      await deleteDocument(deletingDocId);
      setToast({ type: 'success', message: 'Document and vectors deleted.' });
      setDeletingDocId(null);
      fetchDocs();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete document.' });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Client-side date filter computation
  const filteredDocuments = useMemo(() => {
    if (dateFilter === 'all') return documents;
    const now = new Date();
    return documents.filter((doc) => {
      const docDate = new Date(doc.created_at);
      if (dateFilter === 'today') {
        return docDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return docDate >= weekAgo;
      }
      return true;
    });
  }, [documents, dateFilter]);

  return (
    <div className="space-y-8 relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Document Index Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload PDF, DOCX, TXT, Markdown, CSV, JSON & code files for RAG vector indexation.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all group relative overflow-hidden ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
            : 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/10'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e.target.files)}
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.json,.log,.rtf,.js,.ts,.py,.html,.css"
          className="hidden"
        />

        <div className="inline-flex p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">
          {isDragging ? 'Drop files here to upload' : 'Click to upload or drag & drop research files'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT, Markdown, CSV, JSON & code files up to 50MB</p>
      </div>

      {/* Active Upload Live Progress Panel */}
      {uploading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <ProgressBar
            progress={uploadProgress}
            speed={uploadSpeed}
            timeRemaining={timeRemaining}
            filename={activeUploadFile}
          />
          <LoadingStage currentStage={currentStage} />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Instant Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by filename..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Uploaded:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List View */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Indexed Documents ({filteredDocuments.length})
          </h2>
          <button
            onClick={fetchDocs}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-800/80">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No files match your current search parameters. Try clearing your filters or uploading a new file.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredDocuments.map((doc) => {
              const isDocx = doc.original_filename.toLowerCase().endsWith('.docx') || doc.original_filename.toLowerCase().endsWith('.doc');

              return (
                <div key={doc.id} className="py-4 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
                      {isDocx ? <FileCode className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                        {doc.original_filename}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{doc.total_pages || 1} Pages/Sections</span>
                        <span>•</span>
                        <span>{doc.chunk_count || 0} Chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        doc.status === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                          : doc.status === 'failed'
                          ? 'bg-red-950/60 text-red-300 border-red-800/50'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                      }`}
                    >
                      {doc.status}
                    </span>

                    <button
                      onClick={() => navigate(`/chat?docId=${doc.id}`)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    <button
                      onClick={() => setDeletingDocId(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingDocId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Delete Document?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action will permanently delete the document and all associated 1536-dim vector embeddings from PostgreSQL.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingDocId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
