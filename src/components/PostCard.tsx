import { Heart, MessageCircle, Share2, Send, Bookmark, MoreHorizontal, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Post } from '../types';
import { cn } from '../lib/utils';
import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, deleteDoc, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReportModal from './ReportModal';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, ownerId: string, caption: string) => void;
}

const PostCard: React.FC<PostCardProps> = memo(({ post, currentUserId, onLike, onComment }) => {
  const { t, i18n } = useTranslation();
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUserId || ''));
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const navigate = useNavigate();

  const getDateLocale = useCallback(() => {
    return i18n.language.startsWith('pt') ? ptBR : enUS;
  }, [i18n.language]);

  const handleDoubleClick = useCallback(() => {
    if (!isLiked) {
      setIsLiked(true);
      onLike?.(post.id);
      setShowXPPopup(true);
      setTimeout(() => setShowXPPopup(false), 1500);
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800);
  }, [isLiked, onLike, post.id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.userDisplayName} no Playsi`,
          text: post.caption,
          url: postUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar link:', err);
      }
    }
  }, [post.id, post.userDisplayName, post.caption]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isLiked;
    setIsLiked(newState);
    onLike?.(post.id);
    if (newState) {
      setShowXPPopup(true);
      setTimeout(() => setShowXPPopup(false), 1500);
    }
  }, [isLiked, onLike, post.id]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || currentUserId !== post.userId) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (err) {
      console.error('Erro ao deletar post:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [currentUserId, post.userId, post.id]);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${post.userId}`);
  }, [navigate, post.userId]);

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(post.id, post.userId, post.caption);
  }, [onComment, post.id, post.userId, post.caption]);

  const handleConfirmDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(prev => !prev);
  }, []);

  return (
    <div className="vibe-card mb-10 overflow-hidden max-w-md mx-auto border-vibe-border/20 bg-vibe-card shadow-2xl group transition-all duration-300 will-change-transform touch-pan-y hover:scale-[1.01]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm touch-pan-y transition-colors">
        <div 
          className="flex items-center space-x-3 cursor-pointer group touch-manipulation"
          onClick={handleProfileClick}
        >
          <div className="w-10 h-10 rounded-full p-[2px] transition-all bg-vibe-gradient group-hover:scale-110 shadow-lg shadow-vibe-neon-blue/10">
            <div className="w-full h-full rounded-full border-2 border-vibe-bg overflow-hidden relative">
              <img 
                src={post.userPhotoURL || `https://ui-avatars.com/api/?name=${post.userDisplayName}&background=0D0E12&color=fff`} 
                alt={post.userDisplayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight group-hover:text-vibe-neon-blue transition-colors uppercase text-vibe-text leading-tight">{post.userDisplayName}</span>
            <div className="text-[9px] text-vibe-muted font-black uppercase tracking-widest mt-0.5 opacity-60">
               {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: getDateLocale() }) : t('now')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {currentUserId === post.userId && (
            <button 
              onClick={handleConfirmDeleteClick}
              className="p-2 text-vibe-muted hover:text-red-500 transition-colors tap-effect"
            >
              <Trash2 className="w-4 h-4 opacity-70" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowReportModal(true); }}
            className="p-2 text-vibe-muted hover:text-vibe-neon-pink transition-colors tap-effect"
            title="Denunciar Postagem"
          >
            <AlertCircle className="w-4 h-4 opacity-70" />
          </button>
        </div>

        <ReportModal 
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={post.id}
          targetType="post"
          targetName={`Post de ${post.userDisplayName}`}
        />

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-16 right-4 z-50 vibe-card p-4 shadow-2xl border-red-500/30 min-w-[200px] touch-manipulation"
            >
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Apagar postagem?</p>
              <div className="flex space-x-2">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 text-white text-[10px] font-black uppercase py-2 rounded-lg disabled:opacity-50 touch-manipulation"
                >
                  {isDeleting ? 'Apagando...' : 'Sim, Apagar'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white/5 text-white text-[10px] font-black uppercase py-2 rounded-lg touch-manipulation"
                >
                  Não
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media / Content */}
      <div 
        className={cn(
          "relative aspect-square flex items-center justify-center overflow-hidden touch-pan-y bg-vibe-bg",
          post.type === 'text' && (post.backgroundColor || 'bg-vibe-bg')
        )} 
        onDoubleClick={handleDoubleClick}
      >
        {post.type === 'image' ? (
          <img 
            src={post.mediaUrl} 
            alt="Post content" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : post.type === 'video' ? (
          <video 
            src={post.mediaUrl} 
            className="w-full h-full object-cover" 
            controls 
            playsInline
            preload="none"
          />
        ) : (
          <div className="p-10 text-center">
            <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <p className="text-white font-black text-xl md:text-2xl tracking-tighter leading-tight drop-shadow-lg">
              {post.caption}
            </p>
          </div>
        )}
        
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-24 h-24 text-vibe-neon-pink fill-vibe-neon-pink drop-shadow-[0_0_20px_rgba(255,0,255,0.8)]" />
            </motion.div>
          )}

          {showXPPopup && (
            <motion.div 
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -60, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-20 flex justify-center pointer-events-none z-20"
            >
               <div className="bg-vibe-gradient px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,242,255,0.5)] flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">+10 XP</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-5 pt-4 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center space-x-6">
              <button 
                onClick={handleLikeClick} 
                className="transition-all active:scale-125 group relative tap-effect"
              >
                <Heart className={cn(
                  "w-6 h-6 transition-all duration-300", 
                  isLiked 
                    ? "text-vibe-neon-pink fill-vibe-neon-pink drop-shadow-[0_0_12px_rgba(255,0,255,0.6)]" 
                    : "text-vibe-muted opacity-80"
                )} />
              </button>
              <button onClick={handleCommentClick} className="tap-effect">
                <MessageCircle className="w-6 h-6 text-vibe-muted opacity-80 hover:text-vibe-neon-blue transition-colors" />
              </button>
              <button onClick={handleShare} className="relative tap-effect">
                <Share2 className="w-5 h-5 text-vibe-muted opacity-80 hover:text-vibe-neon-blue transition-colors" />
                <AnimatePresence>
                  {showCopied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -30 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-vibe-neon-blue text-vibe-bg text-[9px] font-black py-1 px-3 rounded-full shadow-glow-blue uppercase tracking-widest z-50"
                    >
                      Copiado!
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
           </div>
           <button className="tap-effect">
             <Bookmark className="w-5 h-5 text-vibe-muted opacity-80" />
           </button>
        </div>

        {/* Likes Count */}
        <div className="font-bold text-[10px] mb-3 text-vibe-text uppercase tracking-[0.15em] flex items-center opacity-80">
          <div className="w-1 h-1 bg-vibe-neon-blue rounded-full mr-2 glow-blue" />
          {post.likes.length + (isLiked && !post.likes.includes(currentUserId || '') ? 1 : 0)} {t('liked_posts_count')}
        </div>

        {/* Caption */}
        {post.type !== 'text' && (
          <div className="text-[13px] text-vibe-muted leading-relaxed font-medium">
            <span className="font-bold mr-2 text-vibe-text uppercase text-[11px] tracking-tight">{post.userDisplayName}</span>
            {post.caption}
          </div>
        )}

        {/* View all comments */}
        {post.commentCount > 0 && (
          <button className="text-vibe-neon-blue/60 text-[10px] font-black uppercase tracking-widest mt-3 hover:text-vibe-neon-blue transition-colors touch-manipulation" onClick={handleCommentClick}>
            {t('view_all_comments', { count: post.commentCount })}
          </button>
        )}

        {/* Time */}
        <div className="text-vibe-muted/40 text-[9px] uppercase mt-4 tracking-[0.2em] font-black border-t border-vibe-border pt-4">
           {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: getDateLocale() }) : t('now')}
        </div>
      </div>
    </div>
  );
});

export default PostCard;
