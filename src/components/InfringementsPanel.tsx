import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Scale,
  CheckCircle2,
  Moon,
} from 'lucide-react';
import { Infringement } from '../types/tachograph';
import { useLanguage } from '../i18n/LanguageContext';

interface InfringementsPanelProps {
  infringements: Infringement[];
}

export const InfringementsPanel: React.FC<InfringementsPanelProps> = ({ infringements }) => {
  const { t } = useLanguage();

  const getSeverityBadge = (severity: 'MINOR' | 'SERIOUS' | 'VERY_SERIOUS') => {
    switch (severity) {
      case 'MINOR':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {t('severityMinor')}
          </span>
        );
      case 'SERIOUS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
            {t('severitySerious')}
          </span>
        );
      case 'VERY_SERIOUS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            {t('severityVerySerious')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>{t('inspectionBannerTitle')}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              {t('infringementsAuditTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {t('infringementsAuditSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {infringements.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('fullyCompliantNoInfringements')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('infringementsDetectedCount').replace('{0}', String(infringements.length))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Infringements List */}
      {infringements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">
            {t('noInfringementsCurrentPeriod')}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {t('allDrivingRestCompliant')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {infringements.map((inf) => (
            <div
              key={inf.id}
              className="bg-slate-900 border border-rose-500/30 rounded-xl p-5 relative overflow-hidden shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(inf.severity)}
                    <span className="text-xs font-mono text-slate-400">
                      {inf.article}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {inf.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {inf.description}
                  </p>
                </div>

                <div className="sm:text-right shrink-0 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">{t('estimatedFine')}</div>
                  <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                    {inf.fineRangeEstimate}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Lei n.º 27/2010 (Art. 25.º)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Night Work Legal Guidance: DL 237/2007 */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Moon className="w-4 h-4" />
          <span>{t('nightWorkLawTitle')}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {t('nightWorkLawDesc')}
        </p>
        <p className="text-xs text-slate-400">
          {t('nightWorkFineWarning')}
        </p>
      </div>

      {/* Driver Protection Tip: Article 12 (Derrogação de Emergência) */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>{t('driverRightsArticle12')}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {t('driverRightsArticle12Desc')}
        </p>
        <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 pl-1">
          <li>
            {t('art12Obligatory')}
          </li>
          <li>
            {t('art12BackNote')}
          </li>
          <li>
            {t('art12Inspectors')}
          </li>
        </ul>
      </div>

      {/* Fine Reference Matrix according to European & Portuguese Law */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-bold text-white mb-3">
          {t('fineMatrixTitle')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-amber-400">{t('severityMinor')} (120 € - 600 €)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {t('fineMatrixMinor')}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-orange-400">{t('severitySerious')} (600 € - 1.200 €)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {t('fineMatrixSerious')}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-rose-400">{t('severityVerySerious')} (1.200 € - 6.000 €)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {t('fineMatrixVerySerious')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
