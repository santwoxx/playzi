import React from 'react';
import { Video, Phone } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { cn } from '../lib/utils';

interface Props {
  receiverId: string;
  type?: 'voice' | 'video';
  className?: string;
  variant?: 'solid' | 'ghost';
}

export default function CallButton({ receiverId, type = 'video', className, variant = 'solid' }: Props) {
  const { startCall } = useCall();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    startCall(receiverId, type);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center transition-all active:scale-95",
        variant === 'solid' 
          ? "bg-vibe-gradient text-white shadow-lg shadow-vibe-neon-blue/20 rounded-xl px-4 py-2 space-x-2" 
          : "text-vibe-neon-blue hover:bg-vibe-neon-blue/10 p-2 rounded-xl",
        className
      )}
    >
      {type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
      {variant === 'solid' && (
        <span className="text-[10px] font-black uppercase tracking-widest">
          {type === 'video' ? 'Vídeo' : 'Voz'}
        </span>
      )}
    </button>
  );
}
