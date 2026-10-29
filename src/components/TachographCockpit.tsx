import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  AlertTriangle,
  Play,
  Square,
  Coffee,
  Wrench,
  Gauge,
  MapPin,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Moon,
  Calendar,
  Globe,
  Sparkles,
  CheckCircle2,
  Trash2,
  Users,
  User,
  ArrowLeftRight,
  Smartphone,
  Video,
} from 'lucide-react';
import { ActivityLog, ActivityType, ComplianceStatus, ShiftSettings, ActiveShift, DriverProfile } from '../types/tachograph';
import { formatMinutes, formatTimeHHMM } from '../utils/rulesEngine';
import { calculateCompensations } from '../utils/compensationEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface TachographCockpitProps {
  logs: ActivityLog[];
  activeLog: ActivityLog | undefined;
  compliance: ComplianceStatus;
  settings: ShiftSettings;
  currentShift: ActiveShift | null;
  driverProfile: DriverProfile;
  onSwitchActivity: (type: ActivityType, note?: string, location?: string) => void;
  onOpenPlanner: () => void;
  onOpenManualEntry: () => void;
  onOpenCompensations: () => void;
  onOpenShiftModal: (mode: 'START' | 'END') => void;
  onOpenResetModal: () => void;
  onResetShift: () => void;
  onToggle10hExtension: () => void;
  onToggleReducedRest: () => void;
  onToggleCrewType?: () => void;
  onSwitchDriverSlot?: () => void;
  onOpenWidgetHelp?: () => void;
  onToggleWidget?: () => void;
  isWidgetOpen?: boolean;
  onOpenVideoShowcase?: () => void;
  onOpenAndroidApk?: () => void;
}

export const TachographCockpit: React.FC<TachographCockpitProps> = ({
  activeLog,
  compliance,
  settings,
  currentShift,
  driverProfile,
  onSwitchActivity,
  onOpenPlanner,
  onOpenCompensations,
  onOpenShiftModal,
  onOpenResetModal,
  onResetShift,
  onToggle10hExtension,
  onToggleReducedRest,
  onToggleCrewType,
  onSwitchDriverSlot,
  onOpenWidgetHelp,
  onToggleWidget,
  isWidgetOpen = true,
  onOpenVideoShowcase,
  onOpenAndroidApk,
}) => {
  const { t } = useLanguage();
  const comp = calculateCompensations(settings);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [quickLocation, setQuickLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);

  // Update live clock, active activity seconds, and inter-shift rest seconds
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (activeLog) {
        const start = new Date(activeLog.startTime).getTime();
        const diffSecs = Math.max(0, Math.floor((now.getTime() - start) / 1000));
        setCurrentSeconds(diffSecs);
      } else {
        setCurrentSeconds(0);
      }

      if (compliance.interShiftRest.restStartedAt) {
        const restStart = new Date(compliance.interShiftRest.restStartedAt).getTime();
        const diffRestSecs = Math.max(0, Math.floor((now.getTime() - restStart) / 1000));
        setRestSeconds(diffRestSecs);
      } else {
        setRestSeconds(0);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeLog, compliance.interShiftRest.restStartedAt]);

  const formatSecondsToHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activityModes: {
    type: ActivityType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    activeBorder: string;
    activeBg: string;
    badgeColor: string;
  }[] = [
    {
      type: 'DRIVING',
      label: t('driving'),
      sublabel: t('drivingSub'),
      icon: <Compass className="w-6 h-6 text-emerald-400" />,
      activeBorder: 'border-emerald-500 shadow-emerald-500/20 shadow-lg',
      activeBg: 'bg-emerald-950/40 text-emerald-100',
      badgeColor: 'text-emerald-400',
    },
    {
      type: 'WORK',
      label: t('otherWork'),
      sublabel: t('workSub'),
      icon: <Wrench className="w-6 h-6 text-amber-400" />,
      activeBorder: 'border-amber-500 shadow-amber-500/20 shadow-lg',
      activeBg: 'bg-amber-950/40 text-amber-100',
      badgeColor: 'text-amber-400',
    },
    {
      type: 'AVAILABILITY',
      label: t('availability'),
      sublabel: t('availabilitySub'),
      icon: <Clock className="w-6 h-6 text-cyan-400" />,
      activeBorder: 'border-cyan-500 shadow-cyan-500/20 shadow-lg',
      activeBg: 'bg-cyan-950/40 text-cyan-100',
      badgeColor: 'text-cyan-400',
    },
    {
      type: 'REST',
      label: t('rest'),
      sublabel: t('restSub'),
      icon: <Coffee className="w-6 h-6 text-indigo-400" />,
      activeBorder: 'border-indigo-500 shadow-indigo-500/20 shadow-lg',
      activeBg: 'bg-indigo-950/40 text-indigo-100',
      badgeColor: 'text-indigo-400',
    },
  ];

  const handleModeClick = (type: ActivityType) => {
    if (activeLog?.type === type) return;
    onSwitchActivity(type, undefined, quickLocation || undefined);
    setQuickLocation('');
    setShowLocationInput(false);
  };

  return (
    <div className="space-y-6">
      {/* SHIFT & JORNADA CONTROL HERO CARD */}
      <div className={`rounded-2xl border p-5 shadow-lg transition-all ${
        compliance.isShiftActive
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30 shadow-emerald-950/20'
          : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30 shadow-indigo-950/20'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Status Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                compliance.isShiftActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${compliance.isShiftActive ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
                {compliance.isShiftActive ? t('shiftInProgress') : t('shiftEnded')}
              </span>

              {/* Crew Type Pill & Toggle Button */}
              <button
                onClick={onToggleCrewType}
                title="Alternar entre Motorista Único e Tripulação Múltipla"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${
                  compliance.crewType === 'MULTI_MANNING'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {compliance.crewType === 'MULTI_MANNING' ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('multiManningMode')}</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('singleDriverMode')}</span>
                  </>
                )}
                <span className="text-[10px] text-amber-400 font-sans ml-1 underline">{t('toggle')}</span>
              </button>

              {compliance.isShiftActive ? (
                <span className="text-xs text-slate-300">
                  {t('startedAt')} <strong className="text-white font-mono">{formatTimeHHMM(compliance.shiftStartTime || '')}</strong>
                  {currentShift?.startLocation ? ` ${t('inLocation')} ${currentShift.startLocation}` : ''}
                  {currentShift?.startCountry ? ` (${currentShift.startCountry})` : ''}
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  {t('amplitudeSuspended')}
                </span>
              )}
            </div>

            {/* In-Shift Amplitude vs Inter-Shift Rest */}
            {compliance.isShiftActive ? (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">{t('shiftAmplitude')}: </span>
                  <strong className="text-white font-mono text-sm">{formatMinutes(compliance.shiftElapsedMinutes)}</strong>
                  <span className="text-slate-500 font-mono"> / {formatMinutes(compliance.maxShiftAmplitudeMinutes)} ({compliance.shiftCycleHours}h)</span>
                </div>
                <div className="h-3 w-px bg-slate-700 hidden sm:block" />
                <div>
                  <span className="text-slate-400">{t('remainingForRest')} </span>
                  <strong className={`font-mono ${compliance.remainingShiftMinutes <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatMinutes(compliance.remainingShiftMinutes)}
                  </strong>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-3">
                  <div className="text-xs text-slate-400">{t('restTimeSinceShiftEnd')}</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300 tabular-nums">
                    {formatSecondsToHMS(restSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Manning Dual Driver Slots Banner */}
            {compliance.crewType === 'MULTI_MANNING' && (
              <div className="mt-3 p-3 bg-slate-950/70 border border-indigo-500/30 rounded-xl text-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-300 flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>{t('teamMultiManningTitle')}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">· {t('twoDriversOnBoard')}</span>
                  </div>
                  <button
                    onClick={onSwitchDriverSlot}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                    title={t('switchDriverWheel')}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('switchDriverWheel')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Slot 1 */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    (driverProfile.activeDriverSlot || 1) === 1
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">Slot 1</span>
                        <span className="text-white">{driverProfile.name || 'Condutor 1'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Cartão: {driverProfile.driverCardNumber || 'PT-100294819-0'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (driverProfile.activeDriverSlot || 1) === 1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(driverProfile.activeDriverSlot || 1) === 1 ? t('atWheelActive') : t('availability')}
                    </span>
                  </div>

                  {/* Slot 2 */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    (driverProfile.activeDriverSlot || 1) === 2
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">Slot 2</span>
                        <span className="text-white">{driverProfile.coDriverName || 'Condutor 2'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Cartão: {driverProfile.coDriverCardNumber || 'PT-100481920-1'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (driverProfile.activeDriverSlot || 1) === 2
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(driverProfile.activeDriverSlot || 1) === 2 ? t('atWheelActive') : t('availability')}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('teamBreakTip')}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {compliance.isShiftActive ? (
              <button
                onClick={() => onOpenShiftModal('END')}
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-2.5 shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-700/70 flex items-center justify-center shrink-0">
                  <Square className="w-4 h-4 fill-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">{t('endShift')}</div>
                  <div className="text-[10px] text-rose-200 font-normal">{t('endShiftSub')}</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => onOpenShiftModal('START')}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2.5 shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300/50 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600/40 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-slate-950" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">{t('startShift')}</div>
                  <div className="text-[10px] text-emerald-950/80 font-normal">{t('startShiftSub')}</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* When NOT in active shift: Show the 4 Inter-Shift Rest Milestones */}
        {!compliance.isShiftActive && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('restMilestonesTitle')}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {t('activeTarget')} <strong className="text-indigo-300">{
                  compliance.interShiftRest.nextRestTargetType === 'DAILY_9H'
                    ? (compliance.crewType === 'MULTI_MANNING' ? t('rest9hRegularTeam') : t('rest9hReduced'))
                    : compliance.interShiftRest.nextRestTargetType === 'DAILY_11H' ? t('rest11hRegular')
                    : compliance.interShiftRest.nextRestTargetType === 'WEEKLY_24H' ? t('rest24hWeekly') : t('rest45hWeekly')
                }</strong> · {t('remainingTime')} <strong className="text-white font-mono">{formatMinutes(compliance.interShiftRest.remainingMinutesToNextTarget)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 9h Diário Reduzido ou Regular Equipa */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                compliance.interShiftRest.is9hReached
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{compliance.crewType === 'MULTI_MANNING' ? t('rest9hRegularTeam') : t('rest9hReduced')}</span>
                  {compliance.interShiftRest.is9hReached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      {compliance.interShiftRest.target9hTime ? formatTimeHHMM(compliance.interShiftRest.target9hTime) : '--:--'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] mt-1 text-slate-400">
                  {compliance.interShiftRest.is9hReached
                    ? (compliance.crewType === 'MULTI_MANNING' ? t('targetReachedTeam') : t('targetReachedMax3'))
                    : (compliance.crewType === 'MULTI_MANNING' ? t('teamTargetFull') : t('targetDailyReduced'))}
                </div>
              </div>

              {/* 11h Diário Regular */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                compliance.interShiftRest.is11hReached
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{t('rest11hRegular')}</span>
                  {compliance.interShiftRest.is11hReached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      {compliance.interShiftRest.target11hTime ? formatTimeHHMM(compliance.interShiftRest.target11hTime) : '--:--'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] mt-1 text-slate-400">
                  {compliance.interShiftRest.is11hReached ? t('targetReachedStandard') : t('targetDailyRegular')}
                </div>
              </div>

              {/* 24h Semanal Reduzido */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                compliance.interShiftRest.is24hReached
                  ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{t('rest24hWeekly')}</span>
                  {compliance.interShiftRest.is24hReached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      {compliance.interShiftRest.target24hTime ? formatTimeHHMM(compliance.interShiftRest.target24hTime) : '--:--'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] mt-1 text-slate-400">
                  {compliance.interShiftRest.is24hReached ? t('targetReachedCompensate') : t('weekendRestFDS')}
                </div>
              </div>

              {/* 45h Semanal Regular */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                compliance.interShiftRest.is45hReached
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{t('rest45hWeekly')}</span>
                  {compliance.interShiftRest.is45hReached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      {compliance.interShiftRest.target45hTime ? formatTimeHHMM(compliance.interShiftRest.target45hTime) : '--:--'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] mt-1 text-slate-400">
                  {compliance.interShiftRest.is45hReached ? t('targetReachedFull') : t('weekendNormal')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Banner: Tachograph Hardware Status & Digital Clock */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('digitalTachographHardware')}</span>
                <span className="text-xs font-semibold text-amber-400">
                  {compliance.crewType === 'MULTI_MANNING' ? t('multiManningModeBanner') : t('singleDriverModeBanner')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{t('realtimeControlCockpit')}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
            <button
              onClick={onOpenResetModal}
              title={t('resetCountersOrRestore')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t('resetCountersOrRestore')}</span>
            </button>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">{t('localTime')}</div>
              <div className="text-2xl font-bold font-mono tracking-wider text-amber-400 tabular-nums">
                {currentTimeStr || '--:--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Mode Counter & Immediate Countdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
          {/* Left: Active Mode Elapsed Counter */}
          <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('currentTachoState')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {t('startTime')} {activeLog ? new Date(activeLog.startTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  {activityModes.find(m => m.type === (activeLog?.type || 'REST'))?.icon}
                </div>
                <div>
                  <div className="text-xl font-bold text-white">
                    {activityModes.find(m => m.type === (activeLog?.type || 'REST'))?.label}
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeLog?.location || activeLog?.note || t('noLoadNotes')}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
                  {formatSecondsToHMS(currentSeconds)}
                </div>
                <div className="text-xs text-slate-400 font-mono">{t('elapsedDuration')}</div>
              </div>
            </div>

            {/* Location quick tag */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeLog?.location ? activeLog.location : t('locationNotRecorded')}</span>
              </div>
              <button
                onClick={() => setShowLocationInput(!showLocationInput)}
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
              >
                {showLocationInput ? t('closeEditLocation') : t('editLocation')}
              </button>
            </div>

            {showLocationInput && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t('locationPlaceholder')}
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    if (activeLog && quickLocation.trim()) {
                      activeLog.location = quickLocation.trim();
                      setShowLocationInput(false);
                      setQuickLocation('');
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {t('saveLocation')}
                </button>
              </div>
            )}
          </div>

          {/* Right: Regulatory Countdown Gauge (Condução Contínua ou Pausa Restante) */}
          <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {activeLog?.type === 'REST' ? t('breakRestControl') : t('continuousDrivingLimit')}
              </span>
              <span className={`text-xs font-semibold font-mono ${compliance.isContinuousExceeded ? 'text-rose-400' : compliance.remainingContinuousDrivingMinutes <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {compliance.isContinuousExceeded ? t('activeInfringement') : compliance.remainingContinuousDrivingMinutes <= 30 ? t('earlyWarning') : t('compliantCE561')}
              </span>
            </div>

            {activeLog?.type === 'REST' ? (
              // REST MODE PROGRESS
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-400 tabular-nums">
                    {formatMinutes(compliance.currentBreakMinutes)}
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    {compliance.breakStage === 'SPLIT_FIRST_DONE' ? (
                      <span>{t('breakPhase2').replace('{0}', String(Math.max(0, 30 - compliance.currentBreakMinutes)))}</span>
                    ) : compliance.currentBreakMinutes < 15 ? (
                      <span>{t('breakPhase1').replace('{0}', String(15 - compliance.currentBreakMinutes))}</span>
                    ) : compliance.currentBreakMinutes < 45 ? (
                      <span>{t('breakFullLeft').replace('{0}', String(45 - compliance.currentBreakMinutes))}</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">{t('breakCompletedOk')}</span>
                    )}
                  </div>
                </div>

                {/* Progress bar for Break */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (compliance.currentBreakMinutes / 45) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                  <span>0m</span>
                  <span>{t('split1')}</span>
                  <span>{t('split2')}</span>
                  <span>{t('fullBreak')}</span>
                </div>
              </div>
            ) : (
              // DRIVING / WORK MODE PROGRESS
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
                      {formatMinutes(compliance.continuousDrivingMinutes)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('continuousAccumulatedNoBreak')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${compliance.isContinuousExceeded ? 'text-rose-500' : compliance.remainingContinuousDrivingMinutes <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {compliance.isContinuousExceeded ? `+${formatMinutes(compliance.continuousDrivingMinutes - 270)}` : formatMinutes(compliance.remainingContinuousDrivingMinutes)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {compliance.isContinuousExceeded ? t('excessTime') : t('remainingUntilStop')}
                    </div>
                  </div>
                </div>

                {/* Progress bar for Continuous Driving */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      compliance.isContinuousExceeded
                        ? 'bg-rose-500'
                        : compliance.remainingContinuousDrivingMinutes <= 30
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${compliance.continuousProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                  <span>0h 00m</span>
                  <span>{t('limitArt7')}</span>
                </div>
              </div>
            )}

            {/* Split break status footnote */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t('splitBreakStatus')}</span>
              <span className="font-medium text-slate-300">
                {compliance.breakStage === 'SPLIT_FIRST_DONE' ? (
                  <span className="text-cyan-400">{t('splitStage1Done').replace('{0}', String(compliance.splitFirstBreakMinutes))}</span>
                ) : compliance.continuousDrivingMinutes === 0 ? (
                  <span className="text-emerald-400">{t('breakCompletedZero')}</span>
                ) : (
                  <span>{t('noFractionAccumulated')}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Night Work Rule Status */}
        {compliance.isNightShift && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{t('nightWorkActive')}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {t('nightWorkWindow')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t('nightWorkNotice')}
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <div className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${compliance.isNightWorkExceeded ? 'text-rose-400' : 'text-indigo-300'}`}>
                  {formatMinutes(compliance.dailyWorkAndDriveMinutes)} / 10h 00m
                </div>
                <div className="text-[10px] text-slate-400">
                  {compliance.isNightWorkExceeded
                    ? `${t('excess')} +${formatMinutes(compliance.dailyWorkAndDriveMinutes - 600)}`
                    : `${t('remaining')} ${formatMinutes(compliance.remainingNightWorkMinutes)}`}
                </div>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  compliance.isNightWorkExceeded ? 'bg-rose-500' : compliance.remainingNightWorkMinutes <= 30 ? 'bg-amber-400' : 'bg-indigo-500'
                }`}
                style={{ width: `${compliance.nightWorkProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Warning alerts ticker if any */}
        {compliance.urgentWarnings.length > 0 && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              {compliance.urgentWarnings.map((warn, i) => (
                <div key={i} className="font-medium leading-relaxed">
                  {warn}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The 4 Big Tactile Tachograph Selector Buttons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-200">
            {t('operationModeSelector')}
          </div>
          <span className="text-xs text-slate-400">
            {t('tapToSwitchOfficial')}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {activityModes.map((mode) => {
            const isActive = activeLog?.type === mode.type;

            return (
              <button
                key={mode.type}
                onClick={() => handleModeClick(mode.type)}
                className={`relative text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  isActive
                    ? `${mode.activeBorder} ${mode.activeBg}`
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {t('activePill')}
                  </span>
                )}

                <div>
                  <div className="mb-2">{mode.icon}</div>
                  <div className="font-bold text-sm sm:text-base text-white tracking-tight">
                    {mode.label}
                  </div>
                </div>

                <div className="text-xs text-slate-400 mt-2">
                  {mode.sublabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shift Shortcuts & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 10h Extension Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('dailyExtensionArt6')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {settings.extendedDrivingCountThisWeek}/2 {t('usedCount')}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {t('driving10h')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t('driving10hDesc')}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              {t('today')} <strong>{settings.allow10hExtensionToday ? '10h 00m' : '09h 00m'}</strong>
            </span>
            <button
              onClick={onToggle10hExtension}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                settings.allow10hExtensionToday
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {settings.allow10hExtensionToday ? t('activated') : t('activate')}
            </button>
          </div>
        </div>

        {/* Card 2: Reduced Daily Rest Toggle (9h) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('reducedRestArt8')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {settings.reducedDailyRestCountThisWeek}/3 {t('usedCountMasc')}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {t('shiftSpan15h')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t('shiftSpan15hDesc')}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              {t('maxLabel')} <strong>{settings.reducedDailyRestAllowedToday ? '15h' : '13h'}</strong>
            </span>
            <button
              onClick={onToggleReducedRest}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                settings.reducedDailyRestAllowedToday
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {settings.reducedDailyRestAllowedToday ? t('activated') : t('activate')}
            </button>
          </div>
        </div>

        {/* Card 3: Weekly Rest Compensations Manager */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('compensations')}</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                settings.transportScope === 'INTERNATIONAL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {settings.transportScope === 'INTERNATIONAL' ? t('international') : t('national')}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {comp.totalMinutesOwed > 0 ? `${formatMinutes(comp.totalMinutesOwed)} ${t('toCompensate')}` : t('compensationsUpToDate')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t('nextWeekend')} <strong className="text-white">{comp.nextRestMinHoursRequired}h mín.</strong>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onOpenCompensations}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <span>{t('manageCompensations')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Rest Stop Assistant */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" />
                {t('departureAssistant')}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {t('stopCalculator')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t('stopCalcDesc')}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onOpenPlanner}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <span>{t('openCalculator')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Widget Quick Access & Mobile Installation Card */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 rounded-xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{t('widgetCardTitle')}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                {isWidgetOpen ? t('widgetActiveOnScreen') : t('available')}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {t('widgetCardDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
          {onToggleWidget && (
            <button
              onClick={onToggleWidget}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isWidgetOpen
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{isWidgetOpen ? t('focusWidget') : t('activateWidget')}</span>
            </button>
          )}

          {onOpenWidgetHelp && (
            <button
              onClick={onOpenWidgetHelp}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-300 hover:text-white border border-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('howToInstall')}</span>
            </button>
          )}

          {onOpenAndroidApk && (
            <button
              onClick={onOpenAndroidApk}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="text-emerald-400">⚡</span>
              <span>APK Definitivo Android</span>
            </button>
          )}
        </div>
      </div>

      {/* Promotional Showcase & Video Presentation Card */}
      {onOpenVideoShowcase && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-950/20 border border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
              <Video className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Vídeo Demonstrativo & Apresentação Comercial</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Com Voz Guiada & Guião
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Demonstração completa para clientes e frotistas: Cockpit tátil, limites CE 561, trabalho noturno (DL 237/2007), calculador de paragem, compensações e auditoria com narração em português.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenVideoShowcase}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Ver Demonstração com Narração</span>
          </button>
        </div>
      )}

      {/* First-time use reset banner & quick start helper */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white">{t('counterControlTitle')}</div>
            <div className="text-[11px] text-slate-400">{t('counterControlDesc')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenResetModal}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('resetCounters')}</span>
          </button>
          <button
            onClick={onOpenResetModal}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap border border-rose-800/40"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('firstUseReset')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
