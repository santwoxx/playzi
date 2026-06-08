import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, User, ChevronRight, BookOpen, Search, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';
import { BLOG_POSTS } from '../constants/blogData';

export default function Blog() {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Blog Gamer Playzi",
    "description": "Notícias, estratégias e as melhores formas de socializar no mundo dos jogos.",
    "url": "https://playzi.app.br/blog",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": BLOG_POSTS.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://playzi.app.br/blog/${post.slug}`,
        "name": post.title
      }))
    }
  };

  return (
    <div className="pt-20 pb-20 px-4 min-h-screen bg-vibe-bg gaming-grid">
      <SEO 
        title="Blog Gamer - Dicas, Squads e Comunidades" 
        description="Fique por dentro das melhores dicas sobre como encontrar squad, melhores jogos para fazer amigos e novidades das comunidades online gamers na Playzi." 
        keywords="blog gamer, dicas free fire, squads roblox, comunidades online brasil"
        url="https://playzi.app.br/blog"
        schema={blogSchema}
      />
      
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 rounded-full text-[10px] font-black text-vibe-neon-blue uppercase tracking-[0.2em] mb-4"
          >
            <BookOpen className="w-3 h-3" />
            <span>Playzi Magazine</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none mb-6"
          >
            Blog do <span className="text-vibe-neon-blue">Gamer</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-vibe-muted max-w-2xl mx-auto font-medium"
          >
            Notícias, estratégias e as melhores formas de socializar no mundo dos jogos. Sua fonte oficial de conteúdo gamer.
          </motion.p>
        </header>

        {/* Featured Post */}
        <Link to={`/blog/${BLOG_POSTS[0].slug}`} className="block mb-16">
          <motion.div 
            whileHover={{ y: -5 }}
            className="vibe-card overflow-hidden grid grid-cols-1 lg:grid-cols-2 group border-vibe-neon-blue/30"
          >
            <div className="relative h-64 lg:h-auto overflow-hidden">
              <img 
                src={BLOG_POSTS[0].image} 
                alt={BLOG_POSTS[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vibe-bg to-transparent lg:hidden" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-vibe-neon-blue text-vibe-bg text-[10px] font-black uppercase rounded-lg">Destaque</span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center space-y-4">
              <div className="flex items-center space-x-4 text-[10px] font-black text-vibe-muted uppercase tracking-widest">
                <span className="text-vibe-neon-blue">{BLOG_POSTS[0].category}</span>
                <span>{BLOG_POSTS[0].date}</span>
              </div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-vibe-neon-blue transition-colors">
                {BLOG_POSTS[0].title}
              </h2>
              <p className="text-vibe-muted font-medium line-clamp-3">
                {BLOG_POSTS[0].excerpt}
              </p>
              <div className="pt-4 flex items-center text-vibe-neon-blue font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Ler Artigo Completo <ChevronRight className="ml-2 w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {BLOG_POSTS.slice(1).map((post, idx) => (
            <Link key={post.slug} to={`/blog/${post.slug}`}>
              <motion.article 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="vibe-card h-full flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden rounded-t-2xl">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
                    {post.category}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div className="flex items-center text-[10px] font-bold text-vibe-muted uppercase">
                    <Calendar className="w-3 h-3 mr-1" /> {post.date}
                  </div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight group-hover:text-vibe-neon-blue transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-xs text-vibe-muted font-medium flex-1 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="pt-4 flex items-center justify-between">
                    <div className="flex items-center text-[10px] text-vibe-muted italic">
                      <User className="w-3 h-3 mr-1" /> {post.author}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-vibe-neon-blue/10 flex items-center justify-center text-vibe-neon-blue group-hover:bg-vibe-neon-blue group-hover:text-vibe-bg transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>

        {/* Newsletter / CTA Section */}
        <section className="vibe-card p-12 relative overflow-hidden border-vibe-neon-purple/30 bg-vibe-neon-purple/5">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-vibe-neon-purple/20 blur-[100px] rounded-full" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Mantenha-se Atualizado</h2>
              <p className="text-vibe-muted font-medium">Receba as últimas notícias de comunidades e dicas de squads diretamente no seu radar.</p>
            </div>
            <div className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="flex-1 bg-vibe-bg border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:neon-border transition-all"
              />
              <button className="bg-vibe-neon-purple text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-glow-purple hover:scale-105 active:scale-95 transition-all">
                Assinar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
