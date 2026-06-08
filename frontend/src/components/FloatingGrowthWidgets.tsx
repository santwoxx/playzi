import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Users, X, Share2, Copy, Check, Award, Coins, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function FloatingGrowthWidgets() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [showInviteOverlay, setShowInviteOverlay] = useState(false);
  const [copied, setCopied] = useState(false);

  const isChatPage = location.pathname.includes('/chat');
  const parsedPath = location.pathname.toLowerCase();
  const shouldHide = 
    isChatPage || 
    parsedPath.includes('/watch/') || 
    parsedPath.includes('/communities/') || 
    parsedPath.includes('/comunidades/') ||
    parsedPath.includes('/arcade/');

  if (shouldHide) {
    return null;
  }

  const referralLink = `https://playzi-snowy.vercel.app/login?ref=${currentUser?.referralCode || currentUser?.uid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rewards = [
    { goal: 5, label: "Selo VIP", icon: <Award className="w-5 h-5 text-vibe-neon-blue" /> },
    { goal: 10, label: "Coins Bonus", icon: <Coins className="w-5 h-5 text-yellow-500" /> },
    { goal: 20, label: "Embaixador Elite", icon: <ShieldAlert className="w-5 h-5 text-red-500" /> }
  ];

  const currentCount = currentUser?.referralCount || 0;

  return (
    <>
      <div className="fixed bottom-24 right-5 z-[80] hidden md:flex flex-col space-y-4 lg:bottom-10 lg:right-10">
        {/* Global Chat Bubble */}
        {!isChatPage && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/chat/global')}
            className="w-14 h-14 bg-vibe-neon-blue rounded-full shadow-[0_0_30px_rgba(0,242,255,0.4)] flex items-center justify-center text-vibe-bg relative group"
          >
            <MessageCircle className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
            
            {/* Tooltip */}
            <div className="absolute right-16 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Chat Global Ao Vivo</span>
            </div>
          </motion.button>
        )}

        {/* Squad Invite Bubble */}
        <motion.button
          initial={{ scale: 0, rotate: 20 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowInviteOverlay(true)}
          className="w-14 h-14 bg-vibe-gradient rounded-full shadow-[0_0_30px_rgba(255,0,255,0.3)] flex items-center justify-center text-white relative group"
        >
          <Users className="w-7 h-7" />
          <div className="absolute -top-6 -left-12 bg-vibe-neon-pink text-white text-[8px] font-black px-2 py-1 rounded-lg animate-bounce shadow-glow-pink whitespace-nowrap">
            GANHE COINS E VIP! 💎
          </div>
        </motion.button>
      </div>

      {/* Invite Overlay */}
      <AnimatePresence>
        {showInviteOverlay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteOverlay(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="w-full max-w-sm vibe-card overflow-hidden border-2 border-vibe-neon-blue/40 shadow-[0_0_100px_rgba(0,242,255,0.2)]"
            >
              <div className="p-8 relative">
                <div className="absolute top-4 right-4">
                  <button onClick={() => setShowInviteOverlay(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-vibe-muted" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 bg-vibe-neon-blue/10 rounded-[32px] flex items-center justify-center mb-6 border-2 border-vibe-neon-blue/20 shadow-glow-blue relative">
                     <Users className="w-10 h-10 text-vibe-neon-blue" />
                     <div className="absolute -top-2 -right-2 bg-vibe-neon-pink p-1.5 rounded-xl">
                        <Zap className="w-4 h-4 text-white animate-pulse" />
                     </div>
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Squad de Elite</h2>
                  <p className="text-xs font-bold text-vibe-muted uppercase tracking-widest">Convide amigos e desbloqueie o nível VIP gratuitamente!</p>
                </div>

                {/* Milestones */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {rewards.map((r, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 border transition-all duration-500",
                      currentCount >= r.goal 
                        ? "bg-vibe-neon-blue/10 border-vibe-neon-blue shadow-glow-blue scale-105" 
                        : "bg-black/40 border-white/5 opacity-50"
                    )}>
                      {r.icon}
                      <span className="text-[8px] font-black text-white uppercase text-center leading-tight">{r.label}</span>
                      <div className="w-full bg-white/5 h-1 rounded-full p-[1px]">
                         <div 
                           className="h-full bg-vibe-neon-blue rounded-full transition-all"
                           style={{ width: `${Math.min(100, (currentCount / r.goal) * 100)}%` }}
                         />
                      </div>
                      <span className="text-[7px] font-bold text-vibe-muted uppercase italic">Meta: {r.goal}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Seu Total:</span>
                      <span className="text-xl font-black text-vibe-neon-blue italic">{currentCount} <span className="text-[10px]">CONVITES</span></span>
                   </div>

                   <div className="p-4 bg-black/60 rounded-2xl border border-white/5 flex items-center justify-between group">
                      <div className="overflow-hidden mr-4">
                        <p className="text-[9px] font-mono text-vibe-muted truncate">{referralLink}</p>
                      </div>
                      <button 
                        onClick={handleCopy}
                        className={cn(
                          "shrink-0 p-3 rounded-xl transition-all active:scale-95",
                          copied ? "bg-green-500 text-white" : "bg-vibe-neon-blue text-vibe-bg shadow-glow-blue"
                        )}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>

                   <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Playzi - Seu novo app de gamers',
                          text: 'Venha fazer parte do meu squad na Playzi!',
                          url: referralLink,
                        });
                      } else {
                        handleCopy();
                      }
                    }}
                    className="w-full py-4 bg-vibe-gradient text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center space-x-3"
                   >
                     <Share2 className="w-5 h-5" />
                     <span>Compartilhar Squad</span>
                   </button>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 text-center">
                 <p className="text-[8px] font-black text-vibe-muted uppercase tracking-[0.3em]">Convites legítimos garantem XP bônus permanentemente!</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
