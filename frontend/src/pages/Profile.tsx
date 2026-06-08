import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { db } from '../lib/firebase';
import { securityUtils } from '../lib/security';
import { Post, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Grid, Bookmark, User as UserIcon, Heart, MessageCircle, UserPlus, UserMinus, MessageSquare, Shield, EyeOff, Sparkles, MapPin as MapPinIcon, Gamepad as GamepadIcon, Gamepad2, Target, Coins, Music, Zap, Smile, Activity, Users, Trophy, ArrowLeft, AlertCircle, Trash2, ShieldAlert, Globe, Link as LinkIcon, ExternalLink, Youtube, Twitch, Instagram, Twitter, Copy, Check, Plus, Award, ChevronRight, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useGamerStats } from '../hooks/useGamerStats';
import { sendNotification } from '../services/notificationService';
import { AVATARS_GALLERY } from '../constants/assets';
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

const APP_URL = "https://playzi-snowy.vercel.app";

function LinkIconComponent({ type }: { type: string }) {
  switch (type) {
    case 'steam': return <Gamepad2 className="w-3 h-3" />;
    case 'twitch': return <Twitch className="w-3 h-3" />;
    case 'discord': return <MessageSquare className="w-3 h-3" />;
    case 'youtube': return <Youtube className="w-3 h-3" />;
    case 'instagram': return <Instagram className="w-3 h-3" />;
    case 'twitter': return <Twitter className="w-3 h-3" />;
    default: return <ExternalLink className="w-3 h-3" />;
  }
}

function ReferralCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  const link = `${APP_URL}/login?ref=${user.referralCode}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rewards = [
    { goal: 5, label: "Selo VIP", icon: <Award className="w-4 h-4 text-vibe-neon-blue" /> },
    { goal: 10, label: "Coins Bonus", icon: <Coins className="w-4 h-4 text-yellow-500" /> },
    { goal: 20, label: "Embaixador Elite", icon: <ShieldAlert className="w-4 h-4 text-red-500" /> }
  ];

  return (
    <div className="vibe-card bg-vibe-neon-blue/5 border-vibe-neon-blue/20 p-6 my-6">
       <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center">
             <Users className="w-4 h-4 mr-2 text-vibe-neon-blue" />
             Seu Squad de Convidados
          </h3>
          <span className="text-[10px] font-black text-vibe-neon-blue bg-vibe-neon-blue/10 px-2 py-0.5 rounded-full">
            {user.referralCount || 0} Convites
          </span>
       </div>

       <div className="grid grid-cols-3 gap-2 mb-6">
          {rewards.map((r, i) => (
             <div key={i} className={cn(
               "p-2 rounded-xl flex flex-col items-center justify-center space-y-1 text-center transition-all",
               (user.referralCount || 0) >= r.goal ? "bg-white/10 border-vibe-neon-blue/40 border scale-105" : "bg-black/20 opacity-40 grayscale"
             )}>
                {r.icon}
                <span className="text-[7px] font-black uppercase text-vibe-text">{r.label}</span>
                <span className="text-[6px] font-bold text-vibe-muted">Meta: {r.goal}</span>
             </div>
          ))}
       </div>

       <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-mono text-vibe-muted truncate mr-4">{link}</span>
          <button onClick={handleCopy} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
             {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-vibe-muted" />}
          </button>
       </div>
    </div>
  );
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
    photos: [] as string[],
    country: '',
    currentIntent: '' as any,
    status: '' as any,
    playStyle: '' as any,
    frequency: '' as any,
    behavior: '' as any,
    gender: undefined as User['gender'],
    interestedIn: [] as User['interestedIn'],
    links: [] as User['links']
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
        
        // Referral Count for own profile
        let referralCount = userData.referralCount || 0;
        if (isOwnProfile && userData.referralCode) {
           // We can't do a full collection count here easily without cost, 
           // but we can query referred users
           const qRef = query(collection(db, 'users'), where('referredBy', '==', userData.referralCode));
           onSnapshot(qRef, (snap) => {
              const count = snap.size;
              if (count !== userData.referralCount) {
                updateDoc(doc(db, 'users', targetId), { referralCount: count });
                setProfileUser(prev => prev ? { ...prev, referralCount: count } : null);
              }
           });
        }

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
            photos: userData.photos || [],
            country: userData.country || '',
            currentIntent: userData.currentIntent || '',
            status: userData.status || 'online',
            gender: userData.gender || 'other',
            interestedIn: userData.interestedIn || [],
            playStyle: userData.playStyle || '',
            frequency: userData.frequency || '',
            behavior: userData.behavior || '',
            links: userData.links || []
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
      country: securityUtils.sanitizeText(editFormData.country),
      links: editFormData.links?.map(l => ({
        ...l,
        label: securityUtils.sanitizeText(l.label),
        url: securityUtils.sanitizeText(l.url)
      }))
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
    <div className="pt-6 pb-nav max-w-2xl mx-auto md:pt-24 bg-vibe-bg">
      <SEO 
        title={profileUser?.nickname || profileUser?.displayName || "Perfil"} 
        description={profileUser?.bio || `Confira o perfil de ${profileUser?.nickname || profileUser?.displayName} na Playzi.`}
        image={profileUser?.photoURL}
      />
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
      <div className="px-5 pt-4 pb-8 border-b border-white/5 bg-black">
        <div className="flex items-center mb-6">
          {/* Avatar */}
          <div className="relative mr-8 md:mr-12">
            <div className="w-[86px] h-[86px] md:w-[110px] md:h-[110px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
              <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
                <img 
                  src={profileUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.nickname || profileUser.displayName || 'User')}&background=06070a&color=fff`} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
             <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white leading-none">{posts.length}</span>
                <span className="text-[11px] text-vibe-muted mt-1 font-medium italic">Posts</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white leading-none">{profileUser.followers?.length || 0}</span>
                <span className="text-[11px] text-vibe-muted mt-1 font-medium italic">Seguidores</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white leading-none">{profileUser.following?.length || 0}</span>
                <span className="text-[11px] text-vibe-muted mt-1 font-medium italic">Seguindo</span>
             </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-6">
           <h2 className="text-sm font-bold text-white mb-0.5">{profileUser.nickname || profileUser.displayName}</h2>
           <div className="flex items-center space-x-2 mb-2">
              <span className="text-[10px] bg-white/5 text-vibe-muted px-2 py-0.5 rounded font-bold uppercase tracking-widest">Level {profileUser.level || 1}</span>
              {profileUser.country && <span className="text-sm">{getCountryEmoji(profileUser.country)}</span>}
              {(profileUser.referralCount || 0) >= 5 && (
                 <span className="flex items-center text-[7px] bg-vibe-neon-blue/20 text-vibe-neon-blue px-2 py-0.5 rounded font-black uppercase tracking-widest border border-vibe-neon-blue/30 shadow-glow-blue">
                   <Award className="w-2.5 h-2.5 mr-1" />
                   Embaixador
                 </span>
              )}
           </div>
           <p className="text-xs text-vibe-text leading-tight whitespace-pre-wrap">
              {profileUser.bio || "No bio yet."}
           </p>
           {profileUser.favoriteGames && profileUser.favoriteGames.length > 0 && (
             <div className="mt-2 text-vibe-neon-blue text-xs font-medium">
                🎮 {profileUser.favoriteGames.join(', ')}
             </div>
           )}
           
           {/* Links */}
           {profileUser.links && profileUser.links.length > 0 && (
             <div className="mt-4 flex flex-wrap gap-2">
                {profileUser.links.map(link => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 transition-all px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter shadow-sm border border-white/5"
                  >
                    <LinkIconComponent type={link.type} />
                    <span>{link.label}</span>
                  </a>
                ))}
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
           {isOwnProfile ? (
              <>
                 <button 
                   onClick={() => setShowEditModal(true)}
                   className="flex-1 bg-white/10 hover:bg-white/15 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                 >
                    Editar Perfil
                 </button>
                 <button 
                   onClick={() => setShowSettings(true)}
                   className="bg-white/10 hover:bg-white/15 text-white p-1.5 rounded-lg transition-colors"
                 >
                    <Settings className="w-5 h-5" />
                 </button>
              </>
           ) : (
              <>
                <button 
                  onClick={handleFollowAction}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                    isFollowing ? "bg-white/10 text-white" : "bg-vibe-neon-blue text-vibe-bg"
                  )}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </button>
                <button 
                  onClick={() => navigate(`/chat?uid=${profileUser.uid}`)} 
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Mensagem
                </button>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="bg-white/10 hover:bg-white/15 text-white p-1.5 rounded-lg transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </>
           )}
        </div>
      </div>

      {/* Referral Dashboard (Own Profile Only) */}
      {isOwnProfile && <ReferralCard user={profileUser} />}

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
            <img src={post.mediaUrls?.[0] || post.mediaUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
            {post.mediaUrls && post.mediaUrls.length > 1 && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-xl">
                  <div className="flex -space-x-1">
                    <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45 border border-black/20" />
                    <div className="w-2.5 h-2.5 bg-white/60 rounded-sm rotate-45 border border-black/20 translate-x-1 translate-y-1" />
                  </div>
                </div>
              </div>
            )}
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

                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] ml-2 flex items-center">
                         <ShieldAlert className="w-3 h-3 mr-2 text-vibe-neon-purple" />
                         Legal e Sobre
                      </h4>
                      <div className="vibe-card p-2 space-y-1">
                         <button 
                           onClick={() => navigate('/terms')}
                           className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-all group"
                         >
                            <span className="text-xs font-bold text-white tracking-widest uppercase">Termos de Uso</span>
                            <ChevronRight className="w-4 h-4 text-vibe-muted group-hover:text-vibe-neon-purple transition-colors" />
                         </button>
                         <button 
                           onClick={() => navigate('/privacy')}
                           className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-all group border-t border-white/5"
                         >
                            <span className="text-xs font-bold text-white tracking-widest uppercase">Privacidade</span>
                            <ChevronRight className="w-4 h-4 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors" />
                         </button>
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
                      {/* Encontros Photo Management */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest block ml-1">Fotos para Encontros (Mínimo 3)</label>
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                              (editFormData.photos?.length || 0) >= 3 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                            )}>
                               {editFormData.photos?.length || 0}/6
                            </span>
                         </div>
                         <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2, 3, 4, 5].map((idx) => {
                               const photo = editFormData.photos?.[idx];
                               return (
                                  <div key={idx} className="relative aspect-[3/4] bg-white/5 rounded-2xl border border-dashed border-white/10 overflow-hidden group">
                                     {photo ? (
                                        <>
                                           <img src={photo} className="w-full h-full object-cover" />
                                           <button 
                                             type="button"
                                             onClick={() => {
                                               const newPhotos = [...(editFormData.photos || [])];
                                               newPhotos.splice(idx, 1);
                                               setEditFormData({...editFormData, photos: newPhotos});
                                             }}
                                             className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                                           >
                                              <X className="w-3 h-3" />
                                           </button>
                                        </>
                                     ) : (
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            // Normally would open a file picker or gallery
                                            // For now we'll use a placeholder from picsum to simulate
                                            const newPhotos = [...(editFormData.photos || [])];
                                            newPhotos.push(`https://picsum.photos/seed/${Math.random()}/600/800`);
                                            setEditFormData({...editFormData, photos: newPhotos});
                                          }}
                                          className="w-full h-full flex items-center justify-center text-vibe-muted hover:text-vibe-neon-blue transition-colors"
                                        >
                                           <Plus className="w-6 h-6" />
                                        </button>
                                     )}
                                  </div>
                               )
                            })}
                         </div>
                         <p className="text-[9px] text-vibe-muted font-medium italic">* Adicione pelo menos 3 fotos para participar do sistema de Encontros.</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">Mudar Avatar Principal</label>
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                          {AVATARS_GALLERY.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEditFormData({...editFormData, photoURL: url})}
                              className={cn(
                                "aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5",
                                editFormData.photoURL === url ? "border-vibe-neon-blue bg-vibe-neon-blue/10 scale-105" : "border-transparent bg-white/5 grayscale opacity-50"
                              )}
                            >
                              <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover rounded-lg" />
                            </button>
                          ))}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                         <div>
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">Gênero</label>
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:neon-border transition-all"
                              value={editFormData.gender}
                              onChange={(e) => setEditFormData({...editFormData, gender: e.target.value as any})}
                            >
                               <option value="male" className="bg-vibe-bg">Masculino</option>
                               <option value="female" className="bg-vibe-bg">Feminino</option>
                               <option value="other" className="bg-vibe-bg">Outro / Gamer</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest mb-2 block ml-1">Interessado Em</label>
                            <div className="flex space-x-2">
                               {(['male', 'female', 'other'] as const).map((target) => {
                                  const isActive = (editFormData.interestedIn as any[])?.includes(target);
                                  return (
                                    <button
                                      key={target}
                                      type="button"
                                      onClick={() => {
                                        const current = [...(editFormData.interestedIn || [])];
                                        if (isActive) {
                                          setEditFormData({...editFormData, interestedIn: current.filter(c => (c as string) !== target) as any});
                                        } else {
                                          setEditFormData({...editFormData, interestedIn: [...current, target] as any});
                                        }
                                      }}
                                      className={cn(
                                        "flex-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase border transition-all",
                                        isActive ? "bg-vibe-neon-pink text-white border-vibe-neon-pink" : "bg-white/5 border-white/10 text-vibe-muted"
                                      )}
                                    >
                                       {target === 'male' ? 'Homens' : target === 'female' ? 'Mulheres' : 'Todos'}
                                    </button>
                                  )
                               })}
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

                      {/* Links Management */}
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-vibe-muted uppercase tracking-widest ml-1">Links e Redes Sociais</label>
                          <button 
                            type="button"
                            onClick={() => setEditFormData({
                              ...editFormData, 
                              links: [...(editFormData.links || []), { id: Date.now().toString(), label: '', url: '', type: 'other' }]
                            })}
                            className="p-2 bg-vibe-neon-blue text-vibe-bg rounded-xl hover:scale-105 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {editFormData.links?.map((link, idx) => (
                            <div key={link.id} className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3 relative group">
                               <button 
                                 type="button"
                                 onClick={() => setEditFormData({
                                   ...editFormData,
                                   links: editFormData.links?.filter(l => l.id !== link.id)
                                 })}
                                 className="absolute top-2 right-2 p-1 text-vibe-muted hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>

                               <div className="grid grid-cols-2 gap-2">
                                  <select 
                                    value={link.type}
                                    onChange={(e) => {
                                      const newLinks = [...(editFormData.links || [])];
                                      newLinks[idx].type = e.target.value as any;
                                      setEditFormData({...editFormData, links: newLinks});
                                    }}
                                    className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-white outline-none"
                                  >
                                    <option value="other" className="bg-vibe-bg">Outro</option>
                                    <option value="steam" className="bg-vibe-bg">Steam</option>
                                    <option value="twitch" className="bg-vibe-bg">Twitch</option>
                                    <option value="youtube" className="bg-vibe-bg">YouTube</option>
                                    <option value="discord" className="bg-vibe-bg">Discord</option>
                                    <option value="instagram" className="bg-vibe-bg">Instagram</option>
                                    <option value="twitter" className="bg-vibe-bg">Twitter / X</option>
                                  </select>
                                  <input 
                                    className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-white outline-none placeholder:text-vibe-muted"
                                    placeholder="Ex: Steam"
                                    value={link.label}
                                    onChange={(e) => {
                                      const newLinks = [...(editFormData.links || [])];
                                      newLinks[idx].label = e.target.value;
                                      setEditFormData({...editFormData, links: newLinks});
                                    }}
                                  />
                               </div>
                               <input 
                                 className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-vibe-neon-blue outline-none placeholder:text-vibe-muted/30"
                                 placeholder="https://..."
                                 value={link.url}
                                 onChange={(e) => {
                                   const newLinks = [...(editFormData.links || [])];
                                   newLinks[idx].url = e.target.value;
                                   setEditFormData({...editFormData, links: newLinks});
                                 }}
                               />
                            </div>
                          ))}
                        </div>
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
