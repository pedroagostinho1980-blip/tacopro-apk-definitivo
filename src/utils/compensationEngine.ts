/**
 * Weekly Rest Compensations Engine conforming to EU Regulation (EC) 561/2006
 * and Mobility Package I (Regulation (EU) 2020/1054)
 * Covers National Transport vs International Transport rules
 */

import {
  CompensationSummary,
  Infringement,
  ShiftSettings,
  TransportScope,
  WeeklyRestRecord,
} from '../types/tachograph';
import { formatMinutes } from './rulesEngine';

export function calculateCompensations(
  settings: ShiftSettings,
  now: Date = new Date()
): CompensationSummary {
  const scope = settings.transportScope || 'NATIONAL';
  const records = [...(settings.weeklyRests || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let totalMinutesOwed = 0;
  let consecutiveReduced = 0;
  const alerts: string[] = [];
  let hasUrgent = false;

  // Determine consecutive reduced rests from latest records
  for (let i = records.length - 1; i >= 0; i--) {
    const rec = records[i];
    if (rec.restType === 'REDUCED_24H') {
      consecutiveReduced++;
    } else {
      break;
    }
  }

  // Calculate uncompensated hours
  const nowMs = now.getTime();
  const updatedRecords: WeeklyRestRecord[] = records.map((rec) => {
    const deadlineMs = new Date(rec.compensationDeadline).getTime();
    const diffWeeks = Math.max(0, Math.ceil((deadlineMs - nowMs) / (7 * 86400 * 1000)));

    if (!rec.isCompensated && rec.minutesOwed > 0) {
      totalMinutesOwed += rec.minutesOwed;
    }

    return {
      ...rec,
      deadlineWeeksRemaining: diffWeeks,
    };
  });

  const totalHoursOwed = Math.round((totalMinutesOwed / 60) * 10) / 10;

  // Determine next mandatory rest type
  let nextRestMandatoryType: 'REGULAR_45H' | 'REDUCED_ALLOWED' | 'REGULAR_PLUS_COMPENSATION' = 'REDUCED_ALLOWED';
  let nextRestMinHoursRequired = 45;

  if (scope === 'NATIONAL') {
    // NATIONAL RULE:
    // Only 1 reduced rest in any 2 consecutive weeks.
    // If the last rest was reduced (24h), the NEXT MUST BE 45h.
    // Compensations owed must be taken before the end of the 3rd following week.
    if (consecutiveReduced >= 1) {
      nextRestMandatoryType = 'REGULAR_45H';
      nextRestMinHoursRequired = 45;
      alerts.push(
        'Transporte Nacional: O último descanso semanal foi reduzido (24h). O próximo fim de semana tem de ser OBRIGATORIAMENTE um descanso regular de pelo menos 45 horas (Artigo 8.º, n.º 6 do Reg. 561/2006).'
      );
    } else {
      nextRestMandatoryType = 'REDUCED_ALLOWED';
      nextRestMinHoursRequired = 24;
    }

    // Check deadlines for uncompensated rests
    const uncompensated = updatedRecords.filter((r) => !r.isCompensated && r.minutesOwed > 0);
    for (const r of uncompensated) {
      const deadline = new Date(r.compensationDeadline);
      const isPastDeadline = nowMs > deadline.getTime();

      if (isPastDeadline) {
        hasUrgent = true;
        alerts.push(
          `⚠️ INFRAÇÃO: Prazo legal de compensação ultrapassado para o descanso de ${r.weekLabel} (${formatMinutes(r.minutesOwed)} em dívida). O prazo terminou ao final da 3.ª semana.`
        );
      } else if (r.deadlineWeeksRemaining <= 1) {
        hasUrgent = true;
        alerts.push(
          `⚠️ URGENTE: Última semana para compensar ${formatMinutes(r.minutesOwed)} em dívida do descanso de ${r.weekLabel}. Prazo limite: ${deadline.toLocaleDateString('pt-PT')}.`
        );
      } else {
        alerts.push(
          `Aviso de Compensação: Tem ${formatMinutes(r.minutesOwed)} a compensar antes do final da 3.ª semana (${r.deadlineWeeksRemaining} semanas restantes).`
        );
      }
    }
  } else {
    // INTERNATIONAL RULE (Pacote de Mobilidade I / Reg. (UE) 2020/1054):
    // Can take TWO consecutive reduced weekly rests (24h) outside home country.
    // BUT after 2 consecutive reduced rests:
    // MUST compensate ALL accumulated hours in block IMMEDIATELY in the very next weekly rest + 45h regular + return home/base!
    if (consecutiveReduced >= 2) {
      nextRestMandatoryType = 'REGULAR_PLUS_COMPENSATION';
      // Total required = 45h regular + all uncompensated minutes
      nextRestMinHoursRequired = 45 + Math.ceil(totalMinutesOwed / 60);
      hasUrgent = true;
      alerts.push(
        `🚨 REGRA INTERNACIONAL (2 Reduzidos Efetuados): Fez 2 descansos semanais reduzidos consecutivos! É OBRIGATÓRIO compensar todas as horas em falta (${formatMinutes(totalMinutesOwed)}) logo no próximo descanso semanal em bloco com 45h regulares (Mínimo contínuo de ${nextRestMinHoursRequired} horas) e organizar regresso à base/residência (Art. 8.º, n.º 6-B do Reg. 561/2006).`
      );
    } else if (consecutiveReduced === 1) {
      nextRestMandatoryType = 'REDUCED_ALLOWED';
      nextRestMinHoursRequired = 24;
      alerts.push(
        'Transporte Internacional: Fez 1 descanso reduzido (24h). Ainda pode efetuar um segundo descanso semanal reduzido consecutivo (desde que fora do Estado-Membro), ou fazer descanso regular de 45h.'
      );
    } else {
      nextRestMandatoryType = 'REDUCED_ALLOWED';
      nextRestMinHoursRequired = 24;
    }
  }

  return {
    transportScope: scope,
    totalHoursOwed,
    totalMinutesOwed,
    consecutiveReducedCount: consecutiveReduced,
    nextRestMandatoryType,
    nextRestMinHoursRequired,
    hasUrgentCompensation: hasUrgent,
    alerts,
    records: updatedRecords,
  };
}

export function detectCompensationInfringements(
  settings: ShiftSettings,
  now: Date = new Date()
): Infringement[] {
  const comp = calculateCompensations(settings, now);
  const infringements: Infringement[] = [];

  // 1. National transport 2 consecutive reduced rests violation
  if (comp.transportScope === 'NATIONAL' && comp.consecutiveReducedCount > 1) {
    infringements.push({
      id: 'inf-national-consecutive-reduced',
      code: 'CE561_ART8_NAT_CONSECUTIVE_REDUCED',
      title: 'Proibição de Dois Descansos Reduzidos Consecutivos (Nacional)',
      description:
        'No transporte nacional é estritamente proibido gozar dois descansos semanais reduzidos (24h) consecutivos. Após um descanso reduzido, o descanso semanal seguinte tem obrigatoriamente de ser regular de pelo menos 45 horas.',
      severity: 'VERY_SERIOUS',
      article: 'Artigo 8.º, n.º 6 do Regulamento (CE) n.º 561/2006',
      timestamp: now.toISOString(),
      fineRangeEstimate: '1.200 € a 6.000 €',
    });
  }

  // 2. Overdue compensation past 3rd week
  const overdueRecords = comp.records.filter(
    (r) => !r.isCompensated && r.minutesOwed > 0 && new Date(r.compensationDeadline).getTime() < now.getTime()
  );

  for (const r of overdueRecords) {
    infringements.push({
      id: `inf-overdue-comp-${r.id}`,
      code: 'CE561_ART8_COMP_EXPIRED',
      title: 'Incumprimento do Prazo de Compensação de Repouso Semanal',
      description: `O período de repouso semanal reduzido de ${r.weekLabel} (${r.durationHours}h) deixou ${formatMinutes(r.minutesOwed)} em falta que não foram compensadas até ao termo da 3.ª semana seguinte.`,
      severity: 'VERY_SERIOUS',
      article: 'Artigo 8.º, n.º 6 do Regulamento (CE) n.º 561/2006',
      timestamp: now.toISOString(),
      fineRangeEstimate: '1.200 € a 3.000 €',
    });
  }

  // 3. International transport 3+ consecutive reduced rests violation
  if (comp.transportScope === 'INTERNATIONAL' && comp.consecutiveReducedCount > 2) {
    infringements.push({
      id: 'inf-intl-excess-reduced',
      code: 'CE561_ART8_INTL_EXCESS_REDUCED',
      title: 'Excesso de Descansos Semanais Reduzidos no Internacional',
      description:
        'O motorista internacional pode gozar no máximo dois descansos reduzidos consecutivos de 24h fora do Estado-Membro. Realizar um 3.º descanso reduzido consecutivo constitui infração grave com obrigação de imobilização.',
      severity: 'VERY_SERIOUS',
      article: 'Artigo 8.º, n.º 6-B do Regulamento (CE) n.º 561/2006 (Pacote de Mobilidade I)',
      timestamp: now.toISOString(),
      fineRangeEstimate: '1.200 € a 6.000 €',
    });
  }

  return infringements;
}
