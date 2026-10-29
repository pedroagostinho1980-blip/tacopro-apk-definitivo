import React, { useState } from 'react';
import {
  ActivityLog,
  ActivityType,
} from '../types/tachograph';
import {
  formatMinutes,
  formatTimeHHMM,
  formatShortDate,
  calculateDurationMinutes,
} from '../utils/rulesEngine';
import {
  Plus,
  Download,
  Printer,
  Trash2,
  Edit2,
  Search,
  Compass,
  Wrench,
  Clock,
  Coffee,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LogbookTableProps {
  logs: ActivityLog[];
  onOpenManualEntry: () => void;
  onEditLog: (log: ActivityLog) => void;
  onDeleteLog: (id: string) => void;
  onPrintReport: () => void;
  onLoadSample: () => void;
  onClearAll: () => void;
}

export const LogbookTable: React.FC<LogbookTableProps> = ({
  logs,
  onOpenManualEntry,
  onEditLog,
  onDeleteLog,
  onPrintReport,
  onLoadSample,
  onClearAll,
}) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const sorted = [...logs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const filtered = sorted.filter((log) => {
    if (filterType !== 'ALL' && log.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = log.note?.toLowerCase().includes(q);
      const matchLoc = log.location?.toLowerCase().includes(q);
      const matchPlate = log.vehiclePlate?.toLowerCase().includes(q);
      if (!matchNote && !matchLoc && !matchPlate) return false;
    }
    return true;
  });

  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'DRIVING':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>{t('driving')}</span>
          </span>
        );
      case 'WORK':
        return (
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>{t('otherWork')}</span>
          </span>
        );
      case 'AVAILABILITY':
        return (
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('availability')}</span>
          </span>
        );
      case 'REST':
        return (
          <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Coffee className="w-3.5 h-3.5" />
            <span>{t('rest')}</span>
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Atividade', 'Data Início', 'Hora Início', 'Hora Fim', 'Duração (min)', 'Localização', 'Matrícula', 'Km Início', 'Km Fim', 'Observações'];
    const rows = sorted.map((l) => [
      l.id,
      l.type,
      formatShortDate(l.startTime),
      formatTimeHHMM(l.startTime),
      l.endTime ? formatTimeHHMM(l.endTime) : 'Em curso',
      calculateDurationMinutes(l.startTime, l.endTime, now),
      `"${l.location || ''}"`,
      l.vehiclePlate || '',
      l.startOdometer || '',
      l.endOdometer || '',
      `"${(l.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tacografo_registos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {t('logbookTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('logbookSubtitle').replace('{0}', String(sorted.length))}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenManualEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addRecordBtn')}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
            title="CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCSV')}</span>
          </button>

          <button
            onClick={onPrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          {[
            { id: 'ALL', label: t('allFilter') },
            { id: 'DRIVING', label: t('driving') },
            { id: 'WORK', label: t('otherWork') },
            { id: 'AVAILABILITY', label: t('availability') },
            { id: 'REST', label: t('rest') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterType === f.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-4">{t('thActivity')}</th>
              <th className="py-3 px-4">{t('thStart')}</th>
              <th className="py-3 px-4">{t('thEnd')}</th>
              <th className="py-3 px-4 text-right">{t('thDuration')}</th>
              <th className="py-3 px-4">{t('thLocationKm')}</th>
              <th className="py-3 px-4">{t('thNotes')}</th>
              <th className="py-3 px-4 text-right">{t('thActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <div className="space-y-2">
                    <p>{t('noRecordsFound')}</p>
                    <button
                      onClick={onLoadSample}
                      className="text-amber-400 hover:underline text-xs font-semibold cursor-pointer"
                    >
                      {t('loadDemoShift')}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const isOngoing = !log.endTime;
                const duration = calculateDurationMinutes(log.startTime, log.endTime, now);

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isOngoing ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActivityBadge(log.type)}
                      {isOngoing && (
                        <span className="text-[10px] text-amber-400 font-bold ml-1 font-mono">
                          {t('inProgressBadge')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      <div>{formatTimeHHMM(log.startTime)}</div>
                      <div className="text-[10px] text-slate-400">{formatShortDate(log.startTime)}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {isOngoing ? (
                        <span className="text-amber-400 font-semibold">{t('activeBadge')}</span>
                      ) : (
                        <div>
                          <div>{formatTimeHHMM(log.endTime!)}</div>
                          <div className="text-[10px] text-slate-400">{formatShortDate(log.endTime!)}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white text-right tabular-nums whitespace-nowrap">
                      {formatMinutes(duration)}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div>{log.location || '—'}</div>
                      {log.startOdometer && (
                        <div className="text-[10px] font-mono text-slate-400">
                          Km: {log.startOdometer} {log.endOdometer ? `→ ${log.endOdometer} (+${log.endOdometer - log.startOdometer} km)` : ''}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {log.note || '—'}
                      {log.vehiclePlate && (
                        <span className="text-slate-400 text-[10px] ml-1 font-mono">
                          [{log.vehiclePlate}]
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditLog(log)}
                          title="Editar registo"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          title="Eliminar registo"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>TacoPro · CE 561 / 2006</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('loadDemoShift')}</span>
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={onClearAll}
            className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            {t('reset')}
          </button>
        </div>
      </div>
    </div>
  );
};
