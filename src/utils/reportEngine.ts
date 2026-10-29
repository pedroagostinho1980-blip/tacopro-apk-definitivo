/**
 * Report Generation Engine for Heavy Vehicle Drivers
 * Summarizes driving, work, availability and rest over Daily, Weekly, Monthly or Custom periods
 * Highlights regulatory violations according to EU Regulation 561/2006
 */

import {
  ActivityLog,
  DailyReportItem,
  Infringement,
  ReportPeriod,
  ReportSummary,
  ShiftSettings,
  AlertSettings,
} from '../types/tachograph';
import {
  calculateDurationMinutes,
  formatShortDate,
  defaultAlertSettings,
  STANDARD_DAILY_DRIVE_MIN,
  EXTENDED_DAILY_DRIVE_MIN,
  MAX_CONTINUOUS_DRIVE_MIN,
  REGULAR_SHIFT_MAX_MIN,
  EXTENDED_SHIFT_MAX_MIN,
  formatMinutes,
} from './rulesEngine';

export function generateReportSummary(
  logs: ActivityLog[],
  period: ReportPeriod,
  settings: ShiftSettings,
  alertConfig: AlertSettings = defaultAlertSettings,
  customStartDate?: string,
  customEndDate?: string,
  now: Date = new Date()
): ReportSummary {
  // Determine date bounds
  let startMs: number;
  let endMs: number = now.getTime();
  let periodLabel = 'Relatório';

  if (period === 'DAILY') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    endMs = endOfDay.getTime();
    periodLabel = `Diário (${formatShortDate(now.toISOString())})`;
  } else if (period === 'WEEKLY') {
    // Current fixed week (from Monday 00:00 to now)
    const d = new Date(now);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diffToMonday);
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime();
    periodLabel = `Semanal (Semana de ${formatShortDate(d.toISOString())})`;
  } else if (period === 'MONTHLY') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    startMs = d.getTime();
    periodLabel = `Mensal (${d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })})`;
  } else {
    // CUSTOM
    startMs = customStartDate ? new Date(customStartDate).getTime() : now.getTime() - 7 * 86400 * 1000;
    endMs = customEndDate ? new Date(customEndDate).getTime() + 86400 * 1000 - 1 : now.getTime();
    periodLabel = `Período Personalizado (${formatShortDate(new Date(startMs).toISOString())} a ${formatShortDate(new Date(endMs).toISOString())})`;
  }

  // Filter logs falling within the period
  const periodLogs = logs.filter((l) => {
    const t = new Date(l.startTime).getTime();
    return t >= startMs && t <= endMs;
  });

  // Group by day (YYYY-MM-DD)
  const dayGroups: { [dateStr: string]: ActivityLog[] } = {};

  for (const log of periodLogs) {
    const dateKey = log.startTime.slice(0, 10);
    if (!dayGroups[dateKey]) dayGroups[dateKey] = [];
    dayGroups[dateKey].push(log);
  }

  const allInfringements: Infringement[] = [];
  const dailyBreakdowns: DailyReportItem[] = [];

  let totalDriving = 0;
  let totalWork = 0;
  let totalAvailability = 0;
  let totalRest = 0;
  let totalKm = 0;
  let shiftsWithViolations = 0;

  // Process each day in order
  const sortedDates = Object.keys(dayGroups).sort();

  for (const dateKey of sortedDates) {
    const dayLogs = dayGroups[dateKey].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let dayDriving = 0;
    let dayWork = 0;
    let dayAvailability = 0;
    let dayRest = 0;
    let dayKm = 0;
    let sumLogKm = 0;
    const odometers: number[] = [];

    for (const log of dayLogs) {
      const dur = calculateDurationMinutes(log.startTime, log.endTime, now);
      if (log.type === 'DRIVING') dayDriving += dur;
      else if (log.type === 'WORK') dayWork += dur;
      else if (log.type === 'AVAILABILITY') dayAvailability += dur;
      else if (log.type === 'REST') dayRest += dur;

      if (typeof log.startOdometer === 'number' && typeof log.endOdometer === 'number' && log.endOdometer >= log.startOdometer) {
        sumLogKm += (log.endOdometer - log.startOdometer);
      }
      if (typeof log.startOdometer === 'number' && log.startOdometer > 0) {
        odometers.push(log.startOdometer);
      }
      if (typeof log.endOdometer === 'number' && log.endOdometer > 0) {
        odometers.push(log.endOdometer);
      }
    }

    // Determine the most accurate kilometer distance for the day:
    if (sumLogKm > 0) {
      dayKm = sumLogKm;
    } else if (odometers.length >= 2) {
      const minOdo = Math.min(...odometers);
      const maxOdo = Math.max(...odometers);
      if (maxOdo > minOdo) {
        dayKm = maxOdo - minOdo;
      }
    }

    // Fallback: If no odometers were recorded but driving occurred, calculate based on
    // standard commercial heavy vehicle operating speed (~70 km/h average)
    if (dayKm === 0 && dayDriving > 0) {
      dayKm = Math.round((dayDriving / 60) * 70);
    }

    // Check infractions for this specific day
    const dayViolations: Infringement[] = [];

    // Continuous driving check across day
    let continuous = 0;
    let splitFirst = false;

    for (const log of dayLogs) {
      const dur = calculateDurationMinutes(log.startTime, log.endTime, now);
      if (log.type === 'REST') {
        if (dur >= 45) {
          continuous = 0;
          splitFirst = false;
        } else if (!splitFirst && dur >= 15) {
          splitFirst = true;
        } else if (splitFirst && dur >= 30) {
          continuous = 0;
          splitFirst = false;
        }
      } else if (log.type === 'DRIVING') {
        continuous += dur;
        if (continuous > MAX_CONTINUOUS_DRIVE_MIN) {
          const excess = continuous - MAX_CONTINUOUS_DRIVE_MIN;
          dayViolations.push({
            id: `inf-${dateKey}-cont`,
            code: 'CE561_ART7',
            title: 'Excesso de Condução Contínua',
            description: `Atingiu ${formatMinutes(continuous)} sem pausa regulamentar de 45m (+${formatMinutes(excess)} excesso).`,
            severity: excess > 60 ? 'VERY_SERIOUS' : excess > 30 ? 'SERIOUS' : 'MINOR',
            article: 'Artigo 7.º CE 561/2006',
            timestamp: log.startTime,
            fineRangeEstimate: excess > 60 ? '1.200 € a 6.000 €' : '600 € a 1.200 €',
          });
        }
      }
    }

    // Daily driving check
    const allowedDaily = settings.allow10hExtensionToday ? EXTENDED_DAILY_DRIVE_MIN : STANDARD_DAILY_DRIVE_MIN;
    if (dayDriving > allowedDaily) {
      const excess = dayDriving - allowedDaily;
      dayViolations.push({
        id: `inf-${dateKey}-daily`,
        code: 'CE561_ART6',
        title: 'Excesso de Condução Diária',
        description: `Conduziu ${formatMinutes(dayDriving)} no turno (limite legal de ${formatMinutes(allowedDaily)}).`,
        severity: excess > 60 ? 'VERY_SERIOUS' : 'SERIOUS',
        article: 'Artigo 6.º, n.º 1 CE 561/2006',
        timestamp: dayLogs[0].startTime,
        fineRangeEstimate: excess > 60 ? '1.200 € a 6.000 €' : '600 € a 1.200 €',
      });
    }

    // Night Work check (Início entre 00h00 e 05h00 -> trabalho diário máx 10h)
    let isDayNightShift = false;
    for (const l of dayLogs) {
      if (l.type !== 'REST') {
        const h = new Date(l.startTime).getHours();
        if (h >= 0 && h < 5) {
          isDayNightShift = true;
          break;
        }
      }
    }

    const dayWorkAndDrive = dayDriving + dayWork;
    if (isDayNightShift && dayWorkAndDrive > 600) {
      const excess = dayWorkAndDrive - 600;
      dayViolations.push({
        id: `inf-${dateKey}-night`,
        code: 'DL237_NIGHT_WORK',
        title: 'Excesso de Trabalho em Horário Noturno',
        description: `Início de atividade entre as 00h00 e as 05h00. Total de trabalho diário (condução + trabalho = ${formatMinutes(dayWorkAndDrive)}) excedeu o limite legal de 10h00 (+${formatMinutes(excess)}).`,
        severity: excess > 60 ? 'VERY_SERIOUS' : 'SERIOUS',
        article: 'Decreto-Lei n.º 237/2007 (Art. 7.º, n.º 1) / Diretiva 2002/15/CE',
        timestamp: dayLogs[0].startTime,
        fineRangeEstimate: '600 € a 2.400 €',
      });
    }

    if (dayViolations.length > 0) {
      shiftsWithViolations++;
      allInfringements.push(...dayViolations);
    }

    totalDriving += dayDriving;
    totalWork += dayWork;
    totalAvailability += dayAvailability;
    totalRest += dayRest;
    totalKm += dayKm;

    dailyBreakdowns.push({
      date: dateKey,
      formattedDate: formatShortDate(new Date(dateKey).toISOString()),
      drivingMinutes: dayDriving,
      workMinutes: dayWork,
      availabilityMinutes: dayAvailability,
      restMinutes: dayRest,
      kilometers: dayKm,
      isNightShift: isDayNightShift,
      workAndDriveMinutes: dayWorkAndDrive,
      violations: dayViolations,
      logsCount: dayLogs.length,
    });
  }

  const daysCount = sortedDates.length || 1;
  const complianceRate = daysCount > 0 ? Math.max(0, Math.round(((daysCount - shiftsWithViolations) / daysCount) * 100)) : 100;

  return {
    period,
    periodLabel,
    startDate: new Date(startMs).toISOString(),
    endDate: new Date(endMs).toISOString(),
    totalDrivingMinutes: totalDriving,
    totalWorkMinutes: totalWork,
    totalAvailabilityMinutes: totalAvailability,
    totalRestMinutes: totalRest,
    totalKilometers: totalKm,
    totalShiftsCount: daysCount,
    daysCount,
    dailyBreakdowns,
    infringements: allInfringements,
    complianceRatePercent: complianceRate,
  };
}
