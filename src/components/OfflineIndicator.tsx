import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-md border border-amber-400 no-print animate-fade-in">
      <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
      <div>
        <span>Modo Offline Ativo</span>
        <span className="hidden sm:inline font-normal text-slate-900 ml-1">
          · Os registos e o tacógrafo funcionam a 100% sem cobertura de rede.
        </span>
      </div>
    </div>
  );
};
