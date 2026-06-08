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
        const q = query(usersRef, limit(40));
        const snapshot = await getDocs(q);
        
        const scoredUsers = snapshot.docs
          .map(doc => ({ ...doc.data(), uid: doc.id } as User))
          .filter(u => u.uid !== currentUser.uid && u.onboarded)
          .map(u => {
            const score = CompatibilityService.calculateScore(currentUser, u);
            return { ...u, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // Requested 5 users

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
    <div className="mb-12 relative">
      <div className="absolute inset-0 bg-vibe-neon-blue/5 blur-3xl opacity-30 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 px-2 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-vibe-neon-blue/10 rounded-2xl border border-vibe-neon-blue/20">
            <Sparkles className="w-6 h-6 text-vibe-neon-blue animate-sparkle" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Indicações Playzi</h2>
            <p className="text-[10px] text-vibe-neon-blue font-black uppercase tracking-[0.2em] opacity-80">Recomendações baseadas no seu perfil</p>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory px-2 relative z-10">
        {suggestions.map((u, idx) => (
          <motion.div 
            key={u.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="flex-shrink-0 w-52 vibe-card p-6 flex flex-col items-center text-center space-y-5 cursor-pointer hover:neon-border-active hover:-translate-y-2 transition-all duration-500 group snap-center overflow-hidden relative"
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
              <div className="absolute inset-0 bg-vibe-gradient opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
              <img 
                src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nickname || u.displayName || 'U')}&background=0D0E12&color=fff`} 
                className="w-24 h-24 rounded-[32px] object-cover border-2 border-white/10 group-hover:border-vibe-neon-blue transition-all duration-500 relative z-10 group-hover:scale-110" 
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-2 -right-2 bg-vibe-bg border-4 border-vibe-bg rounded-2xl relative z-20">
                <div className="bg-vibe-gradient text-[11px] font-black text-white px-3 py-1 rounded-xl shadow-glow-blue">
                  {u.score}%
                </div>
              </div>
              {u.aiReason && (
                 <div className="absolute -top-3 -right-3 bg-vibe-neon-purple/20 backdrop-blur-xl border border-vibe-neon-purple/30 p-2.5 rounded-2xl text-white shadow-2xl z-20 animate-float" title={u.aiReason}>
                    <Sparkles className="w-4 h-4 text-vibe-neon-purple" />
                 </div>
              )}
            </div>
            
            <div className="space-y-1.5 pt-2">
              <p className="font-black text-sm text-white uppercase tracking-tighter truncate w-40 group-hover:text-vibe-neon-blue transition-colors">{u.nickname || u.displayName}</p>
              <p className="text-[10px] text-vibe-neon-blue font-black uppercase tracking-[0.15em] opacity-90 truncate w-40">{(u as any).rankTitle || 'Novato'}</p>
              <div className="h-px w-8 bg-white/10 mx-auto my-2 group-hover:w-16 group-hover:bg-vibe-neon-blue/40 transition-all duration-500" />
              <p className="text-[9px] text-vibe-muted font-bold uppercase tracking-wider truncate w-40">{u.favoriteGames?.[0] || 'Playzi Gamer'}</p>
            </div>

            <button className="w-full py-3.5 bg-white/5 border border-white/5 hover:border-vibe-neon-blue/50 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all transform group-hover:bg-vibe-neon-blue/10 active:scale-95 flex items-center justify-center space-x-2 shadow-2xl relative z-10">
              <Zap className="w-3.5 h-3.5 text-vibe-neon-blue" />
              <span>Conectar</span>
            </button>
            
            {/* Background Accent */}
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-vibe-neon-blue/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
