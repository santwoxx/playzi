import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Dices, GraduationCap, Brain, Target, Swords, Image, Globe, Award, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface NewsItem {
  id: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: 'blue' | 'pink' | 'purple' | 'yellow';
  badges?: string[];
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    title: "Seu Progresso",
    desc: "Vitórias: 5 | Selo Streak: Ativo | 150 Tickets",
    icon: <Trophy className="w-5 h-5" />,
    color: 'yellow',
    badges: ['Stats']
  },
  {
    id: 2,
    title: "Tryhard Academy",
    desc: "Entre na academia dos pro-players e domine o cenário. (+100 XP)",
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'blue',
    badges: ['Solo', 'Online']
  },
  {
    id: 3,
    title: "Gamer Quiz",
    desc: "Teste seus conhecimentos sobre o mundo dos games. (+50 XP)",
    icon: <Brain className="w-5 h-5" />,
    color: 'purple',
    badges: ['1-4 Players']
  },
  {
    id: 4,
    title: "Desafio Reflexo",
    desc: "Quem é o mais rápido no gatilho? (+75 XP)",
    icon: <Zap className="w-5 h-5" />,
    color: 'pink',
    badges: ['Duelo 1v1']
  },
  {
    id: 5,
    title: "Jokenpô Neo",
    desc: "Pedra, papel ou tesoura em tempo real. (+30 XP)",
    icon: <Swords className="w-5 h-5" />,
    color: 'blue',
    badges: ['Duelo 1v1']
  },
  {
    id: 6,
    title: "Adivinhe o Jogo",
    desc: "Descubra qual é o jogo pela imagem pixelada. (+40 XP)",
    icon: <Image className="w-5 h-5" />,
    color: 'purple',
    badges: ['Solo', 'Co-op']
  },
  {
    id: 7,
    title: "Chat Global",
    desc: "Converse com todos os jogadores em tempo real.",
    icon: <Globe className="w-5 h-5" />,
    color: 'blue',
    badges: ['Social Hub']
  },
  {
    id: 8,
    title: "Torneio de Reflexo",
    desc: "Prêmio: 5,000 Moedas + Medalha Pro. Participe já!",
    icon: <Award className="w-5 h-5" />,
    color: 'yellow',
    badges: ['48 Inscritos']
  }
];

export default function AnnouncementTicker() {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 means hidden
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const CYCLE_INTERNAL_MS = 5 * 60 * 1000; // 5 minutes
    const ITEM_DURATION_MS = 6000; // How long each news item stays visible

    const startCycling = () => {
      let index = 0;
      
      const showNextItem = () => {
        if (index < NEWS_ITEMS.length) {
          setCurrentIndex(index);
          setIsVisible(true);
          
          setTimeout(() => {
            setIsVisible(false);
            index++;
            // Wait for exit animation then show next
            setTimeout(showNextItem, 1000);
          }, ITEM_DURATION_MS);
        } else {
          setCurrentIndex(-1); // Done with the sequence
        }
      };

      showNextItem();
    };

    // First run after 30 seconds
    const initialDelay = setTimeout(startCycling, 30000);

    // Then repeat every 5 minutes
    const interval = setInterval(startCycling, CYCLE_INTERNAL_MS);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  if (currentIndex === -1) return null;

  const currentItem = NEWS_ITEMS[currentIndex];

  return (
    <div className="fixed top-20 right-4 z-[100] max-w-[280px] w-full pointer-events-none">
      <AnimatePresence mode="wait">
        {isVisible && currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ x: 300, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -20, opacity: 0, scale: 0.95 }}
            className={cn(
              "vibe-card p-4 border shadow-2xl pointer-events-auto bg-vibe-card/90 backdrop-blur-xl relative overflow-hidden group",
              currentItem.color === 'blue' && "border-vibe-neon-blue/30 shadow-vibe-neon-blue/20",
              currentItem.color === 'pink' && "border-vibe-neon-pink/30 shadow-vibe-neon-pink/20",
              currentItem.color === 'purple' && "border-vibe-neon-purple/30 shadow-vibe-neon-purple/20",
              currentItem.color === 'yellow' && "border-yellow-500/30 shadow-yellow-500/20"
            )}
          >
            {/* Progress bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 6, ease: "linear" }}
              className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-current opacity-30",
                currentItem.color === 'blue' && "text-vibe-neon-blue",
                currentItem.color === 'pink' && "text-vibe-neon-pink",
                currentItem.color === 'purple' && "text-vibe-neon-purple",
                currentItem.color === 'yellow' && "text-yellow-500"
              )}
            />

            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-2.5 rounded-xl bg-white/5 shadow-inner",
                currentItem.color === 'blue' && "text-vibe-neon-blue",
                currentItem.color === 'pink' && "text-vibe-neon-pink",
                currentItem.color === 'purple' && "text-vibe-neon-purple",
                currentItem.color === 'yellow' && "text-yellow-500"
              )}>
                {currentItem.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Novidade</h4>
                  <div className="flex space-x-1">
                    {currentItem.badges?.map(badge => (
                      <span key={badge} className="text-[8px] font-black uppercase bg-white/10 px-1.5 py-0.5 rounded text-white/60">{badge}</span>
                    ))}
                  </div>
                </div>
                <h3 className="text-sm font-black text-white tracking-tight uppercase leading-none mt-1">
                  {currentItem.title}
                </h3>
                <p className="text-[10px] text-vibe-muted font-bold leading-relaxed mt-2 uppercase tracking-tight">
                  {currentItem.desc}
                </p>
              </div>
            </div>

            {/* Background sparkle */}
            <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
