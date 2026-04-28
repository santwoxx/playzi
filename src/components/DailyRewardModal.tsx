import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Coins, X, Flame } from 'lucide-react';
import { useState } from 'react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  rewardCoins: number;
  rewardXP: number;
  onClaim: () => void;
}

export default function DailyRewardModal({ 
  isOpen, 
  onClose, 
  streak, 
  rewardCoins, 
  rewardXP, 
  onClaim 
}: DailyRewardModalProps) {
  const [isClaimed, setIsClaimed] = useState(false);

  const handleClaim = () => {
    setIsClaimed(true);
    setTimeout(() => {
      onClaim();
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vibe-bg/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-vibe-card border-2 border-vibe-neon-blue/30 rounded-[32px] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.2)]"
          >
            {/* Background Decorative */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-vibe-neon-blue/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-vibe-neon-purple/10 blur-3xl rounded-full" />

            {!isClaimed ? (
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-vibe-gradient rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-vibe-neon-blue/20 rotate-3">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-3xl font-black text-vibe-text tracking-tighter uppercase mb-2 leading-none">
                  Recompensa Diária
                </h2>
                <p className="text-vibe-muted font-bold text-[10px] uppercase tracking-widest mb-8">
                  Sua jornada gamer continua!
                </p>

                <div className="flex items-center space-x-4 mb-8">
                  <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 w-24">
                     <div className="text-vibe-neon-blue mb-1">
                        <Flame className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-black">{streak} Dias</span>
                     <span className="text-[8px] font-bold text-vibe-muted uppercase tracking-widest">Streak</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-vibe-gradient/10 rounded-2xl border border-vibe-neon-blue/20 w-24">
                     <div className="text-vibe-neon-blue mb-1">
                        <Coins className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-black">+{rewardCoins}</span>
                     <span className="text-[8px] font-bold text-vibe-muted uppercase tracking-widest">Moedas</span>
                  </div>
                </div>

                <p className="text-sm font-medium text-vibe-muted mb-8 italic">
                  "O seu par ideal pode estar a apenas uma mensagem de distância. Não desista!"
                </p>

                <button
                  onClick={handleClaim}
                  className="w-full bg-vibe-gradient text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-vibe-neon-blue/30 active:scale-95 transition-all"
                >
                  Resgatar Agora
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center text-center py-12">
                 <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: [0, 1.2, 1] }}
                   className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20"
                 >
                   <Sparkles className="w-12 h-12 text-white" />
                 </motion.div>
                 <h2 className="text-2xl font-black text-vibe-text uppercase tracking-tighter">Resgatado!</h2>
                 <p className="text-vibe-muted font-bold text-[10px] uppercase tracking-widest mt-2">XP e Moedas adicionados à sua conta</p>
              </div>
            )}

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-vibe-muted hover:text-vibe-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
