import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Users, Zap, Trophy, MessageCircle, Gamepad2, Star, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';

const COMMUNITY_SEO_DATA: Record<string, any> = {
  'freefire': {
    title: 'Grupos de Free Fire | Encontre Squads e Duos',
    description: 'Participe da maior comunidade de Free Fire no Brasil. Encontre squads, duos para rankeada, dicas de mestre e faça novas amizades no chat de vídeo 1v1.',
    h1: 'Comunidade Free Fire Brasil',
    benefits: [
      'Encontre Squads para Rankeada instantaneamente',
      'Chat de Voz e Vídeo para coordenação em tempo real',
      'Torneios exclusivos da comunidade Playzi',
      'Dicas para subir para o Mestre com os melhores players'
    ],
    longDesc: 'O Free Fire é mais que um jogo, é uma paixão nacional. Na Playzi, conectamos você aos melhores jogadores para que você nunca mais jogue sozinho. Nossa plataforma oferece ferramentas exclusivas de matchmaking onde você pode filtrar parceiros pelo nível de habilidade e estilo de jogo.',
    keywords: 'grupos free fire, squad free fire, guilda free fire, amigos free fire'
  },
  'roblox': {
    title: 'Grupos de Roblox | Amizades e Jogos Online',
    description: 'Explore o universo Roblox com novos amigos. Encontre grupos de Blox Fruits, Brookhaven e muito mais. Chat seguro e divertido para todos.',
    h1: 'Explorar o Multiverso Roblox',
    benefits: [
      'Grupos específicos para Blox Fruits e RP',
      'Ambiente seguro e moderado para todas as idades',
      'Trocas de itens e dicas de mapas populares',
      'Crie seu próprio squad para eventos mundiais'
    ],
    longDesc: 'Roblox é sobre criatividade e socialização. Na Playzi, facilitamos a descoberta de novos servidores e amigos que compartilham o mesmo gosto pelos jogos dentro do Roblox. Seja para um Roleplay sério ou apenas para se divertir, aqui é o seu lugar.',
    keywords: 'grupos roblox, blox fruits grupos, amigos roblox, roblox brasil'
  },
  'minecraft': {
    title: 'Grupos de Minecraft | Servidores e Construção',
    description: 'Conecte-se com construtores e aventureiros de Minecraft. Encontre servidores Survival, Creative e Bed Wars na comunidade Playzi.',
    h1: 'Construa o Futuro no Minecraft',
    benefits: [
      'Divulgação de servidores Survival e Criativo',
      'Recrutamento para grandes projetos de construção',
      'Squads para Bed Wars e Sky Wars',
      'Chat focado em técnicos de Redstone e Mods'
    ],
    longDesc: 'Minecraft é sobre colaboração. Encontre parceiros que levam a construção a sério ou apenas alguém para explorar as cavernas mais profundas. Na Playzi, a comunidade de Minecraft é focada em ajudar uns aos outros a criar mundos incríveis.',
    keywords: 'servidores minecraft brasil, survival minecraft, builders minecraft, grupos minecraft'
  },
  'gta': {
    title: 'Grupos de GTA V e RP | Los Santos te Espera',
    description: 'Entre no mundo do GTA V e Roleplay. Encontre facções, organizações e amigos para curtir a vida em Los Santos na Playzi.',
    h1: 'Domine Los Santos no GTA V',
    benefits: [
      'Recrutamento para servidores de RP (Roleplay)',
      'Organização de Heists (Golpes) online',
      'Encontros de carros e eventos da comunidade',
      'Dicas de economia e melhores propriedades'
    ],
    longDesc: 'O universo de Grand Theft Auto V é vasto e cheio de possibilidades. Seja no modo Online tradicional ou nos complexos servidores de RP, ter o squad certo faz toda a diferença. Conecte-se com jogadores que buscam o mesmo nível de imersão que você.',
    keywords: 'gta rp brasil, servidores rp, gta v online grupos, comandos gta v'
  }
};

export default function CommunityLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const data = COMMUNITY_SEO_DATA[slug || ''] || COMMUNITY_SEO_DATA['freefire'];

  const communitySchema = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    "mainEntity": {
      "@type": "GameServer", // Best fit for a gaming community/squad finder
      "name": data.h1,
      "description": data.description,
      "url": `https://playzi.app.br/comunidades/${slug}`,
      "gameItem": {
        "@type": "VideoGame",
        "name": slug?.replace('-', ' ')
      }
    }
  };

  return (
    <div className="pt-20 pb-20 px-4 min-h-screen bg-vibe-bg gaming-grid">
      <SEO 
        title={data.title} 
        description={data.description} 
        keywords={data.keywords} 
        url={`https://playzi.app.br/comunidades/${slug}`}
        schema={communitySchema}
        breadcrumbs={[
          { name: 'Comunidades', url: '/communities' },
          { name: data.h1, url: `/comunidades/${slug}` }
        ]}
      />
      
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/communities')}
          className="flex items-center space-x-2 text-vibe-muted hover:text-vibe-neon-blue transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Ver todas comunidades</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <header>
              <div className="inline-flex items-center px-3 py-1 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 rounded-full text-[10px] font-black text-vibe-neon-blue uppercase tracking-[0.2em] mb-4">
                <Star className="w-3 h-3 mr-2 fill-vibe-neon-blue" />
                Comunidade Oficial
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none">
                {data.h1}
              </h1>
              <p className="text-vibe-muted text-lg font-medium leading-relaxed">
                {data.description}
              </p>
            </header>

            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-vibe-neon-purple">Vantagens do Squad</h2>
              <ul className="space-y-3">
                {data.benefits.map((benefit: string, i: number) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center space-x-3 text-sm font-bold text-white/80"
                  >
                    <div className="p-1 bg-vibe-neon-blue/20 rounded-lg">
                      <Zap className="w-4 h-4 text-vibe-neon-blue" />
                    </div>
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="vibe-card p-6 border-white/5 bg-white/5 backdrop-blur-md">
              <p className="text-xs text-vibe-muted leading-relaxed font-medium">
                {data.longDesc}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="vibe-card p-8 border-vibe-neon-blue/30 shadow-glow-blue relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-vibe-neon-blue/10 blur-3xl rounded-full group-hover:bg-vibe-neon-blue/20 transition-all" />
               
               <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-8">
                     <div className="w-16 h-16 bg-vibe-bg border border-vibe-border rounded-2xl flex items-center justify-center p-2">
                        <Users className="w-8 h-8 text-vibe-neon-blue" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-vibe-muted uppercase tracking-widest">Pronto para o jogo?</p>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Entrar no Grupo</h3>
                     </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between text-xs font-bold text-white/60">
                      <span>Membros Ativos</span>
                      <span className="text-vibe-neon-blue">1.2k+</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-vibe-neon-blue w-[85%] shadow-glow-blue" />
                    </div>
                    <div className="flex -space-x-2">
                      {[1,2,3,4,5].map(i => (
                        <img key={i} src={`https://picsum.photos/seed/seo${i}/40/40`} className="w-8 h-8 rounded-full border-2 border-vibe-bg" />
                      ))}
                      <div className="w-8 h-8 rounded-full bg-vibe-border flex items-center justify-center text-[8px] font-black border-2 border-vibe-bg">
                        +240
                      </div>
                    </div>
                  </div>

                  <Link 
                    to={`/communities/${slug}`}
                    className="w-full py-5 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-[0.2em] rounded-2xl shadow-glow-blue hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Abrir Chat do Squad</span>
                  </Link>

                  <p className="text-[9px] text-center text-vibe-muted font-bold uppercase tracking-widest mt-6 opacity-60">
                    Acesso Gratuito • Chat Realtime • Sem Spam
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="vibe-card p-4 border-white/5 flex flex-col items-center text-center space-y-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span className="text-[9px] font-black text-white uppercase italic">Ranking Semanal</span>
               </div>
               <div className="vibe-card p-4 border-white/5 flex flex-col items-center text-center space-y-2">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                  <span className="text-[9px] font-black text-white uppercase italic">Moderado por IA</span>
               </div>
            </div>

            <section className="pt-8">
               <h4 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] mb-4">Outras Comunidades</h4>
               <div className="space-y-2">
                  {Object.keys(COMMUNITY_SEO_DATA).filter(s => s !== slug).map(s => (
                    <Link 
                      key={s} 
                      to={`/comunidades/${s}`}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <span className="text-xs font-black text-white/60 uppercase group-hover:text-vibe-neon-blue transition-colors">{s.replace('-', ' ')}</span>
                      <Gamepad2 className="w-4 h-4 text-vibe-muted group-hover:text-vibe-neon-blue transition-all" />
                    </Link>
                  ))}
               </div>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
