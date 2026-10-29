import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Download,
  Video,
  Sparkles,
  ShieldCheck,
  Clock,
  Compass,
  Moon,
  Scale,
  Calendar,
  Layers,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ShowcaseVideoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'cockpit' | 'compliance' | 'timeline' | 'reports' | 'infringements') => void;
}

interface Slide {
  id: number;
  tag: string;
  title: string;
  durationSec: number;
  icon: React.ReactNode;
  tabTarget: 'cockpit' | 'compliance' | 'timeline' | 'reports' | 'infringements';
  badgeColor: string;
  summary: string;
  scriptPT: string;
  bulletPoints: string[];
  visualPreview: {
    highlight: string;
    description: string;
    stats: { label: string; value: string; color: string }[];
  };
}

export const ShowcaseVideoTourModal: React.FC<ShowcaseVideoTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { language } = useLanguage();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState<number>(1.05);
  const [copiedScript, setCopiedScript] = useState(false);
  const [viewMode, setViewMode] = useState<'interactive' | 'script'>('interactive');
  const [progress, setProgress] = useState(0);

  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: Slide[] = [
    {
      id: 1,
      tag: '01 / 07 · Introdução & Cockpit Digital',
      title: 'Cockpit Inteligente e Comutação Instantânea',
      durationSec: 18,
      icon: <Compass className="w-6 h-6 text-emerald-400" />,
      tabTarget: 'cockpit',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'Apresentação da interface tátil desenhada especificamente para cabines de veículos pesados.',
      scriptPT:
        'Bem-vindos ao TacoPro, o software profissional de conformidade regulamentar e gestão de tempos para motoristas de pesados e frotas de transporte. No Cockpit principal, o condutor tem acesso instantâneo ao relógio oficial e aos quatro modos táteis: Condução, Outro Trabalho, Disponibilidade e Pausa ou Descanso. Com um único toque, os contadores atualizam-se ao segundo, sem complicações.',
      bulletPoints: [
        'Comutação com 1 toque entre Condução, Trabalho, Espera e Repouso',
        'Cronómetro ao vivo e relógio oficial do tacógrafo em tempo real',
        'Suporte a Motorista Único (Ciclo 24h) e Tripulação Múltipla / Equipa (Ciclo 30h)',
      ],
      visualPreview: {
        highlight: 'Seletor Tátil Oficial & Cronómetro em Tempo Real',
        description: 'Desenvolvido para utilização rápida em andamento ou paragem na cabine.',
        stats: [
          { label: 'Condução Contínua', value: '00:00:00', color: 'text-emerald-400' },
          { label: 'Hoje (Condução)', value: '04h 15m', color: 'text-amber-400' },
          { label: 'Conformidade', value: '100% Legal', color: 'text-emerald-400' },
        ],
      },
    },
    {
      id: 2,
      tag: '02 / 07 · Condução Contínua & Pausas',
      title: 'Controlo Contínuo de 4h30 e Pausas Divididas',
      durationSec: 20,
      icon: <Clock className="w-6 h-6 text-amber-400" />,
      tabTarget: 'compliance',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      summary: 'Garante o cumprimento estrito do Artigo 7.º do Regulamento Europeu CE 561/2006.',
      scriptPT:
        'O TacoPro monitoriza de forma contínua o limite legal de quatro horas e meia de condução ininterrupta. Mais do que isso: o sistema gere automaticamente a regra da pausa dividida europeia, validando se o motorista cumpriu a primeira fração de quinze minutos e alertando quando são necessários os trinta minutos restantes para zerar a contagem.',
      bulletPoints: [
        'Avisos prévios configuráveis (15m, 30m ou 45m antes do limite)',
        'Deteção automática de frações válidas: 15 min + 30 min ou 45 min contínuos',
        'Sinais acústicos e notificações de ecrã para evitar infrações por distração',
      ],
      visualPreview: {
        highlight: 'Barra Progressiva com Alertas Prévios Acústicos',
        description: 'Regra de Pausa Europeia totalmente automatizada e à prova de erro.',
        stats: [
          { label: 'Limite Contínuo', value: '04h 30m', color: 'text-white' },
          { label: 'Fração 1 (15m)', value: 'Cumprida ✓', color: 'text-emerald-400' },
          { label: 'Fração 2 (30m)', value: 'Aguardada', color: 'text-amber-400' },
        ],
      },
    },
    {
      id: 3,
      tag: '03 / 07 · Condução Diária & Extensão 10h',
      title: 'Limite Diário e Extensões do Artigo 6.º',
      durationSec: 19,
      icon: <Layers className="w-6 h-6 text-cyan-400" />,
      tabTarget: 'compliance',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      summary: 'Gestão inteligente das duas extensões para 10 horas semanais e amplitudes de turno.',
      scriptPT:
        'A condução diária normal está fixada em nove horas, mas o Artigo sexto permite alargar até dez horas, duas vezes por semana. O TacoPro contabiliza rigorosamente quantas extensões já foram consumidas na semana civil, avisando a empresa e o motorista quando o saldo semanal esgota, prevenindo contraordenações graves.',
      bulletPoints: [
        'Controlo visual das 2 extensões permitidas de segunda a domingo',
        'Controlo da Amplitude de Turno de 13h, 15h (descanso reduzido) ou 21h em equipa',
        'Congelamento automático de amplitude ao encerrar a jornada para evitar falsos alarmes',
      ],
      visualPreview: {
        highlight: 'Contador de Extensões de 10h & Amplitude de Turno',
        description: 'Evita violações do ciclo de 24 horas e da jornada de trabalho diária.',
        stats: [
          { label: 'Teto Hoje', value: '10h 00m', color: 'text-cyan-400' },
          { label: 'Extensões Usadas', value: '1 de 2', color: 'text-amber-400' },
          { label: 'Amplitude Restante', value: '03h 45m', color: 'text-emerald-400' },
        ],
      },
    },
    {
      id: 4,
      tag: '04 / 07 · Trabalho Noturno DL 237/2007',
      title: 'Deteção Automática do Regime de Horário Noturno',
      durationSec: 21,
      icon: <Moon className="w-6 h-6 text-indigo-400" />,
      tabTarget: 'cockpit',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      summary: 'Aplicação automática do Decreto-Lei 237/2007: máximo estrito de 10h em trabalho noturno.',
      scriptPT:
        'Uma das principais causas de coimas pesadas em Portugal é o desconhecimento da regra do trabalho noturno. Sempre que o motorista inicia a sua jornada entre a meia-noite e as cinco da manhã, o TacoPro deteta o regime noturno de imediato e bloqueia a soma de condução e outro trabalho no teto estrito de dez horas em cada vinte e quatro horas.',
      bulletPoints: [
        'Identificação instantânea de início entre 00h00 e 05h00',
        'Soma conjunta de Condução e Outro Trabalho (cargas, descargas e manutenção)',
        'Proteção contra coimas da ACT e autoridades entre 600 e 2.400 euros',
      ],
      visualPreview: {
        highlight: '🌙 Regime Noturno Ativo: Alerta Imperativo',
        description: 'Teto estrito de 10 horas de trabalho diário com alerta visual na cabine.',
        stats: [
          { label: 'Início do Turno', value: '03:45 AM', color: 'text-indigo-400' },
          { label: 'Trabalho + Condução', value: '07h 10m', color: 'text-amber-300' },
          { label: 'Teto Legal', value: 'Máx 10h 00m', color: 'text-rose-400' },
        ],
      },
    },
    {
      id: 5,
      tag: '05 / 07 · Calculador de Paragens',
      title: 'Assistente de Saída: A Que Horas Posso Arrancar?',
      durationSec: 18,
      icon: <Clock className="w-6 h-6 text-amber-400" />,
      tabTarget: 'cockpit',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      summary: 'Calcula o minuto exato para retomar marcha com margem de segurança de +3 minutos.',
      scriptPT:
        'Quando o motorista para na estação de serviço, a dúvida é sempre a mesma: a que horas exatas posso voltar à estrada? O nosso Assistente de Saída calcula a hora precisa para pausas de quinze, trinta ou quarenta e cinco minutos, e descansos de nove ou onze horas, somando uma margem de segurança de três minutos para compensar variações do relógio do tacógrafo digital.',
      bulletPoints: [
        'Cálculo exato de saída para pausas de 15m, 30m, 45m e descansos de 9h, 11h, 24h e 45h',
        'Margem de segurança regulamentar de +3 minutos anti-coima por segundos',
        'Aviso se a hora de retoma da marcha entrar no regime de trabalho noturno',
      ],
      visualPreview: {
        highlight: 'Calculadora de Paragem com Margem de +3 Minutos',
        description: 'Basta introduzir a hora de paragem para obter a hora legal de partida.',
        stats: [
          { label: 'Hora de Paragem', value: '12:30', color: 'text-white' },
          { label: 'Tipo Selecionado', value: 'Pausa 45 min', color: 'text-amber-400' },
          { label: 'Retoma Autorizada', value: '13:18', color: 'text-emerald-400 font-bold' },
        ],
      },
    },
    {
      id: 6,
      tag: '06 / 07 · Pacote de Mobilidade',
      title: 'Gestor de Compensações Semanais & Repousos',
      durationSec: 22,
      icon: <Calendar className="w-6 h-6 text-cyan-400" />,
      tabTarget: 'compliance',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      summary: 'Controlo do Pacote de Mobilidade I, âmbito nacional vs. internacional e prazos de compensação.',
      scriptPT:
        'Com as novas exigências do Pacote de Mobilidade da União Europeia, o TacoPro gere os descansos semanais reduzidos de vinte e quatro horas e regulares de quarenta e cinco horas. Permite alternar entre transporte nacional e internacional, monitoriza o prazo obrigatório de três semanas para compensar horas em dívida e alerta para a proibição expressa de descanso na cabine.',
      bulletPoints: [
        'Modo Nacional (máx 1 reduzido em 2 semanas) vs. Internacional (2 reduzidos seguidos)',
        'Cálculo e contagem decrescente do prazo de 3 semanas para compensar as 21 horas',
        'Lembrete das Regras de Ouro: proibição de descanso regular na cabine e regresso à base',
      ],
      visualPreview: {
        highlight: 'Quadro de Auditoria de Compensações & Prazos de 3 Semanas',
        description: 'Elimina o risco de falhar compensações obrigatórias de 21 horas.',
        stats: [
          { label: 'Âmbito Atual', value: 'Internacional', color: 'text-cyan-400' },
          { label: 'Horas em Dívida', value: '21h 00m', color: 'text-amber-400' },
          { label: 'Prazo Restante', value: '2 semanas', color: 'text-emerald-400' },
        ],
      },
    },
    {
      id: 7,
      tag: '07 / 07 · Fiscalização & Widget PiP',
      title: 'Auditoria de Fiscalização, Artigo 12.º & Widget Flutuante',
      durationSec: 23,
      icon: <Scale className="w-6 h-6 text-rose-400" />,
      tabTarget: 'infringements',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      summary: 'Simulação de inspeção GNR/PSP/IMT com Lei 27/2010, Art. 12.º e Widget flutuante sobre GPS.',
      scriptPT:
        'Em caso de fiscalização da GNR, PSP ou inspetores europeus, a aba de Auditoria analisa todos os registos e apresenta estimativas de coimas segundo a Lei vinte e sete de dois mil e dez. Em emergências na estrada, disponibiliza as instruções do Artigo doze para justificar derrogações imprevistas. E o melhor de tudo: o TacoPro inclui um Widget flutuante que fica visível por cima do Google Maps ou Waze, e funciona cem por cento offline na cabine.',
      bulletPoints: [
        'Auditoria instantânea de infrações leves, graves e muito graves (Lei 27/2010)',
        'Guia prático do Artigo 12.º (ticket impresso e anotação manual no verso)',
        'Widget Flutuante PiP sobre a navegação GPS e aplicação PWA 100% offline',
      ],
      visualPreview: {
        highlight: 'Auditoria Legal & Widget Suspenso sobre GPS (Waze)',
        description: 'Segurança jurídica máxima para o motorista e para o gestor da frota.',
        stats: [
          { label: 'Estado Auditoria', value: '100% Conforme', color: 'text-emerald-400' },
          { label: 'Janela PiP', value: 'Disponível', color: 'text-cyan-400' },
          { label: 'Modo Offline', value: '100% Ativo', color: 'text-emerald-400' },
        ],
      },
    },
  ];

  const currentSlide = slides[activeSlideIndex];

  // Voice Narration with Web Speech Synthesis (using pt-PT or falling back cleanly)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !voiceEnabled) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceRate;
    utterance.pitch = 1.0;

    // Search for European Portuguese voice first, fallback to Portuguese
    const voices = window.speechSynthesis.getVoices();
    const ptVoice =
      voices.find((v) => v.lang === 'pt-PT') ||
      voices.find((v) => v.lang.startsWith('pt')) ||
      null;

    if (ptVoice) {
      utterance.voice = ptVoice;
      utterance.lang = ptVoice.lang;
    } else {
      utterance.lang = 'pt-PT';
    }

    utterance.onend = () => {
      // Auto-advance if playing
      if (isPlaying && activeSlideIndex < slides.length - 1) {
        setActiveSlideIndex((prev) => prev + 1);
      } else if (isPlaying && activeSlideIndex === slides.length - 1) {
        setIsPlaying(false);
      }
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Play / Pause slide handler
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      if (onNavigateToTab) {
        onNavigateToTab(currentSlide.tabTarget);
      }
      speakText(currentSlide.scriptPT);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeSlideIndex, isOpen, voiceEnabled, voiceRate]);

  // Clean voice when modal is closed
  const handleClose = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
    onClose();
  };

  const handleNext = () => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  };

  const handleRestart = () => {
    setActiveSlideIndex(0);
    setIsPlaying(true);
  };

  const handleCopyFullScript = () => {
    const fullText = slides
      .map(
        (s) =>
          `[CENA ${s.id}] - ${s.title} (Aprox. ${s.durationSec}s)\n` +
          `Aba na App: ${s.tabTarget.toUpperCase()}\n` +
          `NARRAÇÃO:\n"${s.scriptPT}"\n\n` +
          `DESTAQUES VISUAIS:\n${s.bulletPoints.map((b) => ' • ' + b).join('\n')}\n`
      )
      .join('\n----------------------------------------\n\n');

    const header =
      `====================================================\n` +
      `GUIÃO OFICIAL DE VÍDEO DEMONSTRATIVO & APRESENTAÇÃO COMERCIAL\n` +
      `APLICAÇÃO: TacoPro (Regulamento CE 561/2006 & Pacote de Mobilidade)\n` +
      `Duração estimada total: ~2 min 20 seg\n` +
      `Público-alvo: Motoristas de Pesados, Gestores de Frota e Empresas de Transporte\n` +
      `====================================================\n\n`;

    navigator.clipboard.writeText(header + fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = () => {
    const fullText = slides
      .map(
        (s) =>
          `[CENA ${s.id}] - ${s.title} (${s.durationSec}s)\n` +
          `Aba da App: ${s.tabTarget.toUpperCase()}\n\n` +
          `TEXTO DA VOZ OFF:\n"${s.scriptPT}"\n\n` +
          `PONTOS-CHAVE:\n${s.bulletPoints.map((b) => ' - ' + b).join('\n')}\n`
      )
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Guiao_Demonstrativo_TacoPro_Comercial.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <Video className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Showcase Comercial TacoPro
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Com Narração de Voz
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Vídeo Demonstrativo & Apresentação a Clientes
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'interactive'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Apresentação Interativa
              </button>
              <button
                onClick={() => setViewMode('script')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'script'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Guião Completo
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode 1: Interactive Player with Voice */}
        {viewMode === 'interactive' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Slide Navigation Strip */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    if (onNavigateToTab) onNavigateToTab(s.tabTarget);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    activeSlideIndex === idx
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-75">#{s.id}</span>
                  <span className="truncate max-w-[130px]">{s.title.split('&')[0]}</span>
                </button>
              ))}
            </div>

            {/* Main Stage Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {currentSlide.icon}
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentSlide.badgeColor}`}>
                      {currentSlide.tag}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                      {currentSlide.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono text-slate-400">
                    Aba: <strong className="text-amber-400 uppercase">{currentSlide.tabTarget}</strong>
                  </span>
                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab(currentSlide.tabTarget)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Ver esta aba na aplicação em tempo real"
                    >
                      <span>Abrir Aba</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Simulated Live Visual Preview */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentSlide.visualPreview.highlight}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{currentSlide.visualPreview.description}</span>
                </div>

                {/* Simulated Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {currentSlide.visualPreview.stats.map((st, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{st.label}</span>
                      <span className={`text-base font-bold font-mono mt-0.5 ${st.color}`}>{st.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Voiceover Narration Box */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-slate-900 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Texto da Narração de Voz (Em tempo real):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ~{currentSlide.durationSec}s · Português
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans font-medium">
                  &quot;{currentSlide.scriptPT}&quot;
                </p>
              </div>

              {/* Key Bullet Points for Sales Pitch */}
              <div className="mt-4 space-y-1.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Argumentos Comerciais & Valor para o Cliente:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentSlide.bulletPoints.map((b, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Full Storyboard & Screenplay Script */}
        {viewMode === 'script' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Guião Completo para Gravação de Vídeo / Apresentação Comercial
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pode usar este texto exato para gravar o seu ecrã com voz no telemóvel, OBS Studio ou Loom.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyFullScript}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copiado!' : 'Copiar Guião'}</span>
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descarregar .txt</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {slides.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      CENA {s.id}: {s.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Aba: {s.tabTarget.toUpperCase()} · ~{s.durationSec}s
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                    <strong>Voz-off:</strong> &quot;{s.scriptPT}&quot;
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <strong>O que mostrar no ecrã:</strong>
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      {s.bulletPoints.map((bp, i) => (
                        <li key={i}>{bp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Playback Control Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Slide Indicator */}
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>
              Passo <strong>{activeSlideIndex + 1}</strong> de <strong>{slides.length}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                voiceEnabled
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                  : 'text-slate-400 bg-slate-800 border border-slate-700'
              }`}
              title="Ativar ou desativar narração de voz automática"
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{voiceEnabled ? 'Voz Ligada' : 'Voz Silenciada'}</span>
            </button>

            {voiceEnabled && (
              <button
                onClick={() => setVoiceRate((r) => (r === 1.05 ? 1.25 : 1.05))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-mono hover:text-white cursor-pointer"
                title="Velocidade da voz"
              >
                {voiceRate}x
              </button>
            )}
          </div>

          {/* Interactive Player Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reiniciar apresentação do início"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrev}
              disabled={activeSlideIndex === 0}
              className={`p-2 rounded-lg transition-colors ${
                activeSlideIndex === 0
                  ? 'text-slate-600 bg-slate-900 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer'
              }`}
              title="Cena anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>Pausar Apresentação</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Iniciar com Narração</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={activeSlideIndex === slides.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                activeSlideIndex === slides.length - 1
                  ? 'text-slate-600 bg-slate-900 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer'
              }`}
              title="Próxima cena"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFullScript}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedScript ? 'Copiado!' : 'Copiar Guião'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
