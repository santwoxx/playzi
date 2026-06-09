import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Sparkles, ShieldCheck, Zap, Mail, Lock, UserPlus, LogIn, AlertCircle, Download, User as UserIcon } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { cn } from '../lib/utils';

import { APP_LOGO } from '../constants/assets';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import SEOFooter from '../components/SEOFooter';

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const { isVisible: isInstallVisible, installApp } = usePWAInstall();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro no login do Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vibe-bg flex flex-col relative overflow-x-hidden overflow-y-auto">
      <SEO 
        title="Playzi Login - Aplicativo para Conversar, Video Chamada 1v1 e IA" 
        description="Entre na Playzi! O melhor aplicativo para conversar com pessoas e IA por chat de video 1v1 gratis ou bate-papo gamer. Encontre amigos, faça video chamada online e jogue. A melhor alternativa ao OmeTV e Omegle no Brasil." 
        keywords="playzi login, entrar playzi, aplicativo para conversar, conversar com pessoas, conversar com ia, ometv, ome tv, video chamada gratis, chamada de video online, chat video chamada, alternativa ometv"
      />
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibe-neon-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibe-neon-purple/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center w-full max-w-sm"
        >
          <div className="relative mb-8">
              <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="w-24 h-24 bg-vibe-gradient rounded-3xl shadow-[0_0_40px_rgba(0,242,255,0.4)] flex items-center justify-center p-1"
              >
                  <div className="w-full h-full bg-vibe-bg rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src={APP_LOGO} alt="Playzi" className="w-16 h-16 object-contain" decoding="async" />
                  </div>
              </motion.div>
              <div className="absolute -bottom-2 -right-2 bg-vibe-bg border border-vibe-neon-blue p-2 rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                  <Gamepad2 className="w-5 h-5 text-vibe-neon-blue animate-pulse" />
              </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase neon-text-blue">Playzi</h1>
          <p className="text-vibe-muted mb-2 text-center font-bold text-[10px] uppercase tracking-[0.3em]">
            PRIVACY • SECURITY • GAMING
          </p>
          <div className="flex flex-col items-center space-y-1 mb-8">
            <p className="text-vibe-neon-blue font-black text-[12px] uppercase tracking-widest text-center animate-pulse">
              Encontre o seu par ideal no game! 🎮🔥
            </p>
            <p className="text-vibe-muted font-bold text-[8px] uppercase tracking-[0.2em] opacity-60">
              Junte-se a +10k gamers ativos agora
            </p>
          </div>

          <div className="w-full vibe-card p-6 border-white/5 bg-black/40 dark:bg-black/40 backdrop-blur-xl">
            <AnimatePresence mode='wait'>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center space-x-3 text-red-500 text-[10px] font-bold uppercase tracking-wider mb-4"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50 transition-all text-xs uppercase tracking-[0.2em] border border-white/10"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span className="animate-pulse">Conectando...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Entrar com o Google</span>
                </>
              )}
            </button>
          </div>
          
          <div className="mt-8 grid grid-cols-4 gap-3 w-full">
              <LoginFeature icon={<Zap className="w-4 h-4" />} label="Speed" />
              <LoginFeature icon={<ShieldCheck className="w-4 h-4" />} label="Secure" />
              <LoginFeature icon={<Sparkles className="w-4 h-4" />} label="Pro" />
              <button 
                onClick={installApp}
                className={cn(
                  "flex flex-col items-center p-3 rounded-2xl bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 space-y-1 transition-all active:scale-95",
                  !isInstallVisible && "opacity-20 grayscale pointer-events-none"
                )}
              >
                <Download className="w-4 h-4 text-vibe-neon-blue" />
                <span className="text-[8px] font-black uppercase tracking-widest text-vibe-neon-blue">Instalar</span>
              </button>
          </div>

          <div className="mt-12 flex space-x-6 text-[9px] text-vibe-muted font-black uppercase tracking-[0.2em]">
            <Link to="/privacy" className="hover:text-vibe-neon-blue transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-vibe-neon-blue transition-colors">Terms of Service</Link>
          </div>
        </motion.div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <SEOFooter />
    </div>
  );
}

function LoginFeature({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="text-vibe-muted">{icon}</div>
            <span className="text-[8px] font-black uppercase tracking-widest text-vibe-muted">{label}</span>
        </div>
    )
}
