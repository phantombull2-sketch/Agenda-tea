import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';

export function PWADiagnosticScreen({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState({
    manifest: 'checking',
    icon192: 'checking',
    icon512: 'checking',
    appleTouch: 'checking',
    sw: 'checking',
    installable: 'checking'
  });

  const checkPWA = async () => {
    const newStatus = { ...status };
    
    // Check manifest
    try {
      const res = await fetch('/manifest.json');
      newStatus.manifest = res.ok ? 'ok' : 'error';
    } catch {
      newStatus.manifest = 'error';
    }

    // Check icons
    const checkImage = (url: string) => new Promise<'ok' | 'error'>((resolve) => {
      const img = new Image();
      img.onload = () => resolve('ok');
      img.onerror = () => resolve('error');
      img.src = url;
    });

    newStatus.icon192 = await checkImage('/icons/icon-192.png');
    newStatus.icon512 = await checkImage('/icons/icon-512.png');
    newStatus.appleTouch = await checkImage('/icons/apple-touch-icon.png');

    // Check SW
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      newStatus.sw = reg ? 'ok' : 'error';
    } else {
      newStatus.sw = 'error';
    }

    // Installable (basic heuristic: manifest exists and SW exists, or standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    newStatus.installable = (newStatus.manifest === 'ok' && newStatus.sw === 'ok') || isStandalone ? 'ok' : 'error';

    setStatus(newStatus);
  };

  useEffect(() => {
    checkPWA();
  }, []);

  const StatusItem = ({ label, state }: { label: string, state: string }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-3">
      <span className="font-bold text-stone-700">{label}</span>
      {state === 'checking' && <RefreshCcw className="w-5 h-5 text-stone-400 animate-spin" />}
      {state === 'ok' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
      {state === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <header className="px-6 pt-6 pb-4 bg-white sticky top-0 z-10 flex items-center gap-4 shadow-sm border-b border-gray-100">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-stone-800">Diagnóstico PWA</h1>
          <p className="text-xs font-medium text-stone-400">Verificação de requisitos PWA</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <StatusItem label="Manifest.json Acessível" state={status.manifest} />
        <StatusItem label="Ícone 192x192 Acessível" state={status.icon192} />
        <StatusItem label="Ícone 512x512 Acessível" state={status.icon512} />
        <StatusItem label="Apple Touch Icon Acessível" state={status.appleTouch} />
        <StatusItem label="Service Worker Registrado" state={status.sw} />
        <StatusItem label="Instalável (Heurística)" state={status.installable} />

        <div className="mt-8 text-center">
          <button 
            onClick={checkPWA}
            className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCcw className="w-4 h-4" />
            Testar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}
