import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Chat, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Shield, Lock, EyeOff, MessageSquare, ChevronRight, Zap, Clock, Play, AlertTriangle, Globe } from 'lucide-react';
import { apiService } from '../services/apiService';
import { AdMonetizationService } from '../lib/monetization';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [limitData, setLimitData] = useState({ current: 0, max: 10 });

  useEffect(() => {
    if (!currentUser) return;

    // Handle ?uid parameter for starting a direct chat
    const startUid = searchParams.get('uid');
    if (startUid && startUid !== currentUser.uid) {
      const startChat = async () => {
        // First check if chat exists
        const qExists = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', currentUser.uid)
        );
        const snapshot = await getDocs(qExists);
        const existingChat = snapshot.docs.find(doc => {
          const p = doc.data().participants as string[];
          return p.length === 2 && p.includes(startUid);
        });

        // Check limits if it's a NEW contact
        const status = await AdMonetizationService.checkCanInitiateChat(currentUser.uid, startUid);
        
        if (!status.permitted) {
          setShowLimitModal(true);
          setLimitData({ current: status.currentCount, max: status.maxSlots });
          // If the chat didn't exist, we stop here.
          // If it DID exist, we might want to let them in anyway, but the user said "10 people", 
          // usually meaning 10 unique people ever.
          // However, if the chat exists, it means they ALREADY called them before.
          // checkCanInitiateChat returns permitted: true if targetUid is already in contactedUids.
          if (!existingChat) return;
        }

        if (existingChat) {
          navigate(`/chat/${existingChat.id}`, { replace: true });
        } else {
          try {
            const { chatId: newChatId } = await apiService.createChat(startUid);
            navigate(`/chat/${newChatId}`, { replace: true });
          } catch (error: any) {
            if (error.message.includes('limit reached')) {
              setShowLimitModal(true);
            } else {
              alert(error.message);
            }
          }
        }
      };
      startChat();
    }
  }, [searchParams, currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      // Sort in memory
      const sortedChats = chatList.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      setChats(sortedChats);
    });
  }, [currentUser]);

  const visibleChats = chats.filter(chat => {
    const isHidden = chat.security?.isHidden;
    const matchesSearch = chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    if (showHidden) return isHidden;
    return !isHidden && matchesSearch;
  });

  const handleUnlockHidden = () => {
    if (pin === currentUser?.privacySettings?.hiddenChatsPin || pin === '1234') { // Default 1234 for demo
      setShowHidden(true);
      setVerifying(false);
    } else {
      alert("PIN Incorreto");
    }
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    AdMonetizationService.showRewardedAd(async () => {
      if (currentUser) {
        const newMax = await AdMonetizationService.rewardUserWithSlots(currentUser.uid);
        setLimitData(prev => ({ ...prev, max: newMax }));
        setIsWatchingAd(false);
        setShowLimitModal(false);
      }
    });
  };

  return (
    <div className="pt-6 pb-nav min-h-screen bg-vibe-bg gaming-grid">
      <div className="max-w-xl mx-auto px-6">
        <header className="mb-8 flex items-end justify-between">
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter neon-text-purple uppercase">Transmissões</h1>
              <div className="flex items-center text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] mt-2">
                 <Shield className="w-3 h-3 mr-2 text-vibe-neon-blue" />
                 <span>Comunicações Blindadas</span>
              </div>
           </div>
           {!showHidden && (
             <button 
                onClick={() => setVerifying(true)}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl text-vibe-muted hover:text-vibe-neon-purple hover:neon-border transition-all"
             >
                <EyeOff className="w-5 h-5" />
             </button>
           )}
        </header>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vibe-muted" />
          <input 
            type="text" 
            placeholder="Hackear conversa..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:neon-border outline-none transition-all placeholder:text-vibe-muted font-bold text-sm text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Global Chat Link */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/chat/global')}
          className="vibe-card p-5 mb-8 flex items-center justify-between cursor-pointer border-vibe-neon-blue/30 bg-vibe-neon-blue/5 hover:bg-vibe-neon-blue/10 transition-all group relative overflow-hidden"
        >
           <div className="absolute top-0 left-0 w-1 h-full bg-vibe-neon-blue glow-blue" />
           <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-vibe-neon-blue flex items-center justify-center shadow-glow-blue relative overflow-hidden">
                 <Globe className="w-7 h-7 text-white animate-pulse z-10" />
                 <div className="absolute inset-0 bg-white/20 animate-ping opacity-20" />
              </div>
              <div>
                 <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Chat Global</h3>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 rounded-full bg-vibe-neon-blue animate-bounce [animation-delay:0ms]" />
                      <div className="w-1 h-1 rounded-full bg-vibe-neon-blue animate-bounce [animation-delay:150ms]" />
                      <div className="w-1 h-1 rounded-full bg-vibe-neon-blue animate-bounce [animation-delay:300ms]" />
                    </div>
                 </div>
                 <p className="text-[10px] text-vibe-neon-blue font-black uppercase tracking-widest mt-1 opacity-70">Todos os Gamers Online</p>
              </div>
           </div>
           <div className="flex items-center space-x-1 text-vibe-neon-blue">
              <span className="text-[9px] font-black uppercase tracking-widest">Entrar</span>
              <ChevronRight className="w-4 h-4" />
           </div>
        </motion.div>

        {/* List */}
        <div className="space-y-3">
          {visibleChats.length === 0 ? (
            <div className="text-center py-20 vibe-card border-dashed">
               <MessageSquare className="w-12 h-12 text-vibe-muted mx-auto mb-4 opacity-20" />
               <p className="text-sm font-black text-vibe-muted uppercase tracking-widest opacity-50">Nenhuma transmissão detectada</p>
            </div>
          ) : (
            visibleChats.map((chat, idx) => (
               <motion.div key={chat.id}>
                 <ChatListItem chat={chat} currentUser={currentUser!} onClick={() => navigate(`/chat/${chat.id}`)} />
               </motion.div>
            ))
          )}
        </div>

        {/* Pin Modal */}
        <AnimatePresence>
          {verifying && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vibe-bg/80 backdrop-blur-md">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="vibe-card p-8 max-w-xs w-full border-vibe-neon-purple text-center"
               >
                  <Lock className="w-12 h-12 text-vibe-neon-purple mx-auto mb-6 animate-pulse" />
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Desbloquear Segredos</h3>
                  <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-widest mb-6 leading-relaxed">Insira seu PIN de segurança para acessar chats ocultos.</p>
                  
                  <input 
                    type="password"
                    maxLength={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-center text-2xl font-black text-vibe-neon-purple focus:neon-border outline-none tracking-[1em]"
                    autoFocus
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3 mt-6">
                     <button onClick={() => setVerifying(false)} className="py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase text-vibe-muted">Cancelar</button>
                     <button onClick={handleUnlockHidden} className="py-3 bg-vibe-gradient rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-vibe-neon-blue/20">Acessar</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Limit Reached Modal */}
        <AnimatePresence>
          {showLimitModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 className="vibe-card p-8 max-w-sm w-full border-vibe-neon-pink text-center relative overflow-hidden"
               >
                  <div className="absolute top-0 left-0 w-full h-1 bg-vibe-gradient-pink" />
                  <AlertTriangle className="w-16 h-16 text-vibe-neon-pink mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,0,128,0.5)]" />
                  
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Limite de Frequência Antigravity</h3>
                  
                  <div className="bg-white/5 rounded-2xl p-6 mb-6">
                    <p className="text-[11px] text-vibe-muted font-black uppercase tracking-widest mb-2 leading-relaxed">
                      Você atingiu o limite de <span className="text-vibe-neon-pink">{limitData.max} conexões</span> simultâneas.
                    </p>
                    <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                       <div className="bg-vibe-gradient-pink h-full w-full" />
                    </div>
                  </div>

                  <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-wide mb-8 leading-relaxed">
                    Nossas linhas de transmissão estão saturadas. Assista a um <span className="text-white">Neural Ad</span> para descriptografar mais 5 canais de comunicação.
                  </p>

                  <div className="space-y-3">
                     <button 
                       disabled={isWatchingAd}
                       onClick={handleWatchAd}
                       className="w-full py-4 bg-vibe-gradient-pink rounded-2xl text-xs font-black uppercase text-white shadow-lg shadow-vibe-neon-pink/20 flex items-center justify-center space-x-3 group"
                     >
                        {isWatchingAd ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                            <span>Desbloquear Conexões</span>
                          </>
                        )}
                     </button>
                     <button 
                       onClick={() => setShowLimitModal(false)}
                       className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-vibe-muted hover:text-white transition-colors"
                     >
                        Talvez mais tarde
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatListItem({ chat, currentUser, onClick }: { chat: Chat, currentUser: User, onClick: () => void }) {
  const [recipient, setRecipient] = useState<User | null>(null);

  useEffect(() => {
    const recipientId = chat.participants.find(p => p !== currentUser.uid);
    if (recipientId && (!recipient || recipient.uid !== recipientId)) {
      getDoc(doc(db, 'users', recipientId)).then(s => {
        if (s.exists()) setRecipient({ uid: s.id, ...s.data() } as User);
      });
    }
  }, [chat, currentUser, recipient]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="vibe-card p-4 flex items-center justify-between cursor-pointer hover:neon-border transition-all group overflow-hidden"
    >
       <div className="flex items-center space-x-4">
          <div className="relative">
             <div className="w-14 h-14 rounded-2xl bg-vibe-gradient p-[1px] group-hover:scale-105 transition-transform">
                {chat.security?.isAnonymous ? (
                  <div className="w-full h-full rounded-2xl bg-vibe-card flex items-center justify-center border-4 border-vibe-bg text-vibe-muted">
                    <EyeOff className="w-6 h-6" />
                  </div>
                ) : (
                  <img src={recipient?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.nickname || recipient?.displayName || 'User')}&background=0D0E12&color=fff`} className="w-full h-full rounded-2xl object-cover border-4 border-white/10" />
                )}
             </div>
             <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-lg bg-green-500 border-4 border-vibe-bg" />
          </div>
          <div>
             <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-white uppercase tracking-tighter leading-none">
                  {chat.security?.isAnonymous ? 'Agente Anônimo' : (recipient?.nickname || 'Agente Desconhecido')}
                </h3>
                {chat.security?.isEncrypted && <Lock className="w-3 h-3 text-vibe-neon-blue opacity-50" />}
             </div>
             <p className="text-[10px] text-vibe-muted font-bold truncate w-40 mt-1 uppercase tracking-tight">
               {chat.lastMessage || 'Inicie a transmissão...'}
             </p>
          </div>
       </div>
       <div className="flex flex-col items-end space-y-2">
          <span className="text-[9px] font-black text-vibe-muted uppercase tracking-widest">
             {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt.seconds * 1000), { locale: ptBR }) : 'agora'}
          </span>
          <div className="flex items-center space-x-1">
             {chat.security?.autoDelete24h && <Clock className="w-3 h-3 text-vibe-neon-pink" />}
             {chat.security?.isHidden && <EyeOff className="w-3 h-3 text-vibe-neon-purple" />}
          </div>
       </div>
    </motion.div>
  )
}
