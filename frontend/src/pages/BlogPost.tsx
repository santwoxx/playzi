import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Calendar, User, Clock, Share2, MessageCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SEO from '../components/SEO';
import { BLOG_POSTS } from '../constants/blogData';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="pt-40 pb-20 px-4 text-center">
        <h1 className="text-4xl font-black text-white italic mb-4 uppercase">Artigo não encontrado</h1>
        <Link to="/blog" className="text-vibe-neon-blue font-bold uppercase tracking-widest flex items-center justify-center">
          <ChevronLeft className="mr-2" /> Voltar para o Blog
        </Link>
      </div>
    );
  }

  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  const parseDateToISO = (dateStr: string): string => {
    const months: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'marco': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    const match = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = months[match[2].toLowerCase()] || '01';
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return '2026-05-01';
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "author": {
      "@type": "Organization",
      "name": post.author || "Equipe Playzi"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Playzi",
      "logo": {
        "@type": "ImageObject",
        "url": "https://i.ibb.co/svpJKdbx/playsi-logo.png"
      }
    },
    "datePublished": parseDateToISO(post.date),
    "dateModified": parseDateToISO(post.date),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://playzi.app.br/blog/${post.slug}`
    },
    "wordCount": wordCount
  };

  return (
    <div className="pt-20 pb-20 px-4 min-h-screen bg-vibe-bg gaming-grid">
      <SEO 
        title={post.title} 
        description={post.excerpt} 
        keywords={post.keywords}
        image={post.image}
        url={`https://playzi.app.br/blog/${post.slug}`}
        type="article"
        schema={articleSchema}
        publishedTime={parseDateToISO(post.date)}
        breadcrumbs={[
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` }
        ]}
      />
      
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/blog')}
          className="flex items-center space-x-2 text-vibe-muted hover:text-vibe-neon-blue transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Voltar para o Blog</span>
        </button>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <span className="px-3 py-1 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 rounded-full text-[10px] font-black text-vibe-neon-blue uppercase tracking-widest">
              {post.category}
            </span>
            <div className="flex items-center text-[10px] font-bold text-vibe-muted uppercase tracking-widest">
              <Clock className="w-3 h-3 mr-1" /> {readTime} min de leitura
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-8 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-white/5">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-vibe-neon-purple/20 flex items-center justify-center">
                <User className="w-6 h-6 text-vibe-neon-purple" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase">{post.author}</p>
                <p className="text-[10px] font-bold text-vibe-muted uppercase">{post.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 bg-white/5 rounded-full text-vibe-muted hover:text-vibe-neon-blue transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-12 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-auto"
          />
        </div>

        {/* Content */}
        <article className="prose prose-invert prose-sky max-w-none prose-h1:italic prose-h1:tracking-tighter prose-h1:uppercase prose-h2:italic prose-h2:tracking-tight prose-h2:uppercase">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Footer / Sharing / Next Steps */}
        <footer className="mt-16 pt-8 border-t border-white/5">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-vibe-neon-blue/10 rounded-3xl border border-vibe-neon-blue/20">
               <MessageCircle className="w-8 h-8 text-vibe-neon-blue mx-auto mb-2" />
               <h3 className="text-xl font-black text-white italic uppercase mb-2">Gostou do conteúdo?</h3>
               <p className="text-sm text-vibe-muted font-medium mb-6">Junte-se à nossa comunidade e coloque essas dicas em prática!</p>
               <Link 
                to="/communities"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-widest rounded-2xl shadow-glow-blue hover:scale-105 active:scale-95 transition-all"
               >
                 <span>Entrar em uma Comunidade</span>
                 <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Related Articles */}
          <div className="mt-20">
            <h3 className="text-xs font-black text-vibe-muted uppercase tracking-[0.3em] mb-8">Mais Artigos para Você</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2).map((relatedPost) => (
                <Link key={relatedPost.slug} to={`/blog/${relatedPost.slug}`}>
                  <div className="vibe-card p-4 flex space-x-4 group hover:border-vibe-neon-blue/30 transition-all">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={relatedPost.image} alt={relatedPost.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase italic leading-tight mb-2 group-hover:text-vibe-neon-blue transition-colors">
                        {relatedPost.title}
                      </h4>
                      <p className="text-[10px] text-vibe-muted font-medium line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
