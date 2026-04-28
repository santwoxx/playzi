import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Community } from '../types';
import { motion } from 'motion/react';
import { Gamepad, Search, Users, ChevronRight, MessageCircle, Mic } from 'lucide-react';

const COMMUNITY_CATEGORIES = [
  { id: 'freefire', name: 'Free Fire', logo: 'https://i.ibb.co/mVw25trf/ff-logo.png', desc: 'A maior comunidade mobile' },
  { id: 'roblox', name: 'Roblox', logo: 'https://i.ibb.co/Q7PT39JL/logoroblox.png', desc: 'Crie e jogue com amigos' },
  { id: 'minecraft', name: 'Minecraft', logo: 'https://i.ibb.co/M55fSgjS/minelogo.png', desc: 'Construção e aventura' },
  { id: 'dating', name: 'Namoro', logo: 'https://i.ibb.co/XrHdBQb5/namoro-logo.png', desc: 'Encontre o player 2 do seu coração', trending: true },
  { id: 'friendship', name: 'Amizade', logo: 'https://i.ibb.co/NdkQ5dcY/amizade.jpg', desc: 'Sua nova família gamer te espera' }
];

export default function Communities() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = COMMUNITY_CATEGORIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-20 pb-20 px-4 md:pt-24 min-h-screen bg-vibe-bg">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black text-vibe-text tracking-tighter neon-text-blue mb-2">Comunidades</h1>
          <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest">Encontre seu squad e domine o jogo</p>
        </header>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vibe-muted" />
          <input 
            type="text" 
            placeholder="Buscar comunidades ou jogos..."
            className="w-full bg-white/5 border border-vibe-border rounded-2xl py-4 pl-12 pr-4 focus:neon-border outline-none transition-all placeholder:text-vibe-muted font-bold text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/communities/${cat.id}`)}
              className="vibe-card p-6 cursor-pointer group hover:neon-border transition-all relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform select-none">
                <img src={cat.logo} className="w-full h-full object-contain grayscale invert" referrerPolicy="no-referrer" />
              </div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-vibe-bg border border-vibe-border p-2 group-hover:neon-border transition-all">
                    <img src={cat.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-black tracking-tight">{cat.name}</h3>
                      {(cat as any).trending && (
                        <div className="bg-vibe-neon-pink p-[1px] rounded-md animate-pulse">
                          <div className="bg-vibe-bg px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase text-vibe-neon-pink">Trending</div>
                        </div>
                      )}
                      {(cat as any).premium && (
                        <div className="bg-vibe-gradient p-[1px] rounded-md">
                          <div className="bg-vibe-bg px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase text-vibe-neon-blue">Diamond</div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-vibe-muted font-medium">{cat.desc}</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-vibe-bg overflow-hidden">
                      <img src={`https://picsum.photos/seed/cat${cat.id}${i}/40/40`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-vibe-bg bg-vibe-border flex items-center justify-center text-[10px] font-black">
                    +1k
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-[10px] uppercase font-black tracking-widest text-vibe-neon-blue">
                    <div className="w-1.5 h-1.5 rounded-full bg-vibe-neon-blue mr-1.5 animate-pulse" />
                    24 Online
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="absolute bottom-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                 <div className="p-2 bg-vibe-neon-blue/20 rounded-lg text-vibe-neon-blue">
                   <MessageCircle className="w-4 h-4" />
                 </div>
                 <div className="p-2 bg-vibe-neon-pink/20 rounded-lg text-vibe-neon-pink">
                   <Mic className="w-4 h-4" />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
