import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize2, User, Zap, Star } from 'lucide-react';
import { Call } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  call: Call;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteUsers: any[];
  onEnd: () => void;
}

export default function CallScreen({ call, localStream, remoteStream, remoteUsers, onEnd }: Props) {
  const { currentUser } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // For Agora Audio/Video
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        user.audioTrack.play();
      }
      if (user.videoTrack && remoteVideoRef.current) {
        user.videoTrack.play(remoteVideoRef.current);
      }
    });
  }, [remoteUsers]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !micOn);
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !videoOn);
      setVideoOn(!videoOn);
    }
  };

  const isVideoCall = call.type === 'video';

  if (isMinimized) {
    return (
      <motion.div 
        layoutId="call-screen"
        className="fixed bottom-24 right-4 z-[10001] w-32 h-48 bg-black/80 rounded-2xl border border-vibe-neon-blue shadow-2xl overflow-hidden cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <video 
           ref={remoteVideoRef} 
           autoPlay 
           playsInline 
           className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 flex items-center space-x-1">
           <Zap className="w-2 h-2 text-vibe-neon-blue fill-vibe-neon-blue" />
           <span className="text-[6px] font-black text-white uppercase tracking-widest">LIVE</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layoutId="call-screen"
      className="fixed inset-0 z-[10001] bg-vibe-bg flex flex-col"
    >
      {/* Remote View */}
      <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
        {isVideoCall && remoteStream ? (
          <video 
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-vibe-bg shadow-inner">
            <div className="w-48 h-48 bg-vibe-gradient p-1 rounded-full animate-pulse-neon shadow-[0_0_60px_rgba(0,242,255,0.4)]">
              <div className="w-full h-full bg-vibe-bg rounded-full flex items-center justify-center">
                <User className="w-24 h-24 text-vibe-neon-blue" />
              </div>
            </div>
            <div className="text-center">
               <p className="text-white font-black text-xl uppercase tracking-tighter mb-1">
                 {call.callerId === currentUser?.uid ? 'Chamando...' : 'Em Chamada'}
               </p>
               <p className="text-vibe-muted font-bold text-[10px] uppercase tracking-[0.4em]">
                 {isVideoCall ? 'WebRTC HD Video' : 'Criptografia de Ponta a Ponta'}
               </p>
            </div>
          </div>
        )}

        {/* Local Video Overlay */}
        {isVideoCall && (
          <div className="absolute top-10 right-6 w-32 h-48 bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
             <video 
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
             />
             {!videoOn && (
               <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-white/20" />
               </div>
             )}
          </div>
        )}

        {/* Floating Stats */}
        <div className="absolute top-10 left-6 flex items-center space-x-3">
           <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 flex items-center space-x-2">
              <div className="w-2 h-2 bg-vibe-neon-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(0,242,255,1)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Estável (24ms)</span>
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#0D0E12] border-t border-white/5 px-8 pt-6 pb-12 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
         <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-vibe-gradient rounded-xl p-[1px]">
                     <div className="w-full h-full bg-vibe-bg rounded-xl flex items-center justify-center text-[10px] font-black text-white">
                        HD
                     </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-white font-black text-sm uppercase tracking-tighter">Dual Channel</span>
                     <span className="text-vibe-muted font-bold text-[8px] uppercase tracking-widest">Enviando Vídeo 1080p</span>
                  </div>
               </div>
               
               <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-3 bg-white/5 rounded-xl text-vibe-muted hover:text-white transition-colors"
               >
                  <Minimize2 className="w-5 h-5" />
               </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
               <ControlCircle icon={micOn ? <Mic /> : <MicOff />} active={micOn} onClick={toggleMic} />
               <ControlCircle icon={videoOn ? <Video /> : <VideoOff />} active={videoOn} onClick={toggleVideo} />
               <ControlCircle icon={<Star />} active={false} label="Efeitos" />
               <button 
                  onClick={onEnd}
                  className="bg-red-500 text-white rounded-3xl flex flex-col items-center justify-center space-y-1 shadow-[0_0_30px_rgba(239,68,68,0.3)] active:scale-90 transition-all py-4"
               >
                  <PhoneOff className="w-6 h-6" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

function ControlCircle({ icon, active, onClick, label }: any) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <button 
        onClick={onClick}
        className={cn(
          "w-full aspect-square rounded-3xl flex items-center justify-center border-2 transition-all active:scale-90",
          active 
            ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/30 text-vibe-neon-blue" 
            : "bg-white/5 border-transparent text-vibe-muted"
        )}
      >
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </button>
      {label && <span className="text-[8px] font-black text-vibe-muted uppercase tracking-widest">{label}</span>}
    </div>
  );
}
