import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="pt-20 pb-20 px-4 md:pt-24 min-h-screen bg-vibe-bg gaming-grid">
      <SEO title="Politica de Privacidade - Playzi" description="Saiba como a Playzi protege seus dados pessoais, garantindo seguranca e privacidade na maior rede social gamer do Brasil. Politica de privacidade completa e transparente." url="https://playzi.app.br/privacy" breadcrumbs={[{ name: 'Privacidade', url: '/privacy' }]} />
      
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
            <div className="p-3 bg-vibe-neon-blue/10 rounded-2xl border border-vibe-neon-blue/20">
              <Shield className="w-8 h-8 text-vibe-neon-blue" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-vibe-text tracking-tighter uppercase italic">Privacidade</h1>
              <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest">Última atualização: Maio 2026</p>
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
              <Lock className="w-5 h-5 mr-3 text-vibe-neon-blue" />
              Coleta de Informações
            </h2>
            <p className="text-sm">
              Coletamos informações que você nos fornece diretamente ao criar sua conta na Playzi, como nome de usuário, nickname, e-mail e preferências de jogo. Também coletamos dados de uso para melhorar sua experiência, como os jogos que você mais interage e as comunidades que participa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-3 text-vibe-neon-blue" />
              Uso dos Dados
            </h2>
            <p className="text-sm">
              Utilizamos seus dados para personalizar seu feed, sugerir squads (duos) compatíveis através de nossa IA, e facilitar chamadas de vídeo e chat entre membros. Nunca vendemos suas informações de contato para terceiros sem seu consentimento explícito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-3 text-vibe-neon-blue" />
              Segurança em Primeiro Lugar
            </h2>
            <p className="text-sm">
              Implementamos medidas de segurança de ponta, incluindo criptografia de dados e monitoramento constante de atividades suspeitas. Suas chamadas de vídeo e mensagens privadas são protegidas para garantir que sua interação na plataforma seja segura e divertida.
            </p>
          </section>

          <section className="pt-8 border-t border-white/5">
            <p className="text-[10px] font-bold text-vibe-muted uppercase tracking-widest text-center">
              Ao usar a Playzi, você concorda com nossos termos de proteção de dados. Jogue limpo, jogue seguro.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
