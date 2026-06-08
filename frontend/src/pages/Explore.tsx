import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import SEO from '../components/SEO';
import { Post } from '../types';
import { Search, TrendingUp, Hash, Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState<string[]>(['gameplay', 'setup', 'pcgaming', 'ps5', 'xbox', 'valorant', 'minecraft', 'leagueoflegends']);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async (tag?: string) => {
    setLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      let q;
      
      if (tag) {
        // Simple hashtag search (depends on how hashtags are stored, assuming they are in caption)
        // Note: Firestore doesn't support partial string match easily with hashtags without an array
        // For now, let's assume popular posts or basic keyword match
        q = query(
          postsRef,
          orderBy('likes', 'desc'),
          limit(24)
        );
      } else {
        q = query(
          postsRef,
          orderBy('likes', 'desc'),
          limit(24)
        );
      }

      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        return { id: doc.id, ...data } as Post;
      }).filter(p => {
        const uDisplayName = (p.userDisplayName || '').toLowerCase();
        const uId = (p.userId || '').toLowerCase();
        return uDisplayName !== 'anaclara0927bb' && uId !== 'anaclara0927bb';
      });
      
      // Client-side filtering for hashtag if searching
      if (tag) {
        setPosts(fetchedPosts.filter(p => p.caption?.toLowerCase().includes(`#${tag.toLowerCase()}`)));
      } else {
        // Sort by likes count since we can't easily query on array length in Firestore
        setPosts(fetchedPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)));
      }
    } catch (error) {
      console.error('Error fetching explore posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchExplorePosts(searchQuery.replace('#', ''));
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Playzi",
      "item": "https://playzi.app.br/"
    },{
      "@type": "ListItem",
      "position": 2,
      "name": "Explorar",
      "item": "https://playzi.app.br/explore"
    }]
  };

  return (
    <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto">
      <SEO 
        title="Explorar Chat de Vídeo e Encontros Gamer" 
        description="Descubra novos gamers para chat de vídeo 1v1, hashtags em alta e os conteúdos mais populares. Conheça pessoas novas na melhor alternativa gamer ao Omegle e MeetMe." 
        keywords="explorar gamers, hashtags gamer, chat de vídeo aleatório, squads free fire"
        url="https://playzi.app.br/explore"
        schema={breadcrumbSchema}
      />
      
      <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-8">
        Explorar Universo Gamer
      </h1>
      {/* Search Bar */}
      <div className="relative mb-8">
        <form onSubmit={handleSearch}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Pesquisar por #hashtags ou jogos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-vibe-card border border-vibe-border rounded-2xl py-4 pl-12 pr-4 text-vibe-text focus:outline-none focus:ring-2 focus:ring-vibe-neon-blue/50 transition-all placeholder:text-vibe-muted font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vibe-muted group-focus-within:text-vibe-neon-blue transition-colors" />
            <button 
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-vibe-gradient text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-vibe-neon-blue/20"
            >
              Ir
            </button>
          </div>
        </form>
      </div>

      {/* Trending Tags */}
      <div className="mb-10 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-4 h-4 text-vibe-neon-pink" />
          <h2 className="text-xs font-black uppercase tracking-widest text-vibe-muted">Tags em Alta</h2>
        </div>
        <div className="flex space-x-3">
          {trendingTags.map(tag => (
            <button 
              key={tag}
              onClick={() => {
                setSearchQuery(`#${tag}`);
                fetchExplorePosts(tag);
              }}
              className="flex-shrink-0 px-5 py-2.5 bg-vibe-card border border-vibe-border rounded-full text-sm font-bold hover:border-vibe-neon-pink hover:text-vibe-neon-pink transition-all flex items-center space-x-2"
            >
              <Hash className="w-3 h-3" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="relative group cursor-pointer overflow-hidden rounded-2xl bg-vibe-card border border-vibe-border break-inside-avoid"
              onClick={() => navigate('/')} // In a real app, open post detail or feed at that index
            >
              {post.mediaUrls?.[0] || post.mediaUrl ? (
                <div className="relative">
                  <img 
                    src={post.mediaUrls?.[0] || post.mediaUrl} 
                    alt={post.caption}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {post.mediaUrls && post.mediaUrls.length > 1 && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-xl">
                        <div className="flex -space-x-1">
                          <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45 border border-black/20" />
                          <div className="w-2.5 h-2.5 bg-white/60 rounded-sm rotate-45 border border-black/20 translate-x-1 translate-y-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-vibe-gradient opacity-20">
                   <Hash className="w-12 h-12 text-white" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-xs font-medium line-clamp-2 mb-3">
                  {post.caption}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-[10px] font-black text-white/80 uppercase">
                    <Heart className="w-3 h-3 text-vibe-neon-pink" fill={(post.likes?.length || 0) > 0 ? "currentColor" : "none"} />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-black text-white/80 uppercase">
                    <MessageCircle className="w-3 h-3 text-vibe-neon-blue" />
                    <span>{post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="pt-10 flex justify-center">
          <div className="w-8 h-8 border-4 border-vibe-neon-blue border-r-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20">
          <Hash className="w-16 h-16 text-vibe-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-black text-vibe-text">Nenhum post encontrado</h3>
          <p className="text-vibe-muted text-sm mt-2">Tente buscar por outra hashtag ou palavra-chave.</p>
        </div>
      )}
    </div>
  );
}
