import React, { useState } from 'react';
import { X, Sliders, Play } from 'lucide-react';
import { AlertSettings } from '../types/tachograph';
import { playAlertTone } from '../utils/soundAlerts';
import { useLanguage } from '../i18n/LanguageContext';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSave: (newSettings: AlertSettings) => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [form, setForm] = useState<AlertSettings>({ ...settings });
  const [browserNoticeState, setBrowserNoticeState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleRequestNotification = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setBrowserNoticeState(perm);
      if (perm === 'granted') {
        setForm(prev => ({ ...prev, browserNotificationsEnabled: true }));
      }
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    onSave(form);
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

        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <Sliders className="w-4 h-4" />
          <span>{t('alertSettingsTag')}</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight mt-1">
          {t('alertSettingsTitle')}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t('alertSettingsSubtitle')}
        </p>

        <div className="mt-5 space-y-4 text-xs">
          {/* Section 1: Continuous Driving Thresholds */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>{t('continuousDriving')}:</span>
              <span className="text-amber-400 font-mono font-bold">
                {Math.floor(form.continuousMaxLimitMinutes / 60)}h {(form.continuousMaxLimitMinutes % 60).toString().padStart(2, '0')}m
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 270, label: '4h 30m (CE 561)' },
                { min: 255, label: '4h 15m' },
                { min: 240, label: '4h 00m' },
              ].map((opt) => (
                <button
                  key={opt.min}
                  type="button"
                  onClick={() => setForm({ ...form, continuousMaxLimitMinutes: opt.min })}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    form.continuousMaxLimitMinutes === opt.min
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-slate-300 font-medium mb-1.5">
                {t('advanceWarningLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 15, label: t('minutesBeforeLimit').replace('{0}', '15') },
                  { min: 30, label: t('minutesBeforeLimit').replace('{0}', '30') },
                  { min: 45, label: t('minutesBeforeLimit').replace('{0}', '45') },
                ].map((opt) => (
                  <button
                    key={opt.min}
                    type="button"
                    onClick={() => setForm({ ...form, continuousWarningAdvanceMinutes: opt.min })}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                      form.continuousWarningAdvanceMinutes === opt.min
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Daily Driving & Shift Amplitude Warning Advance */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="font-semibold text-slate-200">
              {t('dailyDriving')} & {t('pillar3ShiftRest')}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                {t('dailyDriving')} (9h / 10h):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 15, label: t('minutesBeforeLimit').replace('{0}', '15') },
                  { min: 30, label: t('minutesBeforeLimit').replace('{0}', '30') },
                  { min: 60, label: '60 min' },
                ].map((opt) => (
                  <button
                    key={opt.min}
                    type="button"
                    onClick={() => setForm({ ...form, dailyWarningAdvanceMinutes: opt.min })}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                      form.dailyWarningAdvanceMinutes === opt.min
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-slate-300 font-medium mb-1.5">
                {t('shiftAmplitudeWarningLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 15, label: t('minutesBeforeLimit').replace('{0}', '15') },
                  { min: 30, label: t('minutesBeforeLimit').replace('{0}', '30') },
                  { min: 60, label: '60 min' },
                ].map((opt) => (
                  <button
                    key={opt.min}
                    type="button"
                    onClick={() => setForm({ ...form, amplitudeWarningAdvanceMinutes: opt.min })}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                      form.amplitudeWarningAdvanceMinutes === opt.min
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Rest Milestones & Audio Alerts */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="font-semibold text-slate-200">
              {t('soundSectionTitle')}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">{t('breakControl')}</div>
                <div className="text-[11px] text-slate-400">
                  15m, 30m, 45m, 9h, 11h
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.notifyRestCompletion}
                onChange={(e) => setForm({ ...form, notifyRestCompletion: e.target.checked })}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">{t('soundToggleDesc')}</div>
                <div className="text-[11px] text-slate-400">
                  {t('soundAlerts')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playAlertTone('WARNING')}
                  title={t('testAlertSoundBtn')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>{t('testAlertSoundBtn')}</span>
                </button>
                <input
                  type="checkbox"
                  checked={form.soundAlertsEnabled}
                  onChange={(e) => setForm({ ...form, soundAlertsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">{t('browserNotificationsTitle')}</div>
                <div className="text-[11px] text-slate-400">
                  {browserNoticeState === 'granted'
                    ? 'OK ✓'
                    : t('browserNotificationsDesc')}
                </div>
              </div>
              {browserNoticeState === 'granted' ? (
                <input
                  type="checkbox"
                  checked={form.browserNotificationsEnabled}
                  onChange={(e) => setForm({ ...form, browserNotificationsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[11px] cursor-pointer"
                >
                  {t('enableNotificationsBtn')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            {t('saveAlertSettingsBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
