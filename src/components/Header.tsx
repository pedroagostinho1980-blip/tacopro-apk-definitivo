import { Truck, AlertTriangle, User, Volume2, VolumeX, ShieldCheck, FileText, Bell, Sliders, RotateCcw, Play, Square, Gauge, RefreshCw, Video, Smartphone } from 'lucide-react';
import { DriverProfile } from '../types/tachograph';

import { PWAInstallButton } from './PWAInstallButton';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  activeTab: 'cockpit' | 'compliance' | 'timeline' | 'reports' | 'infringements';
  setActiveTab: (tab: 'cockpit' | 'compliance' | 'timeline' | 'reports' | 'infringements') => void;
  driverProfile: DriverProfile;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  warningCount: number;
  isShiftActive?: boolean;
  onOpenShiftModal?: (mode: 'START' | 'END') => void;
  onOpenProfile: () => void;
  onOpenAlertSettings: () => void;
  onOpenManualEntry: () => void;
  onOpenResetModal: () => void;
  isQuickWidgetOpen?: boolean;
  onToggleQuickWidget?: () => void;
  onOpenVideoShowcase?: () => void;
  onOpenAndroidApk?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  driverProfile,
  soundEnabled,
  setSoundEnabled,
  warningCount,
  isShiftActive = false,
  onOpenShiftModal,
  onOpenProfile,
  onOpenAlertSettings,
  onOpenManualEntry,
  onOpenResetModal,
  isQuickWidgetOpen = true,
  onToggleQuickWidget,
  onOpenVideoShowcase,
  onOpenAndroidApk,
}) => {
  const { t } = useLanguage();

  const handleForceUpdate = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Single Brand Wordmark & Version */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#cockpit"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('cockpit');
              }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-amber-400 transition-colors"
            >
              TacoPro <span className="text-xs font-semibold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 ml-1">CE 561</span>
            </a>

            <button
              onClick={handleForceUpdate}
              title={t('reloadTitle')}
              className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-emerald-400" />
              <span>{t('reload')}</span>
            </button>

            {onOpenVideoShowcase && (
              <button
                onClick={onOpenVideoShowcase}
                title="Apresentação Demonstrativa Comercial & Vídeo com Narração de Voz"
                className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer shadow-sm"
              >
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>Vídeo Apresentação</span>
              </button>
            )}

            {onOpenAndroidApk && (
              <button
                onClick={onOpenAndroidApk}
                title="Gerar / Exportar APK Definitivo Android com Widget Nativo"
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>APK Definitivo</span>
              </button>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'cockpit'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            {t('cockpit')}
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'compliance'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            {t('rulesAndLimits')}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'timeline'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            {t('timeline24h')}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('reports')}</span>
          </button>

          <button
            onClick={() => setActiveTab('infringements')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'infringements'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            {warningCount > 0 ? (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                {t('inspection')} ({warningCount})
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {t('inspection')}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Action, Language Selector & Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <PWAInstallButton />

          {/* Language Selector Dropdown */}
          <LanguageSelector />

          {/* Dedicated Início / Fim de Jornada Primary Button */}
          {onOpenShiftModal && (
            isShiftActive ? (
              <button
                onClick={() => onOpenShiftModal('END')}
                title={t('endShiftSub')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap shrink-0 animate-pulse-subtle"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>{t('endShift')}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenShiftModal('START')}
                title={t('startShiftSub')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{t('startShift')}</span>
              </button>
            )
          )}

          <button
            onClick={onOpenResetModal}
            title={t('reset')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-amber-400 transition-all cursor-pointer text-xs font-semibold shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{t('reset')}</span>
            <span className="sm:hidden">Reset</span>
          </button>

          {onToggleQuickWidget && (
            <button
              onClick={onToggleQuickWidget}
              title={isQuickWidgetOpen ? t('close') : t('quickWidget')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border transition-all cursor-pointer text-xs font-semibold shrink-0 ${
                isQuickWidgetOpen
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t('quickWidget')}</span>
              <span className="sm:hidden">Widget</span>
            </button>
          )}

          <button
            onClick={onOpenAlertSettings}
            title={t('alerts')}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline font-medium">{t('alerts')}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? t('soundOn') : t('soundOff')}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenProfile}
            title={t('profile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-medium cursor-pointer transition-colors"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-mono">{driverProfile.vehiclePlate}</span>
          </button>

          <button
            onClick={onOpenManualEntry}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            {t('addEntry')}
          </button>
        </div>
      </div>
    </header>
  );
};
