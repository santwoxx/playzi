import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Music, Disc, Volume2, VolumeX, ChevronLeft, Camera, Home, Search, PlayCircle, Gamepad2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import SEO from '../components/SEO';

interface ReelItemProps {
  post: Post;
  isActive: boolean;
}

const ReelItem = ({ post, isActive }: any) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative h-screen w-full bg-black snap-start shrink-0 flex items-center justify-center overflow-hidden">
      {/* Video Content */}
      <video
        ref={videoRef}
        src={post.mediaUrl}
        loop
        muted={isMuted}
        playsInline
        className="h-full w-full object-cover"
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
      />

      {/* Overlay - Bottom Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Interactions Side Bar */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6 z-10">
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => navigate(`/profile/${post.userId}`)}>
          <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden mb-1">
            <img src={post.userPhotoURL} alt={post.userDisplayName} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 w-5 h-5 bg-vibe-neon-blue rounded-full flex items-center justify-center border-2 border-black">
            <span className="text-white text-[10px] font-bold">+</span>
          </div>
        </div>

        <button onClick={handleLike} className="flex flex-col items-center">
          <Heart className={cn("w-8 h-8 drop-shadow-lg transition-transform active:scale-125", isLiked ? "text-red-500 fill-red-500" : "text-white")} />
          <span className="text-[12px] font-bold text-white mt-1 shadow-sm">{post.likes.length}</span>
        </button>

        <button className="flex flex-col items-center">
          <MessageCircle className="w-8 h-8 text-white drop-shadow-lg" />
          <span className="text-[12px] font-bold text-white mt-1 shadow-sm">{post.commentCount}</span>
        </button>

        <button className="flex flex-col items-center">
          <Send className="w-7 h-7 text-white drop-shadow-lg" />
        </button>

        <button className="flex flex-col items-center">
          <Bookmark className="w-7 h-7 text-white drop-shadow-lg" />
        </button>

        <button className="flex flex-col items-center">
          <MoreVertical className="w-6 h-6 text-white drop-shadow-lg" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 animate-spin-slow p-2 overflow-hidden flex items-center justify-center">
             <Disc className="w-full h-full text-gray-500" />
        </div>
      </div>

      {/* Info Bottom Bar */}
      <div className="absolute left-4 right-16 bottom-10 z-10 pointer-events-none">
        <div className="flex items-center space-x-2 mb-3 pointer-events-auto cursor-pointer" onClick={() => navigate(`/profile/${post.userId}`)}>
          <span className="text-white font-bold text-sm tracking-tight">@{post.userDisplayName.toLowerCase()}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">Seguir</span>
        </div>
        
        <p className="text-white text-sm mb-4 line-clamp-2 max-w-[80%] leading-snug font-medium drop-shadow-md">
          {post.caption}
        </p>

        <div className="flex items-center space-x-2 text-white bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 w-fit border border-white/5">
          <Music className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[11px] font-medium tracking-tight">Original Audio - Playzi Gaming</span>
        </div>
      </div>

      {/* Mute Control Top Right */}
      <button 
        onClick={toggleMute}
        className="absolute top-10 right-4 z-20 p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      {/* Header Controls */}
      <div className="absolute top-10 left-4 z-20 flex items-center space-x-4">
         <button onClick={() => navigate(-1)} className="p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
            <ChevronLeft className="w-6 h-6 text-white" />
         </button>
         <h1 className="text-white font-bold text-lg tracking-tight">Reels</h1>
      </div>
    </div>
  );
};

const Reels: React.FC = () => {
  const [reels, setReels] = useState<Post[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReels = async () => {
      try {
        // Simple query that doesn't require composite index
        const q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const fetchedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        
        // Filter for videos in memory to avoid needing composite index for where('type', '==', 'video') + orderBy('createdAt')
        const reelsData = fetchedDocs.filter(post => post.type === 'video').slice(0, 10);
        
        // If no video posts found, add some mock ones for demo if needed, or just show empty
        if (reelsData.length === 0) {
           // Providing fallback video for demo purposes since we just enabled the feature
           const mockReels: Post[] = [
             {
               id: 'mock-1',
               userId: 'system',
               userDisplayName: 'PlayziOfficial',
               userPhotoURL: 'https://i.ibb.co/svpJKdbx/playsi-logo.png',
               caption: 'Bem-vindo ao Reels da Playzi! 🎮 Compartilhe seus melhores momentos.',
               mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-gaming-setup-with-colorful-lights-34538-large.mp4',
               type: 'video',
               likes: [],
               commentCount: 42,
               createdAt: { seconds: Date.now() / 1000 } as any
             },
             {
               id: 'mock-2',
               userId: 'system',
               userDisplayName: 'ProGamer',
               userPhotoURL: 'https://picsum.photos/seed/gamer9/100/100',
               caption: 'Check this incredible combo! Full match in bio. #gaming #reels',
               mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-person-playing-a-first-person-shooter-game-41604-large.mp4',
               type: 'video',
               likes: [],
               commentCount: 156,
               createdAt: { seconds: (Date.now() - 3600000) / 1000 } as any
             }
           ];
           setReels(mockReels);
        } else {
          setReels(reelsData);
        }
      } catch (error) {
        console.error("Error fetching reels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = window.innerHeight;
    const newIndex = Math.round(e.currentTarget.scrollTop / height);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Disc className="w-12 h-12 text-white opacity-20" />
       </motion.div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-black fixed inset-0 z-50 overflow-hidden">
      <SEO title="Reels" description="Assista e compartilhe os melhores momentos, gameplays e jogadas da comunidade gamer na Playzi." />
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {reels.map((reel, index) => (
          <ReelItem 
            key={reel.id} 
            post={reel} 
            isActive={index === activeIndex} 
          />
        ))}

        <button 
          onClick={() => navigate('/create', { state: { type: 'video' } })}
          className="absolute top-10 right-4 z-[60] p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 hover:bg-vibe-neon-blue transition-all group pointer-events-auto"
        >
          <Camera className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent flex items-center justify-around z-50 px-6">
          <button onClick={() => navigate('/')} className="text-white opacity-60 hover:opacity-100 transition-opacity"><Home className="w-6 h-6" /></button>
          <button onClick={() => navigate('/explore')} className="text-white opacity-60 hover:opacity-100 transition-opacity"><Search className="w-6 h-6" /></button>
          <button className="text-white border-b-2 border-white pb-1"><PlayCircle className="w-6 h-6" /></button>
          <button onClick={() => navigate('/arcade')} className="text-white opacity-60 hover:opacity-100 transition-opacity"><Gamepad2 className="w-6 h-6" /></button>
          <button onClick={() => navigate('/profile')} className="text-white opacity-60 hover:opacity-100 transition-opacity"><User className="w-6 h-6" /></button>
      </nav>
    </div>
  );
};

export default Reels;
