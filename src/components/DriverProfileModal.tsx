import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { DriverProfile } from '../types/tachograph';
import { useLanguage } from '../i18n/LanguageContext';

interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DriverProfile;
  onSave: (profile: DriverProfile) => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [form, setForm] = useState<DriverProfile>({ ...profile });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <User className="w-4 h-4" />
          <span>{t('driverProfileTag')}</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight mt-1">
          {t('driverProfileTitle')}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t('driverProfileSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {t('driverNameLabel')}
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {t('driverCardNumLabel')}
            </label>
            <input
              type="text"
              required
              placeholder="Ex: PT-100294819-0"
              value={form.driverCardNumber}
              onChange={(e) => setForm({ ...form, driverCardNumber: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('vehiclePlateLabel')}
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 44-ZD-82"
                value={form.vehiclePlate}
                onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('countryOfRegistrationLabel')}
              </label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {t('companyNameLabel')}
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              {t('usualCrewTypeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, crewType: 'SINGLE' })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  form.crewType !== 'MULTI_MANNING'
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('singleDriver')}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t('max13h15hCycle')}</div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, crewType: 'MULTI_MANNING' })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  form.crewType === 'MULTI_MANNING'
                    ? 'bg-indigo-500/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span className="text-indigo-400 font-bold">👥</span>
                  <span>{t('multiManning')}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t('max21hCycle')}</div>
              </button>
            </div>
          </div>

          {/* Co-driver fields if Multi-Manning */}
          {form.crewType === 'MULTI_MANNING' && (
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                <span>{t('teamShiftInfoTitle')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nome do 2.º Motorista:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Pereira"
                    value={form.coDriverName || ''}
                    onChange={(e) => setForm({ ...form, coDriverName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    N.º Cartão Condutor 2:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PT-100481920-1"
                    value={form.coDriverCardNumber || ''}
                    onChange={(e) => setForm({ ...form, coDriverCardNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                {t('teamShiftInfoDesc')}
              </p>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              {t('usualScopeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, transportScope: 'NATIONAL' })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  form.transportScope === 'NATIONAL'
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs text-white">{t('nationalTransport')}</div>
                <div className="text-[10px] text-slate-400">1 x 24h / 2 sem.</div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, transportScope: 'INTERNATIONAL' })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  form.transportScope === 'INTERNATIONAL'
                    ? 'bg-cyan-500/20 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs text-white">{t('internationalTransport')}</div>
                <div className="text-[10px] text-slate-400">2 x 24h seguidos</div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors cursor-pointer"
            >
              {t('saveProfileBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
