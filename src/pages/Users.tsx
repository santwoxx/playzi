import React, { useState, useEffect, memo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Search, Sparkles, MapPin, Zap, ChevronRight, MessageSquare, UserPlus, Phone, Video, Gamepad2, Target, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CompatibilityService } from '../services/compatibilityService';
import CallButton from '../components/CallButton';
import { Virtuoso } from 'react-virtuoso';

const UserItem = memo(({ user, navigate, currentUser }: { user: User, navigate: any, currentUser: User | null }) => {
  const matchScore = CompatibilityService.calculateScore(currentUser, user);
  const matchColor = CompatibilityService.getMatchColor(matchScore);

  return (
    <div
      onClick={async () => {
        try {
          await apiService.incrementUsage('profile_view');
          navigate(`/profile/${user.uid}`);
        } catch (error: any) {
          console.error(error);
        }
      }}
      className="vibe-card p-4 flex items-center space-x-4 cursor-pointer hover:bg-white/[0.03] active:scale-[0.98] transition-all border-vibe-border/50 hover:border-vibe-neon-blue/30 touch-manipulation"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 border-2 border-vibe-border group-hover:border-vibe-neon-blue transition-colors">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.displayName || 'User')}&background=06070a&color=fff`} 
            className="w-full h-full object-cover rounded-[14px]"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute -top-2 -right-2 bg-vibe-neon-blue text-vibe-bg text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-lg">
          L{user.level || 1}
        </div>
        {user.status && user.status !== 'offline' && (
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-vibe-bg",
            user.status === 'online' ? "bg-green-500" :
            user.status === 'away' ? "bg-yellow-500" :
            user.status === 'playing' ? "bg-vibe-neon-purple" : "bg-vibe-neon-blue"
          )} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-black text-sm uppercase tracking-tight truncate text-vibe-text">{user.nickname || user.displayName}</h4>
          {user.country && <span>{getCountryEmoji(user.country)}</span>}
        </div>
        <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-wider truncate">
          {user.bio || "Bora jogar umas?"}
        </p>
        
        <div className="flex items-center mt-1 space-x-2">
          {user.currentIntent && (
            <span className="bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 text-vibe-neon-blue text-[8px] font-black px-1.5 py-0.5 rounded flex items-center space-x-1 uppercase">
              {user.currentIntent === 'playing' && <Gamepad2 className="w-2 h-2" />}
              {user.currentIntent === 'chatting' && <MessageSquare className="w-2 h-2" />}
              {user.currentIntent === 'competitive' && <Target className="w-2 h-2" />}
              {user.currentIntent === 'friendship' && <Heart className="w-2 h-2" />}
              <span>
                {user.currentIntent === 'playing' ? 'Jogar' : 
                 user.currentIntent === 'chatting' ? 'Conversar' :
                 user.currentIntent === 'competitive' ? 'Duo' : 'Amizade'}
              </span>
            </span>
          )}
          
          {currentUser && currentUser.uid !== user.uid && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[8px] font-black border uppercase flex items-center space-x-1",
              matchScore >= 70 ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/20 text-vibe-neon-blue" : "bg-white/5 border-white/5 text-vibe-muted"
            )}>
              <Sparkles className="w-2 h-2" />
              <span>{matchScore}% Match</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
         <CallButton receiverId={user.uid} type="voice" variant="ghost" />
         <button className="p-2 text-vibe-muted hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
         </button>
      </div>
    </div>
  );
});

export default function Users() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Initial load of top players
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('level', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data() as User;
        // Strip sensitive fields
        return {
          uid: data.uid,
          nickname: data.nickname,
          displayName: data.displayName,
          photoURL: data.photoURL,
          bio: data.bio,
          level: data.level,
          status: data.status,
          country: data.country,
          currentIntent: data.currentIntent,
          playStyle: data.playStyle,
          frequency: data.frequency,
          behavior: data.behavior,
          favoriteGames: data.favoriteGames,
          interests: data.interests
        } as User;
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Search effect with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() && searchTerm.length >= 2) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('nickname', '>=', term),
        where('nickname', '<=', term + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => {
        const data = doc.data() as User;
        return {
          uid: data.uid,
          nickname: data.nickname,
          displayName: data.displayName,
          photoURL: data.photoURL,
          bio: data.bio,
          level: data.level,
          status: data.status,
          country: data.country,
          currentIntent: data.currentIntent,
          playStyle: data.playStyle,
          frequency: data.frequency,
          behavior: data.behavior,
          favoriteGames: data.favoriteGames,
          interests: data.interests
        } as User;
      });
      
      const q2 = query(
        collection(db, 'users'),
        where('displayName', '>=', term),
        where('displayName', '<=', term + '\uf8ff'),
        limit(10)
      );
      const snapshot2 = await getDocs(q2);
      const results2 = snapshot2.docs.map(doc => {
        const data = doc.data() as User;
        return {
          uid: data.uid,
          nickname: data.nickname,
          displayName: data.displayName,
          photoURL: data.photoURL,
          bio: data.bio,
          level: data.level,
          status: data.status,
          country: data.country,
          currentIntent: data.currentIntent,
          playStyle: data.playStyle,
          frequency: data.frequency,
          behavior: data.behavior,
          favoriteGames: data.favoriteGames,
          interests: data.interests
        } as User;
      });

      const merged = [...results, ...results2];
      const unique = Array.from(new Map(merged.map(u => [u.uid, u])).values());
      setSearchResults(unique);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const displayedUsers = searchTerm.trim() ? searchResults : users;

  return (
    <div className="pb-nav pt-4 px-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-black text-vibe-neon-blue tracking-tighter uppercase italic">{t('search')}</h1>
          <h2 className="text-sm font-bold text-vibe-muted uppercase tracking-widest mt-1">Encontre jogadores pelo nick</h2>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-vibe-gradient p-0.5 shadow-lg shadow-vibe-neon-blue/20">
          <div className="w-full h-full bg-vibe-bg rounded-[14px] flex items-center justify-center">
            <Search className="w-6 h-6 text-vibe-neon-blue" />
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vibe-muted group-focus-within:text-vibe-neon-blue transition-colors" />
        <input 
          type="text"
          placeholder="DIGITE O NICKNAME..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-vibe-card border border-vibe-border rounded-2xl py-5 pl-12 pr-12 text-sm font-black text-white placeholder:text-vibe-muted/50 outline-none focus:ring-2 focus:ring-vibe-neon-blue/40 transition-all shadow-inner"
        />
        {(searchTerm || isSearching) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            {isSearching ? (
              <Zap className="w-4 h-4 text-vibe-neon-blue animate-spin" />
            ) : (
              <button 
                onClick={() => setSearchTerm('')}
                className="p-1 text-vibe-muted hover:text-white"
              >
                <Zap className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        )}
      </div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/chat/global')}
        className="vibe-card p-5 bg-gradient-to-r from-vibe-neon-blue/10 to-vibe-neon-purple/10 border-vibe-neon-blue/20 relative overflow-hidden cursor-pointer"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-vibe-neon-blue/20 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-vibe-neon-blue" />
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase leading-none">{t('global_chat')}</h3>
                <p className="text-vibe-muted text-[10px] font-bold uppercase mt-1">{t('chat_with_everyone')}</p>
             </div>
          </div>
          <button 
            className="bg-vibe-neon-blue/20 text-vibe-neon-blue px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
          >
            {t('enter')}
          </button>
        </div>
      </motion.div>

      <div className="space-y-4">
        {searchTerm ? (
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-[0.3em]">
              RESULTADOS DA BUSCA
            </h3>
            {displayedUsers.length > 0 && (
              <span className="text-[9px] font-black text-vibe-muted uppercase">{displayedUsers.length} encontrados</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] flex items-center">
               <Sparkles className="w-3 h-3 mr-2 text-vibe-neon-blue" />
               JOGADORES EM ALTA
             </h3>
          </div>
        )}

        <div className="min-h-[400px]">
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 vibe-card animate-pulse" />
              ))}
            </div>
          ) : displayedUsers.length > 0 ? (
            <Virtuoso
              useWindowScroll
              data={displayedUsers}
              itemContent={(index, user) => (
                <div className="pb-3">
                  <UserItem user={user} navigate={navigate} currentUser={currentUser} />
                </div>
              )}
            />
          ) : (
            <div className="text-center py-12 vibe-card">
              <Search className="w-12 h-12 text-vibe-muted/20 mx-auto mb-4" />
              <p className="text-vibe-muted text-xs font-black uppercase tracking-widest">
                {searchTerm.length < 2 ? "DIGITE PELO MENOS 2 CARACTERES" : "Nenhum jogador encontrado"}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-vibe-neon-blue text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  Limpar Busca
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


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
