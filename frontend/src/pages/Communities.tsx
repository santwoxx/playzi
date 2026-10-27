import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Community } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, ChevronRight, Plus, X, Sparkles, Globe, Gamepad2, Heart, Flame, Shield, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const COMMUNITY_CATEGORIES = [
  { id: 'freefire', name: 'Free Fire', logo: 'https://i.ibb.co/mVw25trf/ff-logo.png', desc: 'A maior comunidade mobile do Brasil', trending: true, tag: 'Gamer' },
  { id: 'roblox', name: 'Roblox', logo: 'https://i.ibb.co/Q7PT39JL/logoroblox.png', desc: 'Crie mundos e jogue com amigos', trending: true, tag: 'Gamer' },
  { id: 'minecraft', name: 'Minecraft', logo: 'https://i.ibb.co/M55fSgjS/minelogo.png', desc: 'Construção, sobrevivência e aventura', tag: 'Gamer' },
  { id: 'dating', name: 'Namoro & Crush', logo: 'https://i.ibb.co/XrHdBQb5/namoro-logo.png', desc: 'Encontre o player 2 do seu coração', trending: true, tag: 'Social' },
  { id: 'friendship', name: 'Amizade & Resenha', logo: 'https://i.ibb.co/NdkQ5dcY/amizade.jpg', desc: 'Sua nova família gamer te espera', tag: 'Social' }
];

const PRESET_ICONS = [
  '🎮', '🔥', '🏆', '👑', '💎', '⚡', '⚔️', '👾', '🚀', '❤️'
];

export default function Communities() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'official' | 'community'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('🎮');
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'friendship'
  });

  const [userCommunities, setUserCommunities] = useState<any[]>([]);

  // Real-time listener for all created communities
  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'), limit(50));
      unsub = onSnapshot(q, (snap) => {
        setUserCommunities(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      }, (err) => {
        console.warn("Falling back to un-ordered query for communities:", err);
        const fallbackQ = query(collection(db, 'communities'), limit(50));
        getDocs(fallbackQ).then(s => {
          setUserCommunities(s.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
        });
      });
    } catch {
      const fallbackQ = query(collection(db, 'communities'), limit(50));
      getDocs(fallbackQ).then(s => {
        setUserCommunities(s.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      });
    }

    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCommunity.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const iconUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedIcon + ' ' + newCommunity.name)}&background=0D0E12&color=00f2ff&bold=true`;
      
      const docRef = await addDoc(collection(db, 'communities'), {
        name: newCommunity.name.trim(),
        description: newCommunity.description.trim(),
        category: newCommunity.category,
        emojiIcon: selectedIcon,
        ownerId: currentUser.uid,
        ownerName: currentUser.nickname || currentUser.displayName || 'Gamer',
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
        icon: iconUrl
      });

      // Send initial welcome message in the group
      await addDoc(collection(db, 'communities', docRef.id, 'messages'), {
        text: `🚀 Grupo criado por ${currentUser.nickname || currentUser.displayName}! Bem-vindos ao squad.`,
        userId: currentUser.uid,
        userName: 'Playzi Bot',
        userPhoto: 'https://i.ibb.co/svpJKdbx/playsi-logo.png',
        isSystem: true,
        createdAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', category: 'friendship' });
      navigate(`/communities/${docRef.id}`);
    } catch (error) {
      console.error("Erro ao criar comunidade:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = COMMUNITY_CATEGORIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUserCommunities = userCommunities.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'my') {
      return currentUser && (c.members?.includes(currentUser.uid) || c.ownerId === currentUser.uid);
    }
    return true;
  });

  const myGroupsCount = currentUser 
    ? userCommunities.filter(c => c.members?.includes(currentUser.uid) || c.ownerId === currentUser.uid).length 
    : 0;

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
      
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-vibe-neon-blue/10 border border-vibe-neon-blue/30 text-vibe-neon-blue text-[9px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Squads & Grupos Ativos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-vibe-text tracking-tighter neon-text-blue leading-none">
              Grupos & Comunidades
            </h1>
            <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-1">
              Crie seu squad, convide amigos e converse ao vivo
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-vibe-gradient text-white rounded-2xl shadow-glow-blue hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Criar Grupo</span>
          </button>
        </header>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border",
              activeFilter === 'all'
                ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue shadow-glow-blue"
                : "bg-white/5 border-white/10 text-vibe-muted hover:text-white"
            )}
          >
            Todos os Grupos
          </button>
          <button
            onClick={() => setActiveFilter('my')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center space-x-1.5",
              activeFilter === 'my'
                ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue shadow-glow-blue"
                : "bg-white/5 border-white/10 text-vibe-muted hover:text-white"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Meus Grupos ({myGroupsCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('official')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center space-x-1.5",
              activeFilter === 'official'
                ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue shadow-glow-blue"
                : "bg-white/5 border-white/10 text-vibe-muted hover:text-white"
            )}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Jogos Oficiais</span>
          </button>
          <button
            onClick={() => setActiveFilter('community')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center space-x-1.5",
              activeFilter === 'community'
                ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue shadow-glow-blue"
                : "bg-white/5 border-white/10 text-vibe-muted hover:text-white"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Criados pela Galera ({userCommunities.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vibe-muted" />
          <input 
            type="text" 
            placeholder="Buscar grupos, clãs ou jogos..."
            className="w-full bg-white/5 border border-vibe-border rounded-2xl py-4 pl-12 pr-4 focus:neon-border outline-none transition-all placeholder:text-vibe-muted font-bold text-sm text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Official Categories Section */}
        {(activeFilter === 'all' || activeFilter === 'official') && filteredCategories.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-4 h-4 text-vibe-neon-blue animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-vibe-muted">Comunidades Oficiais dos Jogos</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((cat, idx) => (
                <CommunityCard 
                  key={cat.id} 
                  id={cat.id} 
                  name={cat.name} 
                  logo={cat.logo} 
                  desc={cat.desc} 
                  trending={(cat as any).trending} 
                  tag={(cat as any).tag}
                  idx={idx}
                  onClick={() => navigate(currentUser ? `/communities/${cat.id}` : `/comunidades/${cat.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dynamic User Communities Section */}
        {(activeFilter === 'all' || activeFilter === 'my' || activeFilter === 'community') && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-vibe-neon-purple animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-vibe-muted">
                  {activeFilter === 'my' ? 'Seus Grupos e Squads' : 'Grupos Criados por Usuários'}
                </h2>
              </div>
              <span className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-wider">
                {filteredUserCommunities.length} {filteredUserCommunities.length === 1 ? 'grupo' : 'grupos'}
              </span>
            </div>
            
            {filteredUserCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUserCommunities.map((comm, idx) => (
                  <CommunityCard 
                    key={comm.id} 
                    id={comm.id} 
                    name={comm.name} 
                    logo={comm.icon}
                    emoji={comm.emojiIcon}
                    desc={comm.description || 'Grupo aberto da comunidade Playzi'} 
                    idx={idx}
                    isMyGroup={currentUser && (comm.members?.includes(currentUser.uid) || comm.ownerId === currentUser.uid)}
                    membersCount={comm.members?.length || 1}
                    onClick={() => navigate(`/communities/${comm.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="vibe-card p-10 text-center space-y-4 border-dashed border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-3xl">
                  {activeFilter === 'my' ? '🛡️' : '🎮'}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white">
                    {activeFilter === 'my' ? 'Você ainda não entrou em nenhum grupo' : 'Nenhum grupo encontrado'}
                  </h3>
                  <p className="text-xs text-vibe-muted max-w-sm mx-auto mt-1">
                    {activeFilter === 'my' 
                      ? 'Crie seu próprio squad para jogar com amigos ou entre nos grupos oficiais acima!'
                      : 'Seja o primeiro a fundar um grupo para este jogo ou assunto!'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2.5 bg-vibe-gradient text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-glow-blue hover:scale-105 active:scale-95 transition-all"
                >
                  Criar Meu Primeiro Grupo
                </button>
              </div>
            )}
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
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="vibe-card w-full max-w-lg p-6 sm:p-8 relative z-10 border-vibe-neon-blue/40 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-vibe-neon-blue/10 border border-vibe-neon-blue/30 rounded-2xl text-2xl">
                    {selectedIcon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Novo Grupo</h2>
                    <p className="text-[10px] text-vibe-muted font-black uppercase tracking-widest mt-1">Crie seu chat coletivo e convide a galera</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-vibe-muted hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                {/* Icon Presets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Ícone do Grupo</label>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                    {PRESET_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all shrink-0 border",
                          selectedIcon === icon 
                            ? "bg-vibe-neon-blue/20 border-vibe-neon-blue scale-110 shadow-glow-blue" 
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Nome do Grupo</label>
                  <input 
                    type="text"
                    required
                    maxLength={35}
                    placeholder="Ex: Squad Elite Free Fire, Duo Roblox..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white font-bold outline-none focus:neon-border transition-all text-sm"
                    value={newCommunity.name}
                    onChange={e => setNewCommunity({...newCommunity, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Descrição</label>
                  <textarea 
                    rows={2}
                    maxLength={150}
                    placeholder="Objetivo do grupo, regras e jogos praticados..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-medium outline-none focus:neon-border transition-all resize-none text-xs"
                    value={newCommunity.description}
                    onChange={e => setNewCommunity({...newCommunity, description: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Categoria Principal</label>
                  <select 
                    className="w-full bg-[#0d0e14] border border-white/10 rounded-2xl py-3.5 px-4 text-white font-bold outline-none focus:neon-border transition-all text-xs"
                    value={newCommunity.category}
                    onChange={e => setNewCommunity({...newCommunity, category: e.target.value})}
                  >
                    <option value="freefire">Free Fire</option>
                    <option value="roblox">Roblox</option>
                    <option value="minecraft">Minecraft</option>
                    <option value="competitive">Competitivo / Clã</option>
                    <option value="friendship">Amizade & Resenha</option>
                    <option value="dating">Namoro Gamer</option>
                    <option value="casual">Geral & Outros Jogos</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !newCommunity.name.trim()}
                  className="w-full py-4 bg-vibe-gradient text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-glow-blue disabled:opacity-50 transition-all text-xs"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Criar e Abrir Grupo Agora</span>
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

function CommunityCard({ id, name, logo, emoji, desc, trending, tag, idx, membersCount, isMyGroup, onClick }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={onClick}
      className="vibe-card p-5 cursor-pointer group hover:neon-border transition-all relative overflow-hidden flex flex-col justify-between"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-start space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-vibe-bg border border-vibe-border p-1 group-hover:neon-border transition-all shrink-0 flex items-center justify-center overflow-hidden">
            {emoji ? (
              <span className="text-2xl select-none">{emoji}</span>
            ) : logo ? (
              <img src={logo} loading="lazy" decoding="async" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl">🎮</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base font-black tracking-tight text-white group-hover:text-vibe-neon-blue transition-colors truncate">
                {name}
              </h3>
              {trending && (
                <div className="bg-vibe-neon-pink/20 border border-vibe-neon-pink/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-vibe-neon-pink animate-pulse">
                  Trending
                </div>
              )}
              {isMyGroup && (
                <div className="bg-vibe-neon-blue/20 border border-vibe-neon-blue/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-vibe-neon-blue">
                  Seu Grupo
                </div>
              )}
              {tag && (
                <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-vibe-muted">
                  {tag}
                </span>
              )}
            </div>
            <p className="text-xs text-vibe-muted font-medium line-clamp-2 mt-1 leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 text-vibe-muted group-hover:text-vibe-neon-blue group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between relative z-10 text-[10px]">
        <div className="flex items-center space-x-1.5 text-vibe-muted font-bold">
          <Users className="w-3.5 h-3.5 text-vibe-neon-blue" />
          <span>{membersCount ? `${membersCount} ${membersCount === 1 ? 'membro' : 'membros'}` : 'Comunidade Aberta'}</span>
        </div>
        <span className="font-black uppercase tracking-wider text-vibe-neon-blue group-hover:underline flex items-center space-x-1">
          <span>Abrir Chat</span>
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

