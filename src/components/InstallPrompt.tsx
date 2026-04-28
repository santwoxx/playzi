import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Monitor, ChevronRight, Download, Gift, Star, Zap, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

export default function InstallPrompt() {
  const { currentUser, refreshUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const isDismissed = localStorage.getItem('installPromptDismissed');
      const lastPrompt = localStorage.getItem('installPromptLastShown');
      const now = Date.now();
      
      // Delay initial show if eligible
      const shouldShow = !isDismissed && (!lastPrompt || now - parseInt(lastPrompt) > 4 * 60 * 60 * 1000);
      if (shouldShow) {
        setTimeout(() => setIsVisible(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
       setIsVisible(false);
       // Check if we need to claim reward
       if (currentUser && !currentUser.rewards?.installedApp) {
          claimInstallReward();
       }
    }

    const handleAppInstalled = () => {
      console.log('App was installed');
      setIsVisible(false);
      setInstalledSuccessfully(true);
      claimInstallReward();
      setTimeout(() => setInstalledSuccessfully(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [currentUser]);

  const claimInstallReward = async () => {
    if (!currentUser || currentUser.rewards?.installedApp) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'rewards.installedApp': true,
        coins: increment(1000), // Increased reward to 1000 for "doing everything"
        xp: increment(250),
        medals: arrayUnion('PWA_INITIATE')
      });
      await refreshUser();
      console.log('Install reward claimed! 1000 coins added.');
    } catch (err) {
      console.error('Error claiming install reward:', err);
    }
  };

  const handleAction = async (action: 'install' | 'continue' | 'ios-guide') => {
    localStorage.setItem('installPromptLastShown', Date.now().toString());
    
    if (action === 'install' && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('installPromptDismissed', 'true');
        // No need to claim here, appinstalled event will fire
      }
      setDeferredPrompt(null);
      setIsVisible(false);
    } else if (action === 'ios-guide') {
      // Guide is shown in-place
    } else if (action === 'continue') {
      setIsMinimized(true);
      setIsVisible(false);
    }
  };

  // Don't show if already rewarded and in standalone
  if (currentUser?.rewards?.installedApp && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone)) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {installedSuccessfully && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-vibe-bg/90 backdrop-blur-3xl" />
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] mb-6 animate-bounce">
                <Gift className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Instalação Concluída!</h2>
              <p className="text-vibe-neon-blue font-bold">+1000 COINS ADICIONADOS</p>
              <p className="text-vibe-muted text-sm mt-4 uppercase font-black">Bem-vindo à experiência definitiva</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsVisible(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm vibe-card p-0 relative overflow-hidden group shadow-[0_0_80px_rgba(0,242,255,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Visual Header */}
              <div className="relative h-48 overflow-hidden bg-vibe-bg">
                <div className="absolute inset-0 gaming-grid opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-vibe-bg to-transparent" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative">
                      <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-vibe-gradient rounded-[32px] p-0.5 shadow-[0_0_50px_rgba(0,242,255,0.4)]"
                      >
                        <div className="w-full h-full bg-vibe-bg rounded-[32px] flex items-center justify-center border-4 border-vibe-bg">
                          <Smartphone className="w-12 h-12 text-white" />
                        </div>
                      </motion.div>
                      
                      <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -top-4 -right-12 bg-yellow-500 text-black font-black text-[12px] px-4 py-2 rounded-full shadow-lg flex items-center space-x-1 border-2 border-vibe-bg rotate-12"
                      >
                        <Gift className="w-4 h-4" />
                        <span>+1000 COINS</span>
                      </motion.div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 pt-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-vibe-neon-blue font-black text-[10px] uppercase tracking-[0.3em]">Instalação Sugerida</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
                
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
                  Playsi App
                </h2>
                <p className="text-vibe-muted text-[10px] font-bold uppercase mb-6 tracking-wider">
                  Instale para o acesso completo e ganhe bônus
                </p>
                
                {isIOS ? (
                  <div className="bg-white/5 p-6 rounded-2xl border border-vibe-border mb-8 text-left space-y-4">
                    <p className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-widest text-center mb-2">Tutorial iOS (iPhone/iPad)</p>
                    <div className="flex items-center space-x-3 text-white text-xs">
                      <div className="w-6 h-6 rounded-lg bg-vibe-border flex items-center justify-center text-[10px] font-bold">1</div>
                      <p>Toque no ícone de <span className="text-vibe-neon-blue font-bold">Compartilhar</span> na barra de ferramentas do Safari.</p>
                    </div>
                    <div className="flex items-center space-x-3 text-white text-xs">
                      <div className="w-6 h-6 rounded-lg bg-vibe-border flex items-center justify-center text-[10px] font-bold">2</div>
                      <p>Role para baixo e selecione <span className="text-vibe-neon-blue font-bold">"Adicionar à Tela de Início"</span>.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-8">
                      <BenefitItem icon={<Zap className="w-3 h-3" />} label="Carregamento Instantâneo" />
                      <BenefitItem icon={<Bell className="w-3 h-3" />} label="Notificações Push" />
                      <BenefitItem icon={<Star className="w-3 h-3" />} label="Badge PWA Initiate" />
                      <BenefitItem icon={<Download className="w-3 h-3" />} label="Experiência Full" />
                  </div>
                )}

                <div className="w-full space-y-4">
                  {!isIOS && (
                    <button
                      onClick={() => handleAction('install')}
                      disabled={!deferredPrompt}
                      className={cn(
                        "w-full py-5 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all relative group/btn",
                        deferredPrompt ? "bg-vibe-gradient shadow-vibe-neon-blue/20 hover:scale-[1.02] active:scale-95" : "bg-gray-800 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Download className="w-5 h-5 group-hover/btn:animate-bounce" />
                        <span>Instalar Agora</span>
                      </div>
                      <span className="text-[7px] mt-1 opacity-70 block uppercase tracking-widest">Resgate 1000 Coins Imediatamente</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAction('continue')}
                    className="w-full py-2 text-vibe-muted font-bold uppercase text-[9px] tracking-widest flex items-center justify-center space-x-1 hover:text-white transition-colors"
                  >
                    <span>Continuar no navegador (sem bônus)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Mini Prompt if not installed and not currently showing full prompt */}
      {!isVisible && !installedSuccessfully && !isMinimized && !deferredPrompt && isIOS && (
         <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none"
         >
           <div 
            onClick={() => setIsVisible(true)}
            className="w-full pointer-events-auto bg-vibe-bg/80 backdrop-blur-xl border border-vibe-border p-4 rounded-2xl flex items-center justify-between shadow-2xl"
           >
             <div className="flex items-center space-x-3">
               <div className="w-10 h-10 bg-vibe-gradient rounded-xl flex items-center justify-center">
                 <Smartphone className="w-5 h-5 text-white" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Instale no iPhone</p>
                  <p className="text-[8px] font-bold text-yellow-500 uppercase">+1000 COINS DE BÔNUS</p>
               </div>
             </div>
             <button className="bg-white/10 px-4 py-2 rounded-lg text-[10px] font-black text-white uppercase">Ver Como</button>
           </div>
         </motion.div>
      )}

      {!isVisible && !installedSuccessfully && deferredPrompt && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className={cn(
            "fixed z-50 pointer-events-none transition-all duration-500",
            isMinimized ? "bottom-24 right-4" : "bottom-24 left-4 right-4"
          )}
        >
          <div 
            onClick={() => setIsVisible(true)}
            className={cn(
              "pointer-events-auto cursor-pointer bg-vibe-bg/90 backdrop-blur-xl border border-vibe-neon-blue/30 rounded-2xl flex items-center shadow-[0_0_30px_rgba(0,242,255,0.15)]",
              isMinimized ? "p-3 w-14 h-14 justify-center" : "p-4 w-full justify-between"
            )}
          >
            {isMinimized ? (
               <div className="relative">
                 <Download className="w-6 h-6 text-vibe-neon-blue animate-bounce" />
                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
               </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-vibe-gradient rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">App Instalável</p>
                      <p className="text-[8px] font-bold text-yellow-500 uppercase">Resgate 1000 Coins AGORA</p>
                  </div>
                </div>
                <button className="bg-vibe-neon-blue px-4 py-2 rounded-lg text-[10px] font-black text-vibe-bg uppercase shadow-lg shadow-vibe-neon-blue/20">Instalar</button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}

function BenefitItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-xl border border-white/5">
      <div className="text-vibe-neon-blue">{icon}</div>
      <span className="text-[8px] font-black text-vibe-muted uppercase tracking-widest leading-none text-left">{label}</span>
    </div>
  );
}
