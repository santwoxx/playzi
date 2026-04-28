import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Sparkles, ShieldCheck, Zap, Mail, Lock, UserPlus, LogIn, AlertCircle, Download, User as UserIcon } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { cn } from '../lib/utils';

import { APP_LOGO } from '../constants/assets';

export default function Login() {
  const { t } = useTranslation();
  const { login, register, loginAnonymous } = useAuth();
  const { isVisible: isInstallVisible, installApp } = usePWAInstall();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAnon, setLoadingAnon] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setLoadingAnon(true);
    try {
      await loginAnonymous();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar como convidado');
    } finally {
      setLoadingAnon(false);
    }
  };

  return (
    <div className="min-h-screen bg-vibe-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
                   <img src={APP_LOGO} alt="Playsi" className="w-16 h-16 object-contain" decoding="async" />
                </div>
            </motion.div>
            <div className="absolute -bottom-2 -right-2 bg-vibe-bg border border-vibe-neon-blue p-2 rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                <Gamepad2 className="w-5 h-5 text-vibe-neon-blue animate-pulse" />
            </div>
        </div>

        <h2 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase neon-text-blue">Playsi</h2>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode='wait'>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center space-x-3 text-red-500 text-[10px] font-bold uppercase tracking-wider"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t('login_error')}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-vibe-muted uppercase tracking-widest ml-1">{t('email_label')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-muted" />
                <input 
                  required
                  type="email"
                  className="w-full bg-white/5 border border-vibe-border rounded-2xl py-4 pl-12 pr-4 focus:neon-border outline-none transition-all text-sm font-medium text-vibe-text"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-vibe-muted uppercase tracking-widest ml-1">{t('password_label')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-muted" />
                <input 
                  required
                  type="password"
                  className="w-full bg-white/5 border border-vibe-border rounded-2xl py-4 pl-12 pr-4 focus:neon-border outline-none transition-all text-sm font-medium text-vibe-text"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              disabled={loading || loadingAnon}
              type="submit"
              className="w-full bg-vibe-gradient text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-vibe-neon-blue/20 flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50 transition-all text-xs uppercase tracking-[0.2em] border border-white/10 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isRegister ? t('create_account') : t('enter_arena')}</span>
                </>
              )}
            </button>

            {!isRegister && (
              <button 
                disabled={loading || loadingAnon}
                type="button"
                onClick={handleAnonymousLogin}
                className="w-full bg-white/5 text-vibe-muted font-bold py-3 px-6 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 transition-all text-[10px] uppercase tracking-widest border border-white/5"
              >
                {loadingAnon ? (
                  <div className="w-4 h-4 border-2 border-vibe-muted/30 border-t-vibe-muted rounded-full animate-spin" />
                ) : (
                  <>
                    <UserIcon className="w-4 h-4" />
                    <span>{t('enter_as_guest')}</span>
                  </>
                )}
              </button>
            )}
          </form>

          <div className="mt-6 flex flex-col items-center space-y-4">
             <button 
                onClick={() => setIsRegister(!isRegister)}
                className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-widest hover:brightness-125 transition-all"
             >
                {isRegister ? t('already_have_account') : t('new_here')}
             </button>
          </div>
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
           <a href="#" className="hover:text-vibe-neon-blue transition-colors">Privacy Policy</a>
           <a href="#" className="hover:text-vibe-neon-blue transition-colors">Terms of Service</a>
        </div>
      </motion.div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
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
