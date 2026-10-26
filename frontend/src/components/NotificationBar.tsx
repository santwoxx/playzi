import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trophy, Zap, ChevronRight, X, Clock } from 'lucide-react';
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
    }, 5000);
    return () => clearInterval(timer);
  }, [events]);

  const hiddenPaths = ['/watch', '/reels', '/jogar-agora', '/create', '/login', '/onboarding', '/chat'];
  if (!isVisible || events.length === 0 || hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  const currentEvent = events[currentIndex];

  const handleAction = () => {
    navigate(currentEvent.link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tournament': return <Trophy className="w-4 h-4 text-vibe-neon-blue" />;
      case 'challenge': return <Zap className="w-4 h-4 text-vibe-neon-pink" />;
      default: return <Bell className="w-4 h-4 text-vibe-neon-purple" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-2 pb-1 transition-all z-20">
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
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            try {
              sessionStorage.setItem('playzi_notif_bar_closed', 'true');
            } catch {}
          }}
          className="ml-3 p-1.5 text-vibe-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
