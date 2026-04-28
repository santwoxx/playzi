import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Gamepad2, User, X, Check, Globe, Zap, Loader2, Sparkles, Trophy, Star, MessageCircle, Target, Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, updateDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { apiService } from '../services/apiService';
import { AIService } from '../services/aiService';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function InstantMatch() {
  const { currentUser } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState<any>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [matchInsight, setMatchInsight] = useState<string>('');

  const getIcebreaker = async (intent: string, otherUser: any) => {
    if (currentUser) {
      try {
        const aiMsg = await AIService.generateIcebreaker(currentUser, {
          ...otherUser,
          currentIntent: intent
        } as any);
        return aiMsg;
      } catch (err) {
        console.error(err);
      }
    }
    
    switch(intent) {
      case 'playing': return "Bora jogar algo agora?";
      case 'competitive': return "Focado em subir de elo? Bora fechar esse Duo!";
      case 'chatting': return "Opa! No que você está focado hoje?";
      case 'friendship': return "Curti seu perfil! Vamos trocar uma ideia?";
      default: return "Olá! Vi que demos match, bora conversar?";
    }
  };

  const [aiIcebreaker, setAiIcebreaker] = useState<string>('');

  useEffect(() => {
    if (matchFound && !matchInsight && currentUser) {
      // Trigger AI Insight and Icebreaker when match is found
      const fetchAI = async () => {
        const insight = await AIService.generateCompatibilityReport(currentUser, matchFound as any);
        setMatchInsight(insight);
        
        const ice = await getIcebreaker(matchFound.intent || 'playing', matchFound);
        setAiIcebreaker(ice);
      };
      fetchAI();
    }
  }, [matchFound, currentUser]);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => setSearchTime(t => t + 1), 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Listener for my own request status
  useEffect(() => {
    if (!requestId || !isSearching) return;

    return onSnapshot(doc(db, 'matchmaking', requestId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status === 'matched') {
          setMatchFound({
            uid: data.matchId,
            nickname: data.matchName,
            photoURL: data.matchPhoto,
            intent: data.matchIntent,
            game: data.game,
            region: data.region,
            chatId: data.chatId
          });
          setIsSearching(false);
          setRequestId(null);
          
          // Set status to playing when matched (receiver)
          if (currentUser) {
            updateDoc(doc(db, 'users', currentUser.uid), { status: 'playing' }).catch(console.error);
          }
          
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          audio.play().catch(() => {});
        }
      }
    });
  }, [requestId, isSearching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestId) {
        deleteDoc(doc(db, 'matchmaking', requestId)).catch(() => {});
      }
    };
  }, [requestId]);

  const toggleSearch = async () => {
    if (!currentUser) return;

    if (isSearching) {
      setIsSearching(false);
      // Reset status to online when canceling search
      if (currentUser) {
        updateDoc(doc(db, 'users', currentUser.uid), { status: 'online' }).catch(console.error);
      }
      if (requestId) {
        await deleteDoc(doc(db, 'matchmaking', requestId));
        setRequestId(null);
      }
    } else {
      setIsSearching(true);
      setMatchFound(null);
      // Set status to searching
      updateDoc(doc(db, 'users', currentUser.uid), { status: 'searching' }).catch(console.error);
      
      const game = currentUser.favoriteGames?.[0] || 'Geral';
      const region = currentUser.region || 'São Paulo';
      const intent = currentUser.currentIntent || 'playing';

      try {
        // 1. Look for other searches favoring same intent
        const q = query(
          collection(db, 'matchmaking'),
          where('game', '==', game),
          where('region', '==', region),
          where('intent', '==', intent),
          where('status', '==', 'searching'),
          limit(3)
        );

        const snapshot = await getDocs(q);
        let otherRequest = snapshot.docs.find(d => d.data().userId !== currentUser.uid);

        // Fallback: search without intent if no match found for same intent
        if (!otherRequest) {
          const qFallback = query(
            collection(db, 'matchmaking'),
            where('game', '==', game),
            where('region', '==', region),
            where('status', '==', 'searching'),
            limit(5)
          );
          const snapFallback = await getDocs(qFallback);
          otherRequest = snapFallback.docs.find(d => d.data().userId !== currentUser.uid);
        }

        if (otherRequest) {
          const otherData = otherRequest.data();
          
          try {
            // 2. Found! Create a professional chat via secure API
            const { chatId } = await apiService.createChat(otherData.userId);

            // 3. Mark both as matched
            await updateDoc(doc(db, 'matchmaking', otherRequest.id), {
              status: 'matched',
              matchId: currentUser.uid,
              matchName: currentUser.nickname || currentUser.displayName,
              matchPhoto: currentUser.photoURL,
              matchIntent: intent,
              chatId
            });

            // Set status to playing when matched
            updateDoc(doc(db, 'users', currentUser.uid), { status: 'playing' }).catch(console.error);

            setMatchFound({
              uid: otherData.userId,
              nickname: otherData.username,
              photoURL: otherData.photoURL,
              game: otherData.game,
              region: otherData.region,
              intent: otherData.intent,
              chatId
            });
            setIsSearching(false);
          } catch (error: any) {
            console.error('Match creation error:', error);
            alert(error.message);
            setIsSearching(false);
          }

          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          audio.play().catch(() => {});
        } else {
          // 4. No one found, post my own request with intent
          const docRef = await addDoc(collection(db, 'matchmaking'), {
            userId: currentUser.uid,
            username: currentUser.nickname || currentUser.displayName,
            photoURL: currentUser.photoURL,
            game,
            region,
            intent,
            status: 'searching',
            createdAt: serverTimestamp()
          });
          setRequestId(docRef.id);
        }
      } catch (error) {
        console.error('Matchmaking error:', error);
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="p-4 mb-2">
      <motion.div 
        whileHover={{ scale: 1.005 }}
        className={cn(
          "vibe-card p-8 relative overflow-hidden transition-all duration-500 rounded-[32px] border-vibe-border/20",
          isSearching ? "bg-vibe-neon-blue/5 shadow-[0_0_40px_rgba(0,242,255,0.1)]" : "bg-vibe-card shadow-xl"
        )}
      >
        {!matchFound ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
             <div className="flex items-center space-x-6">
                <div className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 relative group",
                  isSearching ? "bg-vibe-neon-blue text-vibe-bg shadow-[0_0_30px_rgba(0,242,255,0.4)]" : "bg-white/5 text-vibe-muted"
                )}>
                  {isSearching ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 active:scale-125 transition-transform" />}
                  {isSearching && (
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-vibe-neon-blue/30 rounded-[24px] blur-md"
                    />
                  )}
                </div>
                <div>
                   <h3 className="text-xl font-bold tracking-tight text-white uppercase mb-1">
                     {isSearching ? 'Sintonizando Frequências' : 'Matchmaking Instantâneo'}
                   </h3>
                   <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={cn(
                            "w-1 h-1 rounded-full",
                            isSearching ? "bg-vibe-neon-blue animate-pulse" : "bg-vibe-muted opacity-30"
                          )} style={{ animationDelay: `${i * 200}ms` }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-black tracking-widest text-vibe-muted uppercase opacity-70">
                        {isSearching ? `Buscando duo ideal... ${searchTime}s` : 'Encontre jogadores compatíveis agora'}
                      </p>
                   </div>
                </div>
             </div>
             
             <button 
                onClick={toggleSearch}
                className={cn(
                  "w-full md:w-auto px-10 py-4 rounded-[20px] font-black uppercase text-xs tracking-widest transition-all tap-effect shadow-2xl",
                  isSearching ? "bg-white/5 text-white border border-white/10" : "bg-vibe-gradient text-white shadow-vibe-neon-blue/30"
                )}
             >
               {isSearching ? 'Cancelar Busca' : 'Começar Match'}
             </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-8 relative z-10 text-center py-4"
          >
            {/* Success dopamine header */}
            <div className="flex items-center space-x-4 mb-2">
               <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-vibe-neon-blue/50" />
               <h4 className="text-[11px] font-black text-vibe-neon-blue uppercase tracking-[0.3em] flex items-center">
                 <Sparkles className="w-3 h-3 mr-2" />
                 Sincronização Completa
               </h4>
               <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-vibe-neon-blue/50" />
            </div>

            <div className="flex flex-col items-center gap-6">
               <div className="relative">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -inset-8 bg-vibe-neon-blue/10 rounded-full blur-[40px] animate-pulse" 
                  />
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[48px] p-[3px] bg-vibe-gradient shadow-2xl shadow-vibe-neon-blue/40 relative z-10 rotate-3 transition-transform hover:rotate-0 duration-500">
                    <img src={matchFound.photoURL} className="w-full h-full rounded-[45px] border-4 border-vibe-bg object-cover" />
                    <motion.div 
                      layoutId="match-badge"
                      className="absolute -top-3 -right-3 bg-vibe-neon-blue text-vibe-bg text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-vibe-bg z-20"
                    >
                      98% MATCH
                    </motion.div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight mb-2">{matchFound.nickname}</h3>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                       <span className="flex items-center px-4 py-1.5 bg-white/5 rounded-xl text-[10px] text-vibe-muted font-bold uppercase tracking-wider border border-white/5">
                          <Gamepad2 className="w-3 h-3 mr-2 text-vibe-neon-blue" />
                          {matchFound.game}
                       </span>
                       <span className="flex items-center px-4 py-1.5 bg-white/5 rounded-xl text-[10px] text-vibe-muted font-bold uppercase tracking-wider border border-white/5">
                          <MapPin className="w-3 h-3 mr-2 text-vibe-neon-pink" />
                          {matchFound.region}
                       </span>
                       <span className="flex items-center px-4 py-1.5 bg-vibe-neon-purple/10 rounded-xl text-[10px] text-vibe-neon-purple font-bold uppercase tracking-wider border border-vibe-neon-purple/20">
                          <Sparkles className="w-3 h-3 mr-2" />
                          Ultra Sincronia
                       </span>
                    </div>
                  </div>

                  <div className="max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 pt-6">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-3xl text-left relative group">
                       <div className="absolute top-3 right-3 text-vibe-neon-blue/20 flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase">Icebreaker</span>
                       </div>
                       <p className="text-[9px] font-black text-vibe-muted uppercase tracking-widest mb-1 shadow-sm">AI Sugestão</p>
                       <p className="text-xs text-vibe-text italic leading-relaxed">"{aiIcebreaker || 'Gerando sugestão...'}"</p>
                    </div>
                    
                    <div className="bg-vibe-neon-blue/5 border border-vibe-neon-blue/10 p-4 rounded-3xl text-left relative">
                       <div className="absolute top-3 right-3 text-vibe-neon-blue/20">
                          <Target className="w-3 h-3" />
                       </div>
                       <p className="text-[9px] font-black text-vibe-neon-blue uppercase tracking-widest mb-1">Vibe Insight</p>
                       <p className="text-[11px] text-vibe-muted leading-tight font-medium">
                         {matchInsight || 'Analisando compatibilidade...'}
                       </p>
                    </div>
                  </div>
               </div>
            </div>
 
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto pt-4">
               <button 
                 onClick={() => {
                   setIsSearching(false);
                   setMatchFound(null);
                   setMatchInsight('');
                   setAiIcebreaker('');
                 }}
                 className="btn-secondary px-8 py-4 "
               >
                 Tentar Outro
               </button>
               <button 
                 onClick={() => navigate(`/chat/${matchFound.chatId}`, { state: { initialMessage: aiIcebreaker }})}
                 className="btn-primary px-12 py-4 flex items-center justify-center space-x-3"
               >
                 <Sparkles className="w-5 h-5" />
                 <span>Conectar Agora</span>
               </button>
            </div>
          </motion.div>
        )}

        {/* Radar animation circles */}
        <AnimatePresence>
          {isSearching && (
             <div className="absolute inset-0 pointer-events-none opacity-50">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-vibe-neon-blue/30 rounded-full"
                  />
                ))}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-vibe-neon-blue/20 to-transparent animate-spin duration-[4000ms] will-change-transform" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1px] w-full bg-gradient-to-r from-transparent via-vibe-neon-blue/20 to-transparent animate-spin duration-[6000ms] will-change-transform" />
             </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
