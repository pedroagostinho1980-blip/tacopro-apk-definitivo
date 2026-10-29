/**
 * Realistic sample data representing a heavy truck driver's shift in Portugal / Iberia
 */

import { ActivityLog, DriverProfile, ShiftSettings } from '../types/tachograph';

export const initialDriverProfile: DriverProfile = {
  name: 'António Silva',
  driverCardNumber: 'PT-100294819-0',
  vehiclePlate: '44-ZD-82',
  companyName: 'TransIbérica Logística, S.A.',
  country: 'Portugal (PT)',
  transportScope: 'NATIONAL', // 'NATIONAL' | 'INTERNATIONAL'
  crewType: 'SINGLE', // 'SINGLE' | 'MULTI_MANNING'
  coDriverName: 'Carlos Pereira',
  coDriverCardNumber: 'PT-100481920-1',
  activeDriverSlot: 1,
};

export const initialShiftSettings: ShiftSettings = {
  crewType: 'SINGLE',
  allow10hExtensionToday: false,
  reducedDailyRestAllowedToday: false,
  extendedDrivingCountThisWeek: 1, // 1 used out of 2 allowed
  reducedDailyRestCountThisWeek: 1, // 1 used out of 3 allowed
  weeklyDrivingMinutes: 1860, // 31h out of 56h max
  biweeklyDrivingMinutes: 4140, // 69h out of 90h max
  transportScope: 'NATIONAL',
  weeklyRests: [
    {
      id: 'wr-1',
      weekLabel: 'Semana Passada (W-1)',
      date: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
      restType: 'REDUCED_24H',
      durationHours: 24,
      minutesOwed: 21 * 60, // 21h = 1260 min
      isCompensated: false,
      compensationDeadline: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      deadlineWeeksRemaining: 2,
      notes: 'Descanso semanal reduzido de 24h efetuado em plataforma logística de Leiria',
    },
  ],
};

export function getSampleShiftLogs(): ActivityLog[] {
  const now = new Date();
  
  // Create a realistic shift starting this morning around 07:00
  const d0700 = new Date(now);
  d0700.setHours(7, 0, 0, 0);

  const d0725 = new Date(now);
  d0725.setHours(7, 25, 0, 0);

  const d0940 = new Date(now);
  d0940.setHours(9, 40, 0, 0);

  const d1000 = new Date(now);
  d1000.setHours(10, 0, 0, 0);

  const d1145 = new Date(now);
  d1145.setHours(11, 45, 0, 0);

  const d1230 = new Date(now);
  d1230.setHours(12, 30, 0, 0);

  const d1415 = new Date(now);
  d1415.setHours(14, 15, 0, 0);

  return [
    {
      id: 'log-1',
      type: 'WORK',
      startTime: d0700.toISOString(),
      endTime: d0725.toISOString(),
      note: 'Verificação pré-viagem do semirreboque e tacógrafo',
      vehiclePlate: '44-ZD-82',
      location: 'Plataforma Logística da Azambuja',
      startOdometer: 412580,
      endOdometer: 412580,
    },
    {
      id: 'log-2',
      type: 'DRIVING',
      startTime: d0725.toISOString(),
      endTime: d0940.toISOString(), // 2h15m driving
      note: 'Tramo A1 Norte (Azambuja -> Leiria)',
      vehiclePlate: '44-ZD-82',
      location: 'A1 km 135',
      startOdometer: 412580,
      endOdometer: 412790,
    },
    {
      id: 'log-3',
      type: 'REST',
      startTime: d0940.toISOString(),
      endTime: d1000.toISOString(), // 20m break (qualifies as 1st part of split break: >=15m)
      note: 'Pausa 1.ª fração (20m cumpridos na área de serviço)',
      vehiclePlate: '44-ZD-82',
      location: 'Área de Serviço de Leiria (A1)',
    },
    {
      id: 'log-4',
      type: 'DRIVING',
      startTime: d1000.toISOString(),
      endTime: d1145.toISOString(), // 1h45m driving
      note: 'Tramo Leiria -> Coimbra Sul',
      vehiclePlate: '44-ZD-82',
      location: 'Coimbra',
      startOdometer: 412790,
      endOdometer: 412940,
    },
    {
      id: 'log-5',
      type: 'REST',
      startTime: d1145.toISOString(),
      endTime: d1230.toISOString(), // 45m full break (resets continuous drive clock)
      note: 'Almoço e pausa regulamentar de 45m',
      vehiclePlate: '44-ZD-82',
      location: 'Área de Repouso da Mealhada',
    },
    {
      id: 'log-6',
      type: 'DRIVING',
      startTime: d1230.toISOString(),
      endTime: d1415.toISOString(), // 1h45m driving
      note: 'Tramo Mealhada -> Porto (Freixieiro)',
      vehiclePlate: '44-ZD-82',
      location: 'Porto',
      startOdometer: 412940,
      endOdometer: 413065,
    },
    {
      id: 'log-7',
      type: 'WORK',
      startTime: d1415.toISOString(),
      endTime: null, // Currently ongoing!
      note: 'Descarga de paletes no cais 4',
      vehiclePlate: '44-ZD-82',
      location: 'Centro de Distribuição Norte',
      startOdometer: 413065,
    },
  ];
}
