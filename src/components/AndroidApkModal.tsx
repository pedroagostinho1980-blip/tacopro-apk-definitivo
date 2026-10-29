import React, { useState } from 'react';
import {
  Smartphone,
  Layers,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Terminal,
  Cpu,
  Copy,
  Check,
  Download,
  FolderGit2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [activeTab, setActiveTab] = useState<'newRepo' | 'overview' | 'cloud' | 'studio'>('newRepo');

  if (!isOpen) return null;

  const copyBuildCommands = () => {
    navigator.clipboard.writeText('npm run build && npx cap sync android && cd android && ./gradlew assembleDebug');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyGitCommands = () => {
    navigator.clipboard.writeText(`git init\ngit add .\ngit commit -m "Inicio limpo TacoPro APK com Widget"\ngit branch -M main\ngit remote add origin https://github.com/SEU_UTILIZADOR/SEU_NOVO_REPOSITORIO.git\ngit push -u origin main`);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Aplicação Definitiva Android (APK)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                Projeto Criado
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Widget Nativo Real do Android (4 Símbolos), Serviço Contínuo e Sobreposição GPS
            </p>
          </div>
        </div>

        {/* Direct Download Banner for the clean ZIP project */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pacote Limpo do Projeto (.ZIP) Pronto a Descarregar</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">0.67 MB</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Inclui código limpo, pasta <code>/android</code> com o widget nativo, ícones e <code>.github/workflows</code>.
            </div>
          </div>
          <a
            href="/tacopro-project.zip"
            download="tacopro-project.zip"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Descarregar Projeto (.ZIP)</span>
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('newRepo')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'newRepo'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🚀 Novo Repositório
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'cloud'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☁️ GitHub Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⭐ O que foi Criado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'studio'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💻 Android Studio
          </button>
        </div>

        {/* Tab: New Repository Step by Step */}
        {activeTab === 'newRepo' && (
          <div className="mt-5 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-amber-400" />
                  <span>Passo a Passo para Criar Novo Repositório no GitHub</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Sem Erros
                </span>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <strong className="text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">1</span>
                    Descarregue e extraia o arquivo limpo:
                  </strong>
                  <p className="text-slate-400 pl-7">
                    Clique no botão verde acima <strong>&quot;Descarregar Projeto (.ZIP)&quot;</strong> e extraia a pasta no seu computador.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <strong className="text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
                    Crie um novo repositório vazio no GitHub:
                  </strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-7 text-[11px]">
                    <li>Aceda a <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono">github.com/new</a></li>
                    <li>Escolha o nome (ex.: <code>tacopro-app</code>).</li>
                    <li><strong className="text-amber-300">IMPORTANTE:</strong> Deixe tudo desmarcado (NÃO adicione README, NÃO adicione .gitignore, NÃO adicione licença). O repositório deve ficar 100% vazio.</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">3</span>
                      Abra o terminal na pasta extraída e execute estes 5 comandos:
                    </strong>
                    <button
                      type="button"
                      onClick={copyGitCommands}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedGit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedGit ? 'Copiado!' : 'Copiar Comandos'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded bg-black/70 text-emerald-300 font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
{`git init
git add .
git commit -m "Inicio limpo TacoPro APK com Widget"
git branch -M main
git remote add origin https://github.com/SEU_UTILIZADOR/SEU_NOVO_REPOSITORIO.git
git push -u origin main`}
                  </pre>
                  <p className="text-[10px] text-slate-400 pl-7">
                    <em>(Substitua <code>SEU_UTILIZADOR/SEU_NOVO_REPOSITORIO</code> pelo link do seu repositório novo que o GitHub mostra na página).</em>
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                  <strong className="text-emerald-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">4</span>
                    O GitHub Actions compila o APK sozinho:
                  </strong>
                  <p className="text-emerald-300/80 pl-7 text-[11px]">
                    Assim que o <code>git push</code> terminar, o GitHub deteta o ficheiro <code>.github/workflows/build-apk.yml</code> e inicia a compilação. Em cerca de 2 minutos, o seu APK com o Widget nativo fica pronto na aba <strong>Actions</strong>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="mt-5 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Widget do Sistema</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ficheiro <code>TacoProAppWidgetProvider</code> com os 4 botões táteis (🚗 ⚒️ ⏹️ 🛏️) e contador no ecrã inicial do Android.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Foreground Service</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Serviço nativo permanente com notificação ininterrupta que a gestão de bateria do Android nunca fecha.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Sobreposição GPS</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Permissão <code>SYSTEM_ALERT_WINDOW</code> para bolha flutuante real fixa sobre o Waze e Google Maps.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Arquitetura Nativa Concluída no Repositório:</span>
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>/capacitor.config.ts:</strong> Configuração oficial de empacotamento nativo.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>/android/app/src/main/AndroidManifest.xml:</strong> Permissões nativas configuradas.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>/android/app/src/main/res/layout/tacopro_widget_layout.xml:</strong> Desenho tátil do widget.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>/android/.../TacoProAppWidgetProvider.java:</strong> Resposta imediata ao toque dos 4 símbolos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>/ANDROID_BUILD_GUIDE.md:</strong> Manual completo passo a passo.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Android Studio Build */}
        {activeTab === 'studio' && (
          <div className="mt-5 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Passos para Gerar o APK no seu Computador</span>
              </span>

              <div className="space-y-2.5 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong>1. Copiar o projeto:</strong>
                  <p className="text-slate-400">Transfira a pasta deste projeto para o seu computador (com o botão &quot;Exportar Código / ZIP&quot; no menu da plataforma).</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong>2. Executar o comando de compilação:</strong>
                    <button
                      type="button"
                      onClick={copyBuildCommands}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Comando'}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-black/60 text-emerald-300 font-mono text-[10px] overflow-x-auto">
                    npm install && npm run build && npx cap sync android
                  </pre>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong>3. Abrir no Android Studio:</strong>
                  <p className="text-slate-400">Abra a pasta <code>/android</code> no <strong>Android Studio</strong> e clique em <em>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</em>.</p>
                  <p className="text-emerald-400 font-bold mt-1">O ficheiro .apk final fica pronto para instalar no seu telemóvel!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cloud Build (GitHub Actions) */}
        {activeTab === 'cloud' && (
          <div className="mt-5 space-y-4 text-xs text-slate-300 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Passo a Passo com GitHub Actions (Sem Instalar Nada)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  Ficheiro Criado
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                O fluxo de automação já está configurado no repositório no ficheiro <code>.github/workflows/build-apk.yml</code>. Basta seguir estes 4 passos:
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs">1</span>
                    Submeter o código para o seu repositório no GitHub:
                  </strong>
                  <p className="text-slate-400 pl-6.5">
                    Ao fazer push do código para o GitHub, o GitHub Actions deteta automaticamente o ficheiro e inicia a compilação do APK nos servidores da nuvem da Microsoft/GitHub.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs">2</span>
                    Aceder à aba &quot;Actions&quot; no GitHub:
                  </strong>
                  <p className="text-slate-400 pl-6.5">
                    No seu projeto no GitHub, clique na aba superior <strong>&quot;Actions&quot;</strong>. Verá o fluxo <em>&quot;Compilar APK Android TacoPro&quot;</em> a ser executado.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs">3</span>
                    Disparo Manual (Opcional - botão instantâneo):
                  </strong>
                  <p className="text-slate-400 pl-6.5">
                    Também pode clicar em <em>Compilar APK Android TacoPro &gt; <strong>Run workflow</strong></em> para gerar uma nova versão a qualquer instante com 1 clique.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs">4</span>
                    Descarregar o APK e Instalar no Telemóvel:
                  </strong>
                  <p className="text-slate-400 pl-6.5">
                    Quando a compilação terminar (cerca de 2 minutos), clique na execução concluída. Em baixo, na secção <strong>Artifacts</strong>, clique em <strong>TacoPro-Android-APK</strong> (ou vá a <strong>Releases</strong>) e transfira o ficheiro <code>.apk</code> diretamente para o telemóvel!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>O APK resultante já vem com o Widget Nativo de 4 Símbolos (🚗 ⚒️ ⏹️ 🛏️) e o serviço contínuo incluídos!</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            com.tacopro.app · v1.0.0 APK
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            Compreendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
