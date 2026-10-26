import { Home, Search, Heart, Gamepad2, User, PlayCircle } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { preloadRoute } from '../lib/routePreload';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Playzi Sync stays highlighted inside its rooms too (/watch/...)
  const isActive = (path: string) =>
    path === '/watch' ? location.pathname.startsWith('/watch') : location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Search, label: 'Bússola', path: '/explore' },
    { icon: PlayCircle, label: 'Sync', path: '/watch', highlight: true },
    { icon: Heart, label: 'Match', path: '/encontros' },
    { icon: Gamepad2, label: 'Jogar', path: '/jogar-agora' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/5 pb-safe-area shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto h-[64px] flex items-center justify-around px-2 relative leading-none">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
 
          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => preloadRoute(item.path)}
              onTouchStart={() => preloadRoute(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 tap-effect",
                active ? "text-white" : "text-vibe-muted hover:text-white"
              )}
            >
              <div className={cn(
                "relative p-1.5 transition-all duration-300",
                item.highlight && "rounded-xl bg-gradient-to-br from-[#FF2E93] to-vibe-neon-purple text-white shadow-[0_0_14px_rgba(255,46,147,0.45)]"
              )}>
                <Icon className={cn(
                  "w-6 h-6 transition-all duration-300",
                  active || item.highlight ? "scale-110 opacity-100" : "opacity-70 group-hover:opacity-100"
                )} />
                {item.highlight && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-vibe-bg animate-pulse" />
                )}
              </div>

              <span className={cn(
                "text-[9px] font-bold uppercase tracking-tighter mt-0.5 transition-all duration-300",
                active || item.highlight ? "opacity-100" : "opacity-0"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Ensure pb-safe-area is defined or handle inline
// I'll add a style tag or just use standard tailwind if available, but since I have index.css I'll check it again.
