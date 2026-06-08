import { Camera, Send, Heart, Moon, Sun, Globe, Search, ChevronLeft, Gamepad2, MessageSquare, PlusSquare } from 'lucide-react';
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
  const isMainTab = ['/', '/explore', '/reels', '/arcade', '/profile'].includes(location.pathname);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-16 glass-nav flex items-center justify-between px-4 z-50 border-b border-white/5 pt-safe-area h-[calc(4rem+env(safe-area-inset-top))]"
    >
      <div className="flex items-center space-x-2">
        {!isMainTab && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-all group active:scale-90 mr-1"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        <div 
          className="cursor-pointer hover:scale-105 transition-transform flex items-center shrink-0" 
          onClick={() => navigate('/')}
        >
          <img src={APP_LOGO} alt="Playzi" className="h-8 w-auto object-contain brightness-110" referrerPolicy="no-referrer" />
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {isMainTab && (
          <button 
            onClick={() => navigate('/create')}
            className="p-2 hover:bg-white/5 rounded-xl transition-all group active:scale-90"
            title="Novo Post"
          >
            <PlusSquare className="w-6 h-6 text-white opacity-90" />
          </button>
        )}

        <button 
          onClick={() => navigate('/notifications')}
          className={cn(
            "p-2 rounded-xl relative group transition-all active:scale-90",
            isActive('/notifications') ? "bg-vibe-neon-pink/10" : "hover:bg-white/5"
          )}
        >
          <Heart className={cn(
            "w-6 h-6 transition-all",
            isActive('/notifications') ? "text-vibe-neon-pink fill-vibe-neon-pink" : "text-white opacity-90"
          )} />
          <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-vibe-neon-pink rounded-full border border-vibe-bg" />
        </button>

        <button 
          className="p-2 hover:bg-white/5 rounded-xl transition-all group active:scale-90"
          onClick={onInboxOpen}
        >
          <MessageSquare className="w-6 h-6 text-white opacity-90 hover:text-vibe-neon-blue transition-colors" />
        </button>
      </div>
    </motion.nav>
  );
}
