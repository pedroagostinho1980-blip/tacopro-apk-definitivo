import React from 'react';
import {
  ShieldCheck,
  Clock,
  Compass,
  Calendar,
  Layers,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { ComplianceStatus, ShiftSettings } from '../types/tachograph';
import {
  formatMinutes,
  MAX_CONTINUOUS_DRIVE_MIN,
  WEEKLY_DRIVE_MAX_MIN,
  BIWEEKLY_DRIVE_MAX_MIN,
} from '../utils/rulesEngine';
import { calculateCompensations } from '../utils/compensationEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface ComplianceGaugesProps {
  compliance: ComplianceStatus;
  settings: ShiftSettings;
  onOpenPlanner: () => void;
  onOpenCompensations?: () => void;
}

export const ComplianceGauges: React.FC<ComplianceGaugesProps> = ({
  compliance,
  settings,
  onOpenPlanner,
  onOpenCompensations,
}) => {
  const { t } = useLanguage();
  const comp = calculateCompensations(settings);

  // Calculate projected deadline for daily shift end
  let shiftDeadlineStr = '--:--';
  if (compliance.shiftStartTime) {
    const startMs = new Date(compliance.shiftStartTime).getTime();
    const deadlineMs = startMs + compliance.maxShiftAmplitudeMinutes * 60 * 1000;
    shiftDeadlineStr = new Date(deadlineMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Weekly progress
  const weeklyDriving = settings.weeklyDrivingMinutes + compliance.dailyDrivingMinutes;
  const weeklyPercent = Math.min(100, Math.round((weeklyDriving / WEEKLY_DRIVE_MAX_MIN) * 100));
  const remainingWeekly = Math.max(0, WEEKLY_DRIVE_MAX_MIN - weeklyDriving);

  // Biweekly progress
  const biweeklyDriving = settings.biweeklyDrivingMinutes + compliance.dailyDrivingMinutes;
  const biweeklyPercent = Math.min(100, Math.round((biweeklyDriving / BIWEEKLY_DRIVE_MAX_MIN) * 100));
  const remainingBiweekly = Math.max(0, BIWEEKLY_DRIVE_MAX_MIN - biweeklyDriving);

  return (
    <div className="space-y-6">
      {/* Title & Legal Disclaimer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Regulamento (CE) n.º 561/2006</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{t('mobilityPackage')}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              {t('limitsDashboardTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {t('limitsDashboardSubtitle')}
            </p>
          </div>

          <button
            onClick={onOpenPlanner}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>{t('restScheduleSimulator')}</span>
          </button>
        </div>
      </div>

      {/* The 4 Core Compliance Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Continuous Driving (4h30) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('pillar1ContinuousDriving')}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Artigo 7.º CE 561
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
                  {formatMinutes(compliance.continuousDrivingMinutes)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t('accumulatedTimeNoBreak')}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold font-mono tabular-nums ${
                  compliance.isContinuousExceeded ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {compliance.isContinuousExceeded
                    ? `+${formatMinutes(compliance.continuousDrivingMinutes - MAX_CONTINUOUS_DRIVE_MIN)} ${t('excessTime')}`
                    : `${formatMinutes(compliance.remainingContinuousDrivingMinutes)} ${t('remainingPlural')}`}
                </div>
                <div className="text-xs text-slate-400">
                  {t('limitArt7')}
                </div>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  compliance.isContinuousExceeded ? 'bg-rose-500' : compliance.remainingContinuousDrivingMinutes <= 30 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${compliance.continuousProgressPercent}%` }}
              />
            </div>

            {/* Split Break Rules Details */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>{t('mandatoryBreakRule')}</span>
                <span className="text-amber-400">45m / 15m + 30m</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('mandatoryBreakRuleDesc')}
              </p>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{t('currentSplitBreak')}</span>
                <span className="font-mono text-slate-200">
                  {compliance.breakStage === 'SPLIT_FIRST_DONE'
                    ? t('splitBreakPhase1Done').replace('{0}', String(compliance.splitFirstBreakMinutes))
                    : compliance.continuousDrivingMinutes === 0
                    ? t('fullBreakDone45m')
                    : t('noFractionRecorded')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Daily Driving (9h / 10h) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('pillar2DailyDriving')}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Artigo 6.º, n.º 1
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
                  {formatMinutes(compliance.dailyDrivingMinutes)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t('totalDrivingToday24h')}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold font-mono tabular-nums ${
                  compliance.isDailyExceeded ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {compliance.isDailyExceeded
                    ? `+${formatMinutes(compliance.dailyDrivingMinutes - compliance.maxDailyDrivingAllowedMinutes)} ${t('excessTime')}`
                    : `${formatMinutes(compliance.remainingDailyDrivingMinutes)} ${t('remainingPlural')}`}
                </div>
                <div className="text-xs text-slate-400">
                  {t('authorizedToday')} {formatMinutes(compliance.maxDailyDrivingAllowedMinutes)}
                </div>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  compliance.isDailyExceeded ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${compliance.dailyProgressPercent}%` }}
              />
            </div>

            {/* Extension details */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>{t('extension10hTitle')}</span>
                <span className="text-amber-400">{t('extensionsUsedCount').replace('{0}', String(settings.extendedDrivingCountThisWeek))}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('extension10hRuleDesc')}
              </p>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{t('todayStatus')}</span>
                <span className="font-semibold text-white">
                  {settings.allow10hExtensionToday ? t('extended10hActive') : t('standard9hRegular')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Daily Shift Amplitude & Daily Rest */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('pillar3ShiftRest')}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {compliance.crewType === 'MULTI_MANNING' ? 'Art. 8.º, n.º 5' : 'Artigo 8.º CE 561'}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
                  {formatMinutes(compliance.shiftElapsedMinutes)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {compliance.isShiftActive
                    ? (compliance.crewType === 'MULTI_MANNING' ? t('amplitudeElapsedTeam') : t('amplitudeElapsedInShift'))
                    : t('amplitudeSuspendedInRest')}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold font-mono tabular-nums ${
                  compliance.isShiftAmplitudeExceeded
                    ? 'text-rose-400'
                    : compliance.isShiftActive
                    ? 'text-indigo-400'
                    : 'text-emerald-400'
                }`}>
                  {compliance.isShiftAmplitudeExceeded
                    ? t('amplitudeExceeded')
                    : compliance.isShiftActive
                    ? `${formatMinutes(compliance.remainingShiftMinutes)} ${t('remainingPlural')}`
                    : t('shiftClosedResting')}
                </div>
                <div className="text-xs text-slate-400">
                  {compliance.isShiftActive
                    ? t('maximumWithCycle').replace('{0}', formatMinutes(compliance.maxShiftAmplitudeMinutes)).replace('{1}', String(compliance.shiftCycleHours))
                    : t('restAccumulatedSinceEnd').replace('{0}', formatMinutes(compliance.interShiftRest.elapsedRestMinutes))}
                </div>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  compliance.isShiftAmplitudeExceeded
                    ? 'bg-rose-500'
                    : compliance.isShiftActive
                    ? 'bg-indigo-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (compliance.shiftElapsedMinutes / compliance.maxShiftAmplitudeMinutes) * 100)}%` }}
              />
            </div>

            {/* Amplitude & Rest Rules */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>{compliance.isShiftActive ? t('deadlineForShiftEnd') : t('dailyShiftStatus')}</span>
                <span className={`font-mono font-bold text-sm ${compliance.isShiftActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {compliance.isShiftActive ? shiftDeadlineStr : t('shiftEndedRestActive')}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {compliance.isShiftActive
                  ? (compliance.crewType === 'MULTI_MANNING'
                    ? 'Na Tripulação Múltipla (Art. 8.º, n.º 5), em cada período de 30 horas a contar do termo do repouso anterior, ambos os motoristas devem cumprir um descanso diário de pelo menos 9h ininterruptas (com veículo parado).'
                    : 'Dentro de cada período de 24 horas após o descanso anterior, o motorista deve gozar um novo período de repouso diário de 11h (amplitude 13h) ou reduzido de 9h (amplitude 15h, máx 3 vezes por semana).')
                  : t('amplitudeSuspended')}
              </p>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                {compliance.crewType === 'MULTI_MANNING' ? (
                  <>
                    <span className="text-indigo-400 font-semibold">👥 {t('multiManning')}:</span>
                    <span className="font-mono text-slate-200">{t('teamShiftActiveNotice')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400">{t('reducedRestUsedThisWeek')}</span>
                    <span className="font-mono text-slate-200">{t('outOfAllowedCount').replace('{0}', String(settings.reducedDailyRestCountThisWeek)).replace('{1}', '3')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 4: Weekly & Bi-Weekly Driving (56h / 90h) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('pillar4WeeklyBiweekly')}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Artigo 6.º, n.º 2 e 3
              </span>
            </div>

            {/* Weekly bar */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-slate-300">{t('currentWeekMax56h')}</span>
                <span className="font-mono text-slate-200">
                  <strong>{formatMinutes(weeklyDriving)}</strong> / 56h 00m ({t('marginRemaining').replace('{0}', formatMinutes(remainingWeekly))})
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${weeklyPercent}%` }}
                />
              </div>
            </div>

            {/* Biweekly bar */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-slate-300">{t('biweeklyMax90h')}</span>
                <span className="font-mono text-slate-200">
                  <strong>{formatMinutes(biweeklyDriving)}</strong> / 90h 00m ({t('marginRemaining').replace('{0}', formatMinutes(remainingBiweekly))})
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                  style={{ width: `${biweeklyPercent}%` }}
                />
              </div>
            </div>

            {/* Weekly Rules & Compensations Tracker */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>{t('regularWeeklyRestTitle')}</span>
                <span className="text-amber-400">{t('regularWeeklyRestHours')}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('weeklyRestCabNotice')}
              </p>

              {/* Status Compensações Artigo 8.º */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('compensations')} ({settings.transportScope === 'INTERNATIONAL' ? t('international') : t('national')}):</span>
                  </span>
                  <span className={`text-[11px] font-mono font-bold ${comp.totalMinutesOwed > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {comp.totalMinutesOwed > 0 ? `${formatMinutes(comp.totalMinutesOwed)} ${t('pendingPlural')}` : t('compensationsUpToDate')}
                  </span>
                </div>

                {comp.alerts.length > 0 && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded leading-tight">
                    {comp.alerts[0]}
                  </div>
                )}

                {onOpenCompensations && (
                  <button
                    onClick={onOpenCompensations}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    <span>{t('openCompensationsManager')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 5: Night Work Regulation (Início entre as 00h00 e as 05h00 -> Máx 10h Trabalho/Condução) */}
        <div className="md:col-span-2 bg-slate-900 border border-indigo-500/30 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('pillar5NightWork')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {compliance.isNightShift ? t('nightShiftDetected') : t('normalDayShift')}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Decreto-Lei n.º 237/2007 (Art. 7.º) / Diretiva 2002/15/CE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
                  {formatMinutes(compliance.dailyWorkAndDriveMinutes)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t('driving')} ({formatMinutes(compliance.dailyDrivingMinutes)}) + {t('otherWork')} ({formatMinutes(compliance.dailyOtherWorkMinutes)})
                </div>
              </div>

              <div>
                <div className={`text-xl font-bold font-mono tabular-nums ${compliance.isNightWorkExceeded ? 'text-rose-400' : 'text-indigo-400'}`}>
                  {compliance.isNightWorkExceeded
                    ? `+${formatMinutes(compliance.dailyWorkAndDriveMinutes - compliance.maxNightWorkMinutes)} ${t('excessTime')}`
                    : `${formatMinutes(compliance.remainingNightWorkMinutes)} ${t('remainingPlural')}`}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t('maxCapAllowed10h')}
                </div>
              </div>

              <div className="text-xs text-slate-300 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-amber-400 mb-1">{t('roadSafetyRule')}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('nightWorkRoadSafetyDesc')}
                </p>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  compliance.isNightWorkExceeded
                    ? 'bg-rose-500'
                    : compliance.remainingNightWorkMinutes <= 30 && compliance.isNightShift
                    ? 'bg-amber-400'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${compliance.nightWorkProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
              <span>0h 00m</span>
              <span>{t('imperativeNightLimit')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Summary of Today's Shift */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">
          {t('todaysShiftSummary')}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-semibold">{t('totalDrivingStat')}</div>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              {formatMinutes(compliance.dailyDrivingMinutes)}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
            <div className="text-xs text-amber-400 font-semibold">{t('totalWorkStat')}</div>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              {formatMinutes(compliance.dailyOtherWorkMinutes)}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
            <div className="text-xs text-cyan-400 font-semibold">{t('totalAvailabilityStat')}</div>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              {formatMinutes(compliance.dailyAvailabilityMinutes)}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
            <div className="text-xs text-indigo-400 font-semibold">{t('totalRestStat')}</div>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              {formatMinutes(compliance.dailyRestMinutes)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
