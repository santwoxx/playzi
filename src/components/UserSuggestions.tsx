import { useEffect, useState } from 'react';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { AIService } from '../services/aiService';
import { motion } from 'motion/react';
import { Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CompatibilityService } from '../services/compatibilityService';

export default function UserSuggestions() {
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<(User & { score: number; aiReason?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.onboarded) {
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setError(false);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(30));
        const snapshot = await getDocs(q);
        
        const scoredUsers = snapshot.docs
          .map(doc => ({ ...doc.data(), uid: doc.id } as User))
          .filter(u => u.uid !== currentUser.uid && u.onboarded)
          .map(u => {
            const score = CompatibilityService.calculateScore(currentUser, u);
            return { ...u, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

        setSuggestions(scoredUsers);
        
        // Async fetch AI reason for the top match
        if (scoredUsers.length > 0) {
          const topUser = scoredUsers[0];
          AIService.getRecommendationReason(currentUser, topUser).then(reason => {
            setSuggestions(prev => prev.map(u => u.uid === topUser.uid ? { ...u, aiReason: reason } : u));
          });
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  if (loading) return (
    <div className="mb-8 flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
       {[1, 2, 3].map(i => (
         <div key={i} className="flex-shrink-0 w-40 h-48 vibe-card animate-pulse bg-white/5" />
       ))}
    </div>
  );

  if (error || suggestions.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="w-5 h-5 text-vibe-neon-blue animate-pulse-neon rounded-full" />
        <h2 className="text-sm font-black tracking-widest uppercase text-vibe-muted">Sua Alma Gêmea Gamer</h2>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory px-2">
        {suggestions.map((u, idx) => (
          <motion.div 
            key={u.uid}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="flex-shrink-0 w-40 vibe-card p-4 flex flex-col items-center text-center space-y-3 cursor-pointer hover:neon-border transition-all group touch-manipulation snap-center"
            onClick={async () => {
              try {
                await apiService.incrementUsage('profile_view');
                navigate(`/profile/${u.uid}`);
              } catch (error: any) {
                alert(error.message);
              }
            }}
          >
            <div className="relative">
              <img 
                src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nickname || u.displayName || 'U')}&background=0D0E12&color=fff`} 
                className="w-16 h-16 rounded-full object-cover border-2 border-vibe-border group-hover:border-vibe-neon-blue transition-colors" 
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-1 -right-1 bg-vibe-gradient p-1 rounded-full text-[10px] font-black text-white px-2 shadow-lg">
                {u.score}%
              </div>
              {u.aiReason && (
                 <div className="absolute -top-1 -right-1 bg-vibe-neon-purple/20 backdrop-blur-md border border-vibe-neon-purple/30 p-1 rounded-full text-[8px] font-black text-white shadow-lg animate-bounce" title={u.aiReason}>
                    <Sparkles className="w-3 h-3 text-vibe-neon-purple" />
                 </div>
              )}
            </div>
            
            <div>
              <p className="font-bold text-xs truncate w-32">{u.nickname || u.displayName}</p>
              <p className="text-[10px] text-vibe-neon-blue font-black uppercase tracking-widest truncate w-32">{(u as any).rankTitle || 'Novato'}</p>
              <p className="text-[9px] text-vibe-muted truncate w-32">{u.favoriteGames?.[0] || 'Gamer'}</p>
            </div>

            <button className="w-full py-2 bg-vibe-bg border border-vibe-neon-blue/30 rounded-lg text-vibe-neon-blue text-[10px] font-black uppercase tracking-widest hover:bg-vibe-neon-blue hover:text-white transition-all transform active:scale-95 flex items-center justify-center space-x-1 shadow-[0_4px_15px_rgba(0,242,255,0.1)]">
              <Sparkles className="w-3 h-3" />
              <span>Conhecer</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
