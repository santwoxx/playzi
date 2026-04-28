import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import UserSuggestions from '../components/UserSuggestions';
import ErrorBoundary from '../components/ErrorBoundary';
import CommentModal from '../components/CommentModal';
import DailyRewardModal from '../components/DailyRewardModal';
import InstantMatch from '../components/InstantMatch';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';
import { format, differenceInDays } from 'date-fns';
import { Virtuoso } from 'react-virtuoso';

import { useGamerStats } from '../hooks/useGamerStats';
import { Coins, Sparkles, Trophy, Download, X, MessageSquare, Flame, Globe, ChevronRight } from 'lucide-react';
import { sendNotification } from '../services/notificationService';

const MemoizedPostCard = memo(PostCard);

export default function Feed() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { isVisible: isInstallVisible, installApp } = usePWAInstall();
  const { awardXP, awardCoins, getXPForLevel } = useGamerStats();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyStats, setDailyStats] = useState({ streak: 1, coins: 50, xp: 100 });

  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    postId: string;
    ownerId: string;
    caption: string;
  }>({
    isOpen: false,
    postId: '',
    ownerId: '',
    caption: ''
  });

  // Daily Reward Check
  useEffect(() => {
    if (!currentUser) return;

    const checkDailyReward = async () => {
      const lastReward = currentUser.lastRewardDate; // YYYY-MM-DD
      const today = format(new Date(), 'yyyy-MM-dd');

      if (lastReward !== today) {
        let newStreak = (currentUser.streak || 0) + 1;
        
        // Reset streak if missed a day
        if (lastReward) {
          const lastDate = new Date(lastReward);
          const diff = differenceInDays(new Date(), lastDate);
          if (diff > 1) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        setDailyStats({
          streak: newStreak,
          coins: 50 + (newStreak * 10),
          xp: 100 + (newStreak * 20)
        });
        
        setTimeout(() => setShowDailyReward(true), 2000);
      }
    };

    checkDailyReward();
  }, [currentUser]);

  const handleClaimReward = async () => {
    if (!currentUser) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      await awardCoins(dailyStats.coins);
      await awardXP(dailyStats.xp);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastRewardDate: today,
        streak: dailyStats.streak
      });
    } catch (err) {
      console.error('Error claiming reward:', err);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        return { id: doc.id, ...data } as Post;
      }));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.likes.includes(currentUser.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
    } else {
      try {
        await apiService.incrementUsage('like');
        await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
        
        if (post.userId !== currentUser.uid) {
          await sendNotification({
            userId: post.userId,
            type: 'like',
            title: 'Nova curtida!',
            content: `${currentUser.nickname || currentUser.displayName} curtiu seu post: "${post.caption?.substring(0, 20)}..."`,
            link: '/',
            senderName: currentUser.nickname || currentUser.displayName,
            senderPhoto: currentUser.photoURL
          });
        }

        // Award XP and coins for interacting
        await awardXP(10);
        await awardCoins(5);
      } catch (error: any) {
        console.error('Like error:', error);
      }
    }
  }, [currentUser, posts, awardXP, awardCoins]);

  const handleComment = useCallback((postId: string, ownerId: string, caption: string) => {
    setCommentModal({
      isOpen: true,
      postId,
      ownerId,
      caption: caption || ''
    });
  }, []);

  const closeCommentModal = useCallback(() => {
    setCommentModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const components = useMemo(() => ({
    Header: () => (
      <div className="max-w-md mx-auto px-4 md:px-0 pt-6">
        <div className="flex items-center justify-between pb-8">
          <div className="flex items-center space-x-4">
             <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-vibe-gradient p-[1px] shadow-lg shadow-vibe-neon-blue/10 active:scale-95 transition-transform cursor-pointer" onClick={() => navigate('/profile')}>
                  <img 
                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random`} 
                    className="w-full h-full rounded-2xl object-cover border-4 border-vibe-bg"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-vibe-neon-blue text-vibe-bg text-[9px] font-black px-1.5 py-0.5 rounded-lg border-2 border-vibe-bg flex items-center shadow-lg">
                   L{currentUser?.level}
                </div>
             </div>
             <div>
                <h1 className="text-2xl font-bold text-vibe-text tracking-tight uppercase leading-none mb-1">
                  {t('salve')}, {currentUser?.nickname?.split(' ')[0] || currentUser?.displayName?.split(' ')[0]}
                </h1>
                <div className="flex items-center gap-4 touch-manipulation opacity-80">
                   <div className="flex items-center text-vibe-neon-blue">
                      <Coins className="w-3 h-3 mr-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{currentUser?.coins}</span>
                   </div>
                   <div className="flex items-center text-vibe-neon-purple">
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{currentUser?.xp} XP</span>
                   </div>
                </div>
             </div>
          </div>
          <button 
             onClick={() => navigate('/rankings')}
             className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all tap-effect"
          >
             <Trophy className="w-5 h-5 text-vibe-neon-blue" />
          </button>
        </div>

        <div className="mb-10 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
           <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(currentUser?.xp || 0) / getXPForLevel(currentUser?.level || 1) * 100}%` }}
              className="h-full bg-vibe-gradient rounded-full shadow-[0_0_12px_rgba(0,242,255,0.4)]"
           />
        </div>

        <AnimatePresence>
          {isInstallVisible && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-vibe-gradient rounded-3xl relative overflow-hidden group shadow-lg shadow-vibe-neon-blue/20"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-sm tracking-tighter">Instalar Playsi</h3>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Experiência ágil na sua tela inicial</p>
                  </div>
                </div>
                <button 
                  onClick={installApp}
                  className="bg-white text-vibe-bg px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all touch-manipulation"
                >
                  Instalar
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        <InstantMatch />
        
        <div 
          onClick={() => navigate('/global-chat')}
          className="mb-8 p-6 bg-vibe-bg border border-vibe-neon-blue/30 rounded-[32px] flex items-center justify-between group cursor-pointer hover:neon-border transition-all shadow-lg active:scale-[0.98] relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
             <MessageSquare className="w-20 h-20 text-vibe-neon-blue" />
           </div>
           <div className="flex items-center space-x-5 relative z-10">
              <div className="w-14 h-14 bg-vibe-neon-blue/10 rounded-2xl flex items-center justify-center border border-vibe-neon-blue/20">
                 <Globe className="w-7 h-7 text-vibe-neon-blue animate-pulse" />
              </div>
              <div>
                 <h3 className="text-vibe-neon-blue font-black uppercase text-sm tracking-tighter">{t('global_chat')}</h3>
                 <p className="text-vibe-muted text-[10px] font-bold uppercase tracking-widest">{t('chat_with_everyone')}</p>
              </div>
           </div>
           <div className="relative z-10 w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-vibe-neon-blue group-hover:text-vibe-bg transition-all">
              <ChevronRight className="w-5 h-5" />
           </div>
        </div>

        <ErrorBoundary>
          <UserSuggestions />
        </ErrorBoundary>

        <div className="flex space-x-4 p-4 overflow-x-auto no-scrollbar vibe-card mb-8 snap-x snap-mandatory px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center space-y-2 group cursor-pointer touch-manipulation snap-center">
              <div className="w-16 h-16 rounded-full p-[2px] bg-vibe-gradient group-hover:scale-110 transition-transform">
                <div className="w-full h-full rounded-full border-2 border-vibe-bg overflow-hidden relative">
                  <img src={`https://picsum.photos/seed/gamer${i + 20}/100/100`} alt="User" loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-vibe-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-[10px] font-black text-vibe-muted uppercase tracking-tighter group-hover:text-vibe-neon-blue transition-colors">gamer_{i}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    Footer: () => (
      <div className="h-32" /> /* Safe area for BottomNav */
    )
  }), [currentUser, t, navigate, isInstallVisible, installApp, getXPForLevel]);

  return (
    <div className="bg-vibe-bg min-h-screen">
      <DailyRewardModal 
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        streak={dailyStats.streak}
        rewardCoins={dailyStats.coins}
        rewardXP={dailyStats.xp}
        onClaim={handleClaimReward}
      />
      <CommentModal 
        isOpen={commentModal.isOpen}
        postId={commentModal.postId}
        postOwnerId={commentModal.ownerId}
        postCaption={commentModal.caption}
        onClose={closeCommentModal}
      />
      
      <Virtuoso
        useWindowScroll
        data={posts}
        totalCount={posts.length}
        components={components}
        itemContent={(index, post) => (
          <div className="px-4 md:px-0">
            <MemoizedPostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUser?.uid}
              onLike={handleLike}
              onComment={handleComment}
            />
          </div>
        )}
      />

      {loading && (
        <div className="max-w-md mx-auto px-4 space-y-8 mt-4">
          {[1, 2].map(i => (
            <div key={i} className="vibe-card h-[420px] overflow-hidden flex flex-col">
               <div className="p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full shimmer opacity-20" />
                  <div className="space-y-2">
                     <div className="w-24 h-3 rounded-full shimmer opacity-20" />
                     <div className="w-16 h-2 rounded-full shimmer opacity-10" />
                  </div>
               </div>
               <div className="flex-1 shimmer opacity-5" />
               <div className="p-5 space-y-2">
                  <div className="w-full h-3 rounded-full shimmer opacity-10" />
                  <div className="w-2/3 h-3 rounded-full shimmer opacity-10" />
               </div>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="max-w-lg mx-auto px-4 text-center py-20 vibe-card border-dashed">
          <p className="text-vibe-muted uppercase font-black tracking-widest text-sm opacity-50">Nenhuma postagem ainda</p>
        </div>
      )}
    </div>
  );
}

