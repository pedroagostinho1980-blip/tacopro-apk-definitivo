import React, { useState } from 'react';
import { RotateCcw, Trash2, ShieldAlert, Sparkles, X, CheckCircle2, Clock, User, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCounters: () => void;
  onResetForFirstUse: () => void;
  onRestoreSampleData: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onResetCounters,
  onResetForFirstUse,
  onRestoreSampleData,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'COUNTERS' | 'FULL_RESET'>('COUNTERS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {t('resetModalTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('resetModalSubtitle')}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('COUNTERS')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'COUNTERS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('resetCounters')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FULL_RESET')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'FULL_RESET'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('firstUseReset')}</span>
          </button>
        </div>

        {/* Tab 1: Simplesmente reiniciar os contadores */}
        {activeTab === 'COUNTERS' && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <RotateCcw className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{t('resetCountersTabTitle')}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {t('resetCountersTabDesc')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('whatIsDone')}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{t('resetItemContinuous')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{t('resetItemDaily')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{t('resetItemBreak')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">🛡️</span>
                  <span className="text-cyan-200">{t('resetItemProfileKept')}</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetCounters();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('confirmResetCountersBtn')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Reset para Primeira Utilização (Limpeza Total) */}
        {activeTab === 'FULL_RESET' && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{t('firstUseTabTitle')}</span>
              </div>
              <p className="text-rose-200/90 leading-relaxed text-[11px]">
                {t('firstUseTabDesc')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                {t('whatWillBeDeleted')}
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                <li>{t('deleteItemAllLogs')}</li>
                <li>{t('deleteItemProfile')}</li>
                <li>{t('deleteItemSettings')}</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetForFirstUse();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('confirmFullResetBtn')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Demo Data Option & Cancel */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onRestoreSampleData();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('sampleData')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
