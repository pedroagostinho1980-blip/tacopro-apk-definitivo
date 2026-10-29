import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Share,
  MoreVertical,
  QrCode,
  CheckCircle2,
  Monitor,
  Sparkles,
  Info
} from 'lucide-react';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNativeInstall?: () => Promise<boolean>;
  isInstallable?: boolean;
  onOpenAdvancedPackaging?: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({
  isOpen,
  onClose,
  onTriggerNativeInstall,
  isInstallable = false,
  onOpenAdvancedPackaging,
}) => {
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'qr'>('android');
  const [nativeInstallTriggered, setNativeInstallTriggered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('ios');
      } else if (/android/.test(ua)) {
        setPlatform('android');
      } else {
        setPlatform('android');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-u2souccffxyyka6hzxjzo5-102850819123.europe-west2.run.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTryNative = async () => {
    if (onTriggerNativeInstall) {
      const res = await onTriggerNativeInstall();
      if (res) {
        setNativeInstallTriggered(true);
        setTimeout(() => onClose(), 1500);
        return;
      }
    }
    // Set platform to Android to show the clear step-by-step visual guide
    setPlatform('android');
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 no-print overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <Download className="w-4 h-4" />
          <span>Instalação Oficial do TacoPro</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Como Instalar no Telemóvel ou Tablet
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Instale diretamente no seu aparelho em poucos segundos. Fica com o ícone TacoPro no ecrã e funciona <strong>100% offline na cabine</strong>, sem precisar de pagar lojas de aplicações.
        </p>

        {/* Quick Native Action Banner if browser has deferred prompt */}
        {isInstallable && (
          <div className="mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-300 block">O seu navegador suporta instalação com 1 toque!</span>
                <span className="text-slate-300">Clique para abrir a janela de instalação automática.</span>
              </div>
            </div>
            <button
              onClick={handleTryNative}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-md cursor-pointer transition-colors"
            >
              {nativeInstallTriggered ? 'Instalando...' : 'Instalar Agora'}
            </button>
          </div>
        )}

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setPlatform('android')}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              platform === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setPlatform('ios')}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              platform === 'ios'
                ? 'bg-sky-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Share className="w-3.5 h-3.5" />
            <span>iPhone/iOS</span>
          </button>

          <button
            onClick={() => setPlatform('desktop')}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              platform === 'desktop'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC / Mac</span>
          </button>

          <button
            onClick={() => setPlatform('qr')}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              platform === 'qr'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR</span>
          </button>
        </div>

        {/* Instructions Body */}
        <div className="mt-4">
          {/* ANDROID TAB */}
          {platform === 'android' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Abra no navegador Google Chrome</strong>
                    <span>No telemóvel Android, abra a ligação do TacoPro no Google Chrome.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5 flex items-center gap-1.5">
                      Toque no menu de 3 pontos <MoreVertical className="w-3.5 h-3.5 text-emerald-400" />
                    </strong>
                    <span>Toque nos três pontos verticais no canto superior direito do ecrã do navegador.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      Selecione "Instalar aplicação" ou "Adicionar ao ecrã inicial"
                    </strong>
                    <span>
                      Se surgir a janela <em>"Instale e crie um atalho"</em>, toque na opção <strong>"Criar atalho"</strong> (ou "Instalar"). O ícone do TacoPro fica logo no ecrã inicial do telemóvel e abre em ecrã inteiro.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                💡 <strong>Dica Android:</strong> Se a primeira opção <em>"Instalar"</em> estiver acinzentada, toque simplesmente na opção <strong>"Criar atalho"</strong> logo abaixo. O atalho é criado imediatamente no ecrã com acesso 100% offline!
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  onClick={handleTryNative}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Abrir Instalador Direto</span>
                </button>
                <button
                  onClick={handleOpenExternal}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  title="Abre a app num novo separador para contornar restrições de janela"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Abrir Noutro Separador</span>
                </button>
              </div>
            </div>
          )}

          {/* IOS TAB */}
          {platform === 'ios' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-400/20 text-sky-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Abra no Safari da Apple</strong>
                    <span>No iPhone ou iPad, abra a ligação do TacoPro no Safari.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-400/20 text-sky-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5 flex items-center gap-1.5">
                      Toque no botão Partilhar <Share className="w-3.5 h-3.5 text-sky-400" />
                    </strong>
                    <span>Toque no ícone do quadrado com uma seta para cima (na barra inferior do Safari).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-400/20 text-sky-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      Selecione "Adicionar ao Ecrã Principal"
                    </strong>
                    <span>Deslize para baixo nas opções e toque em <strong>"Adicionar ao Ecrã Principal"</strong>. Depois toque em <strong>"Adicionar"</strong> no topo direito.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>No iOS, o Safari cria a app em ecrã inteiro sem barras de endereço, com suporte offline completo.</span>
              </div>
            </div>
          )}

          {/* DESKTOP TAB */}
          {platform === 'desktop' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Utilize o Google Chrome, Edge ou Brave</strong>
                    <span>Abra a ligação no seu navegador favorito no computador.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      Procure o ícone de instalação na barra de endereço
                    </strong>
                    <span>No lado direito da barra de endereço (ao lado da estrela de favoritos), clique no ícone de monitor com uma seta para baixo.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Clique em "Instalar"</strong>
                    <span>Abre como uma janela independente de secretária sem barras de navegador.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR CODE TAB */}
          {platform === 'qr' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center flex flex-col items-center">
              <span className="text-xs font-semibold text-purple-300 mb-2">
                Aponte a câmara do telemóvel para abrir diretamente:
              </span>
              <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-purple-500/30 inline-block my-2">
                <img
                  src={qrCodeUrl}
                  alt="QR Code para instalar TacoPro no Telemóvel"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                A câmara do Android ou iPhone lê o código e abre o TacoPro pronto para guardar no ecrã.
              </p>
            </div>
          )}
        </div>

        {/* Quick Link Share Bar */}
        <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Ligação:</span>
            <span className="font-mono text-xs text-slate-300 truncate">{currentUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copiar Link</span>
              </>
            )}
          </button>
        </div>

        {/* Footer: Distinction between Driver Install and Store Publishing */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {onOpenAdvancedPackaging ? (
            <button
              onClick={() => {
                onClose();
                onOpenAdvancedPackaging();
              }}
              className="text-slate-400 hover:text-amber-400 text-xs font-medium underline-offset-4 hover:underline cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>É programador? Como publicar na Google Play / App Store (.aab / .apk)</span>
            </button>
          ) : (
            <span className="text-slate-500">TacoPro • Pronto para condução offline</span>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer text-center"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
