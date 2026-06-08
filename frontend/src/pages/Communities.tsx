import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { collection, getDocs, addDoc, serverTimestamp, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Community } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad, Search, Users, ChevronRight, MessageCircle, Mic, Plus, X, Sparkles, Globe } from 'lucide-react';

const COMMUNITY_CATEGORIES = [
  { id: 'freefire', name: 'Free Fire', logo: 'https://i.ibb.co/mVw25trf/ff-logo.png', desc: 'A maior comunidade mobile' },
  { id: 'roblox', name: 'Roblox', logo: 'https://i.ibb.co/Q7PT39JL/logoroblox.png', desc: 'Crie e jogue com amigos' },
  { id: 'minecraft', name: 'Minecraft', logo: 'https://i.ibb.co/M55fSgjS/minelogo.png', desc: 'Construção e aventura' },
  { id: 'dating', name: 'Namoro', logo: 'https://i.ibb.co/XrHdBQb5/namoro-logo.png', desc: 'Encontre o player 2 do seu coração', trending: true },
  { id: 'friendship', name: 'Amizade', logo: 'https://i.ibb.co/NdkQ5dcY/amizade.jpg', desc: 'Sua nova família gamer te espera' }
];

export default function Communities() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'friendship'
  });

  const [userCommunities, setUserCommunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserCommunities = async () => {
      const q = query(collection(db, 'communities'), limit(20));
      const snap = await getDocs(q);
      setUserCommunities(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    };
    fetchUserCommunities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCommunity.name) return;
    
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'communities'), {
        ...newCommunity,
        ownerId: currentUser.uid,
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
        icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(newCommunity.name)}&background=0D0E12&color=fff`
      });
      setShowCreateModal(false);
      navigate(`/communities/${docRef.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = COMMUNITY_CATEGORIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const communitiesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Comunidades Gamer Playzi",
    "description": "Encontre grupos de WhatsApp e comunidades de Free Fire, Roblox e Minecraft.",
    "url": "https://playzi.app.br/communities",
    "itemListElement": COMMUNITY_CATEGORIES.map((cat, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://playzi.app.br/comunidades/${cat.id}`,
      "name": cat.name
    }))
  };

  return (
    <div className="pt-20 pb-20 px-4 md:pt-24 min-h-screen bg-vibe-bg gaming-grid">
      <SEO 
        title="Comunidades Gamer - Grupos de Free Fire, Roblox e Minecraft" 
        description="Encontre e participe de comunidades exclusivas de Free Fire, Roblox, Minecraft, GTA RP e mais. Conecte-se com squads, encontre novos amigos para jogar e compartilhe experiencias gamers no Brasil." 
        keywords="comunidades gamer, grupos free fire, comunidades roblox, squad minecraft, cla de jogos, encontrar jogadores"
        url="https://playzi.app.br/communities"
        schema={communitiesSchema}
        breadcrumbs={[
          { name: 'Comunidades', url: '/communities' }
        ]}
      />
      
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-vibe-text tracking-tighter neon-text-blue mb-2">Comunidades</h1>
            <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest">Encontre seu squad e domine o jogo</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-4 bg-vibe-neon-blue text-vibe-bg rounded-2xl shadow-glow-blue hover:scale-105 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </header>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vibe-muted" />
          <input 
            type="text" 
            placeholder="Buscar comunidades ou jogos..."
            className="w-full bg-white/5 border border-vibe-border rounded-2xl py-5 pl-12 pr-4 focus:neon-border outline-none transition-all placeholder:text-vibe-muted font-bold text-sm text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="w-5 h-5 text-vibe-neon-blue animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-vibe-muted">Categorias Oficiais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((cat, idx) => (
              <CommunityCard 
                key={cat.id} 
                id={cat.id} 
                name={cat.name} 
                logo={cat.logo} 
                desc={cat.desc} 
                trending={(cat as any).trending} 
                idx={idx}
                onClick={() => navigate(`/comunidades/${cat.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Communities Section */}
        {userCommunities.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-5 h-5 text-vibe-neon-purple animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-vibe-muted">Comunidades da Galera</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCommunities.map((comm, idx) => (
                <CommunityCard 
                  key={comm.id} 
                  id={comm.id} 
                  name={comm.name} 
                  logo={comm.icon} 
                  desc={comm.description} 
                  idx={idx}
                  membersCount={comm.members?.length}
                  onClick={() => navigate(`/communities/${comm.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="vibe-card w-full max-w-md p-8 relative z-10 border-vibe-neon-blue/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-vibe-neon-blue/10 rounded-xl">
                    <Users className="w-6 h-6 text-vibe-neon-blue" />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Novo Grupo</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Nome da Comunidade</label>
                  <input 
                    type="text"
                    required
                    maxLength={30}
                    placeholder="Ex: Squad Elite FF"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:neon-border transition-all"
                    value={newCommunity.name}
                    onChange={e => setNewCommunity({...newCommunity, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Descrição</label>
                  <textarea 
                    rows={3}
                    placeholder="O que acontece aqui?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:neon-border transition-all resize-none"
                    value={newCommunity.description}
                    onChange={e => setNewCommunity({...newCommunity, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Categoria Principal</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:neon-border transition-all appearance-none"
                    value={newCommunity.category}
                    onChange={e => setNewCommunity({...newCommunity, category: e.target.value})}
                  >
                    <option value="friendship" className="bg-vibe-bg">Amizade</option>
                    <option value="dating" className="bg-vibe-bg">Namoro</option>
                    <option value="competitive" className="bg-vibe-bg">Competitivo</option>
                    <option value="casual" className="bg-vibe-bg">Casual</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-vibe-neon-blue text-vibe-bg rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-glow-blue disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-vibe-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Criar Comunidade</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommunityCard({ id, name, logo, desc, trending, idx, membersCount, onClick }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className="vibe-card p-6 cursor-pointer group hover:neon-border transition-all relative overflow-hidden"
    >
      <div className="absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform select-none">
        <img src={logo} className="w-full h-full object-contain grayscale invert" referrerPolicy="no-referrer" />
      </div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-vibe-bg border border-vibe-border p-2 group-hover:neon-border transition-all">
            <img src={logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black tracking-tight text-white">{name}</h3>
              {trending && (
                <div className="bg-vibe-neon-pink p-[1px] rounded-md animate-pulse">
                  <div className="bg-vibe-bg px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase text-vibe-neon-pink">Trending</div>
                </div>
              )}
            </div>
            <p className="text-xs text-vibe-muted font-medium line-clamp-1">{desc}</p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-vibe-bg overflow-hidden">
              <img src={`https://picsum.photos/seed/comm${id}${i}/40/40`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex items-center text-[10px] uppercase font-black tracking-widest text-vibe-neon-blue">
          <div className="w-1.5 h-1.5 rounded-full bg-vibe-neon-blue mr-1.5 animate-pulse" />
          {membersCount ? `${membersCount} Membros` : 'Explorar'}
        </div>
      </div>
    </motion.div>
  );
}

