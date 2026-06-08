import { Heart, MessageCircle, Share2, Send, Bookmark, MoreHorizontal, Sparkles, Trash2, AlertCircle, Link } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Post } from '../types';
import { cn } from '../lib/utils';
import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== currentMediaIndex) {
      setCurrentMediaIndex(index);
    }
  }, [currentMediaIndex]);

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

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    try {
      await navigator.clipboard.writeText(postUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  }, [post.id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.userDisplayName} no Playzi`,
          text: post.caption,
          url: postUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    } else {
      handleCopyLink(e);
    }
  }, [post.id, post.userDisplayName, post.caption, handleCopyLink]);

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
    setShowMoreMenu(false);
    setShowDeleteConfirm(prev => !prev);
  }, []);

  return (
    <div className="bg-black mb-6 w-full max-w-lg mx-auto border-y border-white/5 md:border md:rounded-lg overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 relative">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={handleProfileClick}
        >
          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
            <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
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
            <span className="font-bold text-xs tracking-tight text-white leading-tight">{post.userDisplayName}</span>
            <div className="text-[9px] text-vibe-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
               {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: getDateLocale() }) : t('now')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center" ref={menuRef}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
            className="p-2 text-white hover:opacity-70 transition-opacity"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-3 top-12 w-48 bg-vibe-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="py-1">
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 flex items-center space-x-3 transition-colors"
                  >
                    <Link className="w-4 h-4 text-vibe-neon-blue" />
                    <span>Copiar Link</span>
                  </button>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMoreMenu(false); setShowReportModal(true); }}
                    className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 flex items-center space-x-3 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-vibe-neon-purple" />
                    <span>Denunciar</span>
                  </button>

                  {currentUserId === post.userId && (
                    <button
                      onClick={handleConfirmDeleteClick}
                      className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center space-x-3 transition-colors border-t border-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Publicação</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-vibe-card p-6 rounded-3xl shadow-2xl border border-white/5 max-w-xs w-full text-center"
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-white font-bold mb-2">Excluir Post?</h3>
                <p className="text-vibe-muted text-xs mb-6 px-4">Esta ação é permanente e não pode ser desfeita.</p>
                <div className="space-y-2">
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-500 text-white text-xs font-bold py-3 rounded-xl disabled:opacity-50"
                  >
                    {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full bg-white/5 text-white text-xs font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div 
        className={cn(
          "relative aspect-square flex items-center justify-center overflow-hidden bg-black",
          post.type === 'text' && (post.backgroundColor || 'bg-gradient-to-br from-gray-900 to-black')
        )} 
        onDoubleClick={handleDoubleClick}
      >
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="w-full h-full relative group/carousel">
            <div 
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              onScroll={handleScroll}
            >
              {post.mediaUrls.map((url, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 snap-center">
                  <img 
                    src={url} 
                    alt={`Content ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            {post.mediaUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                {post.mediaUrls.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      currentMediaIndex === idx ? "bg-white w-3" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Multiple images indicator (top right) */}
            {post.mediaUrls.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white z-10 border border-white/10">
                {currentMediaIndex + 1}/{post.mediaUrls.length}
              </div>
            )}
          </div>
        ) : post.type === 'image' ? (
          <img 
            src={post.mediaUrl} 
            alt="Post content" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
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
          <div className="p-8 text-center">
            <p className="text-white font-bold text-xl md:text-2xl tracking-tight leading-snug drop-shadow-lg">
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
              <Heart className="w-20 h-20 text-white fill-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            </motion.div>
          )}

          {showXPPopup && (
            <motion.div 
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -40, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-10 flex justify-center pointer-events-none z-20"
            >
               <div className="bg-white text-black px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-1.5 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">+10 XP</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center space-x-4">
              <button 
                onClick={handleLikeClick} 
                className="transition-all active:scale-125 group relative"
              >
                <Heart className={cn(
                  "w-6 h-6 transition-all duration-300", 
                  isLiked 
                    ? "text-red-500 fill-red-500" 
                    : "text-white hover:opacity-70"
                )} />
              </button>
              <button onClick={handleCommentClick}>
                <MessageCircle className="w-6 h-6 text-white hover:opacity-70" />
              </button>
              <button onClick={handleShare}>
                <Send className="w-6 h-6 text-white hover:opacity-70" />
              </button>
           </div>
           <button>
             <Bookmark className="w-6 h-6 text-white hover:opacity-70" />
           </button>
        </div>

        {/* Likes Count */}
        <div className="font-bold text-xs mb-1 text-white">
          {post.likes.length + (isLiked && !post.likes.includes(currentUserId || '') ? 1 : 0)} curtidas
        </div>

        {/* Caption */}
        {post.type !== 'text' && (
          <div className="text-xs text-vibe-text leading-relaxed">
            <span className="font-bold mr-2 text-white">{post.userDisplayName}</span>
            {post.caption}
          </div>
        )}

        {/* View all comments */}
        {post.commentCount > 0 && (
          <button className="text-vibe-muted text-xs mt-2 hover:opacity-70 transition-opacity" onClick={handleCommentClick}>
             Ver todos os {post.commentCount} comentários
          </button>
        )}

        {/* Time */}
        <div className="text-[10px] text-vibe-muted font-bold uppercase mt-2 tracking-wide">
           {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: getDateLocale() }) : t('now')}
        </div>
      </div>

      {showCopied && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0 }}
             className="bg-white text-black text-[10px] font-black py-2 px-6 rounded-full shadow-2xl uppercase tracking-widest"
           >
             Link Copiado
           </motion.div>
        </div>
      )}
    </div>
  );
});

export default PostCard;
