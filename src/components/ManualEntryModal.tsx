import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ActivityLog, ActivityType } from '../types/tachograph';
import { useLanguage } from '../i18n/LanguageContext';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<ActivityLog>) => void;
  editingLog?: ActivityLog | null;
  defaultPlate: string;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLog,
  defaultPlate,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [type, setType] = useState<ActivityType>('DRIVING');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isOngoing, setIsOngoing] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState(defaultPlate);
  const [location, setLocation] = useState('');
  const [startOdometer, setStartOdometer] = useState<string>('');
  const [endOdometer, setEndOdometer] = useState<string>('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingLog) {
      setType(editingLog.type);
      const start = new Date(editingLog.startTime);
      setStartDate(start.toISOString().slice(0, 10));
      setStartTime(start.toTimeString().slice(0, 5));

      if (editingLog.endTime) {
        const end = new Date(editingLog.endTime);
        setEndDate(end.toISOString().slice(0, 10));
        setEndTime(end.toTimeString().slice(0, 5));
        setIsOngoing(false);
      } else {
        setIsOngoing(true);
        setEndDate('');
        setEndTime('');
      }

      setVehiclePlate(editingLog.vehiclePlate || defaultPlate);
      setLocation(editingLog.location || '');
      setStartOdometer(editingLog.startOdometer ? String(editingLog.startOdometer) : '');
      setEndOdometer(editingLog.endOdometer ? String(editingLog.endOdometer) : '');
      setNote(editingLog.note || '');
    } else {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      setStartDate(oneHourAgo.toISOString().slice(0, 10));
      setStartTime(oneHourAgo.toTimeString().slice(0, 5));
      setEndDate(now.toISOString().slice(0, 10));
      setEndTime(now.toTimeString().slice(0, 5));
      setIsOngoing(false);
      setVehiclePlate(defaultPlate);
      setLocation('');
      setStartOdometer('');
      setEndOdometer('');
      setNote('');
    }
    setErrorMsg('');
  }, [editingLog, defaultPlate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!startDate || !startTime) {
      setErrorMsg('Data/Hora de início obrigatória.');
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    let endISO: string | null = null;

    if (!isOngoing) {
      if (!endDate || !endTime) {
        setErrorMsg('Data/Hora de fim obrigatória.');
        return;
      }
      endISO = new Date(`${endDate}T${endTime}:00`).toISOString();

      if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
        setErrorMsg('Hora de fim tem de ser posterior à hora de início.');
        return;
      }
    }

    const startKm = startOdometer.trim() ? parseInt(startOdometer, 10) : undefined;
    const endKm = endOdometer.trim() ? parseInt(endOdometer, 10) : undefined;

    if (startKm && endKm && endKm < startKm) {
      setErrorMsg('Odómetro final não pode ser inferior ao inicial.');
      return;
    }

    onSave({
      id: editingLog ? editingLog.id : `log-${Date.now()}`,
      type,
      startTime: startISO,
      endTime: endISO,
      vehiclePlate: vehiclePlate.trim() || undefined,
      location: location.trim() || undefined,
      startOdometer: startKm,
      endOdometer: endKm,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white tracking-tight">
          {editingLog ? t('editEntryTitle') : t('manualEntryTitle')}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t('manualEntrySubtitle')}
        </p>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Activity Type Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              {t('activityTypeLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'DRIVING' as ActivityType, label: t('driving'), icon: '🚗' },
                { type: 'WORK' as ActivityType, label: t('otherWork'), icon: '⚒️' },
                { type: 'AVAILABILITY' as ActivityType, label: t('availability'), icon: '⏹️' },
                { type: 'REST' as ActivityType, label: t('rest'), icon: '🛏️' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setType(item.type)}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    type === item.type
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-base">{item.icon}</div>
                  <div className="text-[11px] mt-0.5">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('thStart')} (Data):
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('thStart')} (Hora):
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Ongoing toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ongoing"
              checked={isOngoing}
              onChange={(e) => setIsOngoing(e.target.checked)}
              className="accent-amber-400 cursor-pointer w-4 h-4"
            />
            <label htmlFor="ongoing" className="text-slate-300 font-medium cursor-pointer">
              {t('ongoingActivityCheckbox')}
            </label>
          </div>

          {/* End Date & Time */}
          {!isOngoing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('thEnd')} (Data):
                </label>
                <input
                  type="date"
                  required={!isOngoing}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('thEnd')} (Hora):
                </label>
                <input
                  type="time"
                  required={!isOngoing}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Plate & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('plateLabel')}
              </label>
              <input
                type="text"
                placeholder="44-ZD-82"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('locationLabel')}
              </label>
              <input
                type="text"
                placeholder="Lisboa"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Odometers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('startKmLabel')}
              </label>
              <input
                type="number"
                placeholder="412580"
                value={startOdometer}
                onChange={(e) => setStartOdometer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('endKmLabel')}
              </label>
              <input
                type="number"
                placeholder="412790"
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {t('notesJustificationLabel')}
            </label>
            <textarea
              rows={2}
              placeholder="Notas..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors cursor-pointer"
            >
              {editingLog ? t('saveLocation') : t('saveManualEntryBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
