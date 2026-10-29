import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';
import { AppInstallModal } from './AppInstallModal';
import { AndroidApkModal } from './AndroidApkModal';

export const PWAInstallButton: React.FC = () => {
  const { t } = useLanguage();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // If already installed and running standalone, suppress install prompt
  if (isInstalled) {
    return null;
  }

  const handleMainInstallClick = async () => {
    // If the browser already emitted beforeinstallprompt, trigger it directly
    if (isInstallable) {
      try {
        const accepted = await install();
        if (accepted) return;
      } catch {
        // Fallback to visual modal
      }
    }
    // Otherwise open the friendly step-by-step install modal
    setShowInstallModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 1. Primary Direct Install Button - ALWAYS VISIBLE TO USERS */}
        <button
          onClick={handleMainInstallClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0 animate-fade-in"
          title="Instalar TacoPro diretamente no telemóvel para acesso rápido e utilização 100% offline"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('installApp')}</span>
        </button>

        {/* 2. Developer / Store Packaging Option (Discreetly labeled) */}
        <button
          onClick={() => setShowAndroidModal(true)}
          className="hidden md:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Opções avançadas para programadores: gerar ficheiro APK ou publicar na Google Play e Apple Store"
        >
          <Smartphone className="w-3 h-3 text-amber-400" />
          <span>APK / Lojas</span>
        </button>
      </div>

      {/* Main Friendly Installation Modal */}
      <AppInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstallable={isInstallable}
        onTriggerNativeInstall={install}
        onOpenAdvancedPackaging={() => setShowAndroidModal(true)}
      />

      {/* Developer Store / Packaging Modal */}
      <AndroidApkModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />
    </>
  );
};
