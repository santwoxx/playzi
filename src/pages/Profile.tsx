import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { securityUtils } from '../lib/security';
import { Post, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Grid, Bookmark, User as UserIcon, Heart, MessageCircle, UserPlus, UserMinus, MessageSquare, Shield, EyeOff, Sparkles, MapPin as MapPinIcon, Gamepad as GamepadIcon, Target, Coins, Music, Zap, Smile, Activity, Users, Trophy, ArrowLeft, AlertCircle, Trash2, ShieldAlert, Globe } from 'lucide-react';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useGamerStats } from '../hooks/useGamerStats';
import { sendNotification } from '../services/notificationService';
import CommentModal from '../components/CommentModal';
import CallButton from '../components/CallButton';
import ReportModal from '../components/ReportModal';
import ReputationModal from '../components/ReputationModal';
import { Star as StarIcon } from 'lucide-react';


function getCountryEmoji(country: string) {
  const flags: Record<string, string> = {
    'Brasil': '🇧🇷',
    'Brazil': '🇧🇷',
    'United States': '🇺🇸',
    'USA': '🇺🇸',
    'Portugal': '🇵🇹',
    'Argentina': '🇦🇷',
    'Spain': '🇪🇸',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'Mexico': '🇲🇽',
    'Canada': '🇨🇦',
    'United Kingdom': '🇬🇧',
    'Italy': '🇮🇹',
    'Russia': '🇷🇺'
  };
  return flags[country] || '🌐';
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { userId } = useParams();
  const { currentUser, logout, refreshUser, deleteAccount } = useAuth();
  const { getXPForLevel, awardXP } = useGamerStats();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReputationModal, setShowReputationModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [editFormData, setEditFormData] = useState({
    nickname: '',
    bio: '',
    favoriteMusic: '',
    currentGame: '',
    statusMessage: '',
    mood: '',
    photoURL: '',
    country: '',
    currentIntent: '' as any,
    status: '' as any,
    playStyle: '' as any,
    frequency: '' as any,
    behavior: '' as any
  });
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === currentUser?.uid;
  const targetId = userId || currentUser?.uid;

  useEffect(() => {
    if (!targetId) return;

    setLoading(true);
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', targetId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setProfileUser(userData);
        setIsFollowing(userData.followers?.includes(currentUser?.uid || '') || false);
        
        if (isOwnProfile) {
          setEditFormData({
            nickname: userData.nickname || '',
            bio: userData.bio || '',
            favoriteMusic: userData.favoriteMusic || '',
            currentGame: userData.currentGame || '',
            statusMessage: userData.statusMessage || '',
            mood: userData.mood || '',
            photoURL: userData.photoURL || '',
            country: userData.country || '',
            currentIntent: userData.currentIntent || '',
            status: userData.status || 'online',
            playStyle: userData.playStyle || '',
            frequency: userData.frequency || '',
            behavior: userData.behavior || ''
          });
        }
      }
      setLoading(false);
    };

    fetchUser();

    const q = query(collection(db, 'posts'), where('userId', '==', targetId));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    return () => {
      unsubscribePosts();
    };
  }, [targetId, currentUser]);

  const handleFollowAction = async () => {
    if (!currentUser || !targetId || isOwnProfile) return;

    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      await apiService.followUser(targetId, action);
      
      setIsFollowing(!isFollowing);
      
      if (action === 'follow') {
        awardXP(50);
        await sendNotification({
          userId: targetId,
          type: 'follow',
          title: 'Novo seguidor!',
          content: `${currentUser.nickname || currentUser.displayName} começou a te seguir.`,
          link: `/profile/${currentUser.uid}`,
          senderName: currentUser.nickname || currentUser.displayName,
          senderPhoto: currentUser.photoURL
        });
      }
      await refreshUser();
    } catch (error: any) {
      console.error('Error updating follow status:', error);
      alert(error.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Sanitize inputs before saving
    const sanitizedData = {
      ...editFormData,
      nickname: securityUtils.sanitizeText(editFormData.nickname),
      bio: securityUtils.sanitizeText(editFormData.bio),
      mood: securityUtils.sanitizeText(editFormData.mood),
      statusMessage: securityUtils.sanitizeText(editFormData.statusMessage),
      favoriteMusic: securityUtils.sanitizeText(editFormData.favoriteMusic),
      currentGame: securityUtils.sanitizeText(editFormData.currentGame),
      country: securityUtils.sanitizeText(editFormData.country)
    };

    // Additional nickname validation
    if (!securityUtils.isValidNickname(sanitizedData.nickname)) {
       alert("Apelido inválido. Use apenas letras, números, espaços, hífen ou underline (3-20 caracteres).");
       return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), sanitizedData);
      setProfileUser({ ...profileUser!, ...sanitizedData });
      setShowEditModal(false);
      await refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      alert("Houve um erro ao excluir sua conta. Tente fazer login novamente antes de excluir.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="pt-20 text-center animate-pulse">
      <div className="w-24 h-24 bg-vibe-border rounded-full mx-auto mb-4" />
      <div className="h-4 w-32 bg-vibe-border mx-auto rounded" />
    </div>
  );

  if (!profileUser) return (
    <div className="pt-20 text-center">
      <h1 className="text-xl font-black">User Not Found</h1>
      <button onClick={() => navigate('/')} className="mt-4 text-vibe-neon-blue">{t('prev_step')}</button>
    </div>
  );

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const currentLanguage = i18n.language.split('-')[0];

  const intentOptions = [
    { id: 'playing', label: 'Jogar agora', icon: <GamepadIcon className="w-4 h-4" /> },
    { id: 'chatting', label: 'Conversar', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'competitive', label: 'Duo competitivo', icon: <Target className="w-4 h-4" /> },
    { id: 'friendship', label: 'Amizade casual', icon: <Heart className="w-4 h-4" /> }
  ];

  const currentIntentData = intentOptions.find(o => o.id === profileUser.currentIntent);

  return (
    <div className="pt-6 pb-nav max-w-2xl mx-auto md:pt-24 bg-vibe-bg min-h-screen">
      <CommentModal 
        isOpen={commentModal.isOpen}
        postId={commentModal.postId}
        postOwnerId={commentModal.ownerId}
        postCaption={commentModal.caption}
        onClose={() => setCommentModal({ ...commentModal, isOpen: false })}
      />
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)}
        targetId={profileUser.uid}
        targetType="user"
        targetName={profileUser.nickname || profileUser.displayName}
      />
      <ReputationModal 
        isOpen={showReputationModal}
        onClose={() => setShowReputationModal(false)}
        targetUser={profileUser}
        onSuccess={refreshUser}
      />
      {/* Profile Header */}
      <div className="px-6 py-10 vibe-card rounded-none md:rounded-[40px] mb-8 border-x-0 md:border border-vibe-border/20 flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12 relative overflow-hidden bg-vibe-card/40">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkles className="w-64 h-64 text-vibe-neon-blue" />
        </div>

        {/* Avatar & Rank */}
        <div className="relative flex flex-col items-center">
          <div 
            className="w-36 h-36 md:w-48 md:h-48 rounded-[42px] p-[3px] transition-all bg-vibe-gradient shadow-2xl shadow-vibe-neon-blue/20 hover:scale-[1.02] duration-500"
          >
            <div className="w-full h-full rounded-[40px] border-4 border-vibe-bg overflow-hidden relative transition-all bg-vibe-bg">
              <img 
                src={profileUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.nickname || profileUser.displayName || 'User')}&background=06070a&color=fff`} 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              {profileUser.status && profileUser.status !== 'offline' && (
                <div className={cn(
                  "absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-vibe-bg shadow-lg z-10",
                  profileUser.status === 'online' ? "bg-green-500 shadow-green-500/50" :
                  profileUser.status === 'away' ? "bg-yellow-500 shadow-yellow-500/50" :
                  profileUser.status === 'playing' ? "bg-vibe-neon-purple shadow-vibe-neon-purple/50" :
                  "bg-vibe-neon-blue shadow-vibe-neon-blue/50"
                )} />
              )}
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center w-full">
             <div className="bg-vibe-gradient p-[1px] rounded-2xl shadow-xl shadow-vibe-neon-blue/10 mb-3 w-full max-w-[160px]">
                <div className="bg-vibe-bg px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] text-vibe-neon-blue text-center">
                   {profileUser.rankTitle || t('rank_novice')} • LVL {profileUser.level || 1}
                </div>
             </div>
             {profileUser.status && (
                <div className="flex items-center space-x-2 opacity-80">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    profileUser.status === 'online' ? "bg-green-500" :
                    profileUser.status === 'away' ? "bg-yellow-500" :
                    profileUser.status === 'playing' ? "bg-vibe-neon-purple" :
                    profileUser.status === 'searching' ? "bg-vibe-neon-blue" : "bg-vibe-muted"
                  )} />
                  <p className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.1em]",
                    profileUser.status === 'online' ? "text-green-500" :
                    profileUser.status === 'away' ? "text-yellow-500" :
                    profileUser.status === 'playing' ? "text-vibe-neon-purple" :
                    profileUser.status === 'searching' ? "text-vibe-neon-blue" : "text-vibe-muted"
                  )}>
                    {profileUser.status === 'online' ? 'Online' :
                     profileUser.status === 'away' ? 'Ausente' :
                     profileUser.status === 'playing' ? 'Jogando' :
                     profileUser.status === 'searching' ? 'Procurando Duo' : 'Offline'}
                  </p>
                </div>
             )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full mb-10 gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-vibe-text uppercase leading-none">
                  {profileUser.nickname || profileUser.displayName}
                </h1>
                {profileUser.country && <span className="text-2xl" title={profileUser.country}>{getCountryEmoji(profileUser.country)}</span>}
              </div>
              <p className="text-[11px] font-black text-vibe-muted uppercase tracking-[0.2em] opacity-70">
                {profileUser.age || '??'} ANOS • {profileUser.gender || 'Não informado'}
              </p>
            </div>

            {currentIntentData && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-vibe-neon-blue/10 border border-vibe-neon-blue/30 px-4 py-2 rounded-2xl flex items-center space-x-3 text-vibe-neon-blue font-bold text-[10px] uppercase tracking-wider shadow-sm"
              >
                <div className="p-1.5 bg-vibe-neon-blue text-vibe-bg rounded-xl">{currentIntentData.icon}</div>
                <span>{currentIntentData.label}</span>
              </motion.div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full mb-8">
            {isOwnProfile ? (
               <>
                 <button 
                   onClick={() => setShowEditModal(true)}
                   className="btn-primary px-10 py-3 text-[10px] uppercase tracking-widest flex items-center space-x-2"
                 >
                    <Settings className="w-4 h-4" />
                    <span>{t('edit_profile')}</span>
                 </button>
                 <button onClick={() => setShowSettings(true)} className="btn-secondary p-3">
                    <Shield className="w-5 h-5 text-vibe-neon-blue" />
                 </button>
               </>
            ) : (
              <>
                <button 
                  onClick={handleFollowAction}
                  className={cn(
                    "px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 transition-all shadow-xl tap-effect",
                    isFollowing ? "bg-white/5 text-vibe-text border border-white/10" : "bg-vibe-gradient text-white shadow-vibe-neon-blue/30"
                  )}
                >
                  {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
                </button>
                <button 
                  onClick={() => navigate(`/chat?uid=${profileUser.uid}`)} 
                  className="btn-secondary px-8 py-3 text-[10px] uppercase tracking-widest flex items-center space-x-3"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowReputationModal(true)}
                    className="btn-secondary p-3 group"
                    title="Avaliar Usuário"
                  >
                     <StarIcon className="w-5 h-5 group-hover:scale-110 transition-transform text-yellow-400 fill-yellow-400/10" />
                  </button>
                  <CallButton receiverId={profileUser.uid} type="voice" variant="ghost" className="btn-secondary p-3" />
                  <CallButton receiverId={profileUser.uid} type="video" variant="ghost" className="btn-secondary p-3" />
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="btn-secondary p-3 group hover:border-red-500/30"
                    title="Denunciar Usuário"
                  >
                     <AlertCircle className="w-5 h-5 group-hover:scale-110 transition-transform text-red-500 opacity-70 group-hover:opacity-100" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full mb-8">
             <InventoryItem icon={<Coins className="w-4 h-4 text-vibe-neon-blue" />} value={profileUser.coins || 0} label={t('coins')} />
             <InventoryItem icon={<Users className="w-4 h-4 text-vibe-neon-purple" />} value={profileUser.followers?.length || 0} label="Seguidores" />
             <InventoryItem icon={<Trophy className="w-4 h-4 text-vibe-neon-pink" />} value={profileUser.level || 1} label="Nível" />
             <InventoryItem icon={<Zap className="w-4 h-4 text-vibe-neon-blue" />} value={profileUser.xp || 0} label="XP" />
             <InventoryItem 
                icon={<StarIcon className="w-4 h-4 text-yellow-400" />} 
                value={profileUser.reputation?.average || "0.0"} 
                label={`Reputação (${profileUser.reputation?.count || 0})`} 
             />
          </div>

          <div className="space-y-6 w-full">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
               {profileUser.mood && <Tag icon={<Smile className="w-3 h-3" />} text={profileUser.mood} color="pink" />}
               {profileUser.favoriteMusic && <Tag icon={<Music className="w-3 h-3" />} text={profileUser.favoriteMusic} color="purple" />}
               {profileUser.currentGame && <Tag icon={<GamepadIcon className="w-3 h-3" />} text={profileUser.currentGame} color="blue" />}
            </div>

            <div className="bg-black/40 p-6 rounded-[32px] border border-white/5 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageCircle className="w-12 h-12" />
              </div>
              <p className="text-sm text-vibe-muted font-medium italic relative z-10 leading-relaxed">
                "{profileUser.bio || "Este usuário prefere o mistério e não definiu uma bio ainda."}"
              </p>
            </div>

            {profileUser.reputation && profileUser.reputation.count >= 3 && (
              <div className="pt-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted mb-3 flex items-center ml-2">
                  <Shield className="w-3 h-3 mr-2 text-vibe-neon-blue" />
                  Conquistas da Comunidade
                </p>
                <div className="flex flex-wrap gap-3">
                   {profileUser.reputation.communication >= 4.5 && (
                     <div className="flex items-center space-x-2 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 px-3 py-2 rounded-xl text-[10px] font-black text-vibe-neon-blue uppercase tracking-tighter">
                        <MessageSquare className="w-3 h-3" />
                        <span>Vibe Positiva</span>
                     </div>
                   )}
                   {profileUser.reputation.respect >= 4.5 && (
                     <div className="flex items-center space-x-2 bg-vibe-neon-pink/10 border border-vibe-neon-pink/20 px-3 py-2 rounded-xl text-[10px] font-black text-vibe-neon-pink uppercase tracking-tighter">
                        <Heart className="w-3 h-3" />
                        <span>Super Respeitoso</span>
                     </div>
                   )}
                   {profileUser.reputation.gameplay >= 4.0 && (
                     <div className="flex items-center space-x-2 bg-vibe-neon-purple/10 border border-vibe-neon-purple/20 px-3 py-2 rounded-xl text-[10px] font-black text-vibe-neon-purple uppercase tracking-tighter">
                        <Trophy className="w-3 h-3" />
                        <span>Pro Player</span>
                     </div>
                   )}
                </div>
              </div>
            )}
            
            {profileUser.interests && profileUser.interests.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted mb-3 flex items-center ml-2">
                  <Target className="w-3 h-3 mr-2 text-vibe-neon-pink" />
                  Interesses
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(profileUser.interests) && profileUser.interests.map(item => (
                    <span key={item} className="text-[10px] font-bold bg-white/5 text-vibe-text border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 hover:neon-border transition-all cursor-default">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profileUser.favoriteGames && profileUser.favoriteGames.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted mb-3 flex items-center ml-2">
                  <GamepadIcon className="w-3 h-3 mr-2 text-vibe-neon-blue" />
                  Especialidades
                </p>
                <div className="flex flex-wrap gap-2">
                  {profileUser.favoriteGames.map(game => (
                    <span key={game} className="text-[10px] font-bold bg-vibe-gradient p-[1px] rounded-full">
                      <div className="bg-vibe-bg text-vibe-neon-blue border border-vibe-neon-blue/20 px-4 py-1.5 rounded-full hover:bg-vibe-neon-blue/5 transition-colors cursor-default whitespace-nowrap">
                        {game}
                      </div>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-white/5 mb-6">
        <TabButton active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} icon={<Grid className="w-5 h-5" />} />
        <TabButton active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} icon={<Bookmark className="w-5 h-5" />} />
        <TabButton active={activeTab === 'tagged'} onClick={() => setActiveTab('tagged')} icon={<Trophy className="w-5 h-5" />} />
      </div>

      {/* Swipeable Tab Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          const swipeThreshold = 50;
          if (info.offset.x < -swipeThreshold) {
            // Swipe Left -> Next Tab
            if (activeTab === 'posts') setActiveTab('saved');
            else if (activeTab === 'saved') setActiveTab('tagged');
          } else if (info.offset.x > swipeThreshold) {
            // Swipe Right -> Prev Tab
            if (activeTab === 'tagged') setActiveTab('saved');
            else if (activeTab === 'saved') setActiveTab('posts');
          }
        }}
        className="grid grid-cols-3 gap-1 md:gap-4 md:px-0 touch-none"
      >
        {activeTab === 'posts' && posts.map(post => (
          <motion.div 
            layoutId={post.id}
            key={post.id} 
            whileHover={{ scale: 0.98 }}
            onClick={() => setCommentModal({
              isOpen: true,
              postId: post.id,
              ownerId: post.userId,
              caption: post.caption || ''
            })}
            className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg md:rounded-3xl border border-white/5"
          >
            <img src={post.mediaUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white font-black text-sm">
              <span className="flex items-center"><Heart className="w-4 h-4 mr-1 fill-vibe-neon-pink text-vibe-neon-pink" /> {post.likes.length}</span>
              <span className="flex items-center"><MessageCircle className="w-4 h-4 mr-1 fill-vibe-neon-blue text-vibe-neon-blue" /> {post.commentCount}</span>
            </div>
          </motion.div>
        ))}
        
        {activeTab === 'saved' && (
           <div className="col-span-3 py-20 text-center vibe-card">
              <Bookmark className="w-12 h-12 text-vibe-muted mx-auto mb-4" />
              <p className="font-black opacity-50 uppercase tracking-widest italic text-sm">Nenhum salvo ainda</p>
           </div>
        )}

        {activeTab === 'tagged' && (
           <div className="col-span-3 py-20 text-center vibe-card">
              <Trophy className="w-12 h-12 text-vibe-muted mx-auto mb-4" />
              <p className="font-black opacity-50 uppercase tracking-widest italic text-sm">Onde a lenda nasceu</p>
           </div>
        )}

        {activeTab === 'posts' && posts.length === 0 && (
          <div className="col-span-3 py-20 text-center vibe-card">
            <EyeOff className="w-12 h-12 text-vibe-muted mx-auto mb-4" />
            <p className="font-black opacity-50 uppercase tracking-widest">{t('no_posts')}</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] bg-vibe-bg flex flex-col pt-12 overflow-y-auto gaming-grid">
             <div className="max-w-xl mx-auto w-full px-6 pb-20">
                <header className="flex items-center justify-between mb-10">
                   <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-2xl">
                      <ArrowLeft className="w-6 h-6" />
                   </button>
                   <h2 className="text-2xl font-black text-vibe-text uppercase tracking-tighter">{t('security_center')}</h2>
                   <div className="w-12 h-12" />
                </header>

                <div className="space-y-8">
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] ml-2 flex items-center">
                         <Shield className="w-3 h-3 mr-2 text-vibe-neon-blue" />
                         {t('privacy_control')}
                      </h4>
                      <div className="vibe-card p-6 space-y-6">
                         <div>
                            <label className="text-xs font-black text-vibe-text uppercase mb-2 block">{t('who_can_message')}</label>
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-vibe-neon-blue outline-none"
                              value={currentUser?.privacySettings?.whoCanMessage || 'everyone'}
                              onChange={(e) => updateDoc(doc(db, 'users', currentUser!.uid), { 'privacySettings.whoCanMessage': e.target.value })}
                            >
                               <option value="everyone" className="bg-vibe-bg">{t('everyone')}</option>
                               <option value="friends" className="bg-vibe-bg">{t('only_friends')}</option>
                               <option value="friendsOfFriends" className="bg-vibe-bg">{t('friends_of_friends')}</option>
                               <option value="nobody" className="bg-vibe-bg">{t('nobody')}</option>
                            </select>
                         </div>
                         
                         <PrivacyRow 
                           title={t('block_screenshots')} 
                           desc={t('block_screenshots_desc')} 
                           icon={<EyeOff className="w-5 h-5 text-vibe-neon-pink" />}
                           active={currentUser?.privacySettings?.blockScreenshots || false}
                           onClick={() => updateDoc(doc(db, 'users', currentUser!.uid), { 'privacySettings.blockScreenshots': !currentUser?.privacySettings?.blockScreenshots })}
                         />
                      </div>
                   </section>

                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] ml-2 flex items-center">
                         <Globe className="w-3 h-3 mr-2 text-vibe-neon-blue" />
                         Idioma / Language
                      </h4>
                      <div className="vibe-card p-6">
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                              onClick={() => handleLanguageChange('pt')}
                              className={cn(
                                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                                currentLanguage === 'pt' ? "bg-vibe-neon-blue/10 border-vibe-neon-blue" : "bg-white/5 border-transparent hover:bg-white/10"
                              )}
                            >
                               <span className="text-2xl mb-1">🇧🇷</span>
                               <span className="text-[10px] font-black uppercase">Português</span>
                            </button>
                            <button 
                              onClick={() => handleLanguageChange('en')}
                              className={cn(
                                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                                currentLanguage === 'en' ? "bg-vibe-neon-blue/10 border-vibe-neon-blue" : "bg-white/5 border-transparent hover:bg-white/10"
                              )}
                            >
                               <span className="text-2xl mb-1">🇺🇸</span>
                               <span className="text-[10px] font-black uppercase">English</span>
                            </button>
                            <button 
                              onClick={() => handleLanguageChange('es')}
                              className={cn(
                                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                                currentLanguage === 'es' ? "bg-vibe-neon-blue/10 border-vibe-neon-blue" : "bg-white/5 border-transparent hover:bg-white/10"
                              )}
                            >
                               <span className="text-2xl mb-1">🇪🇸</span>
                               <span className="text-[10px] font-black uppercase">Español</span>
                            </button>
                            <button 
                              onClick={() => handleLanguageChange('fr')}
                              className={cn(
                                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                                currentLanguage === 'fr' ? "bg-vibe-neon-blue/10 border-vibe-neon-blue" : "bg-white/5 border-transparent hover:bg-white/10"
                              )}
                            >
                               <span className="text-2xl mb-1">🇫🇷</span>
                               <span className="text-[10px] font-black uppercase">Français</span>
                            </button>
                         </div>
                      </div>
                   </section>

                    <section className="space-y-4 pt-10 border-t border-white/5">
                       
                       <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 mb-4">
                        <div className="flex items-center space-x-3 mb-2 text-red-500">
                          <Trash2 className="w-5 h-5" />
                          <h4 className="text-xs font-black uppercase tracking-widest">Zona de Perigo</h4>
                        </div>
                        <p className="text-[10px] text-vibe-muted font-bold mb-4 leading-relaxed">
                          Ao excluir sua conta, todos os seus dados, posts e interações serão permanentemente removidos. Esta ação não poderá ser desfeita.
                        </p>
                        {!showDeleteConfirm ? (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all tracking-widest"
                          >
                            Excluir Minha Conta Permanentemente
                          </button>
                        ) : (
                          <div className="space-y-3">
                             <button 
                               onClick={handleDeleteAccount}
                               disabled={isDeleting}
                               className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2"
                             >
                               {isDeleting ? <Zap className="w-4 h-4 animate-spin" /> : <span>Confirmar Exclusão Definitiva</span>}
                             </button>
                             <button 
                               onClick={() => setShowDeleteConfirm(false)}
                               className="w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"
                             >
                               Cancelar
                             </button>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={logout}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all font-black text-vibe-text text-xs uppercase tracking-widest shadow-lg"
                      >
                         <span>{t('logout')}</span>
                         <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform rotate-180" />
                      </button>
                   </section>
                </div>
             </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-[105] bg-vibe-bg flex flex-col pt-12 overflow-y-auto gaming-grid">
             <div className="max-w-xl mx-auto w-full px-6 pb-20">
                <header className="flex items-center justify-between mb-10">
                   <button onClick={() => setShowEditModal(false)} className="p-3 bg-white/5 rounded-2xl">
                      <ArrowLeft className="w-6 h-6" />
                   </button>
                   <h2 className="text-2xl font-black text-vibe-text uppercase tracking-tighter">{t('edit_profile')}</h2>
                   <div className="w-12 h-12" />
                </header>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                   <div className="vibe-card p-6 space-y-8">
                      <div className="flex justify-center mb-6">
                        <div className="relative group">
                          <img 
                            src={profileUser.photoURL || 'https://via.placeholder.com/150'} 
                            className="w-24 h-24 rounded-3xl object-cover border-4 border-vibe-neon-blue shadow-lg shadow-vibe-neon-blue/20" 
                          />
                          <div className="absolute -bottom-2 -right-2 bg-vibe-card border border-vibe-border p-2 rounded-xl text-[8px] font-black uppercase text-vibe-muted">
                            Fixo
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-3 block ml-1">Seu Status Atual</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               {[
                                 { id: 'online', label: 'Online', color: 'bg-green-500' },
                                 { id: 'away', label: 'Ausente', color: 'bg-yellow-500' },
                                 { id: 'playing', label: 'Jogando', color: 'bg-vibe-neon-purple' },
                                 { id: 'searching', label: 'Procurando Duo', color: 'bg-vibe-neon-blue' }
                               ].map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setEditFormData({...editFormData, status: s.id as any})}
                                    className={cn(
                                      "py-3 px-2 rounded-xl text-[9px] font-black uppercase border transition-all flex flex-col items-center space-y-1",
                                      editFormData.status === s.id 
                                        ? "bg-white/10 border-white/20 text-white" 
                                        : "bg-white/5 border-white/5 text-vibe-muted"
                                    )}
                                  >
                                     <div className={cn("w-2 h-2 rounded-full", s.color)} />
                                     <span>{s.label}</span>
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-3 block ml-1">Estilo de Jogo</label>
                            <div className="grid grid-cols-2 gap-2">
                               {['casual', 'competitive', 'duo', 'squad'].map((style) => (
                                  <button
                                    key={style}
                                    type="button"
                                    onClick={() => setEditFormData({...editFormData, playStyle: style as any})}
                                    className={cn(
                                      "py-3 px-4 rounded-xl text-[10px] font-black uppercase border transition-all",
                                      editFormData.playStyle === style 
                                        ? "bg-vibe-neon-blue text-vibe-bg border-vibe-neon-blue" 
                                        : "bg-white/5 border-white/5 text-vibe-muted"
                                    )}
                                  >
                                     {style}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-3 block ml-1">Frequência</label>
                            <div className="grid grid-cols-3 gap-2">
                               {['daily', 'weekends', 'casual'].map((f) => (
                                  <button
                                    key={f}
                                    type="button"
                                    onClick={() => setEditFormData({...editFormData, frequency: f as any})}
                                    className={cn(
                                      "py-3 px-2 rounded-xl text-[10px] font-black uppercase border transition-all",
                                      editFormData.frequency === f 
                                        ? "bg-vibe-neon-purple text-vibe-bg border-vibe-neon-purple" 
                                        : "bg-white/5 border-white/5 text-vibe-muted"
                                    )}
                                  >
                                     {f === 'daily' ? 'Diário' : f === 'weekends' ? 'Fim de Semana' : 'Casual'}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-3 block ml-1">Vibe / Comportamento</label>
                            <div className="grid grid-cols-2 gap-2">
                               {['chill', 'tryhard', 'leader', 'funny'].map((b) => (
                                  <button
                                    key={b}
                                    type="button"
                                    onClick={() => setEditFormData({...editFormData, behavior: b as any})}
                                    className={cn(
                                      "py-3 px-4 rounded-xl text-[10px] font-black uppercase border transition-all",
                                      editFormData.behavior === b 
                                        ? "bg-vibe-neon-pink text-vibe-bg border-vibe-neon-pink" 
                                        : "bg-white/5 border-white/5 text-vibe-muted"
                                    )}
                                  >
                                     {b}
                                  </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">O que você quer agora?</label>
                         <div className="grid grid-cols-2 gap-3">
                            {intentOptions.map((opt) => (
                               <button
                                 key={opt.id}
                                 type="button"
                                 onClick={() => setEditFormData({...editFormData, currentIntent: opt.id as any})}
                                 className={cn(
                                   "flex items-center space-x-3 p-4 rounded-2xl border transition-all text-left",
                                   editFormData.currentIntent === opt.id 
                                     ? "bg-vibe-neon-blue/10 border-vibe-neon-blue text-vibe-neon-blue" 
                                     : "bg-white/5 border-white/5 text-vibe-muted hover:bg-white/10"
                                 )}
                               >
                                  <div className={cn(
                                    "p-2 rounded-xl",
                                    editFormData.currentIntent === opt.id ? "bg-vibe-neon-blue text-vibe-bg" : "bg-white/10"
                                  )}>
                                     {opt.icon}
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{opt.label}</span>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('nickname_label')}</label>
                           <input 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                             value={editFormData.nickname}
                             onChange={(e) => setEditFormData({...editFormData, nickname: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('country')}</label>
                           <input 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                             value={editFormData.country}
                             onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('mood')}</label>
                           <input 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                             value={editFormData.mood}
                             onChange={(e) => setEditFormData({...editFormData, mood: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('status')}</label>
                           <input 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                             value={editFormData.statusMessage}
                             onChange={(e) => setEditFormData({...editFormData, statusMessage: e.target.value})}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('music_label')}</label>
                           <input 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                             value={editFormData.favoriteMusic}
                             onChange={(e) => setEditFormData({...editFormData, favoriteMusic: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('current_game_label')}</label>
                           <input 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                             value={editFormData.currentGame}
                             onChange={(e) => setEditFormData({...editFormData, currentGame: e.target.value})}
                           />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">{t('bio')}</label>
                        <textarea 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all h-32 resize-none"
                          value={editFormData.bio}
                          onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                        />
                      </div>
                   </div>

                   <button 
                     type="submit"
                     className="w-full py-5 bg-vibe-gradient text-white font-black rounded-2xl shadow-lg shadow-vibe-neon-blue/20 flex items-center justify-center space-x-2 uppercase tracking-[0.2em] text-xs transition-all active:scale-95"
                   >
                     <Zap className="w-5 h-5 fill-white" />
                     <span>{t('save_changes')}</span>
                   </button>
                </form>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrivacyRow({ title, desc, icon, active, onClick }: { title: string, desc: string, icon: any, active: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center justify-between cursor-pointer group">
       <div className="flex items-center space-x-4">
          <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
             {icon}
          </div>
          <div>
             <p className="text-xs font-black text-vibe-text uppercase tracking-widest">{title}</p>
             <p className="text-[9px] text-vibe-muted font-bold">{desc}</p>
          </div>
       </div>
       <div className={cn(
         "w-10 h-6 rounded-full relative transition-all",
         active ? "bg-vibe-neon-blue" : "bg-white/10"
       )}>
          <div className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
            active ? "left-5" : "left-1"
          )} />
       </div>
    </div>
  )
}

function InventoryItem({ icon, value, label }: { icon: any, value: any, label: string }) {
  return (
    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-colors tap-effect group">
       <div className="mb-2 transition-transform group-hover:scale-110">
          {icon}
       </div>
       <span className="text-sm font-bold text-vibe-text leading-none">{value}</span>
       <span className="text-[8px] uppercase font-black tracking-widest text-vibe-muted mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{label}</span>
    </div>
  )
}

function Tag({ icon, text, color = 'blue' }: { icon: React.ReactNode, text: string, color?: 'blue' | 'pink' | 'purple' }) {
  return (
    <div className={cn(
      "flex items-center space-x-2 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[0.1em] border shadow-sm",
      color === 'blue' ? "bg-vibe-neon-blue/5 border-vibe-neon-blue/20 text-vibe-neon-blue" : 
      color === 'pink' ? "bg-vibe-neon-pink/5 border-vibe-neon-pink/20 text-vibe-neon-pink" : 
      "bg-vibe-neon-purple/5 border-vibe-neon-purple/20 text-vibe-neon-purple"
    )}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-5 flex justify-center border-b-[3px] transition-all relative tap-effect",
        active ? "border-vibe-neon-blue text-vibe-neon-blue" : "border-transparent text-vibe-muted hover:text-vibe-text"
      )}
    >
      <div className={cn("transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
    </button>
  );
}

function StatItem({ count, label }: { count: number, label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-black text-vibe-text leading-none">{count}</p>
      <p className="text-[10px] uppercase font-black tracking-widest text-vibe-muted mt-1">{label}</p>
    </div>
  );
}
