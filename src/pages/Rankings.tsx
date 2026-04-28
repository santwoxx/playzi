import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Target, Star, Crown, Flame, Medal, Brain, Users } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { cn } from '../lib/utils';

export default function Rankings() {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
    return onSnapshot(q, (snapshot) => {
      setTopUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="pt-6 pb-nav min-h-screen bg-vibe-bg gaming-grid px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-black neon-text-purple tracking-tighter"
          >
            Hall da Fama
          </motion.h1>
          <p className="text-vibe-muted font-bold text-xs uppercase tracking-[0.3em] mt-2">Os maiores heróis do multiverso Playzi</p>
        </header>

        {/* Top 3 Podium */}
        {!loading && topUsers.length >= 3 && (
          <div className="flex items-end justify-center space-x-4 md:space-x-8 pt-12 pb-6">
            {/* 2nd Place */}
            <PodiumItem user={topUsers[1]} rank={2} height="h-32" color="silver" icon={<Shield className="w-6 h-6" />} />
            {/* 1st Place */}
            <PodiumItem user={topUsers[0]} rank={1} height="h-44" color="gold" icon={<Crown className="w-8 h-8" />} />
            {/* 3rd Place */}
            <PodiumItem user={topUsers[2]} rank={3} height="h-24" color="bronze" icon={<Star className="w-6 h-6" />} />
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="space-y-3">
           {topUsers.slice(3).map((user, idx) => (
             <motion.div 
               key={user.uid}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="vibe-card p-4 flex items-center justify-between hover:neon-border transition-all cursor-default group"
             >
                <div className="flex items-center space-x-4">
                   <div className="text-xl font-black italic opacity-20 w-8">#{idx + 4}</div>
                   <div className="relative">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.displayName || 'U')}&background=0D0E12&color=fff`} className="w-12 h-12 rounded-xl object-cover border-2 border-white/5" referrerPolicy="no-referrer" />
                      <div className="absolute -bottom-1 -right-1 bg-vibe-neon-blue text-vibe-bg text-[8px] font-black px-1.5 rounded-lg border-2 border-vibe-bg">
                         {user.level}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-vibe-text group-hover:text-vibe-neon-blue transition-colors uppercase">{user.nickname || user.displayName}</h4>
                      <p className="text-[10px] font-bold text-vibe-muted uppercase tracking-wider">{user.rankTitle}</p>
                   </div>
                </div>
                <div className="flex items-center space-x-6">
                   <div className="text-right">
                      <div className="text-xs font-black text-vibe-text">{user.xp} XP</div>
                      <div className="text-[10px] font-bold text-vibe-neon-purple uppercase">Global Rank</div>
                   </div>
                   <div className="p-2 bg-white/5 rounded-lg text-vibe-neon-pink opacity-40 group-hover:opacity-100 transition-opacity">
                      <Medal className="w-5 h-5" />
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Achievements Section */}
        <div className="pt-12">
            <h2 className="text-2xl font-black mb-6 flex items-center">
               <Flame className="w-6 h-6 mr-2 text-vibe-neon-pink" />
               Conquistas Raras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <AchievementCard 
                 title="First Blood" 
                 desc="A primeira kill nos arcade games" 
                 rarity="common" 
                 icon={<Zap className="w-6 h-6 text-yellow-400" />}
               />
               <AchievementCard 
                 title="Gamer Social" 
                 desc="Conquiste 50 amigos únicos" 
                 rarity="epic" 
                 icon={<Users className="w-6 h-6 text-vibe-neon-purple" />}
               />
               <AchievementCard 
                 title="Mestre do Quiz" 
                 desc="Acerte 100 perguntas seguidas" 
                 rarity="legendary" 
                 icon={<Brain className="w-6 h-6 text-vibe-neon-blue" />}
               />
               <AchievementCard 
                 title="Duo Perfeito" 
                 desc="Vença 10 partidas de RPS online" 
                 rarity="rare" 
                 icon={<Flame className="w-6 h-6 text-vibe-neon-pink" />}
               />
            </div>
        </div>
      </div>
    </div>
  );
}

function PodiumItem({ user, rank, height, color, icon }: { user: User, rank: number, height: string, color: string, icon: any }) {
  const glowClass = color === 'gold' ? 'shadow-vibe-neon-blue/40 border-vibe-neon-blue' : 
                    color === 'silver' ? 'shadow-white/10 border-white/20' : 
                    'shadow-vibe-neon-pink/20 border-vibe-neon-pink/40';

  return (
    <div className="flex flex-col items-center flex-1">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: rank * 0.2 }}
        className="relative group mb-4"
      >
        <div className={cn(
          "w-20 h-20 md:w-28 md:h-28 rounded-3xl overflow-hidden border-4 bg-vibe-bg rotate-3 transition-transform group-hover:rotate-0",
          glowClass
        )}>
           <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.displayName || 'U')}&background=0D0E12&color=fff`} className="w-full h-full object-cover -rotate-3 group-hover:rotate-0 transition-transform scale-110" referrerPolicy="no-referrer" />
        </div>
        <div className={cn(
          "absolute -top-6 left-1/2 -translate-x-1/2 p-2 rounded-xl shadow-xl animate-bounce",
          color === 'gold' ? "bg-vibe-gradient text-white" : "bg-white/10 text-white"
        )}>
          {icon}
        </div>
      </motion.div>
      <div className="text-center mb-4">
         <h4 className="text-sm font-black text-white truncate max-w-[100px]">{user.nickname || user.displayName}</h4>
         <p className="text-[10px] font-bold text-vibe-neon-blue">{user.level} LVL</p>
      </div>
      <div className={cn(
        "w-full rounded-t-3xl relative flex items-center justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
        height,
        color === 'gold' ? "bg-vibe-gradient opacity-100" : "bg-white/5 opacity-60"
      )}>
         <span className="text-4xl font-black italic text-white/20">#{rank}</span>
      </div>
    </div>
  )
}

function AchievementCard({ title, desc, rarity, icon }: { title: string, desc: string, rarity: string, icon: any }) {
  return (
    <div className="vibe-card p-5 flex items-center space-x-4 hover:neon-border-purple transition-all group">
       <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
          {icon}
       </div>
       <div>
          <div className="flex items-center space-x-3 mb-1">
             <h4 className="text-sm font-black text-white">{title}</h4>
             <span className={cn(
               "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
               rarity === 'legendary' ? "bg-vibe-gradient text-white" : "bg-white/10 text-vibe-muted"
             )}>{rarity}</span>
          </div>
          <p className="text-xs text-vibe-muted font-medium">{desc}</p>
       </div>
    </div>
  )
}
