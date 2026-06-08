import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Story, Post } from '../types';
import StoryViewer from '../components/StoryViewer';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import PostCard from '../components/PostCard';
import UserSuggestions from '../components/UserSuggestions';
import ErrorBoundary from '../components/ErrorBoundary';
import CommentModal from '../components/CommentModal';
import DailyRewardModal from '../components/DailyRewardModal';
import InstantMatch from '../components/InstantMatch';
import SEOFooter from '../components/SEOFooter';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';
import { format, differenceInDays } from 'date-fns';
import { Virtuoso } from 'react-virtuoso';

import { useGamerStats } from '../hooks/useGamerStats';
import { Coins, Sparkles, Trophy, Download, X, MessageSquare, Flame, Globe, ChevronRight, PlusSquare, Gift, Share2, Copy, Check, Camera, Award, ShieldAlert, Users, Link as LinkIcon } from 'lucide-react';
import { sendNotification } from '../services/notificationService';

const APP_URL = "https://playzi.app.br";

const ReferralBanner = ({ user, onHide }: { user: any, onHide: () => void }) => {
   const [copied, setCopied] = useState(false);
   const link = `${APP_URL}/login?ref=${user?.referralCode || user?.uid}`;
   
   const handleCopy = () => {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const rewards = [
     { goal: 5, label: "VIP", icon: <Award className="w-3.5 h-3.5 text-vibe-neon-blue" /> },
     { goal: 10, label: "Coins", icon: <Coins className="w-3.5 h-3.5 text-yellow-500" /> },
     { goal: 20, label: "Elite", icon: <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> }
   ];

   const count = user?.referralCount || 0;

   return (
      <div className="vibe-card bg-vibe-neon-blue/5 border-vibe-neon-blue/20 p-6 mb-6 overflow-hidden relative group">
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-vibe-neon-blue/10 blur-3xl rounded-full group-hover:bg-vibe-neon-blue/20 transition-all" />
         <button 
           onClick={onHide}
           className="absolute top-4 right-4 p-2 text-vibe-muted hover:text-vibe-text z-20 hover:bg-white/5 rounded-lg transition-all"
         >
           <X className="w-4 h-4" />
         </button>
         
         <div className="flex flex-col space-y-6 relative z-10">
            <div className="flex items-center space-x-4">
               <div className="w-16 h-16 bg-vibe-neon-blue/20 rounded-[20px] flex items-center justify-center flex-shrink-0 animate-pulse border border-vibe-neon-blue/30 shadow-glow-blue">
                  <Users className="w-8 h-8 text-vibe-neon-blue" />
               </div>
               <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-tighter italic">Seu Squad de Convidados</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-vibe-neon-blue bg-vibe-neon-blue/10 px-2 py-0.5 rounded-full border border-vibe-neon-blue/20">
                      {count} Convites
                    </span>
                    <span className="text-[10px] text-vibe-muted font-bold uppercase tracking-widest">Até a próxima meta</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
               {rewards.map((r, i) => (
                  <div key={i} className={cn(
                    "p-3 rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center",
                    count >= r.goal ? "bg-white/10 border-vibe-neon-blue/40 border shadow-glow-blue" : "bg-black/40 opacity-40"
                  )}>
                     {r.icon}
                     <span className="text-[7px] font-black uppercase text-white leading-none">{r.label}</span>
                     <span className="text-[6px] font-bold text-vibe-muted uppercase tracking-tighter">Meta: {r.goal}</span>
                  </div>
               ))}
            </div>
            
            <div className="flex items-center space-x-2">
               <div className="flex-1 bg-black/60 rounded-xl px-4 py-3 border border-white/5 truncate text-[9px] font-mono text-vibe-muted flex items-center">
                  <LinkIcon className="w-3 h-3 mr-2 opacity-50" />
                  {link}
               </div>
               <button 
                 onClick={handleCopy}
                 className={cn(
                   "p-3 rounded-xl transition-all active:scale-95 flex items-center justify-center",
                   copied ? "bg-green-500 text-white" : "bg-vibe-neon-blue text-vibe-bg shadow-glow-blue"
                 )}
               >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               </button>
            </div>
         </div>
      </div>
   );
};


const MemoizedPostCard = memo(PostCard);

export default function Feed() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { isVisible: isInstallVisible, installApp } = usePWAInstall();
  const { awardXP, awardCoins, getXPForLevel } = useGamerStats();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyStats, setDailyStats] = useState({ streak: 1, coins: 50, xp: 100 });
  const [activeStoryGroup, setActiveStoryGroup] = useState<Story[] | null>(null);
  const [showReferralBanner, setShowReferralBanner] = useState(true);

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
      const parsedPosts = snapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        return { id: doc.id, ...data } as Post;
      });
      // Client-side moderation filter
      const filteredPosts = parsedPosts.filter(p => {
        const uDisplayName = (p.userDisplayName || '').toLowerCase();
        const uId = (p.userId || '').toLowerCase();
        return uDisplayName !== 'anaclara0927bb' && uId !== 'anaclara0927bb';
      });
      setPosts(filteredPosts);
      setLoading(false);
    });

    // Stories fetch
    const now = new Date();
    const qStories = query(
       collection(db, 'stories'),
       orderBy('createdAt', 'desc')
    );
    const unsubStories = onSnapshot(qStories, (snap) => {
       const allStories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
       // Client side filter for expiry and banned user
       const activeStories = allStories.filter(s => {
         const isExpired = s.expiresAt.toDate() <= now;
         const uDisplayName = (s.userDisplayName || '').toLowerCase();
         const uId = (s.userId || '').toLowerCase();
         return !isExpired && uDisplayName !== 'anaclara0927bb' && uId !== 'anaclara0927bb';
       });
       setStories(activeStories);
    });

    return () => {
       unsubscribe();
       unsubStories();
    };
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

  // Group stories by user
  const groupedStories = useMemo(() => {
     const groups: Record<string, Story[]> = {};
     stories.forEach(s => {
        if (!groups[s.userId]) groups[s.userId] = [];
        groups[s.userId].push(s);
     });
     return Object.values(groups);
  }, [stories]);

  const components = useMemo(() => ({
    Header: () => (
      <div className="max-w-xl mx-auto px-0 pt-2">
        {/* Instagram Style Stories */}
        <div className="flex space-x-4 p-4 overflow-x-auto no-scrollbar border-b border-white/5 mb-2 px-4 scroll-smooth snap-x snap-mandatory">
          {/* User's own story "add" circle */}
          <div className="flex-shrink-0 flex flex-col items-center space-y-1 group relative snap-center">
             <div className="relative">
                <div 
                  className="w-[68px] h-[68px] rounded-full p-[3px] border border-white/10 hover:border-vibe-neon-blue transition-colors cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  <div className="w-full h-full rounded-full border-2 border-vibe-bg overflow-hidden">
                    <img src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.username}&background=random`} className="w-full h-full object-cover" />
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/create-post')}
                  className="absolute -bottom-1 -right-1 bg-vibe-neon-blue text-vibe-bg rounded-full p-1 border-2 border-vibe-bg shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                   <Camera className="w-3 h-3" />
                </button>
                <div className="absolute -top-1 -left-1 bg-vibe-gradient text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-vibe-bg shadow-glow-blue">
                   L{currentUser?.level || 1}
                </div>
             </div>
             <span className="text-[10px] font-medium text-vibe-muted truncate w-16 text-center">Seu Perfil</span>
          </div>

          {groupedStories.map((group, i) => {
             const lastStory = group[0];
             const hasUnviewed = currentUser ? group.some(s => !s.viewers.includes(currentUser.uid)) : true;
             
             return (
               <div key={i} className="flex-shrink-0 flex flex-col items-center space-y-1 group cursor-pointer touch-manipulation snap-center" onClick={() => setActiveStoryGroup(group)}>
                 <div className={cn(
                   "w-[68px] h-[68px] rounded-full p-[2.5px] transition-transform duration-300 hover:scale-105",
                   hasUnviewed ? "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" : "bg-white/10"
                 )}>
                   <div className="w-full h-full rounded-full border-2 border-vibe-bg overflow-hidden relative">
                     <img src={lastStory.userPhotoURL || ''} alt="User" loading="lazy" className="w-full h-full object-cover animate-in fade-in duration-500" />
                   </div>
                 </div>
                 <span className="text-[10px] font-medium text-vibe-muted truncate w-16 text-center">{lastStory.userDisplayName}</span>
               </div>
             );
          })}
        </div>

        <div className="px-4 py-4 mb-2 flex items-center justify-between">
           <div>
              <h2 className="text-sm font-black uppercase tracking-tighter text-vibe-text">Social Feed</h2>
              <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-widest leading-none">Novidades da Comunidade</p>
           </div>
           <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-tighter">COMUNIDADE ATIVA</span>
           </div>
        </div>

        <InstantMatch />
      </div>
    ),
    Footer: () => (
      <div className="flex flex-col">
        <SEOFooter />
        <div className="h-32" /> {/* Safe area for BottomNav */}
      </div>
    )
  }), [currentUser, t, navigate, isInstallVisible, installApp, getXPForLevel]);

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Playzi",
    "url": "https://playzi.app.br/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://playzi.app.br/explore?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="bg-vibe-bg">
      <SEO 
        title="Chat de Vídeo Gamer, Matchmaking e Squads Grátis" 
        description="Playzi é a melhor rede social gamer do Brasil. Chat de vídeo 1v1, matchmaking para Free Fire e Roblox, e comunidades de jogos. Conheça pessoas novas e encontre seu duo!" 
        keywords="chat gamer, matchmaking brasil, squad free fire, amigos roblox, amizades online brasil, badoo gamer"
        url="https://playzi.app.br/"
        schema={homeSchema}
      />
      
      <h1 className="sr-only">Playzi - Feed da Comunidade Gamer</h1>
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

      <AnimatePresence>
        {activeStoryGroup && (
          <StoryViewer 
            stories={activeStoryGroup} 
            onClose={() => setActiveStoryGroup(null)} 
            currentUserId={currentUser?.uid}
          />
        )}
      </AnimatePresence>
      
      <Virtuoso
        useWindowScroll
        data={posts}
        totalCount={posts.length}
        components={components}
        itemContent={(index, post) => (
          <div className="px-4 md:px-0">
            {index === 2 && showReferralBanner && (
              <ReferralBanner 
                user={currentUser} 
                onHide={() => setShowReferralBanner(false)} 
              />
            )}
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
        <div className="max-w-xl mx-auto px-4 space-y-8 mt-4">
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

