import React from 'react';
import { X, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { DriverProfile, ReportSummary } from '../types/tachograph';
import { formatMinutes } from '../utils/rulesEngine';

interface PrintReportProps {
  summary: ReportSummary | null;
  driverProfile: DriverProfile;
  onClose: () => void;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  summary,
  driverProfile,
  onClose,
}) => {
  if (!summary) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 flex justify-center animate-fade-in">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl p-8 sm:p-12 shadow-2xl relative my-auto">
        {/* Floating Print Bar (hidden in print) */}
        <div className="no-print absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Certificate Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="text-[11px] font-bold tracking-widest uppercase text-slate-600">
            União Europeia · Regulamento (CE) n.º 561/2006 · Lei n.º 27/2010
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-slate-950 mt-1">
            Certificado de Registo de Tempos e Atividades do Condutor
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Documento de controlo para apresentação às autoridades de fiscalização (GNR / PSP / IMT / DGT / Mossos / Euro Contrôle Route)
          </p>
        </div>

        {/* Metadata Information Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-slate-200 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Nome do Condutor</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{driverProfile.name}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">N.º Cartão de Tacógrafo</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{driverProfile.driverCardNumber}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Matrícula do Veículo</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{driverProfile.vehiclePlate} ({driverProfile.country})</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Empresa Transportadora</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{driverProfile.companyName}</div>
          </div>
        </div>

        {/* Crew & Operational Scope Bar */}
        <div className="py-2.5 px-3 bg-slate-100 rounded-lg border border-slate-200 my-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-700">Modalidade de Condução: </span>
            <span className="font-semibold text-slate-900">
              {driverProfile.crewType === 'MULTI_MANNING'
                ? `Tripulação Múltipla / Equipa (Art. 8.º, n.º 5 CE 561 · Ciclo 30h / Amplitude 21h)`
                : `Motorista Único (Art. 8.º, n.º 2 CE 561 · Ciclo 24h / Amplitude 13h-15h)`}
            </span>
          </div>
          {driverProfile.crewType === 'MULTI_MANNING' && driverProfile.coDriverName && (
            <div className="font-mono text-[11px] text-slate-800">
              Co-condutor (Slot 2): <strong>{driverProfile.coDriverName}</strong> ({driverProfile.coDriverCardNumber || 'N/A'})
            </div>
          )}
        </div>

        {/* Period Details */}
        <div className="py-3 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-700">Período Auditado: </span>
            <span className="font-semibold text-slate-900">{summary.periodLabel}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Data de Emissão: </span>
            <span className="font-mono text-slate-900">{new Date().toLocaleString('pt-PT')}</span>
          </div>
        </div>

        {/* Summary Aggregation Box */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-300">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Totais Acumulados no Período
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-2 border-r border-slate-200 last:border-none">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Condução</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {formatMinutes(summary.totalDrivingMinutes)}
              </div>
            </div>

            <div className="p-2 border-r border-slate-200 last:border-none">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Outro Trabalho</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {formatMinutes(summary.totalWorkMinutes)}
              </div>
            </div>

            <div className="p-2 border-r border-slate-200 last:border-none">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Disponibilidade</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {formatMinutes(summary.totalAvailabilityMinutes)}
              </div>
            </div>

            <div className="p-2 border-r border-slate-200 last:border-none">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Pausa / Descanso</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {formatMinutes(summary.totalRestMinutes)}
              </div>
            </div>

            <div className="p-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Quilómetros</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {summary.totalKilometers > 0 ? `${summary.totalKilometers.toLocaleString('pt-PT')} km` : '0 km'}
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Violations Audit Highlight */}
        <div className="my-6">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Auditoria de Conformidade & Violações (Reg. CE 561/2006)</span>
            <span className={`text-[11px] font-bold ${summary.infringements.length === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {summary.infringements.length === 0 ? 'Totalmente Conforme (0 Infrações)' : `${summary.infringements.length} Violação(ões) Detetada(s)`}
            </span>
          </div>

          {summary.infringements.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nenhuma contraordenação aos artigos 6.º, 7.º ou 8.º do Regulamento (CE) n.º 561/2006 detetada no período selecionado.</span>
            </div>
          ) : (
            <div className="border border-rose-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-rose-50 text-rose-900 font-bold border-b border-rose-200">
                  <tr>
                    <th className="py-2 px-3">Artigo Legal</th>
                    <th className="py-2 px-3">Gravidade</th>
                    <th className="py-2 px-3">Descrição da Não Conformidade</th>
                    <th className="py-2 px-3 text-right">Moldura da Coima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {summary.infringements.map((inf, i) => (
                    <tr key={i} className="hover:bg-rose-50/50">
                      <td className="py-2 px-3 font-mono font-semibold text-rose-950">{inf.article}</td>
                      <td className="py-2 px-3 font-bold text-rose-700">
                        {inf.severity === 'VERY_SERIOUS' ? 'MUITO GRAVE' : inf.severity === 'SERIOUS' ? 'GRAVE' : 'LEVE'}
                      </td>
                      <td className="py-2 px-3 text-slate-800">{inf.description}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-900">{inf.fineRangeEstimate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily Breakdown Table */}
        <div className="my-6">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Desdobramento Cronológico por Turno Diário
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-3">Data</th>
                <th className="py-2 px-3 text-right">Condução</th>
                <th className="py-2 px-3 text-right">Trabalho</th>
                <th className="py-2 px-3 text-right">Disponibilidade</th>
                <th className="py-2 px-3 text-right">Descanso</th>
                <th className="py-2 px-3 text-right">Km</th>
                <th className="py-2 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summary.dailyBreakdowns.map((d) => (
                <tr key={d.date}>
                  <td className="py-2 px-3 font-mono font-bold">
                    {d.formattedDate}
                    {d.isNightShift && <span className="text-[10px] text-indigo-700 block font-sans">Turno Noturno (Máx 10h)</span>}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-right">{formatMinutes(d.drivingMinutes)}</td>
                  <td className="py-2 px-3 font-mono text-right">{formatMinutes(d.workMinutes)}</td>
                  <td className="py-2 px-3 font-mono text-right">{formatMinutes(d.availabilityMinutes)}</td>
                  <td className="py-2 px-3 font-mono text-right">{formatMinutes(d.restMinutes)}</td>
                  <td className="py-2 px-3 font-mono text-right">{d.kilometers > 0 ? `${d.kilometers.toLocaleString('pt-PT')} km` : '0 km'}</td>
                  <td className="py-2 px-3 font-semibold">
                    {d.violations.length === 0 ? (
                      <span className="text-emerald-700">Conforme</span>
                    ) : (
                      <span className="text-rose-700">{d.violations.length} Infração(ões)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures & Declarations */}
        <div className="mt-10 pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="text-slate-500 font-semibold mb-10">O Condutor:</div>
            <div className="border-t border-slate-400 pt-1 text-center font-bold text-slate-800">
              {driverProfile.name}
            </div>
            <div className="text-center text-[10px] text-slate-500">Data e Assinatura</div>
          </div>

          <div>
            <div className="text-slate-500 font-semibold mb-10">Pela Empresa Transportadora:</div>
            <div className="border-t border-slate-400 pt-1 text-center font-bold text-slate-800">
              {driverProfile.companyName}
            </div>
            <div className="text-center text-[10px] text-slate-500">Carimbo e Assinatura do Responsável</div>
          </div>
        </div>
      </div>
    </div>
  );
};
