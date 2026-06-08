import React from 'react';
import { motion } from 'motion/react';
import { Gavel, Users, Zap, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="pt-20 pb-20 px-4 md:pt-24 min-h-screen bg-vibe-bg gaming-grid">
      <SEO title="Termos de Uso" description="Regras e diretrizes para uma convivência épica na Playzi." />
      
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-vibe-muted hover:text-vibe-neon-blue transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Voltar</span>
        </button>

        <header className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-vibe-neon-purple/10 rounded-2xl border border-vibe-neon-purple/20">
              <Gavel className="w-8 h-8 text-vibe-neon-purple" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-vibe-text tracking-tighter uppercase italic">Termos de Uso</h1>
              <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest">Conduta do Jogador v2.0</p>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="vibe-card p-8 space-y-8 text-white/80 leading-relaxed"
        >
          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center">
              <Users className="w-5 h-5 mr-3 text-vibe-neon-purple" />
              Conduta na Comunidade
            </h2>
            <p className="text-sm">
              A Playzi é um espaço para conexão e diversão. Toxicidade, discurso de ódio, assédio ou qualquer forma de bullying resultará em suspensão imediata da conta. Valorizamos o respeito entre jogadores de todos os níveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-3 text-vibe-neon-purple" />
              Conteúdo Gerado pelo Usuário
            </h2>
            <p className="text-sm">
              Você é responsável pelo conteúdo que posta (stories, reels, mensagens). Não é permitido postar conteúdo protegido por direitos autorais sem permissão, spam, links maliciosos ou conteúdo sexualmente explícito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center">
              <Gavel className="w-5 h-5 mr-3 text-vibe-neon-purple" />
              Rescisão e Suspensão
            </h2>
            <p className="text-sm">
              Reservamo-nos o direito de encerrar contas que violem repetidamente estes termos. A segurança da comunidade é nossa prioridade absoluta. Jogadores que mantêm um bom "Reputation Score" ganham vantagens exclusivas na plataforma.
            </p>
          </section>

          <section className="pt-8 border-t border-white/5">
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-vibe-gradient text-white rounded-2xl font-black uppercase tracking-widest shadow-glow-purple"
            >
              Aceito as Regras e Quero Jogar
            </button>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
