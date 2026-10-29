import React, { useState } from 'react';
import {
  Smartphone,
  ExternalLink,
  Layers,
  X,
  ArrowRight,
  Sparkles,
  Bell,
  CheckCircle2,
  HelpCircle,
  Radio,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface WidgetHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWidget: () => void;
}

export const WidgetHelpModal: React.FC<WidgetHelpModalProps> = ({
  isOpen,
  onClose,
  onOpenWidget,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'notification' | 'pip' | 'inapp'>('shortcuts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Widgets & Controlo Rápido no Telemóvel</span>
            </h2>
            <p className="text-xs text-slate-400">
              Comutação de tarefas a 1 toque sem precisar de navegar nos menus
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'shortcuts'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            📱 Ecrã Inicial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notification')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'notification'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            🔔 Notificação
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pip')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'pip'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            🪟 Janela PiP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inapp')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'inapp'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            ⚡ No Ecrã
          </button>
        </div>

        {/* Tab 1: Android Home Screen Shortcuts (O verdadeiro widget de ecrã principal para PWAs) */}
        {activeTab === 'shortcuts' && (
          <div className="mt-4 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Como colocar os 4 Botões no Ecrã Principal do Android</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Recomendado
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Como viu na sua gravação, a app <strong>TacoPro</strong> já está instalada no seu ecrã inicial. No Android, as aplicações web progressivas (PWAs) utilizam <strong>App Shortcuts</strong> que funcionam exatamente como botões de widget individuais de 1 toque:
              </p>

              {/* Steps */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/40">1</span>
                  <div className="text-[11px] text-slate-300">
                    No seu telemóvel/tablet, <strong>mantenha o dedo pressionado (long-press)</strong> sobre o ícone do <strong>TacoPro</strong> no ecrã inicial.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/40">2</span>
                  <div className="text-[11px] text-slate-300">
                    Abre-se um menu com os 4 atalhos oficiais:
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-1 font-bold text-[11px]">
                        <span>🚗</span> Condução
                      </div>
                      <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 flex items-center gap-1 font-bold text-[11px]">
                        <span>⚒️</span> Trabalho
                      </div>
                      <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 flex items-center gap-1 font-bold text-[11px]">
                        <span>⏹️</span> Disponibilidade
                      </div>
                      <div className="p-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 flex items-center gap-1 font-bold text-[11px]">
                        <span>🛏️</span> Repouso
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/40">3</span>
                  <div className="text-[11px] text-slate-300">
                    <strong>Toque e arraste</strong> cada um desses 4 itens diretamente para o seu ecrã de início.
                    <br />
                    <span className="text-emerald-400 font-medium">Resultado: Fica com os 4 botões permanentes no ecrã como um widget de 4 botões para mudar a tarefa com 1 toque!</span>
                  </div>
                </div>
              </div>

              {/* Note on Android OS native widgets */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota Técnica:</strong> No sistema operativo Android, a secção nativa de &quot;Widgets&quot; do ecrã só aceita ficheiros nativos APK. Para aplicações web instaladas, o Google Android disponibiliza estes atalhos diretos que oferecem exatamente a mesma comodidade tátil.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Notification Drawer Widget */}
        {activeTab === 'notification' && (
          <div className="mt-4 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Widget na Barra de Notificações do Android</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  Ideal para GPS
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Quando está a conduzir com o <strong>Waze</strong>, <strong>Google Maps</strong> ou com o ecrã bloqueado, a barra de notificações do telemóvel serve de widget permanente:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>Controlador TacoPro em Segundo Plano</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">Ativo</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Basta <strong>deslizar a barra de notificações para baixo</strong> a partir do topo do ecrã, sobre qualquer aplicação:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li><strong className="text-white">|◀ Anterior:</strong> Comuta para 🚗 Condução</li>
                    <li><strong className="text-white">▶| Seguinte:</strong> Comuta para ⚒️ Outro Trabalho</li>
                    <li><strong className="text-white">⏸ Pausa:</strong> Comuta para 🛏️ Repouso / Pausa</li>
                    <li><strong className="text-white">▶ Reproduzir:</strong> Retoma 🚗 Condução</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Picture-in-Picture Floating Window */}
        {activeTab === 'pip' && (
          <div className="mt-4 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  <span>Janela PiP Flutuante Persistente</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  Atualizada
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Problema da gravação corrigido:</strong> Adicionámos um loop de renderização em segundo plano e fluxo contínuo para que a janela PiP <strong>NÃO feche quando minimiza a aplicação</strong> ou muda para o ecrã inicial!
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Na janela flutuante PiP, os controlos do reprodutor Android correspondem às tarefas do tacógrafo:
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-amber-400 font-bold">|◀ Voltar Atrás:</span> 🚗 Condução
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-amber-400 font-bold">▶| Avançar:</span> ⚒️ Outro Trabalho
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-indigo-400 font-bold">⏸ Pausa:</span> 🛏️ Repouso
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-emerald-400 font-bold">▶ Retomar:</span> 🚗 Condução
                </div>
              </div>

              {/* Document PiP Chrome flag tip */}
              <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-[10px] text-indigo-300">
                <span className="font-bold">Dica Avançada (Document PiP no Chrome):</span> Se pretender a janela flutuante com botões HTML táteis completos (🚗 ⚒️ ⏹️ 🛏️) em vez dos botões multimédia, aceda no Chrome ao endereço:
                <br />
                <code className="text-white font-mono bg-black/50 px-1 py-0.5 rounded mt-1 inline-block">chrome://flags/#document-picture-in-picture-api</code>
                <br />
                e altere para <strong>Enabled</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: In-App Widget */}
        {activeTab === 'inapp' && (
          <div className="mt-4 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Widget Flutuante no Ecrã da Aplicação</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Ativo
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                O widget flutuante no ecrã da aplicação contém uma barra superior com <strong>SÓ os 4 símbolos oficiais</strong> (🚗 ⚒️ ⏹️ 🛏️) para mudar a atividade instantaneamente sem abrir submenus.
              </p>

              <button
                type="button"
                onClick={() => {
                  onOpenWidget();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>Abrir Widget no Ecrã Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Regulamento (CE) n.º 561/2006
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
