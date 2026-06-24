import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui';

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Handle standard install prompt (Chrome/Android)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isInstalled) {
      setShowIOSPrompt(true);
      setShowBanner(true);
    }

    // Listen to successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed left-4 right-4 bg-white p-4 rounded-3xl shadow-xl shadow-blue-500/10 border border-blue-50 z-50 flex items-center justify-between" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="flex-1 pr-4">
        {showIOSPrompt ? (
          <div>
            <p className="text-sm font-bold text-stone-800">Instalar aplicativo</p>
            <p className="text-xs text-stone-500 mt-1 leading-snug">
              Para instalar no iPhone: toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-stone-800">Aplicativo Instalável</p>
            <p className="text-xs text-stone-500 mt-1">Instale o Agenda Azul no seu celular para acesso rápido e offline.</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!showIOSPrompt && (
          <Button onClick={handleInstallClick} className="px-4 py-2 shrink-0">
            Instalar
          </Button>
        )}
        <button onClick={() => setShowBanner(false)} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-full shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
