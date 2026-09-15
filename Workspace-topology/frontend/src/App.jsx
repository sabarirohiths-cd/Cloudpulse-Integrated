import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from './components/ui/Toaster';
import TopologyPage from './pages/topology/TopologyPage';
import DiagnosticDetailPage from './pages/topology/diagnostics/DiagnosticDetailPage';

export default function App() {
  return (
    <BrowserRouter basename="/topology-app">
      <Toaster />
      <div className="flex h-screen bg-[#0a0a0f]" onClick={() => toast.dismiss()}>
        <main id="main-scroll-container" className="flex-1 bg-[#0a0a0f] flex flex-col min-h-0 relative">
          <Routes>
            <Route path="/" element={<TopologyPage />} />
            <Route path="/diagnostics/:nodeId" element={<DiagnosticDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
