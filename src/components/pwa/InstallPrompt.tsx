import React, { useState, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Track install prompt externally to avoid setState in effects
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return _deferredPrompt;
}

function getIsStandalone() {
  return _isStandalone;
}

// Set up global listeners
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach(cb => cb());
  });

  window.addEventListener('appinstalled', () => {
    _isStandalone = true;
    _deferredPrompt = null;
    listeners.forEach(cb => cb());
  });
}

export const InstallPrompt: React.FC = () => {
  const deferredPrompt = useSyncExternalStore(subscribe, getSnapshot);
  const isStandalone = useSyncExternalStore(subscribe, getIsStandalone);
  const [dismissed, setDismissed] = useState(false);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      _deferredPrompt = null;
      listeners.forEach(cb => cb());
    }
  };

  if (isStandalone || dismissed || !deferredPrompt) return null;

  return (
    <div className="w-full mt-3 bg-green-800/50 border border-green-600/30 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-green-300">アプリをインストール</p>
          <p className="text-xs text-green-400/70">ホーム画面に追加してオフラインでも遊べます</p>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold
              transition-all text-white"
          >
            追加
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-2 py-1.5 text-gray-400 hover:text-white text-sm transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
