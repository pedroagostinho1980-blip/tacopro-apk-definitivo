import React, { useState, useEffect } from 'react';
import { Play, Square, MapPin, Gauge, Clock, Globe, ShieldCheck, CheckCircle2, AlertTriangle, Coffee, Users, User } from 'lucide-react';
import { ActiveShift, ActivityType, ComplianceStatus, DriverProfile, CrewType } from '../types/tachograph';
import { formatMinutes } from '../utils/rulesEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface ShiftControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'START' | 'END';
  currentShift: ActiveShift | null;
  compliance: ComplianceStatus;
  driverProfile: DriverProfile;
  onConfirmStart: (data: {
    startTime: string;
    startLocation: string;
    startCountry: string;
    startOdometer?: number;
    initialActivity: ActivityType;
    crewType: CrewType;
  }) => void;
  onConfirmEnd: (data: {
    endTime: string;
    endLocation: string;
    endCountry: string;
    endOdometer?: number;
    restType?: 'DAILY' | 'WEEKLY';
  }) => void;
}

export const ShiftControlModal: React.FC<ShiftControlModalProps> = ({
  isOpen,
  onClose,
  mode,
  currentShift,
  compliance,
  driverProfile,
  onConfirmStart,
  onConfirmEnd,
}) => {
  const { t } = useLanguage();
  const [timeStr, setTimeStr] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('Portugal (PT)');
  const [odometer, setOdometer] = useState<string>('');
  const [initialActivity, setInitialActivity] = useState<ActivityType>('WORK');
  const [crewType, setCrewType] = useState<CrewType>(driverProfile.crewType || 'SINGLE');
  const [restType, setRestType] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hh}:${mm}`);
      setLocation(mode === 'START' ? (currentShift?.startLocation || '') : (currentShift?.endLocation || ''));
      setCountry(driverProfile.country || 'Portugal (PT)');
      setOdometer('');
      setCrewType(currentShift?.crewType || driverProfile.crewType || 'SINGLE');
      setRestType('DAILY');
    }
  }, [isOpen, mode, currentShift, driverProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const targetDate = new Date(now);
    if (!isNaN(hours) && !isNaN(minutes)) {
      targetDate.setHours(hours, minutes, 0, 0);
    }
    const isoString = targetDate.toISOString();
    const odoNum = odometer ? Number(odometer) : undefined;

    if (mode === 'START') {
      onConfirmStart({
        startTime: isoString,
        startLocation: location.trim() || 'Origem não especificada',
        startCountry: country,
        startOdometer: odoNum,
        initialActivity,
        crewType,
      });
    } else {
      onConfirmEnd({
        endTime: isoString,
        endLocation: location.trim() || 'Destino / Estacionamento',
        endCountry: country,
        endOdometer: odoNum,
        restType,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            mode === 'START' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {mode === 'START' ? <Play className="w-6 h-6 fill-emerald-400" /> : <Square className="w-5 h-5 fill-rose-400" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === 'START' ? t('startShiftModalTitle') : t('endShiftModalTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'START' ? t('startShiftModalDesc') : t('endShiftModalDesc')}
            </p>
          </div>
        </div>

        {/* Informative Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          {mode === 'START' ? (
            <>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {crewType === 'MULTI_MANNING' ? t('teamShiftInfoTitle') : t('singleShiftInfoTitle')}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {crewType === 'MULTI_MANNING' ? t('teamShiftInfoDesc') : t('singleShiftInfoDesc')}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Coffee className="w-4 h-4 shrink-0" />
                <span>{t('endShiftInfoTitle')}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {t('endShiftInfoDesc')}
              </p>
              {currentShift && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300 font-mono text-[11px]">
                  <span>{t('amplitudeTraveledToday')}</span>
                  <span className="font-bold text-white">{formatMinutes(compliance.shiftElapsedMinutes)} / {formatMinutes(compliance.maxShiftAmplitudeMinutes)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Mode Selector for Crew Type (START only) */}
          {mode === 'START' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('shiftCrewModeLabel')}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCrewType('SINGLE')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    crewType !== 'MULTI_MANNING'
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('singleDriver')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t('max13h15hCycle')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCrewType('MULTI_MANNING')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    crewType === 'MULTI_MANNING'
                      ? 'bg-indigo-500/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center gap-1">
                    <span className="text-indigo-400 font-bold">👥</span>
                    <span>{t('multiManning')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t('max21hCycle')}</div>
                </button>
              </div>
            </div>
          )}
          {/* Time & Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('timeLabel')}</span>
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('countryLabel')}</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Portugal (PT)">Portugal (PT)</option>
                <option value="Espanha (ES)">España (ES)</option>
                <option value="França (FR)">France (FR)</option>
                <option value="Alemanha (DE)">Deutschland (DE)</option>
                <option value="Itália (IT)">Italia (IT)</option>
                <option value="Bélgica (BE)">Belgique (BE)</option>
                <option value="Países Baixos (NL)">Nederland (NL)</option>
                <option value="Polónia (PL)">Polska (PL)</option>
                <option value="Roménia (RO)">România (RO)</option>
              </select>
            </div>
          </div>

          {/* Location & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{mode === 'START' ? t('startLocationLabel') : t('endLocationLabel')}</span>
              </label>
              <input
                type="text"
                placeholder={mode === 'START' ? 'Ex: Azambuja, Madrid, Paris' : 'Ex: Porto, Barcelona, Lyon'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('odometerLabel')}</span>
              </label>
              <input
                type="number"
                placeholder="Ex: 412580"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Initial Activity selection (Only for START mode) */}
          {mode === 'START' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {t('initialActivityLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInitialActivity('WORK')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    initialActivity === 'WORK'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{t('otherWork')}</div>
                  <div className="text-[10px] text-slate-400">{t('workSub')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setInitialActivity('DRIVING')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    initialActivity === 'DRIVING'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{t('driving')}</div>
                  <div className="text-[10px] text-slate-400">{t('drivingSub')}</div>
                </button>
              </div>
            </div>
          )}

          {/* Mode Selector for Rest Type (END only) */}
          {mode === 'END' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('restTypeToStartLabel')}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestType('DAILY')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    restType === 'DAILY'
                      ? 'bg-indigo-500/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('dailyRestOption')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {crewType === 'MULTI_MANNING' ? '9h (Team) · 30h' : '9h / 11h'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRestType('WEEKLY')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    restType === 'WEEKLY'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('weeklyRestOption')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">24h / 45h</div>
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'START'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20'
              }`}
            >
              {mode === 'START' ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{t('confirmStartShiftBtn')}</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {t('confirmEndShiftBtn')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
