import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { RefreshCw } from 'lucide-react';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const Chat = lazy(() => import('./pages/Chat'));
const AiTools = lazy(() => import('./pages/AiTools'));

function PageLoader() {
  return (
    <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
      <span>Loading workspace...</span>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <Navbar />
      <main className="max-w-7xl w-full mx-auto p-6 md:p-8 flex-1 z-10">
        {children}
      </main>
      <footer className="max-w-7xl w-full mx-auto text-center text-xs text-slate-500 py-6 border-t border-slate-900">
        Universal AI Document Assistant &copy; 2026. Built with React, Express & PostgreSQL (`pgvector`).
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Documents />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Chat />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-tools"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AiTools />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
