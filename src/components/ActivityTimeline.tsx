import React, { useState } from 'react';
import {
  ActivityLog,
  ActivityType,
} from '../types/tachograph';
import {
  formatMinutes,
  formatTimeHHMM,
  calculateDurationMinutes,
} from '../utils/rulesEngine';
import { Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ActivityTimelineProps {
  logs: ActivityLog[];
  onSelectLog?: (log: ActivityLog) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs, onSelectLog }) => {
  const { t } = useLanguage();
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Group logs by day or sort for current day display
  const now = new Date();
  const sorted = [...logs].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Helper to get minute of day (0 to 1440)
  const getMinuteOfDay = (isoString: string): number => {
    const d = new Date(isoString);
    return d.getHours() * 60 + d.getMinutes();
  };

  const getActivityStyle = (type: ActivityType) => {
    switch (type) {
      case 'DRIVING':
        return {
          bg: 'bg-emerald-500 hover:bg-emerald-400',
          border: 'border-emerald-400',
          text: 'text-emerald-400',
          label: t('driving'),
          icon: '🚗',
        };
      case 'WORK':
        return {
          bg: 'bg-amber-500 hover:bg-amber-400',
          border: 'border-amber-400',
          text: 'text-amber-400',
          label: t('otherWork'),
          icon: '⚒️',
        };
      case 'AVAILABILITY':
        return {
          bg: 'bg-cyan-500 hover:bg-cyan-400',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          label: t('availability'),
          icon: '⏹️',
        };
      case 'REST':
        return {
          bg: 'bg-indigo-500 hover:bg-indigo-400',
          border: 'border-indigo-400',
          text: 'text-indigo-400',
          label: t('rest'),
          icon: '🛏️',
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {t('timelineTitle')}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('timelineSubtitle')}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">{t('driving')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-slate-300">{t('otherWork')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-500" />
            <span className="text-slate-300">{t('availability')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span className="text-slate-300">{t('rest')}</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Ribbon */}
      <div className="mt-6">
        {/* Hour markers row */}
        <div className="relative h-6 text-[10px] font-mono text-slate-400 select-none border-b border-slate-800">
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((hour) => {
            const leftPercent = (hour / 24) * 100;
            return (
              <div
                key={hour}
                className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPercent}%` }}
              >
                <span>{hour.toString().padStart(2, '0')}h</span>
                <div className="w-px h-1.5 bg-slate-700 mt-0.5" />
              </div>
            );
          })}
        </div>

        {/* The Graphic Ribbon Strip */}
        <div className="relative h-14 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden mt-1 shadow-inner">
          {/* Subtle grid lines every 2 hours */}
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((hour) => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 w-px bg-slate-900 pointer-events-none"
              style={{ left: `${(hour / 24) * 100}%` }}
            />
          ))}

          {/* Activity blocks */}
          {sorted.map((log) => {
            const startMin = getMinuteOfDay(log.startTime);
            const durationMin = calculateDurationMinutes(log.startTime, log.endTime, now);
            const leftPercent = (startMin / 1440) * 100;
            const widthPercent = Math.max(0.6, (durationMin / 1440) * 100);
            const style = getActivityStyle(log.type);

            return (
              <button
                key={log.id}
                onClick={() => {
                  setSelectedLog(log);
                  if (onSelectLog) onSelectLog(log);
                }}
                title={`${style.label}: ${formatTimeHHMM(log.startTime)} - ${log.endTime ? formatTimeHHMM(log.endTime) : t('now')} (${formatMinutes(durationMin)})`}
                className={`absolute top-1 bottom-1 rounded-sm transition-all cursor-pointer ${style.bg} ${
                  selectedLog?.id === log.id ? 'ring-2 ring-white z-10' : 'opacity-90 hover:opacity-100'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                {widthPercent > 4 && (
                  <span className="text-[10px] text-slate-950 font-bold px-1 truncate block text-left">
                    {style.icon} {formatMinutes(durationMin)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>{t('startOfDay')}</span>
          <span>{t('tapBlockHint')}</span>
          <span>{t('endOfDay')}</span>
        </div>
      </div>

      {/* Selected Block Inspector */}
      {selectedLog && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {getActivityStyle(selectedLog.type).icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${getActivityStyle(selectedLog.type).text}`}>
                  {getActivityStyle(selectedLog.type).label}
                </span>
                <span className="text-slate-400 font-mono">
                  {formatTimeHHMM(selectedLog.startTime)} &rarr; {selectedLog.endTime ? formatTimeHHMM(selectedLog.endTime) : t('now')}
                </span>
                <span className="text-slate-400 font-bold font-mono">
                  ({formatMinutes(calculateDurationMinutes(selectedLog.startTime, selectedLog.endTime, now))})
                </span>
              </div>
              <div className="text-slate-300 mt-0.5">
                {selectedLog.note || t('noExtraNotes')}
                {selectedLog.location ? ` · ${selectedLog.location}` : ''}
                {selectedLog.vehiclePlate ? ` · ${t('licensePlate')}: ${selectedLog.vehiclePlate}` : ''}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedLog(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors self-end sm:self-center cursor-pointer"
          >
            {t('closeDetails')}
          </button>
        </div>
      )}
    </div>
  );
};
