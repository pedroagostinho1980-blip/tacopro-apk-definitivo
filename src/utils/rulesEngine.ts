/**
 * Tachograph Rules Engine conforming to EU Regulation (EC) No 561/2006
 * (Regulamento CE 561/2006 do Parlamento Europeu e do Conselho)
 */

import { ActivityLog, ComplianceStatus, Infringement, ShiftSettings, AlertSettings, ActiveShift, InterShiftRestStatus, CrewType } from '../types/tachograph';
import { detectCompensationInfringements } from './compensationEngine';

export const MAX_CONTINUOUS_DRIVE_MIN = 270; // 4 hours 30 minutes
export const STANDARD_DAILY_DRIVE_MIN = 540; // 9 hours
export const EXTENDED_DAILY_DRIVE_MIN = 600; // 10 hours
export const REGULAR_SHIFT_MAX_MIN = 780; // 13 hours (24h - 11h rest) - Motorista Único
export const EXTENDED_SHIFT_MAX_MIN = 900; // 15 hours (24h - 9h reduced rest) - Motorista Único
export const MULTI_MANNING_SHIFT_MAX_MIN = 1260; // 21 hours (30h - 9h rest) - Tripulação Múltipla
export const WEEKLY_DRIVE_MAX_MIN = 3360; // 56 hours
export const BIWEEKLY_DRIVE_MAX_MIN = 5400; // 90 hours

export const defaultAlertSettings: AlertSettings = {
  continuousMaxLimitMinutes: 270, // 4h30
  continuousWarningAdvanceMinutes: 15, // alert 15 min before (can be 30, 45)
  dailyWarningAdvanceMinutes: 30, // alert 30 min before 9h/10h
  amplitudeWarningAdvanceMinutes: 30, // alert 30 min before 13h/15h
  notifyRestCompletion: true, // alert when mandatory rest target is hit
  soundAlertsEnabled: true,
  visualBannersEnabled: true,
  browserNotificationsEnabled: false,
};

export function formatMinutes(mins: number): string {
  const isNegative = mins < 0;
  const abs = Math.abs(Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const prefix = isNegative ? '-' : '';
  return `${prefix}${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
}

export function formatTimeHHMM(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function formatShortDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function calculateDurationMinutes(start: string, end: string | null, currentTime: Date = new Date()): number {
  const startDate = new Date(start).getTime();
  const endDate = end ? new Date(end).getTime() : currentTime.getTime();
  const diffMs = Math.max(0, endDate - startDate);
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Calculates current continuous driving block and break compliance
 * Follows Artigo 7º:
 * - 45 min uninterrupted break resets continuous driving
 * - Split break: first >= 15 min, followed by second >= 30 min resets continuous driving
 * Applies user configurable alert thresholds
 */
export function calculateCompliance(
  logs: ActivityLog[],
  settings: ShiftSettings,
  alertConfig: AlertSettings = defaultAlertSettings,
  now: Date = new Date(),
  currentShift?: ActiveShift | null
): ComplianceStatus {
  // Sort logs chronologically
  const sorted = [...logs].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Determine current active log
  const activeLog = sorted.find(l => !l.endTime);

  // Determine Shift State (Início de Turno vs Fim de Turno / Fora de Serviço)
  let shiftState: 'IN_PROGRESS' | 'ENDED' | 'NOT_STARTED' = 'NOT_STARTED';
  let isShiftActive = false;
  let shiftStartTime: string | null = null;

  if (currentShift) {
    if (currentShift.isActive) {
      shiftState = 'IN_PROGRESS';
      isShiftActive = true;
      shiftStartTime = currentShift.startTime;
    } else {
      shiftState = 'ENDED';
      isShiftActive = false;
      shiftStartTime = currentShift.startTime;
    }
  } else {
    // If no explicit shift record exists, deduce reasonably from logs
    if (logs.length > 0) {
      // If there are logs today, look for the start of the shift
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const recentLogs = sorted.filter(l => {
        const t = new Date(l.startTime).getTime();
        return t >= todayStart.getTime() - 24 * 3600 * 1000;
      });

      for (const log of recentLogs) {
        if (log.type !== 'REST') {
          if (!shiftStartTime) {
            shiftStartTime = log.startTime;
          }
        }
      }

      // If there is an active log and it is not REST, shift is in progress
      if (activeLog && activeLog.type !== 'REST') {
        shiftState = 'IN_PROGRESS';
        isShiftActive = true;
      } else if (shiftStartTime) {
        // Last non-rest was completed, check if driver is resting
        shiftState = activeLog?.type === 'REST' ? 'ENDED' : 'NOT_STARTED';
      }
    }
  }

  // Group today's shift logs
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const recentLogs = sorted.filter(l => {
    const t = new Date(l.startTime).getTime();
    return t >= todayStart.getTime() - 24 * 3600 * 1000;
  });

  // Calculate totals for today
  let dailyDriving = 0;
  let dailyOtherWork = 0;
  let dailyAvailability = 0;
  let dailyRest = 0;

  for (const log of sorted) {
    const logDate = new Date(log.startTime);
    if (logDate >= todayStart || (!log.endTime && new Date(log.startTime).getTime() <= now.getTime())) {
      const dur = calculateDurationMinutes(log.startTime, log.endTime, now);
      if (log.type === 'DRIVING') dailyDriving += dur;
      else if (log.type === 'WORK') dailyOtherWork += dur;
      else if (log.type === 'AVAILABILITY') dailyAvailability += dur;
      else if (log.type === 'REST') dailyRest += dur;
    }
  }

  // Continuous Driving Evaluation (Artigo 7º)
  let continuousDriving = 0;
  let splitFirstDone = false;
  let splitFirstMinutes = 0;
  let currentOngoingBreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const dur = calculateDurationMinutes(log.startTime, log.endTime, now);

    if (log.type === 'REST') {
      if (!log.endTime) {
        currentOngoingBreak = dur;
      }

      if (dur >= 45) {
        continuousDriving = 0;
        splitFirstDone = false;
        splitFirstMinutes = 0;
      } else if (!splitFirstDone && dur >= 15) {
        splitFirstDone = true;
        splitFirstMinutes = dur;
      } else if (splitFirstDone && dur >= 30) {
        continuousDriving = 0;
        splitFirstDone = false;
        splitFirstMinutes = 0;
      }
    } else if (log.type === 'DRIVING') {
      continuousDriving += dur;
      currentOngoingBreak = 0;
    } else {
      currentOngoingBreak = 0;
    }
  }

  if (activeLog && activeLog.type === 'REST') {
    if (currentOngoingBreak >= 45) {
      continuousDriving = 0;
      splitFirstDone = false;
    } else if (splitFirstDone && currentOngoingBreak >= 30) {
      continuousDriving = 0;
      splitFirstDone = false;
    }
  }

  const continuousLimit = alertConfig.continuousMaxLimitMinutes || MAX_CONTINUOUS_DRIVE_MIN;
  const maxDailyAllowed = settings.allow10hExtensionToday ? EXTENDED_DAILY_DRIVE_MIN : STANDARD_DAILY_DRIVE_MIN;
  const remainingDaily = Math.max(0, maxDailyAllowed - dailyDriving);
  const remainingContinuous = Math.max(0, continuousLimit - continuousDriving);

  // Crew Type determination (Motorista Único vs Tripulação Múltipla / Equipa)
  const crewType: CrewType = currentShift?.crewType || settings.crewType || 'SINGLE';
  const isMultiManning = crewType === 'MULTI_MANNING';
  const shiftCycleHours = isMultiManning ? 30 : 24;

  // Shift amplitude
  let shiftElapsed = 0;
  if (shiftState === 'IN_PROGRESS') {
    shiftElapsed = shiftStartTime
      ? calculateDurationMinutes(shiftStartTime, null, now)
      : (activeLog ? calculateDurationMinutes(activeLog.startTime, null, now) : 0);
  } else if (shiftState === 'ENDED' && currentShift && currentShift.startTime && currentShift.endTime) {
    shiftElapsed = calculateDurationMinutes(currentShift.startTime, currentShift.endTime);
  } else if (shiftState === 'ENDED' && shiftStartTime) {
    const lastNonRest = [...recentLogs].reverse().find(l => l.type !== 'REST');
    if (lastNonRest && lastNonRest.endTime) {
      shiftElapsed = calculateDurationMinutes(shiftStartTime, lastNonRest.endTime);
    }
  }

  // Amplitude limits: Single Driver = 13h (regular) or 15h (reduced rest); Multi-Manning = 21h (30h cycle - 9h rest)
  let maxShiftAllowed = REGULAR_SHIFT_MAX_MIN;
  if (isMultiManning) {
    maxShiftAllowed = MULTI_MANNING_SHIFT_MAX_MIN; // 21h (1260m)
  } else if (settings.reducedDailyRestAllowedToday) {
    maxShiftAllowed = EXTENDED_SHIFT_MAX_MIN; // 15h (900m)
  }

  const dailyRestTargetMinutes = isMultiManning
    ? 540 // 9h regular na tripulação múltipla
    : (settings.reducedDailyRestAllowedToday ? 540 : 660); // 9h reduzido ou 11h regular no motorista único

  const remainingShift = Math.max(0, maxShiftAllowed - shiftElapsed);
  const isShiftAmplitudeExceeded = (shiftState === 'IN_PROGRESS' || shiftState === 'ENDED') && shiftElapsed > maxShiftAllowed;

  // Night Work Rule (Decreto-Lei n.º 237/2007 & Diretiva 2002/15/CE)
  // Se o motorista iniciar trabalho entre as 00h00 e as 05h00, o trabalho diário (condução + outro trabalho) não pode exceder 10 horas
  let isNightShift = false;
  let nightShiftStartTime: string | null = null;

  if (shiftStartTime) {
    const startHour = new Date(shiftStartTime).getHours();
    if (startHour >= 0 && startHour < 5) {
      isNightShift = true;
      nightShiftStartTime = shiftStartTime;
    }
  }

  // Also check if any non-REST activity during current operational cycle began between 00:00 and 05:00
  for (const log of recentLogs) {
    if (log.type !== 'REST') {
      const h = new Date(log.startTime).getHours();
      if (h >= 0 && h < 5) {
        isNightShift = true;
        if (!nightShiftStartTime) nightShiftStartTime = log.startTime;
      }
    }
  }

  const dailyWorkAndDriveMinutes = dailyDriving + dailyOtherWork;
  const maxNightWorkMinutes = 600; // 10h (600 min)
  const remainingNightWorkMinutes = Math.max(0, maxNightWorkMinutes - dailyWorkAndDriveMinutes);
  const isNightWorkExceeded = isNightShift && dailyWorkAndDriveMinutes > maxNightWorkMinutes;
  const nightWorkProgressPercent = Math.min(100, Math.round((dailyWorkAndDriveMinutes / maxNightWorkMinutes) * 100));

  // User-Configurable Warnings
  const urgentWarnings: string[] = [];

  // Continuous driving alerts
  if (continuousDriving > continuousLimit) {
    urgentWarnings.push(`Excesso de condução contínua: +${formatMinutes(continuousDriving - continuousLimit)} acima do limite de ${formatMinutes(continuousLimit)}! Paragem imediata obrigatória.`);
  } else if (remainingContinuous <= alertConfig.continuousWarningAdvanceMinutes && activeLog?.type === 'DRIVING') {
    urgentWarnings.push(`Aviso de condução: faltam apenas ${remainingContinuous}m para atingir o limite contínuo. Prepare a paragem.`);
  }

  // Daily driving alerts
  if (dailyDriving > maxDailyAllowed) {
    urgentWarnings.push(`Limite diário de condução excedido (+${formatMinutes(dailyDriving - maxDailyAllowed)})! Limite legal de ${formatMinutes(maxDailyAllowed)} ultrapassado.`);
  } else if (remainingDaily <= alertConfig.dailyWarningAdvanceMinutes && activeLog?.type === 'DRIVING') {
    urgentWarnings.push(`Aviso diário: restam apenas ${formatMinutes(remainingDaily)} de condução para o turno de hoje.`);
  }

  // Night work rule alerts (Início entre as 00h00 e as 05h00)
  if (isNightWorkExceeded) {
    urgentWarnings.push(`⚠️ Limite de trabalho noturno excedido (+${formatMinutes(dailyWorkAndDriveMinutes - maxNightWorkMinutes)})! Como iniciou entre as 00h00 e as 05h00, o total de condução e trabalho está limitado a 10h00 (Decreto-Lei n.º 237/2007).`);
  } else if (isNightShift && remainingNightWorkMinutes <= 30 && activeLog?.type !== 'REST') {
    urgentWarnings.push(`Aviso Noturno: restam apenas ${formatMinutes(remainingNightWorkMinutes)} de trabalho/condução para atingir o teto legal de 10h00.`);
  }

  // Shift amplitude alerts - ONLY generated when shift is active in progress!
  // When driver finishes shift and is in daily rest, NO false amplitude alerts are produced!
  if (shiftState === 'IN_PROGRESS') {
    const modeLabel = isMultiManning ? 'Tripulação Múltipla (máx 21h)' : 'Motorista Único';
    if (shiftElapsed > maxShiftAllowed) {
      urgentWarnings.push(`Amplitude máxima do turno excedida (${modeLabel}: ${formatMinutes(shiftElapsed)} decorridas / máx ${formatMinutes(maxShiftAllowed)})!`);
    } else if (remainingShift <= alertConfig.amplitudeWarningAdvanceMinutes && activeLog?.type !== 'REST') {
      urgentWarnings.push(`Aviso de amplitude (${modeLabel}): faltam ${remainingShift}m para o encerramento do turno para garantir o descanso diário.`);
    }
  }

  // Rest completion notifications
  if (alertConfig.notifyRestCompletion && activeLog?.type === 'REST') {
    if (splitFirstDone && currentOngoingBreak >= 30) {
      urgentWarnings.push(`Pausa regulamentar de 30m (2.ª fração) concluída com sucesso! Pode retomar a marcha.`);
    } else if (!splitFirstDone && currentOngoingBreak >= 45) {
      urgentWarnings.push(`Pausa completa de 45 minutos cumprida! Contador de condução zerado.`);
    } else if (!splitFirstDone && currentOngoingBreak >= 15 && currentOngoingBreak < 16) {
      urgentWarnings.push(`1.ª Fração da pausa (15m) atingida. Pode retomar marcha ou prosseguir até 45m.`);
    }
  }

  // Inter-Shift Rest Tracking (Descanso decorrente desde o fim da jornada até à próxima)
  // Períodos: 9h (diário reduzido ou regular na tripulação múltipla), 11h (diário regular motorista único), 24h (semanal reduzido), 45h (semanal regular)
  let restStartedAt: string | null = null;
  const isRestingBetweenShifts = shiftState === 'ENDED' || (!isShiftActive && activeLog?.type === 'REST');

  if (currentShift && !currentShift.isActive && currentShift.endTime) {
    restStartedAt = currentShift.endTime;
  } else if (activeLog && activeLog.type === 'REST' && !isShiftActive) {
    restStartedAt = activeLog.startTime;
  } else if (!isShiftActive && sorted.length > 0) {
    const lastLog = sorted[sorted.length - 1];
    restStartedAt = lastLog.endTime || lastLog.startTime;
  }

  let elapsedRestMinutes = 0;
  let target9hTime: string | null = null;
  let target11hTime: string | null = null;
  let target24hTime: string | null = null;
  let target45hTime: string | null = null;
  let is9hReached = false;
  let is11hReached = false;
  let is24hReached = false;
  let is45hReached = false;
  let nextRestTargetType: 'DAILY_9H' | 'DAILY_11H' | 'WEEKLY_24H' | 'WEEKLY_45H' = isMultiManning ? 'DAILY_9H' : 'DAILY_11H';
  let remainingMinutesToNextTarget = isMultiManning ? 540 : 660;

  if (restStartedAt) {
    elapsedRestMinutes = calculateDurationMinutes(restStartedAt, null, now);
    const startMs = new Date(restStartedAt).getTime();
    target9hTime = new Date(startMs + 9 * 3600 * 1000).toISOString();
    target11hTime = new Date(startMs + 11 * 3600 * 1000).toISOString();
    target24hTime = new Date(startMs + 24 * 3600 * 1000).toISOString();
    target45hTime = new Date(startMs + 45 * 3600 * 1000).toISOString();

    is9hReached = elapsedRestMinutes >= 540;
    is11hReached = elapsedRestMinutes >= 660;
    is24hReached = elapsedRestMinutes >= 1440;
    is45hReached = elapsedRestMinutes >= 2700;

    if (isMultiManning) {
      // In multi-manning, 9h is the regular daily rest target (Art. 8º nº 5)
      if (!is9hReached) {
        nextRestTargetType = 'DAILY_9H';
        remainingMinutesToNextTarget = Math.max(0, 540 - elapsedRestMinutes);
      } else if (!is24hReached) {
        nextRestTargetType = 'WEEKLY_24H';
        remainingMinutesToNextTarget = Math.max(0, 1440 - elapsedRestMinutes);
      } else {
        nextRestTargetType = 'WEEKLY_45H';
        remainingMinutesToNextTarget = Math.max(0, 2700 - elapsedRestMinutes);
      }
    } else {
      // In single driver, 11h is regular, 9h is reduced
      if (!is9hReached) {
        nextRestTargetType = 'DAILY_9H';
        remainingMinutesToNextTarget = Math.max(0, 540 - elapsedRestMinutes);
      } else if (!is11hReached) {
        nextRestTargetType = 'DAILY_11H';
        remainingMinutesToNextTarget = Math.max(0, 660 - elapsedRestMinutes);
      } else if (!is24hReached) {
        nextRestTargetType = 'WEEKLY_24H';
        remainingMinutesToNextTarget = Math.max(0, 1440 - elapsedRestMinutes);
      } else {
        nextRestTargetType = 'WEEKLY_45H';
        remainingMinutesToNextTarget = Math.max(0, 2700 - elapsedRestMinutes);
      }
    }
  }

  const interShiftRest: InterShiftRestStatus = {
    isRestingBetweenShifts,
    restStartedAt,
    elapsedRestMinutes,
    target9hTime,
    target11hTime,
    target24hTime,
    target45hTime,
    is9hReached,
    is11hReached,
    is24hReached,
    is45hReached,
    nextRestTargetType,
    remainingMinutesToNextTarget,
  };

  return {
    crewType,
    shiftCycleHours,
    dailyRestTargetMinutes,

    continuousDrivingMinutes: continuousDriving,
    remainingContinuousDrivingMinutes: remainingContinuous,
    isContinuousExceeded: continuousDriving > continuousLimit,
    continuousProgressPercent: Math.min(100, Math.round((continuousDriving / continuousLimit) * 100)),

    breakStage: splitFirstDone ? 'SPLIT_FIRST_DONE' : (continuousDriving === 0 ? 'COMPLETED' : 'NONE'),
    splitFirstBreakMinutes: splitFirstMinutes,
    currentBreakMinutes: currentOngoingBreak,

    dailyDrivingMinutes: dailyDriving,
    maxDailyDrivingAllowedMinutes: maxDailyAllowed,
    remainingDailyDrivingMinutes: remainingDaily,
    isDailyExceeded: dailyDriving > maxDailyAllowed,
    dailyProgressPercent: Math.min(100, Math.round((dailyDriving / maxDailyAllowed) * 100)),

    shiftStartTime,
    shiftElapsedMinutes: shiftElapsed,
    maxShiftAmplitudeMinutes: maxShiftAllowed,
    remainingShiftMinutes: remainingShift,
    isShiftAmplitudeExceeded,
    isShiftActive,
    shiftState,

    dailyOtherWorkMinutes: dailyOtherWork,
    dailyAvailabilityMinutes: dailyAvailability,
    dailyRestMinutes: dailyRest,

    interShiftRest,

    // Night Work
    isNightShift,
    nightShiftStartTime,
    dailyWorkAndDriveMinutes,
    maxNightWorkMinutes,
    remainingNightWorkMinutes,
    isNightWorkExceeded,
    nightWorkProgressPercent,

    warningCount: urgentWarnings.length,
    urgentWarnings,
  };
}

/**
 * Detects infringements based on EU Regulation (EC) 561/2006, Directive 2002/15/EC, and Portuguese Law (Lei n.º 27/2010 & DL 237/2007)
 */
export function detectInfringements(
  logs: ActivityLog[],
  settings: ShiftSettings,
  alertConfig: AlertSettings = defaultAlertSettings,
  currentShift?: ActiveShift | null
): Infringement[] {
  const infringements: Infringement[] = [];
  const compliance = calculateCompliance(logs, settings, alertConfig, new Date(), currentShift);
  const now = new Date();

  // 1. Continuous driving excess (Art. 7º)
  if (compliance.isContinuousExceeded) {
    const excess = compliance.continuousDrivingMinutes - alertConfig.continuousMaxLimitMinutes;
    let severity: 'MINOR' | 'SERIOUS' | 'VERY_SERIOUS' = 'MINOR';
    let fineRange = '120 € a 600 €';

    if (excess > 90) {
      severity = 'VERY_SERIOUS';
      fineRange = '1.200 € a 6.000 € (Imobilização imediata)';
    } else if (excess > 30) {
      severity = 'SERIOUS';
      fineRange = '600 € a 1.200 €';
    }

    infringements.push({
      id: 'inf-cont-drive',
      code: 'CE561_ART7_CONT',
      title: 'Excesso de Condução Contínua sem Pausa',
      description: `Conduziu ${formatMinutes(compliance.continuousDrivingMinutes)} sem cumprir pausa regulamentar (limite: ${formatMinutes(alertConfig.continuousMaxLimitMinutes)}). Excesso de ${formatMinutes(excess)}.`,
      severity,
      article: 'Artigo 7.º do Regulamento (CE) n.º 561/2006',
      timestamp: new Date().toISOString(),
      fineRangeEstimate: fineRange,
    });
  }

  // 2. Daily driving excess (Art. 6º nº 1)
  if (compliance.isDailyExceeded) {
    const excess = compliance.dailyDrivingMinutes - compliance.maxDailyDrivingAllowedMinutes;
    let severity: 'MINOR' | 'SERIOUS' | 'VERY_SERIOUS' = 'MINOR';
    let fineRange = '120 € a 600 €';

    if (excess > 120) {
      severity = 'VERY_SERIOUS';
      fineRange = '1.200 € a 6.000 €';
    } else if (excess > 60) {
      severity = 'SERIOUS';
      fineRange = '600 € a 1.200 €';
    }

    infringements.push({
      id: 'inf-daily-drive',
      code: 'CE561_ART6_DAILY',
      title: 'Excesso de Período de Condução Diária',
      description: `Total de condução hoje atingiu ${formatMinutes(compliance.dailyDrivingMinutes)} (limite autorizado: ${formatMinutes(compliance.maxDailyDrivingAllowedMinutes)}). Excesso de ${formatMinutes(excess)}.`,
      severity,
      article: 'Artigo 6.º, n.º 1 do Regulamento (CE) n.º 561/2006',
      timestamp: new Date().toISOString(),
      fineRangeEstimate: fineRange,
    });
  }

  // 3. Shift Amplitude / Daily Rest Deficit (Art. 8º)
  if (compliance.isShiftAmplitudeExceeded) {
    const excess = compliance.shiftElapsedMinutes - compliance.maxShiftAmplitudeMinutes;
    if (compliance.crewType === 'MULTI_MANNING') {
      infringements.push({
        id: 'inf-shift-amplitude-multi',
        code: 'CE561_ART8_5_AMPLITUDE_MULTI',
        title: 'Amplitude de Tripulação Múltipla Excedida (Máx 21h)',
        description: `O turno diário em tripulação múltipla atingiu ${formatMinutes(compliance.shiftElapsedMinutes)} (limite legal: 21h00), violando a obrigatoriedade de 9h ininterruptas de descanso diário dentro do ciclo de 30 horas.`,
        severity: excess > 60 ? 'VERY_SERIOUS' : 'SERIOUS',
        article: 'Artigo 8.º, n.º 5 do Regulamento (CE) n.º 561/2006 (Tripulação Múltipla)',
        timestamp: new Date().toISOString(),
        fineRangeEstimate: '600 € a 2.400 €',
      });
    } else {
      infringements.push({
        id: 'inf-shift-amplitude',
        code: 'CE561_ART8_AMPLITUDE',
        title: 'Amplitude do Turno Diário Excedida',
        description: `O turno diário ultrapassou ${formatMinutes(compliance.maxShiftAmplitudeMinutes)}, comprometendo o descanso diário obrigatório de 11h (ou 9h reduzido) dentro do ciclo de 24 horas.`,
        severity: excess > 60 ? 'VERY_SERIOUS' : 'SERIOUS',
        article: 'Artigo 8.º, n.º 2 do Regulamento (CE) n.º 561/2006 (Motorista Único)',
        timestamp: new Date().toISOString(),
        fineRangeEstimate: '600 € a 2.400 €',
      });
    }
  }

  // 4. Night Work Rule (Início entre as 00h00 e as 05h00 -> Limite 10h de Trabalho/Condução)
  if (compliance.isNightWorkExceeded) {
    const excess = compliance.dailyWorkAndDriveMinutes - compliance.maxNightWorkMinutes;
    infringements.push({
      id: 'inf-night-work',
      code: 'DL237_NIGHT_WORK_EXCESS',
      title: 'Excesso de Trabalho em Horário Noturno (Início 00h00-05h00)',
      description: `O motorista iniciou atividade em período noturno (entre as 00h00 e as 05h00). O tempo de trabalho diário acumulado (condução: ${formatMinutes(compliance.dailyDrivingMinutes)} + outro trabalho: ${formatMinutes(compliance.dailyOtherWorkMinutes)} = ${formatMinutes(compliance.dailyWorkAndDriveMinutes)}) excedeu o limite máximo imperativo de 10h00 (+${formatMinutes(excess)}).`,
      severity: excess > 60 ? 'VERY_SERIOUS' : 'SERIOUS',
      article: 'Decreto-Lei n.º 237/2007 (Art. 7.º, n.º 1) / Diretiva 2002/15/CE',
      timestamp: new Date().toISOString(),
      fineRangeEstimate: '600 € a 2.400 €',
    });
  }

  // 5. Weekly Rest Compensation Rules (Nacional vs Internacional)
  const compInfringements = detectCompensationInfringements(settings, now);
  infringements.push(...compInfringements);

  return infringements;
}
