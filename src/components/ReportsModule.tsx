import React, { useState } from 'react';
import {
  ActivityLog,
  DriverProfile,
  ReportPeriod,
  ReportSummary,
  ShiftSettings,
  AlertSettings,
} from '../types/tachograph';
import { generateReportSummary } from '../utils/reportEngine';
import { formatMinutes } from '../utils/rulesEngine';
import {
  FileText,
  Compass,
  Wrench,
  Clock,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  ShieldAlert,
  Gauge,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ReportsModuleProps {
  logs: ActivityLog[];
  settings: ShiftSettings;
  alertConfig: AlertSettings;
  driverProfile: DriverProfile;
  onPrintReport: (summary: ReportSummary) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  logs,
  settings,
  alertConfig,
  driverProfile,
  onPrintReport,
}) => {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('WEEKLY');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const summary = generateReportSummary(
    logs,
    selectedPeriod,
    settings,
    alertConfig,
    customStart,
    customEnd
  );

  const handleExportCSV = () => {
    const headers = ['Data', 'Condução (min)', 'Condução (hh:mm)', 'Trabalho (min)', 'Disponibilidade (min)', 'Descanso (min)', 'Km Percorridos', 'Violações'];
    const rows = summary.dailyBreakdowns.map((d) => [
      d.date,
      d.drivingMinutes,
      formatMinutes(d.drivingMinutes),
      d.workMinutes,
      d.availabilityMinutes,
      d.restMinutes,
      d.kilometers,
      `"${d.violations.map(v => v.title).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_tacografo_${selectedPeriod.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>{t('reportsModuleHeader')}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              {t('reportsSummaryTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('reportsSubtitle').replace('{0}', driverProfile.name).replace('{1}', driverProfile.vehiclePlate)}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('exportCSV')}</span>
            </button>

            <button
              onClick={() => onPrintReport(summary)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printCertificate')}</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
            {[
              { id: 'DAILY' as ReportPeriod, label: t('periodDaily') },
              { id: 'WEEKLY' as ReportPeriod, label: t('periodWeekly') },
              { id: 'MONTHLY' as ReportPeriod, label: t('periodMonthly') },
              { id: 'CUSTOM' as ReportPeriod, label: t('periodCustom') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPeriod(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedPeriod === tab.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selectedPeriod === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">{t('fromLabel')}</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <span className="text-slate-400">{t('toLabel')}</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div className="text-xs text-slate-400 font-mono">
            {t('periodLabel')} <strong className="text-slate-200">{summary.periodLabel}</strong>
          </div>
        </div>
      </div>

      {/* Aggregated Totals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Driving */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>{t('totalDrivingStat')}</span>
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {formatMinutes(summary.totalDrivingMinutes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t('wheelInPeriod')}
          </div>
        </div>

        {/* Work */}
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>{t('totalWorkStat')}</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {formatMinutes(summary.totalWorkMinutes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t('cargasDescargas')}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
            <span>{t('totalAvailabilityStat')}</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {formatMinutes(summary.totalAvailabilityMinutes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t('waitingTimes')}
          </div>
        </div>

        {/* Rest */}
        <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
            <span>{t('totalRestStat')}</span>
            <Coffee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {formatMinutes(summary.totalRestMinutes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t('breaksAndRest')}
          </div>
        </div>

        {/* Distance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{t('totalKilometersStat')}</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {summary.totalKilometers > 0 ? `${summary.totalKilometers.toLocaleString()} km` : '0 km'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {summary.totalKilometers > 0 ? t('distTraveledInPeriod') : t('noKmInPeriod')}
          </div>
        </div>

        {/* Compliance Rate */}
        <div className={`rounded-xl p-4 border ${
          summary.infringements.length === 0
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={summary.infringements.length === 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {t('complianceRateCe561')}
            </span>
            {summary.infringements.length === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {summary.complianceRatePercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t('violationsInPeriod').replace('{0}', String(summary.infringements.length))}
          </div>
        </div>
      </div>

      {/* Regulatory Violations Highlight Box */}
      {summary.infringements.length > 0 && (
        <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{t('violationsDetectedInPeriod').replace('{0}', String(summary.infringements.length))}</span>
            </div>
            <span className="text-xs font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {t('inspectionRiskBadge')}
            </span>
          </div>

          <div className="space-y-2 mt-2">
            {summary.infringements.map((inf, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-rose-400">●</span>
                    <span>{inf.title}</span>
                    <span className="text-[11px] font-mono text-slate-400">({inf.article})</span>
                  </div>
                  <div className="text-slate-300 mt-0.5 pl-3">
                    {inf.description}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3 sm:pl-0">
                  <div className="font-mono font-bold text-rose-400">
                    {t('estimatedFine')} {inf.fineRangeEstimate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-bold text-white tracking-tight mb-3">
          {t('dailyBreakdownTitle')}
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('thStart')}</th>
                <th className="py-3 px-4">{t('driving')}</th>
                <th className="py-3 px-4">{t('otherWork')}</th>
                <th className="py-3 px-4">{t('availability')}</th>
                <th className="py-3 px-4">{t('rest')}</th>
                <th className="py-3 px-4">{t('thDistance')}</th>
                <th className="py-3 px-4">{t('thLegalCompliance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {summary.dailyBreakdowns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    {t('noActivityInPeriod')}
                  </td>
                </tr>
              ) : (
                summary.dailyBreakdowns.map((day) => (
                  <tr key={day.date} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                      <div>{day.formattedDate}</div>
                      {day.isNightShift && (
                        <span className="text-[10px] text-indigo-300 font-normal font-sans flex items-center gap-1 mt-0.5">
                          <span>{t('nightStartMax10h')}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400 tabular-nums">
                      {formatMinutes(day.drivingMinutes)}
                      {day.isNightShift && (
                        <div className="text-[10px] text-slate-400 font-sans">
                          {t('totalWorkWithCap')} {formatMinutes(day.workAndDriveMinutes)}/10h
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-amber-300 tabular-nums">
                      {formatMinutes(day.workMinutes)}
                    </td>

                    <td className="py-3 px-4 font-mono text-cyan-300 tabular-nums">
                      {formatMinutes(day.availabilityMinutes)}
                    </td>

                    <td className="py-3 px-4 font-mono text-indigo-300 tabular-nums">
                      {formatMinutes(day.restMinutes)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 tabular-nums font-semibold">
                      {day.kilometers > 0 ? `${day.kilometers.toLocaleString()} km` : '0 km'}
                    </td>

                    <td className="py-3 px-4">
                      {day.violations.length === 0 ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('compliantPill')}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{t('infringementCountPill').replace('{0}', String(day.violations.length))}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
