/**
 * Types for TacoPro - Tachograph & Heavy Vehicle Driver Time Management
 * Adhering to EU Regulation (EC) No 561/2006
 */

export type ActivityType = 'DRIVING' | 'WORK' | 'AVAILABILITY' | 'REST';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  startTime: string; // ISO string
  endTime: string | null; // ISO string or null if currently ongoing
  note?: string;
  vehiclePlate?: string;
  location?: string;
  startOdometer?: number;
  endOdometer?: number;
}

export type TransportScope = 'NATIONAL' | 'INTERNATIONAL';

export interface WeeklyRestRecord {
  id: string;
  weekLabel: string; // Ex: "Semana Passada (W-1)"
  date: string; // ISO date of the weekly rest
  restType: 'REGULAR_45H' | 'REDUCED_24H';
  durationHours: number; // e.g. 24, 32, 45
  minutesOwed: number; // (45 - durationHours) * 60, e.g. 21h = 1260m
  isCompensated: boolean;
  compensatedAt?: string;
  compensationDeadline: string; // ISO date
  deadlineWeeksRemaining: number;
  notes?: string;
}

export interface CompensationSummary {
  transportScope: TransportScope;
  totalHoursOwed: number;
  totalMinutesOwed: number;
  consecutiveReducedCount: number;
  nextRestMandatoryType: 'REGULAR_45H' | 'REDUCED_ALLOWED' | 'REGULAR_PLUS_COMPENSATION';
  nextRestMinHoursRequired: number; // e.g. 45h regular, or 45h + 21h = 66h, or 45h + 42h = 87h
  hasUrgentCompensation: boolean;
  alerts: string[];
  records: WeeklyRestRecord[];
}

export type CrewType = 'SINGLE' | 'MULTI_MANNING'; // Motorista Único vs Tripulação Múltipla (Equipa)

export interface DriverProfile {
  name: string;
  driverCardNumber: string;
  vehiclePlate: string;
  companyName: string;
  country: string;
  transportScope: TransportScope; // 'NATIONAL' | 'INTERNATIONAL'
  crewType: CrewType; // 'SINGLE' | 'MULTI_MANNING'
  coDriverName?: string;
  coDriverCardNumber?: string;
  activeDriverSlot?: 1 | 2; // 1 = Condutor 1 ao volante, 2 = Condutor 2 ao volante
}

export interface ActiveShift {
  id: string;
  isActive: boolean;
  startTime: string; // ISO string when shift started
  endTime: string | null; // ISO string when shift ended
  startLocation?: string;
  endLocation?: string;
  startOdometer?: number;
  endOdometer?: number;
  startCountry?: string; // e.g. "PT"
  endCountry?: string; // e.g. "PT"
  totalDurationMinutes?: number;
  crewType?: CrewType;
}

export interface InterShiftRestStatus {
  isRestingBetweenShifts: boolean;
  restStartedAt: string | null;
  elapsedRestMinutes: number;
  target9hTime: string | null; // 9h diário reduzido (ou regular na tripulação múltipla)
  target11hTime: string | null; // 11h diário regular (motorista único)
  target24hTime: string | null; // 24h semanal reduzido
  target45hTime: string | null; // 45h semanal regular
  is9hReached: boolean;
  is11hReached: boolean;
  is24hReached: boolean;
  is45hReached: boolean;
  nextRestTargetType: 'DAILY_9H' | 'DAILY_11H' | 'WEEKLY_24H' | 'WEEKLY_45H';
  remainingMinutesToNextTarget: number;
}

export interface ShiftSettings {
  crewType: CrewType; // 'SINGLE' | 'MULTI_MANNING'
  allow10hExtensionToday: boolean;
  reducedDailyRestAllowedToday: boolean;
  extendedDrivingCountThisWeek: number; // max 2
  reducedDailyRestCountThisWeek: number; // max 3
  weeklyDrivingMinutes: number; // up to 56h = 3360
  biweeklyDrivingMinutes: number; // up to 90h = 5400
  transportScope: TransportScope; // 'NATIONAL' | 'INTERNATIONAL'
  weeklyRests: WeeklyRestRecord[];
}

/** Configurable alert thresholds for driver notifications */
export interface AlertSettings {
  continuousMaxLimitMinutes: number; // default 270 (4h30)
  continuousWarningAdvanceMinutes: number; // default 15 min (or 30, 45)
  dailyWarningAdvanceMinutes: number; // default 30 min before 9h/10h
  amplitudeWarningAdvanceMinutes: number; // default 30 min before 13h/15h ou 21h
  notifyRestCompletion: boolean; // notify when minimum mandatory rest is reached (15m, 30m, 45m, 9h, 11h)
  soundAlertsEnabled: boolean;
  visualBannersEnabled: boolean;
  browserNotificationsEnabled: boolean;
}

export type InfringementSeverity = 'MINOR' | 'SERIOUS' | 'VERY_SERIOUS';

export interface Infringement {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: InfringementSeverity;
  article: string;
  timestamp: string;
  fineRangeEstimate: string; // Estimated fine in PT/EU
}

export interface ComplianceStatus {
  // Crew Type
  crewType: CrewType;
  shiftCycleHours: number; // 24h (Single) ou 30h (Multi-Manning)
  dailyRestTargetMinutes: number; // 660m (11h) / 540m (9h)

  // Continuous Driving
  continuousDrivingMinutes: number;
  remainingContinuousDrivingMinutes: number;
  isContinuousExceeded: boolean;
  continuousProgressPercent: number;

  // Break Status
  breakStage: 'NONE' | 'SPLIT_FIRST_DONE' | 'COMPLETED';
  splitFirstBreakMinutes: number; // >= 15 min
  currentBreakMinutes: number; // current ongoing rest

  // Daily Driving
  dailyDrivingMinutes: number;
  maxDailyDrivingAllowedMinutes: number; // 540 (9h) or 600 (10h)
  remainingDailyDrivingMinutes: number;
  isDailyExceeded: boolean;
  dailyProgressPercent: number;

  // Daily Shift Amplitude
  shiftStartTime: string | null;
  shiftElapsedMinutes: number;
  maxShiftAmplitudeMinutes: number; // 13h (780m) ou 15h (900m) para motorista único, 21h (1260m) para tripulação múltipla
  remainingShiftMinutes: number;
  isShiftAmplitudeExceeded: boolean;
  isShiftActive: boolean;
  shiftState: 'IN_PROGRESS' | 'ENDED' | 'NOT_STARTED';

  // Other Work & Rest
  dailyOtherWorkMinutes: number;
  dailyAvailabilityMinutes: number;
  dailyRestMinutes: number;

  // Inter-Shift Rest Tracking (Descanso entre jornadas: 9h, 11h, 24h, 45h)
  interShiftRest: InterShiftRestStatus;

  // Night Work Rule (Diretiva 2002/15/CE & DL 237/2007: Início entre 00h00 e 05h00 -> máx 10h trabalho/condução)
  isNightShift: boolean;
  nightShiftStartTime: string | null;
  dailyWorkAndDriveMinutes: number; // Condução + Outro Trabalho
  maxNightWorkMinutes: number; // 600m (10h)
  remainingNightWorkMinutes: number;
  isNightWorkExceeded: boolean;
  nightWorkProgressPercent: number;

  // Warnings
  warningCount: number;
  urgentWarnings: string[];
}

export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface DailyReportItem {
  date: string;
  formattedDate: string;
  drivingMinutes: number;
  workMinutes: number;
  availabilityMinutes: number;
  restMinutes: number;
  kilometers: number;
  isNightShift: boolean;
  workAndDriveMinutes: number;
  violations: Infringement[];
  logsCount: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalDrivingMinutes: number;
  totalWorkMinutes: number;
  totalAvailabilityMinutes: number;
  totalRestMinutes: number;
  totalKilometers: number;
  totalShiftsCount: number;
  daysCount: number;
  dailyBreakdowns: DailyReportItem[];
  infringements: Infringement[];
  complianceRatePercent: number;
}
