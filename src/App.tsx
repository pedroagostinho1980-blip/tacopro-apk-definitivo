import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityLog,
  ActivityType,
  DriverProfile,
  ShiftSettings,
  AlertSettings,
  ReportSummary,
  ActiveShift,
  CrewType,
} from './types/tachograph';
import {
  calculateCompliance,
  detectInfringements,
  defaultAlertSettings,
  calculateDurationMinutes,
} from './utils/rulesEngine';
import { initialDriverProfile, initialShiftSettings, getSampleShiftLogs } from './utils/sampleData';
import { playAlertTone } from './utils/soundAlerts';
import { generateReportSummary } from './utils/reportEngine';

import { Header } from './components/Header';
import { TachographCockpit } from './components/TachographCockpit';
import { ComplianceGauges } from './components/ComplianceGauges';
import { ActivityTimeline } from './components/ActivityTimeline';
import { LogbookTable } from './components/LogbookTable';
import { ReportsModule } from './components/ReportsModule';
import { InfringementsPanel } from './components/InfringementsPanel';
import { RestPlannerModal } from './components/RestPlannerModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { DriverProfileModal } from './components/DriverProfileModal';
import { CompensationManagerModal } from './components/CompensationManagerModal';
import { ShiftControlModal } from './components/ShiftControlModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { PrintReport } from './components/PrintReport';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QuickActivityWidget } from './components/QuickActivityWidget';
import { WidgetHelpModal } from './components/WidgetHelpModal';
import { ShowcaseVideoTourModal } from './components/ShowcaseVideoTourModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  // 1. Persistent State with localStorage fallback
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('tacopro_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getSampleShiftLogs();
  });

  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => {
    try {
      const saved = localStorage.getItem('tacopro_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialDriverProfile;
  });

  const [shiftSettings, setShiftSettings] = useState<ShiftSettings>(() => {
    try {
      const saved = localStorage.getItem('tacopro_shift_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialShiftSettings;
  });

  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    try {
      const saved = localStorage.getItem('tacopro_alert_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultAlertSettings;
  });

  const [currentShift, setCurrentShift] = useState<ActiveShift | null>(() => {
    try {
      const saved = localStorage.getItem('tacopro_current_shift');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default initial shift for realistic sample data
    const now = new Date();
    const d0700 = new Date(now);
    d0700.setHours(7, 0, 0, 0);
    return {
      id: 'shift-demo-1',
      isActive: true,
      startTime: d0700.toISOString(),
      endTime: null,
      startLocation: 'Plataforma Logística da Azambuja',
      startCountry: 'Portugal (PT)',
      startOdometer: 412580,
    };
  });

  const [activeTab, setActiveTab] = useState<'cockpit' | 'compliance' | 'timeline' | 'reports' | 'infringements'>('cockpit');

  // Modals
  const [isRestPlannerOpen, setIsRestPlannerOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const [isCompensationOpen, setIsCompensationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'START' | 'END'>('START');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [printSummary, setPrintSummary] = useState<ReportSummary | null>(null);
  const [isQuickWidgetOpen, setIsQuickWidgetOpen] = useState(true);
  const [isWidgetHelpOpen, setIsWidgetHelpOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isAndroidApkOpen, setIsAndroidApkOpen] = useState(false);

  // Handle PWA shortcut action query params & Native Android Widget broadcasts
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const action = searchParams.get('action');
      const targetType = searchParams.get('type') as ActivityType | null;
      if (action === 'set_activity' && targetType && ['DRIVING', 'WORK', 'AVAILABILITY', 'REST'].includes(targetType)) {
        handleSwitchActivity(targetType, `Comutação rápida via atalho PWA (${targetType})`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }

    // Listen to native Android Widget 1-tap events
    const handleNativeWidgetEvent = (e: Event) => {
      try {
        const customEvent = e as CustomEvent<{ activity: ActivityType }>;
        const activity = customEvent.detail?.activity;
        if (activity && ['DRIVING', 'WORK', 'AVAILABILITY', 'REST'].includes(activity)) {
          handleSwitchActivity(activity, `Comutação via Widget Android (${activity})`);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('tacopro_native_activity_changed', handleNativeWidgetEvent);

    // Initial check from Native Bridge on launch
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bridge = (window as any).TacoProNative;
      if (bridge && typeof bridge.getWidgetCurrentActivity === 'function') {
        const nativeActivity = bridge.getWidgetCurrentActivity() as ActivityType;
        if (nativeActivity && ['DRIVING', 'WORK', 'AVAILABILITY', 'REST'].includes(nativeActivity)) {
          const currentActive = logs.find((l) => !l.endTime);
          if (!currentActive || currentActive.type !== nativeActivity) {
            handleSwitchActivity(nativeActivity, `Sincronização com Widget Android (${nativeActivity})`);
          }
        }
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('tacopro_native_activity_changed', handleNativeWidgetEvent);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tacopro_logs', JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('tacopro_profile', JSON.stringify(driverProfile));
    } catch {
      // ignore
    }
  }, [driverProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('tacopro_shift_settings', JSON.stringify(shiftSettings));
    } catch {
      // ignore
    }
  }, [shiftSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('tacopro_alert_settings', JSON.stringify(alertSettings));
    } catch {
      // ignore
    }
  }, [alertSettings]);

  useEffect(() => {
    try {
      if (currentShift) {
        localStorage.setItem('tacopro_current_shift', JSON.stringify(currentShift));
      } else {
        localStorage.removeItem('tacopro_current_shift');
      }
    } catch {
      // ignore
    }
  }, [currentShift]);

  // Active activity log
  const activeLog = logs.find(l => !l.endTime);

  // Real-time compliance and infractions (grounded with explicit shift state)
  const compliance = calculateCompliance(logs, shiftSettings, alertSettings, new Date(), currentShift);
  const infringements = detectInfringements(logs, shiftSettings, alertSettings, currentShift);

  // Alert tone audio trigger when crossing thresholds (with debouncing)
  const prevWarningCount = useRef(compliance.warningCount);
  useEffect(() => {
    if (compliance.warningCount > prevWarningCount.current) {
      if (alertSettings.soundAlertsEnabled) {
        if (compliance.isContinuousExceeded || compliance.isDailyExceeded) {
          playAlertTone('DANGER');
        } else {
          playAlertTone('WARNING');
        }
      }

      // Browser push notification if permitted
      if (alertSettings.browserNotificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('TacoPro Alerta Tacógrafo', {
            body: compliance.urgentWarnings[0] || 'Atenção aos limites de condução e repouso.',
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      }
    }
    prevWarningCount.current = compliance.warningCount;
  }, [compliance.warningCount, compliance.isContinuousExceeded, compliance.isDailyExceeded, alertSettings]);

  // Switch activity handler
  const handleSwitchActivity = (newType: ActivityType, note?: string, location?: string) => {
    const nowIso = new Date().toISOString();

    setLogs((prev) => {
      // Close any active log
      const updated = prev.map((l) => {
        if (!l.endTime) {
          return {
            ...l,
            endTime: nowIso,
          };
        }
        return l;
      });

      // Insert new ongoing activity
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        type: newType,
        startTime: nowIso,
        endTime: null,
        note: note || (newType === 'DRIVING' ? 'Condução em trânsito' : newType === 'WORK' ? 'Operação de carga/descarga' : newType === 'AVAILABILITY' ? 'Tempo de espera' : 'Pausa regulamentar'),
        vehiclePlate: driverProfile.vehiclePlate,
        location: location || undefined,
      };

      return [...updated, newLog];
    });

    if (alertSettings.soundAlertsEnabled) {
      playAlertTone('INFO');
    }

    // Sync state directly with Native Android Home Screen Widget
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bridge = (window as any).TacoProNative;
      if (bridge && typeof bridge.updateWidgetState === 'function') {
        const startTs = new Date(nowIso).getTime();
        bridge.updateWidgetState(newType, startTs, compliance.continuousDrivingMinutes || 0);
      }
    } catch {
      // ignore
    }
  };

  // Save manual entry (add or update)
  const handleSaveManualEntry = (entry: Partial<ActivityLog>) => {
    if (editingLog) {
      setLogs((prev) => prev.map((l) => (l.id === editingLog.id ? ({ ...l, ...entry } as ActivityLog) : l)));
    } else {
      setLogs((prev) => [...prev, entry as ActivityLog]);
    }
    setEditingLog(null);
  };

  const handleEditLog = (log: ActivityLog) => {
    setEditingLog(log);
    setIsManualEntryOpen(true);
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm('Tem a certeza de que pretende eliminar este registo?')) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleToggle10hExtension = () => {
    setShiftSettings((prev) => {
      const nextVal = !prev.allow10hExtensionToday;
      return {
        ...prev,
        allow10hExtensionToday: nextVal,
        extendedDrivingCountThisWeek: nextVal
          ? Math.min(2, prev.extendedDrivingCountThisWeek + 1)
          : Math.max(0, prev.extendedDrivingCountThisWeek - 1),
      };
    });
  };

  const handleToggleReducedRest = () => {
    setShiftSettings((prev) => {
      const nextVal = !prev.reducedDailyRestAllowedToday;
      return {
        ...prev,
        reducedDailyRestAllowedToday: nextVal,
        reducedDailyRestCountThisWeek: nextVal
          ? Math.min(3, prev.reducedDailyRestCountThisWeek + 1)
          : Math.max(0, prev.reducedDailyRestCountThisWeek - 1),
      };
    });
  };

  const handleResetShift = () => {
    if (window.confirm('Iniciar novo turno? As atividades atuais serão finalizadas e iniciará um novo período de condução.')) {
      const nowIso = new Date().toISOString();
      setLogs((prev) => {
        const closed = prev.map((l) => (!l.endTime ? { ...l, endTime: nowIso } : l));
        return [
          ...closed,
          {
            id: `log-${Date.now()}`,
            type: 'REST',
            startTime: nowIso,
            endTime: null,
            note: 'Início de novo ciclo / descanso',
            vehiclePlate: driverProfile.vehiclePlate,
          },
        ];
      });
    }
  };

  const handleToggleCrewType = () => {
    const nextCrewType: CrewType = shiftSettings.crewType === 'MULTI_MANNING' ? 'SINGLE' : 'MULTI_MANNING';
    setShiftSettings((prev) => ({ ...prev, crewType: nextCrewType }));
    setDriverProfile((prev) => ({ ...prev, crewType: nextCrewType }));
    if (currentShift) {
      setCurrentShift((prev) => (prev ? { ...prev, crewType: nextCrewType } : null));
    }
  };

  const handleSwitchDriverSlot = () => {
    const nextSlot = (driverProfile.activeDriverSlot || 1) === 1 ? 2 : 1;
    setDriverProfile((prev) => ({ ...prev, activeDriverSlot: nextSlot }));
  };

  // Shift Start & End Handlers
  const handleConfirmStartShift = (data: {
    startTime: string;
    startLocation: string;
    startCountry: string;
    startOdometer?: number;
    initialActivity: ActivityType;
    crewType: CrewType;
  }) => {
    const newShift: ActiveShift = {
      id: `shift-${Date.now()}`,
      isActive: true,
      startTime: data.startTime,
      endTime: null,
      startLocation: data.startLocation,
      startCountry: data.startCountry,
      startOdometer: data.startOdometer,
      crewType: data.crewType,
    };
    setCurrentShift(newShift);
    setShiftSettings((prev) => ({ ...prev, crewType: data.crewType }));
    setDriverProfile((prev) => ({ ...prev, crewType: data.crewType }));

    // Close any active log and register the initial activity
    setLogs((prev) => {
      const closed = prev.map((l) => (!l.endTime ? { ...l, endTime: data.startTime } : l));
      const initialLog: ActivityLog = {
        id: `log-${Date.now()}`,
        type: data.initialActivity,
        startTime: data.startTime,
        endTime: null,
        note: data.initialActivity === 'WORK' ? 'Início de turno - Verificação prévia do veículo' : 'Início de turno - Condução',
        vehiclePlate: driverProfile.vehiclePlate,
        location: data.startLocation,
        startOdometer: data.startOdometer,
      };
      return [...closed, initialLog];
    });

    if (alertSettings.soundAlertsEnabled) {
      playAlertTone('INFO');
    }
  };

  const handleConfirmEndShift = (data: {
    endTime: string;
    endLocation: string;
    endCountry: string;
    endOdometer?: number;
    restType?: 'DAILY' | 'WEEKLY';
  }) => {
    setCurrentShift((prev) => {
      if (!prev) {
        return {
          id: `shift-${Date.now()}`,
          isActive: false,
          startTime: data.endTime,
          endTime: data.endTime,
          startLocation: data.endLocation,
          endLocation: data.endLocation,
          endCountry: data.endCountry,
          endOdometer: data.endOdometer,
          totalDurationMinutes: 0,
        };
      }
      return {
        ...prev,
        isActive: false,
        endTime: data.endTime,
        endLocation: data.endLocation,
        endCountry: data.endCountry,
        endOdometer: data.endOdometer,
        totalDurationMinutes: calculateDurationMinutes(prev.startTime, data.endTime),
      };
    });

    // Close active log and switch to REST (inicia descanso diário ou semanal regulamentar)
    setLogs((prev) => {
      const closed = prev.map((l) => {
        if (!l.endTime) {
          return {
            ...l,
            endTime: data.endTime,
            endOdometer: data.endOdometer || l.endOdometer,
          };
        }
        return l;
      });

      const isWeekly = data.restType === 'WEEKLY';
      const restLog: ActivityLog = {
        id: `log-${Date.now()}`,
        type: 'REST',
        startTime: data.endTime,
        endTime: null,
        note: isWeekly
          ? 'Fim de jornada - Início de Descanso Semanal (24h/45h)'
          : 'Fim de jornada - Início de Descanso Diário (9h/11h)',
        vehiclePlate: driverProfile.vehiclePlate,
        location: data.endLocation,
      };
      return [...closed, restLog];
    });

    if (alertSettings.soundAlertsEnabled) {
      playAlertTone('INFO');
    }
  };

  // Reiniciar apenas os contadores (zerar contagens mantendo perfil do motorista e viatura)
  const handleResetCounters = () => {
    const nowIso = new Date().toISOString();
    setLogs([
      {
        id: `log-${Date.now()}`,
        type: 'REST',
        startTime: nowIso,
        endTime: null,
        note: 'Contadores reiniciados a zero',
        vehiclePlate: driverProfile.vehiclePlate,
      },
    ]);
    setCurrentShift(null);
    setShiftSettings((prev) => ({
      ...prev,
      allow10hExtensionToday: false,
      reducedDailyRestAllowedToday: false,
      extendedDrivingCountThisWeek: 0,
      reducedDailyRestCountThisWeek: 0,
      weeklyDrivingMinutes: 0,
      biweeklyDrivingMinutes: 0,
      weeklyRests: [],
    }));
    try {
      localStorage.removeItem('tacopro_current_shift');
    } catch {
      // ignore
    }
    setActiveTab('cockpit');
  };

  // Full reset for first-time use
  const handleResetForFirstUse = () => {
    setLogs([]);
    setCurrentShift(null);
    setDriverProfile({
      name: '',
      driverCardNumber: '',
      vehiclePlate: '',
      companyName: '',
      country: 'Portugal (PT)',
      transportScope: 'NATIONAL',
      crewType: 'SINGLE',
      activeDriverSlot: 1,
    });
    setShiftSettings({
      crewType: 'SINGLE',
      allow10hExtensionToday: false,
      reducedDailyRestAllowedToday: false,
      extendedDrivingCountThisWeek: 0,
      reducedDailyRestCountThisWeek: 0,
      weeklyDrivingMinutes: 0,
      biweeklyDrivingMinutes: 0,
      transportScope: 'NATIONAL',
      weeklyRests: [],
    });
    try {
      localStorage.removeItem('tacopro_logs');
      localStorage.removeItem('tacopro_current_shift');
      localStorage.removeItem('tacopro_profile');
      localStorage.removeItem('tacopro_shift_settings');
    } catch {
      // ignore
    }
    setActiveTab('cockpit');
  };

  const handleRestoreSampleData = () => {
    setLogs(getSampleShiftLogs());
    setDriverProfile(initialDriverProfile);
    setShiftSettings(initialShiftSettings);
    const now = new Date();
    const d0700 = new Date(now);
    d0700.setHours(7, 0, 0, 0);
    setCurrentShift({
      id: 'shift-demo-1',
      isActive: true,
      startTime: d0700.toISOString(),
      endTime: null,
      startLocation: 'Plataforma Logística da Azambuja',
      startCountry: 'Portugal (PT)',
      startOdometer: 412580,
    });
  };

  const handleClearAll = () => {
    setIsResetModalOpen(true);
  };

  const handlePrintDailyReport = () => {
    const summary = generateReportSummary(logs, 'DAILY', shiftSettings, alertSettings);
    setPrintSummary(summary);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header with Navigation and Profile controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        driverProfile={driverProfile}
        soundEnabled={alertSettings.soundAlertsEnabled}
        setSoundEnabled={(val) => setAlertSettings((prev) => ({ ...prev, soundAlertsEnabled: val }))}
        warningCount={compliance.warningCount}
        isShiftActive={compliance.isShiftActive}
        onOpenShiftModal={(mode) => {
          setShiftModalMode(mode);
          setIsShiftModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
        onOpenManualEntry={() => {
          setEditingLog(null);
          setIsManualEntryOpen(true);
        }}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        isQuickWidgetOpen={isQuickWidgetOpen}
        onToggleQuickWidget={() => setIsQuickWidgetOpen(!isQuickWidgetOpen)}
        onOpenVideoShowcase={() => setIsShowcaseOpen(true)}
        onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile Navigation Pills */}
        <div className="md:hidden flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto no-print">
          {[
            { id: 'cockpit', label: t('cockpit') },
            { id: 'compliance', label: t('rulesAndLimits') },
            { id: 'timeline', label: t('timeline24h') },
            { id: 'reports', label: t('reports') },
            { id: 'infringements', label: `${t('inspection')} (${compliance.warningCount})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === item.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Cockpit Tacógrafo */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            <TachographCockpit
              logs={logs}
              activeLog={activeLog}
              compliance={compliance}
              settings={shiftSettings}
              currentShift={currentShift}
              driverProfile={driverProfile}
              onSwitchActivity={handleSwitchActivity}
              onOpenPlanner={() => setIsRestPlannerOpen(true)}
              onOpenManualEntry={() => {
                setEditingLog(null);
                setIsManualEntryOpen(true);
              }}
              onOpenCompensations={() => setIsCompensationOpen(true)}
              onOpenShiftModal={(mode) => {
                setShiftModalMode(mode);
                setIsShiftModalOpen(true);
              }}
              onOpenResetModal={() => setIsResetModalOpen(true)}
              onResetShift={handleResetShift}
              onToggle10hExtension={handleToggle10hExtension}
              onToggleReducedRest={handleToggleReducedRest}
              onToggleCrewType={handleToggleCrewType}
              onSwitchDriverSlot={handleSwitchDriverSlot}
              onOpenWidgetHelp={() => setIsWidgetHelpOpen(true)}
              onToggleWidget={() => setIsQuickWidgetOpen(!isQuickWidgetOpen)}
              isWidgetOpen={isQuickWidgetOpen}
              onOpenVideoShowcase={() => setIsShowcaseOpen(true)}
              onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
            />

            {/* Fita rápida 24h integrada no cockpit para visualização contínua */}
            <ActivityTimeline
              logs={logs}
              onSelectLog={(log) => handleEditLog(log)}
            />
          </div>
        )}

        {/* Tab 2: Regras & Limites Regulamentares (CE 561/2006) */}
        {activeTab === 'compliance' && (
          <ComplianceGauges
            compliance={compliance}
            settings={shiftSettings}
            onOpenPlanner={() => setIsRestPlannerOpen(true)}
            onOpenCompensations={() => setIsCompensationOpen(true)}
          />
        )}

        {/* Tab 3: Fita 24h & Diário de Bordo */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <ActivityTimeline
              logs={logs}
              onSelectLog={(log) => handleEditLog(log)}
            />

            <LogbookTable
              logs={logs}
              onOpenManualEntry={() => {
                setEditingLog(null);
                setIsManualEntryOpen(true);
              }}
              onEditLog={handleEditLog}
              onDeleteLog={handleDeleteLog}
              onPrintReport={handlePrintDailyReport}
              onLoadSample={handleRestoreSampleData}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* Tab 4: Módulo de Relatórios (Diário, Semanal, Mensal) */}
        {activeTab === 'reports' && (
          <ReportsModule
            logs={logs}
            settings={shiftSettings}
            alertConfig={alertSettings}
            driverProfile={driverProfile}
            onPrintReport={(summary) => setPrintSummary(summary)}
          />
        )}

        {/* Tab 5: Fiscalização Rodoviária & Infrações */}
        {activeTab === 'infringements' && (
          <InfringementsPanel
            infringements={infringements}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {t('footerCopyright')}
          </div>
          <div>
            {t('footerRegulation')}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RestPlannerModal
        isOpen={isRestPlannerOpen}
        onClose={() => setIsRestPlannerOpen(false)}
      />

      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => {
          setIsManualEntryOpen(false);
          setEditingLog(null);
        }}
        onSave={handleSaveManualEntry}
        editingLog={editingLog}
        defaultPlate={driverProfile.vehiclePlate}
      />

      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        settings={alertSettings}
        onSave={(newSettings) => setAlertSettings(newSettings)}
      />

      <DriverProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={driverProfile}
        onSave={(newProfile) => {
          setDriverProfile(newProfile);
          setShiftSettings((prev) => ({
            ...prev,
            transportScope: newProfile.transportScope || prev.transportScope,
            crewType: newProfile.crewType || prev.crewType,
          }));
          if (currentShift) {
            setCurrentShift((prev) => (prev ? { ...prev, crewType: newProfile.crewType } : null));
          }
        }}
      />

      <CompensationManagerModal
        isOpen={isCompensationOpen}
        onClose={() => setIsCompensationOpen(false)}
        settings={shiftSettings}
        onUpdateSettings={(newSettings) => setShiftSettings(newSettings)}
      />

      <ShiftControlModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        mode={shiftModalMode}
        currentShift={currentShift}
        compliance={compliance}
        driverProfile={driverProfile}
        onConfirmStart={handleConfirmStartShift}
        onConfirmEnd={handleConfirmEndShift}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetCounters={handleResetCounters}
        onResetForFirstUse={handleResetForFirstUse}
        onRestoreSampleData={handleRestoreSampleData}
      />

      <PrintReport
        summary={printSummary}
        driverProfile={driverProfile}
        onClose={() => setPrintSummary(null)}
      />

      <WidgetHelpModal
        isOpen={isWidgetHelpOpen}
        onClose={() => setIsWidgetHelpOpen(false)}
        onOpenWidget={() => setIsQuickWidgetOpen(true)}
      />

      {/* Definitive Android Native APK & System Widget Architecture Modal */}
      <AndroidApkModal
        isOpen={isAndroidApkOpen}
        onClose={() => setIsAndroidApkOpen(false)}
      />

      {/* Commercial Showcase Video Tour & Voiceover Presentation */}
      <ShowcaseVideoTourModal
        isOpen={isShowcaseOpen}
        onClose={() => setIsShowcaseOpen(false)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Offline Connectivity Status Badge */}
      <OfflineIndicator />

      {/* Floating Quick Activity Widget with Switches, Live Timer, and Total Counters */}
      <QuickActivityWidget
        activeLog={activeLog}
        compliance={compliance}
        onSwitchActivity={handleSwitchActivity}
        isVisible={isQuickWidgetOpen}
        onClose={() => setIsQuickWidgetOpen(false)}
      />
    </div>
  );
}
