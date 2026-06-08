import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageCircle, Heart, Gamepad2, X, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

interface ReputationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User;
  onSuccess?: () => void;
}

export default function ReputationModal({ isOpen, onClose, targetUser, onSuccess }: ReputationModalProps) {
  const [rating, setRating] = useState({
    communication: 0,
    respect: 0,
    gameplay: 0
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async () => {
    if (rating.communication === 0 || rating.respect === 0 || !targetUser) return;
    setLoading(true);
    
    try {
      const raterId = db.app.options.apiKey ? (await import('../lib/firebase')).auth.currentUser?.uid : null; // Fallback for safety
      if (!raterId) throw new Error("Usuário não autenticado");
      
      const ratingId = `${raterId}_${targetUser.uid}`;
      const ratingRef = doc(db, 'reputations', ratingId);
      
      // Check if already rated
      const ratingSnap = await getDoc(ratingRef);
      if (ratingSnap.exists()) {
        alert("Você já avaliou este jogador!");
        onClose();
        return;
      }

      const userRef = doc(db, 'users', targetUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as User;
      
      const currentRep = userData.reputation || { 
        average: 0, 
        count: 0, 
        communication: 0, 
        respect: 0, 
        gameplay: 0 
      };
      
      const newCount = currentRep.count + 1;
      const newComm = (currentRep.communication * currentRep.count + rating.communication) / newCount;
      const newResp = (currentRep.respect * currentRep.count + rating.respect) / newCount;
      const newGame = (currentRep.gameplay * currentRep.count + rating.gameplay) / newCount;
      
      // Calculate weighted average
      const newAvg = (newComm + newResp + (rating.gameplay > 0 ? newGame : (newComm + newResp) / 2)) / 3;

      // Update in transaction-like way
      await Promise.all([
        updateDoc(userRef, {
          reputation: {
            average: Number(newAvg.toFixed(1)),
            count: newCount,
            communication: Number(newComm.toFixed(1)),
            respect: Number(newResp.toFixed(1)),
            gameplay: Number(newGame.toFixed(1))
          }
        }),
        setDoc(ratingRef, {
          raterId,
          targetId: targetUser.uid,
          ...rating,
          createdAt: serverTimestamp()
        })
      ]);

      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setRating({ communication: 0, respect: 0, gameplay: 0 });
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="vibe-card w-full max-w-sm overflow-hidden relative"
        >
          {submitted ? (
            <div className="p-12 text-center flex flex-col items-center">
               <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="w-20 h-20 bg-vibe-neon-blue rounded-full flex items-center justify-center mb-6"
               >
                  <CheckCircle2 className="w-10 h-10 text-vibe-bg" />
               </motion.div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Avaliado!</h3>
               <p className="text-vibe-muted text-xs uppercase font-bold tracking-widest">Sua opinião ajuda a comunidade Vibe.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Avaliar Jogador</h3>
                  <p className="text-[10px] text-vibe-muted uppercase font-black tracking-widest">{targetUser.nickname}</p>
                </div>
                <button onClick={onClose} className="p-2 text-vibe-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Communication */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-vibe-neon-blue">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Comunicação</span>
                  </div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(prev => ({ ...prev, communication: star }))}
                        className={cn(
                          "p-2 transition-all active:scale-90",
                          rating.communication >= star ? "text-vibe-neon-blue scale-110" : "text-white/10 hover:text-white/30"
                        )}
                      >
                        <Star className={cn("w-6 h-6", rating.communication >= star ? "fill-current" : "")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Respect */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-vibe-neon-pink">
                    <Heart className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Respeito</span>
                  </div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(prev => ({ ...prev, respect: star }))}
                        className={cn(
                          "p-2 transition-all active:scale-90",
                          rating.respect >= star ? "text-vibe-neon-pink scale-110" : "text-white/10 hover:text-white/30"
                        )}
                      >
                        <Star className={cn("w-6 h-6", rating.respect >= star ? "fill-current" : "")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gameplay */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-vibe-neon-purple">
                    <Gamepad2 className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Habilidade (Opcional)</span>
                  </div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(prev => ({ ...prev, gameplay: star }))}
                        className={cn(
                          "p-2 transition-all active:scale-90",
                          rating.gameplay >= star ? "text-vibe-neon-purple scale-110" : "text-white/10 hover:text-white/30"
                        )}
                      >
                        <Star className={cn("w-6 h-6", rating.gameplay >= star ? "fill-current" : "")} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02]">
                <button
                  disabled={loading || rating.communication === 0 || rating.respect === 0}
                  onClick={handleRate}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center space-x-2",
                    rating.communication > 0 && rating.respect > 0
                      ? "bg-vibe-gradient text-white shadow-lg shadow-vibe-neon-blue/20"
                      : "bg-white/5 text-vibe-muted cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Enviando...' : 'Enviar Avaliação'}</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
