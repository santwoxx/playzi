import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { Gamepad2, ArrowLeft, RotateCw, Maximize2, Minimize2, Sparkles, Trophy, Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function PlayNow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const gameUrl = 'https://tryhardacademyoficial.vercel.app';

  const handleReload = () => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = gameUrl;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    } else {
      // Try actual fullscreen first
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn(`Browser Fullscreen blocked, using fallback overlay: ${err.message}`);
        setIsFullscreen(true); // Fallback overlay
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="pt-6 pb-nav min-h-screen px-4 sm:px-6 relative gaming-grid">
      <SEO 
        title="Jogar Agora - Jogos Online Gratis com Amigos" 
        description="Jogue gratis agora na Playzi! Tryhard Academy e minigames online. Desafie seus amigos, suba no ranking e ganhe recompensas. O melhor portal de jogos de navegador para gamers brasileiros."
        keywords="jogar agora, jogos online gratis, jogar com amigos, tryhard academy, jogos navegador"
        url="https://playzi.app.br/jogar-agora"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/arcade')}
            className="flex items-center space-x-2 text-vibe-muted hover:text-white font-bold text-xs uppercase tracking-widest transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-vibe-neon-blue" />
            <span>Voltar ao Arcade</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-vibe-muted uppercase tracking-widest">Servidor Online</span>
          </div>
        </div>

        {/* Game Showcase & Information */}
        <div className="vibe-card p-6 bg-black/40 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 rounded-xl text-vibe-neon-blue">
                <Gamepad2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Tryhard Academy</h1>
                <p className="text-xs text-vibe-neon-blue font-bold tracking-widest uppercase">Arena Oficial Integrada</p>
              </div>
            </div>
            <p className="text-vibe-muted text-xs leading-relaxed max-w-xl">
              Entre em campo agora na nossa academia gamer exclusiva! Domine os controles, enfrente os desafios do Tryhard Academy e acumule moedas de XP em seu perfil da Playzi.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 z-10">
            <button 
              onClick={handleReload}
              className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center space-x-2"
              title="Recarregar Jogo"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Recarregar</span>
            </button>

            <button 
              onClick={toggleFullscreen}
              className="px-4 py-3 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 text-vibe-neon-blue rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-vibe-neon-blue/20 active:scale-95 transition-all flex items-center space-x-2"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Tela Comum' : 'Tela Cheia'}</span>
            </button>
          </div>

          {/* Glowing backline */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-vibe-neon-blue/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Interactive Game Frame */}
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full overflow-hidden transition-all duration-300",
            isFullscreen 
              ? "fixed inset-0 z-[9999] bg-[#06070a] flex flex-col justify-between" 
              : "aspect-[16/9] bg-black/80 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          )}
        >
          {/* Custom controls bar only shown in fullscreen */}
          {isFullscreen && (
            <div className="w-full bg-black/60 border-b border-white/10 p-4 flex items-center justify-between z-50">
              <div className="flex items-center space-x-3">
                <img src="https://i.ibb.co/svpJKdbx/playsi-logo.png" className="w-6 h-6 object-contain" alt="Playzi" />
                <span className="text-xs font-black text-white tracking-widest uppercase">Tryhard Academy - Playzi</span>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleReload} 
                  className="p-2 rounded-lg bg-white/5 text-vibe-muted hover:text-white transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleFullscreen} 
                  className="px-4 py-1.5 rounded-lg bg-vibe-neon-pink/20 text-vibe-neon-pink text-[10px] font-black uppercase tracking-widest"
                >
                  Sair da Tela Cheia
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06070a] z-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-vibe-neon-blue/30 border-t-vibe-neon-blue rounded-full animate-spin shadow-glow-blue" />
                <Gamepad2 className="w-6 h-6 text-vibe-neon-blue absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-xs uppercase font-black text-white tracking-widest animate-pulse">Carregando a Arena...</p>
                <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-tight">tryhardacademyoficial.vercel.app</p>
              </div>
            </div>
          )}

          {/* The Embed IFrame */}
          <iframe 
            ref={iframeRef}
            src={gameUrl}
            title="Tryhard Academy"
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
          />
        </div>

        {/* Community & Tips Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="vibe-card p-5 bg-white/5 border-white/5 flex items-start space-x-4">
            <div className="p-3 bg-vibe-neon-purple/20 text-vibe-neon-purple rounded-xl mt-1">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-black tracking-widest text-[#00f2ff]">Matchmaking Ativo</h3>
              <p className="text-vibe-muted text-[11px] leading-relaxed mt-1">
                Encontrou o adversário perfeito e quer jogar em duo? Utilize a busca de amigos ou vá na aba Encontros, junte seu squad e jogue de forma cooperativa!
              </p>
            </div>
          </div>

          <div className="vibe-card p-5 bg-white/5 border-white/5 flex items-start space-x-4">
            <div className="p-3 bg-vibe-neon-pink/20 text-vibe-neon-pink rounded-xl mt-1">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-black tracking-widest text-vibe-neon-pink">Dica dos Pro-Players</h3>
              <p className="text-vibe-muted text-[11px] leading-relaxed mt-1">
                Ative a "Tela Cheia" para ter uma imersão completa sem distrações e melhor resposta aos comandos táticos das partidas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
