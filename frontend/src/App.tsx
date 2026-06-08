import { useState, lazy, Suspense, memo, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import NotificationBar from './components/NotificationBar';
// Components for lazy loading
const QuickInbox = lazy(() => import('./components/QuickInbox'));
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home, Search, PlayCircle, Gamepad2, User, Heart, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { CallProvider } from './contexts/CallContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load pages for better performance
const Feed = lazy(() => import('./pages/Feed'));
const Profile = lazy(() => import('./pages/Profile'));
const ChatList = lazy(() => import('./pages/ChatList'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const Login = lazy(() => import('./pages/Login'));
const UsersPage = lazy(() => import('./pages/Users'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityRoom = lazy(() => import('./pages/CommunityRoom'));
const CommunityLanding = lazy(() => import('./pages/CommunityLanding'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Arcade = lazy(() => import('./pages/Arcade'));
const GlobalChat = lazy(() => import('./pages/GlobalChat'));
const MinigameRoom = lazy(() => import('./pages/MinigameRoom'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Explore = lazy(() => import('./pages/Explore'));
const Reels = lazy(() => import('./pages/Reels'));
const Encontros = lazy(() => import('./pages/Encontros'));
const Guidelines = lazy(() => import('./pages/Guidelines'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PlayNow = lazy(() => import('./pages/PlayNow'));
const WatchParty = lazy(() => import('./pages/WatchParty'));
const BrowserSync = lazy(() => import('./pages/BrowserSync'));
const YoutubeHub = lazy(() => import('./pages/YoutubeHub'));

import InstallPrompt from './components/InstallPrompt';
import NotificationManager from './components/NotificationManager';
import AnnouncementTicker from './components/AnnouncementTicker';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';

// Splash Screen Style Loader
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-vibe-bg relative overflow-hidden">
    <div className="absolute inset-0 gaming-grid opacity-20" />
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="w-24 h-24 bg-vibe-gradient rounded-[32px] p-0.5 shadow-[0_0_50px_rgba(0,242,255,0.3)] mb-8 animate-pulse-neon">
        <div className="w-full h-full bg-vibe-bg rounded-[32px] flex items-center justify-center border-4 border-vibe-bg">
           <img src="https://i.ibb.co/svpJKdbx/playsi-logo.png" className="w-12 h-12" alt="Logo" />
        </div>
      </div>
      <h1 className="text-4xl font-black text-vibe-text tracking-tighter uppercase mb-2">Playzi</h1>
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-vibe-neon-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-vibe-neon-purple rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-vibe-neon-pink rounded-full animate-bounce" />
      </div>
    </motion.div>
  </div>
);

import FloatingGrowthWidgets from './components/FloatingGrowthWidgets';
import { Shield, Sparkles, MessageCircle as GlobalChatIcon, Share2 } from 'lucide-react';

// Sidebar component for desktop
const DesktopSidebar = memo(({ onInboxOpen }: { onInboxOpen: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const navItems = useMemo(() => [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Search, label: 'Bússola', path: '/explore' },
    { icon: Heart, label: 'Encontros', path: '/encontros' },
    { icon: Gamepad2, label: 'Jogar', path: '/jogar-agora' },
    { icon: MessageSquare, label: 'Directs', path: '/chat', action: onInboxOpen },
    { icon: PlayCircle, label: 'Playzi Sync', path: '/watch' },
    { icon: UsersIcon, label: 'Grupos', path: '/communities' },
    { icon: User, label: 'Meu Perfil', path: '/profile' },
  ], [onInboxOpen]);

  const growthItems = useMemo(() => [
    { icon: GlobalChatIcon, label: 'Global Chat', path: '/chat/global', color: 'text-vibe-neon-blue' },
    { icon: Share2, label: 'Convidar Squad', path: '/profile', color: 'text-vibe-neon-pink' }
  ], []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-black p-6 z-50">
      <Link to="/" className="mb-10 flex items-center space-x-3 group">
        <img src="https://i.ibb.co/svpJKdbx/playsi-logo.png" className="w-8 h-8 group-hover:scale-105 transition-transform" alt="Playzi" />
        <h1 className="text-2xl font-black tracking-tighter text-white">Playzi</h1>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group text-left",
                  active ? "bg-white/10 text-white" : "text-vibe-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-6 h-6", active ? "text-vibe-neon-blue" : "group-hover:scale-110 transition-transform")} />
                <span className={cn("font-bold text-xs uppercase tracking-widest", active ? "opacity-100" : "opacity-80")}>
                  {item.label}
                </span>
              </button>
            );
          }
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                active ? "bg-white/10 text-white" : "text-vibe-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-6 h-6", active ? "text-vibe-neon-blue" : "group-hover:scale-110 transition-transform")} />
              <span className={cn("font-bold text-xs uppercase tracking-widest", active ? "opacity-100" : "opacity-80")}>
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="pt-6 pb-2">
           <p className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] ml-4 mb-4 opacity-50">Social & Crescimento</p>
           <div className="space-y-1">
              {growthItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                      "w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5",
                      active ? "bg-white/10 text-white" : "text-vibe-muted"
                    )}
                  >
                    <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110 animate-pulse", item.color)} />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
           </div>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <Link 
          to="/profile"
          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left block"
        >
          <img src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.username}`} className="w-10 h-10 rounded-full border-2 border-white/10" alt="Me" />
          <div className="flex-1 overflow-hidden">
            <p className="text-white font-bold text-xs truncate uppercase tracking-tighter">{currentUser?.nickname || currentUser?.displayName}</p>
            <p className="text-vibe-muted text-[10px] font-black uppercase tracking-widest">Ver Perfil</p>
          </div>
        </Link>
      </div>
    </aside>
  );
});


function AuthenticatedApp() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  if (loading) return <PageLoader />;

  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <InstallPrompt />
        <Login />
      </Suspense>
    );
  }

  // Handle Onboarding logic
  if (currentUser.onboarded === false) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/onboarding" />} />
        </Routes>
      </Suspense>
    );
  }

  const showNavs = !location.pathname.startsWith('/chat/') && 
                   !location.pathname.startsWith('/arcade/') && 
                   location.pathname !== '/create' &&
                   location.pathname !== '/reels' &&
                   location.pathname !== '/onboarding';

  const mainTabs = ['/', '/explore', '/watch', '/encontros', '/jogar-agora', '/profile'];
  
  const handleSwipe = (direction: 'left' | 'right') => {
    if (!showNavs) return;
    
    const currentIndex = mainTabs.indexOf(location.pathname);
    if (currentIndex === -1) return; // Only swipe on main tabs
    
    if (direction === 'left' && currentIndex < mainTabs.length - 1) {
      navigate(mainTabs[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      navigate(mainTabs[currentIndex - 1]);
    }
  };

  return (
    <div className="bg-vibe-bg font-sans selection:bg-vibe-neon-blue selection:text-vibe-bg">
      <InstallPrompt />
      <AnnouncementTicker />
      <NotificationManager />
      {showNavs && <DesktopSidebar onInboxOpen={() => setIsInboxOpen(true)} />}
      <div className="flex flex-col items-center">
        {showNavs && <div className="lg:hidden w-full"><Navbar onInboxOpen={() => setIsInboxOpen(true)} /></div>}
        <NotificationBar />
        <QuickInbox isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />
        <FloatingGrowthWidgets />
        <main className={cn(
          "w-full relative", 
          location.pathname.startsWith('/watch') ? "max-w-none lg:pl-64" : "max-w-2xl",
          showNavs ? "pt-[calc(4rem+env(safe-area-inset-top,12px))] pb-[calc(64px+env(safe-area-inset-bottom,16px))] lg:pt-0 lg:pb-0" : "pt-0 pb-0"
        )}>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes location={location}>
                <Route path="/" element={<Feed />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/encontros" element={<Encontros />} />
                <Route path="/jogar-agora" element={<PlayNow />} />
                <Route path="/watch" element={<WatchParty />} />
                <Route path="/watch/:roomId" element={<WatchParty />} />
                <Route path="/watch/browser" element={<BrowserSync />} />
                <Route path="/watch/browser/:roomId" element={<BrowserSync />} />
                <Route path="/watch/youtube" element={<YoutubeHub />} />
                <Route path="/watch/youtube/:roomId" element={<YoutubeHub />} />
                <Route path="/arcade" element={<Arcade />} />
                <Route path="/diretrizes" element={<Guidelines />} />
                <Route path="/arcade/:gameId" element={<MinigameRoom />} />
                <Route path="/chat/global" element={<GlobalChat />} />
                <Route path="/global-chat" element={<Navigate to="/chat/global" replace />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:categoryId" element={<CommunityRoom />} />
                <Route path="/comunidades/:slug" element={<CommunityLanding />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/chat" element={<ChatList />} />
                <Route path="/chat/:chatId" element={<ChatRoom />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/onboarding" element={<Navigate to="/" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <div className="lg:hidden">
          {showNavs && <BottomNav />}
        </div>
      </div>
    </div>
  );
}

function CommunitiesPlaceholder() {
  return (
    <div className="pt-24 px-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-black neon-text-blue mb-4 tracking-tighter">Playzi</h1>
      <p className="text-vibe-muted font-bold text-sm uppercase tracking-widest bg-vibe-card p-6 rounded-2xl border border-vibe-border">
        Em breve você poderá entrar em comunidades exclusivas de cada jogo! 🎮
      </p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
