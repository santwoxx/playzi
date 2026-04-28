import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendNotification } from '../services/notificationService';
import { useGamerStats } from '../hooks/useGamerStats';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
  parentId?: string;
  replyToNickname?: string;
}

interface CommentModalProps {
  postId: string;
  postOwnerId: string;
  postCaption: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentModal({ postId, postOwnerId, postCaption, isOpen, onClose }: CommentModalProps) {
  const { currentUser } = useAuth();
  const { awardXP } = useGamerStats();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
  }, [isOpen, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !postId) return;

    setLoading(true);
    try {
      const commentData: any = {
        userId: currentUser.uid,
        userName: currentUser.nickname || currentUser.displayName || 'User',
        userPhoto: currentUser.photoURL || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      };

      if (replyTo) {
        commentData.parentId = replyTo.id;
        commentData.replyToNickname = replyTo.userName;
      }

      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      
      // Update comment count on post
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1)
      });

      // Award XP for interaction
      awardXP(20);

      // Send notification to post owner
      if (postOwnerId !== currentUser.uid) {
        await sendNotification({
          userId: postOwnerId,
          type: 'comment',
          title: 'Novo comentário!',
          content: `${commentData.userName} comentou no seu post: "${newComment.substring(0, 30)}..."`,
          link: '/', // In a real app, this would go to the post detail
          senderName: commentData.userName,
          senderPhoto: commentData.userPhoto
        });
      }

      // If it's a reply, also notify the original commenter
      if (replyTo && replyTo.userId !== currentUser.uid && replyTo.userId !== postOwnerId) {
        await sendNotification({
          userId: replyTo.userId,
          type: 'comment',
          title: 'Nova resposta!',
          content: `${commentData.userName} respondeu ao seu comentário: "${newComment.substring(0, 30)}..."`,
          link: '/',
          senderName: commentData.userName,
          senderPhoto: commentData.userPhoto
        });
      }

      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Erro ao comentar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-vibe-card border-t border-vibe-border rounded-t-[32px] z-[201] flex flex-col h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-vibe-border/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-vibe-gradient rounded-xl flex items-center justify-center text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-vibe-text uppercase tracking-widest">Comentários</h3>
                  <p className="text-[10px] text-vibe-muted font-bold truncate max-w-[200px]">{postCaption}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-vibe-muted/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-vibe-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-40">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                  <MessageSquare className="w-12 h-12 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Seja o primeiro a comentar</p>
                </div>
              ) : (
                comments
                  .filter(c => !c.parentId)
                  .map((comment) => (
                  <div key={comment.id} className="space-y-4">
                    <div className="flex space-x-4">
                      <img 
                        src={comment.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=0D0E12&color=fff`} 
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/5" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-vibe-neon-blue uppercase tracking-tighter truncate">{comment.userName}</p>
                          <span className="text-[9px] font-bold text-vibe-muted">
                            {comment.createdAt && formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs text-vibe-text font-medium leading-relaxed">{comment.text}</p>
                        <button 
                          onClick={() => setReplyTo(comment)}
                          className="mt-2 text-[10px] font-black text-vibe-muted uppercase tracking-widest hover:text-vibe-neon-blue transition-colors"
                        >
                          Responder
                        </button>
                      </div>
                    </div>

                    {/* Thread Replies */}
                    {comments.filter(c => c.parentId === comment.id).length > 0 && (
                      <div className="ml-10 space-y-4 border-l-2 border-white/5 pl-4 py-2">
                        {comments
                          .filter(c => c.parentId === comment.id)
                          .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
                          .map(reply => (
                            <div key={reply.id} className="flex space-x-3">
                              <img 
                                src={reply.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.userName)}&background=0D0E12&color=fff`} 
                                className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/5" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-0.5">
                                  <p className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-tighter truncate">{reply.userName}</p>
                                  <span className="text-[8px] font-bold text-vibe-muted opacity-50">
                                    {reply.createdAt && formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-vibe-text font-medium leading-relaxed">
                                  <span className="text-vibe-neon-pink mr-1 font-bold">@{reply.replyToNickname}</span>
                                  {reply.text}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-vibe-card border-t border-vibe-border pb-safe transition-all shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
              <AnimatePresence>
                {replyTo && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-between mb-3 px-4 py-2 bg-vibe-muted/5 rounded-xl border border-vibe-border overflow-hidden"
                  >
                    <p className="text-[10px] font-bold text-vibe-muted uppercase tracking-widest">
                      Respondendo a <span className="text-vibe-neon-blue">@{replyTo.userName}</span>
                    </p>
                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-vibe-muted/10 rounded-lg transition-all">
                      <X className="w-3 h-3 text-vibe-muted" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleSubmit} className="flex items-center space-x-4 bg-vibe-muted/5 border border-vibe-border rounded-2xl p-2 focus-within:neon-border transition-all">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva algo..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-xs font-bold text-vibe-text px-4"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="w-10 h-10 bg-vibe-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-vibe-neon-blue/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
