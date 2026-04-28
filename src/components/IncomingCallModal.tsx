import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, User, Video, Mic } from 'lucide-react';
import { Call } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  call: Call;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ call, onAccept, onReject }: Props) {
  const [callerName, setCallerName] = useState('Gamer');
  const [callerPhoto, setCallerPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaller = async () => {
      const userDoc = await getDoc(doc(db, 'users', call.callerId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCallerName(data.displayName || data.nickname || 'Gamer');
        setCallerPhoto(data.photoURL || null);
      }
    };
    fetchCaller();
  }, [call.callerId]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-vibe-bg border-4 border-vibe-neon-blue/30 rounded-[40px] p-8 relative z-10 text-center shadow-[0_0_80px_rgba(0,242,255,0.4)] overflow-hidden"
      >
        <div className="absolute inset-0 gaming-grid opacity-10 pointer-events-none" />
        
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-vibe-gradient p-1 shadow-[0_0_40px_rgba(0,242,255,0.3)] animate-pulse-neon">
            <div className="w-full h-full rounded-full bg-vibe-bg flex items-center justify-center border-4 border-vibe-bg overflow-hidden">
               {callerPhoto ? (
                 <img src={callerPhoto} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <User className="w-16 h-16 text-vibe-neon-blue" />
               )}
            </div>
          </div>
          
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-vibe-neon-blue text-vibe-bg px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            {call.type === 'video' ? 'VideoChamada' : 'Voz'}
          </motion.div>
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          {callerName}
        </h2>
        <p className="text-vibe-muted font-bold text-xs uppercase tracking-[0.3em] mb-12 animate-pulse">
          Chamada Entrante...
        </p>

        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={onReject}
            className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          
          <button
            onClick={onAccept}
            className="w-20 h-20 bg-vibe-gradient rounded-full flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95 shadow-[0_0_40px_rgba(0,242,255,0.4)] relative"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <Phone className="w-8 h-8 fill-current relative z-10" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
