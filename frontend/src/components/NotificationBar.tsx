import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trophy, Zap, ChevronRight, ChevronLeft, Minus, X, Clock } from 'lucide-react';
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sessionStorage.getItem('playzi_notif_bar_closed') !== 'true';
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
    }, 6000);
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
      sessionStorage.setItem('playzi_notif_bar_closed', 'true');
    } catch {}
  };

  const getIcon = (type: string, isDesktop = false) => {
    const size = isDesktop ? "w-5 h-5" : "w-4 h-4";
    switch (type) {
      case 'tournament': return <Trophy className={cn(size, "text-vibe-neon-blue")} />;
      case 'challenge': return <Zap className={cn(size, "text-vibe-neon-pink")} />;
      default: return <Bell className={cn(size, "text-vibe-neon-purple")} />;
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* PC DESKTOP LAYOUT (lg:): Floating Gaming HUD Widget (Top-Right) */}
      {/* Nunca fica na frente da foto de perfil / feed central          */}
      {/* ============================================================== */}
      {isMinimized ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="hidden lg:flex fixed top-6 right-8 z-30 bg-[#0c0d15]/95 backdrop-blur-xl border border-white/10 hover:border-vibe-neon-blue/50 rounded-full px-3.5 py-2 shadow-2xl items-center space-x-2.5 cursor-pointer group transition-all"
          onClick={() => setIsMinimized(false)}
          title="Clique para expandir notificação de evento"
        >
          <div className="w-2 h-2 rounded-full bg-vibe-neon-blue animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white">
            {currentEvent.type === 'tournament' ? '🏆 Torneio' : '⚡ Desafio'}
          </span>
          <span className="text-[9px] font-bold text-vibe-muted">
            {currentEvent.isLive ? 'AO VIVO' : `${Math.round((currentEvent.startTime.getTime() - Date.now()) / 60000)}m`}
          </span>
          <button
            onClick={handleDismiss}
            className="ml-1 p-0.5 text-vibe-muted hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          className="hidden lg:block fixed top-6 right-8 w-80 xl:w-[340px] z-30 bg-[#0c0d15]/95 backdrop-blur-2xl border border-white/10 hover:border-vibe-neon-blue/40 rounded-2xl p-4 shadow-[0_15px_45px_rgba(0,0,0,0.7)] relative overflow-hidden group transition-all"
        >
          {/* Ambient Glow */}
          <div className={cn(
            "absolute -top-12 -right-12 w-28 h-28 blur-3xl rounded-full pointer-events-none transition-colors duration-700",
            currentEvent.type === 'tournament' ? "bg-vibe-neon-blue/20" : "bg-vibe-neon-pink/20"
          )} />

          {/* Header: Tag + Timer + Controls */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center space-x-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                currentEvent.type === 'tournament' 
                  ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/30 text-vibe-neon-blue shadow-[0_0_12px_rgba(0,242,255,0.2)]" 
                  : "bg-vibe-neon-pink/10 border-vibe-neon-pink/30 text-vibe-neon-pink shadow-[0_0_12px_rgba(255,0,128,0.2)]"
              )}>
                {currentEvent.type === 'tournament' ? '🏆 Torneio' : '⚡ Desafio'}
              </span>
              {currentEvent.isLive ? (
                <span className="flex items-center space-x-1 px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded-full animate-pulse border border-red-500/30">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <span>{t('notif_live')}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[9px] font-black text-vibe-muted uppercase bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{Math.round((currentEvent.startTime.getTime() - Date.now()) / 60000)}m</span>
                </span>
              )}
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center space-x-1 text-vibe-muted">
              {events.length > 1 && (
                <div className="flex items-center space-x-0.5 mr-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/5">
                  <button 
                    onClick={prevEvent} 
                    className="p-0.5 hover:text-white rounded hover:bg-white/10 transition-colors"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[9px] font-bold text-white/50 px-1">{currentIndex + 1}/{events.length}</span>
                  <button 
                    onClick={nextEvent} 
                    className="p-0.5 hover:text-white rounded hover:bg-white/10 transition-colors"
                    title="Próximo"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                title="Minimizar"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button 
                onClick={handleDismiss}
                className="p-1 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Fechar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Body: Clickable */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={handleAction} 
              className="flex items-start space-x-3 cursor-pointer group/card relative z-10"
            >
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover/card:scale-105",
                currentEvent.type === 'tournament' 
                  ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/30 text-vibe-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.15)]" 
                  : "bg-vibe-neon-pink/10 border-vibe-neon-pink/30 text-vibe-neon-pink shadow-[0_0_15px_rgba(255,0,128,0.15)]"
              )}>
                {getIcon(currentEvent.type, true)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-black uppercase text-white tracking-tight leading-snug group-hover/card:text-vibe-neon-blue transition-colors line-clamp-1">
                  {currentEvent.title}
                </h3>
                <p className="text-[11px] text-vibe-muted font-medium leading-relaxed mt-1 line-clamp-2">
                  {currentEvent.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action CTA Button */}
          <button
            onClick={handleAction}
            className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-vibe-neon-blue/20 to-vibe-neon-purple/20 hover:from-vibe-neon-blue/30 hover:to-vibe-neon-purple/30 border border-vibe-neon-blue/30 hover:border-vibe-neon-blue/60 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(0,242,255,0.1)] group/btn"
          >
            <span>{currentEvent.type === 'tournament' ? 'Entrar no Torneio' : 'Ver Desafio'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-vibe-neon-blue group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* MOBILE LAYOUT (< lg): Compact In-Flow Banner                  */}
      {/* ============================================================== */}
      <div className="lg:hidden w-full max-w-2xl mx-auto px-3 sm:px-4 pt-2 pb-1 transition-all z-20">
        <div className="bg-vibe-card/90 backdrop-blur-md border border-white/10 hover:border-vibe-neon-blue/40 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="flex-1 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentEvent.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                className="flex items-center space-x-3 cursor-pointer w-full"
                onClick={handleAction}
              >
                <div className="flex-shrink-0 p-2 bg-white/5 rounded-xl border border-white/5">
                  {getIcon(currentEvent.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-vibe-text truncate">
                      {currentEvent.title}
                    </h4>
                    {currentEvent.isLive ? (
                      <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span>{t('notif_live')}</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[8px] font-black text-vibe-muted uppercase">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{Math.round((currentEvent.startTime.getTime() - Date.now()) / 60000)}m</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-vibe-muted font-bold truncate">
                    {currentEvent.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-vibe-muted group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </motion.div>
            </AnimatePresence>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="ml-3 p-1.5 text-vibe-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

