import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trophy, Zap, ChevronRight, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic setup if events are static but translated
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

  if (!isVisible || events.length === 0) return null;

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
    <div className="fixed top-16 left-0 right-0 z-40 bg-vibe-card/80 backdrop-blur-md border-b border-vibe-border">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between min-h-[48px]">
        <div className="flex-1 flex items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center space-x-3 cursor-pointer w-full"
              onClick={handleAction}
            >
              <div className="flex-shrink-0 p-1.5 bg-vibe-bg rounded-lg border border-vibe-border">
                {getIcon(currentEvent.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-vibe-text truncate">
                    {currentEvent.title}
                  </h4>
                  {currentEvent.isLive ? (
                    <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-red-500/20 text-red-500 text-[7px] font-black uppercase rounded animate-pulse">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      <span>{t('notif_live')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[8px] font-black text-vibe-muted uppercase">
                      <Clock className="w-2 h-2" />
                      <span>{Math.round((currentEvent.startTime.getTime() - Date.now()) / 60000)}m</span>
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-vibe-muted font-bold truncate">
                  {currentEvent.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-vibe-muted flex-shrink-0" />
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 text-vibe-muted hover:text-vibe-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
