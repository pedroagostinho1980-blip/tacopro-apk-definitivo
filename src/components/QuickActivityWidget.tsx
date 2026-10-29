import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Wrench,
  Clock,
  Coffee,
  ExternalLink,
  Minimize2,
  Maximize2,
  X,
  Gauge,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ActivityType, ActivityLog, ComplianceStatus } from '../types/tachograph';
import { formatMinutes } from '../utils/rulesEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface QuickActivityWidgetProps {
  activeLog: ActivityLog | undefined;
  compliance: ComplianceStatus;
  onSwitchActivity: (type: ActivityType, note?: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const QuickActivityWidget: React.FC<QuickActivityWidgetProps> = ({
  activeLog,
  compliance,
  onSwitchActivity,
  isVisible,
  onClose,
}) => {
  const { t } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right'>('bottom-right');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  // Live timer for active activity
  useEffect(() => {
    const updateTime = () => {
      if (activeLog && activeLog.startTime) {
        const start = new Date(activeLog.startTime).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((now - start) / 1000));
        setCurrentSeconds(diffSecs);
      } else {
        setCurrentSeconds(0);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeLog]);

  const formatSecondsToHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentType = activeLog?.type || 'REST';

  // Config for the 4 activities
  const activities: {
    type: ActivityType;
    label: string;
    shortLabel: string;
    sublabel: string;
    symbol: string;
    icon: React.ReactNode;
    activeBg: string;
    activeBorder: string;
    badgeBg: string;
    textColor: string;
    totalMinutes: number;
    colorHex: string;
  }[] = [
    {
      type: 'DRIVING',
      label: t('driving'),
      shortLabel: t('driving'),
      sublabel: t('drivingSub'),
      symbol: '🚗',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      activeBg: 'bg-emerald-950/80',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      textColor: 'text-emerald-400',
      totalMinutes: compliance.dailyDrivingMinutes,
      colorHex: '#10b981',
    },
    {
      type: 'WORK',
      label: t('otherWork'),
      shortLabel: t('otherWork'),
      sublabel: t('workSub'),
      symbol: '⚒️',
      icon: <Wrench className="w-5 h-5 text-amber-400" />,
      activeBg: 'bg-amber-950/80',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/40',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      textColor: 'text-amber-400',
      totalMinutes: compliance.dailyOtherWorkMinutes,
      colorHex: '#f59e0b',
    },
    {
      type: 'AVAILABILITY',
      label: t('availability'),
      shortLabel: t('availability'),
      sublabel: t('availabilitySub'),
      symbol: '⏹️',
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
      activeBg: 'bg-cyan-950/80',
      activeBorder: 'border-cyan-500 ring-2 ring-cyan-500/40',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      textColor: 'text-cyan-400',
      totalMinutes: compliance.dailyAvailabilityMinutes,
      colorHex: '#06b6d4',
    },
    {
      type: 'REST',
      label: t('rest'),
      shortLabel: t('rest'),
      sublabel: t('restSub'),
      symbol: '🛏️',
      icon: <Coffee className="w-5 h-5 text-indigo-400" />,
      activeBg: 'bg-indigo-950/80',
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/40',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      textColor: 'text-indigo-400',
      totalMinutes: compliance.dailyRestMinutes,
      colorHex: '#6366f1',
    },
  ];

  const currentActivityConfig = activities.find((a) => a.type === currentType) || activities[3];

  // Update MediaSession API for lockscreen & notification display
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        const timeHMS = formatSecondsToHMS(currentSeconds);
        const driveTot = formatMinutes(compliance.dailyDrivingMinutes);
        const workTot = formatMinutes(compliance.dailyOtherWorkMinutes);
        const restTot = formatMinutes(compliance.dailyRestMinutes);

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `TacoPro: ${currentActivityConfig.label} (${timeHMS})`,
          artist: `Totais: Cond ${driveTot} · Trab ${workTot} · Rep ${restTot}`,
          album: `Amplitude: ${formatMinutes(compliance.shiftElapsedMinutes)} / ${formatMinutes(compliance.maxShiftAmplitudeMinutes)}`,
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });

        // Set action handlers so driver can switch activities from media notifications
        navigator.mediaSession.setActionHandler('play', () => onSwitchActivity('DRIVING', 'Comutação via Notificação'));
        navigator.mediaSession.setActionHandler('pause', () => onSwitchActivity('REST', 'Pausa via Notificação'));
        navigator.mediaSession.setActionHandler('nexttrack', () => onSwitchActivity('WORK', 'Trabalho via Notificação'));
        navigator.mediaSession.setActionHandler('previoustrack', () => onSwitchActivity('AVAILABILITY', 'Disponibilidade via Notificação'));
      } catch {
        // ignore mediaSession errors
      }
    }
  }, [currentSeconds, currentType, compliance, currentActivityConfig, onSwitchActivity]);

  // Picture-in-Picture Canvas drawer
  const drawPiPCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions: 480x280
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Top: Active Status & Symbol
    ctx.fillStyle = currentActivityConfig.colorHex;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`${currentActivityConfig.symbol} TACOPRO: ${currentActivityConfig.label.toUpperCase()}`, 20, 36);

    // Active Timer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(formatSecondsToHMS(currentSeconds), 20, 90);

    // Context / Regulatory Limit
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, sans-serif';
    if (currentType === 'DRIVING') {
      ctx.fillText(
        `Restante Contínua (4h30): ${formatMinutes(compliance.remainingContinuousDrivingMinutes)}`,
        20,
        120
      );
    } else if (currentType === 'REST') {
      ctx.fillText(
        `Pausa Atual: ${formatMinutes(compliance.currentBreakMinutes)} (Alvo: 15m/45m)`,
        20,
        120
      );
    } else {
      ctx.fillText(
        `Amplitude do Turno: ${formatMinutes(compliance.shiftElapsedMinutes)} / ${formatMinutes(compliance.maxShiftAmplitudeMinutes)}`,
        20,
        120
      );
    }

    // 4 SYMBOL BUTTONS DRAWN ON CANVAS (Condução 🚗, Trabalho ⚒️, Disponibilidade ⏹️, Repouso 🛏️)
    const symButtons = [
      { type: 'DRIVING', sym: '🚗', color: '#10b981', label: 'Condução' },
      { type: 'WORK', sym: '⚒️', color: '#f59e0b', label: 'Trabalho' },
      { type: 'AVAILABILITY', sym: '⏹️', color: '#06b6d4', label: 'Disponib.' },
      { type: 'REST', sym: '🛏️', color: '#6366f1', label: 'Repouso' },
    ];

    symButtons.forEach((b, idx) => {
      const btnX = 20 + idx * 110;
      const btnY = 135;
      const btnW = 100;
      const btnH = 60;
      const isActive = b.type === currentType;

      // Button background
      ctx.fillStyle = isActive ? `${b.color}33` : '#0f172a';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx.fill();

      // Button border
      ctx.strokeStyle = isActive ? b.color : '#334155';
      ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.stroke();

      // Big Symbol Icon (Only Symbol)
      ctx.font = '32px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.sym, btnX + btnW / 2, btnY + 42);
      ctx.textAlign = 'left';
    });

    // Divider
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(20, 208);
    ctx.lineTo(canvas.width - 20, 208);
    ctx.stroke();

    // 4 Totals Row
    const totals = [
      { sym: '🚗', val: formatMinutes(compliance.dailyDrivingMinutes), color: '#10b981' },
      { sym: '⚒️', val: formatMinutes(compliance.dailyOtherWorkMinutes), color: '#f59e0b' },
      { sym: '⏹️', val: formatMinutes(compliance.dailyAvailabilityMinutes), color: '#06b6d4' },
      { sym: '🛏️', val: formatMinutes(compliance.dailyRestMinutes), color: '#6366f1' },
    ];

    totals.forEach((t, idx) => {
      const colX = 20 + idx * 110;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`${t.sym} ${t.val}`, colX, 235);
    });

    // Footer
    ctx.fillStyle = '#475569';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Janela PiP TacoPro · Toque nos símbolos para comutar', 20, 264);
  };

  // Continuous canvas draw when PiP is running - survives backgrounding/minimizing on Android
  useEffect(() => {
    let animId: number;
    let fallbackInterval: any;

    const tick = () => {
      drawPiPCanvas();
    };

    const render = () => {
      tick();
      animId = requestAnimationFrame(render);
    };
    render();

    // Android Chrome pauses requestAnimationFrame when the tab is minimized or hidden.
    // This interval guarantees that canvas frames continue rendering without interruption,
    // preventing Android OS from killing the Picture-in-Picture window.
    fallbackInterval = setInterval(tick, 1000);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(fallbackInterval);
    };
  }, [currentSeconds, compliance, currentType]);

  // Keep Android MediaSession in sync with active activity & provide 1-tap switching from PiP controls & Android notification bar
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      const hms = formatSecondsToHMS(currentSeconds);
      const remainingContinuous = compliance.remainingContinuousDrivingMinutes;
      const actConfig = currentActivityConfig;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: `TacoPro: ${actConfig.label} (${actConfig.symbol})`,
        artist: `⏱️ ${hms} | Contínua Rest.: ${formatMinutes(remainingContinuous)}`,
        album: 'Tacógrafo Digital CE 561/2006',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = 'playing';

      // 1-Tap Handlers from Android PiP system controls, Lockscreen & Notification Shade:
      // [|<] Previous Track -> Condução (🚗)
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if ('vibrate' in navigator) navigator.vibrate?.(40);
        onSwitchActivity('DRIVING', 'Comutado via PiP/Notificação: Condução 🚗');
      });

      // [>|] Next Track -> Outro Trabalho (⚒️)
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if ('vibrate' in navigator) navigator.vibrate?.(40);
        onSwitchActivity('WORK', 'Comutado via PiP/Notificação: Outro Trabalho ⚒️');
      });

      // [||] Pause -> Pausa / Repouso (🛏️)
      navigator.mediaSession.setActionHandler('pause', () => {
        if ('vibrate' in navigator) navigator.vibrate?.(40);
        onSwitchActivity('REST', 'Comutado via PiP/Notificação: Pausa/Repouso 🛏️');
      });

      // [>] Play -> Retomar Condução (🚗)
      navigator.mediaSession.setActionHandler('play', () => {
        if ('vibrate' in navigator) navigator.vibrate?.(40);
        onSwitchActivity('DRIVING', 'Comutado via PiP/Notificação: Retomar Condução 🚗');
      });

      // [<<] Seek Backward -> Disponibilidade (⏹️)
      try {
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          if ('vibrate' in navigator) navigator.vibrate?.(40);
          onSwitchActivity('AVAILABILITY', 'Comutado via PiP/Notificação: Disponibilidade ⏹️');
        });
      } catch {
        // ignore if browser does not support seekbackward
      }
    } catch {
      // ignore
    }
  }, [currentSeconds, currentType, compliance]);

  // Handle PiP Toggle (Document PiP or Canvas Video PiP)
  const handleTogglePiP = async () => {
    // 1. Try Document Picture-in-Picture (Native floating window with full interactive DOM)
    if ('documentPictureInPicture' in window) {
      try {
        if (pipWindowRef.current) {
          pipWindowRef.current.close();
          pipWindowRef.current = null;
          setIsPiPActive(false);
          return;
        }

        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 380,
          height: 320,
        });
        pipWindowRef.current = pipWin;
        setIsPiPActive(true);

        // Copy styles
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            if (styleSheet.cssRules) {
              const newStyleEl = pipWin.document.createElement('style');
              Array.from(styleSheet.cssRules).forEach((rule) => {
                newStyleEl.appendChild(pipWin.document.createTextNode(rule.cssText));
              });
              pipWin.document.head.appendChild(newStyleEl);
            } else if (styleSheet.href) {
              const newLinkEl = pipWin.document.createElement('link');
              newLinkEl.rel = 'stylesheet';
              newLinkEl.href = styleSheet.href;
              pipWin.document.head.appendChild(newLinkEl);
            }
          } catch {
            // ignore cross-origin styles
          }
        });

        // Add tailwind or base dark styling
        pipWin.document.body.style.backgroundColor = '#020617';
        pipWin.document.body.style.color = '#ffffff';
        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.padding = '10px';
        pipWin.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        pipWin.document.body.style.userSelect = 'none';

        // Render interactive mini container inside pip window
        const container = pipWin.document.createElement('div');
        container.id = 'pip-content';
        pipWin.document.body.appendChild(container);

        let isCompactSymbolsOnly = false;

        const updatePipDom = () => {
          if (!pipWindowRef.current || pipWindowRef.current.closed) {
            setIsPiPActive(false);
            pipWindowRef.current = null;
            return;
          }

          const hms = formatSecondsToHMS(currentSeconds);
          const cDrive = formatMinutes(compliance.dailyDrivingMinutes);
          const cWork = formatMinutes(compliance.dailyOtherWorkMinutes);
          const cAvail = formatMinutes(compliance.dailyAvailabilityMinutes);
          const cRest = formatMinutes(compliance.dailyRestMinutes);

          container.innerHTML = `
            <div style="background:#090d16; border:1px solid #1e293b; border-radius:14px; padding:12px; font-family:system-ui, -apple-system, sans-serif;">
              
              <!-- Header with Active Status & Timer -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:16px;">${currentActivityConfig.symbol}</span>
                  <span style="font-weight:800; font-size:12px; color:${currentActivityConfig.colorHex}; letter-spacing:0.5px;">
                    ${currentActivityConfig.label.toUpperCase()}
                  </span>
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981; animation:pulse 1.5s infinite;"></span>
                </div>
                <div style="font-family:monospace; font-weight:900; font-size:22px; color:#ffffff; letter-spacing:-0.5px;">
                  ${hms}
                </div>
              </div>

              <!-- Context Countdown Bar -->
              <div style="display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; background:#020617; padding:6px 10px; border-radius:8px; margin-bottom:10px; border:1px solid #1e293b;">
                <span>${currentType === 'DRIVING' ? 'Restante (4h30):' : currentType === 'REST' ? 'Pausa atual:' : 'Amplitude:'}</span>
                <strong style="color:${currentType === 'DRIVING' ? (compliance.remainingContinuousDrivingMinutes <= 30 ? '#fbbf24' : '#34d399') : '#fff'}; font-family:monospace;">
                  ${currentType === 'DRIVING' ? formatMinutes(compliance.remainingContinuousDrivingMinutes) : currentType === 'REST' ? formatMinutes(compliance.currentBreakMinutes) : formatMinutes(compliance.shiftElapsedMinutes)}
                </strong>
              </div>

              <!-- 4 LARGE TACTILE SYMBOL BUTTONS (SÓ OS SÍMBOLOS DAS TAREFAS - 1 TOQUE) -->
              <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px;">
                  Símbolos das Tarefas:
                </span>
                <span style="font-size:9px; color:#10b981; font-weight:700; background:rgba(16,185,129,0.15); padding:2px 6px; border-radius:6px; border:1px solid rgba(16,185,129,0.3);">
                  ✓ Sem abrir a app
                </span>
              </div>

              <!-- BOTÕES SÓ COM OS SÍMBOLOS (🚗, ⚒️, ⏹️, 🛏️) -->
              <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom:12px;">
                <!-- 1. SÍMBOLO: CONDUÇÃO (🚗 / Volante) -->
                <button id="pip-btn-drive" title="Condução (🚗)" aria-label="Condução" style="
                  background: ${currentType === 'DRIVING' ? 'linear-gradient(135deg, #064e3b, #047857)' : '#0f172a'};
                  border: ${currentType === 'DRIVING' ? '2.5px solid #10b981' : '1.5px solid #334155'};
                  box-shadow: ${currentType === 'DRIVING' ? '0 0 16px rgba(16, 185, 129, 0.55), inset 0 1px 2px rgba(255,255,255,0.2)' : 'none'};
                  border-radius: 14px;
                  height: 56px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  position: relative;
                  transition: all 0.15s ease;
                  outline: none;
                ">
                  <span style="font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🚗</span>
                  ${currentType === 'DRIVING' ? '<span style="position:absolute; top:5px; right:5px; width:8px; height:8px; border-radius:50%; background:#34d399; box-shadow:0 0 8px #34d399;"></span>' : ''}
                </button>

                <!-- 2. SÍMBOLO: OUTRO TRABALHO (⚒️ / Martelos Cruzados) -->
                <button id="pip-btn-work" title="Outro Trabalho (⚒️)" aria-label="Outro Trabalho" style="
                  background: ${currentType === 'WORK' ? 'linear-gradient(135deg, #78350f, #b45309)' : '#0f172a'};
                  border: ${currentType === 'WORK' ? '2.5px solid #f59e0b' : '1.5px solid #334155'};
                  box-shadow: ${currentType === 'WORK' ? '0 0 16px rgba(245, 158, 11, 0.55), inset 0 1px 2px rgba(255,255,255,0.2)' : 'none'};
                  border-radius: 14px;
                  height: 56px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  position: relative;
                  transition: all 0.15s ease;
                  outline: none;
                ">
                  <span style="font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">⚒️</span>
                  ${currentType === 'WORK' ? '<span style="position:absolute; top:5px; right:5px; width:8px; height:8px; border-radius:50%; background:#fbbf24; box-shadow:0 0 8px #fbbf24;"></span>' : ''}
                </button>

                <!-- 3. SÍMBOLO: DISPONIBILIDADE (⏹️ / Gaveta / Quadrado) -->
                <button id="pip-btn-avail" title="Disponibilidade (⏹️)" aria-label="Disponibilidade" style="
                  background: ${currentType === 'AVAILABILITY' ? 'linear-gradient(135deg, #164e63, #0e7490)' : '#0f172a'};
                  border: ${currentType === 'AVAILABILITY' ? '2.5px solid #06b6d4' : '1.5px solid #334155'};
                  box-shadow: ${currentType === 'AVAILABILITY' ? '0 0 16px rgba(6, 182, 212, 0.55), inset 0 1px 2px rgba(255,255,255,0.2)' : 'none'};
                  border-radius: 14px;
                  height: 56px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  position: relative;
                  transition: all 0.15s ease;
                  outline: none;
                ">
                  <span style="font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">⏹️</span>
                  ${currentType === 'AVAILABILITY' ? '<span style="position:absolute; top:5px; right:5px; width:8px; height:8px; border-radius:50%; background:#22d3ee; box-shadow:0 0 8px #22d3ee;"></span>' : ''}
                </button>

                <!-- 4. SÍMBOLO: PAUSA / REPOUSO (🛏️ / Cama) -->
                <button id="pip-btn-rest" title="Pausa / Repouso (🛏️)" aria-label="Pausa e Repouso" style="
                  background: ${currentType === 'REST' ? 'linear-gradient(135deg, #312e81, #4338ca)' : '#0f172a'};
                  border: ${currentType === 'REST' ? '2.5px solid #6366f1' : '1.5px solid #334155'};
                  box-shadow: ${currentType === 'REST' ? '0 0 16px rgba(99, 102, 241, 0.55), inset 0 1px 2px rgba(255,255,255,0.2)' : 'none'};
                  border-radius: 14px;
                  height: 56px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  position: relative;
                  transition: all 0.15s ease;
                  outline: none;
                ">
                  <span style="font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🛏️</span>
                  ${currentType === 'REST' ? '<span style="position:absolute; top:5px; right:5px; width:8px; height:8px; border-radius:50%; background:#818cf8; box-shadow:0 0 8px #818cf8;"></span>' : ''}
                </button>
              </div>

              <!-- Compact Totals Summary Bar -->
              <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; font-size:10px; background:#020617; border-radius:10px; padding:6px 4px; border:1px solid #1e293b; text-align:center;">
                <div><span style="font-size:14px;">🚗</span> <div style="font-family:monospace; color:#34d399; font-size:11px; font-weight:700; margin-top:1px;">${cDrive}</div></div>
                <div><span style="font-size:14px;">⚒️</span> <div style="font-family:monospace; color:#fbbf24; font-size:11px; font-weight:700; margin-top:1px;">${cWork}</div></div>
                <div><span style="font-size:14px;">⏹️</span> <div style="font-family:monospace; color:#22d3ee; font-size:11px; font-weight:700; margin-top:1px;">${cAvail}</div></div>
                <div><span style="font-size:14px;">🛏️</span> <div style="font-family:monospace; color:#a5b4fc; font-size:11px; font-weight:700; margin-top:1px;">${cRest}</div></div>
              </div>
            </div>
          `;

          // Bind instant click listeners directly
          const bDrive = container.querySelector('#pip-btn-drive');
          const bWork = container.querySelector('#pip-btn-work');
          const bAvail = container.querySelector('#pip-btn-avail');
          const bRest = container.querySelector('#pip-btn-rest');

          bDrive?.addEventListener('click', () => {
            if ('vibrate' in navigator) navigator.vibrate?.(35);
            onSwitchActivity('DRIVING', 'Comutação por Símbolo via Janela PiP');
          });
          bWork?.addEventListener('click', () => {
            if ('vibrate' in navigator) navigator.vibrate?.(35);
            onSwitchActivity('WORK', 'Comutação por Símbolo via Janela PiP');
          });
          bAvail?.addEventListener('click', () => {
            if ('vibrate' in navigator) navigator.vibrate?.(35);
            onSwitchActivity('AVAILABILITY', 'Comutação por Símbolo via Janela PiP');
          });
          bRest?.addEventListener('click', () => {
            if ('vibrate' in navigator) navigator.vibrate?.(35);
            onSwitchActivity('REST', 'Comutação por Símbolo via Janela PiP');
          });
        };

        updatePipDom();
        const pipTimer = setInterval(updatePipDom, 1000);

        pipWin.addEventListener('pagehide', () => {
          clearInterval(pipTimer);
          setIsPiPActive(false);
          pipWindowRef.current = null;
        });

        return;
      } catch (err) {
        console.warn('Document PiP not granted or failed, falling back to Video Canvas PiP', err);
      }
    }

    // 2. Fallback: Canvas Video Picture-in-Picture with Background Audio & MediaSession
    const canvas = canvasRef.current;
    let video = videoRef.current;
    if (!canvas) return;

    if (!video) {
      video = document.createElement('video');
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      // Crucial: avoid display:none so Chrome Android does not discard the media element
      video.style.position = 'fixed';
      video.style.bottom = '0';
      video.style.right = '0';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0.001';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-9999';
      document.body.appendChild(video);
      videoRef.current = video;
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      setIsPiPActive(false);
    } else {
      try {
        const stream = (canvas as any).captureStream(15);

        // Crucial for Android background persistence:
        // Android OS terminates video PiP upon minimizing if there is no audio track.
        // Adding an inaudible Web Audio track causes Android's Media Session daemon to keep
        // the Picture-in-Picture window floating on the Home screen and over GPS apps.
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }
            const dest = audioCtx.createMediaStreamDestination();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            gain.gain.value = 0.00001; // Inaudible whisper/silence
            osc.connect(gain);
            gain.connect(dest);
            osc.start();

            const audioTrack = dest.stream.getAudioTracks()[0];
            if (audioTrack) {
              stream.addTrack(audioTrack);
            }
          }
        } catch (audioErr) {
          console.warn('AudioContext track addition skipped:', audioErr);
        }

        video.srcObject = stream;
        video.muted = false; // Must be false with silent track so Android maintains background PiP
        await video.play();
        await video.requestPictureInPicture();
        setIsPiPActive(true);

        video.addEventListener('leavepictureinpicture', () => {
          setIsPiPActive(false);
        });
      } catch (e) {
        console.error('Failed to open Video PiP', e);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Hidden canvas used for Picture-in-Picture rendering */}
      <canvas
        ref={canvasRef}
        width={480}
        height={280}
        className="hidden"
      />

      {/* FLOATING WIDGET CONTAINER */}
      <div
        className={`fixed z-40 transition-all duration-300 pointer-events-auto select-none ${
          position === 'bottom-right'
            ? 'bottom-4 right-4 sm:bottom-6 sm:right-6'
            : position === 'bottom-left'
            ? 'bottom-4 left-4 sm:bottom-6 sm:left-6'
            : 'top-20 right-4 sm:top-24 sm:right-6'
        }`}
      >
        {isMinimized ? (
          /* MINIMIZED FLOATING PILL / SPEED DIAL BUBBLE */
          <div
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 p-2.5 sm:p-3 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md cursor-pointer hover:border-amber-400 hover:scale-105 transition-all ring-2 ring-black/40 group"
            title="Clique para expandir o Widget Rápido com os 4 comutadores"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${currentActivityConfig.badgeBg} border`}>
              {currentActivityConfig.icon}
            </div>

            <div className="flex flex-col pr-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${currentActivityConfig.textColor} uppercase tracking-wider`}>
                  {currentActivityConfig.label}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-sm font-extrabold text-white tabular-nums">
                  {formatSecondsToHMS(currentSeconds)}
                </span>
                <span className="text-[10px] text-slate-400">
                  Cond: {formatMinutes(compliance.dailyDrivingMinutes)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* EXPANDED FULL INTERACTIVE QUICK SWITCHER WIDGET */
          <div className="w-[330px] sm:w-[360px] rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-200">
            {/* Widget Header */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('widgetTitle')}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Floating Window / PiP Toggle Button */}
                <button
                  type="button"
                  onClick={handleTogglePiP}
                  title="Destacar em Janela Flutuante (Picture-in-Picture)"
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    isPiPActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">{t('floatingWindow')}</span>
                </button>

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title={t('minimize')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>

                {/* Close Widget */}
                <button
                  type="button"
                  onClick={onClose}
                  title={t('close')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Task Hero Bar */}
            <div className={`p-3.5 border-b border-slate-800/80 ${currentActivityConfig.activeBg} transition-colors`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-md ${currentActivityConfig.badgeBg}`}>
                    {currentActivityConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('activeActivity')}</span>
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{currentActivityConfig.label}</span>
                      <span className="text-[10px] font-normal text-slate-300">({currentActivityConfig.sublabel.split(',')[0]})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                    {formatSecondsToHMS(currentSeconds)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{t('liveDuration')}</div>
                </div>
              </div>

              {/* Context Limit info */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                {currentType === 'DRIVING' ? (
                  <>
                    <span className="text-slate-400">{t('remainingForBreak')}</span>
                    <strong className={`font-mono ${compliance.remainingContinuousDrivingMinutes <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatMinutes(compliance.remainingContinuousDrivingMinutes)}
                    </strong>
                  </>
                ) : currentType === 'REST' ? (
                  <>
                    <span className="text-slate-400">{t('currentBreak')}</span>
                    <strong className="text-indigo-300 font-mono">
                      {formatMinutes(compliance.currentBreakMinutes)} {compliance.currentBreakMinutes >= 45 ? t('breakFullDone') : compliance.currentBreakMinutes >= 15 ? t('breakStage1Done') : t('breakTargetHint')}
                    </strong>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400">{t('shiftAmplitude')}:</span>
                    <span className="font-mono text-white">
                      {formatMinutes(compliance.shiftElapsedMinutes)} / {formatMinutes(compliance.maxShiftAmplitudeMinutes)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 4 FAST TASK SWITCHES (Comutadores Rápidos) */}
            <div className="p-3 bg-slate-950/60">
              {/* Símbolos das Tarefas (Botões só com os símbolos) */}
              <div className="mb-2.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <div className="flex items-center justify-between px-1 mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Símbolos das Tarefas (1 Toque):</span>
                  <span className="text-emerald-400 font-mono">1 Toque</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {activities.map((act) => {
                    const isActive = act.type === currentType;
                    return (
                      <button
                        key={`sym-${act.type}`}
                        type="button"
                        onClick={() => {
                          if ('vibrate' in navigator) navigator.vibrate?.(30);
                          onSwitchActivity(act.type, `${act.label}`);
                        }}
                        title={`${act.label} (${act.symbol})`}
                        className={`py-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative ${
                          isActive
                            ? `${act.activeBg} ${act.activeBorder} shadow-md shadow-black/50 ring-2 ring-emerald-500/30 scale-[1.02]`
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-2xl leading-none">{act.symbol}</span>
                        {isActive && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('taskSwitches')}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">{t('instant')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {activities.map((act) => {
                  const isActive = act.type === currentType;
                  return (
                    <button
                      key={act.type}
                      type="button"
                      onClick={() => onSwitchActivity(act.type, `${act.label}`)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 relative overflow-hidden ${
                        isActive
                          ? `${act.activeBg} ${act.activeBorder} shadow-lg shadow-black/40`
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? act.badgeBg : 'bg-slate-800 text-slate-400'}`}>
                        {act.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {act.shortLabel}
                          </span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          Total: <strong className={isActive ? act.textColor : 'text-slate-300'}>{formatMinutes(act.totalMinutes)}</strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TOTALS OVERVIEW BAR (Contadores Totais para Cada Actividade) */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{t('todaysTotals')}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {compliance.crewType === 'MULTI_MANNING' ? `👥 ${t('multiManning')}` : `👤 ${t('singleDriver')}`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                {activities.map((act) => (
                  <div
                    key={act.type}
                    className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-800/80 flex flex-col"
                  >
                    <span className="text-[9px] text-slate-400 truncate">{act.shortLabel}</span>
                    <span className={`text-xs font-bold font-mono ${act.textColor} tabular-nums mt-0.5`}>
                      {formatMinutes(act.totalMinutes)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Position Switcher & PiP helper */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span>{t('position')}</span>
                  <button
                    onClick={() => setPosition('bottom-right')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${position === 'bottom-right' ? 'bg-slate-800 text-amber-400 font-bold' : 'hover:text-white'}`}
                  >
                    {t('bottomRight')}
                  </button>
                  <button
                    onClick={() => setPosition('bottom-left')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${position === 'bottom-left' ? 'bg-slate-800 text-amber-400 font-bold' : 'hover:text-white'}`}
                  >
                    {t('bottomLeft')}
                  </button>
                </div>

                <button
                  onClick={handleTogglePiP}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{t('pipWindow')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
