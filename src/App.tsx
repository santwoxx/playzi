import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import NotificationBar from './components/NotificationBar';
// Components for lazy loading
const QuickInbox = lazy(() => import('./components/QuickInbox'));
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CallProvider } from './contexts/CallContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load pages for better performance
const Feed = lazy(() => import('./pages/Feed'));
const Profile = lazy(() => import('./pages/Profile'));
const ChatList = lazy(() => import('./pages/ChatList'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const Login = lazy(() => import('./pages/Login'));
const Users = lazy(() => import('./pages/Users'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityRoom = lazy(() => import('./pages/CommunityRoom'));
const Arcade = lazy(() => import('./pages/Arcade'));
const GlobalChat = lazy(() => import('./pages/GlobalChat'));
const MinigameRoom = lazy(() => import('./pages/MinigameRoom'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Explore = lazy(() => import('./pages/Explore'));

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
      <h1 className="text-4xl font-black text-vibe-text tracking-tighter uppercase mb-2">Playsi</h1>
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-vibe-neon-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-vibe-neon-purple rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-vibe-neon-pink rounded-full animate-bounce" />
      </div>
    </motion.div>
  </div>
);

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
                   location.pathname !== '/onboarding';

  const mainTabs = ['/', '/users', '/arcade', '/profile'];
  
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
    <div className="min-h-screen bg-vibe-bg flex flex-col font-sans selection:bg-vibe-neon-blue selection:text-vibe-bg overflow-x-hidden">
      <InstallPrompt />
      <AnnouncementTicker />
      <NotificationManager />
      {showNavs && <Navbar onInboxOpen={() => setIsInboxOpen(true)} />}
      <NotificationBar />
      <QuickInbox isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />
      <main className={cn("flex-1 relative overflow-hidden", showNavs ? "pt-[calc(4rem+env(safe-area-inset-top,12px))]" : "pt-0")}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "linear" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  const threshold = 100;
                  if (info.offset.x < -threshold) handleSwipe('left');
                  else if (info.offset.x > threshold) handleSwipe('right');
                }}
                className="h-full touch-pan-y"
              >
                <Routes location={location}>
                  <Route path="/" element={<Feed />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/arcade" element={<Arcade />} />
                  <Route path="/arcade/:gameId" element={<MinigameRoom />} />
                  <Route path="/chat/global" element={<GlobalChat />} />
                  <Route path="/rankings" element={<Rankings />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/communities/:categoryId" element={<CommunityRoom />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/chat" element={<ChatList />} />
                  <Route path="/chat/:chatId" element={<ChatRoom />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/onboarding" element={<Navigate to="/" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>
      {showNavs && <BottomNav />}
    </div>
  );
}

function CommunitiesPlaceholder() {
  return (
    <div className="pt-24 px-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-black neon-text-blue mb-4 tracking-tighter">Playsi</h1>
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
