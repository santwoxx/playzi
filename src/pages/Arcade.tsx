import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, Users, Zap, Target, Swords, Brain, Dices, X, ExternalLink, Play, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const MINIGAMES = (t: any) => [
  { 
    id: 'tryhard-academy', 
    title: t('tryhard_title'), 
    icon: <div className="w-full h-full rounded-xl overflow-hidden"><img src="https://i.ibb.co/zhg66wWn/logosauah.jpg" className="w-full h-full object-cover" /></div>, 
    color: 'blue', 
    desc: t('tryhard_desc'),
    players: 'Solo / Online',
    xp: '+100 XP',
    isExternal: true,
    url: 'https://tryhardacademyoficial.vercel.app'
  },
  { 
    id: 'quiz', 
    title: 'Gamer Quiz', 
    icon: <Brain className="w-8 h-8" />, 
    color: 'blue', 
    desc: t('quiz_desc', 'Teste seus conhecimentos sobre o mundo dos games.'),
    players: '1-4 Players',
    xp: '+50 XP'
  },
  { 
    id: 'reflex', 
    title: 'Desafio Reflexo', 
    icon: <Zap className="w-8 h-8" />, 
    color: 'pink', 
    desc: t('reflex_desc', 'Quem é o mais rápido no gatilho?'),
    players: 'Duelo 1v1',
    xp: '+75 XP'
  },
  { 
    id: 'rps', 
    title: 'Jokenpô Neo', 
    icon: <Swords className="w-8 h-8" />, 
    color: 'purple', 
    desc: t('rps_desc', 'Pedra, papel ou tesoura em tempo real.'),
    players: 'Duelo 1v1',
    xp: '+30 XP'
  },
  { 
    id: 'guess', 
    title: 'Adivinhe o Jogo', 
    icon: <Target className="w-8 h-8" />, 
    color: 'blue', 
    desc: t('guess_desc', 'Descubra qual é o jogo pela imagem pixelada.'),
    players: 'Solo / Co-op',
    xp: '+40 XP'
  },
  { 
    id: 'global-chat', 
    title: 'Chat Global', 
    icon: <Globe className="w-8 h-8" />, 
    color: 'blue', 
    desc: 'Converse com todos os jogadores em tempo real.',
    players: 'Social',
    xp: 'Social Hub',
    isGlobalChat: true
  }
];

export default function Arcade() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const minigames = MINIGAMES(t);

  return (
    <div className="pt-6 pb-nav min-h-screen gaming-grid px-6 relative">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black neon-text-blue tracking-tighter"
          >
            {t('playzi_arcade')}
          </motion.h1>
          <p className="text-vibe-muted font-bold text-xs uppercase tracking-[0.3em] mt-2">{t('real_time_duels')}</p>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<Trophy className="w-4 h-4" />} label={t('victories')} value={currentUser?.victories?.toString() || '12'} color="blue" />
          <StatCard icon={<Zap className="w-4 h-4" />} label={t('streak')} value={currentUser?.streak?.toString() || '5'} color="pink" />
          <StatCard icon={<Dices className="w-4 h-4" />} label={t('tickets')} value={currentUser?.tickets?.toString() || '150'} color="purple" />
        </div>

        {/* Game List */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {minigames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if ((game as any).isExternal && (game as any).url) {
                  window.open((game as any).url, '_blank');
                } else if ((game as any).isGlobalChat) {
                  navigate('/chat/global');
                } else {
                  navigate(`/arcade/${game.id}`);
                }
              }}
              className={cn(
                "vibe-card p-4 sm:p-6 cursor-pointer group relative overflow-hidden flex flex-col items-center text-center",
                game.color === 'blue' ? "hover:neon-border" : 
                game.color === 'pink' ? "hover:neon-border-purple" : "hover:neon-border-purple"
              )}
            >
              <div className="relative z-10 flex flex-col items-center space-y-3 w-full">
                <div className={cn(
                  "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all",
                  game.color === 'blue' ? "bg-vibe-neon-blue/20 text-vibe-neon-blue" :
                  game.color === 'pink' ? "bg-vibe-neon-pink/20 text-vibe-neon-pink" : "bg-vibe-neon-purple/20 text-vibe-neon-purple"
                )}>
                  {game.icon}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-lg font-black uppercase tracking-tight line-clamp-1">{game.title}</h3>
                  <p className="text-[9px] sm:text-xs text-vibe-muted font-bold uppercase tracking-tight line-clamp-2">{game.desc}</p>
                </div>

                <div className="flex flex-col items-center pt-2 border-t border-white/5 w-full">
                  <div className="text-[8px] font-black uppercase tracking-widest text-vibe-muted mb-0.5">{game.players}</div>
                  <div className="text-[9px] font-black text-vibe-neon-blue">{game.xp}</div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12">
                {game.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tournament Banner */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="vibe-card p-8 bg-vibe-gradient text-white flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 relative overflow-hidden shadow-2xl shadow-vibe-neon-purple/30"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{t('tournament')} de Reflexo</h2>
            <p className="font-bold opacity-80 text-sm mt-1">Prêmio: 5,000 Moedas + Medalha Pro</p>
            <div className="flex items-center space-x-4 mt-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden">
                    <img src={`https://picsum.photos/seed/p${i}/32/32`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">48 Inscritos</span>
            </div>
          </div>
          <button className="relative z-10 bg-white text-vibe-neon-purple px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
            {t('join_tournament')}
          </button>
          
          {/* Animated background circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="vibe-card p-4 flex flex-col items-center justify-center space-y-1">
      <div className={cn(
        "p-2 rounded-lg bg-white/5",
        color === 'blue' ? "text-vibe-neon-blue" : color === 'pink' ? "text-vibe-neon-pink" : "text-vibe-neon-purple"
      )}>
        {icon}
      </div>
      <div className="text-xl font-black text-vibe-text">{value}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-vibe-muted">{label}</div>
    </div>
  );
}
