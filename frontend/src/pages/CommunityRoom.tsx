import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, getDocs, limitToLast, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyService } from '../lib/safetyService';
import { sendNotification } from '../services/notificationService';
import { compressImage } from '../lib/image';
import { 
  MessageSquare, Mic, Users, Send, PhoneOff, MicOff, Volume2, 
  Trophy, Plus, MessageCircle, ChevronLeft, Image, X, Copy, Check, 
  Share2, Crown, Sparkles, UserPlus, LogOut, Trash2, Search, Smile
} from 'lucide-react';
import { cn } from '../lib/utils';
import SEO from '../components/SEO';

const COMMUNITY_DATA: {[key: string]: any} = {
  'freefire': { name: 'Free Fire', logo: 'https://i.ibb.co/mVw25trf/ff-logo.png', rooms: ['Duo Pro', 'Squad Casual', 'Camp Treino', 'X1 dos Crias'] },
  'roblox': { name: 'Roblox', logo: 'https://i.ibb.co/Q7PT39JL/logoroblox.png', rooms: ['Adopt Me', 'Blox Fruits', 'Admin Hangout', 'Minigames'] },
  'minecraft': { name: 'Minecraft', logo: 'https://i.ibb.co/M55fSgjS/minelogo.png', rooms: ['Survival', 'Creative Build', 'PvP Arena', 'Redstone Lab'] },
  'dating': { name: 'Namoro & Crush', logo: 'https://i.ibb.co/XrHdBQb5/namoro-logo.png', rooms: ['Player 2', 'Encontro Gamer', 'A procura'] },
  'friendship': { name: 'Amizade & Resenha', logo: 'https://i.ibb.co/NdkQ5dcY/amizade.jpg', rooms: ['Chill Hangout', 'Resenha', 'Novo Squad'] }
};

const QUICK_EMOJIS = ['🎮', '🔥', '🏆', '👑', '❤️', '😂', '👍', '⚡', '⚔️', '👾'];

export default function CommunityRoom() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'members'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [inCall, setInCall] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const isOfficial = COMMUNITY_DATA[categoryId || ''];
  const data = isOfficial || community || { name: 'Carregando...', logo: '', rooms: [] };

  // Fetch community details if user-created
  useEffect(() => {
    if (!categoryId) return;
    
    if (!isOfficial) {
      const communityRef = doc(db, 'communities', categoryId);
      const unsubCommunity = onSnapshot(communityRef, (docSnap) => {
        if (docSnap.exists()) {
          setCommunity({ id: docSnap.id, ...docSnap.data() });
        }
      });
      return () => unsubCommunity();
    }
  }, [categoryId, isOfficial]);

  // Real-time messages listener
  useEffect(() => {
    if (!categoryId) return;
    const q = query(
      collection(db, 'communities', categoryId, 'messages'), 
      orderBy('createdAt', 'asc'), 
      limitToLast(120)
    );
    const msgsUnsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => msgsUnsub();
  }, [categoryId]);

  const isMember = isOfficial || (currentUser && data.members?.includes(currentUser.uid));
  const isOwner = currentUser && data.ownerId === currentUser.uid;

  const handleJoin = async () => {
    if (!currentUser || !categoryId || isOfficial) return;
    try {
      const communityRef = doc(db, 'communities', categoryId);
      await updateDoc(communityRef, {
        members: arrayUnion(currentUser.uid)
      });
      await addDoc(collection(db, 'communities', categoryId, 'messages'), {
        text: `👋 ${currentUser.nickname || currentUser.displayName} entrou no grupo!`,
        userId: currentUser.uid,
        userName: 'Sistema',
        isSystem: true,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error joining:", error);
    }
  };

  const handleLeave = async () => {
    if (!currentUser || !categoryId || isOfficial) return;
    if (!confirm("Tem certeza que deseja sair deste grupo?")) return;
    try {
      const communityRef = doc(db, 'communities', categoryId);
      await updateDoc(communityRef, {
        members: arrayRemove(currentUser.uid)
      });
      await addDoc(collection(db, 'communities', categoryId, 'messages'), {
        text: `🚪 ${currentUser.nickname || currentUser.displayName} saiu do grupo.`,
        userId: currentUser.uid,
        userName: 'Sistema',
        isSystem: true,
        createdAt: serverTimestamp()
      });
      navigate('/communities');
    } catch (error) {
      console.error("Error leaving:", error);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.75);
      if (compressed) {
        setSelectedImage(compressed);
      }
    } catch (err) {
      console.error("Erro ao comprimir imagem:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !currentUser || !categoryId) return;

    setIsSending(true);
    try {
      // AI Safety Check on text if present
      if (newMessage.trim()) {
        const isSafe = await SafetyService.checkTextSafety(newMessage);
        if (!isSafe) {
          alert("Aviso: Sua mensagem contém conteúdo não permitido pelas diretrizes.");
          setIsSending(false);
          return;
        }
      }

      await addDoc(collection(db, 'communities', categoryId, 'messages'), {
        text: newMessage.trim() || '',
        mediaUrl: selectedImage || null,
        mediaType: selectedImage ? 'image' : null,
        userId: currentUser.uid,
        userName: currentUser.nickname || currentUser.displayName || 'Gamer',
        userPhoto: currentUser.photoURL || null,
        userLevel: currentUser.level || 1,
        isOwner: isOwner,
        createdAt: serverTimestamp()
      });

      setNewMessage('');
      setSelectedImage(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Erro ao enviar mensagem no grupo:", error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleCall = (room: string) => {
    if (inCall === room) setInCall(null);
    else setInCall(room);
  };

  return (
    <div className="pt-16 min-h-screen flex flex-col bg-vibe-bg text-white relative">
      <SEO 
        title={`${data.name} - Chat do Grupo Gamer`} 
        description={`Converse em tempo real no chat do grupo ${data.name} na Playzi. Encontre amigos para jogar e compartilhe novidades.`}
      />

      {/* Community Header */}
      <div className="bg-black/60 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 sticky top-16 z-20">
        <div className="flex items-center space-x-3 min-w-0">
          <button 
            onClick={() => navigate('/communities')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-vibe-muted hover:text-white transition-colors shrink-0"
            title="Voltar para todos os grupos"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-vibe-bg border border-vibe-border p-1 shadow-[0_0_15px_rgba(0,242,255,0.1)] overflow-hidden shrink-0 flex items-center justify-center">
            {data.emojiIcon ? (
              <span className="text-xl select-none">{data.emojiIcon}</span>
            ) : (
              <img src={data.logo || data.icon || 'https://i.ibb.co/svpJKdbx/playsi-logo.png'} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">{data.name}</h1>
              {isOwner && (
                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-[8px] font-black uppercase tracking-wider shrink-0">
                  Dono
                </span>
              )}
            </div>
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-vibe-muted space-x-2">
              <span className="flex items-center text-green-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                {data.members?.length || (isOfficial ? 128 : 1)} membros
              </span>
              <span>•</span>
              <span className="truncate">{data.category || 'Geral'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!isMember && (
            <button 
              onClick={handleJoin}
              className="px-3.5 py-2 bg-vibe-neon-blue text-vibe-bg rounded-xl text-xs font-black uppercase tracking-wider shadow-glow-blue hover:scale-105 active:scale-95 transition-all"
            >
              Participar
            </button>
          )}
          <button 
            onClick={() => setShowAddMembersModal(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-white/5 hover:bg-vibe-neon-blue/20 border border-white/10 hover:border-vibe-neon-blue/40 rounded-xl text-xs font-bold text-white transition-all group"
            title="Adicionar ou Convidar Usuários"
          >
            <UserPlus className="w-4 h-4 text-vibe-neon-blue group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/5 bg-black/30 shrink-0">
        <TabBtn active={activeTab === 'chat'} label="Chat do Grupo" icon={<MessageSquare className="w-4 h-4" />} onClick={() => setActiveTab('chat')} />
        <TabBtn active={activeTab === 'members'} label={`Membros (${data.members?.length || (isOfficial ? 128 : 1)})`} icon={<Users className="w-4 h-4" />} onClick={() => setActiveTab('members')} />
        <TabBtn active={activeTab === 'voice'} label="Calls de Voz" icon={<Mic className="w-4 h-4" />} onClick={() => setActiveTab('voice')} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full min-h-0">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                {/* Community welcome card */}
                <div className="max-w-md mx-auto my-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-vibe-neon-blue/10 border border-vibe-neon-blue/30 mx-auto flex items-center justify-center text-2xl">
                    {data.emojiIcon || '💬'}
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{data.name}</h3>
                  <p className="text-xs text-vibe-muted leading-relaxed">
                    {data.description || 'Bem-vindos ao chat coletivo! Respeite as regras e divirta-se jogando junto.'}
                  </p>
                  <button
                    onClick={() => setShowAddMembersModal(true)}
                    className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-vibe-neon-blue hover:underline pt-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Convidar mais gamers para este grupo</span>
                  </button>
                </div>

                {messages.map((msg) => {
                  const isMine = msg.userId === currentUser?.uid;

                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-vibe-muted uppercase tracking-wider">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={cn("flex items-end space-x-2.5", isMine && "flex-row-reverse space-x-reverse")}
                    >
                      <img 
                        src={msg.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.userName || 'U')}&background=0D0E12&color=fff`} 
                        className="w-8 h-8 rounded-full border border-white/10 shrink-0 cursor-pointer hover:border-vibe-neon-blue transition-colors" 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onClick={() => navigate(`/profile/${msg.userId}`)}
                      />
                      <div className={cn("max-w-[82%] sm:max-w-[70%] space-y-1", isMine && "items-end text-right")}>
                        {!isMine && (
                          <div className="flex items-center space-x-1.5 pl-1">
                            <span className="text-[10px] font-black text-white tracking-wider uppercase cursor-pointer hover:underline" onClick={() => navigate(`/profile/${msg.userId}`)}>
                              {msg.userName}
                            </span>
                            {msg.isOwner && (
                              <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" title="Dono do Grupo" />
                            )}
                            <span className="text-[8px] font-bold bg-white/10 px-1 rounded text-vibe-muted">
                              L{msg.userLevel || 1}
                            </span>
                          </div>
                        )}

                        <div className={cn(
                          "p-3 rounded-2xl text-sm leading-relaxed break-words",
                          isMine 
                            ? "bg-vibe-neon-blue/20 border border-vibe-neon-blue/40 text-white rounded-br-sm" 
                            : "bg-vibe-card border border-white/10 text-white rounded-bl-sm"
                        )}>
                          {msg.mediaUrl && (
                            <img 
                              src={msg.mediaUrl} 
                              alt="Anexo" 
                              className="rounded-xl max-h-60 w-auto object-cover mb-2 border border-white/10" 
                            />
                          )}
                          {msg.text && <p>{msg.text}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              
              {/* Quick Emojis Bar */}
              {showEmojiPicker && (
                <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewMessage(prev => prev + emoji)}
                      className="text-lg p-1.5 hover:scale-125 transition-transform shrink-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Image Preview */}
              {selectedImage && (
                <div className="px-4 py-2 bg-black/70 border-t border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-3">
                    <img src={selectedImage} className="w-12 h-12 rounded-xl object-cover border border-vibe-neon-blue" />
                    <span className="text-xs text-vibe-muted font-bold">Imagem selecionada para envio</span>
                  </div>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Form */}
              <form 
                onSubmit={handleSendMessage} 
                className="p-3 sm:p-4 bg-black/70 border-t border-white/10 flex items-center space-x-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,16px))]"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImagePick}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-vibe-muted hover:text-white transition-colors shrink-0"
                  title="Enviar Imagem"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "p-2.5 rounded-xl transition-colors shrink-0",
                    showEmojiPicker ? "bg-vibe-neon-blue/20 text-vibe-neon-blue" : "bg-white/5 text-vibe-muted hover:text-white"
                  )}
                  title="Reações e Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  placeholder={isMember ? `Mensagem em ${data.name}...` : "Participe do grupo para conversar..."}
                  disabled={!isMember || isSending}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-vibe-neon-blue outline-none transition-all placeholder:text-vibe-muted disabled:opacity-50"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={(!newMessage.trim() && !selectedImage) || !isMember || isSending}
                  className="p-3 bg-vibe-gradient rounded-2xl text-white shadow-glow-blue disabled:opacity-40 active:scale-95 transition-all shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB: MEMBERS */}
          {activeTab === 'members' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Membros do Squad ({data.members?.length || (isOfficial ? 128 : 1)})</h3>
                  <p className="text-xs text-vibe-muted">Converse no privado ou adicione mais amigos</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowAddMembersModal(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-vibe-gradient text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-glow-blue hover:scale-105 active:scale-95 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar Amigos</span>
                  </button>
                  {isMember && !isOfficial && (
                    <button 
                      onClick={handleLeave}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-vibe-muted hover:text-red-400 transition-colors"
                      title="Sair do Grupo"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {data.members?.map((memberId: string) => (
                  <MemberItem 
                    key={memberId} 
                    userId={memberId} 
                    isOwner={data.ownerId === memberId} 
                    canRemove={isOwner && memberId !== currentUser?.uid}
                    onRemove={async () => {
                      if (!confirm("Remover este membro do grupo?")) return;
                      await updateDoc(doc(db, 'communities', categoryId!), {
                        members: arrayRemove(memberId)
                      });
                    }}
                  />
                ))}
                
                {isOfficial && [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center space-x-3">
                      <img src={`https://ui-avatars.com/api/?name=Gamer_${i}&background=0D0E12&color=00f2ff`} className="w-10 h-10 rounded-full border border-white/10" />
                      <div>
                        <p className="text-sm font-black text-white">Gamer_{i}</p>
                        <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-widest">Nível {10 + i} • Online</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: VOICE CALLS */}
          {activeTab === 'voice' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-4">
              <div className="bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-vibe-neon-blue/20 flex items-center justify-center text-vibe-neon-blue">
                    <Mic className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Canais de Voz do Squad</h3>
                    <p className="text-xs text-vibe-muted">Converse por voz com baixa latência enquanto joga</p>
                  </div>
                </div>
              </div>

              {(data.rooms || ['Sala Geral', 'Duo 1', 'Squad 1']).map((room: string) => (
                <div key={room} className={cn(
                  "vibe-card p-4 transition-all hover:border-vibe-neon-blue/40 relative overflow-hidden",
                  inCall === room ? "border-vibe-neon-blue bg-vibe-neon-blue/10 shadow-[0_0_30px_rgba(0,242,255,0.2)]" : ""
                )}>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-xl border transition-all",
                        inCall === room 
                          ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue animate-pulse" 
                          : "bg-white/5 border-white/10 text-vibe-muted"
                      )}>
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm tracking-tight text-white">{room}</h4>
                          {inCall === room && (
                            <span className="px-2 py-0.5 bg-vibe-neon-blue/20 text-vibe-neon-blue text-[8px] font-black uppercase rounded border border-vibe-neon-blue/30 animate-pulse">
                              Conectado
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-wider">Canal aberto para o grupo</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleCall(room)}
                      className={cn(
                        "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg",
                        inCall === room ? "bg-red-500 text-white shadow-red-500/20" : "bg-vibe-gradient text-white shadow-glow-blue"
                      )}
                    >
                      {inCall === room ? 'Sair da Call' : 'Entrar na Call'}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Active Voice Bar */}
      <AnimatePresence>
        {inCall && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-black/90 backdrop-blur-xl border border-vibe-neon-blue/40 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-vibe-neon-blue rounded-xl flex items-center justify-center text-vibe-bg">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-vibe-muted">Call Ativa</p>
                <p className="text-sm font-black text-white">{inCall}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={cn("p-2.5 rounded-xl transition-all", isMuted ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/10 text-white")}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setInCall(null)}
                className="p-2.5 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/20"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ADICIONAR USUÁRIOS AO GRUPO */}
      <AddMembersModal 
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        communityId={categoryId!}
        communityName={data.name}
        existingMembers={data.members || []}
        currentUser={currentUser}
      />
    </div>
  );
}

function TabBtn({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex-1 py-3.5 flex items-center justify-center space-x-2 relative transition-all text-xs font-black uppercase tracking-wider",
        active ? "text-vibe-neon-blue bg-white/[0.02]" : "text-vibe-muted hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="community-tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-vibe-neon-blue shadow-glow-blue" />}
    </button>
  );
}

function MemberItem({ userId, isOwner, canRemove, onRemove }: { userId: string, isOwner: boolean, canRemove: boolean, onRemove: () => void }) {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const uSnap = await getDoc(doc(db, 'users', userId));
        if (uSnap.exists()) {
          setUser(uSnap.data());
        }
      } catch (err) {
        console.error("Erro ao carregar membro:", err);
      }
    };
    fetchUser();
  }, [userId]);

  if (!user) {
    return <div className="h-16 animate-pulse bg-white/5 rounded-2xl" />;
  }

  return (
    <div className="flex items-center justify-between p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-vibe-neon-blue/30 transition-all group">
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className="relative shrink-0">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.displayName || 'U')}&background=0D0E12&color=fff`} 
            className="w-10 h-10 rounded-full border border-white/10 object-cover cursor-pointer hover:border-vibe-neon-blue transition-colors" 
            onClick={() => navigate(`/profile/${userId}`)}
          />
          {isOwner && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-vibe-bg" title="Dono do Grupo">
              <Crown className="w-2.5 h-2.5 text-black" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h4 
              className="text-sm font-black text-white truncate cursor-pointer hover:underline"
              onClick={() => navigate(`/profile/${userId}`)}
            >
              {user.nickname || user.displayName}
            </h4>
            {isOwner && (
              <span className="text-[9px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                Dono
              </span>
            )}
          </div>
          <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-wider">
            Nível {user.level || 1} • {user.status === 'online' ? '🟢 Online' : 'Gamer'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <button 
          onClick={() => navigate(`/chat/${userId}`)}
          className="p-2 rounded-xl bg-white/5 hover:bg-vibe-neon-blue/20 text-vibe-muted hover:text-vibe-neon-blue transition-colors"
          title="Conversar no Privado"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        {canRemove && (
          <button 
            onClick={onRemove}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-vibe-muted hover:text-red-400 transition-colors"
            title="Remover do Grupo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddMembersModal({ isOpen, onClose, communityId, communityName, existingMembers, currentUser }: {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
  existingMembers: string[];
  currentUser: any;
}) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);

  const inviteLink = `${window.location.origin}/communities/${communityId}`;

  // Fetch users on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(60));
        const snap = await getDocs(q);
        setUsersList(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        console.error("Erro ao carregar usuários para adicionar:", err);
      }
    };
    fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: communityName,
        text: `Entre no grupo ${communityName} na rede Playzi!`,
        url: inviteLink
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleAddUser = async (user: any) => {
    if (!currentUser || !communityId) return;

    setAddingUid(user.uid);
    try {
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        members: arrayUnion(user.uid)
      });

      // Send in-app notification
      await sendNotification({
        userId: user.uid,
        type: 'message',
        title: 'Você foi adicionado a um grupo!',
        content: `${currentUser.nickname || currentUser.displayName || 'Um usuário'} adicionou você ao grupo "${communityName}".`,
        link: `/communities/${communityId}`,
        senderName: currentUser.nickname || currentUser.displayName,
        senderPhoto: currentUser.photoURL
      });

      // System message in chat
      await addDoc(collection(db, 'communities', communityId, 'messages'), {
        text: `✨ ${currentUser.nickname || currentUser.displayName} adicionou ${user.nickname || user.displayName || 'um membro'} ao grupo!`,
        userId: currentUser.uid,
        userName: 'Sistema',
        isSystem: true,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Erro ao adicionar usuário ao grupo:", err);
    } finally {
      setAddingUid(null);
    }
  };

  const filteredUsers = usersList.filter(u => {
    if (u.uid === currentUser?.uid) return false;
    const name = (u.nickname || u.displayName || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="vibe-card w-full max-w-lg p-6 relative z-10 border-vibe-neon-blue/40 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-vibe-neon-blue/10 border border-vibe-neon-blue/30 text-vibe-neon-blue">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Adicionar ao Grupo</h3>
              <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-wider">{communityName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-vibe-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Invite Link Bar */}
        <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl mb-5 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-vibe-muted uppercase tracking-wider text-[10px]">Link de Convite Direto</span>
            <span className="text-[10px] text-vibe-neon-blue font-bold">Qualquer pessoa pode entrar</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              readOnly 
              value={inviteLink}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-vibe-muted font-mono truncate outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shrink-0"
              title="Copiar Link"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleShare}
              className="px-3 py-2 bg-vibe-gradient text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-glow-blue transition-all shrink-0"
              title="Compartilhar no WhatsApp ou outros apps"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Search Users Input */}
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-muted" />
          <input 
            type="text" 
            placeholder="Buscar gamer pelo nickname..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-vibe-neon-blue transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users list to add */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 min-h-0">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
              const alreadyMember = existingMembers.includes(user.uid);
              const isLoading = addingUid === user.uid;

              return (
                <div 
                  key={user.uid}
                  className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 rounded-xl border border-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.displayName || 'U')}&background=0D0E12&color=fff`} 
                      className="w-9 h-9 rounded-full border border-white/10 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{user.nickname || user.displayName}</p>
                      <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-wider">
                        Nível {user.level || 1} • {user.status === 'online' ? '🟢 Online' : 'Gamer'}
                      </p>
                    </div>
                  </div>

                  {alreadyMember ? (
                    <span className="px-3 py-1.5 rounded-lg bg-white/5 text-vibe-muted text-[10px] font-bold uppercase tracking-wider border border-white/5">
                      ✓ No Grupo
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddUser(user)}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-vibe-neon-blue/20 hover:bg-vibe-neon-blue text-vibe-neon-blue hover:text-vibe-bg border border-vibe-neon-blue/40 text-[10px] font-black uppercase tracking-wider transition-all shadow-glow-blue flex items-center space-x-1 shrink-0 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Adicionar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-vibe-muted text-xs">
              Nenhum usuário encontrado com "{searchQuery}".
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
