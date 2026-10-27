import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trophy, Zap, ChevronRight, ChevronLeft, X, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface NotificationEvent {
  id: string;
  title: string;
  description: string;
  type: 'tournament' | 'challenge' | 'system';
  link: string;
  startTime: Date;
  isLive: boolean;
}

export default function NotificationBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<NotificationEvent[]>([
    {
      id: '1',
      title: t('notif_tournament'),
      description: t('notif_tournament_desc'),
      type: 'tournament',
      link: '/arcade',
      startTime: new Date(Date.now() + 30 * 60000),
      isLive: false,
    },
    {
      id: '2',
      title: t('notif_challenge'),
      description: t('notif_challenge_desc'),
      type: 'challenge',
      link: '/rankings',
      startTime: new Date(),
      isLive: true,
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return localStorage.getItem('playzi_notif_bar_closed') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setEvents([
      {
        id: '1',
        title: t('notif_tournament'),
        description: t('notif_tournament_desc'),
        type: 'tournament',
        link: '/arcade',
        startTime: new Date(Date.now() + 30 * 60000),
        isLive: false,
      },
      {
        id: '2',
        title: t('notif_challenge'),
        description: t('notif_challenge_desc'),
        type: 'challenge',
        link: '/rankings',
        startTime: new Date(),
        isLive: true,
      }
    ]);
  }, [t]);

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [events]);

  const hiddenPaths = ['/watch', '/reels', '/jogar-agora', '/create', '/login', '/onboarding', '/chat'];
  if (!isVisible || events.length === 0 || hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  const currentEvent = events[currentIndex];

  const handleAction = () => {
    navigate(currentEvent.link);
  };

  const nextEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const prevEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    try {
      localStorage.setItem('playzi_notif_bar_closed', 'true');
    } catch {}
  };

  const getIcon = (type: string) => {
    const size = "w-4 h-4";
    switch (type) {
      case 'tournament': return <Trophy className={cn(size, "text-vibe-neon-blue")} />;
      case 'challenge': return <Zap className={cn(size, "text-vibe-neon-pink")} />;
      default: return <Bell className={cn(size, "text-vibe-neon-purple")} />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-1 pb-2 transition-all">
      <div className="bg-[#0c0d15]/90 backdrop-blur-md border border-white/10 hover:border-vibe-neon-blue/30 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between shadow-lg relative overflow-hidden group">
        {/* Glow accent */}
        <div className={cn(
          "absolute -top-10 -right-10 w-24 h-24 blur-2xl rounded-full pointer-events-none transition-colors duration-700 opacity-20",
          currentEvent.type === 'tournament' ? "bg-vibe-neon-blue" : "bg-vibe-neon-pink"
        )} />

        <div className="flex-1 flex items-center overflow-hidden mr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent.id}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3 cursor-pointer w-full"
              onClick={handleAction}
            >
              <div className={cn(
                "flex-shrink-0 p-2 rounded-xl border transition-colors",
                currentEvent.type === 'tournament' 
                  ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/20 text-vibe-neon-blue" 
                  : "bg-vibe-neon-pink/10 border-vibe-neon-pink/20 text-vibe-neon-pink"
              )}>
                {getIcon(currentEvent.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                    currentEvent.type === 'tournament' ? "bg-vibe-neon-blue/15 text-vibe-neon-blue" : "bg-vibe-neon-pink/15 text-vibe-neon-pink"
                  )}>
                    {currentEvent.type === 'tournament' ? '🏆 Torneio' : '⚡ Desafio'}
                  </span>
                  <h4 className="text-xs font-black uppercase tracking-tight text-white truncate">
                    {currentEvent.title}
                  </h4>
                  {currentEvent.isLive ? (
                    <span className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black uppercase rounded-full border border-red-500/30">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span>{t('notif_live')}</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center space-x-1 text-[8px] font-bold text-vibe-muted uppercase bg-white/5 px-1.5 py-0.5 rounded">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{Math.round((currentEvent.startTime.getTime() - Date.now()) / 60000)}m</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-vibe-muted font-medium truncate mt-0.5">
                  {currentEvent.description}
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-1 text-vibe-neon-blue text-[10px] font-black uppercase tracking-wider shrink-0 group-hover:translate-x-0.5 transition-transform">
                <span>Acessar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1 text-vibe-muted shrink-0">
          {events.length > 1 && (
            <div className="hidden sm:flex items-center space-x-0.5 bg-white/5 rounded-lg px-1 py-0.5 border border-white/5">
              <button 
                onClick={prevEvent} 
                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button 
                onClick={nextEvent} 
                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Próximo"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <button 
            onClick={handleDismiss}
            className="p-1.5 text-vibe-muted hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Fechar banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

