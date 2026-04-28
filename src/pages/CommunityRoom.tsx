import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { AdMonetizationService } from '../lib/monetization';
import { SafetyService } from '../lib/safetyService';
import { MessageSquare, Mic, Users, Send, PhoneOff, MicOff, Volume2, Gamepad2, Trophy, Hammer, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

const COMMUNITY_DATA: {[key: string]: any} = {
  'freefire': { name: 'Free Fire', logo: 'https://i.ibb.co/mVw25trf/ff-logo.png', rooms: ['Duo Pro', 'Squad Casual', 'Camp Treino', 'X1 dos Crias'] },
  'roblox': { name: 'Roblox', logo: 'https://i.ibb.co/Q7PT39JL/logoroblox.png', rooms: ['Adopt Me', 'Blox Fruits', 'Admin Hangout', 'Minigames'] },
  'minecraft': { name: 'Minecraft', logo: 'https://i.ibb.co/M55fSgjS/minelogo.png', rooms: ['Survival', 'Creative Build', 'PvP Arena', 'Redstone Lab'] },
  'dating': { name: 'Namoro', logo: 'https://i.ibb.co/XrHdBQb5/namoro-logo.png', rooms: ['Player 2', 'Encontro Gamer', 'A procura'] },
  'friendship': { name: 'Amizade', logo: 'https://i.ibb.co/NdkQ5dcY/amizade.jpg', rooms: ['Chill Hangout', 'Resenha', 'Novo Squad'] }
};

export default function CommunityRoom() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'members'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inCall, setInCall] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const data = COMMUNITY_DATA[categoryId || ''] || { name: 'Unknown', logo: '', rooms: [] };

  useEffect(() => {
    if (!categoryId) return;
    const q = query(collection(db, 'communities', categoryId, 'messages'), orderBy('createdAt', 'asc'));
    const msgsUnsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    // Fetch message limits - DISABLED
    return () => {
      msgsUnsub();
    };
  }, [categoryId, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !categoryId) return;

    // Monetization Check - DISABLED
    const check = await AdMonetizationService.checkAndSpendMessage(currentUser.uid);
    if (!check.permitted) {
      return;
    }

    // AI Safety Check
    const isSafe = await SafetyService.checkTextSafety(newMessage);
    if (!isSafe) {
      alert("Aviso: Sua mensagem contém conteúdo não permitido.");
      return;
    }
    
    await addDoc(collection(db, 'communities', categoryId, 'messages'), {
      text: newMessage,
      userId: currentUser.uid,
      userName: currentUser.nickname || currentUser.displayName,
      userPhoto: currentUser.photoURL,
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  const toggleCall = (room: string) => {
    if (inCall === room) setInCall(null);
    else setInCall(room);
  };

  return (
    <div className="pt-16 h-screen flex flex-col bg-vibe-bg">
      {/* Community Header */}
      <div className="bg-black/40 border-b border-vibe-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-vibe-bg border border-vibe-border p-1.5 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
            <img src={data.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-vibe-text">{data.name}</h1>
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-vibe-muted">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              {t('online_players_count', { count: 1248 })}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
           <button className="p-2 bg-white/5 rounded-xl hover:text-vibe-neon-blue transition-colors">
             <Trophy className="w-5 h-5" />
           </button>
           <button className="p-2 bg-white/5 rounded-xl hover:text-vibe-neon-pink transition-colors">
             <ShieldAlert className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-vibe-border">
        <TabBtn active={activeTab === 'chat'} label={t('chat')} icon={<MessageSquare className="w-4 h-4" />} onClick={() => setActiveTab('chat')} />
        <TabBtn active={activeTab === 'voice'} label={t('calls_tab', 'Calls')} icon={<Mic className="w-4 h-4" />} onClick={() => setActiveTab('voice')} />
        <TabBtn active={activeTab === 'members'} label={t('members')} icon={<Users className="w-4 h-4" />} onClick={() => setActiveTab('members')} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={msg.id} className={cn("flex items-start space-x-3", msg.userId === currentUser?.uid ? "flex-row-reverse space-x-reverse" : "")}>
                    <img 
                      src={msg.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.userName || 'U')}&background=0D0E12&color=fff`} 
                      className="w-8 h-8 rounded-full border border-vibe-border" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      msg.userId === currentUser?.uid ? "bg-vibe-neon-blue/20 border border-vibe-neon-blue/30 text-vibe-text" : "bg-vibe-card border border-vibe-border text-vibe-text"
                    )}>
                      {msg.userId !== currentUser?.uid && (
                        <p className="text-[10px] font-black text-vibe-neon-blue mb-1 uppercase tracking-widest">{msg.userName}</p>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-vibe-border flex flex-col space-y-2">
                <div className="flex items-center space-x-3">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder={t('chat_placeholder', { name: data.name })}
                    className="flex-1 bg-white/5 border border-vibe-border rounded-xl px-4 py-3 text-sm focus:neon-border outline-none transition-all"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="p-3 bg-vibe-neon-blue rounded-xl text-vibe-bg shadow-lg shadow-vibe-neon-blue/20 active:scale-95 transition-all">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4 overflow-y-auto no-scrollbar space-y-4">
               {data.rooms.map((room: string) => (
                  <div key={room} className={cn(
                    "vibe-card p-4 transition-all hover:neon-border relative overflow-hidden",
                    inCall === room ? "neon-border-active bg-vibe-neon-blue/10 shadow-[0_0_30px_rgba(0,242,255,0.2)]" : ""
                  )}>
                    {/* Active Pulse Glow */}
                    {inCall === room && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-vibe-neon-blue/5 pointer-events-none" 
                      />
                    )}

                   <div className="flex items-center justify-between mb-4 relative z-10">
                     <div className="flex items-center space-x-3">
                       <div className={cn(
                         "p-2 rounded-lg border transition-all",
                         inCall === room 
                           ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue animate-pulse-neon" 
                           : "bg-white/5 border-vibe-border text-vibe-muted"
                       )}>
                         <Volume2 className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="flex items-center space-x-2">
                           <h4 className="font-black text-sm tracking-tight">{room}</h4>
                           {inCall === room && (
                             <span className="flex items-center px-1.5 py-0.5 bg-vibe-neon-blue/20 text-vibe-neon-blue text-[7px] font-black uppercase tracking-widest rounded border border-vibe-neon-blue/30">
                               <div className="w-1 h-1 bg-vibe-neon-blue rounded-full mr-1 animate-pulse" />
                               {t('your_room')}
                             </span>
                           )}
                         </div>
                         <p className="text-[10px] text-vibe-muted font-black uppercase tracking-widest">{t('players_in_room', { count: 3, max: 10 })}</p>
                       </div>
                     </div>
                     <button 
                       onClick={() => toggleCall(room)}
                       className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                        inCall === room ? "bg-red-500 text-white shadow-red-500/20" : "bg-vibe-neon-blue text-vibe-bg shadow-vibe-neon-blue/10"
                      )}
                     >
                       {inCall === room ? t('exit') : t('enter')}
                     </button>
                   </div>

                   <div className="flex flex-wrap gap-3">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="flex items-center space-x-2 bg-white/5 p-1.5 pr-3 rounded-full border border-white/5">
                         <div className="relative">
                            <img src={`https://picsum.photos/seed/room${room}${i}/30/30`} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" loading="lazy" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-vibe-bg" />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-tighter">Player_{i}</span>
                         {i === 2 && <MicOff className="w-3 h-3 text-vibe-muted" />}
                       </div>
                     ))}
                     {inCall === room && (
                       <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="flex items-center space-x-2 bg-vibe-neon-blue/20 p-1.5 pr-3 rounded-full border border-vibe-neon-blue/30"
                       >
                         <img src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=You`} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                         <span className="text-[10px] font-black uppercase tracking-tighter text-vibe-neon-blue">{t('you')}</span>
                         <div className="w-1.5 h-1.5 bg-vibe-neon-blue rounded-full animate-ping" />
                       </motion.div>
                     )}
                   </div>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Voice Control */}
      <AnimatePresence>
        {inCall && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 bg-vibe-bg/90 backdrop-blur-xl border border-vibe-neon-blue/30 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50 neon-border"
          >
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10 bg-vibe-neon-blue rounded-xl flex items-center justify-center animate-pulse-neon">
                 <Mic className="w-6 h-6 text-vibe-bg" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">{t('connected_to')}</p>
                 <p className="text-sm font-black text-white">{inCall}</p>
               </div>
            </div>
            <div className="flex space-x-2">
               <button 
                 onClick={() => setIsMuted(!isMuted)}
                 className={cn("p-3 rounded-xl transition-all", isMuted ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-vibe-muted")}
               >
                 {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
               </button>
               <button 
                 onClick={() => setInCall(null)}
                 className="p-3 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/20"
               >
                 <PhoneOff className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 flex flex-col items-center space-y-1 relative transition-all",
        active ? "text-vibe-neon-blue" : "text-vibe-muted hover:text-white"
      )}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-vibe-neon-blue" />}
    </button>
  );
}
