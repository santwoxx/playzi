import { useState } from 'react';
import { cn } from '../lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackText?: string;
  onClick?: () => void;
  status?: 'online' | 'away' | 'playing' | 'searching' | 'offline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ src, alt = 'Avatar', className, fallbackText = 'U', onClick, status, size = 'md' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Generate initials
  const initials = fallbackText
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-[14px]',
    lg: 'w-16 h-16 text-[18px]',
    xl: 'w-24 h-24 text-[24px]',
  };

  const statusColors = {
    online: 'bg-green-500 shadow-[0_0_8px_#22c55e]',
    away: 'bg-yellow-500 shadow-[0_0_8px_#eab308]',
    playing: 'bg-vibe-neon-purple shadow-[0_0_8px_#9d00ff]',
    searching: 'bg-vibe-neon-blue shadow-[0_0_8px_#00f2ff]',
    offline: 'bg-slate-500',
  };

  const hasStatus = !!status;

  const renderFallback = () => (
    <div
      onClick={onClick}
      className={cn(
        "aspect-square rounded-full flex items-center justify-center font-black bg-gradient-to-br from-vibe-neon-blue/20 via-vibe-neon-purple/10 to-vibe-neon-pink/20 border border-vibe-neon-blue/30 text-vibe-neon-blue uppercase select-none shadow-inner shrink-0",
        sizeClasses[size],
        onClick && "cursor-pointer active:scale-95 transition-transform",
        className
      )}
    >
      <span className="tracking-tighter leading-none">{initials}</span>
    </div>
  );

  if (!src || hasError) {
    return (
      <div className="relative inline-block shrink-0 leading-none">
        {renderFallback()}
        {hasStatus && (
          <span className={cn("absolute bottom-0 right-0 rounded-full border-2 border-vibe-bg", 
            size === 'xs' || size === 'sm' ? 'w-2 h-2 border-[1px]' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4',
            statusColors[status]
          )} />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block shrink-0 leading-none">
      <div
        onClick={onClick}
        className={cn(
          "aspect-square rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center shrink-0",
          onClick && "cursor-pointer active:scale-95 transition-transform",
          sizeClasses[size],
          className
        )}
      >
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {hasStatus && (
        <span className={cn("absolute bottom-0 right-0 rounded-full border-2 border-vibe-bg", 
          size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5 border-[1px]' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4',
          statusColors[status]
        )} />
      )}
    </div>
  );
}
