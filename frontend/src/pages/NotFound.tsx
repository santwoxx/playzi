import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Search, Gamepad2, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-vibe-bg flex flex-col items-center justify-center p-6 relative overflow-hidden gaming-grid">
      <SEO 
        title="Pagina Nao Encontrada - 404" 
        description="Pagina nao encontrada na Playzi. Volte para o feed e continue explorando a maior rede social gamer do Brasil."
        noIndex={true}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibe-neon-blue/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibe-neon-purple/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 flex flex-col items-center text-center max-w-md"
      >
        <div className="text-8xl font-black italic text-white/10 tracking-tighter mb-4">404</div>
        <div className="w-24 h-24 bg-vibe-gradient rounded-3xl shadow-[0_0_40px_rgba(0,242,255,0.4)] flex items-center justify-center mb-8">
          <Search className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">
          Pagina Nao Encontrada
        </h1>
        <p className="text-vibe-muted font-medium mb-8 max-w-sm">
          Parece que voce se perdeu no multiverso gamer! Essa pagina nao existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <Link 
            to="/"
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-widest rounded-2xl shadow-glow-blue hover:scale-105 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Voltar ao Feed</span>
          </Link>
          <Link 
            to="/explore"
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Explorar</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
