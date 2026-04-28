import { Home, Search, PlusSquare, Gamepad2, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Busca', path: '/users' },
    { icon: PlusSquare, label: 'Criar', path: '/create', isCenter: true },
    { icon: Gamepad2, label: 'Arcade', path: '/arcade' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-vibe-border/20 pb-safe-area shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
      <div className="max-w-md mx-auto h-[80px] flex items-center justify-around px-4 relative">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
 
          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative -translate-y-6 group flex flex-col items-center tap-effect z-10"
              >
                <div className="p-4.5 bg-vibe-gradient text-white rounded-[24px] shadow-2xl shadow-vibe-neon-blue/40 transition-all duration-300 ring-4 ring-vibe-bg active:scale-90">
                  <Icon className="w-8 h-8" />
                </div>
                <span className={cn(
                  "absolute -bottom-7 text-[9px] font-black uppercase tracking-tighter text-vibe-neon-blue transition-all duration-300",
                  active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  {item.label}
                </span>
              </button>
            );
          }
 
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] h-full transition-all duration-300 tap-effect px-2 py-1",
                active ? "text-vibe-neon-blue" : "text-vibe-muted hover:text-vibe-text"
              )}
            >
              <div className="relative p-2 rounded-2xl transition-all duration-300">
                {active && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-vibe-neon-blue/10 rounded-2xl -z-10 shadow-[0_0_15px_rgba(0,242,255,0.1)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn(
                  "w-6 h-6 transition-transform duration-300", 
                  active ? "scale-110" : "opacity-70"
                )} />
              </div>
              
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-[0.1em] mt-1 transition-all duration-300",
                active ? "opacity-100 translate-y-0" : "opacity-60 translate-y-0.5"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Ensure pb-safe-area is defined or handle inline
// I'll add a style tag or just use standard tailwind if available, but since I have index.css I'll check it again.
