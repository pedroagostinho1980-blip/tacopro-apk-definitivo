import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface RestPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestPlannerModal: React.FC<RestPlannerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const now = new Date();
  const [startHour, setStartHour] = useState(now.getHours().toString().padStart(2, '0'));
  const [startMinute, setStartMinute] = useState(now.getMinutes().toString().padStart(2, '0'));
  const [selectedRestType, setSelectedRestType] = useState<number>(45); // in minutes
  const [addSafetyBuffer, setAddSafetyBuffer] = useState<boolean>(true); // +3 min buffer

  const restOptions = [
    {
      minutes: 15,
      label: t('pauseSplit1'),
      description: t('split1'),
      article: 'Art. 7 CE 561',
    },
    {
      minutes: 30,
      label: t('pauseSplit2'),
      description: t('split2'),
      article: 'Art. 7 CE 561',
    },
    {
      minutes: 45,
      label: t('pauseFull45'),
      description: t('fullBreak'),
      article: 'Art. 7 CE 561',
    },
    {
      minutes: 540, // 9 hours
      label: t('restDailyReduced9'),
      description: t('reducedRestArt8'),
      article: 'Art. 8, § 2',
    },
    {
      minutes: 540, // 9 hours
      label: t('restDailyTeam9'),
      description: t('teamShiftActiveNotice'),
      article: 'Art. 8, § 5',
    },
    {
      minutes: 660, // 11 hours
      label: t('restDailyRegular11'),
      description: t('standard9hRegular'),
      article: 'Art. 8, § 2',
    },
    {
      minutes: 1440, // 24 hours
      label: t('restWeeklyReduced24'),
      description: t('reducedRestArt8'),
      article: 'Art. 8, § 6',
    },
    {
      minutes: 2700, // 45 hours
      label: t('restWeeklyRegular45'),
      description: t('regularWeeklyRestTitle'),
      article: 'Art. 8, § 8',
    },
  ];

  // Calculate projected restart time
  const calculateDepartureTime = () => {
    const baseDate = new Date();
    baseDate.setHours(parseInt(startHour, 10) || 0, parseInt(startMinute, 10) || 0, 0, 0);

    const totalMinutes = selectedRestType + (addSafetyBuffer ? 3 : 0);
    const targetDate = new Date(baseDate.getTime() + totalMinutes * 60 * 1000);

    const hours = targetDate.getHours().toString().padStart(2, '0');
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    const isNextDay = targetDate.getDate() !== baseDate.getDate();

    return {
      timeStr,
      isNextDay,
      targetDate,
      totalMinutes,
    };
  };

  const plan = calculateDepartureTime();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>{t('departureAssistant')}</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight mt-1">
          {t('restPlannerTitle')}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t('restPlannerSubtitle')}
        </p>

        {/* Start time input */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">
            {t('stopStartTimeLabel')}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">
              <input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value.padStart(2, '0'))}
                className="w-10 bg-transparent text-center font-mono font-bold text-lg text-white focus:outline-none"
              />
              <span className="font-mono text-slate-400 text-lg">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value.padStart(2, '0'))}
                className="w-10 bg-transparent text-center font-mono font-bold text-lg text-white focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                const n = new Date();
                setStartHour(n.getHours().toString().padStart(2, '0'));
                setStartMinute(n.getMinutes().toString().padStart(2, '0'));
              }}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              {t('now')}
            </button>
          </div>
        </div>

        {/* Rest Types Selection */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300">
            {t('restTypeToComplyLabel')}
          </div>
          <div className="space-y-1.5">
            {restOptions.map((opt) => (
              <button
                key={opt.minutes + opt.label}
                onClick={() => setSelectedRestType(opt.minutes)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedRestType === opt.minutes
                    ? 'bg-amber-500/10 border-amber-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                    <span>{opt.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">({opt.article})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {opt.description}
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                  selectedRestType === opt.minutes
                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                    : 'border-slate-700'
                }`}>
                  {selectedRestType === opt.minutes && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Safety buffer toggle */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200">{t('safetyBufferActive')}</div>
            <div className="text-[11px] text-slate-400">
              {t('safetyBufferHint')}
            </div>
          </div>
          <input
            type="checkbox"
            checked={addSafetyBuffer}
            onChange={(e) => setAddSafetyBuffer(e.target.checked)}
            className="w-4 h-4 accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Departure Result Card */}
        <div className="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/40 text-center">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            {t('resumeDrivingAtLabel')}
          </div>
          <div className="text-4xl font-black font-mono tracking-tight text-white mt-1 tabular-nums">
            {plan.timeStr}
            {plan.isNextDay && <span className="text-sm font-sans text-amber-400 ml-2">(+1d)</span>}
          </div>
          <p className="text-xs text-slate-300 mt-2">
            {t('minMandatoryDurationLabel')}: <strong>{plan.totalMinutes} min</strong> {addSafetyBuffer ? `(${t('safetyBufferActive')})` : ''}
          </p>

          {plan.targetDate.getHours() >= 0 && plan.targetDate.getHours() < 5 && (
            <div className="mt-3 p-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-[11px] text-indigo-200 text-left">
              <strong>🌙 {t('nightWorkActive')}:</strong> {t('nightWorkNotice')}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            {t('closeAssistant')}
          </button>
        </div>
      </div>
    </div>
  );
};
