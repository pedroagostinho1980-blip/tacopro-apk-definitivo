import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Check,
  Plus,
  Globe,
  Truck,
  Info,
} from 'lucide-react';
import {
  ShiftSettings,
  TransportScope,
  WeeklyRestRecord,
} from '../types/tachograph';
import { calculateCompensations } from '../utils/compensationEngine';
import { formatMinutes } from '../utils/rulesEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface CompensationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShiftSettings;
  onUpdateSettings: (newSettings: ShiftSettings) => void;
}

export const CompensationManagerModal: React.FC<CompensationManagerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [isAddingRest, setIsAddingRest] = useState(false);
  const [newRestType, setNewRestType] = useState<'REGULAR_45H' | 'REDUCED_24H'>('REDUCED_24H');
  const [newRestDuration, setNewRestDuration] = useState('24');
  const [newRestWeekLabel, setNewRestWeekLabel] = useState('W-1');
  const [newRestNotes, setNewRestNotes] = useState('');

  const comp = calculateCompensations(settings);

  const handleToggleScope = (newScope: TransportScope) => {
    onUpdateSettings({
      ...settings,
      transportScope: newScope,
    });
  };

  const handleAddRest = (e: React.FormEvent) => {
    e.preventDefault();
    const durHours = parseInt(newRestDuration, 10) || 24;
    const isReduced = newRestType === 'REDUCED_24H' || durHours < 45;
    const minutesOwed = isReduced ? Math.max(0, (45 - durHours) * 60) : 0;

    const deadlineDate = new Date();
    if (settings.transportScope === 'INTERNATIONAL' && comp.consecutiveReducedCount >= 1) {
      deadlineDate.setDate(deadlineDate.getDate() + 7);
    } else {
      deadlineDate.setDate(deadlineDate.getDate() + 21);
    }

    const newRecord: WeeklyRestRecord = {
      id: `wr-${Date.now()}`,
      weekLabel: newRestWeekLabel.trim() || `W-${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      restType: isReduced ? 'REDUCED_24H' : 'REGULAR_45H',
      durationHours: durHours,
      minutesOwed,
      isCompensated: !isReduced,
      compensationDeadline: deadlineDate.toISOString(),
      deadlineWeeksRemaining: settings.transportScope === 'INTERNATIONAL' && comp.consecutiveReducedCount >= 1 ? 1 : 3,
      notes: newRestNotes.trim() || undefined,
    };

    onUpdateSettings({
      ...settings,
      weeklyRests: [...(settings.weeklyRests || []), newRecord],
    });

    setIsAddingRest(false);
    setNewRestNotes('');
  };

  const handleMarkCompensated = (recordId: string) => {
    const updated = (settings.weeklyRests || []).map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          isCompensated: true,
          compensatedAt: new Date().toISOString(),
          notes: `${r.notes ? r.notes + ' · ' : ''}${t('compensatedBadge')}`,
        };
      }
      return r;
    });

    onUpdateSettings({
      ...settings,
      weeklyRests: updated,
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    onUpdateSettings({
      ...settings,
      weeklyRests: (settings.weeklyRests || []).filter((r) => r.id !== recordId),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          <span>{t('compensations')}</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight mt-1">
          {t('compensationManagerTitle')}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t('compensationManagerSubtitle')}
        </p>

        {/* Transport Scope Switcher */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">
            {t('transportScopeLabel')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleToggleScope('NATIONAL')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                settings.transportScope === 'NATIONAL'
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className={`w-5 h-5 ${settings.transportScope === 'NATIONAL' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white">{t('nationalTransport')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    1 x 24h / 2 sem. (CE 561)
                  </div>
                </div>
              </div>
              {settings.transportScope === 'NATIONAL' && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleScope('INTERNATIONAL')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                settings.transportScope === 'INTERNATIONAL'
                  ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className={`w-5 h-5 ${settings.transportScope === 'INTERNATIONAL' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white">{t('internationalTransport')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    2 x 24h (Reg. CE 561 / Mobility)
                  </div>
                </div>
              </div>
              {settings.transportScope === 'INTERNATIONAL' && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
            </button>
          </div>
        </div>

        {/* Status KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">{t('totalToCompensateLabel')}</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${comp.totalMinutesOwed > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatMinutes(comp.totalMinutesOwed)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {comp.totalMinutesOwed > 0 ? t('toCompensate') : t('compensationsUpToDate')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">{t('reducedRestArt8')}</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${
              settings.transportScope === 'NATIONAL' && comp.consecutiveReducedCount >= 1
                ? 'text-rose-400'
                : comp.consecutiveReducedCount >= 2
                ? 'text-rose-400'
                : 'text-white'
            }`}>
              {comp.consecutiveReducedCount} {settings.transportScope === 'NATIONAL' ? '/ 1 máx.' : '/ 2 máx.'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {settings.transportScope === 'NATIONAL' ? t('nationalTransport') : t('internationalTransport')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">{t('nextWeeklyRestLabel')}</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${
              comp.nextRestMandatoryType === 'REGULAR_PLUS_COMPENSATION'
                ? 'text-rose-400'
                : comp.nextRestMandatoryType === 'REGULAR_45H'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {comp.nextRestMinHoursRequired}h mín.
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {comp.nextRestMandatoryType === 'REGULAR_PLUS_COMPENSATION'
                ? '45h + Compensação'
                : comp.nextRestMandatoryType === 'REGULAR_45H'
                ? '45h Regular'
                : '24h / 45h'}
            </div>
          </div>
        </div>

        {/* Urgent Alerts Section */}
        {comp.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {comp.alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  alert.includes('INFRAÇÃO') || alert.includes('🚨') || alert.includes('URGENTE')
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{alert}</div>
              </div>
            ))}
          </div>
        )}

        {/* History of Weekly Rests & Compensations */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {t('weeklyRestsHistory')}
            </div>
            <button
              onClick={() => setIsAddingRest(!isAddingRest)}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addRestBtn')}</span>
            </button>
          </div>

          {isAddingRest && (
            <form onSubmit={handleAddRest} className="mb-4 p-4 rounded-xl bg-slate-950 border border-slate-700 text-xs space-y-3">
              <div className="font-bold text-slate-200">{t('addRestBtn')}:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Semana / Identificação:</label>
                  <input
                    type="text"
                    required
                    value={newRestWeekLabel}
                    onChange={(e) => setNewRestWeekLabel(e.target.value)}
                    placeholder="W-1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t('thActivity')}:</label>
                  <select
                    value={newRestType}
                    onChange={(e) => {
                      const selType = e.target.value as 'REGULAR_45H' | 'REDUCED_24H';
                      setNewRestType(selType);
                      setNewRestDuration(selType === 'REGULAR_45H' ? '45' : '24');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="REDUCED_24H">{t('restWeeklyReduced24')}</option>
                    <option value="REGULAR_45H">{t('restWeeklyRegular45')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t('thDuration')} (h):</label>
                  <input
                    type="number"
                    min="24"
                    max="90"
                    value={newRestDuration}
                    onChange={(e) => setNewRestDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('thNotes')}:</label>
                <input
                  type="text"
                  value={newRestNotes}
                  onChange={(e) => setNewRestNotes(e.target.value)}
                  placeholder="Local / Observações..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRest(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  {t('saveLocation')}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {comp.records.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                {t('noWeeklyRestsRecorded')}
              </div>
            ) : (
              comp.records.map((r) => {
                const isOverdue = !r.isCompensated && r.minutesOwed > 0 && new Date(r.compensationDeadline).getTime() < Date.now();

                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOverdue
                        ? 'bg-rose-500/10 border-rose-500/40'
                        : !r.isCompensated && r.minutesOwed > 0
                        ? 'bg-slate-950 border-amber-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.weekLabel}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.restType === 'REDUCED_24H'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {r.restType === 'REDUCED_24H' ? `24h (${r.durationHours}h)` : `45h (${r.durationHours}h)`}
                        </span>
                        {r.isCompensated ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {t('compensatedBadge')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {t('uncompensatedBadge')}
                          </span>
                        )}
                      </div>

                      <div className="text-slate-400 text-[11px] mt-1">
                        {r.notes || t('noExtraNotes')} · {new Date(r.date).toLocaleDateString()}
                      </div>

                      {!r.isCompensated && r.minutesOwed > 0 && (
                        <div className="mt-1 text-[11px]">
                          <span className="text-amber-400 font-semibold font-mono">
                            {t('totalToCompensateLabel')} {formatMinutes(r.minutesOwed)}
                          </span>
                          <span className="text-slate-500 mx-1.5">·</span>
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {new Date(r.compensationDeadline).toLocaleDateString()} ({isOverdue ? 'EXPIRADO!' : `${r.deadlineWeeksRemaining} sem.`})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!r.isCompensated && r.minutesOwed > 0 && (
                        <button
                          onClick={() => handleMarkCompensated(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {t('markAsCompensatedBtn')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title={t('thActions')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mobility Package Rules Guide Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400" />
            <span>{t('mobilityGoldenRules')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-amber-400 block">{t('nationalTransport')}:</strong>
              <p>{t('nationalScopeRule')}</p>
              <p className="text-amber-300 font-medium">• {t('goldenRuleNoCabRest')}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-cyan-400 block">{t('internationalTransport')}:</strong>
              <p>{t('internationalScopeRule')}</p>
              <p className="text-cyan-300 font-medium">• {t('goldenRuleDriverReturn')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
