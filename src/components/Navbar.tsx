import { Camera, Send, Heart, Moon, Sun, Globe, Search, ChevronLeft, Gamepad2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { APP_LOGO } from '../constants/assets';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Navbar({ onInboxOpen }: { onInboxOpen: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === '/';

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-16 glass-nav flex items-center justify-between px-4 z-50 border-b border-vibe-border/50 pt-safe-area h-[calc(4rem+env(safe-area-inset-top))]"
    >
      <div className="flex items-center space-x-2">
        {!isHome && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-all group active:scale-90"
          >
            <ChevronLeft className="w-6 h-6 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors" />
          </button>
        )}
        <div 
          className="cursor-pointer hover:scale-105 transition-transform flex items-center shrink-0" 
          onClick={() => navigate('/')}
        >
          <img src={APP_LOGO} alt="Playsi" className="h-9 w-auto object-contain" referrerPolicy="no-referrer" />
        </div>
      </div>
      
      <div className="flex items-center space-x-0.5 sm:space-x-1">
        {/* Only show essential icons on mobile */}
        <button 
          onClick={toggleTheme}
          className="hidden sm:flex p-2 hover:bg-white/5 rounded-xl transition-all group"
          title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
        >
          {theme === 'light' ? (
            <Moon className="w-6 h-6 text-vibe-muted group-hover:text-vibe-neon-purple transition-colors" />
          ) : (
            <Sun className="w-6 h-6 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors" />
          )}
        </button>

        <button 
          onClick={() => navigate('/arcade')}
          className={cn(
            "p-2 rounded-xl transition-all group sm:hidden",
            isActive('/arcade') ? "bg-vibe-neon-blue/10" : "hover:bg-white/5"
          )}
        >
          <Gamepad2 className={cn(
            "w-6 h-6 transition-all",
            isActive('/arcade') ? "text-vibe-neon-blue" : "text-vibe-muted group-hover:text-vibe-neon-blue"
          )} />
        </button>

        <button 
          onClick={() => navigate('/global-chat')}
          className={cn(
            "p-2 rounded-xl transition-all group lg:flex hidden",
            isActive('/global-chat') ? "bg-vibe-neon-blue/10" : "hover:bg-white/5"
          )}
          title="Chat Global"
        >
          <Globe className={cn(
            "w-6 h-6 transition-all",
            isActive('/global-chat') ? "text-vibe-neon-blue drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" : "text-vibe-muted group-hover:text-vibe-neon-blue"
          )} />
        </button>

        <button 
          onClick={() => navigate('/notifications')}
          className={cn(
            "p-2 rounded-xl transition-all relative group",
            isActive('/notifications') ? "bg-vibe-neon-blue/10" : "hover:bg-white/5"
          )}
        >
          <Heart className={cn(
            "w-6 h-6 transition-all",
            isActive('/notifications') ? "text-vibe-neon-pink drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]" : "text-vibe-muted group-hover:text-vibe-neon-pink"
          )} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-vibe-neon-pink rounded-full border border-vibe-bg shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
        </button>

        <button 
          className="p-2 hover:bg-white/5 rounded-xl transition-all group"
          onClick={onInboxOpen}
        >
          <Send className="w-6 h-6 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors" />
        </button>
      </div>
    </motion.nav>
  );
}
