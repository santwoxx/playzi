import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp, limit, addDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Swipe, Match } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, MapPin, Star, Shield, Zap, Camera, MessageCircle, Info, RefreshCw, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { sendNotification } from '../services/notificationService';

const SwipeCard = ({ user, onSwipe, active }: { user: User, onSwipe: (type: 'like' | 'dislike') => void, active: boolean }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const dislikeOpacity = useTransform(x, [-150, -50], [1, 0]);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('like');
    } else if (info.offset.x < -100) {
      onSwipe('dislike');
    }
  };

  const photos = user.photos && user.photos.length > 0 ? user.photos : [user.photoURL || 'https://via.placeholder.com/400x600?text=No+Photo'];

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: active ? 10 : 0 }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-0 bg-vibe-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing",
        !active && "scale-95 translate-y-2 opacity-50"
      )}
    >
      {/* Photo Gallery */}
      <div className="relative w-full h-full">
        <img 
          src={photos[currentPhotoIndex]} 
          alt={user.nickname} 
          className="w-full h-full object-cover select-none pointer-events-none" 
        />
        
        {/* Photo Navigation Overlays */}
        <div className="absolute inset-x-0 top-0 h-1/2 flex">
          <div 
            className="w-1/2 h-full cursor-pointer" 
            onClick={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
          />
          <div 
            className="w-1/2 h-full cursor-pointer" 
            onClick={() => setCurrentPhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
          />
        </div>

        {/* Photo Indicators */}
        <div className="absolute top-4 inset-x-4 flex space-x-1">
          {photos.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 flex-1 rounded-full bg-white/20",
                i === currentPhotoIndex && "bg-white shadow-[0_0_8px_white]"
              )}
            />
          ))}
        </div>

        {/* Swipe Indicators */}
        <motion.div 
          style={{ opacity: likeOpacity }}
          className="absolute top-20 left-10 border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-20deg]"
        >
          <span className="text-green-500 font-black text-4xl uppercase">Like</span>
        </motion.div>
        <motion.div 
          style={{ opacity: dislikeOpacity }}
          className="absolute top-20 right-10 border-4 border-red-500 rounded-lg px-4 py-2 rotate-[20deg]"
        >
          <span className="text-red-500 font-black text-4xl uppercase">Pass</span>
        </motion.div>

        {/* Info Layout */}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl font-black text-white">{user.nickname || user.displayName}, {user.age}</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online" />
              </div>
              <div className="flex items-center text-vibe-muted space-x-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{user.location?.city || 'Brasil'} • 2km</span>
              </div>
              <p className="mt-2 text-sm text-vibe-text line-clamp-2 max-w-[240px]">
                {user.bio || "Bora jogar algo? Atualmente curtindo muito e procurando squad!"}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                 {(user.favoriteGames || ['Free Fire', 'Roblox']).slice(0, 2).map((game, i) => (
                   <span key={i} className="text-[9px] font-black uppercase bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                      {game}
                   </span>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Encontros() {
  const { currentUser, refreshUser } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState<User | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const navigate = useNavigate();

  const minPhotosRequired = 3;
  const hasEnoughPhotos = (currentUser?.photos?.length || 0) >= minPhotosRequired;

  useEffect(() => {
    if (!currentUser) return;

    const initialize = async () => {
      // Get location if not set
      if (!currentUser.location?.coordinates) {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              setLocationPermission('granted');
              const { latitude, longitude } = pos.coords;
              await setDoc(doc(db, 'users', currentUser.uid), {
                location: {
                  coordinates: { lat: latitude, lng: longitude },
                  city: 'São Paulo' // Simplified, would use reverse geocoding normally
                }
              }, { merge: true });
              await refreshUser();
            },
            () => setLocationPermission('denied')
          );
        }
      } else {
        setLocationPermission('granted');
      }

      // Fetch potential matches
      fetchPotentials();
    };

    initialize();
  }, [currentUser?.uid]);

  const fetchPotentials = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      // Query users who have at least 3 photos (simulated filter)
      // and who aren't the current user
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('onboarded', '==', true),
        limit(50)
      );
      
      const snap = await getDocs(q);
      const swipesRef = collection(db, 'swipes');
      const mySwipesSnap = await getDocs(query(swipesRef, where('fromUserId', '==', currentUser.uid)));
      const swipedUserIds = mySwipesSnap.docs.map(d => d.data().toUserId);

      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as unknown as User))
        .filter(u => {
          const uNickname = (u.nickname || '').toLowerCase();
          const uDisplayName = (u.displayName || '').toLowerCase();
          const uId = (u.uid || '').toLowerCase();
          const isBanned = uNickname === 'anaclara0927bb' || uDisplayName === 'anaclara0927bb' || uId === 'anaclara0927bb';
          
          return u.uid !== currentUser.uid && 
            !swipedUserIds.includes(u.uid) &&
            (u.photos?.length || 0) >= minPhotosRequired &&
            !isBanned;
        });

      setPotentialMatches(users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (type: 'like' | 'dislike') => {
    const targetUser = potentialMatches[currentIndex];
    if (!currentUser || !targetUser) return;

    // Save swipe
    const swipeId = `${currentUser.uid}_${targetUser.uid}`;
    await setDoc(doc(db, 'swipes', swipeId), {
      id: swipeId,
      fromUserId: currentUser.uid,
      toUserId: targetUser.uid,
      type,
      createdAt: serverTimestamp()
    });

    if (type === 'like') {
      // Check for mutual like
      const reverseSwipeId = `${targetUser.uid}_${currentUser.uid}`;
      const reverseSwipeDoc = await getDoc(doc(db, 'swipes', reverseSwipeId));
      
      if (reverseSwipeDoc.exists() && reverseSwipeDoc.data().type === 'like') {
        const matchId = [currentUser.uid, targetUser.uid].sort().join('_');
        await setDoc(doc(db, 'matches', matchId), {
          id: matchId,
          userIds: [currentUser.uid, targetUser.uid],
          createdAt: serverTimestamp(),
          chatCreated: false
        });
        
        setShowMatchModal(targetUser);
        
        // Notify both
        await sendNotification({
          userId: targetUser.uid,
          type: 'match',
          title: 'Novo Match! ❤️',
          content: `${currentUser.nickname} também curtiu você! Comece um chat agora.`,
          link: `/chat?uid=${currentUser.uid}`
        });
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleStartChat = async (targetUser: User) => {
    // Navigate to chat
    navigate(`/chat?uid=${targetUser.uid}`);
  };

  if (!hasEnoughPhotos) {
    return (
      <div className="pt-24 pb-20 px-6 min-h-screen bg-vibe-bg gaming-grid flex flex-col items-center justify-center text-center">
         <SEO title="Encontros - Adicione Fotos" />
         <div className="vibe-card p-8 max-w-sm">
            <div className="w-20 h-20 bg-vibe-neon-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Camera className="w-10 h-10 text-vibe-neon-blue" />
            </div>
            <h2 className="text-2xl font-black text-white italic mb-4 uppercase tracking-tighter">Faltam Fotos!</h2>
            <p className="text-vibe-text text-sm mb-8">
              Para participar dos Encontros e dar match com outros gamers, você precisa de pelo menos <b>3 fotos</b> no seu perfil.
            </p>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full py-4 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-widest rounded-2xl shadow-glow-blue"
            >
               Adicionar Fotos Agora
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 px-4 md:pt-24 min-h-screen bg-vibe-bg gaming-grid flex flex-col">
      <SEO title="Encontros Gamer" description="Dê match com pessoas perto de você e encontre seu duos ou squad." />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto w-full px-2">
         <div className="flex items-center space-x-3">
            <div className="p-2 bg-vibe-neon-pink/10 rounded-xl">
               <Heart className="w-6 h-6 text-vibe-neon-pink animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Encontros</h1>
         </div>
         <div className="flex items-center space-x-2">
            <button className="p-2 bg-white/5 rounded-xl border border-white/5">
                <Filter className="w-5 h-5 text-vibe-muted" />
            </button>
         </div>
      </div>

      {/* Main Swipe Area */}
      <div className="flex-1 max-w-md mx-auto w-full relative mb-8 min-h-[500px]">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
             <RefreshCw className="w-10 h-10 text-vibe-neon-blue animate-spin" />
             <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest">Buscando players...</p>
          </div>
        ) : potentialMatches.length > currentIndex ? (
          <div className="relative w-full h-[600px]">
            {potentialMatches.slice(currentIndex, currentIndex + 2).reverse().map((user, i) => (
              <SwipeCard 
                key={user.uid} 
                user={user} 
                active={i === 1 || potentialMatches.length - currentIndex === 1}
                onSwipe={handleSwipe}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6 text-center px-8">
             <div className="w-20 h-20 bg-vibe-card rounded-full flex items-center justify-center border border-white/5">
                <Info className="w-10 h-10 text-vibe-muted" />
             </div>
             <div>
               <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Sem mais players por perto</h3>
               <p className="text-vibe-muted text-sm mt-2">Tente mudar seus filtros ou volte mais tarde para novos encontros!</p>
             </div>
             <button 
               onClick={fetchPotentials}
               className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-vibe-text hover:bg-white/10 transition-all"
             >
                Recarregar Busca
             </button>
          </div>
        )}
      </div>

      {/* Control Buttons (Static fallback for tap instead of swipe) */}
      <div className="max-w-md mx-auto w-full flex items-center justify-center space-x-4 mb-8">
           <button 
             onClick={() => handleSwipe('dislike')}
             disabled={loading || potentialMatches.length <= currentIndex}
             className="w-16 h-16 bg-black border border-white/10 text-red-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
           >
              <X className="w-8 h-8" />
           </button>
           <button className="w-12 h-12 bg-black border border-white/10 text-vibe-neon-purple rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
              <Zap className="w-6 h-6 fill-vibe-neon-purple" />
           </button>
           <button 
             onClick={() => handleSwipe('like')}
             disabled={loading || potentialMatches.length <= currentIndex}
             className="w-16 h-16 bg-black border border-white/10 text-green-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
           >
              <Heart className="w-8 h-8 fill-green-500" />
           </button>
      </div>

      {/* Match Modal */}
      <AnimatePresence>
         {showMatchModal && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[200] bg-vibe-bg/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
           >
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="mb-12"
              >
                <div className="relative">
                   <h2 className="text-6xl font-black text-white italic italic uppercase tracking-tighter absolute -top-12 inset-x-0 z-10 drop-shadow-[0_0_20px_rgba(0,243,255,0.5)]">MATCH!</h2>
                   <div className="flex -space-x-6">
                      <div className="w-32 h-32 rounded-3xl border-4 border-vibe-neon-blue rotate-[-10deg] overflow-hidden">
                         <img src={currentUser?.photoURL || ''} className="w-full h-full object-cover" />
                      </div>
                      <div className="w-32 h-32 rounded-3xl border-4 border-vibe-neon-pink rotate-[10deg] overflow-hidden">
                         <img src={showMatchModal.photoURL || ''} className="w-full h-full object-cover" />
                      </div>
                   </div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <Heart className="w-16 h-16 text-red-500 fill-red-500 animate-bounce" />
                   </div>
                </div>
              </motion.div>

              <h3 className="text-xl font-bold text-white mb-2">Você e {showMatchModal.nickname} se curtiram!</h3>
              <p className="text-vibe-muted text-sm mb-12 max-w-xs uppercase font-black tracking-widest italic">Prepare-se para jogar juntos</p>

              <div className="space-y-4 w-full max-w-xs">
                 <button 
                   onClick={() => handleStartChat(showMatchModal)}
                   className="w-full flex items-center justify-center space-x-3 py-4 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-widest rounded-2xl shadow-glow-blue"
                 >
                    <MessageCircle className="w-5 h-5" />
                    <span>Enviar Mensagem</span>
                 </button>
                 <button 
                   onClick={() => setShowMatchModal(null)}
                   className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl"
                 >
                    Continuar Swiping
                 </button>
              </div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
